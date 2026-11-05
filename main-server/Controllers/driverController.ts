import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import { ApiErrors } from '../utils/ApiError';
import { maskPhone, maskNationalId } from '../utils/masking';
import * as bookingService from '../Services/bookingService';
import * as ratingService from '../Services/ratingService';
import * as penaltyService from '../Services/penaltyService';
import * as complaintService from '../Services/complaintService';
import * as earningsService from '../Services/earningsService';
import * as statsService from '../Services/statsService';
import * as homeService from '../Services/homeService';
import * as driverProfileService from '../Services/driverProfileService';
import * as personalDataService from '../Services/personalDataService';
import * as deletionRequestService from '../Services/deletionRequestService';
import * as auditService from '../Services/auditService';
import { User, Rating, Vehicle, DriverProfile } from '../Models';

type AuthRequest = Request & { user?: { id: string; role: string } };

async function assertDriverEligible(userId: string): Promise<Record<string, unknown>> {
  const user = await (User as unknown as { findByPk: (id: string) => Promise<Record<string, unknown> | null> }).findByPk(userId);
  if (!user) throw ApiErrors.notFound('USER_NOT_FOUND');
  if (user['isVerified'] !== true || (['suspended', 'banned'] as string[]).includes(user['status'] as string)) {
    throw ApiErrors.forbidden('ACCOUNT_MUST_BE_VERIFIED_AND_ACTIVE_TO_ACCESS_THIS_RESOURCE');
  }
  return user;
}

const getHome = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  await assertDriverEligible(String(authReq.user?.id));
  const result = await (homeService as unknown as { getHome: (id: string) => Promise<unknown> }).getHome(String(authReq.user?.id));
  successResponse(res, result);
});

const getSubscription = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  await assertDriverEligible(String(authReq.user?.id));
  const result = await (homeService as unknown as { getSubscription: (id: string) => Promise<unknown> }).getSubscription(String(authReq.user?.id));
  successResponse(res, result);
});

const getBookings = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (bookingService as unknown as { listForDriver: (id: string, q: unknown) => Promise<unknown> }).listForDriver(String(authReq.user?.id), req.query);
  successResponse(res, result);
});

const getBookingById = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { booking_id } = req.params as { booking_id: string };
  const result = await (bookingService as unknown as { getForDriver: (id: string, bookingId: string) => Promise<unknown> }).getForDriver(String(authReq.user?.id), booking_id);
  successResponse(res, result);
});

const getRatings = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (ratingService as unknown as { listWithDistribution: (id: string, q: unknown) => Promise<unknown> }).listWithDistribution(String(authReq.user?.id), req.query);
  successResponse(res, result);
});

const getFullProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (driverProfileService as unknown as { getFullProfile: (id: string) => Promise<unknown> }).getFullProfile(String(authReq.user?.id));
  successResponse(res, result);
});

const getPersonalData = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (personalDataService as unknown as { buildPersonalDataView: (id: string) => Promise<unknown> }).buildPersonalDataView(String(authReq.user?.id));
  successResponse(res, result);
});

const updatePersonalData = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (personalDataService as unknown as { updatePersonalData: (id: string, body: unknown) => Promise<unknown> }).updatePersonalData(String(authReq.user?.id), req.body);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'user', id: authReq.user?.id });
  successResponse(res, result);
});

const getAccountStatus = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (driverProfileService as unknown as { getAccountStatus: (id: string) => Promise<unknown> }).getAccountStatus(String(authReq.user?.id));
  successResponse(res, result);
});

const requestDeleteAccount = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const body = req.body as { reason?: string; confirmation?: boolean };
  const reason: string | null = typeof body.reason === 'string' ? body.reason : null;
  const confirmation: boolean = body.confirmation === true;
  const result = await (deletionRequestService as unknown as { requestDeletion: (id: string, opts: unknown) => Promise<unknown> }).requestDeletion(String(authReq.user?.id), { reason, confirmation });
  successResponse(res, result);
});

const cancelDeleteAccount = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (deletionRequestService as unknown as { cancelDeletionRequest: (id: string) => Promise<unknown> }).cancelDeletionRequest(String(authReq.user?.id));
  successResponse(res, result);
});

const getPenalties = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (penaltyService as unknown as { listForDriver: (id: string, q: unknown) => Promise<unknown> }).listForDriver(String(authReq.user?.id), req.query);
  successResponse(res, result);
});

const getComplaints = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (complaintService as unknown as { listForDriver: (id: string, q: unknown) => Promise<unknown> }).listForDriver(String(authReq.user?.id), req.query);
  successResponse(res, result);
});

const getEarnings = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (earningsService as unknown as { aggregate: (id: string, q: unknown) => Promise<unknown> }).aggregate(String(authReq.user?.id), req.query);
  successResponse(res, result);
});

const getStats = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (statsService as unknown as { lifetime: (id: string) => Promise<unknown> }).lifetime(String(authReq.user?.id));
  successResponse(res, result);
});

const getProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const user = await (User as unknown as { findByPk: (id: string, opts: unknown) => Promise<Record<string, unknown> | null> }).findByPk(String(authReq.user?.id), {
    include: [{ model: DriverProfile, as: 'driverProfile' }],
  });
  if (!user) throw ApiErrors.notFound('USER_NOT_FOUND');
  const ratingCount: number = await (Rating as unknown as { count: (opts: unknown) => Promise<number> }).count({ where: { ratee_id: authReq.user?.id } });
  const profile: Record<string, unknown> = (user['driverProfile'] as Record<string, unknown>) || {};
  const vehicles: Array<Record<string, unknown>> = await (Vehicle as unknown as { findAll: (opts: unknown) => Promise<Array<Record<string, unknown>>> }).findAll({ where: { driver_id: authReq.user?.id } });
  const isVerifiedCheck = (v: Record<string, unknown>): boolean => Boolean(v['isVerified']);
  const identityVerified: boolean = Boolean(profile['idVerified']);
  const vehicleVerified: boolean = vehicles.some(isVerifiedCheck);
  const data = {
    profile: {
      user: {
        id: user['id'],
        full_name: user['fullName'],
        phone: maskPhone(user['phone'] as string),
        role: user['role'],
        status: user['status'],
        avg_rating: Number((user['avgRating'] as number) || 0),
      },
      driver: {
        id_verified: Boolean(profile['idVerified']),
        license_expiry: (profile['licenseExpiry'] as string) || null,
        total_trips: (profile['totalTrips'] as number) || 0,
        total_earnings: Number((profile['totalEarnings'] as number) || 0),
        response_rate: Number((profile['responseRate'] as number) || 0),
        national_id: maskNationalId(profile['nationalID'] as string),
      },
      verification: {
        identity_verified: identityVerified,
        vehicle_verified: vehicleVerified,
        fully_verified: identityVerified && vehicleVerified,
      },
      vehicles: vehicles.map((v: Record<string, unknown>) => ({
        id: v['id'],
        manufacturer: v['manufacturer'],
        model: v['model'],
        vehicle_type: v['vehicleType'],
        model_year: v['modelYear'],
        plate_number: v['plateNumber'],
        code_number: v['codeNumber'],
        color: v['color'],
        seats: v['seats'],
        is_verified: v['isVerified'],
      })),
      ratings_summary: {
        avg: Number((user['avgRating'] as number) || 0),
        count: ratingCount,
      },
    },
  };
  successResponse(res, data);
});

export {
  getHome,
  getSubscription,
  getBookings,
  getBookingById,
  getRatings,
  getPenalties,
  getComplaints,
  getEarnings,
  getStats,
  getProfile,
  getFullProfile,
  getPersonalData,
  updatePersonalData,
  getAccountStatus,
  requestDeleteAccount,
  cancelDeleteAccount,
};
export default {
  getHome,
  getSubscription,
  getBookings,
  getBookingById,
  getRatings,
  getPenalties,
  getComplaints,
  getEarnings,
  getStats,
  getProfile,
  getFullProfile,
  getPersonalData,
  updatePersonalData,
  getAccountStatus,
  requestDeleteAccount,
  cancelDeleteAccount,
};
