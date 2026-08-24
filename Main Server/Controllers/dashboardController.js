const dashboardService = require('../Services/dashboardService');
const { successResponse } = require('../utils/httpResponse');
const catchAsync = require('../utils/catchAsync');

const getDashboard = catchAsync(async (req, res) => {
  const result = await dashboardService.getDashboard(req.user.id);
  successResponse(res, result);
});

module.exports = {
  getDashboard,
};
