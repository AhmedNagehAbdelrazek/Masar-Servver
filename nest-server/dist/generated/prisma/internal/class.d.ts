import * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "./prismaNamespace.js";
export type LogOptions<ClientOptions extends Prisma.PrismaClientOptions> = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never;
export interface PrismaClientConstructor {
    new <Options extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions, LogOpts extends LogOptions<Options> = LogOptions<Options>, OmitOpts extends Prisma.PrismaClientOptions['omit'] = Options extends {
        omit: infer U;
    } ? U : Prisma.PrismaClientOptions['omit'], ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs>(options: Prisma.PrismaClientConstructorArgs<Options>): PrismaClient<LogOpts, OmitOpts, ExtArgs>;
}
export interface PrismaClient<in LogOpts extends Prisma.LogLevel = never, in out OmitOpts extends Prisma.PrismaClientOptions['omit'] = Prisma.PrismaClientOptions['omit'], in out ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['other'];
    };
    $on<V extends LogOpts>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;
    $connect(): runtime.Types.Utils.JsPromise<void>;
    $disconnect(): runtime.Types.Utils.JsPromise<void>;
    $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;
    $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;
    $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;
    $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;
    $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: Prisma.TransactionIsolationLevel;
    }): runtime.Types.Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>;
    $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => runtime.Types.Utils.JsPromise<R>, options?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: Prisma.TransactionIsolationLevel;
    }): runtime.Types.Utils.JsPromise<R>;
    $extends: runtime.Types.Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<OmitOpts>, ExtArgs, runtime.Types.Utils.Call<Prisma.TypeMapCb<OmitOpts>, {
        extArgs: ExtArgs;
    }>>;
    get user(): Prisma.UserDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get driverProfile(): Prisma.DriverProfileDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get vehicle(): Prisma.VehicleDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get passengerProfile(): Prisma.PassengerProfileDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get trip(): Prisma.TripDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get tripAttribute(): Prisma.TripAttributeDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get tripStop(): Prisma.TripStopDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get tripSeat(): Prisma.TripSeatDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get tripLocation(): Prisma.TripLocationDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get booking(): Prisma.BookingDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get rideRequest(): Prisma.RideRequestDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get requestOffer(): Prisma.RequestOfferDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get rating(): Prisma.RatingDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get delayEvent(): Prisma.DelayEventDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get complaint(): Prisma.ComplaintDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get penalty(): Prisma.PenaltyDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get supportTicket(): Prisma.SupportTicketDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get supportTicketMessage(): Prisma.SupportTicketMessageDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get message(): Prisma.MessageDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get sosEvent(): Prisma.SosEventDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get notification(): Prisma.NotificationDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get notificationSetting(): Prisma.NotificationSettingDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get favoriteDriver(): Prisma.FavoriteDriverDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get favoriteRoute(): Prisma.FavoriteRouteDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get recentSearch(): Prisma.RecentSearchDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get auditLog(): Prisma.AuditLogDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get subscriptionPlan(): Prisma.SubscriptionPlanDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get driverSubscription(): Prisma.DriverSubscriptionDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get subscriptionTransaction(): Prisma.SubscriptionTransactionDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get paymentMethod(): Prisma.PaymentMethodDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get uploadedImage(): Prisma.UploadedImageDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get deletionRequest(): Prisma.DeletionRequestDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get documentReview(): Prisma.DocumentReviewDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get verificationStatusChange(): Prisma.VerificationStatusChangeDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
}
export declare function getPrismaClientClass(): PrismaClientConstructor;
