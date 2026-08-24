const { Op } = require('sequelize');
const { FavoriteDriver, FavoriteRoute, User } = require('../Models');
const { ApiErrors } = require('../utils/ApiError');
const { parsePagination, buildPagination } = require('../utils/pagination');
const auditService = require('./auditService');

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
  const driver = await User.findByPk(driverId);
  if (!driver || driver.role !== 'driver') {
    throw ApiErrors.notFound('DRIVER_NOT_FOUND');
  }
  return driver;
}

async function addFavoriteDriver(passengerId, driverId) {
  if (driverId === passengerId) {
    throw ApiErrors.validation('YOU_CANNOT_ADD_YOURSELF_AS_A_FAVORITE_DRIVER');
  }
  await assertDriverExists(driverId);

  const [favorite, created] = await FavoriteDriver.findOrCreate({
    where: { passengerId, driverId },
    defaults: { passengerId, driverId },
  });

  const row = await FavoriteDriver.findByPk(favorite.id, {
    include: [{ model: User, as: 'driver', attributes: ['id', 'fullName'] }],
  });

  if (created) {
    auditService.track({
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
  const deleted = await FavoriteDriver.destroy({
    where: { passengerId, driverId },
  });
  if (!deleted) throw ApiErrors.notFound('FAVORITE_DRIVER_NOT_FOUND');

  auditService.track({
    action: 'favorite_driver.removed',
    resourceType: 'favorite_driver',
    resourceId: driverId,
    actorId: passengerId,
    actorType: 'passenger',
  });

  return { message: 'FAVORITE_DRIVER_REMOVED' };
}

async function listFavoriteDrivers(passengerId, filters = {}) {
  const { page, limit, offset } = parsePagination(filters);

  const { rows, count } = await FavoriteDriver.findAndCountAll({
    where: { passengerId },
    include: [{ model: User, as: 'driver', attributes: ['id', 'fullName'] }],
    order: [['createdat', 'DESC']],
    offset,
    limit,
  });

  return {
    data: rows.map(serializeFavoriteDriver),
    pagination: buildPagination(count, page, limit),
  };
}

async function addFavoriteRoute(passengerId, payload) {
  const [route, created] = await FavoriteRoute.findOrCreate({
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
    auditService.track({
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
  const deleted = await FavoriteRoute.destroy({
    where: {
      passengerId,
      originCity,
      destinationCity,
    },
  });
  if (!deleted) throw ApiErrors.notFound('FAVORITE_ROUTE_NOT_FOUND');

  auditService.track({
    action: 'favorite_route.removed',
    resourceType: 'favorite_route',
    resourceId: `${originCity}->${destinationCity}`,
    actorId: passengerId,
    actorType: 'passenger',
  });

  return { message: 'FAVORITE_ROUTE_REMOVED' };
}

async function listFavoriteRoutes(passengerId) {
  const routes = await FavoriteRoute.findAll({
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
