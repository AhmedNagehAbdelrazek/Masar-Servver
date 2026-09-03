"use strict";
const { successResponse } = require('../utils/httpResponse');
const catchAsync = require('../utils/catchAsync');
const healthz = catchAsync(async (req, res) => {
    successResponse(res, {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
module.exports = { healthz };
//# sourceMappingURL=healthController.js.map