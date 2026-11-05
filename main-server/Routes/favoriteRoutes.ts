import { Router } from 'express';
const router: Router = Router();
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';
import validate from '../middlewares/validatorMiddleware';
import * as c from '../Controllers/favoriteController';
import * as v from '../utils/validators/favoriteValidator';

router.use(protect);

router.get('/drivers', roleGuard(['passenger']), ...v.favoriteDriversListValidation, validate, c.listFavoriteDrivers);
router.post('/drivers', roleGuard(['passenger']), ...v.addFavoriteDriverValidation, validate, c.addFavoriteDriver);
router.delete('/drivers/:driver_id', roleGuard(['passenger']), ...v.driverParamValidation, c.removeFavoriteDriver);

router.get('/routes', roleGuard(['passenger']), c.listFavoriteRoutes);
router.post('/routes', roleGuard(['passenger']), ...v.addFavoriteRouteValidation, validate, c.addFavoriteRoute);
router.delete(
  '/routes/:origin_city/:destination_city',
  roleGuard(['passenger']),
  ...v.routeParamValidation,
  c.removeFavoriteRoute
);

export default router;
module.exports = router;
