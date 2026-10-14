import * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../models.js";
import { type PrismaClient } from "./class.js";
export type * from '../models.js';
export type DMMF = typeof runtime.DMMF;
export type PrismaPromise<T> = runtime.Types.Public.PrismaPromise<T>;
export declare const PrismaClientKnownRequestError: typeof runtime.PrismaClientKnownRequestError;
export type PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
export declare const PrismaClientUnknownRequestError: typeof runtime.PrismaClientUnknownRequestError;
export type PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
export declare const PrismaClientRustPanicError: typeof runtime.PrismaClientRustPanicError;
export type PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
export declare const PrismaClientInitializationError: typeof runtime.PrismaClientInitializationError;
export type PrismaClientInitializationError = runtime.PrismaClientInitializationError;
export declare const PrismaClientValidationError: typeof runtime.PrismaClientValidationError;
export type PrismaClientValidationError = runtime.PrismaClientValidationError;
export declare const sql: typeof runtime.sqltag;
export declare const empty: runtime.Sql;
export declare const join: typeof runtime.join;
export declare const raw: typeof runtime.raw;
export declare const Sql: typeof runtime.Sql;
export type Sql = runtime.Sql;
export declare const Decimal: typeof runtime.Decimal;
export type Decimal = runtime.Decimal;
export type DecimalJsLike = runtime.DecimalJsLike;
export type Extension = runtime.Types.Extensions.UserArgs;
export declare const getExtensionContext: typeof runtime.Extensions.getExtensionContext;
export type Args<T, F extends runtime.Operation> = runtime.Types.Public.Args<T, F>;
export type Payload<T, F extends runtime.Operation = never> = runtime.Types.Public.Payload<T, F>;
export type Result<T, A, F extends runtime.Operation> = runtime.Types.Public.Result<T, A, F>;
export type Exact<A, W> = runtime.Types.Public.Exact<A, W>;
export type PrismaVersion = {
    client: string;
    engine: string;
};
export declare const prismaVersion: PrismaVersion;
export type Bytes = runtime.Bytes;
export type JsonObject = runtime.JsonObject;
export type JsonArray = runtime.JsonArray;
export type JsonValue = runtime.JsonValue;
export type InputJsonObject = runtime.InputJsonObject;
export type InputJsonArray = runtime.InputJsonArray;
export type InputJsonValue = runtime.InputJsonValue;
export declare const NullTypes: {
    DbNull: (new (secret: never) => typeof runtime.DbNull);
    JsonNull: (new (secret: never) => typeof runtime.JsonNull);
    AnyNull: (new (secret: never) => typeof runtime.AnyNull);
};
export declare const DbNull: runtime.DbNullClass;
export declare const JsonNull: runtime.JsonNullClass;
export declare const AnyNull: runtime.AnyNullClass;
type SelectAndInclude = {
    select: any;
    include: any;
};
type SelectAndOmit = {
    select: any;
    omit: any;
};
type Prisma__Pick<T, K extends keyof T> = {
    [P in K]: T[P];
};
export type Enumerable<T> = T | Array<T>;
export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
};
export type PrismaClientConstructorArgs<Options extends PrismaClientOptions> = [
    PrismaClientOptions
] extends [Options] ? PrismaClientOptions : Subset<Options, PrismaClientOptions>;
export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
} & (T extends SelectAndInclude ? 'Please either choose `select` or `include`.' : T extends SelectAndOmit ? 'Please either choose `select` or `omit`.' : {});
export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
} & K;
type Without<T, U> = {
    [P in Exclude<keyof T, keyof U>]?: never;
};
export type XOR<T, U> = T extends object ? U extends object ? ((Without<T, U> & U) | (Without<U, T> & T)) & object : U : T;
type IsObject<T extends any> = T extends Array<any> ? False : T extends Date ? False : T extends Uint8Array ? False : T extends BigInt ? False : T extends object ? True : False;
export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T;
type __Either<O extends object, K extends Key> = Omit<O, K> & {
    [P in K]: Prisma__Pick<O, P & keyof O>;
}[K];
type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>;
type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>;
type _Either<O extends object, K extends Key, strict extends Boolean> = {
    1: EitherStrict<O, K>;
    0: EitherLoose<O, K>;
}[strict];
export type Either<O extends object, K extends Key, strict extends Boolean = 1> = O extends unknown ? _Either<O, K, strict> : never;
export type Union = any;
export type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K];
} & {};
export type IntersectOf<U extends Union> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
export type Overwrite<O extends object, O1 extends object> = {
    [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
} & {};
type _Merge<U extends object> = IntersectOf<Overwrite<U, {
    [K in keyof U]-?: At<U, K>;
}>>;
type Key = string | number | symbol;
type AtStrict<O extends object, K extends Key> = O[K & keyof O];
type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
    1: AtStrict<O, K>;
    0: AtLoose<O, K>;
}[strict];
export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
} & {};
export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
} & {};
type _Record<K extends keyof any, T> = {
    [P in K]: T;
};
type NoExpand<T> = T extends unknown ? T : never;
export type AtLeast<O extends object, K extends string> = NoExpand<O extends unknown ? (K extends keyof O ? {
    [P in K]: O[P];
} & O : O) | {
    [P in keyof O as P extends K ? P : never]-?: O[P];
} & O : never>;
type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;
export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;
export type Boolean = True | False;
export type True = 1;
export type False = 0;
export type Not<B extends Boolean> = {
    0: 1;
    1: 0;
}[B];
export type Extends<A1 extends any, A2 extends any> = [A1] extends [never] ? 0 : A1 extends A2 ? 1 : 0;
export type Has<U extends Union, U1 extends Union> = Not<Extends<Exclude<U1, U>, U1>>;
export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
        0: 0;
        1: 1;
    };
    1: {
        0: 1;
        1: 1;
    };
}[B1][B2];
export type Keys<U extends Union> = U extends unknown ? keyof U : never;
export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O ? O[P] : never;
} : never;
type FieldPaths<T, U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>> = IsObject<T> extends True ? U : T;
export type GetHavingFields<T> = {
    [K in keyof T]: Or<Or<Extends<'OR', K>, Extends<'AND', K>>, Extends<'NOT', K>> extends True ? T[K] extends infer TK ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never> : never : {} extends FieldPaths<T[K]> ? never : K;
}[keyof T];
type _TupleToUnion<T> = T extends (infer E)[] ? E : never;
type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>;
export type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T;
export type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>;
export type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T;
export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>;
type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>;
export declare const ModelName: {
    readonly User: "User";
    readonly DriverProfile: "DriverProfile";
    readonly Vehicle: "Vehicle";
    readonly PassengerProfile: "PassengerProfile";
    readonly Trip: "Trip";
    readonly TripAttribute: "TripAttribute";
    readonly TripStop: "TripStop";
    readonly TripSeat: "TripSeat";
    readonly TripLocation: "TripLocation";
    readonly Booking: "Booking";
    readonly RideRequest: "RideRequest";
    readonly RequestOffer: "RequestOffer";
    readonly Rating: "Rating";
    readonly DelayEvent: "DelayEvent";
    readonly Complaint: "Complaint";
    readonly Penalty: "Penalty";
    readonly SupportTicket: "SupportTicket";
    readonly SupportTicketMessage: "SupportTicketMessage";
    readonly Message: "Message";
    readonly SosEvent: "SosEvent";
    readonly Notification: "Notification";
    readonly NotificationSetting: "NotificationSetting";
    readonly FavoriteDriver: "FavoriteDriver";
    readonly FavoriteRoute: "FavoriteRoute";
    readonly RecentSearch: "RecentSearch";
    readonly AuditLog: "AuditLog";
    readonly SubscriptionPlan: "SubscriptionPlan";
    readonly DriverSubscription: "DriverSubscription";
    readonly SubscriptionTransaction: "SubscriptionTransaction";
    readonly PaymentMethod: "PaymentMethod";
    readonly UploadedImage: "UploadedImage";
    readonly DeletionRequest: "DeletionRequest";
    readonly DocumentReview: "DocumentReview";
    readonly VerificationStatusChange: "VerificationStatusChange";
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export interface TypeMapCb<GlobalOmitOptions = {}> extends runtime.Types.Utils.Fn<{
    extArgs: runtime.Types.Extensions.InternalArgs;
}, runtime.Types.Utils.Record<string, any>> {
    returns: TypeMap<this['params']['extArgs'], GlobalOmitOptions>;
}
export type TypeMap<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
        omit: GlobalOmitOptions;
    };
    meta: {
        modelProps: "user" | "driverProfile" | "vehicle" | "passengerProfile" | "trip" | "tripAttribute" | "tripStop" | "tripSeat" | "tripLocation" | "booking" | "rideRequest" | "requestOffer" | "rating" | "delayEvent" | "complaint" | "penalty" | "supportTicket" | "supportTicketMessage" | "message" | "sosEvent" | "notification" | "notificationSetting" | "favoriteDriver" | "favoriteRoute" | "recentSearch" | "auditLog" | "subscriptionPlan" | "driverSubscription" | "subscriptionTransaction" | "paymentMethod" | "uploadedImage" | "deletionRequest" | "documentReview" | "verificationStatusChange";
        txIsolationLevel: TransactionIsolationLevel;
    };
    model: {
        User: {
            payload: Prisma.$UserPayload<ExtArgs>;
            fields: Prisma.UserFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.UserFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                findFirst: {
                    args: Prisma.UserFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                findMany: {
                    args: Prisma.UserFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>[];
                };
                create: {
                    args: Prisma.UserCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                createMany: {
                    args: Prisma.UserCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>[];
                };
                delete: {
                    args: Prisma.UserDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                update: {
                    args: Prisma.UserUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                deleteMany: {
                    args: Prisma.UserDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.UserUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>[];
                };
                upsert: {
                    args: Prisma.UserUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                aggregate: {
                    args: Prisma.UserAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateUser>;
                };
                groupBy: {
                    args: Prisma.UserGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.UserGroupByOutputType>[];
                };
                count: {
                    args: Prisma.UserCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.UserCountAggregateOutputType> | number;
                };
            };
        };
        DriverProfile: {
            payload: Prisma.$DriverProfilePayload<ExtArgs>;
            fields: Prisma.DriverProfileFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.DriverProfileFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DriverProfilePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.DriverProfileFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DriverProfilePayload>;
                };
                findFirst: {
                    args: Prisma.DriverProfileFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DriverProfilePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.DriverProfileFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DriverProfilePayload>;
                };
                findMany: {
                    args: Prisma.DriverProfileFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DriverProfilePayload>[];
                };
                create: {
                    args: Prisma.DriverProfileCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DriverProfilePayload>;
                };
                createMany: {
                    args: Prisma.DriverProfileCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.DriverProfileCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DriverProfilePayload>[];
                };
                delete: {
                    args: Prisma.DriverProfileDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DriverProfilePayload>;
                };
                update: {
                    args: Prisma.DriverProfileUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DriverProfilePayload>;
                };
                deleteMany: {
                    args: Prisma.DriverProfileDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.DriverProfileUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.DriverProfileUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DriverProfilePayload>[];
                };
                upsert: {
                    args: Prisma.DriverProfileUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DriverProfilePayload>;
                };
                aggregate: {
                    args: Prisma.DriverProfileAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateDriverProfile>;
                };
                groupBy: {
                    args: Prisma.DriverProfileGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.DriverProfileGroupByOutputType>[];
                };
                count: {
                    args: Prisma.DriverProfileCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.DriverProfileCountAggregateOutputType> | number;
                };
            };
        };
        Vehicle: {
            payload: Prisma.$VehiclePayload<ExtArgs>;
            fields: Prisma.VehicleFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.VehicleFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$VehiclePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.VehicleFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$VehiclePayload>;
                };
                findFirst: {
                    args: Prisma.VehicleFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$VehiclePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.VehicleFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$VehiclePayload>;
                };
                findMany: {
                    args: Prisma.VehicleFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$VehiclePayload>[];
                };
                create: {
                    args: Prisma.VehicleCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$VehiclePayload>;
                };
                createMany: {
                    args: Prisma.VehicleCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.VehicleCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$VehiclePayload>[];
                };
                delete: {
                    args: Prisma.VehicleDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$VehiclePayload>;
                };
                update: {
                    args: Prisma.VehicleUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$VehiclePayload>;
                };
                deleteMany: {
                    args: Prisma.VehicleDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.VehicleUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.VehicleUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$VehiclePayload>[];
                };
                upsert: {
                    args: Prisma.VehicleUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$VehiclePayload>;
                };
                aggregate: {
                    args: Prisma.VehicleAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateVehicle>;
                };
                groupBy: {
                    args: Prisma.VehicleGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.VehicleGroupByOutputType>[];
                };
                count: {
                    args: Prisma.VehicleCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.VehicleCountAggregateOutputType> | number;
                };
            };
        };
        PassengerProfile: {
            payload: Prisma.$PassengerProfilePayload<ExtArgs>;
            fields: Prisma.PassengerProfileFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.PassengerProfileFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PassengerProfilePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.PassengerProfileFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PassengerProfilePayload>;
                };
                findFirst: {
                    args: Prisma.PassengerProfileFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PassengerProfilePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.PassengerProfileFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PassengerProfilePayload>;
                };
                findMany: {
                    args: Prisma.PassengerProfileFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PassengerProfilePayload>[];
                };
                create: {
                    args: Prisma.PassengerProfileCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PassengerProfilePayload>;
                };
                createMany: {
                    args: Prisma.PassengerProfileCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.PassengerProfileCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PassengerProfilePayload>[];
                };
                delete: {
                    args: Prisma.PassengerProfileDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PassengerProfilePayload>;
                };
                update: {
                    args: Prisma.PassengerProfileUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PassengerProfilePayload>;
                };
                deleteMany: {
                    args: Prisma.PassengerProfileDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.PassengerProfileUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.PassengerProfileUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PassengerProfilePayload>[];
                };
                upsert: {
                    args: Prisma.PassengerProfileUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PassengerProfilePayload>;
                };
                aggregate: {
                    args: Prisma.PassengerProfileAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregatePassengerProfile>;
                };
                groupBy: {
                    args: Prisma.PassengerProfileGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PassengerProfileGroupByOutputType>[];
                };
                count: {
                    args: Prisma.PassengerProfileCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PassengerProfileCountAggregateOutputType> | number;
                };
            };
        };
        Trip: {
            payload: Prisma.$TripPayload<ExtArgs>;
            fields: Prisma.TripFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.TripFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.TripFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripPayload>;
                };
                findFirst: {
                    args: Prisma.TripFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.TripFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripPayload>;
                };
                findMany: {
                    args: Prisma.TripFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripPayload>[];
                };
                create: {
                    args: Prisma.TripCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripPayload>;
                };
                createMany: {
                    args: Prisma.TripCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.TripCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripPayload>[];
                };
                delete: {
                    args: Prisma.TripDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripPayload>;
                };
                update: {
                    args: Prisma.TripUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripPayload>;
                };
                deleteMany: {
                    args: Prisma.TripDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.TripUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.TripUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripPayload>[];
                };
                upsert: {
                    args: Prisma.TripUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripPayload>;
                };
                aggregate: {
                    args: Prisma.TripAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateTrip>;
                };
                groupBy: {
                    args: Prisma.TripGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TripGroupByOutputType>[];
                };
                count: {
                    args: Prisma.TripCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TripCountAggregateOutputType> | number;
                };
            };
        };
        TripAttribute: {
            payload: Prisma.$TripAttributePayload<ExtArgs>;
            fields: Prisma.TripAttributeFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.TripAttributeFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripAttributePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.TripAttributeFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripAttributePayload>;
                };
                findFirst: {
                    args: Prisma.TripAttributeFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripAttributePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.TripAttributeFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripAttributePayload>;
                };
                findMany: {
                    args: Prisma.TripAttributeFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripAttributePayload>[];
                };
                create: {
                    args: Prisma.TripAttributeCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripAttributePayload>;
                };
                createMany: {
                    args: Prisma.TripAttributeCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.TripAttributeCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripAttributePayload>[];
                };
                delete: {
                    args: Prisma.TripAttributeDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripAttributePayload>;
                };
                update: {
                    args: Prisma.TripAttributeUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripAttributePayload>;
                };
                deleteMany: {
                    args: Prisma.TripAttributeDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.TripAttributeUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.TripAttributeUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripAttributePayload>[];
                };
                upsert: {
                    args: Prisma.TripAttributeUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripAttributePayload>;
                };
                aggregate: {
                    args: Prisma.TripAttributeAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateTripAttribute>;
                };
                groupBy: {
                    args: Prisma.TripAttributeGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TripAttributeGroupByOutputType>[];
                };
                count: {
                    args: Prisma.TripAttributeCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TripAttributeCountAggregateOutputType> | number;
                };
            };
        };
        TripStop: {
            payload: Prisma.$TripStopPayload<ExtArgs>;
            fields: Prisma.TripStopFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.TripStopFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripStopPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.TripStopFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripStopPayload>;
                };
                findFirst: {
                    args: Prisma.TripStopFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripStopPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.TripStopFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripStopPayload>;
                };
                findMany: {
                    args: Prisma.TripStopFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripStopPayload>[];
                };
                create: {
                    args: Prisma.TripStopCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripStopPayload>;
                };
                createMany: {
                    args: Prisma.TripStopCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.TripStopCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripStopPayload>[];
                };
                delete: {
                    args: Prisma.TripStopDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripStopPayload>;
                };
                update: {
                    args: Prisma.TripStopUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripStopPayload>;
                };
                deleteMany: {
                    args: Prisma.TripStopDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.TripStopUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.TripStopUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripStopPayload>[];
                };
                upsert: {
                    args: Prisma.TripStopUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripStopPayload>;
                };
                aggregate: {
                    args: Prisma.TripStopAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateTripStop>;
                };
                groupBy: {
                    args: Prisma.TripStopGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TripStopGroupByOutputType>[];
                };
                count: {
                    args: Prisma.TripStopCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TripStopCountAggregateOutputType> | number;
                };
            };
        };
        TripSeat: {
            payload: Prisma.$TripSeatPayload<ExtArgs>;
            fields: Prisma.TripSeatFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.TripSeatFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripSeatPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.TripSeatFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripSeatPayload>;
                };
                findFirst: {
                    args: Prisma.TripSeatFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripSeatPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.TripSeatFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripSeatPayload>;
                };
                findMany: {
                    args: Prisma.TripSeatFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripSeatPayload>[];
                };
                create: {
                    args: Prisma.TripSeatCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripSeatPayload>;
                };
                createMany: {
                    args: Prisma.TripSeatCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.TripSeatCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripSeatPayload>[];
                };
                delete: {
                    args: Prisma.TripSeatDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripSeatPayload>;
                };
                update: {
                    args: Prisma.TripSeatUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripSeatPayload>;
                };
                deleteMany: {
                    args: Prisma.TripSeatDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.TripSeatUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.TripSeatUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripSeatPayload>[];
                };
                upsert: {
                    args: Prisma.TripSeatUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripSeatPayload>;
                };
                aggregate: {
                    args: Prisma.TripSeatAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateTripSeat>;
                };
                groupBy: {
                    args: Prisma.TripSeatGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TripSeatGroupByOutputType>[];
                };
                count: {
                    args: Prisma.TripSeatCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TripSeatCountAggregateOutputType> | number;
                };
            };
        };
        TripLocation: {
            payload: Prisma.$TripLocationPayload<ExtArgs>;
            fields: Prisma.TripLocationFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.TripLocationFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripLocationPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.TripLocationFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripLocationPayload>;
                };
                findFirst: {
                    args: Prisma.TripLocationFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripLocationPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.TripLocationFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripLocationPayload>;
                };
                findMany: {
                    args: Prisma.TripLocationFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripLocationPayload>[];
                };
                create: {
                    args: Prisma.TripLocationCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripLocationPayload>;
                };
                createMany: {
                    args: Prisma.TripLocationCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.TripLocationCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripLocationPayload>[];
                };
                delete: {
                    args: Prisma.TripLocationDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripLocationPayload>;
                };
                update: {
                    args: Prisma.TripLocationUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripLocationPayload>;
                };
                deleteMany: {
                    args: Prisma.TripLocationDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.TripLocationUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.TripLocationUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripLocationPayload>[];
                };
                upsert: {
                    args: Prisma.TripLocationUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TripLocationPayload>;
                };
                aggregate: {
                    args: Prisma.TripLocationAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateTripLocation>;
                };
                groupBy: {
                    args: Prisma.TripLocationGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TripLocationGroupByOutputType>[];
                };
                count: {
                    args: Prisma.TripLocationCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TripLocationCountAggregateOutputType> | number;
                };
            };
        };
        Booking: {
            payload: Prisma.$BookingPayload<ExtArgs>;
            fields: Prisma.BookingFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.BookingFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BookingPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.BookingFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BookingPayload>;
                };
                findFirst: {
                    args: Prisma.BookingFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BookingPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.BookingFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BookingPayload>;
                };
                findMany: {
                    args: Prisma.BookingFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BookingPayload>[];
                };
                create: {
                    args: Prisma.BookingCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BookingPayload>;
                };
                createMany: {
                    args: Prisma.BookingCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.BookingCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BookingPayload>[];
                };
                delete: {
                    args: Prisma.BookingDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BookingPayload>;
                };
                update: {
                    args: Prisma.BookingUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BookingPayload>;
                };
                deleteMany: {
                    args: Prisma.BookingDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.BookingUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.BookingUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BookingPayload>[];
                };
                upsert: {
                    args: Prisma.BookingUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BookingPayload>;
                };
                aggregate: {
                    args: Prisma.BookingAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateBooking>;
                };
                groupBy: {
                    args: Prisma.BookingGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.BookingGroupByOutputType>[];
                };
                count: {
                    args: Prisma.BookingCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.BookingCountAggregateOutputType> | number;
                };
            };
        };
        RideRequest: {
            payload: Prisma.$RideRequestPayload<ExtArgs>;
            fields: Prisma.RideRequestFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.RideRequestFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RideRequestPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.RideRequestFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RideRequestPayload>;
                };
                findFirst: {
                    args: Prisma.RideRequestFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RideRequestPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.RideRequestFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RideRequestPayload>;
                };
                findMany: {
                    args: Prisma.RideRequestFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RideRequestPayload>[];
                };
                create: {
                    args: Prisma.RideRequestCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RideRequestPayload>;
                };
                createMany: {
                    args: Prisma.RideRequestCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.RideRequestCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RideRequestPayload>[];
                };
                delete: {
                    args: Prisma.RideRequestDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RideRequestPayload>;
                };
                update: {
                    args: Prisma.RideRequestUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RideRequestPayload>;
                };
                deleteMany: {
                    args: Prisma.RideRequestDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.RideRequestUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.RideRequestUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RideRequestPayload>[];
                };
                upsert: {
                    args: Prisma.RideRequestUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RideRequestPayload>;
                };
                aggregate: {
                    args: Prisma.RideRequestAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateRideRequest>;
                };
                groupBy: {
                    args: Prisma.RideRequestGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.RideRequestGroupByOutputType>[];
                };
                count: {
                    args: Prisma.RideRequestCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.RideRequestCountAggregateOutputType> | number;
                };
            };
        };
        RequestOffer: {
            payload: Prisma.$RequestOfferPayload<ExtArgs>;
            fields: Prisma.RequestOfferFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.RequestOfferFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RequestOfferPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.RequestOfferFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RequestOfferPayload>;
                };
                findFirst: {
                    args: Prisma.RequestOfferFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RequestOfferPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.RequestOfferFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RequestOfferPayload>;
                };
                findMany: {
                    args: Prisma.RequestOfferFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RequestOfferPayload>[];
                };
                create: {
                    args: Prisma.RequestOfferCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RequestOfferPayload>;
                };
                createMany: {
                    args: Prisma.RequestOfferCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.RequestOfferCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RequestOfferPayload>[];
                };
                delete: {
                    args: Prisma.RequestOfferDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RequestOfferPayload>;
                };
                update: {
                    args: Prisma.RequestOfferUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RequestOfferPayload>;
                };
                deleteMany: {
                    args: Prisma.RequestOfferDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.RequestOfferUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.RequestOfferUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RequestOfferPayload>[];
                };
                upsert: {
                    args: Prisma.RequestOfferUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RequestOfferPayload>;
                };
                aggregate: {
                    args: Prisma.RequestOfferAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateRequestOffer>;
                };
                groupBy: {
                    args: Prisma.RequestOfferGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.RequestOfferGroupByOutputType>[];
                };
                count: {
                    args: Prisma.RequestOfferCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.RequestOfferCountAggregateOutputType> | number;
                };
            };
        };
        Rating: {
            payload: Prisma.$RatingPayload<ExtArgs>;
            fields: Prisma.RatingFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.RatingFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RatingPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.RatingFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RatingPayload>;
                };
                findFirst: {
                    args: Prisma.RatingFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RatingPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.RatingFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RatingPayload>;
                };
                findMany: {
                    args: Prisma.RatingFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RatingPayload>[];
                };
                create: {
                    args: Prisma.RatingCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RatingPayload>;
                };
                createMany: {
                    args: Prisma.RatingCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.RatingCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RatingPayload>[];
                };
                delete: {
                    args: Prisma.RatingDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RatingPayload>;
                };
                update: {
                    args: Prisma.RatingUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RatingPayload>;
                };
                deleteMany: {
                    args: Prisma.RatingDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.RatingUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.RatingUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RatingPayload>[];
                };
                upsert: {
                    args: Prisma.RatingUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RatingPayload>;
                };
                aggregate: {
                    args: Prisma.RatingAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateRating>;
                };
                groupBy: {
                    args: Prisma.RatingGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.RatingGroupByOutputType>[];
                };
                count: {
                    args: Prisma.RatingCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.RatingCountAggregateOutputType> | number;
                };
            };
        };
        DelayEvent: {
            payload: Prisma.$DelayEventPayload<ExtArgs>;
            fields: Prisma.DelayEventFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.DelayEventFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DelayEventPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.DelayEventFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DelayEventPayload>;
                };
                findFirst: {
                    args: Prisma.DelayEventFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DelayEventPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.DelayEventFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DelayEventPayload>;
                };
                findMany: {
                    args: Prisma.DelayEventFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DelayEventPayload>[];
                };
                create: {
                    args: Prisma.DelayEventCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DelayEventPayload>;
                };
                createMany: {
                    args: Prisma.DelayEventCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.DelayEventCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DelayEventPayload>[];
                };
                delete: {
                    args: Prisma.DelayEventDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DelayEventPayload>;
                };
                update: {
                    args: Prisma.DelayEventUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DelayEventPayload>;
                };
                deleteMany: {
                    args: Prisma.DelayEventDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.DelayEventUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.DelayEventUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DelayEventPayload>[];
                };
                upsert: {
                    args: Prisma.DelayEventUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DelayEventPayload>;
                };
                aggregate: {
                    args: Prisma.DelayEventAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateDelayEvent>;
                };
                groupBy: {
                    args: Prisma.DelayEventGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.DelayEventGroupByOutputType>[];
                };
                count: {
                    args: Prisma.DelayEventCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.DelayEventCountAggregateOutputType> | number;
                };
            };
        };
        Complaint: {
            payload: Prisma.$ComplaintPayload<ExtArgs>;
            fields: Prisma.ComplaintFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ComplaintFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ComplaintPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ComplaintFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ComplaintPayload>;
                };
                findFirst: {
                    args: Prisma.ComplaintFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ComplaintPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ComplaintFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ComplaintPayload>;
                };
                findMany: {
                    args: Prisma.ComplaintFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ComplaintPayload>[];
                };
                create: {
                    args: Prisma.ComplaintCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ComplaintPayload>;
                };
                createMany: {
                    args: Prisma.ComplaintCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.ComplaintCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ComplaintPayload>[];
                };
                delete: {
                    args: Prisma.ComplaintDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ComplaintPayload>;
                };
                update: {
                    args: Prisma.ComplaintUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ComplaintPayload>;
                };
                deleteMany: {
                    args: Prisma.ComplaintDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ComplaintUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.ComplaintUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ComplaintPayload>[];
                };
                upsert: {
                    args: Prisma.ComplaintUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ComplaintPayload>;
                };
                aggregate: {
                    args: Prisma.ComplaintAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateComplaint>;
                };
                groupBy: {
                    args: Prisma.ComplaintGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ComplaintGroupByOutputType>[];
                };
                count: {
                    args: Prisma.ComplaintCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ComplaintCountAggregateOutputType> | number;
                };
            };
        };
        Penalty: {
            payload: Prisma.$PenaltyPayload<ExtArgs>;
            fields: Prisma.PenaltyFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.PenaltyFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PenaltyPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.PenaltyFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PenaltyPayload>;
                };
                findFirst: {
                    args: Prisma.PenaltyFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PenaltyPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.PenaltyFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PenaltyPayload>;
                };
                findMany: {
                    args: Prisma.PenaltyFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PenaltyPayload>[];
                };
                create: {
                    args: Prisma.PenaltyCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PenaltyPayload>;
                };
                createMany: {
                    args: Prisma.PenaltyCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.PenaltyCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PenaltyPayload>[];
                };
                delete: {
                    args: Prisma.PenaltyDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PenaltyPayload>;
                };
                update: {
                    args: Prisma.PenaltyUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PenaltyPayload>;
                };
                deleteMany: {
                    args: Prisma.PenaltyDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.PenaltyUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.PenaltyUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PenaltyPayload>[];
                };
                upsert: {
                    args: Prisma.PenaltyUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PenaltyPayload>;
                };
                aggregate: {
                    args: Prisma.PenaltyAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregatePenalty>;
                };
                groupBy: {
                    args: Prisma.PenaltyGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PenaltyGroupByOutputType>[];
                };
                count: {
                    args: Prisma.PenaltyCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PenaltyCountAggregateOutputType> | number;
                };
            };
        };
        SupportTicket: {
            payload: Prisma.$SupportTicketPayload<ExtArgs>;
            fields: Prisma.SupportTicketFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.SupportTicketFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SupportTicketPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.SupportTicketFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SupportTicketPayload>;
                };
                findFirst: {
                    args: Prisma.SupportTicketFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SupportTicketPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.SupportTicketFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SupportTicketPayload>;
                };
                findMany: {
                    args: Prisma.SupportTicketFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SupportTicketPayload>[];
                };
                create: {
                    args: Prisma.SupportTicketCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SupportTicketPayload>;
                };
                createMany: {
                    args: Prisma.SupportTicketCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.SupportTicketCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SupportTicketPayload>[];
                };
                delete: {
                    args: Prisma.SupportTicketDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SupportTicketPayload>;
                };
                update: {
                    args: Prisma.SupportTicketUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SupportTicketPayload>;
                };
                deleteMany: {
                    args: Prisma.SupportTicketDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.SupportTicketUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.SupportTicketUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SupportTicketPayload>[];
                };
                upsert: {
                    args: Prisma.SupportTicketUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SupportTicketPayload>;
                };
                aggregate: {
                    args: Prisma.SupportTicketAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateSupportTicket>;
                };
                groupBy: {
                    args: Prisma.SupportTicketGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SupportTicketGroupByOutputType>[];
                };
                count: {
                    args: Prisma.SupportTicketCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SupportTicketCountAggregateOutputType> | number;
                };
            };
        };
        SupportTicketMessage: {
            payload: Prisma.$SupportTicketMessagePayload<ExtArgs>;
            fields: Prisma.SupportTicketMessageFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.SupportTicketMessageFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SupportTicketMessagePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.SupportTicketMessageFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SupportTicketMessagePayload>;
                };
                findFirst: {
                    args: Prisma.SupportTicketMessageFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SupportTicketMessagePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.SupportTicketMessageFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SupportTicketMessagePayload>;
                };
                findMany: {
                    args: Prisma.SupportTicketMessageFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SupportTicketMessagePayload>[];
                };
                create: {
                    args: Prisma.SupportTicketMessageCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SupportTicketMessagePayload>;
                };
                createMany: {
                    args: Prisma.SupportTicketMessageCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.SupportTicketMessageCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SupportTicketMessagePayload>[];
                };
                delete: {
                    args: Prisma.SupportTicketMessageDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SupportTicketMessagePayload>;
                };
                update: {
                    args: Prisma.SupportTicketMessageUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SupportTicketMessagePayload>;
                };
                deleteMany: {
                    args: Prisma.SupportTicketMessageDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.SupportTicketMessageUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.SupportTicketMessageUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SupportTicketMessagePayload>[];
                };
                upsert: {
                    args: Prisma.SupportTicketMessageUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SupportTicketMessagePayload>;
                };
                aggregate: {
                    args: Prisma.SupportTicketMessageAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateSupportTicketMessage>;
                };
                groupBy: {
                    args: Prisma.SupportTicketMessageGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SupportTicketMessageGroupByOutputType>[];
                };
                count: {
                    args: Prisma.SupportTicketMessageCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SupportTicketMessageCountAggregateOutputType> | number;
                };
            };
        };
        Message: {
            payload: Prisma.$MessagePayload<ExtArgs>;
            fields: Prisma.MessageFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.MessageFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessagePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.MessageFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessagePayload>;
                };
                findFirst: {
                    args: Prisma.MessageFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessagePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.MessageFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessagePayload>;
                };
                findMany: {
                    args: Prisma.MessageFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessagePayload>[];
                };
                create: {
                    args: Prisma.MessageCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessagePayload>;
                };
                createMany: {
                    args: Prisma.MessageCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.MessageCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessagePayload>[];
                };
                delete: {
                    args: Prisma.MessageDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessagePayload>;
                };
                update: {
                    args: Prisma.MessageUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessagePayload>;
                };
                deleteMany: {
                    args: Prisma.MessageDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.MessageUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.MessageUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessagePayload>[];
                };
                upsert: {
                    args: Prisma.MessageUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MessagePayload>;
                };
                aggregate: {
                    args: Prisma.MessageAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateMessage>;
                };
                groupBy: {
                    args: Prisma.MessageGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.MessageGroupByOutputType>[];
                };
                count: {
                    args: Prisma.MessageCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.MessageCountAggregateOutputType> | number;
                };
            };
        };
        SosEvent: {
            payload: Prisma.$SosEventPayload<ExtArgs>;
            fields: Prisma.SosEventFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.SosEventFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SosEventPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.SosEventFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SosEventPayload>;
                };
                findFirst: {
                    args: Prisma.SosEventFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SosEventPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.SosEventFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SosEventPayload>;
                };
                findMany: {
                    args: Prisma.SosEventFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SosEventPayload>[];
                };
                create: {
                    args: Prisma.SosEventCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SosEventPayload>;
                };
                createMany: {
                    args: Prisma.SosEventCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.SosEventCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SosEventPayload>[];
                };
                delete: {
                    args: Prisma.SosEventDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SosEventPayload>;
                };
                update: {
                    args: Prisma.SosEventUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SosEventPayload>;
                };
                deleteMany: {
                    args: Prisma.SosEventDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.SosEventUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.SosEventUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SosEventPayload>[];
                };
                upsert: {
                    args: Prisma.SosEventUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SosEventPayload>;
                };
                aggregate: {
                    args: Prisma.SosEventAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateSosEvent>;
                };
                groupBy: {
                    args: Prisma.SosEventGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SosEventGroupByOutputType>[];
                };
                count: {
                    args: Prisma.SosEventCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SosEventCountAggregateOutputType> | number;
                };
            };
        };
        Notification: {
            payload: Prisma.$NotificationPayload<ExtArgs>;
            fields: Prisma.NotificationFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.NotificationFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$NotificationPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.NotificationFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$NotificationPayload>;
                };
                findFirst: {
                    args: Prisma.NotificationFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$NotificationPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.NotificationFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$NotificationPayload>;
                };
                findMany: {
                    args: Prisma.NotificationFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$NotificationPayload>[];
                };
                create: {
                    args: Prisma.NotificationCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$NotificationPayload>;
                };
                createMany: {
                    args: Prisma.NotificationCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.NotificationCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$NotificationPayload>[];
                };
                delete: {
                    args: Prisma.NotificationDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$NotificationPayload>;
                };
                update: {
                    args: Prisma.NotificationUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$NotificationPayload>;
                };
                deleteMany: {
                    args: Prisma.NotificationDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.NotificationUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.NotificationUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$NotificationPayload>[];
                };
                upsert: {
                    args: Prisma.NotificationUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$NotificationPayload>;
                };
                aggregate: {
                    args: Prisma.NotificationAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateNotification>;
                };
                groupBy: {
                    args: Prisma.NotificationGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.NotificationGroupByOutputType>[];
                };
                count: {
                    args: Prisma.NotificationCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.NotificationCountAggregateOutputType> | number;
                };
            };
        };
        NotificationSetting: {
            payload: Prisma.$NotificationSettingPayload<ExtArgs>;
            fields: Prisma.NotificationSettingFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.NotificationSettingFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$NotificationSettingPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.NotificationSettingFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$NotificationSettingPayload>;
                };
                findFirst: {
                    args: Prisma.NotificationSettingFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$NotificationSettingPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.NotificationSettingFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$NotificationSettingPayload>;
                };
                findMany: {
                    args: Prisma.NotificationSettingFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$NotificationSettingPayload>[];
                };
                create: {
                    args: Prisma.NotificationSettingCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$NotificationSettingPayload>;
                };
                createMany: {
                    args: Prisma.NotificationSettingCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.NotificationSettingCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$NotificationSettingPayload>[];
                };
                delete: {
                    args: Prisma.NotificationSettingDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$NotificationSettingPayload>;
                };
                update: {
                    args: Prisma.NotificationSettingUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$NotificationSettingPayload>;
                };
                deleteMany: {
                    args: Prisma.NotificationSettingDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.NotificationSettingUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.NotificationSettingUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$NotificationSettingPayload>[];
                };
                upsert: {
                    args: Prisma.NotificationSettingUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$NotificationSettingPayload>;
                };
                aggregate: {
                    args: Prisma.NotificationSettingAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateNotificationSetting>;
                };
                groupBy: {
                    args: Prisma.NotificationSettingGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.NotificationSettingGroupByOutputType>[];
                };
                count: {
                    args: Prisma.NotificationSettingCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.NotificationSettingCountAggregateOutputType> | number;
                };
            };
        };
        FavoriteDriver: {
            payload: Prisma.$FavoriteDriverPayload<ExtArgs>;
            fields: Prisma.FavoriteDriverFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.FavoriteDriverFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FavoriteDriverPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.FavoriteDriverFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FavoriteDriverPayload>;
                };
                findFirst: {
                    args: Prisma.FavoriteDriverFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FavoriteDriverPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.FavoriteDriverFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FavoriteDriverPayload>;
                };
                findMany: {
                    args: Prisma.FavoriteDriverFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FavoriteDriverPayload>[];
                };
                create: {
                    args: Prisma.FavoriteDriverCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FavoriteDriverPayload>;
                };
                createMany: {
                    args: Prisma.FavoriteDriverCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.FavoriteDriverCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FavoriteDriverPayload>[];
                };
                delete: {
                    args: Prisma.FavoriteDriverDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FavoriteDriverPayload>;
                };
                update: {
                    args: Prisma.FavoriteDriverUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FavoriteDriverPayload>;
                };
                deleteMany: {
                    args: Prisma.FavoriteDriverDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.FavoriteDriverUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.FavoriteDriverUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FavoriteDriverPayload>[];
                };
                upsert: {
                    args: Prisma.FavoriteDriverUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FavoriteDriverPayload>;
                };
                aggregate: {
                    args: Prisma.FavoriteDriverAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateFavoriteDriver>;
                };
                groupBy: {
                    args: Prisma.FavoriteDriverGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.FavoriteDriverGroupByOutputType>[];
                };
                count: {
                    args: Prisma.FavoriteDriverCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.FavoriteDriverCountAggregateOutputType> | number;
                };
            };
        };
        FavoriteRoute: {
            payload: Prisma.$FavoriteRoutePayload<ExtArgs>;
            fields: Prisma.FavoriteRouteFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.FavoriteRouteFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FavoriteRoutePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.FavoriteRouteFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FavoriteRoutePayload>;
                };
                findFirst: {
                    args: Prisma.FavoriteRouteFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FavoriteRoutePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.FavoriteRouteFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FavoriteRoutePayload>;
                };
                findMany: {
                    args: Prisma.FavoriteRouteFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FavoriteRoutePayload>[];
                };
                create: {
                    args: Prisma.FavoriteRouteCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FavoriteRoutePayload>;
                };
                createMany: {
                    args: Prisma.FavoriteRouteCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.FavoriteRouteCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FavoriteRoutePayload>[];
                };
                delete: {
                    args: Prisma.FavoriteRouteDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FavoriteRoutePayload>;
                };
                update: {
                    args: Prisma.FavoriteRouteUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FavoriteRoutePayload>;
                };
                deleteMany: {
                    args: Prisma.FavoriteRouteDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.FavoriteRouteUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.FavoriteRouteUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FavoriteRoutePayload>[];
                };
                upsert: {
                    args: Prisma.FavoriteRouteUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$FavoriteRoutePayload>;
                };
                aggregate: {
                    args: Prisma.FavoriteRouteAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateFavoriteRoute>;
                };
                groupBy: {
                    args: Prisma.FavoriteRouteGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.FavoriteRouteGroupByOutputType>[];
                };
                count: {
                    args: Prisma.FavoriteRouteCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.FavoriteRouteCountAggregateOutputType> | number;
                };
            };
        };
        RecentSearch: {
            payload: Prisma.$RecentSearchPayload<ExtArgs>;
            fields: Prisma.RecentSearchFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.RecentSearchFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RecentSearchPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.RecentSearchFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RecentSearchPayload>;
                };
                findFirst: {
                    args: Prisma.RecentSearchFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RecentSearchPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.RecentSearchFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RecentSearchPayload>;
                };
                findMany: {
                    args: Prisma.RecentSearchFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RecentSearchPayload>[];
                };
                create: {
                    args: Prisma.RecentSearchCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RecentSearchPayload>;
                };
                createMany: {
                    args: Prisma.RecentSearchCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.RecentSearchCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RecentSearchPayload>[];
                };
                delete: {
                    args: Prisma.RecentSearchDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RecentSearchPayload>;
                };
                update: {
                    args: Prisma.RecentSearchUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RecentSearchPayload>;
                };
                deleteMany: {
                    args: Prisma.RecentSearchDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.RecentSearchUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.RecentSearchUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RecentSearchPayload>[];
                };
                upsert: {
                    args: Prisma.RecentSearchUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RecentSearchPayload>;
                };
                aggregate: {
                    args: Prisma.RecentSearchAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateRecentSearch>;
                };
                groupBy: {
                    args: Prisma.RecentSearchGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.RecentSearchGroupByOutputType>[];
                };
                count: {
                    args: Prisma.RecentSearchCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.RecentSearchCountAggregateOutputType> | number;
                };
            };
        };
        AuditLog: {
            payload: Prisma.$AuditLogPayload<ExtArgs>;
            fields: Prisma.AuditLogFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.AuditLogFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AuditLogPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.AuditLogFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AuditLogPayload>;
                };
                findFirst: {
                    args: Prisma.AuditLogFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AuditLogPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.AuditLogFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AuditLogPayload>;
                };
                findMany: {
                    args: Prisma.AuditLogFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AuditLogPayload>[];
                };
                create: {
                    args: Prisma.AuditLogCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AuditLogPayload>;
                };
                createMany: {
                    args: Prisma.AuditLogCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.AuditLogCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AuditLogPayload>[];
                };
                delete: {
                    args: Prisma.AuditLogDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AuditLogPayload>;
                };
                update: {
                    args: Prisma.AuditLogUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AuditLogPayload>;
                };
                deleteMany: {
                    args: Prisma.AuditLogDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.AuditLogUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.AuditLogUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AuditLogPayload>[];
                };
                upsert: {
                    args: Prisma.AuditLogUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AuditLogPayload>;
                };
                aggregate: {
                    args: Prisma.AuditLogAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateAuditLog>;
                };
                groupBy: {
                    args: Prisma.AuditLogGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AuditLogGroupByOutputType>[];
                };
                count: {
                    args: Prisma.AuditLogCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AuditLogCountAggregateOutputType> | number;
                };
            };
        };
        SubscriptionPlan: {
            payload: Prisma.$SubscriptionPlanPayload<ExtArgs>;
            fields: Prisma.SubscriptionPlanFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.SubscriptionPlanFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPlanPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.SubscriptionPlanFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPlanPayload>;
                };
                findFirst: {
                    args: Prisma.SubscriptionPlanFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPlanPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.SubscriptionPlanFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPlanPayload>;
                };
                findMany: {
                    args: Prisma.SubscriptionPlanFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPlanPayload>[];
                };
                create: {
                    args: Prisma.SubscriptionPlanCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPlanPayload>;
                };
                createMany: {
                    args: Prisma.SubscriptionPlanCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.SubscriptionPlanCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPlanPayload>[];
                };
                delete: {
                    args: Prisma.SubscriptionPlanDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPlanPayload>;
                };
                update: {
                    args: Prisma.SubscriptionPlanUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPlanPayload>;
                };
                deleteMany: {
                    args: Prisma.SubscriptionPlanDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.SubscriptionPlanUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.SubscriptionPlanUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPlanPayload>[];
                };
                upsert: {
                    args: Prisma.SubscriptionPlanUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPlanPayload>;
                };
                aggregate: {
                    args: Prisma.SubscriptionPlanAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateSubscriptionPlan>;
                };
                groupBy: {
                    args: Prisma.SubscriptionPlanGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SubscriptionPlanGroupByOutputType>[];
                };
                count: {
                    args: Prisma.SubscriptionPlanCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SubscriptionPlanCountAggregateOutputType> | number;
                };
            };
        };
        DriverSubscription: {
            payload: Prisma.$DriverSubscriptionPayload<ExtArgs>;
            fields: Prisma.DriverSubscriptionFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.DriverSubscriptionFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DriverSubscriptionPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.DriverSubscriptionFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DriverSubscriptionPayload>;
                };
                findFirst: {
                    args: Prisma.DriverSubscriptionFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DriverSubscriptionPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.DriverSubscriptionFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DriverSubscriptionPayload>;
                };
                findMany: {
                    args: Prisma.DriverSubscriptionFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DriverSubscriptionPayload>[];
                };
                create: {
                    args: Prisma.DriverSubscriptionCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DriverSubscriptionPayload>;
                };
                createMany: {
                    args: Prisma.DriverSubscriptionCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.DriverSubscriptionCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DriverSubscriptionPayload>[];
                };
                delete: {
                    args: Prisma.DriverSubscriptionDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DriverSubscriptionPayload>;
                };
                update: {
                    args: Prisma.DriverSubscriptionUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DriverSubscriptionPayload>;
                };
                deleteMany: {
                    args: Prisma.DriverSubscriptionDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.DriverSubscriptionUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.DriverSubscriptionUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DriverSubscriptionPayload>[];
                };
                upsert: {
                    args: Prisma.DriverSubscriptionUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DriverSubscriptionPayload>;
                };
                aggregate: {
                    args: Prisma.DriverSubscriptionAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateDriverSubscription>;
                };
                groupBy: {
                    args: Prisma.DriverSubscriptionGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.DriverSubscriptionGroupByOutputType>[];
                };
                count: {
                    args: Prisma.DriverSubscriptionCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.DriverSubscriptionCountAggregateOutputType> | number;
                };
            };
        };
        SubscriptionTransaction: {
            payload: Prisma.$SubscriptionTransactionPayload<ExtArgs>;
            fields: Prisma.SubscriptionTransactionFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.SubscriptionTransactionFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionTransactionPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.SubscriptionTransactionFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionTransactionPayload>;
                };
                findFirst: {
                    args: Prisma.SubscriptionTransactionFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionTransactionPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.SubscriptionTransactionFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionTransactionPayload>;
                };
                findMany: {
                    args: Prisma.SubscriptionTransactionFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionTransactionPayload>[];
                };
                create: {
                    args: Prisma.SubscriptionTransactionCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionTransactionPayload>;
                };
                createMany: {
                    args: Prisma.SubscriptionTransactionCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.SubscriptionTransactionCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionTransactionPayload>[];
                };
                delete: {
                    args: Prisma.SubscriptionTransactionDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionTransactionPayload>;
                };
                update: {
                    args: Prisma.SubscriptionTransactionUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionTransactionPayload>;
                };
                deleteMany: {
                    args: Prisma.SubscriptionTransactionDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.SubscriptionTransactionUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.SubscriptionTransactionUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionTransactionPayload>[];
                };
                upsert: {
                    args: Prisma.SubscriptionTransactionUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionTransactionPayload>;
                };
                aggregate: {
                    args: Prisma.SubscriptionTransactionAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateSubscriptionTransaction>;
                };
                groupBy: {
                    args: Prisma.SubscriptionTransactionGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SubscriptionTransactionGroupByOutputType>[];
                };
                count: {
                    args: Prisma.SubscriptionTransactionCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SubscriptionTransactionCountAggregateOutputType> | number;
                };
            };
        };
        PaymentMethod: {
            payload: Prisma.$PaymentMethodPayload<ExtArgs>;
            fields: Prisma.PaymentMethodFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.PaymentMethodFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PaymentMethodPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.PaymentMethodFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PaymentMethodPayload>;
                };
                findFirst: {
                    args: Prisma.PaymentMethodFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PaymentMethodPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.PaymentMethodFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PaymentMethodPayload>;
                };
                findMany: {
                    args: Prisma.PaymentMethodFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PaymentMethodPayload>[];
                };
                create: {
                    args: Prisma.PaymentMethodCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PaymentMethodPayload>;
                };
                createMany: {
                    args: Prisma.PaymentMethodCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.PaymentMethodCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PaymentMethodPayload>[];
                };
                delete: {
                    args: Prisma.PaymentMethodDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PaymentMethodPayload>;
                };
                update: {
                    args: Prisma.PaymentMethodUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PaymentMethodPayload>;
                };
                deleteMany: {
                    args: Prisma.PaymentMethodDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.PaymentMethodUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.PaymentMethodUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PaymentMethodPayload>[];
                };
                upsert: {
                    args: Prisma.PaymentMethodUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PaymentMethodPayload>;
                };
                aggregate: {
                    args: Prisma.PaymentMethodAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregatePaymentMethod>;
                };
                groupBy: {
                    args: Prisma.PaymentMethodGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PaymentMethodGroupByOutputType>[];
                };
                count: {
                    args: Prisma.PaymentMethodCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PaymentMethodCountAggregateOutputType> | number;
                };
            };
        };
        UploadedImage: {
            payload: Prisma.$UploadedImagePayload<ExtArgs>;
            fields: Prisma.UploadedImageFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.UploadedImageFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UploadedImagePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.UploadedImageFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UploadedImagePayload>;
                };
                findFirst: {
                    args: Prisma.UploadedImageFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UploadedImagePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.UploadedImageFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UploadedImagePayload>;
                };
                findMany: {
                    args: Prisma.UploadedImageFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UploadedImagePayload>[];
                };
                create: {
                    args: Prisma.UploadedImageCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UploadedImagePayload>;
                };
                createMany: {
                    args: Prisma.UploadedImageCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.UploadedImageCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UploadedImagePayload>[];
                };
                delete: {
                    args: Prisma.UploadedImageDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UploadedImagePayload>;
                };
                update: {
                    args: Prisma.UploadedImageUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UploadedImagePayload>;
                };
                deleteMany: {
                    args: Prisma.UploadedImageDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.UploadedImageUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.UploadedImageUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UploadedImagePayload>[];
                };
                upsert: {
                    args: Prisma.UploadedImageUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UploadedImagePayload>;
                };
                aggregate: {
                    args: Prisma.UploadedImageAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateUploadedImage>;
                };
                groupBy: {
                    args: Prisma.UploadedImageGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.UploadedImageGroupByOutputType>[];
                };
                count: {
                    args: Prisma.UploadedImageCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.UploadedImageCountAggregateOutputType> | number;
                };
            };
        };
        DeletionRequest: {
            payload: Prisma.$DeletionRequestPayload<ExtArgs>;
            fields: Prisma.DeletionRequestFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.DeletionRequestFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DeletionRequestPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.DeletionRequestFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DeletionRequestPayload>;
                };
                findFirst: {
                    args: Prisma.DeletionRequestFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DeletionRequestPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.DeletionRequestFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DeletionRequestPayload>;
                };
                findMany: {
                    args: Prisma.DeletionRequestFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DeletionRequestPayload>[];
                };
                create: {
                    args: Prisma.DeletionRequestCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DeletionRequestPayload>;
                };
                createMany: {
                    args: Prisma.DeletionRequestCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.DeletionRequestCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DeletionRequestPayload>[];
                };
                delete: {
                    args: Prisma.DeletionRequestDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DeletionRequestPayload>;
                };
                update: {
                    args: Prisma.DeletionRequestUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DeletionRequestPayload>;
                };
                deleteMany: {
                    args: Prisma.DeletionRequestDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.DeletionRequestUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.DeletionRequestUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DeletionRequestPayload>[];
                };
                upsert: {
                    args: Prisma.DeletionRequestUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DeletionRequestPayload>;
                };
                aggregate: {
                    args: Prisma.DeletionRequestAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateDeletionRequest>;
                };
                groupBy: {
                    args: Prisma.DeletionRequestGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.DeletionRequestGroupByOutputType>[];
                };
                count: {
                    args: Prisma.DeletionRequestCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.DeletionRequestCountAggregateOutputType> | number;
                };
            };
        };
        DocumentReview: {
            payload: Prisma.$DocumentReviewPayload<ExtArgs>;
            fields: Prisma.DocumentReviewFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.DocumentReviewFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DocumentReviewPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.DocumentReviewFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DocumentReviewPayload>;
                };
                findFirst: {
                    args: Prisma.DocumentReviewFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DocumentReviewPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.DocumentReviewFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DocumentReviewPayload>;
                };
                findMany: {
                    args: Prisma.DocumentReviewFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DocumentReviewPayload>[];
                };
                create: {
                    args: Prisma.DocumentReviewCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DocumentReviewPayload>;
                };
                createMany: {
                    args: Prisma.DocumentReviewCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.DocumentReviewCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DocumentReviewPayload>[];
                };
                delete: {
                    args: Prisma.DocumentReviewDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DocumentReviewPayload>;
                };
                update: {
                    args: Prisma.DocumentReviewUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DocumentReviewPayload>;
                };
                deleteMany: {
                    args: Prisma.DocumentReviewDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.DocumentReviewUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.DocumentReviewUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DocumentReviewPayload>[];
                };
                upsert: {
                    args: Prisma.DocumentReviewUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DocumentReviewPayload>;
                };
                aggregate: {
                    args: Prisma.DocumentReviewAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateDocumentReview>;
                };
                groupBy: {
                    args: Prisma.DocumentReviewGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.DocumentReviewGroupByOutputType>[];
                };
                count: {
                    args: Prisma.DocumentReviewCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.DocumentReviewCountAggregateOutputType> | number;
                };
            };
        };
        VerificationStatusChange: {
            payload: Prisma.$VerificationStatusChangePayload<ExtArgs>;
            fields: Prisma.VerificationStatusChangeFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.VerificationStatusChangeFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$VerificationStatusChangePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.VerificationStatusChangeFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$VerificationStatusChangePayload>;
                };
                findFirst: {
                    args: Prisma.VerificationStatusChangeFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$VerificationStatusChangePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.VerificationStatusChangeFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$VerificationStatusChangePayload>;
                };
                findMany: {
                    args: Prisma.VerificationStatusChangeFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$VerificationStatusChangePayload>[];
                };
                create: {
                    args: Prisma.VerificationStatusChangeCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$VerificationStatusChangePayload>;
                };
                createMany: {
                    args: Prisma.VerificationStatusChangeCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.VerificationStatusChangeCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$VerificationStatusChangePayload>[];
                };
                delete: {
                    args: Prisma.VerificationStatusChangeDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$VerificationStatusChangePayload>;
                };
                update: {
                    args: Prisma.VerificationStatusChangeUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$VerificationStatusChangePayload>;
                };
                deleteMany: {
                    args: Prisma.VerificationStatusChangeDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.VerificationStatusChangeUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.VerificationStatusChangeUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$VerificationStatusChangePayload>[];
                };
                upsert: {
                    args: Prisma.VerificationStatusChangeUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$VerificationStatusChangePayload>;
                };
                aggregate: {
                    args: Prisma.VerificationStatusChangeAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateVerificationStatusChange>;
                };
                groupBy: {
                    args: Prisma.VerificationStatusChangeGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.VerificationStatusChangeGroupByOutputType>[];
                };
                count: {
                    args: Prisma.VerificationStatusChangeCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.VerificationStatusChangeCountAggregateOutputType> | number;
                };
            };
        };
    };
} & {
    other: {
        payload: any;
        operations: {
            $executeRaw: {
                args: [query: TemplateStringsArray | Sql, ...values: any[]];
                result: any;
            };
            $executeRawUnsafe: {
                args: [query: string, ...values: any[]];
                result: any;
            };
            $queryRaw: {
                args: [query: TemplateStringsArray | Sql, ...values: any[]];
                result: any;
            };
            $queryRawUnsafe: {
                args: [query: string, ...values: any[]];
                result: any;
            };
        };
    };
};
export declare const TransactionIsolationLevel: {
    readonly ReadUncommitted: "ReadUncommitted";
    readonly ReadCommitted: "ReadCommitted";
    readonly RepeatableRead: "RepeatableRead";
    readonly Serializable: "Serializable";
};
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const UserScalarFieldEnum: {
    readonly id: "id";
    readonly fullName: "fullName";
    readonly displayName: "displayName";
    readonly countryCode: "countryCode";
    readonly phone: "phone";
    readonly email: "email";
    readonly role: "role";
    readonly gender: "gender";
    readonly passwordHash: "passwordHash";
    readonly age: "age";
    readonly avatarUrl: "avatarUrl";
    readonly isVerified: "isVerified";
    readonly verificationStatus: "verificationStatus";
    readonly verificationSubmittedAt: "verificationSubmittedAt";
    readonly verificationRejectedAt: "verificationRejectedAt";
    readonly verificationRejectionReason: "verificationRejectionReason";
    readonly verificationRejectionFields: "verificationRejectionFields";
    readonly avgRating: "avgRating";
    readonly strikes: "strikes";
    readonly locale: "locale";
    readonly status: "status";
    readonly fcmToken: "fcmToken";
    readonly lastLoginAt: "lastLoginAt";
    readonly totalBalance: "totalBalance";
    readonly isInDebt: "isInDebt";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum];
export declare const DriverProfileScalarFieldEnum: {
    readonly id: "id";
    readonly driverId: "driverId";
    readonly userIdentificationFront: "userIdentificationFront";
    readonly userIdentificationBack: "userIdentificationBack";
    readonly linceseFront: "linceseFront";
    readonly linceseBack: "linceseBack";
    readonly personalImageWithId: "personalImageWithId";
    readonly nationalID: "nationalID";
    readonly idVerified: "idVerified";
    readonly licenseNumber: "licenseNumber";
    readonly licenseExpiry: "licenseExpiry";
    readonly subscriptionTier: "subscriptionTier";
    readonly subscriptionExpiresAt: "subscriptionExpiresAt";
    readonly totalTrips: "totalTrips";
    readonly totalEarnings: "totalEarnings";
    readonly responseRate: "responseRate";
    readonly punctualityRate: "punctualityRate";
    readonly professionalDriver: "professionalDriver";
    readonly bio: "bio";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type DriverProfileScalarFieldEnum = (typeof DriverProfileScalarFieldEnum)[keyof typeof DriverProfileScalarFieldEnum];
export declare const VehicleScalarFieldEnum: {
    readonly id: "id";
    readonly driverId: "driverId";
    readonly manufacturer: "manufacturer";
    readonly model: "model";
    readonly vehicleType: "vehicleType";
    readonly modelYear: "modelYear";
    readonly plateNumber: "plateNumber";
    readonly codeNumber: "codeNumber";
    readonly color: "color";
    readonly seats: "seats";
    readonly registrationDocFront: "registrationDocFront";
    readonly registrationDocBack: "registrationDocBack";
    readonly vehiclePhotoFront: "vehiclePhotoFront";
    readonly vehiclePhotoBack: "vehiclePhotoBack";
    readonly isVerified: "isVerified";
    readonly verificationNotes: "verificationNotes";
    readonly verificationRejectionReason: "verificationRejectionReason";
    readonly verificationRejectedAt: "verificationRejectedAt";
    readonly verifiedBy: "verifiedBy";
    readonly verifiedAt: "verifiedAt";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type VehicleScalarFieldEnum = (typeof VehicleScalarFieldEnum)[keyof typeof VehicleScalarFieldEnum];
export declare const PassengerProfileScalarFieldEnum: {
    readonly id: "id";
    readonly passengerId: "passengerId";
    readonly preferredGender: "preferredGender";
    readonly smokingPreference: "smokingPreference";
    readonly savedRoutes: "savedRoutes";
    readonly nationalID: "nationalID";
    readonly homeAddress: "homeAddress";
    readonly emergencyContacts: "emergencyContacts";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type PassengerProfileScalarFieldEnum = (typeof PassengerProfileScalarFieldEnum)[keyof typeof PassengerProfileScalarFieldEnum];
export declare const TripScalarFieldEnum: {
    readonly id: "id";
    readonly driverId: "driverId";
    readonly vehicleId: "vehicleId";
    readonly originCity: "originCity";
    readonly originArea: "originArea";
    readonly originAddress: "originAddress";
    readonly originLat: "originLat";
    readonly originLng: "originLng";
    readonly destinationCity: "destinationCity";
    readonly destinationArea: "destinationArea";
    readonly destinationAddress: "destinationAddress";
    readonly destinationLat: "destinationLat";
    readonly destinationLng: "destinationLng";
    readonly departureTime: "departureTime";
    readonly arrivalTime: "arrivalTime";
    readonly totalSeats: "totalSeats";
    readonly availableSeats: "availableSeats";
    readonly farePerSeat: "farePerSeat";
    readonly totalProfit: "totalProfit";
    readonly currency: "currency";
    readonly isRecurring: "isRecurring";
    readonly recurrencePattern: "recurrencePattern";
    readonly recurrenceDays: "recurrenceDays";
    readonly recurrenceEndDate: "recurrenceEndDate";
    readonly genderPreference: "genderPreference";
    readonly driverInstructions: "driverInstructions";
    readonly additionalInstructions: "additionalInstructions";
    readonly status: "status";
    readonly isFeatured: "isFeatured";
    readonly featuredUntil: "featuredUntil";
    readonly isBlockedByBalance: "isBlockedByBalance";
    readonly isModerated: "isModerated";
    readonly moderationReason: "moderationReason";
    readonly moderatedBy: "moderatedBy";
    readonly routePolyline: "routePolyline";
    readonly routeDistanceM: "routeDistanceM";
    readonly routeDurationS: "routeDurationS";
    readonly routeStatus: "routeStatus";
    readonly routeComputedAt: "routeComputedAt";
    readonly routeVersion: "routeVersion";
    readonly actualPathPolyline: "actualPathPolyline";
    readonly actualDistanceM: "actualDistanceM";
    readonly actualDurationS: "actualDurationS";
    readonly startedAt: "startedAt";
    readonly completedAt: "completedAt";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type TripScalarFieldEnum = (typeof TripScalarFieldEnum)[keyof typeof TripScalarFieldEnum];
export declare const TripAttributeScalarFieldEnum: {
    readonly id: "id";
    readonly tripId: "tripId";
    readonly attrKey: "attrKey";
    readonly attrValue: "attrValue";
};
export type TripAttributeScalarFieldEnum = (typeof TripAttributeScalarFieldEnum)[keyof typeof TripAttributeScalarFieldEnum];
export declare const TripStopScalarFieldEnum: {
    readonly id: "id";
    readonly tripId: "tripId";
    readonly stopOrder: "stopOrder";
    readonly stopName: "stopName";
    readonly city: "city";
    readonly address: "address";
    readonly lat: "lat";
    readonly lng: "lng";
    readonly stopLat: "stopLat";
    readonly stopLng: "stopLng";
    readonly stopType: "stopType";
    readonly estimatedArrival: "estimatedArrival";
    readonly createdAt: "createdAt";
};
export type TripStopScalarFieldEnum = (typeof TripStopScalarFieldEnum)[keyof typeof TripStopScalarFieldEnum];
export declare const TripSeatScalarFieldEnum: {
    readonly id: "id";
    readonly tripId: "tripId";
    readonly seatNumber: "seatNumber";
    readonly seatType: "seatType";
    readonly wasAvailable: "wasAvailable";
    readonly createdAt: "createdAt";
};
export type TripSeatScalarFieldEnum = (typeof TripSeatScalarFieldEnum)[keyof typeof TripSeatScalarFieldEnum];
export declare const TripLocationScalarFieldEnum: {
    readonly id: "id";
    readonly tripId: "tripId";
    readonly driverId: "driverId";
    readonly lat: "lat";
    readonly lng: "lng";
    readonly speed: "speed";
    readonly heading: "heading";
    readonly occurrenceDate: "occurrenceDate";
    readonly createdAt: "createdAt";
};
export type TripLocationScalarFieldEnum = (typeof TripLocationScalarFieldEnum)[keyof typeof TripLocationScalarFieldEnum];
export declare const BookingScalarFieldEnum: {
    readonly id: "id";
    readonly tripId: "tripId";
    readonly passengerId: "passengerId";
    readonly seatNumber: "seatNumber";
    readonly seatNumbers: "seatNumbers";
    readonly seatsBooked: "seatsBooked";
    readonly agreedFare: "agreedFare";
    readonly currency: "currency";
    readonly pickupPlace: "pickupPlace";
    readonly pickupLat: "pickupLat";
    readonly pickupLng: "pickupLng";
    readonly pickupOrder: "pickupOrder";
    readonly pickupType: "pickupType";
    readonly pickupStopId: "pickupStopId";
    readonly pickupLabel: "pickupLabel";
    readonly pickupCity: "pickupCity";
    readonly pickupArea: "pickupArea";
    readonly detourSeconds: "detourSeconds";
    readonly pickupStatus: "pickupStatus";
    readonly arrivedAt: "arrivedAt";
    readonly pickedUpAt: "pickedUpAt";
    readonly dropoffPlace: "dropoffPlace";
    readonly dropoffLat: "dropoffLat";
    readonly dropoffLng: "dropoffLng";
    readonly dropoffDeadline: "dropoffDeadline";
    readonly dropoffOrder: "dropoffOrder";
    readonly status: "status";
    readonly referenceCode: "referenceCode";
    readonly cancellationReason: "cancellationReason";
    readonly cancelledBy: "cancelledBy";
    readonly cancelledAt: "cancelledAt";
    readonly paymentStatus: "paymentStatus";
    readonly completedAt: "completedAt";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type BookingScalarFieldEnum = (typeof BookingScalarFieldEnum)[keyof typeof BookingScalarFieldEnum];
export declare const RideRequestScalarFieldEnum: {
    readonly id: "id";
    readonly passengerId: "passengerId";
    readonly originPlace: "originPlace";
    readonly originCity: "originCity";
    readonly originLat: "originLat";
    readonly originLng: "originLng";
    readonly originTime: "originTime";
    readonly destinationPlace: "destinationPlace";
    readonly destinationCity: "destinationCity";
    readonly destinationLat: "destinationLat";
    readonly destinationLng: "destinationLng";
    readonly arrivalDeadline: "arrivalDeadline";
    readonly seatsNeeded: "seatsNeeded";
    readonly maxBudget: "maxBudget";
    readonly currency: "currency";
    readonly attributesPreferred: "attributesPreferred";
    readonly note: "note";
    readonly status: "status";
    readonly expiresAt: "expiresAt";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type RideRequestScalarFieldEnum = (typeof RideRequestScalarFieldEnum)[keyof typeof RideRequestScalarFieldEnum];
export declare const RequestOfferScalarFieldEnum: {
    readonly id: "id";
    readonly requestId: "requestId";
    readonly driverId: "driverId";
    readonly tripId: "tripId";
    readonly offeredFare: "offeredFare";
    readonly message: "message";
    readonly status: "status";
    readonly agreedFare: "agreedFare";
    readonly bookingId: "bookingId";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type RequestOfferScalarFieldEnum = (typeof RequestOfferScalarFieldEnum)[keyof typeof RequestOfferScalarFieldEnum];
export declare const RatingScalarFieldEnum: {
    readonly id: "id";
    readonly bookingId: "bookingId";
    readonly raterId: "raterId";
    readonly rateeId: "rateeId";
    readonly stars: "stars";
    readonly wasLate: "wasLate";
    readonly lateMinutes: "lateMinutes";
    readonly review: "review";
    readonly tags: "tags";
    readonly isVisible: "isVisible";
    readonly createdAt: "createdAt";
};
export type RatingScalarFieldEnum = (typeof RatingScalarFieldEnum)[keyof typeof RatingScalarFieldEnum];
export declare const DelayEventScalarFieldEnum: {
    readonly id: "id";
    readonly bookingId: "bookingId";
    readonly party: "party";
    readonly delayMinutes: "delayMinutes";
    readonly reason: "reason";
    readonly reportedBy: "reportedBy";
    readonly createdAt: "createdAt";
};
export type DelayEventScalarFieldEnum = (typeof DelayEventScalarFieldEnum)[keyof typeof DelayEventScalarFieldEnum];
export declare const ComplaintScalarFieldEnum: {
    readonly id: "id";
    readonly bookingId: "bookingId";
    readonly reporterId: "reporterId";
    readonly accusedId: "accusedId";
    readonly category: "category";
    readonly description: "description";
    readonly evidenceUrls: "evidenceUrls";
    readonly status: "status";
    readonly resolution: "resolution";
    readonly resolvedBy: "resolvedBy";
    readonly resolvedAt: "resolvedAt";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type ComplaintScalarFieldEnum = (typeof ComplaintScalarFieldEnum)[keyof typeof ComplaintScalarFieldEnum];
export declare const PenaltyScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly complaintId: "complaintId";
    readonly tripId: "tripId";
    readonly type: "type";
    readonly penaltyType: "penaltyType";
    readonly severity: "severity";
    readonly reason: "reason";
    readonly details: "details";
    readonly startsAt: "startsAt";
    readonly endsAt: "endsAt";
    readonly issuedBy: "issuedBy";
    readonly isAppealed: "isAppealed";
    readonly appealReason: "appealReason";
    readonly appealResolvedAt: "appealResolvedAt";
    readonly createdAt: "createdAt";
};
export type PenaltyScalarFieldEnum = (typeof PenaltyScalarFieldEnum)[keyof typeof PenaltyScalarFieldEnum];
export declare const SupportTicketScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly category: "category";
    readonly subject: "subject";
    readonly description: "description";
    readonly priority: "priority";
    readonly status: "status";
    readonly assignedTo: "assignedTo";
    readonly referenceCode: "referenceCode";
    readonly bookingId: "bookingId";
    readonly tripId: "tripId";
    readonly resolutionNotes: "resolutionNotes";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type SupportTicketScalarFieldEnum = (typeof SupportTicketScalarFieldEnum)[keyof typeof SupportTicketScalarFieldEnum];
export declare const SupportTicketMessageScalarFieldEnum: {
    readonly id: "id";
    readonly ticketId: "ticketId";
    readonly senderId: "senderId";
    readonly message: "message";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type SupportTicketMessageScalarFieldEnum = (typeof SupportTicketMessageScalarFieldEnum)[keyof typeof SupportTicketMessageScalarFieldEnum];
export declare const MessageScalarFieldEnum: {
    readonly id: "id";
    readonly senderId: "senderId";
    readonly receiverId: "receiverId";
    readonly bookingId: "bookingId";
    readonly supportTicketId: "supportTicketId";
    readonly message: "message";
    readonly messageType: "messageType";
    readonly isRead: "isRead";
    readonly readAt: "readAt";
    readonly createdAt: "createdAt";
};
export type MessageScalarFieldEnum = (typeof MessageScalarFieldEnum)[keyof typeof MessageScalarFieldEnum];
export declare const SosEventScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly tripId: "tripId";
    readonly bookingId: "bookingId";
    readonly lat: "lat";
    readonly lng: "lng";
    readonly urgency: "urgency";
    readonly status: "status";
    readonly escalationLevel: "escalationLevel";
    readonly lastAlertAt: "lastAlertAt";
    readonly acknowledgedBy: "acknowledgedBy";
    readonly acknowledgedAt: "acknowledgedAt";
    readonly resolvedBy: "resolvedBy";
    readonly resolutionNote: "resolutionNote";
    readonly resolvedAt: "resolvedAt";
    readonly createdAt: "createdAt";
};
export type SosEventScalarFieldEnum = (typeof SosEventScalarFieldEnum)[keyof typeof SosEventScalarFieldEnum];
export declare const NotificationScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly type: "type";
    readonly title: "title";
    readonly body: "body";
    readonly data: "data";
    readonly isRead: "isRead";
    readonly sentVia: "sentVia";
    readonly createdAt: "createdAt";
};
export type NotificationScalarFieldEnum = (typeof NotificationScalarFieldEnum)[keyof typeof NotificationScalarFieldEnum];
export declare const NotificationSettingScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly notificationType: "notificationType";
    readonly enabledInApp: "enabledInApp";
    readonly enabledPush: "enabledPush";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type NotificationSettingScalarFieldEnum = (typeof NotificationSettingScalarFieldEnum)[keyof typeof NotificationSettingScalarFieldEnum];
export declare const FavoriteDriverScalarFieldEnum: {
    readonly id: "id";
    readonly passengerId: "passengerId";
    readonly driverId: "driverId";
    readonly createdAt: "createdAt";
};
export type FavoriteDriverScalarFieldEnum = (typeof FavoriteDriverScalarFieldEnum)[keyof typeof FavoriteDriverScalarFieldEnum];
export declare const FavoriteRouteScalarFieldEnum: {
    readonly id: "id";
    readonly passengerId: "passengerId";
    readonly originCity: "originCity";
    readonly destinationCity: "destinationCity";
    readonly label: "label";
    readonly createdAt: "createdAt";
};
export type FavoriteRouteScalarFieldEnum = (typeof FavoriteRouteScalarFieldEnum)[keyof typeof FavoriteRouteScalarFieldEnum];
export declare const RecentSearchScalarFieldEnum: {
    readonly id: "id";
    readonly passengerId: "passengerId";
    readonly originCity: "originCity";
    readonly destinationCity: "destinationCity";
    readonly searchedOn: "searchedOn";
    readonly createdAt: "createdAt";
};
export type RecentSearchScalarFieldEnum = (typeof RecentSearchScalarFieldEnum)[keyof typeof RecentSearchScalarFieldEnum];
export declare const AuditLogScalarFieldEnum: {
    readonly id: "id";
    readonly tableName: "tableName";
    readonly recordId: "recordId";
    readonly action: "action";
    readonly oldData: "oldData";
    readonly newData: "newData";
    readonly performedBy: "performedBy";
    readonly ipAddress: "ipAddress";
    readonly userAgent: "userAgent";
    readonly createdAt: "createdAt";
};
export type AuditLogScalarFieldEnum = (typeof AuditLogScalarFieldEnum)[keyof typeof AuditLogScalarFieldEnum];
export declare const SubscriptionPlanScalarFieldEnum: {
    readonly id: "id";
    readonly name: "name";
    readonly periodDays: "periodDays";
    readonly percentageCut: "percentageCut";
    readonly cost: "cost";
    readonly status: "status";
    readonly features: "features";
    readonly isFree: "isFree";
    readonly freeOffer: "freeOffer";
    readonly isActive: "isActive";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type SubscriptionPlanScalarFieldEnum = (typeof SubscriptionPlanScalarFieldEnum)[keyof typeof SubscriptionPlanScalarFieldEnum];
export declare const DriverSubscriptionScalarFieldEnum: {
    readonly id: "id";
    readonly driverId: "driverId";
    readonly planId: "planId";
    readonly planName: "planName";
    readonly planPeriodDays: "planPeriodDays";
    readonly planPercentageCut: "planPercentageCut";
    readonly planCost: "planCost";
    readonly balance: "balance";
    readonly screenshotId: "screenshotId";
    readonly paymentMethod: "paymentMethod";
    readonly adminNotes: "adminNotes";
    readonly status: "status";
    readonly approvedAt: "approvedAt";
    readonly activatedAt: "activatedAt";
    readonly expiresAt: "expiresAt";
    readonly freeTripsUsed: "freeTripsUsed";
    readonly freeOffer: "freeOffer";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type DriverSubscriptionScalarFieldEnum = (typeof DriverSubscriptionScalarFieldEnum)[keyof typeof DriverSubscriptionScalarFieldEnum];
export declare const SubscriptionTransactionScalarFieldEnum: {
    readonly id: "id";
    readonly driverId: "driverId";
    readonly tier: "tier";
    readonly amount: "amount";
    readonly currency: "currency";
    readonly paymentMethod: "paymentMethod";
    readonly status: "status";
    readonly providerTransactionId: "providerTransactionId";
    readonly expiresAt: "expiresAt";
    readonly createdAt: "createdAt";
};
export type SubscriptionTransactionScalarFieldEnum = (typeof SubscriptionTransactionScalarFieldEnum)[keyof typeof SubscriptionTransactionScalarFieldEnum];
export declare const PaymentMethodScalarFieldEnum: {
    readonly id: "id";
    readonly name: "name";
    readonly accountNumber: "accountNumber";
    readonly type: "type";
    readonly email: "email";
    readonly isActive: "isActive";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type PaymentMethodScalarFieldEnum = (typeof PaymentMethodScalarFieldEnum)[keyof typeof PaymentMethodScalarFieldEnum];
export declare const UploadedImageScalarFieldEnum: {
    readonly id: "id";
    readonly hash: "hash";
    readonly url: "url";
    readonly filename: "filename";
    readonly mimetype: "mimetype";
    readonly size: "size";
    readonly provider: "provider";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type UploadedImageScalarFieldEnum = (typeof UploadedImageScalarFieldEnum)[keyof typeof UploadedImageScalarFieldEnum];
export declare const DeletionRequestScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly reason: "reason";
    readonly status: "status";
    readonly estimatedCompletion: "estimatedCompletion";
    readonly reviewNotes: "reviewNotes";
    readonly reviewedBy: "reviewedBy";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type DeletionRequestScalarFieldEnum = (typeof DeletionRequestScalarFieldEnum)[keyof typeof DeletionRequestScalarFieldEnum];
export declare const DocumentReviewScalarFieldEnum: {
    readonly id: "id";
    readonly driverId: "driverId";
    readonly documentKey: "documentKey";
    readonly decision: "decision";
    readonly reason: "reason";
    readonly decidedBy: "decidedBy";
    readonly decidedAt: "decidedAt";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type DocumentReviewScalarFieldEnum = (typeof DocumentReviewScalarFieldEnum)[keyof typeof DocumentReviewScalarFieldEnum];
export declare const VerificationStatusChangeScalarFieldEnum: {
    readonly id: "id";
    readonly driverId: "driverId";
    readonly fromStatus: "fromStatus";
    readonly toStatus: "toStatus";
    readonly reason: "reason";
    readonly markedFields: "markedFields";
    readonly changedBy: "changedBy";
    readonly createdAt: "createdAt";
};
export type VerificationStatusChangeScalarFieldEnum = (typeof VerificationStatusChangeScalarFieldEnum)[keyof typeof VerificationStatusChangeScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: "asc";
    readonly desc: "desc";
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const NullableJsonNullValueInput: {
    readonly DbNull: runtime.DbNullClass;
    readonly JsonNull: runtime.JsonNullClass;
};
export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput];
export declare const JsonNullValueInput: {
    readonly JsonNull: runtime.JsonNullClass;
};
export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput];
export declare const QueryMode: {
    readonly default: "default";
    readonly insensitive: "insensitive";
};
export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode];
export declare const JsonNullValueFilter: {
    readonly DbNull: runtime.DbNullClass;
    readonly JsonNull: runtime.JsonNullClass;
    readonly AnyNull: runtime.AnyNullClass;
};
export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter];
export declare const NullsOrder: {
    readonly first: "first";
    readonly last: "last";
};
export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];
export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>;
export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>;
export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>;
export type ListDecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal[]'>;
export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>;
export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>;
export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>;
export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>;
export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>;
export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>;
export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>;
export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>;
export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>;
export type BatchPayload = {
    count: number;
};
export declare const defineExtension: runtime.Types.Extensions.ExtendsHook<"define", TypeMapCb, runtime.Types.Extensions.DefaultArgs>;
export type DefaultPrismaClient = PrismaClient;
export type ErrorFormat = 'pretty' | 'colorless' | 'minimal';
export interface PrismaClientBaseOptions {
    errorFormat?: ErrorFormat;
    log?: (LogLevel | LogDefinition)[];
    transactionOptions?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: TransactionIsolationLevel;
    };
    omit?: GlobalOmitConfig;
    comments?: runtime.SqlCommenterPlugin[];
    queryPlanCacheMaxSize?: number;
}
export interface PrismaClientOptionsWithAccelerateUrl extends PrismaClientBaseOptions {
    accelerateUrl: string;
    adapter?: never;
}
export interface PrismaClientOptionsWithAdapter extends PrismaClientBaseOptions {
    adapter: runtime.SqlDriverAdapterFactory;
    accelerateUrl?: never;
}
export type PrismaClientOptions = PrismaClientOptionsWithAccelerateUrl | PrismaClientOptionsWithAdapter;
export type GlobalOmitConfig = {
    user?: Prisma.UserOmit;
    driverProfile?: Prisma.DriverProfileOmit;
    vehicle?: Prisma.VehicleOmit;
    passengerProfile?: Prisma.PassengerProfileOmit;
    trip?: Prisma.TripOmit;
    tripAttribute?: Prisma.TripAttributeOmit;
    tripStop?: Prisma.TripStopOmit;
    tripSeat?: Prisma.TripSeatOmit;
    tripLocation?: Prisma.TripLocationOmit;
    booking?: Prisma.BookingOmit;
    rideRequest?: Prisma.RideRequestOmit;
    requestOffer?: Prisma.RequestOfferOmit;
    rating?: Prisma.RatingOmit;
    delayEvent?: Prisma.DelayEventOmit;
    complaint?: Prisma.ComplaintOmit;
    penalty?: Prisma.PenaltyOmit;
    supportTicket?: Prisma.SupportTicketOmit;
    supportTicketMessage?: Prisma.SupportTicketMessageOmit;
    message?: Prisma.MessageOmit;
    sosEvent?: Prisma.SosEventOmit;
    notification?: Prisma.NotificationOmit;
    notificationSetting?: Prisma.NotificationSettingOmit;
    favoriteDriver?: Prisma.FavoriteDriverOmit;
    favoriteRoute?: Prisma.FavoriteRouteOmit;
    recentSearch?: Prisma.RecentSearchOmit;
    auditLog?: Prisma.AuditLogOmit;
    subscriptionPlan?: Prisma.SubscriptionPlanOmit;
    driverSubscription?: Prisma.DriverSubscriptionOmit;
    subscriptionTransaction?: Prisma.SubscriptionTransactionOmit;
    paymentMethod?: Prisma.PaymentMethodOmit;
    uploadedImage?: Prisma.UploadedImageOmit;
    deletionRequest?: Prisma.DeletionRequestOmit;
    documentReview?: Prisma.DocumentReviewOmit;
    verificationStatusChange?: Prisma.VerificationStatusChangeOmit;
};
export type LogLevel = 'info' | 'query' | 'warn' | 'error';
export type LogDefinition = {
    level: LogLevel;
    emit: 'stdout' | 'event';
};
export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;
export type GetLogType<T> = CheckIsLogLevel<T extends LogDefinition ? T['level'] : T>;
export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition> ? GetLogType<T[number]> : never;
export type QueryEvent = {
    timestamp: Date;
    query: string;
    params: string;
    duration: number;
    target: string;
};
export type LogEvent = {
    timestamp: Date;
    message: string;
    target: string;
};
export type PrismaAction = 'findUnique' | 'findUniqueOrThrow' | 'findMany' | 'findFirst' | 'findFirstOrThrow' | 'create' | 'createMany' | 'createManyAndReturn' | 'update' | 'updateMany' | 'updateManyAndReturn' | 'upsert' | 'delete' | 'deleteMany' | 'executeRaw' | 'queryRaw' | 'aggregate' | 'count' | 'runCommandRaw' | 'findRaw' | 'groupBy';
export type TransactionClient = Omit<DefaultPrismaClient, runtime.ITXClientDenyList>;
