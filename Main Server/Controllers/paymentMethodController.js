const planService = require('../Services/planService');
const { successResponse } = require('../utils/httpResponse');
const { markResource } = require('../Services/auditService');

const listActiveMethods = async (req, res, next) => {
  try {
    const methods = await planService.getActivePaymentMethods();
    successResponse(res, { methods });
  } catch (err) {
    next(err);
  }
};

const listAllMethods = async (req, res, next) => {
  try {
    const methods = await planService.listPaymentMethods();
    successResponse(res, { methods });
  } catch (err) {
    next(err);
  }
};

const createMethod = async (req, res, next) => {
  try {
    const method = await planService.createPaymentMethod(req.body, req.user.id);
    markResource(res, { type: 'payment_method', id: method.id });
    successResponse(res, { payment_method: method }, 201);
  } catch (err) {
    next(err);
  }
};

const updateMethod = async (req, res, next) => {
  try {
    const method = await planService.updatePaymentMethod(req.params.method_id, req.body, req.user.id);
    markResource(res, { type: 'payment_method', id: method.id });
    successResponse(res, { payment_method: method });
  } catch (err) {
    next(err);
  }
};

const deactivateMethod = async (req, res, next) => {
  try {
    const result = await planService.deactivatePaymentMethod(req.params.method_id, req.user.id);
    markResource(res, { type: 'payment_method', id: req.params.method_id });
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listActiveMethods,
  listAllMethods,
  createMethod,
  updateMethod,
  deactivateMethod,
};
