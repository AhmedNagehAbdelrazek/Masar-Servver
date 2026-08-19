const vehicleService = require('../Services/vehicleService');
const { successResponse } = require('../utils/httpResponse');
const { markResource } = require('../Services/auditService');

const listVehicles = async (req, res, next) => {
  try {
    const result = await vehicleService.listByDriver(req.user.id);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const updateVehicle = async (req, res, next) => {
  try {
    const result = await vehicleService.update(req.user.id, req.params.vehicle_id, req.body);
    markResource(res, {
      type: 'vehicle',
      id: result.vehicle.id,
      label: result.vehicle.plate_number,
    });
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = { listVehicles, updateVehicle };
