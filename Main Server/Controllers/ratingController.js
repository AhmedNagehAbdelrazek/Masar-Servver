const ratingService = require('../Services/ratingService');
const { successResponse } = require('../utils/httpResponse');
const { markResource } = require('../Services/auditService');
const catchAsync = require('../utils/catchAsync');

const createRating = catchAsync(async (req, res) => {
  const result = await ratingService.create(req.user.id, req.body);
  markResource(res, { type: 'rating', id: result.rating.id });
  successResponse(res, result);
});

module.exports = {
  createRating,
};
