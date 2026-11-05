"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFavoriteDriver = addFavoriteDriver;
exports.removeFavoriteDriver = removeFavoriteDriver;
exports.listFavoriteDrivers = listFavoriteDrivers;
exports.addFavoriteRoute = addFavoriteRoute;
exports.removeFavoriteRoute = removeFavoriteRoute;
exports.listFavoriteRoutes = listFavoriteRoutes;
// @ts-nocheck
const Models_1 = require("../Models");
const ApiError_1 = require("../utils/ApiError");
const pagination_1 = require("../utils/pagination");
const auditService_1 = __importDefault(require("./auditService"));
function serializeFavoriteDriver(favorite) {
    return {
        id: favorite.id,
        passenger_id: favorite.passengerId,
        driver_id: favorite.driverId,
        driver_name: favorite.driver ? favorite.driver.fullName : null,
        created_at: favorite.createdat || favorite.createdAt,
    };
}
function serializeFavoriteRoute(route) {
    return {
        id: route.id,
        passenger_id: route.passengerId,
        origin_city: route.originCity,
        destination_city: route.destinationCity,
        label: route.label || null,
        created_at: route.createdat || route.createdAt,
    };
}
async function assertDriverExists(driverId) {
    const driver = await Models_1.User.findByPk(driverId);
    if (!driver || driver.role !== 'driver') {
        throw ApiError_1.ApiErrors.notFound('DRIVER_NOT_FOUND');
    }
    return driver;
}
async function addFavoriteDriver(passengerId, driverId) {
    if (driverId === passengerId) {
        throw ApiError_1.ApiErrors.validation('YOU_CANNOT_ADD_YOURSELF_AS_A_FAVORITE_DRIVER');
    }
    await assertDriverExists(driverId);
    const [favorite, created] = await Models_1.FavoriteDriver.findOrCreate({
        where: { passengerId, driverId },
        defaults: { passengerId, driverId },
    });
    const row = await Models_1.FavoriteDriver.findByPk(favorite.id, {
        include: [{ model: Models_1.User, as: 'driver', attributes: ['id', 'fullName'] }],
    });
    if (created) {
        auditService_1.default.track({
            action: 'favorite_driver.added',
            resourceType: 'favorite_driver',
            resourceId: favorite.id,
            actorId: passengerId,
            actorType: 'passenger',
            payload: { driver_id: driverId },
        });
    }
    return { favorite_driver: serializeFavoriteDriver(row), created };
}
async function removeFavoriteDriver(passengerId, driverId) {
    const deleted = await Models_1.FavoriteDriver.destroy({
        where: { passengerId, driverId },
    });
    if (!deleted)
        throw ApiError_1.ApiErrors.notFound('FAVORITE_DRIVER_NOT_FOUND');
    auditService_1.default.track({
        action: 'favorite_driver.removed',
        resourceType: 'favorite_driver',
        resourceId: driverId,
        actorId: passengerId,
        actorType: 'passenger',
    });
    return { message: 'FAVORITE_DRIVER_REMOVED' };
}
async function listFavoriteDrivers(passengerId, filters = {}) {
    const { page, limit, offset } = (0, pagination_1.parsePagination)(filters);
    const { rows, count } = await Models_1.FavoriteDriver.findAndCountAll({
        where: { passengerId },
        include: [{ model: Models_1.User, as: 'driver', attributes: ['id', 'fullName'] }],
        order: [['createdat', 'DESC']],
        offset,
        limit,
    });
    return {
        data: rows.map(serializeFavoriteDriver),
        pagination: (0, pagination_1.buildPagination)(count, page, limit),
    };
}
async function addFavoriteRoute(passengerId, payload) {
    const [route, created] = await Models_1.FavoriteRoute.findOrCreate({
        where: {
            passengerId,
            originCity: payload.origin_city,
            destinationCity: payload.destination_city,
        },
        defaults: {
            passengerId,
            originCity: payload.origin_city,
            destinationCity: payload.destination_city,
            label: payload.label || null,
        },
    });
    if (!created && payload.label !== undefined && route.label !== payload.label) {
        route.label = payload.label || null;
        await route.save();
    }
    if (created) {
        auditService_1.default.track({
            action: 'favorite_route.added',
            resourceType: 'favorite_route',
            resourceId: route.id,
            actorId: passengerId,
            actorType: 'passenger',
            payload: {
                origin_city: route.originCity,
                destination_city: route.destinationCity,
            },
        });
    }
    return serializeFavoriteRoute(route);
}
async function removeFavoriteRoute(passengerId, originCity, destinationCity) {
    const deleted = await Models_1.FavoriteRoute.destroy({
        where: {
            passengerId,
            originCity,
            destinationCity,
        },
    });
    if (!deleted)
        throw ApiError_1.ApiErrors.notFound('FAVORITE_ROUTE_NOT_FOUND');
    auditService_1.default.track({
        action: 'favorite_route.removed',
        resourceType: 'favorite_route',
        resourceId: `${originCity}->${destinationCity}`,
        actorId: passengerId,
        actorType: 'passenger',
    });
    return { message: 'FAVORITE_ROUTE_REMOVED' };
}
async function listFavoriteRoutes(passengerId) {
    const routes = await Models_1.FavoriteRoute.findAll({
        where: { passengerId },
        order: [['createdat', 'DESC']],
    });
    return { data: routes.map(serializeFavoriteRoute) };
}
module.exports = {
    addFavoriteDriver,
    removeFavoriteDriver,
    listFavoriteDrivers,
    addFavoriteRoute,
    removeFavoriteRoute,
    listFavoriteRoutes,
};
exports.default = module.exports;
//# sourceMappingURL=favoriteService.js.map