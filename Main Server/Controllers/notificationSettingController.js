const notificationSettingService = require('../Services/notificationSettingService');
const { successResponse } = require('../utils/httpResponse');
const catchAsync = require('../utils/catchAsync');

const getNotificationSettings = catchAsync(async (req, res) => {
  const settings = await notificationSettingService.getSettings(req.user.id);
  successResponse(res, { settings });
});

const updateNotificationSettings = catchAsync(async (req, res) => {
  const result = await notificationSettingService.updateSettings(req.user.id, req.body.settings);
  successResponse(res, result);
});

const getGroupedSettings = catchAsync(async (req, res) => {
  const result = await notificationSettingService.getGroupedSettings(req.user.id);
  successResponse(res, result);
});

const updateGroupedSettings = catchAsync(async (req, res) => {
  const result = await notificationSettingService.updateGroupedSettings(req.user.id, req.body);
  successResponse(res, result);
});

module.exports = {
  getNotificationSettings,
  updateNotificationSettings,
  getGroupedSettings,
  updateGroupedSettings,
};
