import type { GeoService, LatLng } from '../maps/geo.service.js';

// Pure, DB-free trip matcher for proximity search (spec 013 P1/P2).
//
// A trip matches when the passenger's pickup and dropoff are each "close
// enough" to an anchor on the trip (origin/destination, a pickup/dropoff stop,
// or the route corridor) AND the pickup comes before the dropoff along the
// route. The ordering check is what prevents a trip in the opposite direction
// from matching.
//
// Coordinates are optional: when they are missing we fall back to normalized
// city/area/stop-city text matching, preserving the pre-proximity behaviour.

export type SearchAnchorKind = 'origin' | 'destination' | 'stop' | 'enroute' | 'city';

export interface SearchAnchor {
  kind: SearchAnchorKind;
  distanceM: number | null;
  alongM: number | null;
  order: number;
  lat: number | null;
  lng: number | null;
  stopId?: string;
  stopName?: string | null;
}

export interface TripMatchResult {
  origin: SearchAnchor;
  destination: SearchAnchor;
  score: number;
}

export interface SearchPoint {
  lat: number;
  lng: number;
}

export interface SearchTripStop {
  id: string;
  stopOrder: number;
  stopName: string | null;
  city: string | null;
  lat: unknown;
  lng: unknown;
  stopLat: unknown;
  stopLng: unknown;
  stopType: string | null;
}

export interface SearchTrip {
  id: string;
  originCity: string;
  originArea?: string | null;
  originLat: unknown;
  originLng: unknown;
  destinationCity: string;
  destinationArea?: string | null;
  destinationLat: unknown;
  destinationLng: unknown;
  routePolyline?: string | null;
  routeStatus?: string | null;
  routeDistanceM?: unknown;
  stops?: SearchTripStop[];
}

export interface TripSearchOptions {
  origin: SearchPoint | null;
  destination: SearchPoint | null;
  originCity: string | null;
  destinationCity: string | null;
  originRadiusM: number;
  destinationRadiusM: number;
  corridorM: number;
  includeEnroute: boolean;
  allowCustomDropoff: boolean;
  minRideM: number;
}

export type SearchSort = 'best_match' | 'departure_time' | 'distance';

const KIND_RANK: Record<SearchAnchorKind, number> = {
  origin: 0,
  destination: 0,
  stop: 1,
  enroute: 2,
  city: 3,
};

const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670\u0640]/g;

// Bounded decoded-polyline cache. Search decodes the same trip route across
// repeated searches; keying by trip id and validating the encoded string keeps
// it correct when routeVersion changes. 1 entry per trip, evicted FIFO.
const ROUTE_CACHE_MAX = 1000;
const ROUTE_CACHE = new Map<string, { polyline: string; points: LatLng[] }>();

/**
 * Normalize a place/city label for the coordinate-less fallback path.
 * Handles case, punctuation, whitespace, common Arabic variants and the
 * frequent "Amman, Jordan" suffix without trying to be a full geocoder.
 */
export function normalizePlaceName(value: string | null | undefined): string {
  if (!value) return '';
  return value
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

function toPoint(lat: unknown, lng: unknown): LatLng | null {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return null;
  const a = Number(lat);
  const b = Number(lng);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return [a, b];
}

function stopPoint(stop: SearchTripStop): LatLng | null {
  return toPoint(stop.lat ?? stop.stopLat, stop.lng ?? stop.stopLng);
}

function sortedStops(trip: SearchTrip): SearchTripStop[] {
  return [...(trip.stops ?? [])].sort((a, b) => a.stopOrder - b.stopOrder);
}

function stopAllows(stopType: string | null, role: 'pickup' | 'dropoff'): boolean {
  const type = (stopType ?? 'both').toLowerCase();
  return type === 'both' || type === role;
}

function maxStopOrder(stops: SearchTripStop[]): number {
  return stops.reduce((max, stop) => Math.max(max, stop.stopOrder), 0) + 1;
}

function decodeRoute(trip: SearchTrip, geo: GeoService): LatLng[] | null {
  if (trip.routeStatus !== 'ready' || !trip.routePolyline) return null;
  const cached = ROUTE_CACHE.get(trip.id);
  if (cached && cached.polyline === trip.routePolyline) return cached.points;
  try {
    const points = geo.decode(trip.routePolyline);
    if (points.length < 2) return null;
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
function buildOrderingLine(trip: SearchTrip): LatLng[] {
  const points: LatLng[] = [];
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
export function mayBeNearRoute(
  point: SearchPoint,
  trip: SearchTrip,
  corridorM: number,
  geo: GeoService,
): boolean {
  const origin = toPoint(trip.originLat, trip.originLng);
  const destination = toPoint(trip.destinationLat, trip.destinationLng);
  const routeDistanceM =
    trip.routeDistanceM != null && Number.isFinite(Number(trip.routeDistanceM))
      ? Number(trip.routeDistanceM)
      : null;
  if (!origin || !destination || routeDistanceM === null) return true;
  const p: LatLng = [point.lat, point.lng];
  return (
    geo.haversineM(p, origin) + geo.haversineM(p, destination) <=
    routeDistanceM + 2 * corridorM
  );
}

function alongOf(line: LatLng[], point: LatLng, geo: GeoService): number | null {
  return line.length >= 2 ? geo.alongRouteM(point, line) : null;
}

function cityAnchorFor(
  role: 'pickup' | 'dropoff',
  city: string | null,
  trip: SearchTrip,
  stops: SearchTripStop[],
): SearchAnchor | null {
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
      lat: endpoint?.[0] ?? null,
      lng: endpoint?.[1] ?? null,
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
      order: stop.stopOrder,
      lat: point?.[0] ?? null,
      lng: point?.[1] ?? null,
      stopId: stop.id,
      stopName: stop.stopName,
    };
  }

  return null;
}

function resolveAnchor(
  role: 'pickup' | 'dropoff',
  point: SearchPoint | null,
  city: string | null,
  trip: SearchTrip,
  stops: SearchTripStop[],
  orderingLine: LatLng[],
  route: LatLng[] | null,
  options: TripSearchOptions,
  geo: GeoService,
): SearchAnchor | null {
  if (!point) return cityAnchorFor(role, city, trip, stops);

  const radius = role === 'pickup' ? options.originRadiusM : options.destinationRadiusM;
  const order = role === 'pickup' ? 0 : maxStopOrder(stops);
  const p: LatLng = [point.lat, point.lng];
  const candidates: SearchAnchor[] = [];

  const endpoint =
    role === 'pickup'
      ? toPoint(trip.originLat, trip.originLng)
      : toPoint(trip.destinationLat, trip.destinationLng);
  if (endpoint) {
    const distanceM = geo.haversineM(p, endpoint);
    if (distanceM <= radius) {
      candidates.push({
        kind: role === 'pickup' ? 'origin' : 'destination',
        distanceM,
        alongM: alongOf(orderingLine, endpoint, geo),
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
    const distanceM = geo.haversineM(p, stopAt);
    if (distanceM > radius) continue;
    candidates.push({
      kind: 'stop',
      distanceM,
      alongM: alongOf(orderingLine, stopAt, geo),
      order: stop.stopOrder,
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
    mayBeNearRoute(point, trip, options.corridorM, geo)
  ) {
    const distanceM = geo.distanceFromRouteM(p, route);
    if (distanceM <= options.corridorM) {
      candidates.push({
        kind: 'enroute',
        distanceM,
        alongM: geo.alongRouteM(p, route),
        order,
        lat: point.lat,
        lng: point.lng,
      });
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort(compareAnchors);
  return candidates[0] ?? null;
}

function compareAnchors(a: SearchAnchor, b: SearchAnchor): number {
  const distanceA = a.distanceM ?? Number.POSITIVE_INFINITY;
  const distanceB = b.distanceM ?? Number.POSITIVE_INFINITY;
  if (Math.abs(distanceA - distanceB) > 1) return distanceA - distanceB;
  return KIND_RANK[a.kind] - KIND_RANK[b.kind];
}

function isOrdered(origin: SearchAnchor, destination: SearchAnchor, minRideM: number): boolean {
  if (origin.alongM != null && destination.alongM != null) {
    return origin.alongM + minRideM <= destination.alongM;
  }
  return origin.order < destination.order;
}

/**
 * City anchors that matched a stop carry coordinates but no along value. Fill
 * it in so a mixed (point + city) match still gets the route-order check
 * instead of falling back to stop order alone.
 */
function fillAlong(anchor: SearchAnchor, line: LatLng[], geo: GeoService): SearchAnchor {
  if (anchor.alongM != null || anchor.lat == null || anchor.lng == null) return anchor;
  const alongM = alongOf(line, [anchor.lat, anchor.lng], geo);
  return alongM == null ? anchor : { ...anchor, alongM };
}

function scoreAnchors(
  origin: SearchAnchor,
  destination: SearchAnchor,
  options: TripSearchOptions,
): number {
  // City-only anchors have no distance; score them below any coordinate match
  // but above no match at all so they still rank against each other.
  const pickupScore =
    origin.distanceM == null
      ? 0.35
      : 1 - Math.min(origin.distanceM / options.originRadiusM, 1);
  const dropoffScore =
    destination.distanceM == null
      ? 0.35
      : 1 - Math.min(destination.distanceM / options.destinationRadiusM, 1);
  return Math.round((0.5 * pickupScore + 0.5 * dropoffScore) * 1000) / 1000;
}

export function matchTrip(
  trip: SearchTrip,
  options: TripSearchOptions,
  geo: GeoService,
): TripMatchResult | null {
  const stops = sortedStops(trip);
  // Only decode the polyline when one of the passenger points can plausibly be
  // near it. Endpoint/stop matches still work from the waypoint chain.
  const originNearRoute =
    options.includeEnroute && options.origin
      ? mayBeNearRoute(options.origin, trip, options.corridorM, geo)
      : false;
  const destinationNearRoute =
    options.includeEnroute && options.allowCustomDropoff && options.destination
      ? mayBeNearRoute(options.destination, trip, options.corridorM, geo)
      : false;
  const route =
    originNearRoute || destinationNearRoute ? decodeRoute(trip, geo) : null;
  const orderingLine = route ?? buildOrderingLine(trip);

  const origin = resolveAnchor(
    'pickup',
    options.origin,
    options.originCity,
    trip,
    stops,
    orderingLine,
    route,
    options,
    geo,
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
    geo,
  );
  if (!destination) return null;

  const orderedOrigin = fillAlong(origin, orderingLine, geo);
  const orderedDestination = fillAlong(destination, orderingLine, geo);
  if (!isOrdered(orderedOrigin, orderedDestination, options.minRideM)) return null;

  return {
    origin: orderedOrigin,
    destination: orderedDestination,
    score: scoreAnchors(orderedOrigin, orderedDestination, options),
  };
}
