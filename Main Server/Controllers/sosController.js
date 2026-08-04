const sosService = require('../Services/sosService');
const { successResponse } = require('../utils/httpResponse');

const listSos = async (req, res, next) => {
  try {
    const result = await sosService.listAdmin(req.user, req.query);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const ackSos = async (req, res, next) => {
  try {
    const result = await sosService.acknowledge(req.user, req.params.id);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const resolveSos = async (req, res, next) => {
  try {
    const result = await sosService.resolve(req.user, req.params.id, req.body.resolution_note);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = { listSos, ackSos, resolveSos };
