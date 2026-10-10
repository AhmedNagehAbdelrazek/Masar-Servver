import { Router, Request, Response, NextFunction } from 'express';
const router: Router = Router();
import * as c from '../Controllers/mapsController';
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';
import validate from '../middlewares/validatorMiddleware';
import { routePreviewValidation, reverseGeocodeBodyValidation } from '../utils/validators/mapsValidator';
import { getKey, setKey } from '../config/redis';
import { REDIS_KEYS } from '../utils/redisKeys';
import { ApiErrors } from '../utils/ApiError';

// : 30 previews/min/user via get+set (no atomic Lua, no new redis helper).
// Preview abuse costs money; a rare race over-counting by one is harmless.
async function mapsRateLimit(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const user = (req as Request & { user?: { id: string } }).user;
  const key = REDIS_KEYS.MAPS_RATELIMIT(String(user && user.id));
  try {
    const raw = await getKey(key);
    const n = raw ? parseInt(raw, 10) : 0;
    if (n >= 30) throw ApiErrors.custom('RATE_LIMITED', 429, 'RATE_LIMITED');
    await setKey(key, String(n + 1), 60);
  } catch (err) {
    if (err instanceof Error && (err as { code?: string }).code === 'RATE_LIMITED') throw err;
    // redis offline — fail open rather than block previews
  }
  next();
}

router.post(
  '/route-preview',
  protect,
  roleGuard(['driver']),
  mapsRateLimit,
  ...routePreviewValidation,
  validate,
  c.routePreview,
);
router.post('/reverse-geocode', protect, ...reverseGeocodeBodyValidation, validate, c.reverseGeocodePoint);

export default router;
module.exports = router;
