import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import * as notificationSettingService from '../Services/notificationSettingService';

type AuthRequest = Request & { user?: { id: string; role: string } };

const getNotificationSettings = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const settings = await (notificationSettingService as unknown as { getSettings: (userId: string) => Promise<unknown> }).getSettings(String(authReq.user?.id));
  successResponse(res, { settings });
});

const updateNotificationSettings = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { settings } = req.body as { settings: unknown };
  const result = await (notificationSettingService as unknown as { updateSettings: (userId: string, settings: unknown) => Promise<unknown> }).updateSettings(String(authReq.user?.id), settings);
  successResponse(res, result);
});

const getGroupedSettings = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (notificationSettingService as unknown as { getGroupedSettings: (userId: string) => Promise<unknown> }).getGroupedSettings(String(authReq.user?.id));
  successResponse(res, result);
});

const updateGroupedSettings = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (notificationSettingService as unknown as { updateGroupedSettings: (userId: string, body: unknown) => Promise<unknown> }).updateGroupedSettings(String(authReq.user?.id), req.body);
  successResponse(res, result);
});

export { getNotificationSettings, updateNotificationSettings, getGroupedSettings, updateGroupedSettings };
export default { getNotificationSettings, updateNotificationSettings, getGroupedSettings, updateGroupedSettings };
