// @ts-nocheck
import crypto from 'crypto';
import { Trip } from '../Models';
import { decode, encode, alongRouteM, haversineM } from './geo';
import mapsConfig from '../config/maps';
import mapsClient from './mapsClient';
import { maskPhone } from '../utils/masking';

const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';
const MAX_WAYPOINTS = 25;

function toNum(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function coord(lat, lng) {
  const a = toNum(lat);
  const b = toNum(lng);
  return a === null || b === null ? null : { lat: a, lng: b };
}

function hashPoints(points) {
  return crypto
    .createHash('sha1')
    .update(JSON.stringify(points.map((p) => [p.lat, p.lng])))
    .digest('hex');
}

function nearestOrder(points, start) {
  const remaining = [...points];
  const ordered = [];
  let current = start;
  while (remaining.length > 0) {
    let best = 0;
    let bestDistance = Infinity;
    for (let i = 0; i < remaining.length; i += 1) {
      const d = haversineM(
        current.lat,
        current.lng,
        remaining[i].lat,
        remaining[i].lng,
      );
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    }
    const next = remaining.splice(best, 1)[0];
    ordered.push(next);
    current = next;
  }
  return ordered;
}

function routeOrder(points, origin, baseRoute) {
  if (baseRoute.length >= 2) {
    return points
      .map((point) => ({
        ...point,
        _along: alongRouteM(point.lat, point.lng, baseRoute),
      }))
      .sort((a, b) => a._along - b._along)
      .map(({ _along, ...point }) => point);
  }
  return nearestOrder(points, origin);
}

async function fetchOsrmRoute(points) {
  const coords = points
    .slice(0, MAX_WAYPOINTS)
    .map((p) => `${p.lng},${p.lat}`)
    .join(';');
  const url = `${OSRM_URL}/${coords}?overview=full&geometries=geojson&steps=false`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`osrm http ${res.status}`);
    const data = await res.json();
    const route = data.routes && data.routes[0];
    if (!route || !route.geometry || !Array.isArray(route.geometry.coordinates)) {
      throw new Error('osrm route missing');
    }
    const decoded = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    return {
      polyline: encode(decoded),
      distanceM: Number(route.distance) || 0,
      durationS: Number(route.duration) || 0,
      source: 'osrm',
    };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchGoogleRoute(origin, destination, intermediates) {
  const out = await mapsClient.computeRoutes({
    origin,
    destination,
    intermediates,
  });
  return {
    polyline: out.polyline,
    distanceM: out.distanceM,
    durationS: out.durationS,
    source: 'google',
  };
}

/**
 * Build a display route that follows roads and visits every map point in
 * order: origin -> ordered stops/pickups -> destination. The stored route is
 * often the deterministic mock (a straight 3-point corridor), so this service
 * computes a fresh road route for the dashboard map and caches it.
 */
async function buildTripMapRoute(trip) {
  const stops = (trip.stops || []).slice().sort(
    (a, b) => Number(a.stopOrder ?? 0) - Number(b.stopOrder ?? 0),
  );
  const bookings = (trip.bookings || []).filter(
    (booking) => booking.status !== 'cancelled',
  );

  let baseRoute = [];
  try {
    if (trip.routePolyline) baseRoute = decode(trip.routePolyline);
  } catch {
    baseRoute = [];
  }

  let origin = coord(trip.originLat, trip.originLng);
  let destination = coord(trip.destinationLat, trip.destinationLng);
  if (!origin && baseRoute.length > 0) {
    origin = { lat: baseRoute[0][0], lng: baseRoute[0][1] };
  }
  if (!destination && baseRoute.length > 0) {
    destination = {
      lat: baseRoute[baseRoute.length - 1][0],
      lng: baseRoute[baseRoute.length - 1][1],
    };
  }
  if (!origin || !destination) return null;

  const points = [];

  for (const stop of stops) {
    const point = coord(stop.lat ?? stop.stopLat, stop.lng ?? stop.stopLng);
    if (!point) continue;
    points.push({
      ...point,
      kind: 'stop',
      id: stop.id,
      label: stop.stopName || stop.city || 'نقطة توقف',
      city: stop.city ?? null,
      address: stop.address ?? null,
      order: stop.stopOrder ?? null,
      stop_type: stop.stopType ?? null,
    });
  }

  for (const booking of bookings) {
    const point = coord(booking.pickupLat, booking.pickupLng);
    if (!point) continue;
    points.push({
      ...point,
      kind: 'pickup',
      id: booking.id,
      booking_id: booking.id,
      passenger: booking.passenger?.fullName ?? null,
      phone: maskPhone(booking.passenger?.phone ?? null),
      label:
        booking.pickupLabel ||
        booking.pickupPlace ||
        booking.pickupCity ||
        'نقطة صعود راكب',
      city: booking.pickupCity ?? null,
      area: booking.pickupArea ?? null,
      order: booking.pickupOrder ?? null,
      status: booking.pickupStatus ?? null,
      seats: Number(booking.seatsBooked ?? 1),
      seat_numbers: booking.seatNumbers ?? [],
    });
  }

  const ordered = routeOrder(points, origin, baseRoute);
  const waypoints = [
    {
      kind: 'origin',
      lat: origin.lat,
      lng: origin.lng,
      label: trip.originCity || 'نقطة الانطلاق',
      city: trip.originCity ?? null,
      area: trip.originArea ?? null,
      address: trip.originAddress ?? null,
    },
    ...ordered,
    {
      kind: 'destination',
      lat: destination.lat,
      lng: destination.lng,
      label: trip.destinationCity || 'الوجهة',
      city: trip.destinationCity ?? null,
      area: trip.destinationArea ?? null,
      address: trip.destinationAddress ?? null,
    },
  ];

  const cacheKey = hashPoints(waypoints);
  if (
    trip.mapRouteWaypointHash === cacheKey &&
    trip.mapRoutePolyline
  ) {
    return {
      route_polyline: trip.mapRoutePolyline,
      distance_m: toNum(trip.mapRouteDistanceM) || 0,
      duration_s: toNum(trip.mapRouteDurationS) || 0,
      source: trip.mapRouteSource || 'stored',
      waypoints,
      cached: true,
      persisted: true,
    };
  }

  let result = null;
  try {
    if (!mapsConfig.mock && mapsConfig.serverApiKey) {
      result = await fetchGoogleRoute(
        origin,
        destination,
        ordered.slice(0, MAX_WAYPOINTS - 2),
      );
    } else {
      result = await fetchOsrmRoute(waypoints);
    }
  } catch {
    result = null;
  }

  if (!result) {
    if (!trip.routePolyline) return null;
    result = {
      polyline: trip.routePolyline,
      distanceM: toNum(trip.routeDistanceM) || 0,
      durationS: toNum(trip.routeDurationS) || 0,
      source: 'stored',
    };
  }

  const payload = {
    route_polyline: result.polyline,
    distance_m: Math.round(Number(result.distanceM) || 0),
    duration_s: Math.round(Number(result.durationS) || 0),
    source: result.source,
    waypoints,
  };
  try {
    await Trip.update(
      {
        mapRoutePolyline: payload.route_polyline,
        mapRouteDistanceM: payload.distance_m,
        mapRouteDurationS: payload.duration_s,
        mapRouteWaypointHash: cacheKey,
        mapRouteComputedAt: new Date(),
        mapRouteSource: payload.source,
      },
      { where: { id: trip.id } },
    );
  } catch {
    // Persistence is best-effort; the response is still usable.
  }
  return { ...payload, cached: false, persisted: true };
}

module.exports = { buildTripMapRoute };
export { buildTripMapRoute };
export default module.exports;
