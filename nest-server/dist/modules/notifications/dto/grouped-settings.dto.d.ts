declare class GroupedUpdateItemDto {
    type: string;
    channel?: 'in_app' | 'push';
    enabled: boolean;
}
export declare class GroupedSettingsDto {
    master_switch?: boolean;
    updates?: GroupedUpdateItemDto[];
}
export {};
