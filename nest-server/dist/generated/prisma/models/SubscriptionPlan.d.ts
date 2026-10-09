import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type SubscriptionPlanModel = runtime.Types.Result.DefaultSelection<Prisma.$SubscriptionPlanPayload>;
export type AggregateSubscriptionPlan = {
    _count: SubscriptionPlanCountAggregateOutputType | null;
    _avg: SubscriptionPlanAvgAggregateOutputType | null;
    _sum: SubscriptionPlanSumAggregateOutputType | null;
    _min: SubscriptionPlanMinAggregateOutputType | null;
    _max: SubscriptionPlanMaxAggregateOutputType | null;
};
export type SubscriptionPlanAvgAggregateOutputType = {
    periodDays: number | null;
    percentageCut: runtime.Decimal | null;
    cost: runtime.Decimal | null;
};
export type SubscriptionPlanSumAggregateOutputType = {
    periodDays: number | null;
    percentageCut: runtime.Decimal | null;
    cost: runtime.Decimal | null;
};
export type SubscriptionPlanMinAggregateOutputType = {
    id: string | null;
    name: string | null;
    periodDays: number | null;
    percentageCut: runtime.Decimal | null;
    cost: runtime.Decimal | null;
    status: string | null;
    isFree: boolean | null;
    isActive: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type SubscriptionPlanMaxAggregateOutputType = {
    id: string | null;
    name: string | null;
    periodDays: number | null;
    percentageCut: runtime.Decimal | null;
    cost: runtime.Decimal | null;
    status: string | null;
    isFree: boolean | null;
    isActive: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type SubscriptionPlanCountAggregateOutputType = {
    id: number;
    name: number;
    periodDays: number;
    percentageCut: number;
    cost: number;
    status: number;
    features: number;
    isFree: number;
    freeOffer: number;
    isActive: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type SubscriptionPlanAvgAggregateInputType = {
    periodDays?: true;
    percentageCut?: true;
    cost?: true;
};
export type SubscriptionPlanSumAggregateInputType = {
    periodDays?: true;
    percentageCut?: true;
    cost?: true;
};
export type SubscriptionPlanMinAggregateInputType = {
    id?: true;
    name?: true;
    periodDays?: true;
    percentageCut?: true;
    cost?: true;
    status?: true;
    isFree?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type SubscriptionPlanMaxAggregateInputType = {
    id?: true;
    name?: true;
    periodDays?: true;
    percentageCut?: true;
    cost?: true;
    status?: true;
    isFree?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type SubscriptionPlanCountAggregateInputType = {
    id?: true;
    name?: true;
    periodDays?: true;
    percentageCut?: true;
    cost?: true;
    status?: true;
    features?: true;
    isFree?: true;
    freeOffer?: true;
    isActive?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type SubscriptionPlanAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SubscriptionPlanWhereInput;
    orderBy?: Prisma.SubscriptionPlanOrderByWithRelationInput | Prisma.SubscriptionPlanOrderByWithRelationInput[];
    cursor?: Prisma.SubscriptionPlanWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | SubscriptionPlanCountAggregateInputType;
    _avg?: SubscriptionPlanAvgAggregateInputType;
    _sum?: SubscriptionPlanSumAggregateInputType;
    _min?: SubscriptionPlanMinAggregateInputType;
    _max?: SubscriptionPlanMaxAggregateInputType;
};
export type GetSubscriptionPlanAggregateType<T extends SubscriptionPlanAggregateArgs> = {
    [P in keyof T & keyof AggregateSubscriptionPlan]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateSubscriptionPlan[P]> : Prisma.GetScalarType<T[P], AggregateSubscriptionPlan[P]>;
};
export type SubscriptionPlanGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SubscriptionPlanWhereInput;
    orderBy?: Prisma.SubscriptionPlanOrderByWithAggregationInput | Prisma.SubscriptionPlanOrderByWithAggregationInput[];
    by: Prisma.SubscriptionPlanScalarFieldEnum[] | Prisma.SubscriptionPlanScalarFieldEnum;
    having?: Prisma.SubscriptionPlanScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: SubscriptionPlanCountAggregateInputType | true;
    _avg?: SubscriptionPlanAvgAggregateInputType;
    _sum?: SubscriptionPlanSumAggregateInputType;
    _min?: SubscriptionPlanMinAggregateInputType;
    _max?: SubscriptionPlanMaxAggregateInputType;
};
export type SubscriptionPlanGroupByOutputType = {
    id: string;
    name: string;
    periodDays: number;
    percentageCut: runtime.Decimal;
    cost: runtime.Decimal;
    status: string | null;
    features: runtime.JsonValue;
    isFree: boolean;
    freeOffer: runtime.JsonValue | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: SubscriptionPlanCountAggregateOutputType | null;
    _avg: SubscriptionPlanAvgAggregateOutputType | null;
    _sum: SubscriptionPlanSumAggregateOutputType | null;
    _min: SubscriptionPlanMinAggregateOutputType | null;
    _max: SubscriptionPlanMaxAggregateOutputType | null;
};
export type GetSubscriptionPlanGroupByPayload<T extends SubscriptionPlanGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<SubscriptionPlanGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof SubscriptionPlanGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], SubscriptionPlanGroupByOutputType[P]> : Prisma.GetScalarType<T[P], SubscriptionPlanGroupByOutputType[P]>;
}>>;
export type SubscriptionPlanWhereInput = {
    AND?: Prisma.SubscriptionPlanWhereInput | Prisma.SubscriptionPlanWhereInput[];
    OR?: Prisma.SubscriptionPlanWhereInput[];
    NOT?: Prisma.SubscriptionPlanWhereInput | Prisma.SubscriptionPlanWhereInput[];
    id?: Prisma.UuidFilter<"SubscriptionPlan"> | string;
    name?: Prisma.StringFilter<"SubscriptionPlan"> | string;
    periodDays?: Prisma.IntFilter<"SubscriptionPlan"> | number;
    percentageCut?: Prisma.DecimalFilter<"SubscriptionPlan"> | runtime.Decimal | runtime.DecimalJsLike | number | string;
    cost?: Prisma.DecimalFilter<"SubscriptionPlan"> | runtime.Decimal | runtime.DecimalJsLike | number | string;
    status?: Prisma.StringNullableFilter<"SubscriptionPlan"> | string | null;
    features?: Prisma.JsonFilter<"SubscriptionPlan">;
    isFree?: Prisma.BoolFilter<"SubscriptionPlan"> | boolean;
    freeOffer?: Prisma.JsonNullableFilter<"SubscriptionPlan">;
    isActive?: Prisma.BoolFilter<"SubscriptionPlan"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"SubscriptionPlan"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"SubscriptionPlan"> | Date | string;
    subscriptions?: Prisma.DriverSubscriptionListRelationFilter;
};
export type SubscriptionPlanOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    periodDays?: Prisma.SortOrder;
    percentageCut?: Prisma.SortOrder;
    cost?: Prisma.SortOrder;
    status?: Prisma.SortOrderInput | Prisma.SortOrder;
    features?: Prisma.SortOrder;
    isFree?: Prisma.SortOrder;
    freeOffer?: Prisma.SortOrderInput | Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    subscriptions?: Prisma.DriverSubscriptionOrderByRelationAggregateInput;
};
export type SubscriptionPlanWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.SubscriptionPlanWhereInput | Prisma.SubscriptionPlanWhereInput[];
    OR?: Prisma.SubscriptionPlanWhereInput[];
    NOT?: Prisma.SubscriptionPlanWhereInput | Prisma.SubscriptionPlanWhereInput[];
    name?: Prisma.StringFilter<"SubscriptionPlan"> | string;
    periodDays?: Prisma.IntFilter<"SubscriptionPlan"> | number;
    percentageCut?: Prisma.DecimalFilter<"SubscriptionPlan"> | runtime.Decimal | runtime.DecimalJsLike | number | string;
    cost?: Prisma.DecimalFilter<"SubscriptionPlan"> | runtime.Decimal | runtime.DecimalJsLike | number | string;
    status?: Prisma.StringNullableFilter<"SubscriptionPlan"> | string | null;
    features?: Prisma.JsonFilter<"SubscriptionPlan">;
    isFree?: Prisma.BoolFilter<"SubscriptionPlan"> | boolean;
    freeOffer?: Prisma.JsonNullableFilter<"SubscriptionPlan">;
    isActive?: Prisma.BoolFilter<"SubscriptionPlan"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"SubscriptionPlan"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"SubscriptionPlan"> | Date | string;
    subscriptions?: Prisma.DriverSubscriptionListRelationFilter;
}, "id">;
export type SubscriptionPlanOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    periodDays?: Prisma.SortOrder;
    percentageCut?: Prisma.SortOrder;
    cost?: Prisma.SortOrder;
    status?: Prisma.SortOrderInput | Prisma.SortOrder;
    features?: Prisma.SortOrder;
    isFree?: Prisma.SortOrder;
    freeOffer?: Prisma.SortOrderInput | Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.SubscriptionPlanCountOrderByAggregateInput;
    _avg?: Prisma.SubscriptionPlanAvgOrderByAggregateInput;
    _max?: Prisma.SubscriptionPlanMaxOrderByAggregateInput;
    _min?: Prisma.SubscriptionPlanMinOrderByAggregateInput;
    _sum?: Prisma.SubscriptionPlanSumOrderByAggregateInput;
};
export type SubscriptionPlanScalarWhereWithAggregatesInput = {
    AND?: Prisma.SubscriptionPlanScalarWhereWithAggregatesInput | Prisma.SubscriptionPlanScalarWhereWithAggregatesInput[];
    OR?: Prisma.SubscriptionPlanScalarWhereWithAggregatesInput[];
    NOT?: Prisma.SubscriptionPlanScalarWhereWithAggregatesInput | Prisma.SubscriptionPlanScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"SubscriptionPlan"> | string;
    name?: Prisma.StringWithAggregatesFilter<"SubscriptionPlan"> | string;
    periodDays?: Prisma.IntWithAggregatesFilter<"SubscriptionPlan"> | number;
    percentageCut?: Prisma.DecimalWithAggregatesFilter<"SubscriptionPlan"> | runtime.Decimal | runtime.DecimalJsLike | number | string;
    cost?: Prisma.DecimalWithAggregatesFilter<"SubscriptionPlan"> | runtime.Decimal | runtime.DecimalJsLike | number | string;
    status?: Prisma.StringNullableWithAggregatesFilter<"SubscriptionPlan"> | string | null;
    features?: Prisma.JsonWithAggregatesFilter<"SubscriptionPlan">;
    isFree?: Prisma.BoolWithAggregatesFilter<"SubscriptionPlan"> | boolean;
    freeOffer?: Prisma.JsonNullableWithAggregatesFilter<"SubscriptionPlan">;
    isActive?: Prisma.BoolWithAggregatesFilter<"SubscriptionPlan"> | boolean;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"SubscriptionPlan"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"SubscriptionPlan"> | Date | string;
};
export type SubscriptionPlanCreateInput = {
    id?: string;
    name: string;
    periodDays: number;
    percentageCut?: runtime.Decimal | runtime.DecimalJsLike | number | string;
    cost?: runtime.Decimal | runtime.DecimalJsLike | number | string;
    status?: string | null;
    features?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isFree?: boolean;
    freeOffer?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    subscriptions?: Prisma.DriverSubscriptionCreateNestedManyWithoutPlanInput;
};
export type SubscriptionPlanUncheckedCreateInput = {
    id?: string;
    name: string;
    periodDays: number;
    percentageCut?: runtime.Decimal | runtime.DecimalJsLike | number | string;
    cost?: runtime.Decimal | runtime.DecimalJsLike | number | string;
    status?: string | null;
    features?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isFree?: boolean;
    freeOffer?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    subscriptions?: Prisma.DriverSubscriptionUncheckedCreateNestedManyWithoutPlanInput;
};
export type SubscriptionPlanUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    periodDays?: Prisma.IntFieldUpdateOperationsInput | number;
    percentageCut?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    cost?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    status?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    features?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isFree?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    freeOffer?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    subscriptions?: Prisma.DriverSubscriptionUpdateManyWithoutPlanNestedInput;
};
export type SubscriptionPlanUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    periodDays?: Prisma.IntFieldUpdateOperationsInput | number;
    percentageCut?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    cost?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    status?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    features?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isFree?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    freeOffer?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    subscriptions?: Prisma.DriverSubscriptionUncheckedUpdateManyWithoutPlanNestedInput;
};
export type SubscriptionPlanCreateManyInput = {
    id?: string;
    name: string;
    periodDays: number;
    percentageCut?: runtime.Decimal | runtime.DecimalJsLike | number | string;
    cost?: runtime.Decimal | runtime.DecimalJsLike | number | string;
    status?: string | null;
    features?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isFree?: boolean;
    freeOffer?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type SubscriptionPlanUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    periodDays?: Prisma.IntFieldUpdateOperationsInput | number;
    percentageCut?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    cost?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    status?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    features?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isFree?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    freeOffer?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SubscriptionPlanUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    periodDays?: Prisma.IntFieldUpdateOperationsInput | number;
    percentageCut?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    cost?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    status?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    features?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isFree?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    freeOffer?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SubscriptionPlanCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    periodDays?: Prisma.SortOrder;
    percentageCut?: Prisma.SortOrder;
    cost?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    features?: Prisma.SortOrder;
    isFree?: Prisma.SortOrder;
    freeOffer?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type SubscriptionPlanAvgOrderByAggregateInput = {
    periodDays?: Prisma.SortOrder;
    percentageCut?: Prisma.SortOrder;
    cost?: Prisma.SortOrder;
};
export type SubscriptionPlanMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    periodDays?: Prisma.SortOrder;
    percentageCut?: Prisma.SortOrder;
    cost?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    isFree?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type SubscriptionPlanMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    periodDays?: Prisma.SortOrder;
    percentageCut?: Prisma.SortOrder;
    cost?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    isFree?: Prisma.SortOrder;
    isActive?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type SubscriptionPlanSumOrderByAggregateInput = {
    periodDays?: Prisma.SortOrder;
    percentageCut?: Prisma.SortOrder;
    cost?: Prisma.SortOrder;
};
export type SubscriptionPlanScalarRelationFilter = {
    is?: Prisma.SubscriptionPlanWhereInput;
    isNot?: Prisma.SubscriptionPlanWhereInput;
};
export type SubscriptionPlanCreateNestedOneWithoutSubscriptionsInput = {
    create?: Prisma.XOR<Prisma.SubscriptionPlanCreateWithoutSubscriptionsInput, Prisma.SubscriptionPlanUncheckedCreateWithoutSubscriptionsInput>;
    connectOrCreate?: Prisma.SubscriptionPlanCreateOrConnectWithoutSubscriptionsInput;
    connect?: Prisma.SubscriptionPlanWhereUniqueInput;
};
export type SubscriptionPlanUpdateOneRequiredWithoutSubscriptionsNestedInput = {
    create?: Prisma.XOR<Prisma.SubscriptionPlanCreateWithoutSubscriptionsInput, Prisma.SubscriptionPlanUncheckedCreateWithoutSubscriptionsInput>;
    connectOrCreate?: Prisma.SubscriptionPlanCreateOrConnectWithoutSubscriptionsInput;
    upsert?: Prisma.SubscriptionPlanUpsertWithoutSubscriptionsInput;
    connect?: Prisma.SubscriptionPlanWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.SubscriptionPlanUpdateToOneWithWhereWithoutSubscriptionsInput, Prisma.SubscriptionPlanUpdateWithoutSubscriptionsInput>, Prisma.SubscriptionPlanUncheckedUpdateWithoutSubscriptionsInput>;
};
export type SubscriptionPlanCreateWithoutSubscriptionsInput = {
    id?: string;
    name: string;
    periodDays: number;
    percentageCut?: runtime.Decimal | runtime.DecimalJsLike | number | string;
    cost?: runtime.Decimal | runtime.DecimalJsLike | number | string;
    status?: string | null;
    features?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isFree?: boolean;
    freeOffer?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type SubscriptionPlanUncheckedCreateWithoutSubscriptionsInput = {
    id?: string;
    name: string;
    periodDays: number;
    percentageCut?: runtime.Decimal | runtime.DecimalJsLike | number | string;
    cost?: runtime.Decimal | runtime.DecimalJsLike | number | string;
    status?: string | null;
    features?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isFree?: boolean;
    freeOffer?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    isActive?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type SubscriptionPlanCreateOrConnectWithoutSubscriptionsInput = {
    where: Prisma.SubscriptionPlanWhereUniqueInput;
    create: Prisma.XOR<Prisma.SubscriptionPlanCreateWithoutSubscriptionsInput, Prisma.SubscriptionPlanUncheckedCreateWithoutSubscriptionsInput>;
};
export type SubscriptionPlanUpsertWithoutSubscriptionsInput = {
    update: Prisma.XOR<Prisma.SubscriptionPlanUpdateWithoutSubscriptionsInput, Prisma.SubscriptionPlanUncheckedUpdateWithoutSubscriptionsInput>;
    create: Prisma.XOR<Prisma.SubscriptionPlanCreateWithoutSubscriptionsInput, Prisma.SubscriptionPlanUncheckedCreateWithoutSubscriptionsInput>;
    where?: Prisma.SubscriptionPlanWhereInput;
};
export type SubscriptionPlanUpdateToOneWithWhereWithoutSubscriptionsInput = {
    where?: Prisma.SubscriptionPlanWhereInput;
    data: Prisma.XOR<Prisma.SubscriptionPlanUpdateWithoutSubscriptionsInput, Prisma.SubscriptionPlanUncheckedUpdateWithoutSubscriptionsInput>;
};
export type SubscriptionPlanUpdateWithoutSubscriptionsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    periodDays?: Prisma.IntFieldUpdateOperationsInput | number;
    percentageCut?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    cost?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    status?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    features?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isFree?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    freeOffer?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SubscriptionPlanUncheckedUpdateWithoutSubscriptionsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    periodDays?: Prisma.IntFieldUpdateOperationsInput | number;
    percentageCut?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    cost?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    status?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    features?: Prisma.JsonNullValueInput | runtime.InputJsonValue;
    isFree?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    freeOffer?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    isActive?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SubscriptionPlanCountOutputType = {
    subscriptions: number;
};
export type SubscriptionPlanCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    subscriptions?: boolean | SubscriptionPlanCountOutputTypeCountSubscriptionsArgs;
};
export type SubscriptionPlanCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SubscriptionPlanCountOutputTypeSelect<ExtArgs> | null;
};
export type SubscriptionPlanCountOutputTypeCountSubscriptionsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DriverSubscriptionWhereInput;
};
export type SubscriptionPlanSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    periodDays?: boolean;
    percentageCut?: boolean;
    cost?: boolean;
    status?: boolean;
    features?: boolean;
    isFree?: boolean;
    freeOffer?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    subscriptions?: boolean | Prisma.SubscriptionPlan$subscriptionsArgs<ExtArgs>;
    _count?: boolean | Prisma.SubscriptionPlanCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["subscriptionPlan"]>;
export type SubscriptionPlanSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    periodDays?: boolean;
    percentageCut?: boolean;
    cost?: boolean;
    status?: boolean;
    features?: boolean;
    isFree?: boolean;
    freeOffer?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["subscriptionPlan"]>;
export type SubscriptionPlanSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    periodDays?: boolean;
    percentageCut?: boolean;
    cost?: boolean;
    status?: boolean;
    features?: boolean;
    isFree?: boolean;
    freeOffer?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["subscriptionPlan"]>;
export type SubscriptionPlanSelectScalar = {
    id?: boolean;
    name?: boolean;
    periodDays?: boolean;
    percentageCut?: boolean;
    cost?: boolean;
    status?: boolean;
    features?: boolean;
    isFree?: boolean;
    freeOffer?: boolean;
    isActive?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type SubscriptionPlanOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "name" | "periodDays" | "percentageCut" | "cost" | "status" | "features" | "isFree" | "freeOffer" | "isActive" | "createdAt" | "updatedAt", ExtArgs["result"]["subscriptionPlan"]>;
export type SubscriptionPlanInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    subscriptions?: boolean | Prisma.SubscriptionPlan$subscriptionsArgs<ExtArgs>;
    _count?: boolean | Prisma.SubscriptionPlanCountOutputTypeDefaultArgs<ExtArgs>;
};
export type SubscriptionPlanIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type SubscriptionPlanIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $SubscriptionPlanPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "SubscriptionPlan";
    objects: {
        subscriptions: Prisma.$DriverSubscriptionPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        name: string;
        periodDays: number;
        percentageCut: runtime.Decimal;
        cost: runtime.Decimal;
        status: string | null;
        features: runtime.JsonValue;
        isFree: boolean;
        freeOffer: runtime.JsonValue | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["subscriptionPlan"]>;
    composites: {};
};
export type SubscriptionPlanGetPayload<S extends boolean | null | undefined | SubscriptionPlanDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$SubscriptionPlanPayload, S>;
export type SubscriptionPlanCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<SubscriptionPlanFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: SubscriptionPlanCountAggregateInputType | true;
};
export interface SubscriptionPlanDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['SubscriptionPlan'];
        meta: {
            name: 'SubscriptionPlan';
        };
    };
    findUnique<T extends SubscriptionPlanFindUniqueArgs>(args: Prisma.SelectSubset<T, SubscriptionPlanFindUniqueArgs<ExtArgs>>): Prisma.Prisma__SubscriptionPlanClient<runtime.Types.Result.GetResult<Prisma.$SubscriptionPlanPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends SubscriptionPlanFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, SubscriptionPlanFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__SubscriptionPlanClient<runtime.Types.Result.GetResult<Prisma.$SubscriptionPlanPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends SubscriptionPlanFindFirstArgs>(args?: Prisma.SelectSubset<T, SubscriptionPlanFindFirstArgs<ExtArgs>>): Prisma.Prisma__SubscriptionPlanClient<runtime.Types.Result.GetResult<Prisma.$SubscriptionPlanPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends SubscriptionPlanFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, SubscriptionPlanFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__SubscriptionPlanClient<runtime.Types.Result.GetResult<Prisma.$SubscriptionPlanPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends SubscriptionPlanFindManyArgs>(args?: Prisma.SelectSubset<T, SubscriptionPlanFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SubscriptionPlanPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends SubscriptionPlanCreateArgs>(args: Prisma.SelectSubset<T, SubscriptionPlanCreateArgs<ExtArgs>>): Prisma.Prisma__SubscriptionPlanClient<runtime.Types.Result.GetResult<Prisma.$SubscriptionPlanPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends SubscriptionPlanCreateManyArgs>(args?: Prisma.SelectSubset<T, SubscriptionPlanCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends SubscriptionPlanCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, SubscriptionPlanCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SubscriptionPlanPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends SubscriptionPlanDeleteArgs>(args: Prisma.SelectSubset<T, SubscriptionPlanDeleteArgs<ExtArgs>>): Prisma.Prisma__SubscriptionPlanClient<runtime.Types.Result.GetResult<Prisma.$SubscriptionPlanPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends SubscriptionPlanUpdateArgs>(args: Prisma.SelectSubset<T, SubscriptionPlanUpdateArgs<ExtArgs>>): Prisma.Prisma__SubscriptionPlanClient<runtime.Types.Result.GetResult<Prisma.$SubscriptionPlanPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends SubscriptionPlanDeleteManyArgs>(args?: Prisma.SelectSubset<T, SubscriptionPlanDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends SubscriptionPlanUpdateManyArgs>(args: Prisma.SelectSubset<T, SubscriptionPlanUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends SubscriptionPlanUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, SubscriptionPlanUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SubscriptionPlanPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends SubscriptionPlanUpsertArgs>(args: Prisma.SelectSubset<T, SubscriptionPlanUpsertArgs<ExtArgs>>): Prisma.Prisma__SubscriptionPlanClient<runtime.Types.Result.GetResult<Prisma.$SubscriptionPlanPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends SubscriptionPlanCountArgs>(args?: Prisma.Subset<T, SubscriptionPlanCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], SubscriptionPlanCountAggregateOutputType> : number>;
    aggregate<T extends SubscriptionPlanAggregateArgs>(args: Prisma.Subset<T, SubscriptionPlanAggregateArgs>): Prisma.PrismaPromise<GetSubscriptionPlanAggregateType<T>>;
    groupBy<T extends SubscriptionPlanGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: SubscriptionPlanGroupByArgs['orderBy'];
    } : {
        orderBy?: SubscriptionPlanGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, SubscriptionPlanGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSubscriptionPlanGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: SubscriptionPlanFieldRefs;
}
export interface Prisma__SubscriptionPlanClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    subscriptions<T extends Prisma.SubscriptionPlan$subscriptionsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.SubscriptionPlan$subscriptionsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DriverSubscriptionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface SubscriptionPlanFieldRefs {
    readonly id: Prisma.FieldRef<"SubscriptionPlan", 'String'>;
    readonly name: Prisma.FieldRef<"SubscriptionPlan", 'String'>;
    readonly periodDays: Prisma.FieldRef<"SubscriptionPlan", 'Int'>;
    readonly percentageCut: Prisma.FieldRef<"SubscriptionPlan", 'Decimal'>;
    readonly cost: Prisma.FieldRef<"SubscriptionPlan", 'Decimal'>;
    readonly status: Prisma.FieldRef<"SubscriptionPlan", 'String'>;
    readonly features: Prisma.FieldRef<"SubscriptionPlan", 'Json'>;
    readonly isFree: Prisma.FieldRef<"SubscriptionPlan", 'Boolean'>;
    readonly freeOffer: Prisma.FieldRef<"SubscriptionPlan", 'Json'>;
    readonly isActive: Prisma.FieldRef<"SubscriptionPlan", 'Boolean'>;
    readonly createdAt: Prisma.FieldRef<"SubscriptionPlan", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"SubscriptionPlan", 'DateTime'>;
}
export type SubscriptionPlanFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SubscriptionPlanSelect<ExtArgs> | null;
    omit?: Prisma.SubscriptionPlanOmit<ExtArgs> | null;
    include?: Prisma.SubscriptionPlanInclude<ExtArgs> | null;
    where: Prisma.SubscriptionPlanWhereUniqueInput;
};
export type SubscriptionPlanFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SubscriptionPlanSelect<ExtArgs> | null;
    omit?: Prisma.SubscriptionPlanOmit<ExtArgs> | null;
    include?: Prisma.SubscriptionPlanInclude<ExtArgs> | null;
    where: Prisma.SubscriptionPlanWhereUniqueInput;
};
export type SubscriptionPlanFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SubscriptionPlanSelect<ExtArgs> | null;
    omit?: Prisma.SubscriptionPlanOmit<ExtArgs> | null;
    include?: Prisma.SubscriptionPlanInclude<ExtArgs> | null;
    where?: Prisma.SubscriptionPlanWhereInput;
    orderBy?: Prisma.SubscriptionPlanOrderByWithRelationInput | Prisma.SubscriptionPlanOrderByWithRelationInput[];
    cursor?: Prisma.SubscriptionPlanWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SubscriptionPlanScalarFieldEnum | Prisma.SubscriptionPlanScalarFieldEnum[];
};
export type SubscriptionPlanFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SubscriptionPlanSelect<ExtArgs> | null;
    omit?: Prisma.SubscriptionPlanOmit<ExtArgs> | null;
    include?: Prisma.SubscriptionPlanInclude<ExtArgs> | null;
    where?: Prisma.SubscriptionPlanWhereInput;
    orderBy?: Prisma.SubscriptionPlanOrderByWithRelationInput | Prisma.SubscriptionPlanOrderByWithRelationInput[];
    cursor?: Prisma.SubscriptionPlanWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SubscriptionPlanScalarFieldEnum | Prisma.SubscriptionPlanScalarFieldEnum[];
};
export type SubscriptionPlanFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SubscriptionPlanSelect<ExtArgs> | null;
    omit?: Prisma.SubscriptionPlanOmit<ExtArgs> | null;
    include?: Prisma.SubscriptionPlanInclude<ExtArgs> | null;
    where?: Prisma.SubscriptionPlanWhereInput;
    orderBy?: Prisma.SubscriptionPlanOrderByWithRelationInput | Prisma.SubscriptionPlanOrderByWithRelationInput[];
    cursor?: Prisma.SubscriptionPlanWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SubscriptionPlanScalarFieldEnum | Prisma.SubscriptionPlanScalarFieldEnum[];
};
export type SubscriptionPlanCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SubscriptionPlanSelect<ExtArgs> | null;
    omit?: Prisma.SubscriptionPlanOmit<ExtArgs> | null;
    include?: Prisma.SubscriptionPlanInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SubscriptionPlanCreateInput, Prisma.SubscriptionPlanUncheckedCreateInput>;
};
export type SubscriptionPlanCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.SubscriptionPlanCreateManyInput | Prisma.SubscriptionPlanCreateManyInput[];
    skipDuplicates?: boolean;
};
export type SubscriptionPlanCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SubscriptionPlanSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.SubscriptionPlanOmit<ExtArgs> | null;
    data: Prisma.SubscriptionPlanCreateManyInput | Prisma.SubscriptionPlanCreateManyInput[];
    skipDuplicates?: boolean;
};
export type SubscriptionPlanUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SubscriptionPlanSelect<ExtArgs> | null;
    omit?: Prisma.SubscriptionPlanOmit<ExtArgs> | null;
    include?: Prisma.SubscriptionPlanInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SubscriptionPlanUpdateInput, Prisma.SubscriptionPlanUncheckedUpdateInput>;
    where: Prisma.SubscriptionPlanWhereUniqueInput;
};
export type SubscriptionPlanUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.SubscriptionPlanUpdateManyMutationInput, Prisma.SubscriptionPlanUncheckedUpdateManyInput>;
    where?: Prisma.SubscriptionPlanWhereInput;
    limit?: number;
};
export type SubscriptionPlanUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SubscriptionPlanSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.SubscriptionPlanOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SubscriptionPlanUpdateManyMutationInput, Prisma.SubscriptionPlanUncheckedUpdateManyInput>;
    where?: Prisma.SubscriptionPlanWhereInput;
    limit?: number;
};
export type SubscriptionPlanUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SubscriptionPlanSelect<ExtArgs> | null;
    omit?: Prisma.SubscriptionPlanOmit<ExtArgs> | null;
    include?: Prisma.SubscriptionPlanInclude<ExtArgs> | null;
    where: Prisma.SubscriptionPlanWhereUniqueInput;
    create: Prisma.XOR<Prisma.SubscriptionPlanCreateInput, Prisma.SubscriptionPlanUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.SubscriptionPlanUpdateInput, Prisma.SubscriptionPlanUncheckedUpdateInput>;
};
export type SubscriptionPlanDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SubscriptionPlanSelect<ExtArgs> | null;
    omit?: Prisma.SubscriptionPlanOmit<ExtArgs> | null;
    include?: Prisma.SubscriptionPlanInclude<ExtArgs> | null;
    where: Prisma.SubscriptionPlanWhereUniqueInput;
};
export type SubscriptionPlanDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SubscriptionPlanWhereInput;
    limit?: number;
};
export type SubscriptionPlan$subscriptionsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DriverSubscriptionSelect<ExtArgs> | null;
    omit?: Prisma.DriverSubscriptionOmit<ExtArgs> | null;
    include?: Prisma.DriverSubscriptionInclude<ExtArgs> | null;
    where?: Prisma.DriverSubscriptionWhereInput;
    orderBy?: Prisma.DriverSubscriptionOrderByWithRelationInput | Prisma.DriverSubscriptionOrderByWithRelationInput[];
    cursor?: Prisma.DriverSubscriptionWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DriverSubscriptionScalarFieldEnum | Prisma.DriverSubscriptionScalarFieldEnum[];
};
export type SubscriptionPlanDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SubscriptionPlanSelect<ExtArgs> | null;
    omit?: Prisma.SubscriptionPlanOmit<ExtArgs> | null;
    include?: Prisma.SubscriptionPlanInclude<ExtArgs> | null;
};
