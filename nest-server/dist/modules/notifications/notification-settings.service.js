var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ALL_NOTIFICATION_TYPES, NOTIFICATION_CATEGORIES, NOTIFICATION_GROUP_LABELS, NOTIFICATION_TYPE_LABELS, } from './notification.constants.js';
let NotificationSettingsService = class NotificationSettingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSettings(userId) {
        const rows = await this.prisma.notificationSetting.findMany({
            where: { userId },
            select: { notificationType: true, enabledInApp: true, enabledPush: true },
        });
        if (rows.length === 0) {
            return ALL_NOTIFICATION_TYPES.map((type) => ({
                type,
                enabled_in_app: true,
                enabled_push: true,
            }));
        }
        const map = {};
        for (const r of rows) {
            map[r.notificationType] = { enabled_in_app: r.enabledInApp, enabled_push: r.enabledPush };
        }
        return ALL_NOTIFICATION_TYPES.map((type) => ({
            type,
            enabled_in_app: map[type]?.enabled_in_app ?? true,
            enabled_push: map[type]?.enabled_push ?? true,
        }));
    }
    async updateSettings(userId, settings) {
        let count = 0;
        for (const s of settings) {
            const existing = await this.prisma.notificationSetting.findFirst({
                where: { userId, notificationType: s.type },
            });
            if (existing) {
                await this.prisma.notificationSetting.update({
                    where: { id: existing.id },
                    data: {
                        ...(s.enabled_in_app !== undefined ? { enabledInApp: s.enabled_in_app } : {}),
                        ...(s.enabled_push !== undefined ? { enabledPush: s.enabled_push } : {}),
                    },
                });
            }
            else {
                await this.prisma.notificationSetting.create({
                    data: {
                        userId,
                        notificationType: s.type,
                        enabledInApp: s.enabled_in_app ?? true,
                        enabledPush: s.enabled_push ?? true,
                    },
                });
            }
            count++;
        }
        return { updated_count: count };
    }
    async initializeDefaults(userId) {
        await this.prisma.notificationSetting.createMany({
            data: ALL_NOTIFICATION_TYPES.map((type) => ({
                userId,
                notificationType: type,
                enabledInApp: true,
                enabledPush: true,
            })),
            skipDuplicates: true,
        });
    }
    async buildStoredMap(userId) {
        const rows = await this.prisma.notificationSetting.findMany({
            where: { userId },
            select: { notificationType: true, enabledInApp: true, enabledPush: true },
        });
        const map = {};
        for (const r of rows) {
            map[r.notificationType] = { enabled_in_app: r.enabledInApp, enabled_push: r.enabledPush };
        }
        return map;
    }
    buildGroupedView(map) {
        let allEnabled = true;
        const categories = Object.entries(NOTIFICATION_CATEGORIES).map(([key, category]) => ({
            key,
            label: category.label,
            types: category.types.map((type) => {
                const entry = map[type] ?? { enabled_in_app: true, enabled_push: true };
                if (!entry.enabled_in_app || !entry.enabled_push)
                    allEnabled = false;
                return {
                    type,
                    label: {
                        ar: NOTIFICATION_GROUP_LABELS.ar[type] ?? NOTIFICATION_TYPE_LABELS.ar[type] ?? type,
                        en: NOTIFICATION_GROUP_LABELS.en[type] ?? NOTIFICATION_TYPE_LABELS.en[type] ?? type,
                    },
                    enabled_in_app: entry.enabled_in_app,
                    enabled_push: entry.enabled_push,
                };
            }),
        }));
        return { master_switch: allEnabled, categories };
    }
    async getGroupedSettings(userId) {
        return this.buildGroupedView(await this.buildStoredMap(userId));
    }
    async upsertType(userId, type, { inApp, push } = {}) {
        const existing = await this.prisma.notificationSetting.findFirst({
            where: { userId, notificationType: type },
        });
        if (existing) {
            const data = {};
            if (inApp !== undefined)
                data.enabledInApp = inApp;
            if (push !== undefined)
                data.enabledPush = push;
            if (Object.keys(data).length > 0) {
                await this.prisma.notificationSetting.update({ where: { id: existing.id }, data });
            }
        }
        else {
            await this.prisma.notificationSetting.create({
                data: {
                    userId,
                    notificationType: type,
                    enabledInApp: inApp ?? true,
                    enabledPush: push ?? true,
                },
            });
        }
    }
    async updateGroupedSettings(userId, payload = {}) {
        if (typeof payload.master_switch === 'boolean') {
            for (const type of ALL_NOTIFICATION_TYPES) {
                await this.upsertType(userId, type, {
                    inApp: payload.master_switch,
                    push: payload.master_switch,
                });
            }
        }
        else if (Array.isArray(payload.updates)) {
            for (const u of payload.updates) {
                if (!ALL_NOTIFICATION_TYPES.includes(u.type))
                    continue;
                if (u.channel === 'in_app') {
                    await this.upsertType(userId, u.type, { inApp: Boolean(u.enabled) });
                }
                else if (u.channel === 'push') {
                    await this.upsertType(userId, u.type, { push: Boolean(u.enabled) });
                }
                else if (u.channel === undefined) {
                    await this.upsertType(userId, u.type, {
                        inApp: Boolean(u.enabled),
                        push: Boolean(u.enabled),
                    });
                }
            }
        }
        return this.getGroupedSettings(userId);
    }
};
NotificationSettingsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], NotificationSettingsService);
export { NotificationSettingsService };
//# sourceMappingURL=notification-settings.service.js.map