const passengerProfileService = require('../Services/passengerProfileService');
const { successResponse } = require('../utils/httpResponse');
const { markResource } = require('../Services/auditService');

const getMyProfile = async (req, res, next) => {
  try {
    const result = await passengerProfileService.getMyProfile(req.user.id);
    markResource(res, { type: 'passenger_profile', id: result.passenger_profile.id });
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const updateMyProfile = async (req, res, next) => {
  try {
    const result = await passengerProfileService.updateMyProfile(req.user.id, req.body);
    markResource(res, { type: 'passenger_profile', id: result.passenger_profile.id });
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyProfile, updateMyProfile };
