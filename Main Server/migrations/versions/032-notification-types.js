'use strict';

var Sequelize = require('sequelize');

/**
 * No schema change and no backfill rows needed (spec 013 DB5):
 *
 * - The 8 new types live in NOTIFICATION_TYPE (config/constants.ts) and
 *   TEMPLATES (Services/notificationService/index.ts).
 * - notificationSettingService.getSettings() builds its response from
 *   Object.values(NOTIFICATION_TYPE) and defaults any type without a stored
 *   row to enabled — so existing users are all-on without a backfill.
 * - initializeDefaults() already seeds ALL_TYPES for new users.
 *
 * This revision exists only to keep the 028-032 numbering gapless for
 * db:migrate:preview.
 **/

var info = {
    "revision": 32,
    "name": "notification-types",
    "created": "2026-10-02T00:00:00.000Z",
    "comment": "spec 013 DB5: no-op by design, read-path defaults cover new types"
};

var migrationCommands = [];

module.exports = {
    pos: 0,
    migrationCommands,
    up: function(queryInterface, Sequelize)
    {
        return Promise.resolve();
    },
    info: info
};
