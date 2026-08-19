const complaintService = require('../Services/complaintService');
const { successResponse } = require('../utils/httpResponse');
const { markResource } = require('../Services/auditService');

const createComplaint = async (req, res, next) => {
  try {
    const result = await complaintService.create(req.user.id, req.body);
    markResource(res, { type: 'complaint', id: result.complaint.id });
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createComplaint,
};
