const { NotificationSetting } = require('../Models');
const { NOTIFICATION_TYPE } = require('../config/constants');
const { ApiErrors } = require('../utils/ApiError');

const ALL_TYPES = Object.values(NOTIFICATION_TYPE);

/**
 * Get notification settings for a user.
 * Falls back to defaults (all enabled) if no records exist.
 */
async function getSettings(userId) {
  const rows = await NotificationSetting.findAll({
    where: { userId },
    attributes: ['notificationType', 'enabledInApp', 'enabledPush'],
  });

  if (rows.length === 0) {
    return ALL_TYPES.map((type) => ({
      type,
      enabled_in_app: true,
      enabled_push: true,
    }));
  }

  const map = {};
  for (const r of rows) {
    map[r.notificationType] = {
      enabled_in_app: r.enabledInApp,
      enabled_push: r.enabledPush,
    };
  }

  return ALL_TYPES.map((type) => ({
    type,
    enabled_in_app: map[type]?.enabled_in_app ?? true,
    enabled_push: map[type]?.enabled_push ?? true,
  }));
}

/**
 * Update notification settings for a user.
 * Upserts only the provided types, returns updated count.
 */
async function updateSettings(userId, settings) {
  let count = 0;

  for (const s of settings) {
    const existing = await NotificationSetting.findOne({
      where: { userId, notificationType: s.type },
    });

    if (existing) {
      const update = {};
      if (s.enabled_in_app !== undefined) update.enabledInApp = s.enabled_in_app;
      if (s.enabled_push !== undefined) update.enabledPush = s.enabled_push;
      await existing.update(update);
    } else {
      await NotificationSetting.create({
        userId,
        notificationType: s.type,
        enabledInApp: s.enabled_in_app ?? true,
        enabledPush: s.enabled_push ?? true,
      });
    }
    count++;
  }

  return { updated_count: count };
}

/**
 * Initialize default notification settings for a newly registered user.
 * All types enabled by default for both channels.
 */
async function initializeDefaults(userId) {
  const records = ALL_TYPES.map((type) => ({
    userId,
    notificationType: type,
    enabledInApp: true,
    enabledPush: true,
  }));

  await NotificationSetting.bulkCreate(records, { ignoreDuplicates: true });
}

module.exports = { getSettings, updateSettings, initializeDefaults };
