"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivateMethod = exports.updateMethod = exports.createMethod = exports.listAllMethods = exports.listActiveMethods = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const httpResponse_1 = require("../utils/httpResponse");
const planService = __importStar(require("../Services/planService"));
const auditService = __importStar(require("../Services/auditService"));
const listActiveMethods = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const methods = await planService.getActivePaymentMethods();
    (0, httpResponse_1.successResponse)(res, { methods });
});
exports.listActiveMethods = listActiveMethods;
const listAllMethods = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const methods = await planService.listPaymentMethods();
    (0, httpResponse_1.successResponse)(res, { methods });
});
exports.listAllMethods = listAllMethods;
const createMethod = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const method = await planService.createPaymentMethod(req.body, String(authReq.user?.id));
    auditService.markResource(res, { type: 'payment_method', id: method.id });
    (0, httpResponse_1.successResponse)(res, { payment_method: method }, 201);
});
exports.createMethod = createMethod;
const updateMethod = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { method_id } = req.params;
    const method = await planService.updatePaymentMethod(method_id, req.body, String(authReq.user?.id));
    auditService.markResource(res, { type: 'payment_method', id: method.id });
    (0, httpResponse_1.successResponse)(res, { payment_method: method });
});
exports.updateMethod = updateMethod;
const deactivateMethod = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { method_id } = req.params;
    const result = await planService.deactivatePaymentMethod(method_id, String(authReq.user?.id));
    auditService.markResource(res, { type: 'payment_method', id: method_id });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.deactivateMethod = deactivateMethod;
exports.default = { listActiveMethods, listAllMethods, createMethod, updateMethod, deactivateMethod };
//# sourceMappingURL=paymentMethodController.js.map