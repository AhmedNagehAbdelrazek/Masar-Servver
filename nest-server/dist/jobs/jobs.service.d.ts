export declare class JobsService {
    private readonly logger;
    private run;
    expirySweep(): void;
    expiryReminder(): void;
    lowBalanceWarning(): void;
    sosEscalation(): void;
    dataRetention(): void;
    routeRetry(): void;
    actualPath(): void;
    driverStats(): void;
    tripLifecycle(): void;
}
