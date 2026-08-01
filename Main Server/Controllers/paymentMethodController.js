const planService = require('../Services/planService');
const { successResponse } = require('../utils/httpResponse');

const listActiveMethods = async (req, res, next) => {
  try {
    const methods = await planService.getActivePaymentMethods();
    successResponse(res, { methods });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listActiveMethods,
};
