"use strict";
const router = require('express').Router();
const protect = require('../middlewares/protect');
const roleGuard = require('../middlewares/roleGuard');
const validate = require('../middlewares/validatorMiddleware');
const c = require('../Controllers/favoriteController');
const v = require('../utils/validators/favoriteValidator');
router.use(protect);
router.get('/drivers', roleGuard(['passenger']), ...v.favoriteDriversListValidation, validate, c.listFavoriteDrivers);
router.post('/drivers', roleGuard(['passenger']), ...v.addFavoriteDriverValidation, validate, c.addFavoriteDriver);
router.delete('/drivers/:driver_id', roleGuard(['passenger']), ...v.driverParamValidation, c.removeFavoriteDriver);
router.get('/routes', roleGuard(['passenger']), c.listFavoriteRoutes);
router.post('/routes', roleGuard(['passenger']), ...v.addFavoriteRouteValidation, validate, c.addFavoriteRoute);
router.delete('/routes/:origin_city/:destination_city', roleGuard(['passenger']), ...v.routeParamValidation, c.removeFavoriteRoute);
module.exports = router;
//# sourceMappingURL=favoriteRoutes.js.map