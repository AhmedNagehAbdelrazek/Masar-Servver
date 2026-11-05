import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import { modeFor } from '../utils/i18n';
import { resolveRoute } from '../Services/routeService';
import { reverseGeocode } from '../Services/mapsClient';
import { validatePickup } from '../Services/pickupService';

const langOf = (req: Request): string => (modeFor(req) === 'en' ? 'en' : 'ar');

const toPoint = (src: unknown): { lat: number; lng: number } | null => {
  const o = src as Record<string, unknown> | null;
  if (!o) return null;
  const lat = Number(o.lat ?? o.stop_lat ?? o.latitude);
  const lng = Number(o.lng ?? o.stop_lng ?? o.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

// POST /api/maps/route-preview — draft waypoints in, route out, nothing saved.
const routePreview = catchAsync(async (req: Request, res: Response): Promise<void> => {
  // : flat origin_lat/lng preferred; nested {origin, destination} also
  // accepted so clients can echo trip shapes back without remapping.
  const origin = toPoint(req.body.origin) || toPoint({ lat: req.body.origin_lat, lng: req.body.origin_lng });
  const destination = toPoint(req.body.destination) || toPoint({ lat: req.body.destination_lat, lng: req.body.destination_lng });
  const pts = [origin, ...((req.body.stops || []).map(toPoint)), destination].filter(
    (p): p is { lat: number; lng: number } => !!p,
  );
  const route = await resolveRoute(pts, { languageCode: langOf(req) });
  const base = req.body.departure_time ? new Date(req.body.departure_time).getTime() : Date.now();
  successResponse(res, {
    polyline: route.polyline,
    distance_m: route.distanceM,
    duration_s: route.durationS,
    suggested_arrival: new Date(base + route.durationS * 1000).toISOString(),
    cached: route.cached,
  });
});

// POST /api/maps/reverse-geocode — lat/lng to city/area/label in request locale.
const reverseGeocodePoint = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const out = await reverseGeocode({ lat: Number(req.body.lat), lng: Number(req.body.lng), languageCode: langOf(req) });
  successResponse(res, out);
});

// POST /api/trips/:trip_id/pickup-preview — accepted? + impact, before booking.
const pickupPreview = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { trip_id } = req.params as { trip_id: string };
  const out = await validatePickup(
    trip_id,
    {
      pickup_type: req.body.pickup_type,
      pickup_stop_id: req.body.pickup_stop_id,
      lat: req.body.lat,
      lng: req.body.lng,
      pickup_label: req.body.pickup_label,
    },
    { languageCode: langOf(req) },
  );
  successResponse(res, {
    accepted: out.accepted,
    distance_from_route_m: out.distanceM,
    detour_seconds: out.detourSeconds,
    reason: out.reason,
  });
});

export { routePreview, reverseGeocodePoint, pickupPreview };
export default { routePreview, reverseGeocodePoint, pickupPreview };
