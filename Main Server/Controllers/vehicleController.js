const vehicleService = require('../Services/vehicleService');
const { successResponse } = require('../utils/httpResponse');
const { markResource } = require('../Services/auditService');
const catchAsync = require('../utils/catchAsync');

const listVehicles = catchAsync(async (req, res) => {
  const result = await vehicleService.listByDriver(req.user.id);
  successResponse(res, result);
});

const updateVehicle = catchAsync(async (req, res) => {
  const result = await vehicleService.update(req.user.id, req.params.vehicle_id, req.body);
  markResource(res, {
    type: 'vehicle',
    id: result.vehicle.id,
    label: result.vehicle.plate_number,
  });
  successResponse(res, result);
});

module.exports = { listVehicles, updateVehicle };
