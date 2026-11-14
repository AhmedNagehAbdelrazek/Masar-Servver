// @ts-nocheck
import { Op } from 'sequelize';
import { DeletionRequest, User, Trip, RideRequest } from '../Models';
import { maskPhone } from '../utils/masking';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function str(value) {
  return value == null ? '' : String(value);
}

function userResult(user, role) {
  return {
    id: user.id,
    kind: role,
    name: str(user.fullName) || (role === 'driver' ? 'سائق' : 'راكب'),
    phone: maskPhone(user.phone),
    phone_full: user.phone,
    email: user.email ?? null,
    status: user.status,
    verification_status: user.verificationStatus ?? null,
    is_verified: user.isVerified === true,
  };
}

function tripResult(trip) {
  return {
    id: trip.id,
    kind: 'trip',
    origin: trip.originCity,
    destination: trip.destinationCity,
    route: `${trip.originCity} → ${trip.destinationCity}`,
    datetime: trip.departureTime,
    driver: trip.driver?.fullName ?? null,
    status: trip.status,
  };
}

function requestResult(request) {
  return {
    id: request.id,
    kind: 'request',
    origin: request.originCity,
    destination: request.destinationCity,
    route: `${request.originCity} → ${request.destinationCity}`,
    datetime: request.originTime ?? request.createdat ?? request.createdAt ?? null,
    passenger: request.passenger?.fullName ?? null,
    status: request.status,
  };
}

/**
 * Global admin search across the four dashboard entities. Matching is
 * case-insensitive and limited per group so the header dropdown stays small.
 */
async function search(query = {}) {
  const q = str(query.q).trim();
  const limit = Math.min(Math.max(Number(query.limit) || 5, 1), 10);
  const empty = {
    query: q,
    results: { passengers: [], drivers: [], trips: [], requests: [] },
    total: 0,
  };
  if (q.length < 2) return empty;

  const like = `%${q}%`;
  const uuid = UUID_RE.test(q);
  const deletionRows = await DeletionRequest.findAll({
    where: { status: { [Op.in]: ['pending', 'approved'] } },
    attributes: ['userId'],
    raw: true,
  });
  const deletionIds = deletionRows.map((row) => row.userId).filter(Boolean);
  const userWhere = {
    [Op.or]: [
      { fullName: { [Op.iLike]: like } },
      { phone: { [Op.iLike]: like } },
      ...(uuid ? [{ id: q }] : []),
    ],
    ...(deletionIds.length ? { id: { [Op.notIn]: deletionIds } } : {}),
  };

  const [passengers, drivers, trips, requests] = await Promise.all([
    User.findAll({
      where: { role: 'passenger', ...userWhere },
      attributes: ['id', 'fullName', 'phone', 'email', 'status', 'verificationStatus', 'isVerified'],
      order: [['fullName', 'ASC']],
      limit,
    }),
    User.findAll({
      where: { role: 'driver', ...userWhere },
      attributes: ['id', 'fullName', 'phone', 'email', 'status', 'verificationStatus', 'isVerified'],
      order: [['fullName', 'ASC']],
      limit,
    }),
    Trip.findAll({
      where: {
        [Op.or]: [
          { originCity: { [Op.iLike]: like } },
          { destinationCity: { [Op.iLike]: like } },
          { '$driver.full_name$': { [Op.iLike]: like } },
          ...(uuid ? [{ id: q }] : []),
        ],
      },
      include: [{ model: User, as: 'driver', attributes: ['id', 'fullName'] }],
      order: [['departure_time', 'DESC']],
      limit,
      subQuery: false,
    }),
    RideRequest.findAll({
      where: {
        [Op.or]: [
          { originCity: { [Op.iLike]: like } },
          { destinationCity: { [Op.iLike]: like } },
          { '$passenger.full_name$': { [Op.iLike]: like } },
          { '$passenger.phone$': { [Op.iLike]: like } },
          ...(uuid ? [{ id: q }] : []),
        ],
      },
      include: [{ model: User, as: 'passenger', attributes: ['id', 'fullName'] }],
      order: [['createdat', 'DESC']],
      limit,
      subQuery: false,
    }),
  ]);

  const results = {
    passengers: passengers.map((user) => userResult(user, 'passenger')),
    drivers: drivers.map((user) => userResult(user, 'driver')),
    trips: trips.map(tripResult),
    requests: requests.map(requestResult),
  };
  const total = Object.values(results).reduce((sum, rows) => sum + rows.length, 0);

  return { query: q, results, total };
}

module.exports = { search };
export { search };
export default module.exports;
