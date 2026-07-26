const uploadService = require('../Services/uploadService');
const { successResponse } = require('../utils/httpResponse');

const upload = async (req, res, next) => {
  try {
    const result = await uploadService.upload(req);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = { upload };
