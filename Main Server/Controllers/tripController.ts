import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import { ApiErrors } from '../utils/ApiError';
import { ROLES } from '../config/constants';
import * as tripService from '../Services/tripService';
import * as rideRequestService from '../Services/rideRequestService';
import * as recentSearchService from '../Services/recentSearchService';
import * as auditService from '../Services/auditService';

type AuthRequest = Request & { user?: { id: string; role: string } };

const createTrip = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (tripService as unknown as { createTrip: (userId: string, body: unknown) => Promise<{ trip_id: string }> }).createTrip(String(authReq.user?.id), req.body);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'trip', id: result.trip_id });
  successResponse(res, result, 201);
});

const getTripById = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { trip_id } = req.params as { trip_id: string };
  const trip = await (tripService as unknown as { getTripById: (id: string) => Promise<Record<string, unknown>> }).getTripById(trip_id);
  const participantIds: string[] = (trip['_participantIds'] as string[]) || [];
  const isAdmin: boolean = authReq.user?.role === ROLES.ADMIN;
  const isParticipant: boolean = isAdmin || participantIds.includes(String(authReq.user?.id));
  delete (trip as Record<string, unknown>)['_participantIds'];
  if (!isParticipant) {
    throw ApiErrors.forbidden('YOU_DO_NOT_HAVE_ACCESS_TO_THIS_TRIP');
  }
  successResponse(res, trip);
});

const getDriverTrips = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { status } = req.query as { status?: string };
  const trips = await (tripService as unknown as { getDriverTrips: (userId: string, status: string | undefined) => Promise<unknown> }).getDriverTrips(String(authReq.user?.id), status);
  successResponse(res, { trips });
});

const getAvailableTrips = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { origin_city, destination_city, date, return_date, gender_preference, time_from, time_to, vehicle_type, seats } = req.query as {
    origin_city?: string;
    destination_city?: string;
    date?: string;
    return_date?: string;
    gender_preference?: string;
    time_from?: string;
    time_to?: string;
    vehicle_type?: string;
    seats?: string;
  };
  const result: any = await (tripService as unknown as { getAvailableTrips: (opts: unknown) => Promise<any> }).getAvailableTrips({
    originCity: origin_city,
    destinationCity: destination_city,
    date,
    returnDate: return_date,
    genderPreference: gender_preference,
    timeFrom: time_from,
    timeTo: time_to,
    vehicleType: vehicle_type,
    seats,
  });

  // Service now returns { trips, returningTrips } (round-trip). Keep backward compat if array was returned.
  const trips = Array.isArray(result) ? result : result.trips;
  const returningTrips = Array.isArray(result) ? (result as any).returningTrips || [] : result.returningTrips || [];

  // Serialize driver details inside each trip for frontend convenience (Image 2 shape)
  const serializeWithDriver = (arr: any[]) =>
    (arr || []).map((t: any) => {
      const json = typeof t.toJSON === 'function' ? t.toJSON() : t;
      // Ensure driver is exposed with friendly keys while preserving raw driver
      if (json.driver) {
        json.driver = {
          id: json.driver.id,
          full_name: json.driver.fullName || json.driver.full_name,
          rating: Number(json.driver.avgRating ?? json.driver.rating) || 0,
          profile_picture_url: json.driver.avatarUrl || json.driver.profile_picture_url || null,
          avatar_url: json.driver.avatarUrl || json.driver.avatar_url || null,
          gender: json.driver.gender || null,
        };
      }
      // Normalize vehicle keys if present
      if (json.vehicle) {
        json.vehicle = {
          id: json.vehicle.id,
          vehicle_type: json.vehicle.vehicleType || json.vehicle.vehicle_type,
          manufacturer: json.vehicle.manufacturer,
          model: json.vehicle.model,
          plate_number: json.vehicle.plateNumber || json.vehicle.plate_number,
          plateNumber: json.vehicle.plateNumber || json.vehicle.plate_number,
          color: json.vehicle.color,
          seats: json.vehicle.seats,
        };
      }
      return json;
    });

  const serializedTrips = serializeWithDriver(trips);
  const serializedReturning = serializeWithDriver(returningTrips);
  console.log("user",authReq.user);
  console.log("user role",authReq?.user?.role);
  console.log("origin_city",origin_city);
  console.log("destination_city",destination_city);
  if (authReq.user && authReq.user.role === ROLES.PASSENGER && origin_city && destination_city) {
    console.log('[tripController] record search');
    try {
      await recentSearchService.recordSearch(String(authReq.user.id), origin_city, destination_city);
    } catch (err) {
      console.warn('[tripController] record search failed:', (err as Error).message);
    }
  }
  successResponse(res, { trips: serializedTrips, returning_trips: serializedReturning });
});

const startTrip = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { trip_id } = req.params as { trip_id: string };
  const result = await (tripService as unknown as { startTrip: (userId: string, id: string) => Promise<{ trip_id: string }> }).startTrip(String(authReq.user?.id), trip_id);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'trip', id: result.trip_id });
  successResponse(res, result);
});

const completeTrip = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { trip_id } = req.params as { trip_id: string };
  const result = await (tripService as unknown as { completeTrip: (userId: string, id: string) => Promise<{ trip_id: string }> }).completeTrip(String(authReq.user?.id), trip_id);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'trip', id: result.trip_id });
  successResponse(res, result);
});

const updateTrip = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { trip_id } = req.params as { trip_id: string };
  const result = await (tripService as unknown as { updateTrip: (userId: string, id: string, body: unknown) => Promise<{ trip: { id: string } }> }).updateTrip(String(authReq.user?.id), trip_id, req.body);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'trip', id: result.trip.id });
  successResponse(res, result);
});

const cancelTrip = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { trip_id } = req.params as { trip_id: string };
  const result = await (tripService as unknown as { cancelTrip: (userId: string, id: string) => Promise<{ trip: { id: string } }> }).cancelTrip(String(authReq.user?.id), trip_id);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'trip', id: result.trip.id });
  successResponse(res, result);
});

const getTripAttributes = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { trip_id } = req.params as { trip_id: string };
  const result = await (tripService as unknown as { getTripAttributes: (id: string) => Promise<unknown> }).getTripAttributes(trip_id);
  successResponse(res, result);
});

const getTripOptions = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { trip_id } = req.params as { trip_id: string };
  const result = await (tripService as unknown as { getTripOptions: (id: string) => Promise<unknown> }).getTripOptions(trip_id);
  successResponse(res, result);
});

const getTripPassengers = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { trip_id } = req.params as { trip_id: string };
  const { status } = req.query as { status?: string };
  const result = await (tripService as unknown as { getTripPassengers: (userId: string, id: string, opts: unknown) => Promise<unknown> }).getTripPassengers(String(authReq.user?.id), trip_id, { status });
  successResponse(res, result);
});

const cancelTripWithPenalty = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { trip_id } = req.params as { trip_id: string };
  const result = await (tripService as unknown as { cancelTripWithPenalty: (userId: string, id: string, body: unknown) => Promise<{ trip_id: string }> }).cancelTripWithPenalty(String(authReq.user?.id), trip_id, req.body);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'trip', id: result.trip_id });
  successResponse(res, result, 200);
});

const attachOfferToTrip = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { trip_id, offer_id } = req.params as { trip_id: string; offer_id: string };
  const result = await (rideRequestService as unknown as { attachOfferToTrip: (userId: string, tripId: string, offerId: string, body: unknown) => Promise<{ booking: { id: string; reference_code: string } }> }).attachOfferToTrip(String(authReq.user?.id), trip_id, offer_id, req.body);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'booking', id: result.booking.id, label: `booking ${result.booking.reference_code}` });
  successResponse(res, result, 201);
});

export {
  createTrip,
  getTripById,
  getDriverTrips,
  getAvailableTrips,
  startTrip,
  completeTrip,
  updateTrip,
  cancelTrip,
  cancelTripWithPenalty,
  getTripAttributes,
  getTripOptions,
  getTripPassengers,
  attachOfferToTrip,
};
export default {
  createTrip,
  getTripById,
  getDriverTrips,
  getAvailableTrips,
  startTrip,
  completeTrip,
  updateTrip,
  cancelTrip,
  cancelTripWithPenalty,
  getTripAttributes,
  getTripOptions,
  getTripPassengers,
  attachOfferToTrip,
};
