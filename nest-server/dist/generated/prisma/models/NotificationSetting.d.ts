import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type NotificationSettingModel = runtime.Types.Result.DefaultSelection<Prisma.$NotificationSettingPayload>;
export type AggregateNotificationSetting = {
    _count: NotificationSettingCountAggregateOutputType | null;
    _min: NotificationSettingMinAggregateOutputType | null;
    _max: NotificationSettingMaxAggregateOutputType | null;
};
export type NotificationSettingMinAggregateOutputType = {
    id: string | null;
    userId: string | null;
    notificationType: string | null;
    enabledInApp: boolean | null;
    enabledPush: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type NotificationSettingMaxAggregateOutputType = {
    id: string | null;
    userId: string | null;
    notificationType: string | null;
    enabledInApp: boolean | null;
    enabledPush: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type NotificationSettingCountAggregateOutputType = {
    id: number;
    userId: number;
    notificationType: number;
    enabledInApp: number;
    enabledPush: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type NotificationSettingMinAggregateInputType = {
    id?: true;
    userId?: true;
    notificationType?: true;
    enabledInApp?: true;
    enabledPush?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type NotificationSettingMaxAggregateInputType = {
    id?: true;
    userId?: true;
    notificationType?: true;
    enabledInApp?: true;
    enabledPush?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type NotificationSettingCountAggregateInputType = {
    id?: true;
    userId?: true;
    notificationType?: true;
    enabledInApp?: true;
    enabledPush?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type NotificationSettingAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.NotificationSettingWhereInput;
    orderBy?: Prisma.NotificationSettingOrderByWithRelationInput | Prisma.NotificationSettingOrderByWithRelationInput[];
    cursor?: Prisma.NotificationSettingWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | NotificationSettingCountAggregateInputType;
    _min?: NotificationSettingMinAggregateInputType;
    _max?: NotificationSettingMaxAggregateInputType;
};
export type GetNotificationSettingAggregateType<T extends NotificationSettingAggregateArgs> = {
    [P in keyof T & keyof AggregateNotificationSetting]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateNotificationSetting[P]> : Prisma.GetScalarType<T[P], AggregateNotificationSetting[P]>;
};
export type NotificationSettingGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.NotificationSettingWhereInput;
    orderBy?: Prisma.NotificationSettingOrderByWithAggregationInput | Prisma.NotificationSettingOrderByWithAggregationInput[];
    by: Prisma.NotificationSettingScalarFieldEnum[] | Prisma.NotificationSettingScalarFieldEnum;
    having?: Prisma.NotificationSettingScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: NotificationSettingCountAggregateInputType | true;
    _min?: NotificationSettingMinAggregateInputType;
    _max?: NotificationSettingMaxAggregateInputType;
};
export type NotificationSettingGroupByOutputType = {
    id: string;
    userId: string;
    notificationType: string;
    enabledInApp: boolean;
    enabledPush: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: NotificationSettingCountAggregateOutputType | null;
    _min: NotificationSettingMinAggregateOutputType | null;
    _max: NotificationSettingMaxAggregateOutputType | null;
};
export type GetNotificationSettingGroupByPayload<T extends NotificationSettingGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<NotificationSettingGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof NotificationSettingGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], NotificationSettingGroupByOutputType[P]> : Prisma.GetScalarType<T[P], NotificationSettingGroupByOutputType[P]>;
}>>;
export type NotificationSettingWhereInput = {
    AND?: Prisma.NotificationSettingWhereInput | Prisma.NotificationSettingWhereInput[];
    OR?: Prisma.NotificationSettingWhereInput[];
    NOT?: Prisma.NotificationSettingWhereInput | Prisma.NotificationSettingWhereInput[];
    id?: Prisma.UuidFilter<"NotificationSetting"> | string;
    userId?: Prisma.UuidFilter<"NotificationSetting"> | string;
    notificationType?: Prisma.StringFilter<"NotificationSetting"> | string;
    enabledInApp?: Prisma.BoolFilter<"NotificationSetting"> | boolean;
    enabledPush?: Prisma.BoolFilter<"NotificationSetting"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"NotificationSetting"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"NotificationSetting"> | Date | string;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
};
export type NotificationSettingOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    notificationType?: Prisma.SortOrder;
    enabledInApp?: Prisma.SortOrder;
    enabledPush?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    user?: Prisma.UserOrderByWithRelationInput;
};
export type NotificationSettingWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    userId_notificationType?: Prisma.NotificationSettingUserIdNotificationTypeCompoundUniqueInput;
    AND?: Prisma.NotificationSettingWhereInput | Prisma.NotificationSettingWhereInput[];
    OR?: Prisma.NotificationSettingWhereInput[];
    NOT?: Prisma.NotificationSettingWhereInput | Prisma.NotificationSettingWhereInput[];
    userId?: Prisma.UuidFilter<"NotificationSetting"> | string;
    notificationType?: Prisma.StringFilter<"NotificationSetting"> | string;
    enabledInApp?: Prisma.BoolFilter<"NotificationSetting"> | boolean;
    enabledPush?: Prisma.BoolFilter<"NotificationSetting"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"NotificationSetting"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"NotificationSetting"> | Date | string;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
}, "id" | "userId_notificationType">;
export type NotificationSettingOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    notificationType?: Prisma.SortOrder;
    enabledInApp?: Prisma.SortOrder;
    enabledPush?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.NotificationSettingCountOrderByAggregateInput;
    _max?: Prisma.NotificationSettingMaxOrderByAggregateInput;
    _min?: Prisma.NotificationSettingMinOrderByAggregateInput;
};
export type NotificationSettingScalarWhereWithAggregatesInput = {
    AND?: Prisma.NotificationSettingScalarWhereWithAggregatesInput | Prisma.NotificationSettingScalarWhereWithAggregatesInput[];
    OR?: Prisma.NotificationSettingScalarWhereWithAggregatesInput[];
    NOT?: Prisma.NotificationSettingScalarWhereWithAggregatesInput | Prisma.NotificationSettingScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"NotificationSetting"> | string;
    userId?: Prisma.UuidWithAggregatesFilter<"NotificationSetting"> | string;
    notificationType?: Prisma.StringWithAggregatesFilter<"NotificationSetting"> | string;
    enabledInApp?: Prisma.BoolWithAggregatesFilter<"NotificationSetting"> | boolean;
    enabledPush?: Prisma.BoolWithAggregatesFilter<"NotificationSetting"> | boolean;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"NotificationSetting"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"NotificationSetting"> | Date | string;
};
export type NotificationSettingCreateInput = {
    id?: string;
    notificationType: string;
    enabledInApp?: boolean;
    enabledPush?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutNotificationSettingsInput;
};
export type NotificationSettingUncheckedCreateInput = {
    id?: string;
    userId: string;
    notificationType: string;
    enabledInApp?: boolean;
    enabledPush?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type NotificationSettingUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    notificationType?: Prisma.StringFieldUpdateOperationsInput | string;
    enabledInApp?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    enabledPush?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutNotificationSettingsNestedInput;
};
export type NotificationSettingUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    notificationType?: Prisma.StringFieldUpdateOperationsInput | string;
    enabledInApp?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    enabledPush?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type NotificationSettingCreateManyInput = {
    id?: string;
    userId: string;
    notificationType: string;
    enabledInApp?: boolean;
    enabledPush?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type NotificationSettingUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    notificationType?: Prisma.StringFieldUpdateOperationsInput | string;
    enabledInApp?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    enabledPush?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type NotificationSettingUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    notificationType?: Prisma.StringFieldUpdateOperationsInput | string;
    enabledInApp?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    enabledPush?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type NotificationSettingListRelationFilter = {
    every?: Prisma.NotificationSettingWhereInput;
    some?: Prisma.NotificationSettingWhereInput;
    none?: Prisma.NotificationSettingWhereInput;
};
export type NotificationSettingOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type NotificationSettingUserIdNotificationTypeCompoundUniqueInput = {
    userId: string;
    notificationType: string;
};
export type NotificationSettingCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    notificationType?: Prisma.SortOrder;
    enabledInApp?: Prisma.SortOrder;
    enabledPush?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type NotificationSettingMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    notificationType?: Prisma.SortOrder;
    enabledInApp?: Prisma.SortOrder;
    enabledPush?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type NotificationSettingMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    notificationType?: Prisma.SortOrder;
    enabledInApp?: Prisma.SortOrder;
    enabledPush?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type NotificationSettingCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.NotificationSettingCreateWithoutUserInput, Prisma.NotificationSettingUncheckedCreateWithoutUserInput> | Prisma.NotificationSettingCreateWithoutUserInput[] | Prisma.NotificationSettingUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.NotificationSettingCreateOrConnectWithoutUserInput | Prisma.NotificationSettingCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.NotificationSettingCreateManyUserInputEnvelope;
    connect?: Prisma.NotificationSettingWhereUniqueInput | Prisma.NotificationSettingWhereUniqueInput[];
};
export type NotificationSettingUncheckedCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.NotificationSettingCreateWithoutUserInput, Prisma.NotificationSettingUncheckedCreateWithoutUserInput> | Prisma.NotificationSettingCreateWithoutUserInput[] | Prisma.NotificationSettingUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.NotificationSettingCreateOrConnectWithoutUserInput | Prisma.NotificationSettingCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.NotificationSettingCreateManyUserInputEnvelope;
    connect?: Prisma.NotificationSettingWhereUniqueInput | Prisma.NotificationSettingWhereUniqueInput[];
};
export type NotificationSettingUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.NotificationSettingCreateWithoutUserInput, Prisma.NotificationSettingUncheckedCreateWithoutUserInput> | Prisma.NotificationSettingCreateWithoutUserInput[] | Prisma.NotificationSettingUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.NotificationSettingCreateOrConnectWithoutUserInput | Prisma.NotificationSettingCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.NotificationSettingUpsertWithWhereUniqueWithoutUserInput | Prisma.NotificationSettingUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.NotificationSettingCreateManyUserInputEnvelope;
    set?: Prisma.NotificationSettingWhereUniqueInput | Prisma.NotificationSettingWhereUniqueInput[];
    disconnect?: Prisma.NotificationSettingWhereUniqueInput | Prisma.NotificationSettingWhereUniqueInput[];
    delete?: Prisma.NotificationSettingWhereUniqueInput | Prisma.NotificationSettingWhereUniqueInput[];
    connect?: Prisma.NotificationSettingWhereUniqueInput | Prisma.NotificationSettingWhereUniqueInput[];
    update?: Prisma.NotificationSettingUpdateWithWhereUniqueWithoutUserInput | Prisma.NotificationSettingUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.NotificationSettingUpdateManyWithWhereWithoutUserInput | Prisma.NotificationSettingUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.NotificationSettingScalarWhereInput | Prisma.NotificationSettingScalarWhereInput[];
};
export type NotificationSettingUncheckedUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.NotificationSettingCreateWithoutUserInput, Prisma.NotificationSettingUncheckedCreateWithoutUserInput> | Prisma.NotificationSettingCreateWithoutUserInput[] | Prisma.NotificationSettingUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.NotificationSettingCreateOrConnectWithoutUserInput | Prisma.NotificationSettingCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.NotificationSettingUpsertWithWhereUniqueWithoutUserInput | Prisma.NotificationSettingUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.NotificationSettingCreateManyUserInputEnvelope;
    set?: Prisma.NotificationSettingWhereUniqueInput | Prisma.NotificationSettingWhereUniqueInput[];
    disconnect?: Prisma.NotificationSettingWhereUniqueInput | Prisma.NotificationSettingWhereUniqueInput[];
    delete?: Prisma.NotificationSettingWhereUniqueInput | Prisma.NotificationSettingWhereUniqueInput[];
    connect?: Prisma.NotificationSettingWhereUniqueInput | Prisma.NotificationSettingWhereUniqueInput[];
    update?: Prisma.NotificationSettingUpdateWithWhereUniqueWithoutUserInput | Prisma.NotificationSettingUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.NotificationSettingUpdateManyWithWhereWithoutUserInput | Prisma.NotificationSettingUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.NotificationSettingScalarWhereInput | Prisma.NotificationSettingScalarWhereInput[];
};
export type NotificationSettingCreateWithoutUserInput = {
    id?: string;
    notificationType: string;
    enabledInApp?: boolean;
    enabledPush?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type NotificationSettingUncheckedCreateWithoutUserInput = {
    id?: string;
    notificationType: string;
    enabledInApp?: boolean;
    enabledPush?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type NotificationSettingCreateOrConnectWithoutUserInput = {
    where: Prisma.NotificationSettingWhereUniqueInput;
    create: Prisma.XOR<Prisma.NotificationSettingCreateWithoutUserInput, Prisma.NotificationSettingUncheckedCreateWithoutUserInput>;
};
export type NotificationSettingCreateManyUserInputEnvelope = {
    data: Prisma.NotificationSettingCreateManyUserInput | Prisma.NotificationSettingCreateManyUserInput[];
    skipDuplicates?: boolean;
};
export type NotificationSettingUpsertWithWhereUniqueWithoutUserInput = {
    where: Prisma.NotificationSettingWhereUniqueInput;
    update: Prisma.XOR<Prisma.NotificationSettingUpdateWithoutUserInput, Prisma.NotificationSettingUncheckedUpdateWithoutUserInput>;
    create: Prisma.XOR<Prisma.NotificationSettingCreateWithoutUserInput, Prisma.NotificationSettingUncheckedCreateWithoutUserInput>;
};
export type NotificationSettingUpdateWithWhereUniqueWithoutUserInput = {
    where: Prisma.NotificationSettingWhereUniqueInput;
    data: Prisma.XOR<Prisma.NotificationSettingUpdateWithoutUserInput, Prisma.NotificationSettingUncheckedUpdateWithoutUserInput>;
};
export type NotificationSettingUpdateManyWithWhereWithoutUserInput = {
    where: Prisma.NotificationSettingScalarWhereInput;
    data: Prisma.XOR<Prisma.NotificationSettingUpdateManyMutationInput, Prisma.NotificationSettingUncheckedUpdateManyWithoutUserInput>;
};
export type NotificationSettingScalarWhereInput = {
    AND?: Prisma.NotificationSettingScalarWhereInput | Prisma.NotificationSettingScalarWhereInput[];
    OR?: Prisma.NotificationSettingScalarWhereInput[];
    NOT?: Prisma.NotificationSettingScalarWhereInput | Prisma.NotificationSettingScalarWhereInput[];
    id?: Prisma.UuidFilter<"NotificationSetting"> | string;
    userId?: Prisma.UuidFilter<"NotificationSetting"> | string;
    notificationType?: Prisma.StringFilter<"NotificationSetting"> | string;
    enabledInApp?: Prisma.BoolFilter<"NotificationSetting"> | boolean;
    enabledPush?: Prisma.BoolFilter<"NotificationSetting"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"NotificationSetting"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"NotificationSetting"> | Date | string;
};
export type NotificationSettingCreateManyUserInput = {
    id?: string;
    notificationType: string;
    enabledInApp?: boolean;
    enabledPush?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type NotificationSettingUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    notificationType?: Prisma.StringFieldUpdateOperationsInput | string;
    enabledInApp?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    enabledPush?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type NotificationSettingUncheckedUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    notificationType?: Prisma.StringFieldUpdateOperationsInput | string;
    enabledInApp?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    enabledPush?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type NotificationSettingUncheckedUpdateManyWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    notificationType?: Prisma.StringFieldUpdateOperationsInput | string;
    enabledInApp?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    enabledPush?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type NotificationSettingSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    notificationType?: boolean;
    enabledInApp?: boolean;
    enabledPush?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["notificationSetting"]>;
export type NotificationSettingSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    notificationType?: boolean;
    enabledInApp?: boolean;
    enabledPush?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["notificationSetting"]>;
export type NotificationSettingSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    notificationType?: boolean;
    enabledInApp?: boolean;
    enabledPush?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["notificationSetting"]>;
export type NotificationSettingSelectScalar = {
    id?: boolean;
    userId?: boolean;
    notificationType?: boolean;
    enabledInApp?: boolean;
    enabledPush?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type NotificationSettingOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "userId" | "notificationType" | "enabledInApp" | "enabledPush" | "createdAt" | "updatedAt", ExtArgs["result"]["notificationSetting"]>;
export type NotificationSettingInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type NotificationSettingIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type NotificationSettingIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type $NotificationSettingPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "NotificationSetting";
    objects: {
        user: Prisma.$UserPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        userId: string;
        notificationType: string;
        enabledInApp: boolean;
        enabledPush: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["notificationSetting"]>;
    composites: {};
};
export type NotificationSettingGetPayload<S extends boolean | null | undefined | NotificationSettingDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$NotificationSettingPayload, S>;
export type NotificationSettingCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<NotificationSettingFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: NotificationSettingCountAggregateInputType | true;
};
export interface NotificationSettingDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['NotificationSetting'];
        meta: {
            name: 'NotificationSetting';
        };
    };
    findUnique<T extends NotificationSettingFindUniqueArgs>(args: Prisma.SelectSubset<T, NotificationSettingFindUniqueArgs<ExtArgs>>): Prisma.Prisma__NotificationSettingClient<runtime.Types.Result.GetResult<Prisma.$NotificationSettingPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends NotificationSettingFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, NotificationSettingFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__NotificationSettingClient<runtime.Types.Result.GetResult<Prisma.$NotificationSettingPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends NotificationSettingFindFirstArgs>(args?: Prisma.SelectSubset<T, NotificationSettingFindFirstArgs<ExtArgs>>): Prisma.Prisma__NotificationSettingClient<runtime.Types.Result.GetResult<Prisma.$NotificationSettingPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends NotificationSettingFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, NotificationSettingFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__NotificationSettingClient<runtime.Types.Result.GetResult<Prisma.$NotificationSettingPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends NotificationSettingFindManyArgs>(args?: Prisma.SelectSubset<T, NotificationSettingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$NotificationSettingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends NotificationSettingCreateArgs>(args: Prisma.SelectSubset<T, NotificationSettingCreateArgs<ExtArgs>>): Prisma.Prisma__NotificationSettingClient<runtime.Types.Result.GetResult<Prisma.$NotificationSettingPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends NotificationSettingCreateManyArgs>(args?: Prisma.SelectSubset<T, NotificationSettingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends NotificationSettingCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, NotificationSettingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$NotificationSettingPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends NotificationSettingDeleteArgs>(args: Prisma.SelectSubset<T, NotificationSettingDeleteArgs<ExtArgs>>): Prisma.Prisma__NotificationSettingClient<runtime.Types.Result.GetResult<Prisma.$NotificationSettingPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends NotificationSettingUpdateArgs>(args: Prisma.SelectSubset<T, NotificationSettingUpdateArgs<ExtArgs>>): Prisma.Prisma__NotificationSettingClient<runtime.Types.Result.GetResult<Prisma.$NotificationSettingPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends NotificationSettingDeleteManyArgs>(args?: Prisma.SelectSubset<T, NotificationSettingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends NotificationSettingUpdateManyArgs>(args: Prisma.SelectSubset<T, NotificationSettingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends NotificationSettingUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, NotificationSettingUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$NotificationSettingPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends NotificationSettingUpsertArgs>(args: Prisma.SelectSubset<T, NotificationSettingUpsertArgs<ExtArgs>>): Prisma.Prisma__NotificationSettingClient<runtime.Types.Result.GetResult<Prisma.$NotificationSettingPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends NotificationSettingCountArgs>(args?: Prisma.Subset<T, NotificationSettingCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], NotificationSettingCountAggregateOutputType> : number>;
    aggregate<T extends NotificationSettingAggregateArgs>(args: Prisma.Subset<T, NotificationSettingAggregateArgs>): Prisma.PrismaPromise<GetNotificationSettingAggregateType<T>>;
    groupBy<T extends NotificationSettingGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: NotificationSettingGroupByArgs['orderBy'];
    } : {
        orderBy?: NotificationSettingGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, NotificationSettingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetNotificationSettingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: NotificationSettingFieldRefs;
}
export interface Prisma__NotificationSettingClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    user<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface NotificationSettingFieldRefs {
    readonly id: Prisma.FieldRef<"NotificationSetting", 'String'>;
    readonly userId: Prisma.FieldRef<"NotificationSetting", 'String'>;
    readonly notificationType: Prisma.FieldRef<"NotificationSetting", 'String'>;
    readonly enabledInApp: Prisma.FieldRef<"NotificationSetting", 'Boolean'>;
    readonly enabledPush: Prisma.FieldRef<"NotificationSetting", 'Boolean'>;
    readonly createdAt: Prisma.FieldRef<"NotificationSetting", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"NotificationSetting", 'DateTime'>;
}
export type NotificationSettingFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.NotificationSettingSelect<ExtArgs> | null;
    omit?: Prisma.NotificationSettingOmit<ExtArgs> | null;
    include?: Prisma.NotificationSettingInclude<ExtArgs> | null;
    where: Prisma.NotificationSettingWhereUniqueInput;
};
export type NotificationSettingFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.NotificationSettingSelect<ExtArgs> | null;
    omit?: Prisma.NotificationSettingOmit<ExtArgs> | null;
    include?: Prisma.NotificationSettingInclude<ExtArgs> | null;
    where: Prisma.NotificationSettingWhereUniqueInput;
};
export type NotificationSettingFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.NotificationSettingSelect<ExtArgs> | null;
    omit?: Prisma.NotificationSettingOmit<ExtArgs> | null;
    include?: Prisma.NotificationSettingInclude<ExtArgs> | null;
    where?: Prisma.NotificationSettingWhereInput;
    orderBy?: Prisma.NotificationSettingOrderByWithRelationInput | Prisma.NotificationSettingOrderByWithRelationInput[];
    cursor?: Prisma.NotificationSettingWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.NotificationSettingScalarFieldEnum | Prisma.NotificationSettingScalarFieldEnum[];
};
export type NotificationSettingFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.NotificationSettingSelect<ExtArgs> | null;
    omit?: Prisma.NotificationSettingOmit<ExtArgs> | null;
    include?: Prisma.NotificationSettingInclude<ExtArgs> | null;
    where?: Prisma.NotificationSettingWhereInput;
    orderBy?: Prisma.NotificationSettingOrderByWithRelationInput | Prisma.NotificationSettingOrderByWithRelationInput[];
    cursor?: Prisma.NotificationSettingWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.NotificationSettingScalarFieldEnum | Prisma.NotificationSettingScalarFieldEnum[];
};
export type NotificationSettingFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.NotificationSettingSelect<ExtArgs> | null;
    omit?: Prisma.NotificationSettingOmit<ExtArgs> | null;
    include?: Prisma.NotificationSettingInclude<ExtArgs> | null;
    where?: Prisma.NotificationSettingWhereInput;
    orderBy?: Prisma.NotificationSettingOrderByWithRelationInput | Prisma.NotificationSettingOrderByWithRelationInput[];
    cursor?: Prisma.NotificationSettingWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.NotificationSettingScalarFieldEnum | Prisma.NotificationSettingScalarFieldEnum[];
};
export type NotificationSettingCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.NotificationSettingSelect<ExtArgs> | null;
    omit?: Prisma.NotificationSettingOmit<ExtArgs> | null;
    include?: Prisma.NotificationSettingInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.NotificationSettingCreateInput, Prisma.NotificationSettingUncheckedCreateInput>;
};
export type NotificationSettingCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.NotificationSettingCreateManyInput | Prisma.NotificationSettingCreateManyInput[];
    skipDuplicates?: boolean;
};
export type NotificationSettingCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.NotificationSettingSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.NotificationSettingOmit<ExtArgs> | null;
    data: Prisma.NotificationSettingCreateManyInput | Prisma.NotificationSettingCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.NotificationSettingIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type NotificationSettingUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.NotificationSettingSelect<ExtArgs> | null;
    omit?: Prisma.NotificationSettingOmit<ExtArgs> | null;
    include?: Prisma.NotificationSettingInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.NotificationSettingUpdateInput, Prisma.NotificationSettingUncheckedUpdateInput>;
    where: Prisma.NotificationSettingWhereUniqueInput;
};
export type NotificationSettingUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.NotificationSettingUpdateManyMutationInput, Prisma.NotificationSettingUncheckedUpdateManyInput>;
    where?: Prisma.NotificationSettingWhereInput;
    limit?: number;
};
export type NotificationSettingUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.NotificationSettingSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.NotificationSettingOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.NotificationSettingUpdateManyMutationInput, Prisma.NotificationSettingUncheckedUpdateManyInput>;
    where?: Prisma.NotificationSettingWhereInput;
    limit?: number;
    include?: Prisma.NotificationSettingIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type NotificationSettingUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.NotificationSettingSelect<ExtArgs> | null;
    omit?: Prisma.NotificationSettingOmit<ExtArgs> | null;
    include?: Prisma.NotificationSettingInclude<ExtArgs> | null;
    where: Prisma.NotificationSettingWhereUniqueInput;
    create: Prisma.XOR<Prisma.NotificationSettingCreateInput, Prisma.NotificationSettingUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.NotificationSettingUpdateInput, Prisma.NotificationSettingUncheckedUpdateInput>;
};
export type NotificationSettingDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.NotificationSettingSelect<ExtArgs> | null;
    omit?: Prisma.NotificationSettingOmit<ExtArgs> | null;
    include?: Prisma.NotificationSettingInclude<ExtArgs> | null;
    where: Prisma.NotificationSettingWhereUniqueInput;
};
export type NotificationSettingDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.NotificationSettingWhereInput;
    limit?: number;
};
export type NotificationSettingDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.NotificationSettingSelect<ExtArgs> | null;
    omit?: Prisma.NotificationSettingOmit<ExtArgs> | null;
    include?: Prisma.NotificationSettingInclude<ExtArgs> | null;
};
