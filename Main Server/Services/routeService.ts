// @ts-nocheck
// : one service owns routes end-to-end (compute + navigate + compact).
// No separate actualPathService file. Google is always called OUTSIDE db transactions.
import crypto from 'crypto';
import { Trip, TripStop, Booking, TripLocation } from '../Models';
import { ApiErrors } from '../utils/ApiError';
import { BOOKING_STATUS, ROUTE_STATUS, MAPS } from '../config/constants';
import mapsConfig from '../config/maps';
import mapsClient from './mapsClient';
import { decode, encode, alongRouteM, simplify, haversineM } from './geo';
import { getKey, setKey } from '../config/redis';
import { REDIS_KEYS } from '../utils/redisKeys';
import auditService from './auditService';

const toNum = (v) => (v === null || v === undefined ? null : Number(v));
const hasCoords = (p) => p && p.lat !== null && p.lat !== undefined && p.lng !== null && p.lng !== undefined;

function routeHash(waypoints) {
  const coords = waypoints.map((w) => [Number(w.lat), Number(w.lng)]);
  return crypto.createHash('sha1').update(JSON.stringify(coords)).digest('hex');
}

// Ordered waypoints: origin -> driver stops -> confirmed pickups -> destination.
// : pickups sort by projection on the STORED route when ready, else by
// distance from origin. Two-pass routing would double cost for the same order.
async function buildWaypoints(trip, { includePickups = true } = {}) {
  const stops = [...((trip.stops || []).slice().sort((a, b) => a.stopOrder - b.stopOrder))];
  const points = [];
  if (hasCoords({ lat: toNum(trip.originLat), lng: toNum(trip.originLng) })) {
    points.push({ lat: toNum(trip.originLat), lng: toNum(trip.originLng), kind: 'origin' });
  }
  for (const s of stops) {
    const lat = toNum(s.lat ?? s.stopLat);
    const lng = toNum(s.lng ?? s.stopLng);
    if (lat !== null && lng !== null) points.push({ lat, lng, kind: 'stop', stopId: s.id });
  }
  if (includePickups) {
    const bookings = await Booking.findAll({
      where: { tripId: trip.id, status: BOOKING_STATUS.CONFIRMED },
      attributes: ['id', 'pickupLat', 'pickupLng'],
    });
    const pickups = bookings.filter((b) => hasCoords({ lat: toNum(b.pickupLat), lng: toNum(b.pickupLng) }))
      .map((b) => ({ lat: toNum(b.pickupLat), lng: toNum(b.pickupLng), kind: 'pickup', bookingId: b.id }));
    if (pickups.length) {
      if (trip.routeStatus === ROUTE_STATUS.READY && trip.routePolyline) {
        try {
          const route = decode(trip.routePolyline);
          pickups.forEach((p) => { p._along = alongRouteM(p.lat, p.lng, route); });
          pickups.sort((a, b) => a._along - b._along);
        } catch {
          pickups.sort((a, b) => haversineM(points[0].lat, points[0].lng, a.lat, a.lng) - haversineM(points[0].lat, points[0].lng, b.lat, b.lng));
        }
      } else if (points.length) {
        pickups.sort((a, b) => haversineM(points[0].lat, points[0].lng, a.lat, a.lng) - haversineM(points[0].lat, points[0].lng, b.lat, b.lng));
      }
    }
    // : pickups merge into the stop flow in route order, not appended.
    points.push(...pickups);
  }
  if (hasCoords({ lat: toNum(trip.destinationLat), lng: toNum(trip.destinationLng) })) {
    points.push({ lat: toNum(trip.destinationLat), lng: toNum(trip.destinationLng), kind: 'destination' });
  }
  return points;
}

// Pure compute: cache + provider, no persistence. Throws on failure.
async function resolveRoute(waypoints, { languageCode = 'ar' } = {}) {
  const pts = waypoints.filter((w) => hasCoords(w));
  if (pts.length < 2) throw ApiErrors.custom('ORIGIN_DESTINATION_REQUIRED', 422, 'ORIGIN_DESTINATION_REQUIRED');
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (haversineM(first.lat, first.lng, last.lat, last.lng) < 1000) {
    throw ApiErrors.custom('ORIGIN_DESTINATION_TOO_CLOSE', 422, 'ORIGIN_DESTINATION_TOO_CLOSE');
  }
  if (pts.length > MAPS.WAYPOINT_LIMIT) throw ApiErrors.custom('TOO_MANY_WAYPOINTS', 422, 'TOO_MANY_WAYPOINTS');
  const hash = routeHash(pts);
  try {
    const hit = await getKey(REDIS_KEYS.ROUTE(hash));
    if (hit) return { ...JSON.parse(hit), cached: true };
  } catch {
    // cache offline — compute anyway
  }
  const intermediates = pts.slice(1, -1).map(({ lat, lng }) => ({ lat, lng }));
  const out = await mapsClient.computeRoutes({ origin: first, destination: last, intermediates, languageCode });
  const result = { polyline: out.polyline, distanceM: out.distanceM, durationS: out.durationS, cached: false };
  try {
    await setKey(REDIS_KEYS.ROUTE(hash), JSON.stringify(result), mapsConfig.routeCacheTtlSeconds);
  } catch {
    // cache offline — ignore
  }
  return result;
}

// Compute + persist. Never throws: failure marks route_status=failed (O8).
async function computeTripRoute(tripId, { languageCode = 'ar' } = {}) {
  const trip = await Trip.findByPk(tripId, { include: [{ model: TripStop, as: 'stops' }] });
  if (!trip) throw ApiErrors.notFound('TRIP_NOT_FOUND');
  const waypoints = await buildWaypoints(trip);
  try {
    const route = await resolveRoute(waypoints, { languageCode });
    await trip.update({
      routePolyline: route.polyline,
      routeDistanceM: route.distanceM,
      routeDurationS: route.durationS,
      routeStatus: ROUTE_STATUS.READY,
      routeComputedAt: new Date(),
      routeVersion: Number(trip.routeVersion || 0) + 1,
    });
    await rankPickups(trip);
    auditService.track({ action: 'trip.route_computed', resourceType: 'trip', resourceId: trip.id, actorId: trip.driverId, actorType: 'driver', payload: { route_version: trip.routeVersion } });
    return { ok: true, cached: route.cached, routeVersion: trip.routeVersion };
  } catch (err) {
    await trip.update({ routeStatus: ROUTE_STATUS.FAILED });
    auditService.track({ action: 'trip.route_failed', resourceType: 'trip', resourceId: trip.id, actorId: trip.driverId, actorType: 'driver', outcome: 'failure', error: err && err.message, payload: {} });
    return { ok: false, code: (err && err.code) || 'MAPS_UNAVAILABLE' };
  }
}

// Rank confirmed bookings' pickup_order by along-track position. One place, no drift.
async function rankPickups(trip) {
  if (!trip.routePolyline) return;
  let route;
  try {
    route = decode(trip.routePolyline);
  } catch {
    return;
  }
  const bookings = await Booking.findAll({ where: { tripId: trip.id, status: BOOKING_STATUS.CONFIRMED } });
  const ranked = bookings
    .filter((b) => hasCoords({ lat: toNum(b.pickupLat), lng: toNum(b.pickupLng) }))
    .map((b) => ({ id: b.id, along: alongRouteM(toNum(b.pickupLat), toNum(b.pickupLng), route) }))
    .sort((a, b) => a.along - b.along);
  for (let i = 0; i < ranked.length; i++) {
    await Booking.update({ pickupOrder: i + 1 }, { where: { id: ranked[i].id } });
  }
}

function mapsDirUrl(points) {
  const q = (p) => `${p.lat},${p.lng}`;
  const params = new URLSearchParams({
    api: '1',
    origin: q(points[0]),
    destination: q(points[points.length - 1]),
    travelmode: 'driving',
  });
  if (points.length > 2) params.set('waypoints', points.slice(1, -1).map(q).join('|'));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

// Deep links split past ~9 waypoints (Maps URLs limit); compute never splits (rejects).
function buildNavigationLinks(waypoints) {
  const pts = waypoints.filter((w) => hasCoords(w));
  if (pts.length < 2) return { navigation_url: null, legs: [] };
  const chunks = [];
  const max = MAPS.NAV_LINK_WAYPOINT_LIMIT;
  let start = 0;
  while (start < pts.length - 1) {
    const end = Math.min(start + max + 1, pts.length - 1);
    chunks.push(pts.slice(start, end + 1));
    start = end;
  }
  const legs = chunks.map((c) => mapsDirUrl(c));
  return { navigation_url: legs[0], legs };
}

// Compact raw points into the trip's recorded path. Idempotent — safe to retry.
async function compactActualPath(tripId, { occurrenceDate = null } = {}) {
  const where = { tripId };
  if (occurrenceDate) where.occurrenceDate = occurrenceDate;
  const rows = await TripLocation.findAll({ where, order: [['createdat', 'ASC']], attributes: ['lat', 'lng', 'speed', 'createdat'] });
  const pts = [];
  for (const r of rows) {
    const lat = toNum(r.lat);
    const lng = toNum(r.lng);
    if (lat === null || lng === null) continue;
    const prev = pts[pts.length - 1];
    if (prev && prev[0] === lat && prev[1] === lng) continue;
    // : drop teleport outliers (>300 km/h implied); no accuracy column exists.
    if (prev && prev[3]) {
      const dt = (new Date(r.createdat) - new Date(prev[3])) / 1000;
      if (dt > 0 && haversineM(prev[0], prev[1], lat, lng) / dt > 83) continue;
    }
    pts.push([lat, lng, 0, r.createdat]);
  }
  if (pts.length < 2) return { ok: false, reason: 'NOT_ENOUGH_POINTS' };
  const coords = pts.map(([lat, lng]) => [lat, lng]);
  const simple = simplify(coords, mapsConfig.actualPathSimplifyToleranceM);
  let distanceM = 0;
  for (let i = 1; i < coords.length; i++) distanceM += haversineM(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1]);
  const durationS = Math.max(0, Math.round((new Date(pts[pts.length - 1][3]) - new Date(pts[0][3])) / 1000));
  await Trip.update(
    { actualPathPolyline: encode(simple), actualDistanceM: Math.round(distanceM), actualDurationS: durationS },
    { where: { id: tripId } },
  );
  return { ok: true, points: simple.length, distanceM: Math.round(distanceM), durationS };
}

module.exports = { buildWaypoints, resolveRoute, computeTripRoute, rankPickups, buildNavigationLinks, compactActualPath };
export { buildWaypoints, resolveRoute, computeTripRoute, rankPickups, buildNavigationLinks, compactActualPath };
export default module.exports;
