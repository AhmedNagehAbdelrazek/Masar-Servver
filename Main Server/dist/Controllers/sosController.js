"use strict";
const sosService = require('../Services/sosService');
const { successResponse } = require('../utils/httpResponse');
const catchAsync = require('../utils/catchAsync');
const listSos = catchAsync(async (req, res) => {
    const result = await sosService.listAdmin(req.user, req.query);
    successResponse(res, result);
});
const ackSos = catchAsync(async (req, res) => {
    const result = await sosService.acknowledge(req.user, req.params.id);
    successResponse(res, result);
});
const resolveSos = catchAsync(async (req, res) => {
    const result = await sosService.resolve(req.user, req.params.id, req.body.resolution_note);
    successResponse(res, result);
});
module.exports = { listSos, ackSos, resolveSos };
//# sourceMappingURL=sosController.js.map