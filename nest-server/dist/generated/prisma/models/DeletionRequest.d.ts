import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums.js";
import type * as Prisma from "../internal/prismaNamespace.js";
export type DeletionRequestModel = runtime.Types.Result.DefaultSelection<Prisma.$DeletionRequestPayload>;
export type AggregateDeletionRequest = {
    _count: DeletionRequestCountAggregateOutputType | null;
    _min: DeletionRequestMinAggregateOutputType | null;
    _max: DeletionRequestMaxAggregateOutputType | null;
};
export type DeletionRequestMinAggregateOutputType = {
    id: string | null;
    userId: string | null;
    reason: string | null;
    status: $Enums.DeletionStatus | null;
    estimatedCompletion: Date | null;
    reviewNotes: string | null;
    reviewedBy: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type DeletionRequestMaxAggregateOutputType = {
    id: string | null;
    userId: string | null;
    reason: string | null;
    status: $Enums.DeletionStatus | null;
    estimatedCompletion: Date | null;
    reviewNotes: string | null;
    reviewedBy: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type DeletionRequestCountAggregateOutputType = {
    id: number;
    userId: number;
    reason: number;
    status: number;
    estimatedCompletion: number;
    reviewNotes: number;
    reviewedBy: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type DeletionRequestMinAggregateInputType = {
    id?: true;
    userId?: true;
    reason?: true;
    status?: true;
    estimatedCompletion?: true;
    reviewNotes?: true;
    reviewedBy?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type DeletionRequestMaxAggregateInputType = {
    id?: true;
    userId?: true;
    reason?: true;
    status?: true;
    estimatedCompletion?: true;
    reviewNotes?: true;
    reviewedBy?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type DeletionRequestCountAggregateInputType = {
    id?: true;
    userId?: true;
    reason?: true;
    status?: true;
    estimatedCompletion?: true;
    reviewNotes?: true;
    reviewedBy?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type DeletionRequestAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DeletionRequestWhereInput;
    orderBy?: Prisma.DeletionRequestOrderByWithRelationInput | Prisma.DeletionRequestOrderByWithRelationInput[];
    cursor?: Prisma.DeletionRequestWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | DeletionRequestCountAggregateInputType;
    _min?: DeletionRequestMinAggregateInputType;
    _max?: DeletionRequestMaxAggregateInputType;
};
export type GetDeletionRequestAggregateType<T extends DeletionRequestAggregateArgs> = {
    [P in keyof T & keyof AggregateDeletionRequest]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateDeletionRequest[P]> : Prisma.GetScalarType<T[P], AggregateDeletionRequest[P]>;
};
export type DeletionRequestGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DeletionRequestWhereInput;
    orderBy?: Prisma.DeletionRequestOrderByWithAggregationInput | Prisma.DeletionRequestOrderByWithAggregationInput[];
    by: Prisma.DeletionRequestScalarFieldEnum[] | Prisma.DeletionRequestScalarFieldEnum;
    having?: Prisma.DeletionRequestScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: DeletionRequestCountAggregateInputType | true;
    _min?: DeletionRequestMinAggregateInputType;
    _max?: DeletionRequestMaxAggregateInputType;
};
export type DeletionRequestGroupByOutputType = {
    id: string;
    userId: string;
    reason: string | null;
    status: $Enums.DeletionStatus;
    estimatedCompletion: Date | null;
    reviewNotes: string | null;
    reviewedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count: DeletionRequestCountAggregateOutputType | null;
    _min: DeletionRequestMinAggregateOutputType | null;
    _max: DeletionRequestMaxAggregateOutputType | null;
};
export type GetDeletionRequestGroupByPayload<T extends DeletionRequestGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<DeletionRequestGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof DeletionRequestGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], DeletionRequestGroupByOutputType[P]> : Prisma.GetScalarType<T[P], DeletionRequestGroupByOutputType[P]>;
}>>;
export type DeletionRequestWhereInput = {
    AND?: Prisma.DeletionRequestWhereInput | Prisma.DeletionRequestWhereInput[];
    OR?: Prisma.DeletionRequestWhereInput[];
    NOT?: Prisma.DeletionRequestWhereInput | Prisma.DeletionRequestWhereInput[];
    id?: Prisma.UuidFilter<"DeletionRequest"> | string;
    userId?: Prisma.UuidFilter<"DeletionRequest"> | string;
    reason?: Prisma.StringNullableFilter<"DeletionRequest"> | string | null;
    status?: Prisma.EnumDeletionStatusFilter<"DeletionRequest"> | $Enums.DeletionStatus;
    estimatedCompletion?: Prisma.DateTimeNullableFilter<"DeletionRequest"> | Date | string | null;
    reviewNotes?: Prisma.StringNullableFilter<"DeletionRequest"> | string | null;
    reviewedBy?: Prisma.UuidNullableFilter<"DeletionRequest"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"DeletionRequest"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"DeletionRequest"> | Date | string;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
};
export type DeletionRequestOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    reason?: Prisma.SortOrderInput | Prisma.SortOrder;
    status?: Prisma.SortOrder;
    estimatedCompletion?: Prisma.SortOrderInput | Prisma.SortOrder;
    reviewNotes?: Prisma.SortOrderInput | Prisma.SortOrder;
    reviewedBy?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    user?: Prisma.UserOrderByWithRelationInput;
};
export type DeletionRequestWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.DeletionRequestWhereInput | Prisma.DeletionRequestWhereInput[];
    OR?: Prisma.DeletionRequestWhereInput[];
    NOT?: Prisma.DeletionRequestWhereInput | Prisma.DeletionRequestWhereInput[];
    userId?: Prisma.UuidFilter<"DeletionRequest"> | string;
    reason?: Prisma.StringNullableFilter<"DeletionRequest"> | string | null;
    status?: Prisma.EnumDeletionStatusFilter<"DeletionRequest"> | $Enums.DeletionStatus;
    estimatedCompletion?: Prisma.DateTimeNullableFilter<"DeletionRequest"> | Date | string | null;
    reviewNotes?: Prisma.StringNullableFilter<"DeletionRequest"> | string | null;
    reviewedBy?: Prisma.UuidNullableFilter<"DeletionRequest"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"DeletionRequest"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"DeletionRequest"> | Date | string;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
}, "id">;
export type DeletionRequestOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    reason?: Prisma.SortOrderInput | Prisma.SortOrder;
    status?: Prisma.SortOrder;
    estimatedCompletion?: Prisma.SortOrderInput | Prisma.SortOrder;
    reviewNotes?: Prisma.SortOrderInput | Prisma.SortOrder;
    reviewedBy?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.DeletionRequestCountOrderByAggregateInput;
    _max?: Prisma.DeletionRequestMaxOrderByAggregateInput;
    _min?: Prisma.DeletionRequestMinOrderByAggregateInput;
};
export type DeletionRequestScalarWhereWithAggregatesInput = {
    AND?: Prisma.DeletionRequestScalarWhereWithAggregatesInput | Prisma.DeletionRequestScalarWhereWithAggregatesInput[];
    OR?: Prisma.DeletionRequestScalarWhereWithAggregatesInput[];
    NOT?: Prisma.DeletionRequestScalarWhereWithAggregatesInput | Prisma.DeletionRequestScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"DeletionRequest"> | string;
    userId?: Prisma.UuidWithAggregatesFilter<"DeletionRequest"> | string;
    reason?: Prisma.StringNullableWithAggregatesFilter<"DeletionRequest"> | string | null;
    status?: Prisma.EnumDeletionStatusWithAggregatesFilter<"DeletionRequest"> | $Enums.DeletionStatus;
    estimatedCompletion?: Prisma.DateTimeNullableWithAggregatesFilter<"DeletionRequest"> | Date | string | null;
    reviewNotes?: Prisma.StringNullableWithAggregatesFilter<"DeletionRequest"> | string | null;
    reviewedBy?: Prisma.UuidNullableWithAggregatesFilter<"DeletionRequest"> | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"DeletionRequest"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"DeletionRequest"> | Date | string;
};
export type DeletionRequestCreateInput = {
    id?: string;
    reason?: string | null;
    status?: $Enums.DeletionStatus;
    estimatedCompletion?: Date | string | null;
    reviewNotes?: string | null;
    reviewedBy?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutDeletionRequestsInput;
};
export type DeletionRequestUncheckedCreateInput = {
    id?: string;
    userId: string;
    reason?: string | null;
    status?: $Enums.DeletionStatus;
    estimatedCompletion?: Date | string | null;
    reviewNotes?: string | null;
    reviewedBy?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type DeletionRequestUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    reason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumDeletionStatusFieldUpdateOperationsInput | $Enums.DeletionStatus;
    estimatedCompletion?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    reviewNotes?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    reviewedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutDeletionRequestsNestedInput;
};
export type DeletionRequestUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    reason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumDeletionStatusFieldUpdateOperationsInput | $Enums.DeletionStatus;
    estimatedCompletion?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    reviewNotes?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    reviewedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DeletionRequestCreateManyInput = {
    id?: string;
    userId: string;
    reason?: string | null;
    status?: $Enums.DeletionStatus;
    estimatedCompletion?: Date | string | null;
    reviewNotes?: string | null;
    reviewedBy?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type DeletionRequestUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    reason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumDeletionStatusFieldUpdateOperationsInput | $Enums.DeletionStatus;
    estimatedCompletion?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    reviewNotes?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    reviewedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DeletionRequestUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    reason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumDeletionStatusFieldUpdateOperationsInput | $Enums.DeletionStatus;
    estimatedCompletion?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    reviewNotes?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    reviewedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DeletionRequestListRelationFilter = {
    every?: Prisma.DeletionRequestWhereInput;
    some?: Prisma.DeletionRequestWhereInput;
    none?: Prisma.DeletionRequestWhereInput;
};
export type DeletionRequestOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type DeletionRequestCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    reason?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    estimatedCompletion?: Prisma.SortOrder;
    reviewNotes?: Prisma.SortOrder;
    reviewedBy?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type DeletionRequestMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    reason?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    estimatedCompletion?: Prisma.SortOrder;
    reviewNotes?: Prisma.SortOrder;
    reviewedBy?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type DeletionRequestMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    reason?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    estimatedCompletion?: Prisma.SortOrder;
    reviewNotes?: Prisma.SortOrder;
    reviewedBy?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type DeletionRequestCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.DeletionRequestCreateWithoutUserInput, Prisma.DeletionRequestUncheckedCreateWithoutUserInput> | Prisma.DeletionRequestCreateWithoutUserInput[] | Prisma.DeletionRequestUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.DeletionRequestCreateOrConnectWithoutUserInput | Prisma.DeletionRequestCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.DeletionRequestCreateManyUserInputEnvelope;
    connect?: Prisma.DeletionRequestWhereUniqueInput | Prisma.DeletionRequestWhereUniqueInput[];
};
export type DeletionRequestUncheckedCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.DeletionRequestCreateWithoutUserInput, Prisma.DeletionRequestUncheckedCreateWithoutUserInput> | Prisma.DeletionRequestCreateWithoutUserInput[] | Prisma.DeletionRequestUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.DeletionRequestCreateOrConnectWithoutUserInput | Prisma.DeletionRequestCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.DeletionRequestCreateManyUserInputEnvelope;
    connect?: Prisma.DeletionRequestWhereUniqueInput | Prisma.DeletionRequestWhereUniqueInput[];
};
export type DeletionRequestUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.DeletionRequestCreateWithoutUserInput, Prisma.DeletionRequestUncheckedCreateWithoutUserInput> | Prisma.DeletionRequestCreateWithoutUserInput[] | Prisma.DeletionRequestUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.DeletionRequestCreateOrConnectWithoutUserInput | Prisma.DeletionRequestCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.DeletionRequestUpsertWithWhereUniqueWithoutUserInput | Prisma.DeletionRequestUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.DeletionRequestCreateManyUserInputEnvelope;
    set?: Prisma.DeletionRequestWhereUniqueInput | Prisma.DeletionRequestWhereUniqueInput[];
    disconnect?: Prisma.DeletionRequestWhereUniqueInput | Prisma.DeletionRequestWhereUniqueInput[];
    delete?: Prisma.DeletionRequestWhereUniqueInput | Prisma.DeletionRequestWhereUniqueInput[];
    connect?: Prisma.DeletionRequestWhereUniqueInput | Prisma.DeletionRequestWhereUniqueInput[];
    update?: Prisma.DeletionRequestUpdateWithWhereUniqueWithoutUserInput | Prisma.DeletionRequestUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.DeletionRequestUpdateManyWithWhereWithoutUserInput | Prisma.DeletionRequestUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.DeletionRequestScalarWhereInput | Prisma.DeletionRequestScalarWhereInput[];
};
export type DeletionRequestUncheckedUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.DeletionRequestCreateWithoutUserInput, Prisma.DeletionRequestUncheckedCreateWithoutUserInput> | Prisma.DeletionRequestCreateWithoutUserInput[] | Prisma.DeletionRequestUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.DeletionRequestCreateOrConnectWithoutUserInput | Prisma.DeletionRequestCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.DeletionRequestUpsertWithWhereUniqueWithoutUserInput | Prisma.DeletionRequestUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.DeletionRequestCreateManyUserInputEnvelope;
    set?: Prisma.DeletionRequestWhereUniqueInput | Prisma.DeletionRequestWhereUniqueInput[];
    disconnect?: Prisma.DeletionRequestWhereUniqueInput | Prisma.DeletionRequestWhereUniqueInput[];
    delete?: Prisma.DeletionRequestWhereUniqueInput | Prisma.DeletionRequestWhereUniqueInput[];
    connect?: Prisma.DeletionRequestWhereUniqueInput | Prisma.DeletionRequestWhereUniqueInput[];
    update?: Prisma.DeletionRequestUpdateWithWhereUniqueWithoutUserInput | Prisma.DeletionRequestUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.DeletionRequestUpdateManyWithWhereWithoutUserInput | Prisma.DeletionRequestUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.DeletionRequestScalarWhereInput | Prisma.DeletionRequestScalarWhereInput[];
};
export type EnumDeletionStatusFieldUpdateOperationsInput = {
    set?: $Enums.DeletionStatus;
};
export type DeletionRequestCreateWithoutUserInput = {
    id?: string;
    reason?: string | null;
    status?: $Enums.DeletionStatus;
    estimatedCompletion?: Date | string | null;
    reviewNotes?: string | null;
    reviewedBy?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type DeletionRequestUncheckedCreateWithoutUserInput = {
    id?: string;
    reason?: string | null;
    status?: $Enums.DeletionStatus;
    estimatedCompletion?: Date | string | null;
    reviewNotes?: string | null;
    reviewedBy?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type DeletionRequestCreateOrConnectWithoutUserInput = {
    where: Prisma.DeletionRequestWhereUniqueInput;
    create: Prisma.XOR<Prisma.DeletionRequestCreateWithoutUserInput, Prisma.DeletionRequestUncheckedCreateWithoutUserInput>;
};
export type DeletionRequestCreateManyUserInputEnvelope = {
    data: Prisma.DeletionRequestCreateManyUserInput | Prisma.DeletionRequestCreateManyUserInput[];
    skipDuplicates?: boolean;
};
export type DeletionRequestUpsertWithWhereUniqueWithoutUserInput = {
    where: Prisma.DeletionRequestWhereUniqueInput;
    update: Prisma.XOR<Prisma.DeletionRequestUpdateWithoutUserInput, Prisma.DeletionRequestUncheckedUpdateWithoutUserInput>;
    create: Prisma.XOR<Prisma.DeletionRequestCreateWithoutUserInput, Prisma.DeletionRequestUncheckedCreateWithoutUserInput>;
};
export type DeletionRequestUpdateWithWhereUniqueWithoutUserInput = {
    where: Prisma.DeletionRequestWhereUniqueInput;
    data: Prisma.XOR<Prisma.DeletionRequestUpdateWithoutUserInput, Prisma.DeletionRequestUncheckedUpdateWithoutUserInput>;
};
export type DeletionRequestUpdateManyWithWhereWithoutUserInput = {
    where: Prisma.DeletionRequestScalarWhereInput;
    data: Prisma.XOR<Prisma.DeletionRequestUpdateManyMutationInput, Prisma.DeletionRequestUncheckedUpdateManyWithoutUserInput>;
};
export type DeletionRequestScalarWhereInput = {
    AND?: Prisma.DeletionRequestScalarWhereInput | Prisma.DeletionRequestScalarWhereInput[];
    OR?: Prisma.DeletionRequestScalarWhereInput[];
    NOT?: Prisma.DeletionRequestScalarWhereInput | Prisma.DeletionRequestScalarWhereInput[];
    id?: Prisma.UuidFilter<"DeletionRequest"> | string;
    userId?: Prisma.UuidFilter<"DeletionRequest"> | string;
    reason?: Prisma.StringNullableFilter<"DeletionRequest"> | string | null;
    status?: Prisma.EnumDeletionStatusFilter<"DeletionRequest"> | $Enums.DeletionStatus;
    estimatedCompletion?: Prisma.DateTimeNullableFilter<"DeletionRequest"> | Date | string | null;
    reviewNotes?: Prisma.StringNullableFilter<"DeletionRequest"> | string | null;
    reviewedBy?: Prisma.UuidNullableFilter<"DeletionRequest"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"DeletionRequest"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"DeletionRequest"> | Date | string;
};
export type DeletionRequestCreateManyUserInput = {
    id?: string;
    reason?: string | null;
    status?: $Enums.DeletionStatus;
    estimatedCompletion?: Date | string | null;
    reviewNotes?: string | null;
    reviewedBy?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type DeletionRequestUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    reason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumDeletionStatusFieldUpdateOperationsInput | $Enums.DeletionStatus;
    estimatedCompletion?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    reviewNotes?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    reviewedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DeletionRequestUncheckedUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    reason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumDeletionStatusFieldUpdateOperationsInput | $Enums.DeletionStatus;
    estimatedCompletion?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    reviewNotes?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    reviewedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DeletionRequestUncheckedUpdateManyWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    reason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.EnumDeletionStatusFieldUpdateOperationsInput | $Enums.DeletionStatus;
    estimatedCompletion?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    reviewNotes?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    reviewedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DeletionRequestSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    reason?: boolean;
    status?: boolean;
    estimatedCompletion?: boolean;
    reviewNotes?: boolean;
    reviewedBy?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["deletionRequest"]>;
export type DeletionRequestSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    reason?: boolean;
    status?: boolean;
    estimatedCompletion?: boolean;
    reviewNotes?: boolean;
    reviewedBy?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["deletionRequest"]>;
export type DeletionRequestSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    reason?: boolean;
    status?: boolean;
    estimatedCompletion?: boolean;
    reviewNotes?: boolean;
    reviewedBy?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["deletionRequest"]>;
export type DeletionRequestSelectScalar = {
    id?: boolean;
    userId?: boolean;
    reason?: boolean;
    status?: boolean;
    estimatedCompletion?: boolean;
    reviewNotes?: boolean;
    reviewedBy?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type DeletionRequestOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "userId" | "reason" | "status" | "estimatedCompletion" | "reviewNotes" | "reviewedBy" | "createdAt" | "updatedAt", ExtArgs["result"]["deletionRequest"]>;
export type DeletionRequestInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type DeletionRequestIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type DeletionRequestIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type $DeletionRequestPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "DeletionRequest";
    objects: {
        user: Prisma.$UserPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        userId: string;
        reason: string | null;
        status: $Enums.DeletionStatus;
        estimatedCompletion: Date | null;
        reviewNotes: string | null;
        reviewedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["deletionRequest"]>;
    composites: {};
};
export type DeletionRequestGetPayload<S extends boolean | null | undefined | DeletionRequestDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$DeletionRequestPayload, S>;
export type DeletionRequestCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<DeletionRequestFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: DeletionRequestCountAggregateInputType | true;
};
export interface DeletionRequestDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['DeletionRequest'];
        meta: {
            name: 'DeletionRequest';
        };
    };
    findUnique<T extends DeletionRequestFindUniqueArgs>(args: Prisma.SelectSubset<T, DeletionRequestFindUniqueArgs<ExtArgs>>): Prisma.Prisma__DeletionRequestClient<runtime.Types.Result.GetResult<Prisma.$DeletionRequestPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends DeletionRequestFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, DeletionRequestFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__DeletionRequestClient<runtime.Types.Result.GetResult<Prisma.$DeletionRequestPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends DeletionRequestFindFirstArgs>(args?: Prisma.SelectSubset<T, DeletionRequestFindFirstArgs<ExtArgs>>): Prisma.Prisma__DeletionRequestClient<runtime.Types.Result.GetResult<Prisma.$DeletionRequestPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends DeletionRequestFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, DeletionRequestFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__DeletionRequestClient<runtime.Types.Result.GetResult<Prisma.$DeletionRequestPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends DeletionRequestFindManyArgs>(args?: Prisma.SelectSubset<T, DeletionRequestFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DeletionRequestPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends DeletionRequestCreateArgs>(args: Prisma.SelectSubset<T, DeletionRequestCreateArgs<ExtArgs>>): Prisma.Prisma__DeletionRequestClient<runtime.Types.Result.GetResult<Prisma.$DeletionRequestPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends DeletionRequestCreateManyArgs>(args?: Prisma.SelectSubset<T, DeletionRequestCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends DeletionRequestCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, DeletionRequestCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DeletionRequestPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends DeletionRequestDeleteArgs>(args: Prisma.SelectSubset<T, DeletionRequestDeleteArgs<ExtArgs>>): Prisma.Prisma__DeletionRequestClient<runtime.Types.Result.GetResult<Prisma.$DeletionRequestPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends DeletionRequestUpdateArgs>(args: Prisma.SelectSubset<T, DeletionRequestUpdateArgs<ExtArgs>>): Prisma.Prisma__DeletionRequestClient<runtime.Types.Result.GetResult<Prisma.$DeletionRequestPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends DeletionRequestDeleteManyArgs>(args?: Prisma.SelectSubset<T, DeletionRequestDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends DeletionRequestUpdateManyArgs>(args: Prisma.SelectSubset<T, DeletionRequestUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends DeletionRequestUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, DeletionRequestUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DeletionRequestPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends DeletionRequestUpsertArgs>(args: Prisma.SelectSubset<T, DeletionRequestUpsertArgs<ExtArgs>>): Prisma.Prisma__DeletionRequestClient<runtime.Types.Result.GetResult<Prisma.$DeletionRequestPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends DeletionRequestCountArgs>(args?: Prisma.Subset<T, DeletionRequestCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], DeletionRequestCountAggregateOutputType> : number>;
    aggregate<T extends DeletionRequestAggregateArgs>(args: Prisma.Subset<T, DeletionRequestAggregateArgs>): Prisma.PrismaPromise<GetDeletionRequestAggregateType<T>>;
    groupBy<T extends DeletionRequestGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: DeletionRequestGroupByArgs['orderBy'];
    } : {
        orderBy?: DeletionRequestGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, DeletionRequestGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDeletionRequestGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: DeletionRequestFieldRefs;
}
export interface Prisma__DeletionRequestClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    user<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface DeletionRequestFieldRefs {
    readonly id: Prisma.FieldRef<"DeletionRequest", 'String'>;
    readonly userId: Prisma.FieldRef<"DeletionRequest", 'String'>;
    readonly reason: Prisma.FieldRef<"DeletionRequest", 'String'>;
    readonly status: Prisma.FieldRef<"DeletionRequest", 'DeletionStatus'>;
    readonly estimatedCompletion: Prisma.FieldRef<"DeletionRequest", 'DateTime'>;
    readonly reviewNotes: Prisma.FieldRef<"DeletionRequest", 'String'>;
    readonly reviewedBy: Prisma.FieldRef<"DeletionRequest", 'String'>;
    readonly createdAt: Prisma.FieldRef<"DeletionRequest", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"DeletionRequest", 'DateTime'>;
}
export type DeletionRequestFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DeletionRequestSelect<ExtArgs> | null;
    omit?: Prisma.DeletionRequestOmit<ExtArgs> | null;
    include?: Prisma.DeletionRequestInclude<ExtArgs> | null;
    where: Prisma.DeletionRequestWhereUniqueInput;
};
export type DeletionRequestFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DeletionRequestSelect<ExtArgs> | null;
    omit?: Prisma.DeletionRequestOmit<ExtArgs> | null;
    include?: Prisma.DeletionRequestInclude<ExtArgs> | null;
    where: Prisma.DeletionRequestWhereUniqueInput;
};
export type DeletionRequestFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DeletionRequestSelect<ExtArgs> | null;
    omit?: Prisma.DeletionRequestOmit<ExtArgs> | null;
    include?: Prisma.DeletionRequestInclude<ExtArgs> | null;
    where?: Prisma.DeletionRequestWhereInput;
    orderBy?: Prisma.DeletionRequestOrderByWithRelationInput | Prisma.DeletionRequestOrderByWithRelationInput[];
    cursor?: Prisma.DeletionRequestWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DeletionRequestScalarFieldEnum | Prisma.DeletionRequestScalarFieldEnum[];
};
export type DeletionRequestFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DeletionRequestSelect<ExtArgs> | null;
    omit?: Prisma.DeletionRequestOmit<ExtArgs> | null;
    include?: Prisma.DeletionRequestInclude<ExtArgs> | null;
    where?: Prisma.DeletionRequestWhereInput;
    orderBy?: Prisma.DeletionRequestOrderByWithRelationInput | Prisma.DeletionRequestOrderByWithRelationInput[];
    cursor?: Prisma.DeletionRequestWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DeletionRequestScalarFieldEnum | Prisma.DeletionRequestScalarFieldEnum[];
};
export type DeletionRequestFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DeletionRequestSelect<ExtArgs> | null;
    omit?: Prisma.DeletionRequestOmit<ExtArgs> | null;
    include?: Prisma.DeletionRequestInclude<ExtArgs> | null;
    where?: Prisma.DeletionRequestWhereInput;
    orderBy?: Prisma.DeletionRequestOrderByWithRelationInput | Prisma.DeletionRequestOrderByWithRelationInput[];
    cursor?: Prisma.DeletionRequestWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DeletionRequestScalarFieldEnum | Prisma.DeletionRequestScalarFieldEnum[];
};
export type DeletionRequestCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DeletionRequestSelect<ExtArgs> | null;
    omit?: Prisma.DeletionRequestOmit<ExtArgs> | null;
    include?: Prisma.DeletionRequestInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DeletionRequestCreateInput, Prisma.DeletionRequestUncheckedCreateInput>;
};
export type DeletionRequestCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.DeletionRequestCreateManyInput | Prisma.DeletionRequestCreateManyInput[];
    skipDuplicates?: boolean;
};
export type DeletionRequestCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DeletionRequestSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.DeletionRequestOmit<ExtArgs> | null;
    data: Prisma.DeletionRequestCreateManyInput | Prisma.DeletionRequestCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.DeletionRequestIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type DeletionRequestUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DeletionRequestSelect<ExtArgs> | null;
    omit?: Prisma.DeletionRequestOmit<ExtArgs> | null;
    include?: Prisma.DeletionRequestInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DeletionRequestUpdateInput, Prisma.DeletionRequestUncheckedUpdateInput>;
    where: Prisma.DeletionRequestWhereUniqueInput;
};
export type DeletionRequestUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.DeletionRequestUpdateManyMutationInput, Prisma.DeletionRequestUncheckedUpdateManyInput>;
    where?: Prisma.DeletionRequestWhereInput;
    limit?: number;
};
export type DeletionRequestUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DeletionRequestSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.DeletionRequestOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DeletionRequestUpdateManyMutationInput, Prisma.DeletionRequestUncheckedUpdateManyInput>;
    where?: Prisma.DeletionRequestWhereInput;
    limit?: number;
    include?: Prisma.DeletionRequestIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type DeletionRequestUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DeletionRequestSelect<ExtArgs> | null;
    omit?: Prisma.DeletionRequestOmit<ExtArgs> | null;
    include?: Prisma.DeletionRequestInclude<ExtArgs> | null;
    where: Prisma.DeletionRequestWhereUniqueInput;
    create: Prisma.XOR<Prisma.DeletionRequestCreateInput, Prisma.DeletionRequestUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.DeletionRequestUpdateInput, Prisma.DeletionRequestUncheckedUpdateInput>;
};
export type DeletionRequestDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DeletionRequestSelect<ExtArgs> | null;
    omit?: Prisma.DeletionRequestOmit<ExtArgs> | null;
    include?: Prisma.DeletionRequestInclude<ExtArgs> | null;
    where: Prisma.DeletionRequestWhereUniqueInput;
};
export type DeletionRequestDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DeletionRequestWhereInput;
    limit?: number;
};
export type DeletionRequestDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DeletionRequestSelect<ExtArgs> | null;
    omit?: Prisma.DeletionRequestOmit<ExtArgs> | null;
    include?: Prisma.DeletionRequestInclude<ExtArgs> | null;
};
