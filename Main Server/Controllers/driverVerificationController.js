const driverVerificationService = require('../Services/driverVerificationService');
const { envelopeResponse } = require('../utils/httpResponse');

const getStatus = async (req, res, next) => {
  try {
    const result = await driverVerificationService.getStatus(req.user.id);
    envelopeResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const getSubmission = async (req, res, next) => {
  try {
    const result = await driverVerificationService.getSubmission(req.user.id);
    envelopeResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const submit = async (req, res, next) => {
  try {
    const result = await driverVerificationService.submitOrResubmit(req.user.id, req.body);
    envelopeResponse(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStatus,
  getSubmission,
  submit,
};
