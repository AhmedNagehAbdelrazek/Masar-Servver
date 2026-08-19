const notificationSettingService = require('../Services/notificationSettingService');
const { successResponse } = require('../utils/httpResponse');

const getNotificationSettings = async (req, res, next) => {
  try {
    const settings = await notificationSettingService.getSettings(req.user.id);
    successResponse(res, { settings });
  } catch (err) {
    next(err);
  }
};

const updateNotificationSettings = async (req, res, next) => {
  try {
    const result = await notificationSettingService.updateSettings(req.user.id, req.body.settings);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotificationSettings,
  updateNotificationSettings,
};
