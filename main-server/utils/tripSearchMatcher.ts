// @ts-nocheck
// Pure, DB-free proximity matcher (spec 013 P1/P2). Port of
// nest-server/src/modules/trips/trip-search.matcher.ts adapted to the Express
// functional geo helpers and Sequelize model instances.
//
// A trip matches when the passenger's pickup and dropoff are each close
// enough to an anchor on the trip (origin/destination, a pickup/dropoff stop,
// or the route corridor) AND the pickup comes before the dropoff along the
// route. The ordering check rejects trips running in the opposite direction.
import { alongRouteM, decode, distanceFromRouteM, haversineM } from '../Services/geo';

const KIND_RANK = {
  origin: 0,
  destination: 0,
  stop: 1,
  enroute: 2,
  city: 3,
};

const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670\u0640]/g;

// Bounded decoded-polyline cache. Search decodes the same trip route across
// repeated requests; keying by trip id and validating the encoded string keeps
// it correct when routeVersion changes.
const ROUTE_CACHE_MAX = 1000;
const ROUTE_CACHE = new Map();

/**
 * Normalize a place/city label for the coordinate-less fallback path.
 * Handles case, punctuation, whitespace, common Arabic variants and the
 * frequent "Amman, Jordan" suffix without trying to be a full geocoder.
 */
export function normalizePlaceName(value) {
  if (!value) return '';
  return String(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(ARABIC_DIACRITICS, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\b(?:jordan|jo)\b/g, ' ')
    .replace(/(?:الأردن|الاردن)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toPoint(lat, lng) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return null;
  const a = Number(lat);
  const b = Number(lng);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return [a, b];
}

function stopPoint(stop) {
  return toPoint(stop.lat ?? stop.stopLat, stop.lng ?? stop.stopLng);
}

function sortedStops(trip) {
  return [...(trip.stops || [])].sort((a, b) => Number(a.stopOrder) - Number(b.stopOrder));
}

function stopAllows(stopType, role) {
  const type = String(stopType || 'both').toLowerCase();
  return type === 'both' || type === role;
}

function maxStopOrder(stops) {
  return stops.reduce((max, stop) => Math.max(max, Number(stop.stopOrder) || 0), 0) + 1;
}

function decodeRoute(trip) {
  if (trip.routeStatus !== 'ready' || !trip.routePolyline) return null;
  const cached = ROUTE_CACHE.get(trip.id);
  if (cached && cached.polyline === trip.routePolyline) return cached.points;
  try {
    const points = decode(trip.routePolyline);
    if (!points || points.length < 2) return null;
    if (ROUTE_CACHE.size >= ROUTE_CACHE_MAX) {
      const oldest = ROUTE_CACHE.keys().next().value;
      if (oldest !== undefined) ROUTE_CACHE.delete(oldest);
    }
    ROUTE_CACHE.set(trip.id, { polyline: trip.routePolyline, points });
    return points;
  } catch {
    return null;
  }
}

/** Waypoint chain used for ordering when no routable polyline is available. */
function buildOrderingLine(trip) {
  const points = [];
  const origin = toPoint(trip.originLat, trip.originLng);
  if (origin) points.push(origin);
  for (const stop of sortedStops(trip)) {
    const point = stopPoint(stop);
    if (point) points.push(point);
  }
  const destination = toPoint(trip.destinationLat, trip.destinationLng);
  if (destination) points.push(destination);
  return points;
}

/**
 * Cheap necessary-condition test for route-corridor matching. A point farther
 * from both endpoints than the route length (plus the corridor on each side)
 * cannot be within the corridor of the route, so there is no need to decode the
 * polyline for it.
 */
export function mayBeNearRoute(point, trip, corridorM) {
  const origin = toPoint(trip.originLat, trip.originLng);
  const destination = toPoint(trip.destinationLat, trip.destinationLng);
  const routeDistanceM =
    trip.routeDistanceM != null && Number.isFinite(Number(trip.routeDistanceM))
      ? Number(trip.routeDistanceM)
      : null;
  if (!origin || !destination || routeDistanceM === null) return true;
  return (
    haversineM(point.lat, point.lng, origin[0], origin[1]) +
      haversineM(point.lat, point.lng, destination[0], destination[1]) <=
    routeDistanceM + 2 * corridorM
  );
}

function alongOf(line, point) {
  return line.length >= 2 ? alongRouteM(point[0], point[1], line) : null;
}

function cityAnchorFor(role, city, trip, stops) {
  const order = role === 'pickup' ? 0 : maxStopOrder(stops);
  const wanted = normalizePlaceName(city);
  if (!wanted) {
    return { kind: 'city', distanceM: null, alongM: null, order, lat: null, lng: null };
  }

  const endpointCity = role === 'pickup' ? trip.originCity : trip.destinationCity;
  const endpointArea = role === 'pickup' ? trip.originArea : trip.destinationArea;
  if (
    normalizePlaceName(endpointCity) === wanted ||
    normalizePlaceName(endpointArea) === wanted
  ) {
    const endpoint =
      role === 'pickup'
        ? toPoint(trip.originLat, trip.originLng)
        : toPoint(trip.destinationLat, trip.destinationLng);
    return {
      kind: 'city',
      distanceM: null,
      alongM: null,
      order,
      lat: endpoint ? endpoint[0] : null,
      lng: endpoint ? endpoint[1] : null,
    };
  }

  for (const stop of stops) {
    if (!stopAllows(stop.stopType, role)) continue;
    if (normalizePlaceName(stop.city) !== wanted) continue;
    const point = stopPoint(stop);
    return {
      kind: 'city',
      distanceM: null,
      alongM: null,
      order: Number(stop.stopOrder) || 0,
      lat: point ? point[0] : null,
      lng: point ? point[1] : null,
      stopId: stop.id,
      stopName: stop.stopName,
    };
  }

  return null;
}

function resolveAnchor(role, point, city, trip, stops, orderingLine, route, options) {
  if (!point) return cityAnchorFor(role, city, trip, stops);

  const radius = role === 'pickup' ? options.originRadiusM : options.destinationRadiusM;
  const order = role === 'pickup' ? 0 : maxStopOrder(stops);
  const p = [point.lat, point.lng];
  const candidates = [];

  const endpoint =
    role === 'pickup'
      ? toPoint(trip.originLat, trip.originLng)
      : toPoint(trip.destinationLat, trip.destinationLng);
  if (endpoint) {
    const distanceM = haversineM(p[0], p[1], endpoint[0], endpoint[1]);
    if (distanceM <= radius) {
      candidates.push({
        kind: role === 'pickup' ? 'origin' : 'destination',
        distanceM,
        alongM: alongOf(orderingLine, endpoint),
        order,
        lat: endpoint[0],
        lng: endpoint[1],
      });
    }
  }

  for (const stop of stops) {
    if (!stopAllows(stop.stopType, role)) continue;
    const stopAt = stopPoint(stop);
    if (!stopAt) continue;
    const distanceM = haversineM(p[0], p[1], stopAt[0], stopAt[1]);
    if (distanceM > radius) continue;
    candidates.push({
      kind: 'stop',
      distanceM,
      alongM: alongOf(orderingLine, stopAt),
      order: Number(stop.stopOrder) || 0,
      lat: stopAt[0],
      lng: stopAt[1],
      stopId: stop.id,
      stopName: stop.stopName,
    });
  }

  const enrouteAllowed = role === 'pickup' || options.allowCustomDropoff;
  if (
    route &&
    enrouteAllowed &&
    options.includeEnroute &&
    mayBeNearRoute(point, trip, options.corridorM)
  ) {
    const distanceM = distanceFromRouteM(p[0], p[1], route);
    if (distanceM <= options.corridorM) {
      candidates.push({
        kind: 'enroute',
        distanceM,
        alongM: alongRouteM(p[0], p[1], route),
        order,
        lat: point.lat,
        lng: point.lng,
      });
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort(compareAnchors);
  return candidates[0] || null;
}

function compareAnchors(a, b) {
  const distanceA = a.distanceM === null ? Number.POSITIVE_INFINITY : a.distanceM;
  const distanceB = b.distanceM === null ? Number.POSITIVE_INFINITY : b.distanceM;
  if (Math.abs(distanceA - distanceB) > 1) return distanceA - distanceB;
  return KIND_RANK[a.kind] - KIND_RANK[b.kind];
}

function isOrdered(origin, destination, minRideM) {
  if (origin.alongM !== null && destination.alongM !== null) {
    return origin.alongM + minRideM <= destination.alongM;
  }
  return origin.order < destination.order;
}

/**
 * City anchors that matched a stop carry coordinates but no along value. Fill
 * it in so a mixed (point + city) match still gets the route-order check
 * instead of falling back to stop order alone.
 */
function fillAlong(anchor, line) {
  if (anchor.alongM !== null || anchor.lat === null || anchor.lng === null) return anchor;
  const alongM = alongOf(line, [anchor.lat, anchor.lng]);
  return alongM === null ? anchor : { ...anchor, alongM };
}

function scoreAnchors(origin, destination, options) {
  const pickupScore =
    origin.distanceM === null
      ? 0.35
      : 1 - Math.min(origin.distanceM / options.originRadiusM, 1);
  const dropoffScore =
    destination.distanceM === null
      ? 0.35
      : 1 - Math.min(destination.distanceM / options.destinationRadiusM, 1);
  return Math.round((0.5 * pickupScore + 0.5 * dropoffScore) * 1000) / 1000;
}

export function matchTrip(trip, options) {
  const stops = sortedStops(trip);
  const originNearRoute =
    options.includeEnroute && options.origin
      ? mayBeNearRoute(options.origin, trip, options.corridorM)
      : false;
  const destinationNearRoute =
    options.includeEnroute && options.allowCustomDropoff && options.destination
      ? mayBeNearRoute(options.destination, trip, options.corridorM)
      : false;
  const route = originNearRoute || destinationNearRoute ? decodeRoute(trip) : null;
  const orderingLine = route || buildOrderingLine(trip);

  const origin = resolveAnchor(
    'pickup',
    options.origin,
    options.originCity,
    trip,
    stops,
    orderingLine,
    route,
    options,
  );
  if (!origin) return null;

  const destination = resolveAnchor(
    'dropoff',
    options.destination,
    options.destinationCity,
    trip,
    stops,
    orderingLine,
    route,
    options,
  );
  if (!destination) return null;

  const orderedOrigin = fillAlong(origin, orderingLine);
  const orderedDestination = fillAlong(destination, orderingLine);
  if (!isOrdered(orderedOrigin, orderedDestination, options.minRideM)) return null;

  return {
    origin: orderedOrigin,
    destination: orderedDestination,
    score: scoreAnchors(orderedOrigin, orderedDestination, options),
  };
}

export default { matchTrip, mayBeNearRoute, normalizePlaceName };
