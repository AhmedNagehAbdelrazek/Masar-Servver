const complaintService = require('../Services/complaintService');
const { successResponse } = require('../utils/httpResponse');
const { markResource } = require('../Services/auditService');
const catchAsync = require('../utils/catchAsync');

const createComplaint = catchAsync(async (req, res) => {
  const result = await complaintService.create(req.user.id, req.body);
  markResource(res, { type: 'complaint', id: result.complaint.id });
  successResponse(res, result);
});

module.exports = {
  createComplaint,
};
