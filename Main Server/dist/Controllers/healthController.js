"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthz = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const httpResponse_1 = require("../utils/httpResponse");
const healthz = (0, catchAsync_1.catchAsync)(async (req, res) => {
    (0, httpResponse_1.successResponse)(res, {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
exports.healthz = healthz;
exports.default = { healthz };
//# sourceMappingURL=healthController.js.map