const ratingService = require('../Services/ratingService');
const { successResponse } = require('../utils/httpResponse');

const createRating = async (req, res, next) => {
  try {
    const result = await ratingService.create(req.user.id, req.body);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createRating,
};
