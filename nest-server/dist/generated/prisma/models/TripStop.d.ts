import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums.js";
import type * as Prisma from "../internal/prismaNamespace.js";
export type TripStopModel = runtime.Types.Result.DefaultSelection<Prisma.$TripStopPayload>;
export type AggregateTripStop = {
    _count: TripStopCountAggregateOutputType | null;
    _avg: TripStopAvgAggregateOutputType | null;
    _sum: TripStopSumAggregateOutputType | null;
    _min: TripStopMinAggregateOutputType | null;
    _max: TripStopMaxAggregateOutputType | null;
};
export type TripStopAvgAggregateOutputType = {
    stopOrder: number | null;
    lat: runtime.Decimal | null;
    lng: runtime.Decimal | null;
    stopLat: runtime.Decimal | null;
    stopLng: runtime.Decimal | null;
};
export type TripStopSumAggregateOutputType = {
    stopOrder: number | null;
    lat: runtime.Decimal | null;
    lng: runtime.Decimal | null;
    stopLat: runtime.Decimal | null;
    stopLng: runtime.Decimal | null;
};
export type TripStopMinAggregateOutputType = {
    id: string | null;
    tripId: string | null;
    stopOrder: number | null;
    stopName: string | null;
    city: string | null;
    address: string | null;
    lat: runtime.Decimal | null;
    lng: runtime.Decimal | null;
    stopLat: runtime.Decimal | null;
    stopLng: runtime.Decimal | null;
    stopType: $Enums.StopType | null;
    estimatedArrival: Date | null;
    createdAt: Date | null;
};
export type TripStopMaxAggregateOutputType = {
    id: string | null;
    tripId: string | null;
    stopOrder: number | null;
    stopName: string | null;
    city: string | null;
    address: string | null;
    lat: runtime.Decimal | null;
    lng: runtime.Decimal | null;
    stopLat: runtime.Decimal | null;
    stopLng: runtime.Decimal | null;
    stopType: $Enums.StopType | null;
    estimatedArrival: Date | null;
    createdAt: Date | null;
};
export type TripStopCountAggregateOutputType = {
    id: number;
    tripId: number;
    stopOrder: number;
    stopName: number;
    city: number;
    address: number;
    lat: number;
    lng: number;
    stopLat: number;
    stopLng: number;
    stopType: number;
    estimatedArrival: number;
    createdAt: number;
    _all: number;
};
export type TripStopAvgAggregateInputType = {
    stopOrder?: true;
    lat?: true;
    lng?: true;
    stopLat?: true;
    stopLng?: true;
};
export type TripStopSumAggregateInputType = {
    stopOrder?: true;
    lat?: true;
    lng?: true;
    stopLat?: true;
    stopLng?: true;
};
export type TripStopMinAggregateInputType = {
    id?: true;
    tripId?: true;
    stopOrder?: true;
    stopName?: true;
    city?: true;
    address?: true;
    lat?: true;
    lng?: true;
    stopLat?: true;
    stopLng?: true;
    stopType?: true;
    estimatedArrival?: true;
    createdAt?: true;
};
export type TripStopMaxAggregateInputType = {
    id?: true;
    tripId?: true;
    stopOrder?: true;
    stopName?: true;
    city?: true;
    address?: true;
    lat?: true;
    lng?: true;
    stopLat?: true;
    stopLng?: true;
    stopType?: true;
    estimatedArrival?: true;
    createdAt?: true;
};
export type TripStopCountAggregateInputType = {
    id?: true;
    tripId?: true;
    stopOrder?: true;
    stopName?: true;
    city?: true;
    address?: true;
    lat?: true;
    lng?: true;
    stopLat?: true;
    stopLng?: true;
    stopType?: true;
    estimatedArrival?: true;
    createdAt?: true;
    _all?: true;
};
export type TripStopAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TripStopWhereInput;
    orderBy?: Prisma.TripStopOrderByWithRelationInput | Prisma.TripStopOrderByWithRelationInput[];
    cursor?: Prisma.TripStopWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | TripStopCountAggregateInputType;
    _avg?: TripStopAvgAggregateInputType;
    _sum?: TripStopSumAggregateInputType;
    _min?: TripStopMinAggregateInputType;
    _max?: TripStopMaxAggregateInputType;
};
export type GetTripStopAggregateType<T extends TripStopAggregateArgs> = {
    [P in keyof T & keyof AggregateTripStop]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateTripStop[P]> : Prisma.GetScalarType<T[P], AggregateTripStop[P]>;
};
export type TripStopGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TripStopWhereInput;
    orderBy?: Prisma.TripStopOrderByWithAggregationInput | Prisma.TripStopOrderByWithAggregationInput[];
    by: Prisma.TripStopScalarFieldEnum[] | Prisma.TripStopScalarFieldEnum;
    having?: Prisma.TripStopScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: TripStopCountAggregateInputType | true;
    _avg?: TripStopAvgAggregateInputType;
    _sum?: TripStopSumAggregateInputType;
    _min?: TripStopMinAggregateInputType;
    _max?: TripStopMaxAggregateInputType;
};
export type TripStopGroupByOutputType = {
    id: string;
    tripId: string;
    stopOrder: number;
    stopName: string | null;
    city: string | null;
    address: string | null;
    lat: runtime.Decimal | null;
    lng: runtime.Decimal | null;
    stopLat: runtime.Decimal | null;
    stopLng: runtime.Decimal | null;
    stopType: $Enums.StopType | null;
    estimatedArrival: Date | null;
    createdAt: Date;
    _count: TripStopCountAggregateOutputType | null;
    _avg: TripStopAvgAggregateOutputType | null;
    _sum: TripStopSumAggregateOutputType | null;
    _min: TripStopMinAggregateOutputType | null;
    _max: TripStopMaxAggregateOutputType | null;
};
export type GetTripStopGroupByPayload<T extends TripStopGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<TripStopGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof TripStopGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], TripStopGroupByOutputType[P]> : Prisma.GetScalarType<T[P], TripStopGroupByOutputType[P]>;
}>>;
export type TripStopWhereInput = {
    AND?: Prisma.TripStopWhereInput | Prisma.TripStopWhereInput[];
    OR?: Prisma.TripStopWhereInput[];
    NOT?: Prisma.TripStopWhereInput | Prisma.TripStopWhereInput[];
    id?: Prisma.UuidFilter<"TripStop"> | string;
    tripId?: Prisma.UuidFilter<"TripStop"> | string;
    stopOrder?: Prisma.IntFilter<"TripStop"> | number;
    stopName?: Prisma.StringNullableFilter<"TripStop"> | string | null;
    city?: Prisma.StringNullableFilter<"TripStop"> | string | null;
    address?: Prisma.StringNullableFilter<"TripStop"> | string | null;
    lat?: Prisma.DecimalNullableFilter<"TripStop"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    lng?: Prisma.DecimalNullableFilter<"TripStop"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLat?: Prisma.DecimalNullableFilter<"TripStop"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLng?: Prisma.DecimalNullableFilter<"TripStop"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopType?: Prisma.EnumStopTypeNullableFilter<"TripStop"> | $Enums.StopType | null;
    estimatedArrival?: Prisma.DateTimeNullableFilter<"TripStop"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"TripStop"> | Date | string;
    trip?: Prisma.XOR<Prisma.TripScalarRelationFilter, Prisma.TripWhereInput>;
};
export type TripStopOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    tripId?: Prisma.SortOrder;
    stopOrder?: Prisma.SortOrder;
    stopName?: Prisma.SortOrderInput | Prisma.SortOrder;
    city?: Prisma.SortOrderInput | Prisma.SortOrder;
    address?: Prisma.SortOrderInput | Prisma.SortOrder;
    lat?: Prisma.SortOrderInput | Prisma.SortOrder;
    lng?: Prisma.SortOrderInput | Prisma.SortOrder;
    stopLat?: Prisma.SortOrderInput | Prisma.SortOrder;
    stopLng?: Prisma.SortOrderInput | Prisma.SortOrder;
    stopType?: Prisma.SortOrderInput | Prisma.SortOrder;
    estimatedArrival?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    trip?: Prisma.TripOrderByWithRelationInput;
};
export type TripStopWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    tripId_stopOrder?: Prisma.TripStopTripIdStopOrderCompoundUniqueInput;
    AND?: Prisma.TripStopWhereInput | Prisma.TripStopWhereInput[];
    OR?: Prisma.TripStopWhereInput[];
    NOT?: Prisma.TripStopWhereInput | Prisma.TripStopWhereInput[];
    tripId?: Prisma.UuidFilter<"TripStop"> | string;
    stopOrder?: Prisma.IntFilter<"TripStop"> | number;
    stopName?: Prisma.StringNullableFilter<"TripStop"> | string | null;
    city?: Prisma.StringNullableFilter<"TripStop"> | string | null;
    address?: Prisma.StringNullableFilter<"TripStop"> | string | null;
    lat?: Prisma.DecimalNullableFilter<"TripStop"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    lng?: Prisma.DecimalNullableFilter<"TripStop"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLat?: Prisma.DecimalNullableFilter<"TripStop"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLng?: Prisma.DecimalNullableFilter<"TripStop"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopType?: Prisma.EnumStopTypeNullableFilter<"TripStop"> | $Enums.StopType | null;
    estimatedArrival?: Prisma.DateTimeNullableFilter<"TripStop"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"TripStop"> | Date | string;
    trip?: Prisma.XOR<Prisma.TripScalarRelationFilter, Prisma.TripWhereInput>;
}, "id" | "tripId_stopOrder">;
export type TripStopOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    tripId?: Prisma.SortOrder;
    stopOrder?: Prisma.SortOrder;
    stopName?: Prisma.SortOrderInput | Prisma.SortOrder;
    city?: Prisma.SortOrderInput | Prisma.SortOrder;
    address?: Prisma.SortOrderInput | Prisma.SortOrder;
    lat?: Prisma.SortOrderInput | Prisma.SortOrder;
    lng?: Prisma.SortOrderInput | Prisma.SortOrder;
    stopLat?: Prisma.SortOrderInput | Prisma.SortOrder;
    stopLng?: Prisma.SortOrderInput | Prisma.SortOrder;
    stopType?: Prisma.SortOrderInput | Prisma.SortOrder;
    estimatedArrival?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.TripStopCountOrderByAggregateInput;
    _avg?: Prisma.TripStopAvgOrderByAggregateInput;
    _max?: Prisma.TripStopMaxOrderByAggregateInput;
    _min?: Prisma.TripStopMinOrderByAggregateInput;
    _sum?: Prisma.TripStopSumOrderByAggregateInput;
};
export type TripStopScalarWhereWithAggregatesInput = {
    AND?: Prisma.TripStopScalarWhereWithAggregatesInput | Prisma.TripStopScalarWhereWithAggregatesInput[];
    OR?: Prisma.TripStopScalarWhereWithAggregatesInput[];
    NOT?: Prisma.TripStopScalarWhereWithAggregatesInput | Prisma.TripStopScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"TripStop"> | string;
    tripId?: Prisma.UuidWithAggregatesFilter<"TripStop"> | string;
    stopOrder?: Prisma.IntWithAggregatesFilter<"TripStop"> | number;
    stopName?: Prisma.StringNullableWithAggregatesFilter<"TripStop"> | string | null;
    city?: Prisma.StringNullableWithAggregatesFilter<"TripStop"> | string | null;
    address?: Prisma.StringNullableWithAggregatesFilter<"TripStop"> | string | null;
    lat?: Prisma.DecimalNullableWithAggregatesFilter<"TripStop"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    lng?: Prisma.DecimalNullableWithAggregatesFilter<"TripStop"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLat?: Prisma.DecimalNullableWithAggregatesFilter<"TripStop"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLng?: Prisma.DecimalNullableWithAggregatesFilter<"TripStop"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopType?: Prisma.EnumStopTypeNullableWithAggregatesFilter<"TripStop"> | $Enums.StopType | null;
    estimatedArrival?: Prisma.DateTimeNullableWithAggregatesFilter<"TripStop"> | Date | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"TripStop"> | Date | string;
};
export type TripStopCreateInput = {
    id?: string;
    stopOrder: number;
    stopName?: string | null;
    city?: string | null;
    address?: string | null;
    lat?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    lng?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLat?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLng?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopType?: $Enums.StopType | null;
    estimatedArrival?: Date | string | null;
    createdAt?: Date | string;
    trip: Prisma.TripCreateNestedOneWithoutStopsInput;
};
export type TripStopUncheckedCreateInput = {
    id?: string;
    tripId: string;
    stopOrder: number;
    stopName?: string | null;
    city?: string | null;
    address?: string | null;
    lat?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    lng?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLat?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLng?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopType?: $Enums.StopType | null;
    estimatedArrival?: Date | string | null;
    createdAt?: Date | string;
};
export type TripStopUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    stopOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    stopName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    city?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    address?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    lat?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    lng?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLat?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLng?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopType?: Prisma.NullableEnumStopTypeFieldUpdateOperationsInput | $Enums.StopType | null;
    estimatedArrival?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    trip?: Prisma.TripUpdateOneRequiredWithoutStopsNestedInput;
};
export type TripStopUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    tripId?: Prisma.StringFieldUpdateOperationsInput | string;
    stopOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    stopName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    city?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    address?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    lat?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    lng?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLat?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLng?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopType?: Prisma.NullableEnumStopTypeFieldUpdateOperationsInput | $Enums.StopType | null;
    estimatedArrival?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TripStopCreateManyInput = {
    id?: string;
    tripId: string;
    stopOrder: number;
    stopName?: string | null;
    city?: string | null;
    address?: string | null;
    lat?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    lng?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLat?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLng?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopType?: $Enums.StopType | null;
    estimatedArrival?: Date | string | null;
    createdAt?: Date | string;
};
export type TripStopUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    stopOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    stopName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    city?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    address?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    lat?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    lng?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLat?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLng?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopType?: Prisma.NullableEnumStopTypeFieldUpdateOperationsInput | $Enums.StopType | null;
    estimatedArrival?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TripStopUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    tripId?: Prisma.StringFieldUpdateOperationsInput | string;
    stopOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    stopName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    city?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    address?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    lat?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    lng?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLat?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLng?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopType?: Prisma.NullableEnumStopTypeFieldUpdateOperationsInput | $Enums.StopType | null;
    estimatedArrival?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TripStopListRelationFilter = {
    every?: Prisma.TripStopWhereInput;
    some?: Prisma.TripStopWhereInput;
    none?: Prisma.TripStopWhereInput;
};
export type TripStopOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type TripStopTripIdStopOrderCompoundUniqueInput = {
    tripId: string;
    stopOrder: number;
};
export type TripStopCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    tripId?: Prisma.SortOrder;
    stopOrder?: Prisma.SortOrder;
    stopName?: Prisma.SortOrder;
    city?: Prisma.SortOrder;
    address?: Prisma.SortOrder;
    lat?: Prisma.SortOrder;
    lng?: Prisma.SortOrder;
    stopLat?: Prisma.SortOrder;
    stopLng?: Prisma.SortOrder;
    stopType?: Prisma.SortOrder;
    estimatedArrival?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type TripStopAvgOrderByAggregateInput = {
    stopOrder?: Prisma.SortOrder;
    lat?: Prisma.SortOrder;
    lng?: Prisma.SortOrder;
    stopLat?: Prisma.SortOrder;
    stopLng?: Prisma.SortOrder;
};
export type TripStopMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    tripId?: Prisma.SortOrder;
    stopOrder?: Prisma.SortOrder;
    stopName?: Prisma.SortOrder;
    city?: Prisma.SortOrder;
    address?: Prisma.SortOrder;
    lat?: Prisma.SortOrder;
    lng?: Prisma.SortOrder;
    stopLat?: Prisma.SortOrder;
    stopLng?: Prisma.SortOrder;
    stopType?: Prisma.SortOrder;
    estimatedArrival?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type TripStopMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    tripId?: Prisma.SortOrder;
    stopOrder?: Prisma.SortOrder;
    stopName?: Prisma.SortOrder;
    city?: Prisma.SortOrder;
    address?: Prisma.SortOrder;
    lat?: Prisma.SortOrder;
    lng?: Prisma.SortOrder;
    stopLat?: Prisma.SortOrder;
    stopLng?: Prisma.SortOrder;
    stopType?: Prisma.SortOrder;
    estimatedArrival?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type TripStopSumOrderByAggregateInput = {
    stopOrder?: Prisma.SortOrder;
    lat?: Prisma.SortOrder;
    lng?: Prisma.SortOrder;
    stopLat?: Prisma.SortOrder;
    stopLng?: Prisma.SortOrder;
};
export type TripStopCreateNestedManyWithoutTripInput = {
    create?: Prisma.XOR<Prisma.TripStopCreateWithoutTripInput, Prisma.TripStopUncheckedCreateWithoutTripInput> | Prisma.TripStopCreateWithoutTripInput[] | Prisma.TripStopUncheckedCreateWithoutTripInput[];
    connectOrCreate?: Prisma.TripStopCreateOrConnectWithoutTripInput | Prisma.TripStopCreateOrConnectWithoutTripInput[];
    createMany?: Prisma.TripStopCreateManyTripInputEnvelope;
    connect?: Prisma.TripStopWhereUniqueInput | Prisma.TripStopWhereUniqueInput[];
};
export type TripStopUncheckedCreateNestedManyWithoutTripInput = {
    create?: Prisma.XOR<Prisma.TripStopCreateWithoutTripInput, Prisma.TripStopUncheckedCreateWithoutTripInput> | Prisma.TripStopCreateWithoutTripInput[] | Prisma.TripStopUncheckedCreateWithoutTripInput[];
    connectOrCreate?: Prisma.TripStopCreateOrConnectWithoutTripInput | Prisma.TripStopCreateOrConnectWithoutTripInput[];
    createMany?: Prisma.TripStopCreateManyTripInputEnvelope;
    connect?: Prisma.TripStopWhereUniqueInput | Prisma.TripStopWhereUniqueInput[];
};
export type TripStopUpdateManyWithoutTripNestedInput = {
    create?: Prisma.XOR<Prisma.TripStopCreateWithoutTripInput, Prisma.TripStopUncheckedCreateWithoutTripInput> | Prisma.TripStopCreateWithoutTripInput[] | Prisma.TripStopUncheckedCreateWithoutTripInput[];
    connectOrCreate?: Prisma.TripStopCreateOrConnectWithoutTripInput | Prisma.TripStopCreateOrConnectWithoutTripInput[];
    upsert?: Prisma.TripStopUpsertWithWhereUniqueWithoutTripInput | Prisma.TripStopUpsertWithWhereUniqueWithoutTripInput[];
    createMany?: Prisma.TripStopCreateManyTripInputEnvelope;
    set?: Prisma.TripStopWhereUniqueInput | Prisma.TripStopWhereUniqueInput[];
    disconnect?: Prisma.TripStopWhereUniqueInput | Prisma.TripStopWhereUniqueInput[];
    delete?: Prisma.TripStopWhereUniqueInput | Prisma.TripStopWhereUniqueInput[];
    connect?: Prisma.TripStopWhereUniqueInput | Prisma.TripStopWhereUniqueInput[];
    update?: Prisma.TripStopUpdateWithWhereUniqueWithoutTripInput | Prisma.TripStopUpdateWithWhereUniqueWithoutTripInput[];
    updateMany?: Prisma.TripStopUpdateManyWithWhereWithoutTripInput | Prisma.TripStopUpdateManyWithWhereWithoutTripInput[];
    deleteMany?: Prisma.TripStopScalarWhereInput | Prisma.TripStopScalarWhereInput[];
};
export type TripStopUncheckedUpdateManyWithoutTripNestedInput = {
    create?: Prisma.XOR<Prisma.TripStopCreateWithoutTripInput, Prisma.TripStopUncheckedCreateWithoutTripInput> | Prisma.TripStopCreateWithoutTripInput[] | Prisma.TripStopUncheckedCreateWithoutTripInput[];
    connectOrCreate?: Prisma.TripStopCreateOrConnectWithoutTripInput | Prisma.TripStopCreateOrConnectWithoutTripInput[];
    upsert?: Prisma.TripStopUpsertWithWhereUniqueWithoutTripInput | Prisma.TripStopUpsertWithWhereUniqueWithoutTripInput[];
    createMany?: Prisma.TripStopCreateManyTripInputEnvelope;
    set?: Prisma.TripStopWhereUniqueInput | Prisma.TripStopWhereUniqueInput[];
    disconnect?: Prisma.TripStopWhereUniqueInput | Prisma.TripStopWhereUniqueInput[];
    delete?: Prisma.TripStopWhereUniqueInput | Prisma.TripStopWhereUniqueInput[];
    connect?: Prisma.TripStopWhereUniqueInput | Prisma.TripStopWhereUniqueInput[];
    update?: Prisma.TripStopUpdateWithWhereUniqueWithoutTripInput | Prisma.TripStopUpdateWithWhereUniqueWithoutTripInput[];
    updateMany?: Prisma.TripStopUpdateManyWithWhereWithoutTripInput | Prisma.TripStopUpdateManyWithWhereWithoutTripInput[];
    deleteMany?: Prisma.TripStopScalarWhereInput | Prisma.TripStopScalarWhereInput[];
};
export type NullableEnumStopTypeFieldUpdateOperationsInput = {
    set?: $Enums.StopType | null;
};
export type TripStopCreateWithoutTripInput = {
    id?: string;
    stopOrder: number;
    stopName?: string | null;
    city?: string | null;
    address?: string | null;
    lat?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    lng?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLat?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLng?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopType?: $Enums.StopType | null;
    estimatedArrival?: Date | string | null;
    createdAt?: Date | string;
};
export type TripStopUncheckedCreateWithoutTripInput = {
    id?: string;
    stopOrder: number;
    stopName?: string | null;
    city?: string | null;
    address?: string | null;
    lat?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    lng?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLat?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLng?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopType?: $Enums.StopType | null;
    estimatedArrival?: Date | string | null;
    createdAt?: Date | string;
};
export type TripStopCreateOrConnectWithoutTripInput = {
    where: Prisma.TripStopWhereUniqueInput;
    create: Prisma.XOR<Prisma.TripStopCreateWithoutTripInput, Prisma.TripStopUncheckedCreateWithoutTripInput>;
};
export type TripStopCreateManyTripInputEnvelope = {
    data: Prisma.TripStopCreateManyTripInput | Prisma.TripStopCreateManyTripInput[];
    skipDuplicates?: boolean;
};
export type TripStopUpsertWithWhereUniqueWithoutTripInput = {
    where: Prisma.TripStopWhereUniqueInput;
    update: Prisma.XOR<Prisma.TripStopUpdateWithoutTripInput, Prisma.TripStopUncheckedUpdateWithoutTripInput>;
    create: Prisma.XOR<Prisma.TripStopCreateWithoutTripInput, Prisma.TripStopUncheckedCreateWithoutTripInput>;
};
export type TripStopUpdateWithWhereUniqueWithoutTripInput = {
    where: Prisma.TripStopWhereUniqueInput;
    data: Prisma.XOR<Prisma.TripStopUpdateWithoutTripInput, Prisma.TripStopUncheckedUpdateWithoutTripInput>;
};
export type TripStopUpdateManyWithWhereWithoutTripInput = {
    where: Prisma.TripStopScalarWhereInput;
    data: Prisma.XOR<Prisma.TripStopUpdateManyMutationInput, Prisma.TripStopUncheckedUpdateManyWithoutTripInput>;
};
export type TripStopScalarWhereInput = {
    AND?: Prisma.TripStopScalarWhereInput | Prisma.TripStopScalarWhereInput[];
    OR?: Prisma.TripStopScalarWhereInput[];
    NOT?: Prisma.TripStopScalarWhereInput | Prisma.TripStopScalarWhereInput[];
    id?: Prisma.UuidFilter<"TripStop"> | string;
    tripId?: Prisma.UuidFilter<"TripStop"> | string;
    stopOrder?: Prisma.IntFilter<"TripStop"> | number;
    stopName?: Prisma.StringNullableFilter<"TripStop"> | string | null;
    city?: Prisma.StringNullableFilter<"TripStop"> | string | null;
    address?: Prisma.StringNullableFilter<"TripStop"> | string | null;
    lat?: Prisma.DecimalNullableFilter<"TripStop"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    lng?: Prisma.DecimalNullableFilter<"TripStop"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLat?: Prisma.DecimalNullableFilter<"TripStop"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLng?: Prisma.DecimalNullableFilter<"TripStop"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopType?: Prisma.EnumStopTypeNullableFilter<"TripStop"> | $Enums.StopType | null;
    estimatedArrival?: Prisma.DateTimeNullableFilter<"TripStop"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"TripStop"> | Date | string;
};
export type TripStopCreateManyTripInput = {
    id?: string;
    stopOrder: number;
    stopName?: string | null;
    city?: string | null;
    address?: string | null;
    lat?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    lng?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLat?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLng?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopType?: $Enums.StopType | null;
    estimatedArrival?: Date | string | null;
    createdAt?: Date | string;
};
export type TripStopUpdateWithoutTripInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    stopOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    stopName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    city?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    address?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    lat?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    lng?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLat?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLng?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopType?: Prisma.NullableEnumStopTypeFieldUpdateOperationsInput | $Enums.StopType | null;
    estimatedArrival?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TripStopUncheckedUpdateWithoutTripInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    stopOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    stopName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    city?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    address?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    lat?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    lng?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLat?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLng?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopType?: Prisma.NullableEnumStopTypeFieldUpdateOperationsInput | $Enums.StopType | null;
    estimatedArrival?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TripStopUncheckedUpdateManyWithoutTripInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    stopOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    stopName?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    city?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    address?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    lat?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    lng?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLat?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopLng?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    stopType?: Prisma.NullableEnumStopTypeFieldUpdateOperationsInput | $Enums.StopType | null;
    estimatedArrival?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TripStopSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    tripId?: boolean;
    stopOrder?: boolean;
    stopName?: boolean;
    city?: boolean;
    address?: boolean;
    lat?: boolean;
    lng?: boolean;
    stopLat?: boolean;
    stopLng?: boolean;
    stopType?: boolean;
    estimatedArrival?: boolean;
    createdAt?: boolean;
    trip?: boolean | Prisma.TripDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["tripStop"]>;
export type TripStopSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    tripId?: boolean;
    stopOrder?: boolean;
    stopName?: boolean;
    city?: boolean;
    address?: boolean;
    lat?: boolean;
    lng?: boolean;
    stopLat?: boolean;
    stopLng?: boolean;
    stopType?: boolean;
    estimatedArrival?: boolean;
    createdAt?: boolean;
    trip?: boolean | Prisma.TripDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["tripStop"]>;
export type TripStopSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    tripId?: boolean;
    stopOrder?: boolean;
    stopName?: boolean;
    city?: boolean;
    address?: boolean;
    lat?: boolean;
    lng?: boolean;
    stopLat?: boolean;
    stopLng?: boolean;
    stopType?: boolean;
    estimatedArrival?: boolean;
    createdAt?: boolean;
    trip?: boolean | Prisma.TripDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["tripStop"]>;
export type TripStopSelectScalar = {
    id?: boolean;
    tripId?: boolean;
    stopOrder?: boolean;
    stopName?: boolean;
    city?: boolean;
    address?: boolean;
    lat?: boolean;
    lng?: boolean;
    stopLat?: boolean;
    stopLng?: boolean;
    stopType?: boolean;
    estimatedArrival?: boolean;
    createdAt?: boolean;
};
export type TripStopOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "tripId" | "stopOrder" | "stopName" | "city" | "address" | "lat" | "lng" | "stopLat" | "stopLng" | "stopType" | "estimatedArrival" | "createdAt", ExtArgs["result"]["tripStop"]>;
export type TripStopInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    trip?: boolean | Prisma.TripDefaultArgs<ExtArgs>;
};
export type TripStopIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    trip?: boolean | Prisma.TripDefaultArgs<ExtArgs>;
};
export type TripStopIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    trip?: boolean | Prisma.TripDefaultArgs<ExtArgs>;
};
export type $TripStopPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "TripStop";
    objects: {
        trip: Prisma.$TripPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        tripId: string;
        stopOrder: number;
        stopName: string | null;
        city: string | null;
        address: string | null;
        lat: runtime.Decimal | null;
        lng: runtime.Decimal | null;
        stopLat: runtime.Decimal | null;
        stopLng: runtime.Decimal | null;
        stopType: $Enums.StopType | null;
        estimatedArrival: Date | null;
        createdAt: Date;
    }, ExtArgs["result"]["tripStop"]>;
    composites: {};
};
export type TripStopGetPayload<S extends boolean | null | undefined | TripStopDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$TripStopPayload, S>;
export type TripStopCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<TripStopFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: TripStopCountAggregateInputType | true;
};
export interface TripStopDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['TripStop'];
        meta: {
            name: 'TripStop';
        };
    };
    findUnique<T extends TripStopFindUniqueArgs>(args: Prisma.SelectSubset<T, TripStopFindUniqueArgs<ExtArgs>>): Prisma.Prisma__TripStopClient<runtime.Types.Result.GetResult<Prisma.$TripStopPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends TripStopFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, TripStopFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__TripStopClient<runtime.Types.Result.GetResult<Prisma.$TripStopPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends TripStopFindFirstArgs>(args?: Prisma.SelectSubset<T, TripStopFindFirstArgs<ExtArgs>>): Prisma.Prisma__TripStopClient<runtime.Types.Result.GetResult<Prisma.$TripStopPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends TripStopFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, TripStopFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__TripStopClient<runtime.Types.Result.GetResult<Prisma.$TripStopPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends TripStopFindManyArgs>(args?: Prisma.SelectSubset<T, TripStopFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TripStopPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends TripStopCreateArgs>(args: Prisma.SelectSubset<T, TripStopCreateArgs<ExtArgs>>): Prisma.Prisma__TripStopClient<runtime.Types.Result.GetResult<Prisma.$TripStopPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends TripStopCreateManyArgs>(args?: Prisma.SelectSubset<T, TripStopCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends TripStopCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, TripStopCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TripStopPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends TripStopDeleteArgs>(args: Prisma.SelectSubset<T, TripStopDeleteArgs<ExtArgs>>): Prisma.Prisma__TripStopClient<runtime.Types.Result.GetResult<Prisma.$TripStopPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends TripStopUpdateArgs>(args: Prisma.SelectSubset<T, TripStopUpdateArgs<ExtArgs>>): Prisma.Prisma__TripStopClient<runtime.Types.Result.GetResult<Prisma.$TripStopPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends TripStopDeleteManyArgs>(args?: Prisma.SelectSubset<T, TripStopDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends TripStopUpdateManyArgs>(args: Prisma.SelectSubset<T, TripStopUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends TripStopUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, TripStopUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TripStopPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends TripStopUpsertArgs>(args: Prisma.SelectSubset<T, TripStopUpsertArgs<ExtArgs>>): Prisma.Prisma__TripStopClient<runtime.Types.Result.GetResult<Prisma.$TripStopPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends TripStopCountArgs>(args?: Prisma.Subset<T, TripStopCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], TripStopCountAggregateOutputType> : number>;
    aggregate<T extends TripStopAggregateArgs>(args: Prisma.Subset<T, TripStopAggregateArgs>): Prisma.PrismaPromise<GetTripStopAggregateType<T>>;
    groupBy<T extends TripStopGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: TripStopGroupByArgs['orderBy'];
    } : {
        orderBy?: TripStopGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, TripStopGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTripStopGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: TripStopFieldRefs;
}
export interface Prisma__TripStopClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    trip<T extends Prisma.TripDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.TripDefaultArgs<ExtArgs>>): Prisma.Prisma__TripClient<runtime.Types.Result.GetResult<Prisma.$TripPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface TripStopFieldRefs {
    readonly id: Prisma.FieldRef<"TripStop", 'String'>;
    readonly tripId: Prisma.FieldRef<"TripStop", 'String'>;
    readonly stopOrder: Prisma.FieldRef<"TripStop", 'Int'>;
    readonly stopName: Prisma.FieldRef<"TripStop", 'String'>;
    readonly city: Prisma.FieldRef<"TripStop", 'String'>;
    readonly address: Prisma.FieldRef<"TripStop", 'String'>;
    readonly lat: Prisma.FieldRef<"TripStop", 'Decimal'>;
    readonly lng: Prisma.FieldRef<"TripStop", 'Decimal'>;
    readonly stopLat: Prisma.FieldRef<"TripStop", 'Decimal'>;
    readonly stopLng: Prisma.FieldRef<"TripStop", 'Decimal'>;
    readonly stopType: Prisma.FieldRef<"TripStop", 'StopType'>;
    readonly estimatedArrival: Prisma.FieldRef<"TripStop", 'DateTime'>;
    readonly createdAt: Prisma.FieldRef<"TripStop", 'DateTime'>;
}
export type TripStopFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripStopSelect<ExtArgs> | null;
    omit?: Prisma.TripStopOmit<ExtArgs> | null;
    include?: Prisma.TripStopInclude<ExtArgs> | null;
    where: Prisma.TripStopWhereUniqueInput;
};
export type TripStopFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripStopSelect<ExtArgs> | null;
    omit?: Prisma.TripStopOmit<ExtArgs> | null;
    include?: Prisma.TripStopInclude<ExtArgs> | null;
    where: Prisma.TripStopWhereUniqueInput;
};
export type TripStopFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripStopSelect<ExtArgs> | null;
    omit?: Prisma.TripStopOmit<ExtArgs> | null;
    include?: Prisma.TripStopInclude<ExtArgs> | null;
    where?: Prisma.TripStopWhereInput;
    orderBy?: Prisma.TripStopOrderByWithRelationInput | Prisma.TripStopOrderByWithRelationInput[];
    cursor?: Prisma.TripStopWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TripStopScalarFieldEnum | Prisma.TripStopScalarFieldEnum[];
};
export type TripStopFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripStopSelect<ExtArgs> | null;
    omit?: Prisma.TripStopOmit<ExtArgs> | null;
    include?: Prisma.TripStopInclude<ExtArgs> | null;
    where?: Prisma.TripStopWhereInput;
    orderBy?: Prisma.TripStopOrderByWithRelationInput | Prisma.TripStopOrderByWithRelationInput[];
    cursor?: Prisma.TripStopWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TripStopScalarFieldEnum | Prisma.TripStopScalarFieldEnum[];
};
export type TripStopFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripStopSelect<ExtArgs> | null;
    omit?: Prisma.TripStopOmit<ExtArgs> | null;
    include?: Prisma.TripStopInclude<ExtArgs> | null;
    where?: Prisma.TripStopWhereInput;
    orderBy?: Prisma.TripStopOrderByWithRelationInput | Prisma.TripStopOrderByWithRelationInput[];
    cursor?: Prisma.TripStopWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TripStopScalarFieldEnum | Prisma.TripStopScalarFieldEnum[];
};
export type TripStopCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripStopSelect<ExtArgs> | null;
    omit?: Prisma.TripStopOmit<ExtArgs> | null;
    include?: Prisma.TripStopInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TripStopCreateInput, Prisma.TripStopUncheckedCreateInput>;
};
export type TripStopCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.TripStopCreateManyInput | Prisma.TripStopCreateManyInput[];
    skipDuplicates?: boolean;
};
export type TripStopCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripStopSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.TripStopOmit<ExtArgs> | null;
    data: Prisma.TripStopCreateManyInput | Prisma.TripStopCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.TripStopIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type TripStopUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripStopSelect<ExtArgs> | null;
    omit?: Prisma.TripStopOmit<ExtArgs> | null;
    include?: Prisma.TripStopInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TripStopUpdateInput, Prisma.TripStopUncheckedUpdateInput>;
    where: Prisma.TripStopWhereUniqueInput;
};
export type TripStopUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.TripStopUpdateManyMutationInput, Prisma.TripStopUncheckedUpdateManyInput>;
    where?: Prisma.TripStopWhereInput;
    limit?: number;
};
export type TripStopUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripStopSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.TripStopOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TripStopUpdateManyMutationInput, Prisma.TripStopUncheckedUpdateManyInput>;
    where?: Prisma.TripStopWhereInput;
    limit?: number;
    include?: Prisma.TripStopIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type TripStopUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripStopSelect<ExtArgs> | null;
    omit?: Prisma.TripStopOmit<ExtArgs> | null;
    include?: Prisma.TripStopInclude<ExtArgs> | null;
    where: Prisma.TripStopWhereUniqueInput;
    create: Prisma.XOR<Prisma.TripStopCreateInput, Prisma.TripStopUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.TripStopUpdateInput, Prisma.TripStopUncheckedUpdateInput>;
};
export type TripStopDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripStopSelect<ExtArgs> | null;
    omit?: Prisma.TripStopOmit<ExtArgs> | null;
    include?: Prisma.TripStopInclude<ExtArgs> | null;
    where: Prisma.TripStopWhereUniqueInput;
};
export type TripStopDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TripStopWhereInput;
    limit?: number;
};
export type TripStopDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripStopSelect<ExtArgs> | null;
    omit?: Prisma.TripStopOmit<ExtArgs> | null;
    include?: Prisma.TripStopInclude<ExtArgs> | null;
};
