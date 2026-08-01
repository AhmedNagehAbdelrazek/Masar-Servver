const vehicleService = require('../Services/vehicleService');
const { successResponse } = require('../utils/httpResponse');

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
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = { listVehicles, updateVehicle };
