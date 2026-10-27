import { WebsmppSmsService } from '../../sms/websmpp-sms.service.js';
export interface SmsUser {
    phone?: string | null;
}
export declare class SmsChannel {
    private readonly websmpp;
    private readonly logger;
    private readonly provider;
    constructor(websmpp: WebsmppSmsService);
    send(user: SmsUser, message: {
        body: string;
    }): Promise<void>;
}
