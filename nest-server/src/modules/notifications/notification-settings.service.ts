import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  ALL_NOTIFICATION_TYPES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_GROUP_LABELS,
  NOTIFICATION_TYPE_LABELS,
} from './notification.constants.js';

export interface SettingEntry {
  type: string;
  enabled_in_app?: boolean;
  enabled_push?: boolean;
}

// Port of Main Server/Services/notificationSettingService.ts
@Injectable()
export class NotificationSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(userId: string): Promise<SettingEntry[]> {
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
    const map: Record<string, { enabled_in_app: boolean; enabled_push: boolean }> = {};
    for (const r of rows) {
      map[r.notificationType] = { enabled_in_app: r.enabledInApp, enabled_push: r.enabledPush };
    }
    return ALL_NOTIFICATION_TYPES.map((type) => ({
      type,
      enabled_in_app: map[type]?.enabled_in_app ?? true,
      enabled_push: map[type]?.enabled_push ?? true,
    }));
  }

  async updateSettings(userId: string, settings: SettingEntry[]): Promise<{ updated_count: number }> {
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
      } else {
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

  async initializeDefaults(userId: string): Promise<void> {
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

  private async buildStoredMap(
    userId: string,
  ): Promise<Record<string, { enabled_in_app: boolean; enabled_push: boolean }>> {
    const rows = await this.prisma.notificationSetting.findMany({
      where: { userId },
      select: { notificationType: true, enabledInApp: true, enabledPush: true },
    });
    const map: Record<string, { enabled_in_app: boolean; enabled_push: boolean }> = {};
    for (const r of rows) {
      map[r.notificationType] = { enabled_in_app: r.enabledInApp, enabled_push: r.enabledPush };
    }
    return map;
  }

  private buildGroupedView(
    map: Record<string, { enabled_in_app: boolean; enabled_push: boolean }>,
  ): { master_switch: boolean; categories: unknown[] } {
    let allEnabled = true;
    const categories = Object.entries(NOTIFICATION_CATEGORIES).map(([key, category]) => ({
      key,
      label: category.label,
      types: category.types.map((type) => {
        const entry = map[type] ?? { enabled_in_app: true, enabled_push: true };
        if (!entry.enabled_in_app || !entry.enabled_push) allEnabled = false;
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

  async getGroupedSettings(
    userId: string,
  ): Promise<{ master_switch: boolean; categories: unknown[] }> {
    return this.buildGroupedView(await this.buildStoredMap(userId));
  }

  private async upsertType(
    userId: string,
    type: string,
    { inApp, push }: { inApp?: boolean; push?: boolean } = {},
  ): Promise<void> {
    const existing = await this.prisma.notificationSetting.findFirst({
      where: { userId, notificationType: type },
    });
    if (existing) {
      const data: { enabledInApp?: boolean; enabledPush?: boolean } = {};
      if (inApp !== undefined) data.enabledInApp = inApp;
      if (push !== undefined) data.enabledPush = push;
      if (Object.keys(data).length > 0) {
        await this.prisma.notificationSetting.update({ where: { id: existing.id }, data });
      }
    } else {
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

  async updateGroupedSettings(
    userId: string,
    payload: {
      master_switch?: boolean;
      updates?: { type: string; channel?: string; enabled: boolean }[];
    } = {},
  ): Promise<{ master_switch: boolean; categories: unknown[] }> {
    if (typeof payload.master_switch === 'boolean') {
      for (const type of ALL_NOTIFICATION_TYPES) {
        await this.upsertType(userId, type, {
          inApp: payload.master_switch,
          push: payload.master_switch,
        });
      }
    } else if (Array.isArray(payload.updates)) {
      for (const u of payload.updates) {
        if (!ALL_NOTIFICATION_TYPES.includes(u.type as never)) continue;
        if (u.channel === 'in_app') {
          await this.upsertType(userId, u.type, { inApp: Boolean(u.enabled) });
        } else if (u.channel === 'push') {
          await this.upsertType(userId, u.type, { push: Boolean(u.enabled) });
        } else if (u.channel === undefined) {
          await this.upsertType(userId, u.type, {
            inApp: Boolean(u.enabled),
            push: Boolean(u.enabled),
          });
        }
      }
    }
    return this.getGroupedSettings(userId);
  }
}
