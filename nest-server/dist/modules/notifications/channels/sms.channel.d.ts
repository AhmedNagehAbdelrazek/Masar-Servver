export interface SmsUser {
    phone?: string | null;
}
export declare class SmsChannel {
    private readonly logger;
    private readonly provider;
    constructor();
    send(user: SmsUser, message: {
        body: string;
    }): Promise<void>;
}
