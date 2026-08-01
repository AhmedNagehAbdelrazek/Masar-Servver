const planService = require('../Services/planService');
const { successResponse } = require('../utils/httpResponse');

const listActivePlans = async (req, res, next) => {
  try {
    const plans = await planService.getActivePlans();
    successResponse(res, { plans });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listActivePlans,
};
