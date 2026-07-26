const { successResponse } = require('../utils/httpResponse');

const healthz = async (req, res, next) => {
  try {
    successResponse(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { healthz };
