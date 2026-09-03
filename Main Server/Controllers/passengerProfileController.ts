import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import * as passengerProfileService from '../Services/passengerProfileService';
import * as homeService from '../Services/homeService';
import * as auditService from '../Services/auditService';

type AuthRequest = Request & { user?: { id: string; role: string } };

const getMyProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (passengerProfileService as unknown as { getMyProfile: (id: string) => Promise<unknown> }).getMyProfile(String(authReq.user?.id));
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'passenger_profile', id: authReq.user?.id });
  successResponse(res, result);
});

const getAccountSummary = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (passengerProfileService as unknown as { getAccountSummary: (id: string) => Promise<unknown> }).getAccountSummary(String(authReq.user?.id));
  successResponse(res, result);
});

const updateMyProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (passengerProfileService as unknown as { updateMyProfile: (id: string, body: unknown) => Promise<{ passenger_profile: { id: string } }> }).updateMyProfile(String(authReq.user?.id), req.body);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'passenger_profile', id: result.passenger_profile.id });
  successResponse(res, result);
});

const getPassengerHome = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (homeService as unknown as { getPassengerHome: (id: string) => Promise<unknown> }).getPassengerHome(String(authReq.user?.id));
  successResponse(res, result);
});

export { getMyProfile, updateMyProfile, getAccountSummary, getPassengerHome };
export default { getMyProfile, updateMyProfile, getAccountSummary, getPassengerHome };
