"use strict";
const verificationService = require('../Services/verificationService');
const { successResponse, envelopeResponse } = require('../utils/httpResponse');
const { markResource } = require('../Services/auditService');
const catchAsync = require('../utils/catchAsync');
const getQueue = catchAsync(async (req, res) => {
    const result = await verificationService.getQueue(req.query);
    envelopeResponse(res, result);
});
const approveDriver = catchAsync(async (req, res) => {
    const result = await verificationService.approveDriver(req.user.id, req.params.driver_id);
    markResource(res, { type: 'driver_profile', id: req.params.driver_id });
    successResponse(res, result);
});
const rejectDriver = catchAsync(async (req, res) => {
    const result = await verificationService.rejectDriver(req.user.id, req.params.driver_id, req.body.reason, req.body.fields_to_fix);
    markResource(res, { type: 'driver_profile', id: req.params.driver_id });
    successResponse(res, result);
});
const approveVehicle = catchAsync(async (req, res) => {
    const result = await verificationService.approveVehicle(req.user.id, req.params.vehicle_id);
    markResource(res, { type: 'vehicle', id: req.params.vehicle_id });
    successResponse(res, result);
});
const rejectVehicle = catchAsync(async (req, res) => {
    const result = await verificationService.rejectVehicle(req.user.id, req.params.vehicle_id, req.body.reason, req.body.fields_to_fix);
    markResource(res, { type: 'vehicle', id: req.params.vehicle_id });
    successResponse(res, result);
});
module.exports = {
    getQueue,
    approveDriver,
    rejectDriver,
    approveVehicle,
    rejectVehicle,
};
//# sourceMappingURL=adminVerificationController.js.map