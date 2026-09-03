import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import * as authService from '../Services/authService';
import * as auditService from '../Services/auditService';

type AuthRequest = Request & { user?: { id: string; role: string } };

const registerPhone = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { country_code, phone, role } = req.body as { country_code: string; phone: string; role: string };
  const result = await (authService as unknown as { registerPhone: (cc: string, phone: string, role: string) => Promise<unknown> }).registerPhone(country_code, phone, role);
  successResponse(res, result, 201);
});

const verifyRegistrationOTP = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { phone, otp } = req.body as { phone: string; otp: string };
  const result = await (authService as unknown as { verifyRegistrationOTP: (phone: string, otp: string) => Promise<unknown> }).verifyRegistrationOTP(phone, otp);
  successResponse(res, result, 201);
});

const registerPassword = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await (authService as unknown as { registerPassword: (authHeader: string | undefined, body: unknown) => Promise<{ user: { id: string; phone: string } }> }).registerPassword(req.headers.authorization, req.body);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'user', id: result.user.id, label: result.user.phone });
  successResponse(res, result, 201);
});

const login = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { phone, password } = req.body as { phone: string; password: string };
  const result = await (authService as unknown as { login: (phone: string, password: string) => Promise<{ user: { id: string; phone: string } }> }).login(phone, password);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'user', id: result.user.id, label: result.user.phone });
  successResponse(res, result);
});

const refresh = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { refresh_token } = req.body as { refresh_token: string };
  const result = await (authService as unknown as { refreshToken: (token: string) => Promise<unknown> }).refreshToken(refresh_token);
  successResponse(res, result);
});

const logout = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { refresh_token } = req.body as { refresh_token: string };
  const accessToken: string | undefined = req.headers.authorization?.split(' ')[1];
  const result = await (authService as unknown as { logout: (userId: string, rt: string | undefined, at: string | undefined) => Promise<unknown> }).logout(String(authReq.user?.id), refresh_token, accessToken);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'user', id: authReq.user?.id });
  successResponse(res, result);
});

const changePassword = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { current_password, new_password } = req.body as { current_password: string; new_password: string };
  const accessToken: string | undefined = req.headers.authorization?.split(' ')[1];
  const result = await (authService as unknown as { changePassword: (userId: string, cur: string, nw: string, at: string | undefined) => Promise<unknown> }).changePassword(String(authReq.user?.id), current_password, new_password, accessToken);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'user', id: authReq.user?.id });
  successResponse(res, result);
});

const me = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const user = await (authService as unknown as { me: (id: string) => Promise<unknown> }).me(String(authReq.user?.id));
  successResponse(res, user);
});

const forgotPassword = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { phone } = req.body as { phone: string };
  const result = await (authService as unknown as { forgotPassword: (phone: string) => Promise<unknown> }).forgotPassword(phone);
  successResponse(res, result);
});

const verifyForgotPasswordOTP = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { phone, otp } = req.body as { phone: string; otp: string };
  const result = await (authService as unknown as { verifyForgotPasswordOTP: (phone: string, otp: string) => Promise<unknown> }).verifyForgotPasswordOTP(phone, otp);
  successResponse(res, result);
});

const resetPassword = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { password } = req.body as { password: string };
  const result = await (authService as unknown as { resetPassword: (authHeader: string | undefined, password: string) => Promise<unknown> }).resetPassword(req.headers.authorization, password);
  successResponse(res, result);
});

const resendOTP = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { phone, purpose } = req.body as { phone: string; purpose: string };
  const result = await (authService as unknown as { resendOTP: (phone: string, purpose: string) => Promise<unknown> }).resendOTP(phone, purpose);
  successResponse(res, result);
});

const submitDriverProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (authService as unknown as { submitDriverProfile: (userId: string, body: unknown) => Promise<{ driverProfile: { id: string } }> }).submitDriverProfile(String(authReq.user?.id), req.body);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'driver_profile', id: result.driverProfile.id });
  successResponse(res, result, 201);
});

const getDriverProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (authService as unknown as { getDriverProfile: (userId: string) => Promise<unknown> }).getDriverProfile(String(authReq.user?.id));
  successResponse(res, result);
});

const submitPassengerProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (authService as unknown as { submitPassengerProfile: (userId: string, body: unknown) => Promise<{ passengerProfile: { id: string } }> }).submitPassengerProfile(String(authReq.user?.id), req.body);
  const { fullname } = req.body as { fullname: string };
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'passenger_profile', id: result.passengerProfile.id, label: fullname });
  successResponse(res, result, 201);
});

const submitVehicle = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (authService as unknown as { submitVehicle: (userId: string, body: unknown) => Promise<{ vehicle: { id: string; plateNumber: string } }> }).submitVehicle(String(authReq.user?.id), req.body);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'vehicle', id: result.vehicle.id, label: result.vehicle.plateNumber });
  successResponse(res, result, 201);
});

const getVehicle = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (authService as unknown as { getVehicle: (userId: string) => Promise<unknown> }).getVehicle(String(authReq.user?.id));
  successResponse(res, result);
});

const getOnboardingStatus = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (authService as unknown as { getOnboardingStatus: (userId: string) => Promise<unknown> }).getOnboardingStatus(String(authReq.user?.id));
  successResponse(res, result);
});

export {
  registerPhone,
  verifyRegistrationOTP,
  registerPassword,
  login,
  refresh,
  logout,
  me,
  forgotPassword,
  verifyForgotPasswordOTP,
  resetPassword,
  changePassword,
  resendOTP,
  submitDriverProfile,
  getDriverProfile,
  submitPassengerProfile,
  submitVehicle,
  getVehicle,
  getOnboardingStatus,
};
export default {
  registerPhone,
  verifyRegistrationOTP,
  registerPassword,
  login,
  refresh,
  logout,
  me,
  forgotPassword,
  verifyForgotPasswordOTP,
  resetPassword,
  changePassword,
  resendOTP,
  submitDriverProfile,
  getDriverProfile,
  submitPassengerProfile,
  submitVehicle,
  getVehicle,
  getOnboardingStatus,
};
