import { PrismaService } from '../../prisma/prisma.service.js';
export interface SettingEntry {
    type: string;
    enabled_in_app?: boolean;
    enabled_push?: boolean;
}
export declare class NotificationSettingsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getSettings(userId: string): Promise<SettingEntry[]>;
    updateSettings(userId: string, settings: SettingEntry[]): Promise<{
        updated_count: number;
    }>;
    initializeDefaults(userId: string): Promise<void>;
    private buildStoredMap;
    private buildGroupedView;
    getGroupedSettings(userId: string): Promise<{
        master_switch: boolean;
        categories: unknown[];
    }>;
    private upsertType;
    updateGroupedSettings(userId: string, payload?: {
        master_switch?: boolean;
        updates?: {
            type: string;
            channel?: string;
            enabled: boolean;
        }[];
    }): Promise<{
        master_switch: boolean;
        categories: unknown[];
    }>;
}
