const ratingService = require('../Services/ratingService');
const { successResponse } = require('../utils/httpResponse');
const { markResource } = require('../Services/auditService');

const createRating = async (req, res, next) => {
  try {
    const result = await ratingService.create(req.user.id, req.body);
    markResource(res, { type: 'rating', id: result.rating.id });
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createRating,
};
