"use strict";
const favoriteService = require('../Services/favoriteService');
const { successResponse } = require('../utils/httpResponse');
const { markResource } = require('../Services/auditService');
const catchAsync = require('../utils/catchAsync');
const addFavoriteDriver = catchAsync(async (req, res) => {
    const result = await favoriteService.addFavoriteDriver(req.user.id, req.body.driver_id);
    markResource(res, { type: 'favorite_driver', id: result.favorite_driver.id });
    successResponse(res, result);
});
const removeFavoriteDriver = catchAsync(async (req, res) => {
    const result = await favoriteService.removeFavoriteDriver(req.user.id, req.params.driver_id);
    markResource(res, { type: 'favorite_driver', id: req.params.driver_id });
    successResponse(res, result);
});
const listFavoriteDrivers = catchAsync(async (req, res) => {
    const result = await favoriteService.listFavoriteDrivers(req.user.id, req.query);
    successResponse(res, result);
});
const addFavoriteRoute = catchAsync(async (req, res) => {
    const favorite_route = await favoriteService.addFavoriteRoute(req.user.id, req.body);
    markResource(res, { type: 'favorite_route', id: favorite_route.id });
    successResponse(res, { favorite_route }, 201);
});
const removeFavoriteRoute = catchAsync(async (req, res) => {
    const result = await favoriteService.removeFavoriteRoute(req.user.id, req.params.origin_city, req.params.destination_city);
    markResource(res, { type: 'favorite_route', id: `${req.params.origin_city}->${req.params.destination_city}` });
    successResponse(res, result);
});
const listFavoriteRoutes = catchAsync(async (req, res) => {
    const result = await favoriteService.listFavoriteRoutes(req.user.id);
    successResponse(res, result);
});
module.exports = {
    addFavoriteDriver,
    removeFavoriteDriver,
    listFavoriteDrivers,
    addFavoriteRoute,
    removeFavoriteRoute,
    listFavoriteRoutes,
};
//# sourceMappingURL=favoriteController.js.map