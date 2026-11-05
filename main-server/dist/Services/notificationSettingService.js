"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
exports.initializeDefaults = initializeDefaults;
exports.getGroupedSettings = getGroupedSettings;
exports.updateGroupedSettings = updateGroupedSettings;
// @ts-nocheck
const Models_1 = require("../Models");
const constants_1 = require("../config/constants");
const constants_2 = require("../config/constants");
const ALL_TYPES = Object.values(constants_1.NOTIFICATION_TYPE);
/**
 * Get notification settings for a user.
 * Falls back to defaults (all enabled) if no records exist.
 */
async function getSettings(userId) {
    const rows = await Models_1.NotificationSetting.findAll({
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
        const existing = await Models_1.NotificationSetting.findOne({
            where: { userId, notificationType: s.type },
        });
        if (existing) {
            const update = {};
            if (s.enabled_in_app !== undefined)
                update.enabledInApp = s.enabled_in_app;
            if (s.enabled_push !== undefined)
                update.enabledPush = s.enabled_push;
            await existing.update(update);
        }
        else {
            await Models_1.NotificationSetting.create({
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
    await Models_1.NotificationSetting.bulkCreate(records, { ignoreDuplicates: true });
}
// ===== Grouped settings screen (spec 010, contracts §4) =====
async function buildStoredMap(userId) {
    const rows = await Models_1.NotificationSetting.findAll({
        where: { userId },
        attributes: ['notificationType', 'enabledInApp', 'enabledPush'],
    });
    const map = {};
    for (const r of rows) {
        map[r.notificationType] = {
            enabled_in_app: r.enabledInApp,
            enabled_push: r.enabledPush,
        };
    }
    return map;
}
function buildGroupedView(map) {
    let allEnabled = true;
    const categories = Object.entries(constants_2.NOTIFICATION_CATEGORIES).map(([key, category]) => ({
        key,
        label: category.label,
        types: category.types.map((type) => {
            const entry = map[type] || { enabled_in_app: true, enabled_push: true };
            if (!entry.enabled_in_app || !entry.enabled_push)
                allEnabled = false;
            return {
                type,
                label: {
                    ar: constants_2.NOTIFICATION_GROUP_LABELS.ar[type] || constants_1.NOTIFICATION_TYPE_LABELS.ar[type] || type,
                    en: constants_2.NOTIFICATION_GROUP_LABELS.en[type] || constants_1.NOTIFICATION_TYPE_LABELS.en[type] || type,
                },
                enabled_in_app: entry.enabled_in_app,
                enabled_push: entry.enabled_push,
            };
        }),
    }));
    return { master_switch: allEnabled, categories };
}
/** Grouped settings view for GET /api/driver/notification-settings. */
async function getGroupedSettings(userId) {
    const map = await buildStoredMap(userId);
    return buildGroupedView(map);
}
async function upsertType(userId, type, { inApp, push } = {}) {
    const existing = await Models_1.NotificationSetting.findOne({
        where: { userId, notificationType: type },
    });
    if (existing) {
        const update = {};
        if (inApp !== undefined)
            update.enabledInApp = inApp;
        if (push !== undefined)
            update.enabledPush = push;
        if (Object.keys(update).length > 0)
            await existing.update(update);
    }
    else {
        await Models_1.NotificationSetting.create({
            userId,
            notificationType: type,
            enabledInApp: inApp ?? true,
            enabledPush: push ?? true,
        });
    }
}
/**
 * Apply grouped-screen updates. `master_switch` performs a HARD overwrite of
 * every stored toggle for the driver on both channels (spec Q2).
 */
async function updateGroupedSettings(userId, payload = {}) {
    if (typeof payload.master_switch === 'boolean') {
        for (const type of ALL_TYPES) {
            await upsertType(userId, type, { inApp: payload.master_switch, push: payload.master_switch });
        }
    }
    else if (Array.isArray(payload.updates)) {
        for (const u of payload.updates) {
            if (!ALL_TYPES.includes(u.type))
                continue;
            if (u.channel === 'in_app') {
                await upsertType(userId, u.type, { inApp: Boolean(u.enabled) });
            }
            else if (u.channel === 'push') {
                await upsertType(userId, u.type, { push: Boolean(u.enabled) });
            }
            else if (u.channel === undefined) {
                // channel omitted -> toggle both channels together
                await upsertType(userId, u.type, { inApp: Boolean(u.enabled), push: Boolean(u.enabled) });
            }
        }
    }
    return getGroupedSettings(userId);
}
module.exports = { getSettings, updateSettings, initializeDefaults, getGroupedSettings, updateGroupedSettings };
exports.default = module.exports;
//# sourceMappingURL=notificationSettingService.js.map