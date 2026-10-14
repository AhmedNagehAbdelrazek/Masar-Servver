import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type RequestOfferModel = runtime.Types.Result.DefaultSelection<Prisma.$RequestOfferPayload>;
export type AggregateRequestOffer = {
    _count: RequestOfferCountAggregateOutputType | null;
    _avg: RequestOfferAvgAggregateOutputType | null;
    _sum: RequestOfferSumAggregateOutputType | null;
    _min: RequestOfferMinAggregateOutputType | null;
    _max: RequestOfferMaxAggregateOutputType | null;
};
export type RequestOfferAvgAggregateOutputType = {
    offeredFare: runtime.Decimal | null;
    agreedFare: runtime.Decimal | null;
};
export type RequestOfferSumAggregateOutputType = {
    offeredFare: runtime.Decimal | null;
    agreedFare: runtime.Decimal | null;
};
export type RequestOfferMinAggregateOutputType = {
    id: string | null;
    requestId: string | null;
    driverId: string | null;
    tripId: string | null;
    offeredFare: runtime.Decimal | null;
    message: string | null;
    status: string | null;
    agreedFare: runtime.Decimal | null;
    bookingId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type RequestOfferMaxAggregateOutputType = {
    id: string | null;
    requestId: string | null;
    driverId: string | null;
    tripId: string | null;
    offeredFare: runtime.Decimal | null;
    message: string | null;
    status: string | null;
    agreedFare: runtime.Decimal | null;
    bookingId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type RequestOfferCountAggregateOutputType = {
    id: number;
    requestId: number;
    driverId: number;
    tripId: number;
    offeredFare: number;
    message: number;
    status: number;
    agreedFare: number;
    bookingId: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type RequestOfferAvgAggregateInputType = {
    offeredFare?: true;
    agreedFare?: true;
};
export type RequestOfferSumAggregateInputType = {
    offeredFare?: true;
    agreedFare?: true;
};
export type RequestOfferMinAggregateInputType = {
    id?: true;
    requestId?: true;
    driverId?: true;
    tripId?: true;
    offeredFare?: true;
    message?: true;
    status?: true;
    agreedFare?: true;
    bookingId?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type RequestOfferMaxAggregateInputType = {
    id?: true;
    requestId?: true;
    driverId?: true;
    tripId?: true;
    offeredFare?: true;
    message?: true;
    status?: true;
    agreedFare?: true;
    bookingId?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type RequestOfferCountAggregateInputType = {
    id?: true;
    requestId?: true;
    driverId?: true;
    tripId?: true;
    offeredFare?: true;
    message?: true;
    status?: true;
    agreedFare?: true;
    bookingId?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type RequestOfferAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RequestOfferWhereInput;
    orderBy?: Prisma.RequestOfferOrderByWithRelationInput | Prisma.RequestOfferOrderByWithRelationInput[];
    cursor?: Prisma.RequestOfferWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | RequestOfferCountAggregateInputType;
    _avg?: RequestOfferAvgAggregateInputType;
    _sum?: RequestOfferSumAggregateInputType;
    _min?: RequestOfferMinAggregateInputType;
    _max?: RequestOfferMaxAggregateInputType;
};
export type GetRequestOfferAggregateType<T extends RequestOfferAggregateArgs> = {
    [P in keyof T & keyof AggregateRequestOffer]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateRequestOffer[P]> : Prisma.GetScalarType<T[P], AggregateRequestOffer[P]>;
};
export type RequestOfferGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RequestOfferWhereInput;
    orderBy?: Prisma.RequestOfferOrderByWithAggregationInput | Prisma.RequestOfferOrderByWithAggregationInput[];
    by: Prisma.RequestOfferScalarFieldEnum[] | Prisma.RequestOfferScalarFieldEnum;
    having?: Prisma.RequestOfferScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: RequestOfferCountAggregateInputType | true;
    _avg?: RequestOfferAvgAggregateInputType;
    _sum?: RequestOfferSumAggregateInputType;
    _min?: RequestOfferMinAggregateInputType;
    _max?: RequestOfferMaxAggregateInputType;
};
export type RequestOfferGroupByOutputType = {
    id: string;
    requestId: string;
    driverId: string;
    tripId: string | null;
    offeredFare: runtime.Decimal | null;
    message: string | null;
    status: string;
    agreedFare: runtime.Decimal | null;
    bookingId: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count: RequestOfferCountAggregateOutputType | null;
    _avg: RequestOfferAvgAggregateOutputType | null;
    _sum: RequestOfferSumAggregateOutputType | null;
    _min: RequestOfferMinAggregateOutputType | null;
    _max: RequestOfferMaxAggregateOutputType | null;
};
export type GetRequestOfferGroupByPayload<T extends RequestOfferGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<RequestOfferGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof RequestOfferGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], RequestOfferGroupByOutputType[P]> : Prisma.GetScalarType<T[P], RequestOfferGroupByOutputType[P]>;
}>>;
export type RequestOfferWhereInput = {
    AND?: Prisma.RequestOfferWhereInput | Prisma.RequestOfferWhereInput[];
    OR?: Prisma.RequestOfferWhereInput[];
    NOT?: Prisma.RequestOfferWhereInput | Prisma.RequestOfferWhereInput[];
    id?: Prisma.UuidFilter<"RequestOffer"> | string;
    requestId?: Prisma.UuidFilter<"RequestOffer"> | string;
    driverId?: Prisma.UuidFilter<"RequestOffer"> | string;
    tripId?: Prisma.UuidNullableFilter<"RequestOffer"> | string | null;
    offeredFare?: Prisma.DecimalNullableFilter<"RequestOffer"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: Prisma.StringNullableFilter<"RequestOffer"> | string | null;
    status?: Prisma.StringFilter<"RequestOffer"> | string;
    agreedFare?: Prisma.DecimalNullableFilter<"RequestOffer"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: Prisma.UuidNullableFilter<"RequestOffer"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"RequestOffer"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"RequestOffer"> | Date | string;
    request?: Prisma.XOR<Prisma.RideRequestScalarRelationFilter, Prisma.RideRequestWhereInput>;
    driver?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    trip?: Prisma.XOR<Prisma.TripNullableScalarRelationFilter, Prisma.TripWhereInput> | null;
};
export type RequestOfferOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    requestId?: Prisma.SortOrder;
    driverId?: Prisma.SortOrder;
    tripId?: Prisma.SortOrderInput | Prisma.SortOrder;
    offeredFare?: Prisma.SortOrderInput | Prisma.SortOrder;
    message?: Prisma.SortOrderInput | Prisma.SortOrder;
    status?: Prisma.SortOrder;
    agreedFare?: Prisma.SortOrderInput | Prisma.SortOrder;
    bookingId?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    request?: Prisma.RideRequestOrderByWithRelationInput;
    driver?: Prisma.UserOrderByWithRelationInput;
    trip?: Prisma.TripOrderByWithRelationInput;
};
export type RequestOfferWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.RequestOfferWhereInput | Prisma.RequestOfferWhereInput[];
    OR?: Prisma.RequestOfferWhereInput[];
    NOT?: Prisma.RequestOfferWhereInput | Prisma.RequestOfferWhereInput[];
    requestId?: Prisma.UuidFilter<"RequestOffer"> | string;
    driverId?: Prisma.UuidFilter<"RequestOffer"> | string;
    tripId?: Prisma.UuidNullableFilter<"RequestOffer"> | string | null;
    offeredFare?: Prisma.DecimalNullableFilter<"RequestOffer"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: Prisma.StringNullableFilter<"RequestOffer"> | string | null;
    status?: Prisma.StringFilter<"RequestOffer"> | string;
    agreedFare?: Prisma.DecimalNullableFilter<"RequestOffer"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: Prisma.UuidNullableFilter<"RequestOffer"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"RequestOffer"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"RequestOffer"> | Date | string;
    request?: Prisma.XOR<Prisma.RideRequestScalarRelationFilter, Prisma.RideRequestWhereInput>;
    driver?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    trip?: Prisma.XOR<Prisma.TripNullableScalarRelationFilter, Prisma.TripWhereInput> | null;
}, "id">;
export type RequestOfferOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    requestId?: Prisma.SortOrder;
    driverId?: Prisma.SortOrder;
    tripId?: Prisma.SortOrderInput | Prisma.SortOrder;
    offeredFare?: Prisma.SortOrderInput | Prisma.SortOrder;
    message?: Prisma.SortOrderInput | Prisma.SortOrder;
    status?: Prisma.SortOrder;
    agreedFare?: Prisma.SortOrderInput | Prisma.SortOrder;
    bookingId?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.RequestOfferCountOrderByAggregateInput;
    _avg?: Prisma.RequestOfferAvgOrderByAggregateInput;
    _max?: Prisma.RequestOfferMaxOrderByAggregateInput;
    _min?: Prisma.RequestOfferMinOrderByAggregateInput;
    _sum?: Prisma.RequestOfferSumOrderByAggregateInput;
};
export type RequestOfferScalarWhereWithAggregatesInput = {
    AND?: Prisma.RequestOfferScalarWhereWithAggregatesInput | Prisma.RequestOfferScalarWhereWithAggregatesInput[];
    OR?: Prisma.RequestOfferScalarWhereWithAggregatesInput[];
    NOT?: Prisma.RequestOfferScalarWhereWithAggregatesInput | Prisma.RequestOfferScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"RequestOffer"> | string;
    requestId?: Prisma.UuidWithAggregatesFilter<"RequestOffer"> | string;
    driverId?: Prisma.UuidWithAggregatesFilter<"RequestOffer"> | string;
    tripId?: Prisma.UuidNullableWithAggregatesFilter<"RequestOffer"> | string | null;
    offeredFare?: Prisma.DecimalNullableWithAggregatesFilter<"RequestOffer"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: Prisma.StringNullableWithAggregatesFilter<"RequestOffer"> | string | null;
    status?: Prisma.StringWithAggregatesFilter<"RequestOffer"> | string;
    agreedFare?: Prisma.DecimalNullableWithAggregatesFilter<"RequestOffer"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: Prisma.UuidNullableWithAggregatesFilter<"RequestOffer"> | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"RequestOffer"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"RequestOffer"> | Date | string;
};
export type RequestOfferCreateInput = {
    id?: string;
    offeredFare?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: string | null;
    status?: string;
    agreedFare?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    request: Prisma.RideRequestCreateNestedOneWithoutOffersInput;
    driver: Prisma.UserCreateNestedOneWithoutRequestOffersInput;
    trip?: Prisma.TripCreateNestedOneWithoutOffersInput;
};
export type RequestOfferUncheckedCreateInput = {
    id?: string;
    requestId: string;
    driverId: string;
    tripId?: string | null;
    offeredFare?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: string | null;
    status?: string;
    agreedFare?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type RequestOfferUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    offeredFare?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    agreedFare?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    request?: Prisma.RideRequestUpdateOneRequiredWithoutOffersNestedInput;
    driver?: Prisma.UserUpdateOneRequiredWithoutRequestOffersNestedInput;
    trip?: Prisma.TripUpdateOneWithoutOffersNestedInput;
};
export type RequestOfferUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    requestId?: Prisma.StringFieldUpdateOperationsInput | string;
    driverId?: Prisma.StringFieldUpdateOperationsInput | string;
    tripId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    offeredFare?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    agreedFare?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RequestOfferCreateManyInput = {
    id?: string;
    requestId: string;
    driverId: string;
    tripId?: string | null;
    offeredFare?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: string | null;
    status?: string;
    agreedFare?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type RequestOfferUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    offeredFare?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    agreedFare?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RequestOfferUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    requestId?: Prisma.StringFieldUpdateOperationsInput | string;
    driverId?: Prisma.StringFieldUpdateOperationsInput | string;
    tripId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    offeredFare?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    agreedFare?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RequestOfferListRelationFilter = {
    every?: Prisma.RequestOfferWhereInput;
    some?: Prisma.RequestOfferWhereInput;
    none?: Prisma.RequestOfferWhereInput;
};
export type RequestOfferOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type RequestOfferCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    requestId?: Prisma.SortOrder;
    driverId?: Prisma.SortOrder;
    tripId?: Prisma.SortOrder;
    offeredFare?: Prisma.SortOrder;
    message?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    agreedFare?: Prisma.SortOrder;
    bookingId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type RequestOfferAvgOrderByAggregateInput = {
    offeredFare?: Prisma.SortOrder;
    agreedFare?: Prisma.SortOrder;
};
export type RequestOfferMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    requestId?: Prisma.SortOrder;
    driverId?: Prisma.SortOrder;
    tripId?: Prisma.SortOrder;
    offeredFare?: Prisma.SortOrder;
    message?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    agreedFare?: Prisma.SortOrder;
    bookingId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type RequestOfferMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    requestId?: Prisma.SortOrder;
    driverId?: Prisma.SortOrder;
    tripId?: Prisma.SortOrder;
    offeredFare?: Prisma.SortOrder;
    message?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    agreedFare?: Prisma.SortOrder;
    bookingId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type RequestOfferSumOrderByAggregateInput = {
    offeredFare?: Prisma.SortOrder;
    agreedFare?: Prisma.SortOrder;
};
export type RequestOfferCreateNestedManyWithoutDriverInput = {
    create?: Prisma.XOR<Prisma.RequestOfferCreateWithoutDriverInput, Prisma.RequestOfferUncheckedCreateWithoutDriverInput> | Prisma.RequestOfferCreateWithoutDriverInput[] | Prisma.RequestOfferUncheckedCreateWithoutDriverInput[];
    connectOrCreate?: Prisma.RequestOfferCreateOrConnectWithoutDriverInput | Prisma.RequestOfferCreateOrConnectWithoutDriverInput[];
    createMany?: Prisma.RequestOfferCreateManyDriverInputEnvelope;
    connect?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
};
export type RequestOfferUncheckedCreateNestedManyWithoutDriverInput = {
    create?: Prisma.XOR<Prisma.RequestOfferCreateWithoutDriverInput, Prisma.RequestOfferUncheckedCreateWithoutDriverInput> | Prisma.RequestOfferCreateWithoutDriverInput[] | Prisma.RequestOfferUncheckedCreateWithoutDriverInput[];
    connectOrCreate?: Prisma.RequestOfferCreateOrConnectWithoutDriverInput | Prisma.RequestOfferCreateOrConnectWithoutDriverInput[];
    createMany?: Prisma.RequestOfferCreateManyDriverInputEnvelope;
    connect?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
};
export type RequestOfferUpdateManyWithoutDriverNestedInput = {
    create?: Prisma.XOR<Prisma.RequestOfferCreateWithoutDriverInput, Prisma.RequestOfferUncheckedCreateWithoutDriverInput> | Prisma.RequestOfferCreateWithoutDriverInput[] | Prisma.RequestOfferUncheckedCreateWithoutDriverInput[];
    connectOrCreate?: Prisma.RequestOfferCreateOrConnectWithoutDriverInput | Prisma.RequestOfferCreateOrConnectWithoutDriverInput[];
    upsert?: Prisma.RequestOfferUpsertWithWhereUniqueWithoutDriverInput | Prisma.RequestOfferUpsertWithWhereUniqueWithoutDriverInput[];
    createMany?: Prisma.RequestOfferCreateManyDriverInputEnvelope;
    set?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
    disconnect?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
    delete?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
    connect?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
    update?: Prisma.RequestOfferUpdateWithWhereUniqueWithoutDriverInput | Prisma.RequestOfferUpdateWithWhereUniqueWithoutDriverInput[];
    updateMany?: Prisma.RequestOfferUpdateManyWithWhereWithoutDriverInput | Prisma.RequestOfferUpdateManyWithWhereWithoutDriverInput[];
    deleteMany?: Prisma.RequestOfferScalarWhereInput | Prisma.RequestOfferScalarWhereInput[];
};
export type RequestOfferUncheckedUpdateManyWithoutDriverNestedInput = {
    create?: Prisma.XOR<Prisma.RequestOfferCreateWithoutDriverInput, Prisma.RequestOfferUncheckedCreateWithoutDriverInput> | Prisma.RequestOfferCreateWithoutDriverInput[] | Prisma.RequestOfferUncheckedCreateWithoutDriverInput[];
    connectOrCreate?: Prisma.RequestOfferCreateOrConnectWithoutDriverInput | Prisma.RequestOfferCreateOrConnectWithoutDriverInput[];
    upsert?: Prisma.RequestOfferUpsertWithWhereUniqueWithoutDriverInput | Prisma.RequestOfferUpsertWithWhereUniqueWithoutDriverInput[];
    createMany?: Prisma.RequestOfferCreateManyDriverInputEnvelope;
    set?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
    disconnect?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
    delete?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
    connect?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
    update?: Prisma.RequestOfferUpdateWithWhereUniqueWithoutDriverInput | Prisma.RequestOfferUpdateWithWhereUniqueWithoutDriverInput[];
    updateMany?: Prisma.RequestOfferUpdateManyWithWhereWithoutDriverInput | Prisma.RequestOfferUpdateManyWithWhereWithoutDriverInput[];
    deleteMany?: Prisma.RequestOfferScalarWhereInput | Prisma.RequestOfferScalarWhereInput[];
};
export type RequestOfferCreateNestedManyWithoutTripInput = {
    create?: Prisma.XOR<Prisma.RequestOfferCreateWithoutTripInput, Prisma.RequestOfferUncheckedCreateWithoutTripInput> | Prisma.RequestOfferCreateWithoutTripInput[] | Prisma.RequestOfferUncheckedCreateWithoutTripInput[];
    connectOrCreate?: Prisma.RequestOfferCreateOrConnectWithoutTripInput | Prisma.RequestOfferCreateOrConnectWithoutTripInput[];
    createMany?: Prisma.RequestOfferCreateManyTripInputEnvelope;
    connect?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
};
export type RequestOfferUncheckedCreateNestedManyWithoutTripInput = {
    create?: Prisma.XOR<Prisma.RequestOfferCreateWithoutTripInput, Prisma.RequestOfferUncheckedCreateWithoutTripInput> | Prisma.RequestOfferCreateWithoutTripInput[] | Prisma.RequestOfferUncheckedCreateWithoutTripInput[];
    connectOrCreate?: Prisma.RequestOfferCreateOrConnectWithoutTripInput | Prisma.RequestOfferCreateOrConnectWithoutTripInput[];
    createMany?: Prisma.RequestOfferCreateManyTripInputEnvelope;
    connect?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
};
export type RequestOfferUpdateManyWithoutTripNestedInput = {
    create?: Prisma.XOR<Prisma.RequestOfferCreateWithoutTripInput, Prisma.RequestOfferUncheckedCreateWithoutTripInput> | Prisma.RequestOfferCreateWithoutTripInput[] | Prisma.RequestOfferUncheckedCreateWithoutTripInput[];
    connectOrCreate?: Prisma.RequestOfferCreateOrConnectWithoutTripInput | Prisma.RequestOfferCreateOrConnectWithoutTripInput[];
    upsert?: Prisma.RequestOfferUpsertWithWhereUniqueWithoutTripInput | Prisma.RequestOfferUpsertWithWhereUniqueWithoutTripInput[];
    createMany?: Prisma.RequestOfferCreateManyTripInputEnvelope;
    set?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
    disconnect?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
    delete?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
    connect?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
    update?: Prisma.RequestOfferUpdateWithWhereUniqueWithoutTripInput | Prisma.RequestOfferUpdateWithWhereUniqueWithoutTripInput[];
    updateMany?: Prisma.RequestOfferUpdateManyWithWhereWithoutTripInput | Prisma.RequestOfferUpdateManyWithWhereWithoutTripInput[];
    deleteMany?: Prisma.RequestOfferScalarWhereInput | Prisma.RequestOfferScalarWhereInput[];
};
export type RequestOfferUncheckedUpdateManyWithoutTripNestedInput = {
    create?: Prisma.XOR<Prisma.RequestOfferCreateWithoutTripInput, Prisma.RequestOfferUncheckedCreateWithoutTripInput> | Prisma.RequestOfferCreateWithoutTripInput[] | Prisma.RequestOfferUncheckedCreateWithoutTripInput[];
    connectOrCreate?: Prisma.RequestOfferCreateOrConnectWithoutTripInput | Prisma.RequestOfferCreateOrConnectWithoutTripInput[];
    upsert?: Prisma.RequestOfferUpsertWithWhereUniqueWithoutTripInput | Prisma.RequestOfferUpsertWithWhereUniqueWithoutTripInput[];
    createMany?: Prisma.RequestOfferCreateManyTripInputEnvelope;
    set?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
    disconnect?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
    delete?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
    connect?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
    update?: Prisma.RequestOfferUpdateWithWhereUniqueWithoutTripInput | Prisma.RequestOfferUpdateWithWhereUniqueWithoutTripInput[];
    updateMany?: Prisma.RequestOfferUpdateManyWithWhereWithoutTripInput | Prisma.RequestOfferUpdateManyWithWhereWithoutTripInput[];
    deleteMany?: Prisma.RequestOfferScalarWhereInput | Prisma.RequestOfferScalarWhereInput[];
};
export type RequestOfferCreateNestedManyWithoutRequestInput = {
    create?: Prisma.XOR<Prisma.RequestOfferCreateWithoutRequestInput, Prisma.RequestOfferUncheckedCreateWithoutRequestInput> | Prisma.RequestOfferCreateWithoutRequestInput[] | Prisma.RequestOfferUncheckedCreateWithoutRequestInput[];
    connectOrCreate?: Prisma.RequestOfferCreateOrConnectWithoutRequestInput | Prisma.RequestOfferCreateOrConnectWithoutRequestInput[];
    createMany?: Prisma.RequestOfferCreateManyRequestInputEnvelope;
    connect?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
};
export type RequestOfferUncheckedCreateNestedManyWithoutRequestInput = {
    create?: Prisma.XOR<Prisma.RequestOfferCreateWithoutRequestInput, Prisma.RequestOfferUncheckedCreateWithoutRequestInput> | Prisma.RequestOfferCreateWithoutRequestInput[] | Prisma.RequestOfferUncheckedCreateWithoutRequestInput[];
    connectOrCreate?: Prisma.RequestOfferCreateOrConnectWithoutRequestInput | Prisma.RequestOfferCreateOrConnectWithoutRequestInput[];
    createMany?: Prisma.RequestOfferCreateManyRequestInputEnvelope;
    connect?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
};
export type RequestOfferUpdateManyWithoutRequestNestedInput = {
    create?: Prisma.XOR<Prisma.RequestOfferCreateWithoutRequestInput, Prisma.RequestOfferUncheckedCreateWithoutRequestInput> | Prisma.RequestOfferCreateWithoutRequestInput[] | Prisma.RequestOfferUncheckedCreateWithoutRequestInput[];
    connectOrCreate?: Prisma.RequestOfferCreateOrConnectWithoutRequestInput | Prisma.RequestOfferCreateOrConnectWithoutRequestInput[];
    upsert?: Prisma.RequestOfferUpsertWithWhereUniqueWithoutRequestInput | Prisma.RequestOfferUpsertWithWhereUniqueWithoutRequestInput[];
    createMany?: Prisma.RequestOfferCreateManyRequestInputEnvelope;
    set?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
    disconnect?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
    delete?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
    connect?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
    update?: Prisma.RequestOfferUpdateWithWhereUniqueWithoutRequestInput | Prisma.RequestOfferUpdateWithWhereUniqueWithoutRequestInput[];
    updateMany?: Prisma.RequestOfferUpdateManyWithWhereWithoutRequestInput | Prisma.RequestOfferUpdateManyWithWhereWithoutRequestInput[];
    deleteMany?: Prisma.RequestOfferScalarWhereInput | Prisma.RequestOfferScalarWhereInput[];
};
export type RequestOfferUncheckedUpdateManyWithoutRequestNestedInput = {
    create?: Prisma.XOR<Prisma.RequestOfferCreateWithoutRequestInput, Prisma.RequestOfferUncheckedCreateWithoutRequestInput> | Prisma.RequestOfferCreateWithoutRequestInput[] | Prisma.RequestOfferUncheckedCreateWithoutRequestInput[];
    connectOrCreate?: Prisma.RequestOfferCreateOrConnectWithoutRequestInput | Prisma.RequestOfferCreateOrConnectWithoutRequestInput[];
    upsert?: Prisma.RequestOfferUpsertWithWhereUniqueWithoutRequestInput | Prisma.RequestOfferUpsertWithWhereUniqueWithoutRequestInput[];
    createMany?: Prisma.RequestOfferCreateManyRequestInputEnvelope;
    set?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
    disconnect?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
    delete?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
    connect?: Prisma.RequestOfferWhereUniqueInput | Prisma.RequestOfferWhereUniqueInput[];
    update?: Prisma.RequestOfferUpdateWithWhereUniqueWithoutRequestInput | Prisma.RequestOfferUpdateWithWhereUniqueWithoutRequestInput[];
    updateMany?: Prisma.RequestOfferUpdateManyWithWhereWithoutRequestInput | Prisma.RequestOfferUpdateManyWithWhereWithoutRequestInput[];
    deleteMany?: Prisma.RequestOfferScalarWhereInput | Prisma.RequestOfferScalarWhereInput[];
};
export type RequestOfferCreateWithoutDriverInput = {
    id?: string;
    offeredFare?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: string | null;
    status?: string;
    agreedFare?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    request: Prisma.RideRequestCreateNestedOneWithoutOffersInput;
    trip?: Prisma.TripCreateNestedOneWithoutOffersInput;
};
export type RequestOfferUncheckedCreateWithoutDriverInput = {
    id?: string;
    requestId: string;
    tripId?: string | null;
    offeredFare?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: string | null;
    status?: string;
    agreedFare?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type RequestOfferCreateOrConnectWithoutDriverInput = {
    where: Prisma.RequestOfferWhereUniqueInput;
    create: Prisma.XOR<Prisma.RequestOfferCreateWithoutDriverInput, Prisma.RequestOfferUncheckedCreateWithoutDriverInput>;
};
export type RequestOfferCreateManyDriverInputEnvelope = {
    data: Prisma.RequestOfferCreateManyDriverInput | Prisma.RequestOfferCreateManyDriverInput[];
    skipDuplicates?: boolean;
};
export type RequestOfferUpsertWithWhereUniqueWithoutDriverInput = {
    where: Prisma.RequestOfferWhereUniqueInput;
    update: Prisma.XOR<Prisma.RequestOfferUpdateWithoutDriverInput, Prisma.RequestOfferUncheckedUpdateWithoutDriverInput>;
    create: Prisma.XOR<Prisma.RequestOfferCreateWithoutDriverInput, Prisma.RequestOfferUncheckedCreateWithoutDriverInput>;
};
export type RequestOfferUpdateWithWhereUniqueWithoutDriverInput = {
    where: Prisma.RequestOfferWhereUniqueInput;
    data: Prisma.XOR<Prisma.RequestOfferUpdateWithoutDriverInput, Prisma.RequestOfferUncheckedUpdateWithoutDriverInput>;
};
export type RequestOfferUpdateManyWithWhereWithoutDriverInput = {
    where: Prisma.RequestOfferScalarWhereInput;
    data: Prisma.XOR<Prisma.RequestOfferUpdateManyMutationInput, Prisma.RequestOfferUncheckedUpdateManyWithoutDriverInput>;
};
export type RequestOfferScalarWhereInput = {
    AND?: Prisma.RequestOfferScalarWhereInput | Prisma.RequestOfferScalarWhereInput[];
    OR?: Prisma.RequestOfferScalarWhereInput[];
    NOT?: Prisma.RequestOfferScalarWhereInput | Prisma.RequestOfferScalarWhereInput[];
    id?: Prisma.UuidFilter<"RequestOffer"> | string;
    requestId?: Prisma.UuidFilter<"RequestOffer"> | string;
    driverId?: Prisma.UuidFilter<"RequestOffer"> | string;
    tripId?: Prisma.UuidNullableFilter<"RequestOffer"> | string | null;
    offeredFare?: Prisma.DecimalNullableFilter<"RequestOffer"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: Prisma.StringNullableFilter<"RequestOffer"> | string | null;
    status?: Prisma.StringFilter<"RequestOffer"> | string;
    agreedFare?: Prisma.DecimalNullableFilter<"RequestOffer"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: Prisma.UuidNullableFilter<"RequestOffer"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"RequestOffer"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"RequestOffer"> | Date | string;
};
export type RequestOfferCreateWithoutTripInput = {
    id?: string;
    offeredFare?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: string | null;
    status?: string;
    agreedFare?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    request: Prisma.RideRequestCreateNestedOneWithoutOffersInput;
    driver: Prisma.UserCreateNestedOneWithoutRequestOffersInput;
};
export type RequestOfferUncheckedCreateWithoutTripInput = {
    id?: string;
    requestId: string;
    driverId: string;
    offeredFare?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: string | null;
    status?: string;
    agreedFare?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type RequestOfferCreateOrConnectWithoutTripInput = {
    where: Prisma.RequestOfferWhereUniqueInput;
    create: Prisma.XOR<Prisma.RequestOfferCreateWithoutTripInput, Prisma.RequestOfferUncheckedCreateWithoutTripInput>;
};
export type RequestOfferCreateManyTripInputEnvelope = {
    data: Prisma.RequestOfferCreateManyTripInput | Prisma.RequestOfferCreateManyTripInput[];
    skipDuplicates?: boolean;
};
export type RequestOfferUpsertWithWhereUniqueWithoutTripInput = {
    where: Prisma.RequestOfferWhereUniqueInput;
    update: Prisma.XOR<Prisma.RequestOfferUpdateWithoutTripInput, Prisma.RequestOfferUncheckedUpdateWithoutTripInput>;
    create: Prisma.XOR<Prisma.RequestOfferCreateWithoutTripInput, Prisma.RequestOfferUncheckedCreateWithoutTripInput>;
};
export type RequestOfferUpdateWithWhereUniqueWithoutTripInput = {
    where: Prisma.RequestOfferWhereUniqueInput;
    data: Prisma.XOR<Prisma.RequestOfferUpdateWithoutTripInput, Prisma.RequestOfferUncheckedUpdateWithoutTripInput>;
};
export type RequestOfferUpdateManyWithWhereWithoutTripInput = {
    where: Prisma.RequestOfferScalarWhereInput;
    data: Prisma.XOR<Prisma.RequestOfferUpdateManyMutationInput, Prisma.RequestOfferUncheckedUpdateManyWithoutTripInput>;
};
export type RequestOfferCreateWithoutRequestInput = {
    id?: string;
    offeredFare?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: string | null;
    status?: string;
    agreedFare?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    driver: Prisma.UserCreateNestedOneWithoutRequestOffersInput;
    trip?: Prisma.TripCreateNestedOneWithoutOffersInput;
};
export type RequestOfferUncheckedCreateWithoutRequestInput = {
    id?: string;
    driverId: string;
    tripId?: string | null;
    offeredFare?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: string | null;
    status?: string;
    agreedFare?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type RequestOfferCreateOrConnectWithoutRequestInput = {
    where: Prisma.RequestOfferWhereUniqueInput;
    create: Prisma.XOR<Prisma.RequestOfferCreateWithoutRequestInput, Prisma.RequestOfferUncheckedCreateWithoutRequestInput>;
};
export type RequestOfferCreateManyRequestInputEnvelope = {
    data: Prisma.RequestOfferCreateManyRequestInput | Prisma.RequestOfferCreateManyRequestInput[];
    skipDuplicates?: boolean;
};
export type RequestOfferUpsertWithWhereUniqueWithoutRequestInput = {
    where: Prisma.RequestOfferWhereUniqueInput;
    update: Prisma.XOR<Prisma.RequestOfferUpdateWithoutRequestInput, Prisma.RequestOfferUncheckedUpdateWithoutRequestInput>;
    create: Prisma.XOR<Prisma.RequestOfferCreateWithoutRequestInput, Prisma.RequestOfferUncheckedCreateWithoutRequestInput>;
};
export type RequestOfferUpdateWithWhereUniqueWithoutRequestInput = {
    where: Prisma.RequestOfferWhereUniqueInput;
    data: Prisma.XOR<Prisma.RequestOfferUpdateWithoutRequestInput, Prisma.RequestOfferUncheckedUpdateWithoutRequestInput>;
};
export type RequestOfferUpdateManyWithWhereWithoutRequestInput = {
    where: Prisma.RequestOfferScalarWhereInput;
    data: Prisma.XOR<Prisma.RequestOfferUpdateManyMutationInput, Prisma.RequestOfferUncheckedUpdateManyWithoutRequestInput>;
};
export type RequestOfferCreateManyDriverInput = {
    id?: string;
    requestId: string;
    tripId?: string | null;
    offeredFare?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: string | null;
    status?: string;
    agreedFare?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type RequestOfferUpdateWithoutDriverInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    offeredFare?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    agreedFare?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    request?: Prisma.RideRequestUpdateOneRequiredWithoutOffersNestedInput;
    trip?: Prisma.TripUpdateOneWithoutOffersNestedInput;
};
export type RequestOfferUncheckedUpdateWithoutDriverInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    requestId?: Prisma.StringFieldUpdateOperationsInput | string;
    tripId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    offeredFare?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    agreedFare?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RequestOfferUncheckedUpdateManyWithoutDriverInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    requestId?: Prisma.StringFieldUpdateOperationsInput | string;
    tripId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    offeredFare?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    agreedFare?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RequestOfferCreateManyTripInput = {
    id?: string;
    requestId: string;
    driverId: string;
    offeredFare?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: string | null;
    status?: string;
    agreedFare?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type RequestOfferUpdateWithoutTripInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    offeredFare?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    agreedFare?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    request?: Prisma.RideRequestUpdateOneRequiredWithoutOffersNestedInput;
    driver?: Prisma.UserUpdateOneRequiredWithoutRequestOffersNestedInput;
};
export type RequestOfferUncheckedUpdateWithoutTripInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    requestId?: Prisma.StringFieldUpdateOperationsInput | string;
    driverId?: Prisma.StringFieldUpdateOperationsInput | string;
    offeredFare?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    agreedFare?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RequestOfferUncheckedUpdateManyWithoutTripInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    requestId?: Prisma.StringFieldUpdateOperationsInput | string;
    driverId?: Prisma.StringFieldUpdateOperationsInput | string;
    offeredFare?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    agreedFare?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RequestOfferCreateManyRequestInput = {
    id?: string;
    driverId: string;
    tripId?: string | null;
    offeredFare?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: string | null;
    status?: string;
    agreedFare?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type RequestOfferUpdateWithoutRequestInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    offeredFare?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    agreedFare?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    driver?: Prisma.UserUpdateOneRequiredWithoutRequestOffersNestedInput;
    trip?: Prisma.TripUpdateOneWithoutOffersNestedInput;
};
export type RequestOfferUncheckedUpdateWithoutRequestInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    driverId?: Prisma.StringFieldUpdateOperationsInput | string;
    tripId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    offeredFare?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    agreedFare?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RequestOfferUncheckedUpdateManyWithoutRequestInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    driverId?: Prisma.StringFieldUpdateOperationsInput | string;
    tripId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    offeredFare?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    message?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    agreedFare?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RequestOfferSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    requestId?: boolean;
    driverId?: boolean;
    tripId?: boolean;
    offeredFare?: boolean;
    message?: boolean;
    status?: boolean;
    agreedFare?: boolean;
    bookingId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    request?: boolean | Prisma.RideRequestDefaultArgs<ExtArgs>;
    driver?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    trip?: boolean | Prisma.RequestOffer$tripArgs<ExtArgs>;
}, ExtArgs["result"]["requestOffer"]>;
export type RequestOfferSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    requestId?: boolean;
    driverId?: boolean;
    tripId?: boolean;
    offeredFare?: boolean;
    message?: boolean;
    status?: boolean;
    agreedFare?: boolean;
    bookingId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    request?: boolean | Prisma.RideRequestDefaultArgs<ExtArgs>;
    driver?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    trip?: boolean | Prisma.RequestOffer$tripArgs<ExtArgs>;
}, ExtArgs["result"]["requestOffer"]>;
export type RequestOfferSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    requestId?: boolean;
    driverId?: boolean;
    tripId?: boolean;
    offeredFare?: boolean;
    message?: boolean;
    status?: boolean;
    agreedFare?: boolean;
    bookingId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    request?: boolean | Prisma.RideRequestDefaultArgs<ExtArgs>;
    driver?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    trip?: boolean | Prisma.RequestOffer$tripArgs<ExtArgs>;
}, ExtArgs["result"]["requestOffer"]>;
export type RequestOfferSelectScalar = {
    id?: boolean;
    requestId?: boolean;
    driverId?: boolean;
    tripId?: boolean;
    offeredFare?: boolean;
    message?: boolean;
    status?: boolean;
    agreedFare?: boolean;
    bookingId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type RequestOfferOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "requestId" | "driverId" | "tripId" | "offeredFare" | "message" | "status" | "agreedFare" | "bookingId" | "createdAt" | "updatedAt", ExtArgs["result"]["requestOffer"]>;
export type RequestOfferInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    request?: boolean | Prisma.RideRequestDefaultArgs<ExtArgs>;
    driver?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    trip?: boolean | Prisma.RequestOffer$tripArgs<ExtArgs>;
};
export type RequestOfferIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    request?: boolean | Prisma.RideRequestDefaultArgs<ExtArgs>;
    driver?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    trip?: boolean | Prisma.RequestOffer$tripArgs<ExtArgs>;
};
export type RequestOfferIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    request?: boolean | Prisma.RideRequestDefaultArgs<ExtArgs>;
    driver?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    trip?: boolean | Prisma.RequestOffer$tripArgs<ExtArgs>;
};
export type $RequestOfferPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "RequestOffer";
    objects: {
        request: Prisma.$RideRequestPayload<ExtArgs>;
        driver: Prisma.$UserPayload<ExtArgs>;
        trip: Prisma.$TripPayload<ExtArgs> | null;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        requestId: string;
        driverId: string;
        tripId: string | null;
        offeredFare: runtime.Decimal | null;
        message: string | null;
        status: string;
        agreedFare: runtime.Decimal | null;
        bookingId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["requestOffer"]>;
    composites: {};
};
export type RequestOfferGetPayload<S extends boolean | null | undefined | RequestOfferDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$RequestOfferPayload, S>;
export type RequestOfferCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<RequestOfferFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: RequestOfferCountAggregateInputType | true;
};
export interface RequestOfferDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['RequestOffer'];
        meta: {
            name: 'RequestOffer';
        };
    };
    findUnique<T extends RequestOfferFindUniqueArgs>(args: Prisma.SelectSubset<T, RequestOfferFindUniqueArgs<ExtArgs>>): Prisma.Prisma__RequestOfferClient<runtime.Types.Result.GetResult<Prisma.$RequestOfferPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends RequestOfferFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, RequestOfferFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__RequestOfferClient<runtime.Types.Result.GetResult<Prisma.$RequestOfferPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends RequestOfferFindFirstArgs>(args?: Prisma.SelectSubset<T, RequestOfferFindFirstArgs<ExtArgs>>): Prisma.Prisma__RequestOfferClient<runtime.Types.Result.GetResult<Prisma.$RequestOfferPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends RequestOfferFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, RequestOfferFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__RequestOfferClient<runtime.Types.Result.GetResult<Prisma.$RequestOfferPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends RequestOfferFindManyArgs>(args?: Prisma.SelectSubset<T, RequestOfferFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RequestOfferPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends RequestOfferCreateArgs>(args: Prisma.SelectSubset<T, RequestOfferCreateArgs<ExtArgs>>): Prisma.Prisma__RequestOfferClient<runtime.Types.Result.GetResult<Prisma.$RequestOfferPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends RequestOfferCreateManyArgs>(args?: Prisma.SelectSubset<T, RequestOfferCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends RequestOfferCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, RequestOfferCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RequestOfferPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends RequestOfferDeleteArgs>(args: Prisma.SelectSubset<T, RequestOfferDeleteArgs<ExtArgs>>): Prisma.Prisma__RequestOfferClient<runtime.Types.Result.GetResult<Prisma.$RequestOfferPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends RequestOfferUpdateArgs>(args: Prisma.SelectSubset<T, RequestOfferUpdateArgs<ExtArgs>>): Prisma.Prisma__RequestOfferClient<runtime.Types.Result.GetResult<Prisma.$RequestOfferPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends RequestOfferDeleteManyArgs>(args?: Prisma.SelectSubset<T, RequestOfferDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends RequestOfferUpdateManyArgs>(args: Prisma.SelectSubset<T, RequestOfferUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends RequestOfferUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, RequestOfferUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RequestOfferPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends RequestOfferUpsertArgs>(args: Prisma.SelectSubset<T, RequestOfferUpsertArgs<ExtArgs>>): Prisma.Prisma__RequestOfferClient<runtime.Types.Result.GetResult<Prisma.$RequestOfferPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends RequestOfferCountArgs>(args?: Prisma.Subset<T, RequestOfferCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], RequestOfferCountAggregateOutputType> : number>;
    aggregate<T extends RequestOfferAggregateArgs>(args: Prisma.Subset<T, RequestOfferAggregateArgs>): Prisma.PrismaPromise<GetRequestOfferAggregateType<T>>;
    groupBy<T extends RequestOfferGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: RequestOfferGroupByArgs['orderBy'];
    } : {
        orderBy?: RequestOfferGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, RequestOfferGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRequestOfferGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: RequestOfferFieldRefs;
}
export interface Prisma__RequestOfferClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    request<T extends Prisma.RideRequestDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.RideRequestDefaultArgs<ExtArgs>>): Prisma.Prisma__RideRequestClient<runtime.Types.Result.GetResult<Prisma.$RideRequestPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    driver<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    trip<T extends Prisma.RequestOffer$tripArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.RequestOffer$tripArgs<ExtArgs>>): Prisma.Prisma__TripClient<runtime.Types.Result.GetResult<Prisma.$TripPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface RequestOfferFieldRefs {
    readonly id: Prisma.FieldRef<"RequestOffer", 'String'>;
    readonly requestId: Prisma.FieldRef<"RequestOffer", 'String'>;
    readonly driverId: Prisma.FieldRef<"RequestOffer", 'String'>;
    readonly tripId: Prisma.FieldRef<"RequestOffer", 'String'>;
    readonly offeredFare: Prisma.FieldRef<"RequestOffer", 'Decimal'>;
    readonly message: Prisma.FieldRef<"RequestOffer", 'String'>;
    readonly status: Prisma.FieldRef<"RequestOffer", 'String'>;
    readonly agreedFare: Prisma.FieldRef<"RequestOffer", 'Decimal'>;
    readonly bookingId: Prisma.FieldRef<"RequestOffer", 'String'>;
    readonly createdAt: Prisma.FieldRef<"RequestOffer", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"RequestOffer", 'DateTime'>;
}
export type RequestOfferFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RequestOfferSelect<ExtArgs> | null;
    omit?: Prisma.RequestOfferOmit<ExtArgs> | null;
    include?: Prisma.RequestOfferInclude<ExtArgs> | null;
    where: Prisma.RequestOfferWhereUniqueInput;
};
export type RequestOfferFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RequestOfferSelect<ExtArgs> | null;
    omit?: Prisma.RequestOfferOmit<ExtArgs> | null;
    include?: Prisma.RequestOfferInclude<ExtArgs> | null;
    where: Prisma.RequestOfferWhereUniqueInput;
};
export type RequestOfferFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RequestOfferSelect<ExtArgs> | null;
    omit?: Prisma.RequestOfferOmit<ExtArgs> | null;
    include?: Prisma.RequestOfferInclude<ExtArgs> | null;
    where?: Prisma.RequestOfferWhereInput;
    orderBy?: Prisma.RequestOfferOrderByWithRelationInput | Prisma.RequestOfferOrderByWithRelationInput[];
    cursor?: Prisma.RequestOfferWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RequestOfferScalarFieldEnum | Prisma.RequestOfferScalarFieldEnum[];
};
export type RequestOfferFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RequestOfferSelect<ExtArgs> | null;
    omit?: Prisma.RequestOfferOmit<ExtArgs> | null;
    include?: Prisma.RequestOfferInclude<ExtArgs> | null;
    where?: Prisma.RequestOfferWhereInput;
    orderBy?: Prisma.RequestOfferOrderByWithRelationInput | Prisma.RequestOfferOrderByWithRelationInput[];
    cursor?: Prisma.RequestOfferWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RequestOfferScalarFieldEnum | Prisma.RequestOfferScalarFieldEnum[];
};
export type RequestOfferFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RequestOfferSelect<ExtArgs> | null;
    omit?: Prisma.RequestOfferOmit<ExtArgs> | null;
    include?: Prisma.RequestOfferInclude<ExtArgs> | null;
    where?: Prisma.RequestOfferWhereInput;
    orderBy?: Prisma.RequestOfferOrderByWithRelationInput | Prisma.RequestOfferOrderByWithRelationInput[];
    cursor?: Prisma.RequestOfferWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RequestOfferScalarFieldEnum | Prisma.RequestOfferScalarFieldEnum[];
};
export type RequestOfferCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RequestOfferSelect<ExtArgs> | null;
    omit?: Prisma.RequestOfferOmit<ExtArgs> | null;
    include?: Prisma.RequestOfferInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RequestOfferCreateInput, Prisma.RequestOfferUncheckedCreateInput>;
};
export type RequestOfferCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.RequestOfferCreateManyInput | Prisma.RequestOfferCreateManyInput[];
    skipDuplicates?: boolean;
};
export type RequestOfferCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RequestOfferSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.RequestOfferOmit<ExtArgs> | null;
    data: Prisma.RequestOfferCreateManyInput | Prisma.RequestOfferCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.RequestOfferIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type RequestOfferUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RequestOfferSelect<ExtArgs> | null;
    omit?: Prisma.RequestOfferOmit<ExtArgs> | null;
    include?: Prisma.RequestOfferInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RequestOfferUpdateInput, Prisma.RequestOfferUncheckedUpdateInput>;
    where: Prisma.RequestOfferWhereUniqueInput;
};
export type RequestOfferUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.RequestOfferUpdateManyMutationInput, Prisma.RequestOfferUncheckedUpdateManyInput>;
    where?: Prisma.RequestOfferWhereInput;
    limit?: number;
};
export type RequestOfferUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RequestOfferSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.RequestOfferOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RequestOfferUpdateManyMutationInput, Prisma.RequestOfferUncheckedUpdateManyInput>;
    where?: Prisma.RequestOfferWhereInput;
    limit?: number;
    include?: Prisma.RequestOfferIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type RequestOfferUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RequestOfferSelect<ExtArgs> | null;
    omit?: Prisma.RequestOfferOmit<ExtArgs> | null;
    include?: Prisma.RequestOfferInclude<ExtArgs> | null;
    where: Prisma.RequestOfferWhereUniqueInput;
    create: Prisma.XOR<Prisma.RequestOfferCreateInput, Prisma.RequestOfferUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.RequestOfferUpdateInput, Prisma.RequestOfferUncheckedUpdateInput>;
};
export type RequestOfferDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RequestOfferSelect<ExtArgs> | null;
    omit?: Prisma.RequestOfferOmit<ExtArgs> | null;
    include?: Prisma.RequestOfferInclude<ExtArgs> | null;
    where: Prisma.RequestOfferWhereUniqueInput;
};
export type RequestOfferDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RequestOfferWhereInput;
    limit?: number;
};
export type RequestOffer$tripArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripSelect<ExtArgs> | null;
    omit?: Prisma.TripOmit<ExtArgs> | null;
    include?: Prisma.TripInclude<ExtArgs> | null;
    where?: Prisma.TripWhereInput;
};
export type RequestOfferDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RequestOfferSelect<ExtArgs> | null;
    omit?: Prisma.RequestOfferOmit<ExtArgs> | null;
    include?: Prisma.RequestOfferInclude<ExtArgs> | null;
};
