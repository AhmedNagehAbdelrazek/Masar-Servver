"use strict";
const planService = require('../Services/planService');
const { successResponse } = require('../utils/httpResponse');
const { markResource } = require('../Services/auditService');
const catchAsync = require('../utils/catchAsync');
const listActiveMethods = catchAsync(async (req, res) => {
    const methods = await planService.getActivePaymentMethods();
    successResponse(res, { methods });
});
const listAllMethods = catchAsync(async (req, res) => {
    const methods = await planService.listPaymentMethods();
    successResponse(res, { methods });
});
const createMethod = catchAsync(async (req, res) => {
    const method = await planService.createPaymentMethod(req.body, req.user.id);
    markResource(res, { type: 'payment_method', id: method.id });
    successResponse(res, { payment_method: method }, 201);
});
const updateMethod = catchAsync(async (req, res) => {
    const method = await planService.updatePaymentMethod(req.params.method_id, req.body, req.user.id);
    markResource(res, { type: 'payment_method', id: method.id });
    successResponse(res, { payment_method: method });
});
const deactivateMethod = catchAsync(async (req, res) => {
    const result = await planService.deactivatePaymentMethod(req.params.method_id, req.user.id);
    markResource(res, { type: 'payment_method', id: req.params.method_id });
    successResponse(res, result);
});
module.exports = {
    listActiveMethods,
    listAllMethods,
    createMethod,
    updateMethod,
    deactivateMethod,
};
//# sourceMappingURL=paymentMethodController.js.map