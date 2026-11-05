import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import * as favoriteService from '../Services/favoriteService';
import * as auditService from '../Services/auditService';

type AuthRequest = Request & { user?: { id: string; role: string } };

const addFavoriteDriver = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { driver_id } = req.body as { driver_id: string };
  const result = await (favoriteService as unknown as { addFavoriteDriver: (userId: string, driverId: string) => Promise<{ favorite_driver: { id: string } }> }).addFavoriteDriver(String(authReq.user?.id), driver_id);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'favorite_driver', id: result.favorite_driver.id });
  successResponse(res, result);
});

const removeFavoriteDriver = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { driver_id } = req.params as { driver_id: string };
  const result = await (favoriteService as unknown as { removeFavoriteDriver: (userId: string, driverId: string) => Promise<unknown> }).removeFavoriteDriver(String(authReq.user?.id), driver_id);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'favorite_driver', id: driver_id });
  successResponse(res, result);
});

const listFavoriteDrivers = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (favoriteService as unknown as { listFavoriteDrivers: (userId: string, q: unknown) => Promise<unknown> }).listFavoriteDrivers(String(authReq.user?.id), req.query);
  successResponse(res, result);
});

const addFavoriteRoute = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const favoriteRoute = await (favoriteService as unknown as { addFavoriteRoute: (userId: string, body: unknown) => Promise<{ id: string }> }).addFavoriteRoute(String(authReq.user?.id), req.body);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'favorite_route', id: favoriteRoute.id });
  successResponse(res, { favorite_route: favoriteRoute }, 201);
});

const removeFavoriteRoute = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { origin_city, destination_city } = req.params as { origin_city: string; destination_city: string };
  const result = await (favoriteService as unknown as { removeFavoriteRoute: (userId: string, origin: string, dest: string) => Promise<unknown> }).removeFavoriteRoute(String(authReq.user?.id), origin_city, destination_city);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'favorite_route', id: `${origin_city}->${destination_city}` });
  successResponse(res, result);
});

const listFavoriteRoutes = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (favoriteService as unknown as { listFavoriteRoutes: (userId: string) => Promise<unknown> }).listFavoriteRoutes(String(authReq.user?.id));
  successResponse(res, result);
});

export { addFavoriteDriver, removeFavoriteDriver, listFavoriteDrivers, addFavoriteRoute, removeFavoriteRoute, listFavoriteRoutes };
export default { addFavoriteDriver, removeFavoriteDriver, listFavoriteDrivers, addFavoriteRoute, removeFavoriteRoute, listFavoriteRoutes };
