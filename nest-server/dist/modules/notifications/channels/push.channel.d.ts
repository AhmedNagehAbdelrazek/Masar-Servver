export interface PushUser {
    id: string;
    fcmToken?: string | null;
}
export declare class PushChannel {
    private readonly logger;
    private app;
    private initAttempted;
    private initError;
    private getApp;
    private static stringifyData;
    send(user: PushUser, message: {
        type?: string;
        title: string;
        body: string;
    }, data?: Record<string, unknown>): Promise<void>;
}
