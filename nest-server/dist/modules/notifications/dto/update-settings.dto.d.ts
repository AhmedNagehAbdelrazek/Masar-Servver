declare class SettingItemDto {
    type: string;
    enabled_in_app?: boolean;
    enabled_push?: boolean;
}
export declare class UpdateSettingsDto {
    settings: SettingItemDto[];
}
export {};
