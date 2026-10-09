// @ts-nocheck
// : one shared validator for preview, booking, and edit. Same rule
// everywhere or the three flows drift.
import { Trip, TripStop } from '../Models';
import { ApiErrors } from '../utils/ApiError';
import { TRIP_STATUS, PICKUP_TYPE } from '../config/constants';
import mapsConfig from '../config/maps';
import { decode, distanceFromRouteM, alongRouteM } from './geo';
import { buildWaypoints, resolveRoute } from './routeService';

const toNum = (v) => (v === null || v === undefined ? null : Number(v));

async function loadStop(tripId, stopId) {
  const stop = await TripStop.findOne({ where: { id: stopId, tripId } });
  if (!stop) throw ApiErrors.custom('PICKUP_POINT_NOT_ON_TRIP', 409, 'PICKUP_POINT_NOT_ON_TRIP');
  return { lat: toNum(stop.lat ?? stop.stopLat), lng: toNum(stop.lng ?? stop.stopLng), label: stop.stopName || stop.city || null };
}

// Returns { accepted, distanceM, detourSeconds, reason, point } — never throws
// for a reject, only for unusable input (unknown trip/stop).
async function validatePickup(tripId, input, { languageCode = 'ar' } = {}) {
  const trip = await Trip.findByPk(tripId, { include: [{ model: TripStop, as: 'stops' }] });
  if (!trip) throw ApiErrors.notFound('TRIP_NOT_FOUND');

  const type = (input && input.pickup_type) || (input && input.stopId ? PICKUP_TYPE.STOP : PICKUP_TYPE.CUSTOM);
  if (type === PICKUP_TYPE.STOP) {
    const stopId = (input && (input.pickup_stop_id || input.stopId)) || null;
    if (!stopId) throw ApiErrors.validation('PICKUP_STOP_ID_MUST_BE_A_VALID_UUID');
    const stop = await loadStop(tripId, stopId);
    return { accepted: true, distanceM: 0, detourSeconds: 0, reason: null, point: { ...stop, pickupType: PICKUP_TYPE.STOP, pickupStopId: stopId } };
  }

  const lat = toNum(input && input.lat);
  const lng = toNum(input && input.lng);
  if (lat === null || lng === null) throw ApiErrors.validation('LAT_AND_LNG_ARE_REQUIRED');

  // : routeless trips (legacy rows) skip geometric checks — the
  // recompute after booking fixes the route; blocking helps nobody.
  const baseWaypoints = await buildWaypoints(trip, { includePickups: false });
  let base;
  try {
    base = await resolveRoute(baseWaypoints, { languageCode });
  } catch {
    return {
      accepted: true, distanceM: 0, detourSeconds: 0, reason: null,
      point: { lat, lng, label: (input && (input.pickup_label || input.label)) || null, pickupType: PICKUP_TYPE.CUSTOM, pickupStopId: null },
    };
  }
  const route = decode(base.polyline);
  const distanceM = Math.round(distanceFromRouteM(lat, lng, route));
  if (distanceM > mapsConfig.pickupMaxDistanceFromRouteM) {
    return { accepted: false, distanceM, detourSeconds: 0, reason: 'PICKUP_TOO_FAR_FROM_ROUTE', point: null };
  }
  // Insert at along-track rank so detour reflects reality, not append order.
  const along = alongRouteM(lat, lng, route);
  const inner = baseWaypoints.slice(1, -1);
  const withPoint = [baseWaypoints[0]];
  let inserted = false;
  for (const w of inner) {
    if (!inserted && alongRouteM(w.lat, w.lng, route) > along) {
      withPoint.push({ lat, lng });
      inserted = true;
    }
    withPoint.push(w);
  }
  if (!inserted) withPoint.push({ lat, lng });
  withPoint.push(baseWaypoints[baseWaypoints.length - 1]);
  let detourSeconds = 0;
  try {
    const withRoute = await resolveRoute(withPoint, { languageCode });
    detourSeconds = Math.max(0, withRoute.durationS - base.durationS);
  } catch {
    detourSeconds = 0;
  }
  if (detourSeconds > mapsConfig.detourMaxSeconds) {
    return { accepted: false, distanceM, detourSeconds, reason: 'PICKUP_DETOUR_TOO_LONG', point: null };
  }
  return {
    accepted: true, distanceM, detourSeconds, reason: null,
    point: { lat, lng, label: (input && (input.pickup_label || input.label)) || null, pickupType: PICKUP_TYPE.CUSTOM, pickupStopId: null },
  };
}

// Trip must still be open for booking-side validation.
function assertBookable(trip) {
  if (![TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL].includes(trip.status)) {
    throw ApiErrors.conflict('TRIP_NOT_BOOKABLE');
  }
}

module.exports = { validatePickup, assertBookable };
export { validatePickup, assertBookable };
export default module.exports;
