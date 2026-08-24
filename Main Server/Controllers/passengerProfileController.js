const passengerProfileService = require('../Services/passengerProfileService');
const { successResponse } = require('../utils/httpResponse');
const { markResource } = require('../Services/auditService');
const catchAsync = require('../utils/catchAsync');

const getMyProfile = catchAsync(async (req, res) => {
  const result = await passengerProfileService.getMyProfile(req.user.id);
  markResource(res, { type: 'passenger_profile', id: result.passenger_profile.id });
  successResponse(res, result);
});

const updateMyProfile = catchAsync(async (req, res) => {
  const result = await passengerProfileService.updateMyProfile(req.user.id, req.body);
  markResource(res, { type: 'passenger_profile', id: result.passenger_profile.id });
  successResponse(res, result);
});

module.exports = { getMyProfile, updateMyProfile };
