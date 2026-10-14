import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type VerificationStatusChangeModel = runtime.Types.Result.DefaultSelection<Prisma.$VerificationStatusChangePayload>;
export type AggregateVerificationStatusChange = {
    _count: VerificationStatusChangeCountAggregateOutputType | null;
    _min: VerificationStatusChangeMinAggregateOutputType | null;
    _max: VerificationStatusChangeMaxAggregateOutputType | null;
};
export type VerificationStatusChangeMinAggregateOutputType = {
    id: string | null;
    driverId: string | null;
    fromStatus: string | null;
    toStatus: string | null;
    reason: string | null;
    changedBy: string | null;
    createdAt: Date | null;
};
export type VerificationStatusChangeMaxAggregateOutputType = {
    id: string | null;
    driverId: string | null;
    fromStatus: string | null;
    toStatus: string | null;
    reason: string | null;
    changedBy: string | null;
    createdAt: Date | null;
};
export type VerificationStatusChangeCountAggregateOutputType = {
    id: number;
    driverId: number;
    fromStatus: number;
    toStatus: number;
    reason: number;
    markedFields: number;
    changedBy: number;
    createdAt: number;
    _all: number;
};
export type VerificationStatusChangeMinAggregateInputType = {
    id?: true;
    driverId?: true;
    fromStatus?: true;
    toStatus?: true;
    reason?: true;
    changedBy?: true;
    createdAt?: true;
};
export type VerificationStatusChangeMaxAggregateInputType = {
    id?: true;
    driverId?: true;
    fromStatus?: true;
    toStatus?: true;
    reason?: true;
    changedBy?: true;
    createdAt?: true;
};
export type VerificationStatusChangeCountAggregateInputType = {
    id?: true;
    driverId?: true;
    fromStatus?: true;
    toStatus?: true;
    reason?: true;
    markedFields?: true;
    changedBy?: true;
    createdAt?: true;
    _all?: true;
};
export type VerificationStatusChangeAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.VerificationStatusChangeWhereInput;
    orderBy?: Prisma.VerificationStatusChangeOrderByWithRelationInput | Prisma.VerificationStatusChangeOrderByWithRelationInput[];
    cursor?: Prisma.VerificationStatusChangeWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | VerificationStatusChangeCountAggregateInputType;
    _min?: VerificationStatusChangeMinAggregateInputType;
    _max?: VerificationStatusChangeMaxAggregateInputType;
};
export type GetVerificationStatusChangeAggregateType<T extends VerificationStatusChangeAggregateArgs> = {
    [P in keyof T & keyof AggregateVerificationStatusChange]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateVerificationStatusChange[P]> : Prisma.GetScalarType<T[P], AggregateVerificationStatusChange[P]>;
};
export type VerificationStatusChangeGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.VerificationStatusChangeWhereInput;
    orderBy?: Prisma.VerificationStatusChangeOrderByWithAggregationInput | Prisma.VerificationStatusChangeOrderByWithAggregationInput[];
    by: Prisma.VerificationStatusChangeScalarFieldEnum[] | Prisma.VerificationStatusChangeScalarFieldEnum;
    having?: Prisma.VerificationStatusChangeScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: VerificationStatusChangeCountAggregateInputType | true;
    _min?: VerificationStatusChangeMinAggregateInputType;
    _max?: VerificationStatusChangeMaxAggregateInputType;
};
export type VerificationStatusChangeGroupByOutputType = {
    id: string;
    driverId: string;
    fromStatus: string | null;
    toStatus: string;
    reason: string | null;
    markedFields: runtime.JsonValue | null;
    changedBy: string | null;
    createdAt: Date;
    _count: VerificationStatusChangeCountAggregateOutputType | null;
    _min: VerificationStatusChangeMinAggregateOutputType | null;
    _max: VerificationStatusChangeMaxAggregateOutputType | null;
};
export type GetVerificationStatusChangeGroupByPayload<T extends VerificationStatusChangeGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<VerificationStatusChangeGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof VerificationStatusChangeGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], VerificationStatusChangeGroupByOutputType[P]> : Prisma.GetScalarType<T[P], VerificationStatusChangeGroupByOutputType[P]>;
}>>;
export type VerificationStatusChangeWhereInput = {
    AND?: Prisma.VerificationStatusChangeWhereInput | Prisma.VerificationStatusChangeWhereInput[];
    OR?: Prisma.VerificationStatusChangeWhereInput[];
    NOT?: Prisma.VerificationStatusChangeWhereInput | Prisma.VerificationStatusChangeWhereInput[];
    id?: Prisma.UuidFilter<"VerificationStatusChange"> | string;
    driverId?: Prisma.UuidFilter<"VerificationStatusChange"> | string;
    fromStatus?: Prisma.StringNullableFilter<"VerificationStatusChange"> | string | null;
    toStatus?: Prisma.StringFilter<"VerificationStatusChange"> | string;
    reason?: Prisma.StringNullableFilter<"VerificationStatusChange"> | string | null;
    markedFields?: Prisma.JsonNullableFilter<"VerificationStatusChange">;
    changedBy?: Prisma.UuidNullableFilter<"VerificationStatusChange"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"VerificationStatusChange"> | Date | string;
    driver?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
};
export type VerificationStatusChangeOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    driverId?: Prisma.SortOrder;
    fromStatus?: Prisma.SortOrderInput | Prisma.SortOrder;
    toStatus?: Prisma.SortOrder;
    reason?: Prisma.SortOrderInput | Prisma.SortOrder;
    markedFields?: Prisma.SortOrderInput | Prisma.SortOrder;
    changedBy?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    driver?: Prisma.UserOrderByWithRelationInput;
};
export type VerificationStatusChangeWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.VerificationStatusChangeWhereInput | Prisma.VerificationStatusChangeWhereInput[];
    OR?: Prisma.VerificationStatusChangeWhereInput[];
    NOT?: Prisma.VerificationStatusChangeWhereInput | Prisma.VerificationStatusChangeWhereInput[];
    driverId?: Prisma.UuidFilter<"VerificationStatusChange"> | string;
    fromStatus?: Prisma.StringNullableFilter<"VerificationStatusChange"> | string | null;
    toStatus?: Prisma.StringFilter<"VerificationStatusChange"> | string;
    reason?: Prisma.StringNullableFilter<"VerificationStatusChange"> | string | null;
    markedFields?: Prisma.JsonNullableFilter<"VerificationStatusChange">;
    changedBy?: Prisma.UuidNullableFilter<"VerificationStatusChange"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"VerificationStatusChange"> | Date | string;
    driver?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
}, "id">;
export type VerificationStatusChangeOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    driverId?: Prisma.SortOrder;
    fromStatus?: Prisma.SortOrderInput | Prisma.SortOrder;
    toStatus?: Prisma.SortOrder;
    reason?: Prisma.SortOrderInput | Prisma.SortOrder;
    markedFields?: Prisma.SortOrderInput | Prisma.SortOrder;
    changedBy?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.VerificationStatusChangeCountOrderByAggregateInput;
    _max?: Prisma.VerificationStatusChangeMaxOrderByAggregateInput;
    _min?: Prisma.VerificationStatusChangeMinOrderByAggregateInput;
};
export type VerificationStatusChangeScalarWhereWithAggregatesInput = {
    AND?: Prisma.VerificationStatusChangeScalarWhereWithAggregatesInput | Prisma.VerificationStatusChangeScalarWhereWithAggregatesInput[];
    OR?: Prisma.VerificationStatusChangeScalarWhereWithAggregatesInput[];
    NOT?: Prisma.VerificationStatusChangeScalarWhereWithAggregatesInput | Prisma.VerificationStatusChangeScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"VerificationStatusChange"> | string;
    driverId?: Prisma.UuidWithAggregatesFilter<"VerificationStatusChange"> | string;
    fromStatus?: Prisma.StringNullableWithAggregatesFilter<"VerificationStatusChange"> | string | null;
    toStatus?: Prisma.StringWithAggregatesFilter<"VerificationStatusChange"> | string;
    reason?: Prisma.StringNullableWithAggregatesFilter<"VerificationStatusChange"> | string | null;
    markedFields?: Prisma.JsonNullableWithAggregatesFilter<"VerificationStatusChange">;
    changedBy?: Prisma.UuidNullableWithAggregatesFilter<"VerificationStatusChange"> | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"VerificationStatusChange"> | Date | string;
};
export type VerificationStatusChangeCreateInput = {
    id?: string;
    fromStatus?: string | null;
    toStatus: string;
    reason?: string | null;
    markedFields?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    changedBy?: string | null;
    createdAt?: Date | string;
    driver: Prisma.UserCreateNestedOneWithoutVerificationChangesInput;
};
export type VerificationStatusChangeUncheckedCreateInput = {
    id?: string;
    driverId: string;
    fromStatus?: string | null;
    toStatus: string;
    reason?: string | null;
    markedFields?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    changedBy?: string | null;
    createdAt?: Date | string;
};
export type VerificationStatusChangeUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    fromStatus?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toStatus?: Prisma.StringFieldUpdateOperationsInput | string;
    reason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    markedFields?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    changedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    driver?: Prisma.UserUpdateOneRequiredWithoutVerificationChangesNestedInput;
};
export type VerificationStatusChangeUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    driverId?: Prisma.StringFieldUpdateOperationsInput | string;
    fromStatus?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toStatus?: Prisma.StringFieldUpdateOperationsInput | string;
    reason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    markedFields?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    changedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type VerificationStatusChangeCreateManyInput = {
    id?: string;
    driverId: string;
    fromStatus?: string | null;
    toStatus: string;
    reason?: string | null;
    markedFields?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    changedBy?: string | null;
    createdAt?: Date | string;
};
export type VerificationStatusChangeUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    fromStatus?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toStatus?: Prisma.StringFieldUpdateOperationsInput | string;
    reason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    markedFields?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    changedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type VerificationStatusChangeUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    driverId?: Prisma.StringFieldUpdateOperationsInput | string;
    fromStatus?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toStatus?: Prisma.StringFieldUpdateOperationsInput | string;
    reason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    markedFields?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    changedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type VerificationStatusChangeListRelationFilter = {
    every?: Prisma.VerificationStatusChangeWhereInput;
    some?: Prisma.VerificationStatusChangeWhereInput;
    none?: Prisma.VerificationStatusChangeWhereInput;
};
export type VerificationStatusChangeOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type VerificationStatusChangeCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    driverId?: Prisma.SortOrder;
    fromStatus?: Prisma.SortOrder;
    toStatus?: Prisma.SortOrder;
    reason?: Prisma.SortOrder;
    markedFields?: Prisma.SortOrder;
    changedBy?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type VerificationStatusChangeMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    driverId?: Prisma.SortOrder;
    fromStatus?: Prisma.SortOrder;
    toStatus?: Prisma.SortOrder;
    reason?: Prisma.SortOrder;
    changedBy?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type VerificationStatusChangeMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    driverId?: Prisma.SortOrder;
    fromStatus?: Prisma.SortOrder;
    toStatus?: Prisma.SortOrder;
    reason?: Prisma.SortOrder;
    changedBy?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type VerificationStatusChangeCreateNestedManyWithoutDriverInput = {
    create?: Prisma.XOR<Prisma.VerificationStatusChangeCreateWithoutDriverInput, Prisma.VerificationStatusChangeUncheckedCreateWithoutDriverInput> | Prisma.VerificationStatusChangeCreateWithoutDriverInput[] | Prisma.VerificationStatusChangeUncheckedCreateWithoutDriverInput[];
    connectOrCreate?: Prisma.VerificationStatusChangeCreateOrConnectWithoutDriverInput | Prisma.VerificationStatusChangeCreateOrConnectWithoutDriverInput[];
    createMany?: Prisma.VerificationStatusChangeCreateManyDriverInputEnvelope;
    connect?: Prisma.VerificationStatusChangeWhereUniqueInput | Prisma.VerificationStatusChangeWhereUniqueInput[];
};
export type VerificationStatusChangeUncheckedCreateNestedManyWithoutDriverInput = {
    create?: Prisma.XOR<Prisma.VerificationStatusChangeCreateWithoutDriverInput, Prisma.VerificationStatusChangeUncheckedCreateWithoutDriverInput> | Prisma.VerificationStatusChangeCreateWithoutDriverInput[] | Prisma.VerificationStatusChangeUncheckedCreateWithoutDriverInput[];
    connectOrCreate?: Prisma.VerificationStatusChangeCreateOrConnectWithoutDriverInput | Prisma.VerificationStatusChangeCreateOrConnectWithoutDriverInput[];
    createMany?: Prisma.VerificationStatusChangeCreateManyDriverInputEnvelope;
    connect?: Prisma.VerificationStatusChangeWhereUniqueInput | Prisma.VerificationStatusChangeWhereUniqueInput[];
};
export type VerificationStatusChangeUpdateManyWithoutDriverNestedInput = {
    create?: Prisma.XOR<Prisma.VerificationStatusChangeCreateWithoutDriverInput, Prisma.VerificationStatusChangeUncheckedCreateWithoutDriverInput> | Prisma.VerificationStatusChangeCreateWithoutDriverInput[] | Prisma.VerificationStatusChangeUncheckedCreateWithoutDriverInput[];
    connectOrCreate?: Prisma.VerificationStatusChangeCreateOrConnectWithoutDriverInput | Prisma.VerificationStatusChangeCreateOrConnectWithoutDriverInput[];
    upsert?: Prisma.VerificationStatusChangeUpsertWithWhereUniqueWithoutDriverInput | Prisma.VerificationStatusChangeUpsertWithWhereUniqueWithoutDriverInput[];
    createMany?: Prisma.VerificationStatusChangeCreateManyDriverInputEnvelope;
    set?: Prisma.VerificationStatusChangeWhereUniqueInput | Prisma.VerificationStatusChangeWhereUniqueInput[];
    disconnect?: Prisma.VerificationStatusChangeWhereUniqueInput | Prisma.VerificationStatusChangeWhereUniqueInput[];
    delete?: Prisma.VerificationStatusChangeWhereUniqueInput | Prisma.VerificationStatusChangeWhereUniqueInput[];
    connect?: Prisma.VerificationStatusChangeWhereUniqueInput | Prisma.VerificationStatusChangeWhereUniqueInput[];
    update?: Prisma.VerificationStatusChangeUpdateWithWhereUniqueWithoutDriverInput | Prisma.VerificationStatusChangeUpdateWithWhereUniqueWithoutDriverInput[];
    updateMany?: Prisma.VerificationStatusChangeUpdateManyWithWhereWithoutDriverInput | Prisma.VerificationStatusChangeUpdateManyWithWhereWithoutDriverInput[];
    deleteMany?: Prisma.VerificationStatusChangeScalarWhereInput | Prisma.VerificationStatusChangeScalarWhereInput[];
};
export type VerificationStatusChangeUncheckedUpdateManyWithoutDriverNestedInput = {
    create?: Prisma.XOR<Prisma.VerificationStatusChangeCreateWithoutDriverInput, Prisma.VerificationStatusChangeUncheckedCreateWithoutDriverInput> | Prisma.VerificationStatusChangeCreateWithoutDriverInput[] | Prisma.VerificationStatusChangeUncheckedCreateWithoutDriverInput[];
    connectOrCreate?: Prisma.VerificationStatusChangeCreateOrConnectWithoutDriverInput | Prisma.VerificationStatusChangeCreateOrConnectWithoutDriverInput[];
    upsert?: Prisma.VerificationStatusChangeUpsertWithWhereUniqueWithoutDriverInput | Prisma.VerificationStatusChangeUpsertWithWhereUniqueWithoutDriverInput[];
    createMany?: Prisma.VerificationStatusChangeCreateManyDriverInputEnvelope;
    set?: Prisma.VerificationStatusChangeWhereUniqueInput | Prisma.VerificationStatusChangeWhereUniqueInput[];
    disconnect?: Prisma.VerificationStatusChangeWhereUniqueInput | Prisma.VerificationStatusChangeWhereUniqueInput[];
    delete?: Prisma.VerificationStatusChangeWhereUniqueInput | Prisma.VerificationStatusChangeWhereUniqueInput[];
    connect?: Prisma.VerificationStatusChangeWhereUniqueInput | Prisma.VerificationStatusChangeWhereUniqueInput[];
    update?: Prisma.VerificationStatusChangeUpdateWithWhereUniqueWithoutDriverInput | Prisma.VerificationStatusChangeUpdateWithWhereUniqueWithoutDriverInput[];
    updateMany?: Prisma.VerificationStatusChangeUpdateManyWithWhereWithoutDriverInput | Prisma.VerificationStatusChangeUpdateManyWithWhereWithoutDriverInput[];
    deleteMany?: Prisma.VerificationStatusChangeScalarWhereInput | Prisma.VerificationStatusChangeScalarWhereInput[];
};
export type VerificationStatusChangeCreateWithoutDriverInput = {
    id?: string;
    fromStatus?: string | null;
    toStatus: string;
    reason?: string | null;
    markedFields?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    changedBy?: string | null;
    createdAt?: Date | string;
};
export type VerificationStatusChangeUncheckedCreateWithoutDriverInput = {
    id?: string;
    fromStatus?: string | null;
    toStatus: string;
    reason?: string | null;
    markedFields?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    changedBy?: string | null;
    createdAt?: Date | string;
};
export type VerificationStatusChangeCreateOrConnectWithoutDriverInput = {
    where: Prisma.VerificationStatusChangeWhereUniqueInput;
    create: Prisma.XOR<Prisma.VerificationStatusChangeCreateWithoutDriverInput, Prisma.VerificationStatusChangeUncheckedCreateWithoutDriverInput>;
};
export type VerificationStatusChangeCreateManyDriverInputEnvelope = {
    data: Prisma.VerificationStatusChangeCreateManyDriverInput | Prisma.VerificationStatusChangeCreateManyDriverInput[];
    skipDuplicates?: boolean;
};
export type VerificationStatusChangeUpsertWithWhereUniqueWithoutDriverInput = {
    where: Prisma.VerificationStatusChangeWhereUniqueInput;
    update: Prisma.XOR<Prisma.VerificationStatusChangeUpdateWithoutDriverInput, Prisma.VerificationStatusChangeUncheckedUpdateWithoutDriverInput>;
    create: Prisma.XOR<Prisma.VerificationStatusChangeCreateWithoutDriverInput, Prisma.VerificationStatusChangeUncheckedCreateWithoutDriverInput>;
};
export type VerificationStatusChangeUpdateWithWhereUniqueWithoutDriverInput = {
    where: Prisma.VerificationStatusChangeWhereUniqueInput;
    data: Prisma.XOR<Prisma.VerificationStatusChangeUpdateWithoutDriverInput, Prisma.VerificationStatusChangeUncheckedUpdateWithoutDriverInput>;
};
export type VerificationStatusChangeUpdateManyWithWhereWithoutDriverInput = {
    where: Prisma.VerificationStatusChangeScalarWhereInput;
    data: Prisma.XOR<Prisma.VerificationStatusChangeUpdateManyMutationInput, Prisma.VerificationStatusChangeUncheckedUpdateManyWithoutDriverInput>;
};
export type VerificationStatusChangeScalarWhereInput = {
    AND?: Prisma.VerificationStatusChangeScalarWhereInput | Prisma.VerificationStatusChangeScalarWhereInput[];
    OR?: Prisma.VerificationStatusChangeScalarWhereInput[];
    NOT?: Prisma.VerificationStatusChangeScalarWhereInput | Prisma.VerificationStatusChangeScalarWhereInput[];
    id?: Prisma.UuidFilter<"VerificationStatusChange"> | string;
    driverId?: Prisma.UuidFilter<"VerificationStatusChange"> | string;
    fromStatus?: Prisma.StringNullableFilter<"VerificationStatusChange"> | string | null;
    toStatus?: Prisma.StringFilter<"VerificationStatusChange"> | string;
    reason?: Prisma.StringNullableFilter<"VerificationStatusChange"> | string | null;
    markedFields?: Prisma.JsonNullableFilter<"VerificationStatusChange">;
    changedBy?: Prisma.UuidNullableFilter<"VerificationStatusChange"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"VerificationStatusChange"> | Date | string;
};
export type VerificationStatusChangeCreateManyDriverInput = {
    id?: string;
    fromStatus?: string | null;
    toStatus: string;
    reason?: string | null;
    markedFields?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    changedBy?: string | null;
    createdAt?: Date | string;
};
export type VerificationStatusChangeUpdateWithoutDriverInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    fromStatus?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toStatus?: Prisma.StringFieldUpdateOperationsInput | string;
    reason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    markedFields?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    changedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type VerificationStatusChangeUncheckedUpdateWithoutDriverInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    fromStatus?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toStatus?: Prisma.StringFieldUpdateOperationsInput | string;
    reason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    markedFields?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    changedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type VerificationStatusChangeUncheckedUpdateManyWithoutDriverInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    fromStatus?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    toStatus?: Prisma.StringFieldUpdateOperationsInput | string;
    reason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    markedFields?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    changedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type VerificationStatusChangeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    driverId?: boolean;
    fromStatus?: boolean;
    toStatus?: boolean;
    reason?: boolean;
    markedFields?: boolean;
    changedBy?: boolean;
    createdAt?: boolean;
    driver?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["verificationStatusChange"]>;
export type VerificationStatusChangeSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    driverId?: boolean;
    fromStatus?: boolean;
    toStatus?: boolean;
    reason?: boolean;
    markedFields?: boolean;
    changedBy?: boolean;
    createdAt?: boolean;
    driver?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["verificationStatusChange"]>;
export type VerificationStatusChangeSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    driverId?: boolean;
    fromStatus?: boolean;
    toStatus?: boolean;
    reason?: boolean;
    markedFields?: boolean;
    changedBy?: boolean;
    createdAt?: boolean;
    driver?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["verificationStatusChange"]>;
export type VerificationStatusChangeSelectScalar = {
    id?: boolean;
    driverId?: boolean;
    fromStatus?: boolean;
    toStatus?: boolean;
    reason?: boolean;
    markedFields?: boolean;
    changedBy?: boolean;
    createdAt?: boolean;
};
export type VerificationStatusChangeOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "driverId" | "fromStatus" | "toStatus" | "reason" | "markedFields" | "changedBy" | "createdAt", ExtArgs["result"]["verificationStatusChange"]>;
export type VerificationStatusChangeInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    driver?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type VerificationStatusChangeIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    driver?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type VerificationStatusChangeIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    driver?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type $VerificationStatusChangePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "VerificationStatusChange";
    objects: {
        driver: Prisma.$UserPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        driverId: string;
        fromStatus: string | null;
        toStatus: string;
        reason: string | null;
        markedFields: runtime.JsonValue | null;
        changedBy: string | null;
        createdAt: Date;
    }, ExtArgs["result"]["verificationStatusChange"]>;
    composites: {};
};
export type VerificationStatusChangeGetPayload<S extends boolean | null | undefined | VerificationStatusChangeDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$VerificationStatusChangePayload, S>;
export type VerificationStatusChangeCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<VerificationStatusChangeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: VerificationStatusChangeCountAggregateInputType | true;
};
export interface VerificationStatusChangeDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['VerificationStatusChange'];
        meta: {
            name: 'VerificationStatusChange';
        };
    };
    findUnique<T extends VerificationStatusChangeFindUniqueArgs>(args: Prisma.SelectSubset<T, VerificationStatusChangeFindUniqueArgs<ExtArgs>>): Prisma.Prisma__VerificationStatusChangeClient<runtime.Types.Result.GetResult<Prisma.$VerificationStatusChangePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends VerificationStatusChangeFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, VerificationStatusChangeFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__VerificationStatusChangeClient<runtime.Types.Result.GetResult<Prisma.$VerificationStatusChangePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends VerificationStatusChangeFindFirstArgs>(args?: Prisma.SelectSubset<T, VerificationStatusChangeFindFirstArgs<ExtArgs>>): Prisma.Prisma__VerificationStatusChangeClient<runtime.Types.Result.GetResult<Prisma.$VerificationStatusChangePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends VerificationStatusChangeFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, VerificationStatusChangeFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__VerificationStatusChangeClient<runtime.Types.Result.GetResult<Prisma.$VerificationStatusChangePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends VerificationStatusChangeFindManyArgs>(args?: Prisma.SelectSubset<T, VerificationStatusChangeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$VerificationStatusChangePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends VerificationStatusChangeCreateArgs>(args: Prisma.SelectSubset<T, VerificationStatusChangeCreateArgs<ExtArgs>>): Prisma.Prisma__VerificationStatusChangeClient<runtime.Types.Result.GetResult<Prisma.$VerificationStatusChangePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends VerificationStatusChangeCreateManyArgs>(args?: Prisma.SelectSubset<T, VerificationStatusChangeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends VerificationStatusChangeCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, VerificationStatusChangeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$VerificationStatusChangePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends VerificationStatusChangeDeleteArgs>(args: Prisma.SelectSubset<T, VerificationStatusChangeDeleteArgs<ExtArgs>>): Prisma.Prisma__VerificationStatusChangeClient<runtime.Types.Result.GetResult<Prisma.$VerificationStatusChangePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends VerificationStatusChangeUpdateArgs>(args: Prisma.SelectSubset<T, VerificationStatusChangeUpdateArgs<ExtArgs>>): Prisma.Prisma__VerificationStatusChangeClient<runtime.Types.Result.GetResult<Prisma.$VerificationStatusChangePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends VerificationStatusChangeDeleteManyArgs>(args?: Prisma.SelectSubset<T, VerificationStatusChangeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends VerificationStatusChangeUpdateManyArgs>(args: Prisma.SelectSubset<T, VerificationStatusChangeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends VerificationStatusChangeUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, VerificationStatusChangeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$VerificationStatusChangePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends VerificationStatusChangeUpsertArgs>(args: Prisma.SelectSubset<T, VerificationStatusChangeUpsertArgs<ExtArgs>>): Prisma.Prisma__VerificationStatusChangeClient<runtime.Types.Result.GetResult<Prisma.$VerificationStatusChangePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends VerificationStatusChangeCountArgs>(args?: Prisma.Subset<T, VerificationStatusChangeCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], VerificationStatusChangeCountAggregateOutputType> : number>;
    aggregate<T extends VerificationStatusChangeAggregateArgs>(args: Prisma.Subset<T, VerificationStatusChangeAggregateArgs>): Prisma.PrismaPromise<GetVerificationStatusChangeAggregateType<T>>;
    groupBy<T extends VerificationStatusChangeGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: VerificationStatusChangeGroupByArgs['orderBy'];
    } : {
        orderBy?: VerificationStatusChangeGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, VerificationStatusChangeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetVerificationStatusChangeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: VerificationStatusChangeFieldRefs;
}
export interface Prisma__VerificationStatusChangeClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    driver<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface VerificationStatusChangeFieldRefs {
    readonly id: Prisma.FieldRef<"VerificationStatusChange", 'String'>;
    readonly driverId: Prisma.FieldRef<"VerificationStatusChange", 'String'>;
    readonly fromStatus: Prisma.FieldRef<"VerificationStatusChange", 'String'>;
    readonly toStatus: Prisma.FieldRef<"VerificationStatusChange", 'String'>;
    readonly reason: Prisma.FieldRef<"VerificationStatusChange", 'String'>;
    readonly markedFields: Prisma.FieldRef<"VerificationStatusChange", 'Json'>;
    readonly changedBy: Prisma.FieldRef<"VerificationStatusChange", 'String'>;
    readonly createdAt: Prisma.FieldRef<"VerificationStatusChange", 'DateTime'>;
}
export type VerificationStatusChangeFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.VerificationStatusChangeSelect<ExtArgs> | null;
    omit?: Prisma.VerificationStatusChangeOmit<ExtArgs> | null;
    include?: Prisma.VerificationStatusChangeInclude<ExtArgs> | null;
    where: Prisma.VerificationStatusChangeWhereUniqueInput;
};
export type VerificationStatusChangeFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.VerificationStatusChangeSelect<ExtArgs> | null;
    omit?: Prisma.VerificationStatusChangeOmit<ExtArgs> | null;
    include?: Prisma.VerificationStatusChangeInclude<ExtArgs> | null;
    where: Prisma.VerificationStatusChangeWhereUniqueInput;
};
export type VerificationStatusChangeFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.VerificationStatusChangeSelect<ExtArgs> | null;
    omit?: Prisma.VerificationStatusChangeOmit<ExtArgs> | null;
    include?: Prisma.VerificationStatusChangeInclude<ExtArgs> | null;
    where?: Prisma.VerificationStatusChangeWhereInput;
    orderBy?: Prisma.VerificationStatusChangeOrderByWithRelationInput | Prisma.VerificationStatusChangeOrderByWithRelationInput[];
    cursor?: Prisma.VerificationStatusChangeWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.VerificationStatusChangeScalarFieldEnum | Prisma.VerificationStatusChangeScalarFieldEnum[];
};
export type VerificationStatusChangeFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.VerificationStatusChangeSelect<ExtArgs> | null;
    omit?: Prisma.VerificationStatusChangeOmit<ExtArgs> | null;
    include?: Prisma.VerificationStatusChangeInclude<ExtArgs> | null;
    where?: Prisma.VerificationStatusChangeWhereInput;
    orderBy?: Prisma.VerificationStatusChangeOrderByWithRelationInput | Prisma.VerificationStatusChangeOrderByWithRelationInput[];
    cursor?: Prisma.VerificationStatusChangeWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.VerificationStatusChangeScalarFieldEnum | Prisma.VerificationStatusChangeScalarFieldEnum[];
};
export type VerificationStatusChangeFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.VerificationStatusChangeSelect<ExtArgs> | null;
    omit?: Prisma.VerificationStatusChangeOmit<ExtArgs> | null;
    include?: Prisma.VerificationStatusChangeInclude<ExtArgs> | null;
    where?: Prisma.VerificationStatusChangeWhereInput;
    orderBy?: Prisma.VerificationStatusChangeOrderByWithRelationInput | Prisma.VerificationStatusChangeOrderByWithRelationInput[];
    cursor?: Prisma.VerificationStatusChangeWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.VerificationStatusChangeScalarFieldEnum | Prisma.VerificationStatusChangeScalarFieldEnum[];
};
export type VerificationStatusChangeCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.VerificationStatusChangeSelect<ExtArgs> | null;
    omit?: Prisma.VerificationStatusChangeOmit<ExtArgs> | null;
    include?: Prisma.VerificationStatusChangeInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.VerificationStatusChangeCreateInput, Prisma.VerificationStatusChangeUncheckedCreateInput>;
};
export type VerificationStatusChangeCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.VerificationStatusChangeCreateManyInput | Prisma.VerificationStatusChangeCreateManyInput[];
    skipDuplicates?: boolean;
};
export type VerificationStatusChangeCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.VerificationStatusChangeSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.VerificationStatusChangeOmit<ExtArgs> | null;
    data: Prisma.VerificationStatusChangeCreateManyInput | Prisma.VerificationStatusChangeCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.VerificationStatusChangeIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type VerificationStatusChangeUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.VerificationStatusChangeSelect<ExtArgs> | null;
    omit?: Prisma.VerificationStatusChangeOmit<ExtArgs> | null;
    include?: Prisma.VerificationStatusChangeInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.VerificationStatusChangeUpdateInput, Prisma.VerificationStatusChangeUncheckedUpdateInput>;
    where: Prisma.VerificationStatusChangeWhereUniqueInput;
};
export type VerificationStatusChangeUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.VerificationStatusChangeUpdateManyMutationInput, Prisma.VerificationStatusChangeUncheckedUpdateManyInput>;
    where?: Prisma.VerificationStatusChangeWhereInput;
    limit?: number;
};
export type VerificationStatusChangeUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.VerificationStatusChangeSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.VerificationStatusChangeOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.VerificationStatusChangeUpdateManyMutationInput, Prisma.VerificationStatusChangeUncheckedUpdateManyInput>;
    where?: Prisma.VerificationStatusChangeWhereInput;
    limit?: number;
    include?: Prisma.VerificationStatusChangeIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type VerificationStatusChangeUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.VerificationStatusChangeSelect<ExtArgs> | null;
    omit?: Prisma.VerificationStatusChangeOmit<ExtArgs> | null;
    include?: Prisma.VerificationStatusChangeInclude<ExtArgs> | null;
    where: Prisma.VerificationStatusChangeWhereUniqueInput;
    create: Prisma.XOR<Prisma.VerificationStatusChangeCreateInput, Prisma.VerificationStatusChangeUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.VerificationStatusChangeUpdateInput, Prisma.VerificationStatusChangeUncheckedUpdateInput>;
};
export type VerificationStatusChangeDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.VerificationStatusChangeSelect<ExtArgs> | null;
    omit?: Prisma.VerificationStatusChangeOmit<ExtArgs> | null;
    include?: Prisma.VerificationStatusChangeInclude<ExtArgs> | null;
    where: Prisma.VerificationStatusChangeWhereUniqueInput;
};
export type VerificationStatusChangeDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.VerificationStatusChangeWhereInput;
    limit?: number;
};
export type VerificationStatusChangeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.VerificationStatusChangeSelect<ExtArgs> | null;
    omit?: Prisma.VerificationStatusChangeOmit<ExtArgs> | null;
    include?: Prisma.VerificationStatusChangeInclude<ExtArgs> | null;
};
