const complaintService = require('../Services/complaintService');
const { successResponse } = require('../utils/httpResponse');

const createComplaint = async (req, res, next) => {
  try {
    const result = await complaintService.create(req.user.id, req.body);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createComplaint,
};
