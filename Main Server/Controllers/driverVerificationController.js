const driverVerificationService = require('../Services/driverVerificationService');
const { envelopeResponse } = require('../utils/httpResponse');
const { markResource } = require('../Services/auditService');
const catchAsync = require('../utils/catchAsync');

const getStatus = catchAsync(async (req, res) => {
  const result = await driverVerificationService.getStatus(req.user.id);
  envelopeResponse(res, result);
});

const getSubmission = catchAsync(async (req, res) => {
  const result = await driverVerificationService.getSubmission(req.user.id);
  envelopeResponse(res, result);
});

const submit = catchAsync(async (req, res) => {
  const result = await driverVerificationService.submitOrResubmit(req.user.id, req.body);
  markResource(res, { type: 'user', id: req.user.id });
  envelopeResponse(res, result);
});

module.exports = {
  getStatus,
  getSubmission,
  submit,
};
