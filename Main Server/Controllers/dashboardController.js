const dashboardService = require('../Services/dashboardService');
const { successResponse } = require('../utils/httpResponse');

const getDashboard = async (req, res, next) => {
  try {
    const result = await dashboardService.getDashboard(req.user.id);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboard,
};
