const verificationService = require('../Services/verificationService');
const { successResponse, envelopeResponse } = require('../utils/httpResponse');

const getQueue = async (req, res, next) => {
  try {
    const result = await verificationService.getQueue(req.query);
    envelopeResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const approveDriver = async (req, res, next) => {
  try {
    const result = await verificationService.approveDriver(req.user.id, req.params.driver_id);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const rejectDriver = async (req, res, next) => {
  try {
    const result = await verificationService.rejectDriver(
      req.user.id,
      req.params.driver_id,
      req.body.reason,
      req.body.fields_to_fix
    );
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const approveVehicle = async (req, res, next) => {
  try {
    const result = await verificationService.approveVehicle(req.user.id, req.params.vehicle_id);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const rejectVehicle = async (req, res, next) => {
  try {
    const result = await verificationService.rejectVehicle(
      req.user.id,
      req.params.vehicle_id,
      req.body.reason,
      req.body.fields_to_fix
    );
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getQueue,
  approveDriver,
  rejectDriver,
  approveVehicle,
  rejectVehicle,
};
