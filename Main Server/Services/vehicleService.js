const { Vehicle } = require('../Models');
const { ApiErrors } = require('../utils/ApiError');

const listByDriver = async (driverId) => {
  const vehicles = await Vehicle.findAll({
    where: { driver_id: driverId },
    order: [['createdat', 'DESC']],
  });

  const result = vehicles.map((v) => ({
    id: v.id,
    manufacturer: v.manufacturer,
    model: v.model,
    vehicle_type: v.vehicleType,
    model_year: v.modelYear,
    plate_number: v.plateNumber,
    color: v.color,
    seats: v.seats,
    is_verified: v.isVerified,
  }));

  return { vehicles: result };
};

const update = async (driverId, vehicleId, payload) => {
  const vehicle = await Vehicle.findByPk(vehicleId);
  if (!vehicle) throw ApiErrors.notFound('Vehicle not found');
  if (vehicle.driverId !== driverId) throw ApiErrors.forbidden('You can only update your own vehicles');

  const updates = {};
  if (payload.manufacturer !== undefined) updates.manufacturer = payload.manufacturer;
  if (payload.model !== undefined) updates.model = payload.model;
  if (payload.vehicle_type !== undefined) updates.vehicleType = payload.vehicle_type;
  if (payload.model_year !== undefined) updates.modelYear = payload.model_year;
  if (payload.plate_number !== undefined) updates.plateNumber = payload.plate_number;
  if (payload.color !== undefined) updates.color = payload.color;
  if (payload.seats !== undefined) updates.seats = payload.seats;

  if (updates.plateNumber !== undefined && updates.plateNumber !== vehicle.plateNumber) {
    const existing = await Vehicle.findOne({ where: { plate_number: updates.plateNumber } });
    if (existing && existing.id !== vehicle.id) throw ApiErrors.conflict('Plate number already in use');
  }

  await vehicle.update(updates);

  return {
    vehicle: {
      id: vehicle.id,
      manufacturer: vehicle.manufacturer,
      model: vehicle.model,
      vehicle_type: vehicle.vehicleType,
      model_year: vehicle.modelYear,
      plate_number: vehicle.plateNumber,
      color: vehicle.color,
      seats: vehicle.seats,
      is_verified: vehicle.isVerified,
    },
  };
};

module.exports = { listByDriver, update };
