"use strict";
const planService = require('../Services/planService');
const { successResponse } = require('../utils/httpResponse');
const catchAsync = require('../utils/catchAsync');
const listActivePlans = catchAsync(async (req, res) => {
    const plans = await planService.getActivePlans();
    successResponse(res, { plans });
});
module.exports = {
    listActivePlans,
};
//# sourceMappingURL=planController.js.map