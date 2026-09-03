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
  const { origin_city, destination_city, date, gender_preference, time_from, time_to, vehicle_type, seats } = req.query as {
    origin_city?: string;
    destination_city?: string;
    date?: string;
    gender_preference?: string;
    time_from?: string;
    time_to?: string;
    vehicle_type?: string;
    seats?: string;
  };
  const trips = await (tripService as unknown as { getAvailableTrips: (opts: unknown) => Promise<unknown> }).getAvailableTrips({
    originCity: origin_city,
    destinationCity: destination_city,
    date,
    genderPreference: gender_preference,
    timeFrom: time_from,
    timeTo: time_to,
    vehicleType: vehicle_type,
    seats,
  });
  if (authReq.user && authReq.user.role === ROLES.PASSENGER && origin_city && destination_city) {
    try {
      await (recentSearchService as unknown as { recordSearch: (userId: string, origin: string, dest: string) => Promise<void> }).recordSearch(String(authReq.user.id), origin_city, destination_city);
    } catch (err) {
      console.warn('[tripController] record search failed:', (err as Error).message);
    }
  }
  successResponse(res, { trips });
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
