import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums.js";
import type * as Prisma from "../internal/prismaNamespace.js";
export type TripSeatModel = runtime.Types.Result.DefaultSelection<Prisma.$TripSeatPayload>;
export type AggregateTripSeat = {
    _count: TripSeatCountAggregateOutputType | null;
    _avg: TripSeatAvgAggregateOutputType | null;
    _sum: TripSeatSumAggregateOutputType | null;
    _min: TripSeatMinAggregateOutputType | null;
    _max: TripSeatMaxAggregateOutputType | null;
};
export type TripSeatAvgAggregateOutputType = {
    seatNumber: number | null;
};
export type TripSeatSumAggregateOutputType = {
    seatNumber: number | null;
};
export type TripSeatMinAggregateOutputType = {
    id: string | null;
    tripId: string | null;
    seatNumber: number | null;
    seatType: $Enums.SeatType | null;
    wasAvailable: boolean | null;
    createdAt: Date | null;
};
export type TripSeatMaxAggregateOutputType = {
    id: string | null;
    tripId: string | null;
    seatNumber: number | null;
    seatType: $Enums.SeatType | null;
    wasAvailable: boolean | null;
    createdAt: Date | null;
};
export type TripSeatCountAggregateOutputType = {
    id: number;
    tripId: number;
    seatNumber: number;
    seatType: number;
    wasAvailable: number;
    createdAt: number;
    _all: number;
};
export type TripSeatAvgAggregateInputType = {
    seatNumber?: true;
};
export type TripSeatSumAggregateInputType = {
    seatNumber?: true;
};
export type TripSeatMinAggregateInputType = {
    id?: true;
    tripId?: true;
    seatNumber?: true;
    seatType?: true;
    wasAvailable?: true;
    createdAt?: true;
};
export type TripSeatMaxAggregateInputType = {
    id?: true;
    tripId?: true;
    seatNumber?: true;
    seatType?: true;
    wasAvailable?: true;
    createdAt?: true;
};
export type TripSeatCountAggregateInputType = {
    id?: true;
    tripId?: true;
    seatNumber?: true;
    seatType?: true;
    wasAvailable?: true;
    createdAt?: true;
    _all?: true;
};
export type TripSeatAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TripSeatWhereInput;
    orderBy?: Prisma.TripSeatOrderByWithRelationInput | Prisma.TripSeatOrderByWithRelationInput[];
    cursor?: Prisma.TripSeatWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | TripSeatCountAggregateInputType;
    _avg?: TripSeatAvgAggregateInputType;
    _sum?: TripSeatSumAggregateInputType;
    _min?: TripSeatMinAggregateInputType;
    _max?: TripSeatMaxAggregateInputType;
};
export type GetTripSeatAggregateType<T extends TripSeatAggregateArgs> = {
    [P in keyof T & keyof AggregateTripSeat]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateTripSeat[P]> : Prisma.GetScalarType<T[P], AggregateTripSeat[P]>;
};
export type TripSeatGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TripSeatWhereInput;
    orderBy?: Prisma.TripSeatOrderByWithAggregationInput | Prisma.TripSeatOrderByWithAggregationInput[];
    by: Prisma.TripSeatScalarFieldEnum[] | Prisma.TripSeatScalarFieldEnum;
    having?: Prisma.TripSeatScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: TripSeatCountAggregateInputType | true;
    _avg?: TripSeatAvgAggregateInputType;
    _sum?: TripSeatSumAggregateInputType;
    _min?: TripSeatMinAggregateInputType;
    _max?: TripSeatMaxAggregateInputType;
};
export type TripSeatGroupByOutputType = {
    id: string;
    tripId: string;
    seatNumber: number;
    seatType: $Enums.SeatType;
    wasAvailable: boolean;
    createdAt: Date;
    _count: TripSeatCountAggregateOutputType | null;
    _avg: TripSeatAvgAggregateOutputType | null;
    _sum: TripSeatSumAggregateOutputType | null;
    _min: TripSeatMinAggregateOutputType | null;
    _max: TripSeatMaxAggregateOutputType | null;
};
export type GetTripSeatGroupByPayload<T extends TripSeatGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<TripSeatGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof TripSeatGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], TripSeatGroupByOutputType[P]> : Prisma.GetScalarType<T[P], TripSeatGroupByOutputType[P]>;
}>>;
export type TripSeatWhereInput = {
    AND?: Prisma.TripSeatWhereInput | Prisma.TripSeatWhereInput[];
    OR?: Prisma.TripSeatWhereInput[];
    NOT?: Prisma.TripSeatWhereInput | Prisma.TripSeatWhereInput[];
    id?: Prisma.UuidFilter<"TripSeat"> | string;
    tripId?: Prisma.UuidFilter<"TripSeat"> | string;
    seatNumber?: Prisma.IntFilter<"TripSeat"> | number;
    seatType?: Prisma.EnumSeatTypeFilter<"TripSeat"> | $Enums.SeatType;
    wasAvailable?: Prisma.BoolFilter<"TripSeat"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"TripSeat"> | Date | string;
    trip?: Prisma.XOR<Prisma.TripScalarRelationFilter, Prisma.TripWhereInput>;
};
export type TripSeatOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    tripId?: Prisma.SortOrder;
    seatNumber?: Prisma.SortOrder;
    seatType?: Prisma.SortOrder;
    wasAvailable?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    trip?: Prisma.TripOrderByWithRelationInput;
};
export type TripSeatWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    tripId_seatNumber?: Prisma.TripSeatTripIdSeatNumberCompoundUniqueInput;
    AND?: Prisma.TripSeatWhereInput | Prisma.TripSeatWhereInput[];
    OR?: Prisma.TripSeatWhereInput[];
    NOT?: Prisma.TripSeatWhereInput | Prisma.TripSeatWhereInput[];
    tripId?: Prisma.UuidFilter<"TripSeat"> | string;
    seatNumber?: Prisma.IntFilter<"TripSeat"> | number;
    seatType?: Prisma.EnumSeatTypeFilter<"TripSeat"> | $Enums.SeatType;
    wasAvailable?: Prisma.BoolFilter<"TripSeat"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"TripSeat"> | Date | string;
    trip?: Prisma.XOR<Prisma.TripScalarRelationFilter, Prisma.TripWhereInput>;
}, "id" | "tripId_seatNumber">;
export type TripSeatOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    tripId?: Prisma.SortOrder;
    seatNumber?: Prisma.SortOrder;
    seatType?: Prisma.SortOrder;
    wasAvailable?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.TripSeatCountOrderByAggregateInput;
    _avg?: Prisma.TripSeatAvgOrderByAggregateInput;
    _max?: Prisma.TripSeatMaxOrderByAggregateInput;
    _min?: Prisma.TripSeatMinOrderByAggregateInput;
    _sum?: Prisma.TripSeatSumOrderByAggregateInput;
};
export type TripSeatScalarWhereWithAggregatesInput = {
    AND?: Prisma.TripSeatScalarWhereWithAggregatesInput | Prisma.TripSeatScalarWhereWithAggregatesInput[];
    OR?: Prisma.TripSeatScalarWhereWithAggregatesInput[];
    NOT?: Prisma.TripSeatScalarWhereWithAggregatesInput | Prisma.TripSeatScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"TripSeat"> | string;
    tripId?: Prisma.UuidWithAggregatesFilter<"TripSeat"> | string;
    seatNumber?: Prisma.IntWithAggregatesFilter<"TripSeat"> | number;
    seatType?: Prisma.EnumSeatTypeWithAggregatesFilter<"TripSeat"> | $Enums.SeatType;
    wasAvailable?: Prisma.BoolWithAggregatesFilter<"TripSeat"> | boolean;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"TripSeat"> | Date | string;
};
export type TripSeatCreateInput = {
    id?: string;
    seatNumber: number;
    seatType: $Enums.SeatType;
    wasAvailable?: boolean;
    createdAt?: Date | string;
    trip: Prisma.TripCreateNestedOneWithoutSeatsInput;
};
export type TripSeatUncheckedCreateInput = {
    id?: string;
    tripId: string;
    seatNumber: number;
    seatType: $Enums.SeatType;
    wasAvailable?: boolean;
    createdAt?: Date | string;
};
export type TripSeatUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    seatNumber?: Prisma.IntFieldUpdateOperationsInput | number;
    seatType?: Prisma.EnumSeatTypeFieldUpdateOperationsInput | $Enums.SeatType;
    wasAvailable?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    trip?: Prisma.TripUpdateOneRequiredWithoutSeatsNestedInput;
};
export type TripSeatUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    tripId?: Prisma.StringFieldUpdateOperationsInput | string;
    seatNumber?: Prisma.IntFieldUpdateOperationsInput | number;
    seatType?: Prisma.EnumSeatTypeFieldUpdateOperationsInput | $Enums.SeatType;
    wasAvailable?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TripSeatCreateManyInput = {
    id?: string;
    tripId: string;
    seatNumber: number;
    seatType: $Enums.SeatType;
    wasAvailable?: boolean;
    createdAt?: Date | string;
};
export type TripSeatUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    seatNumber?: Prisma.IntFieldUpdateOperationsInput | number;
    seatType?: Prisma.EnumSeatTypeFieldUpdateOperationsInput | $Enums.SeatType;
    wasAvailable?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TripSeatUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    tripId?: Prisma.StringFieldUpdateOperationsInput | string;
    seatNumber?: Prisma.IntFieldUpdateOperationsInput | number;
    seatType?: Prisma.EnumSeatTypeFieldUpdateOperationsInput | $Enums.SeatType;
    wasAvailable?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TripSeatListRelationFilter = {
    every?: Prisma.TripSeatWhereInput;
    some?: Prisma.TripSeatWhereInput;
    none?: Prisma.TripSeatWhereInput;
};
export type TripSeatOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type TripSeatTripIdSeatNumberCompoundUniqueInput = {
    tripId: string;
    seatNumber: number;
};
export type TripSeatCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    tripId?: Prisma.SortOrder;
    seatNumber?: Prisma.SortOrder;
    seatType?: Prisma.SortOrder;
    wasAvailable?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type TripSeatAvgOrderByAggregateInput = {
    seatNumber?: Prisma.SortOrder;
};
export type TripSeatMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    tripId?: Prisma.SortOrder;
    seatNumber?: Prisma.SortOrder;
    seatType?: Prisma.SortOrder;
    wasAvailable?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type TripSeatMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    tripId?: Prisma.SortOrder;
    seatNumber?: Prisma.SortOrder;
    seatType?: Prisma.SortOrder;
    wasAvailable?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type TripSeatSumOrderByAggregateInput = {
    seatNumber?: Prisma.SortOrder;
};
export type TripSeatCreateNestedManyWithoutTripInput = {
    create?: Prisma.XOR<Prisma.TripSeatCreateWithoutTripInput, Prisma.TripSeatUncheckedCreateWithoutTripInput> | Prisma.TripSeatCreateWithoutTripInput[] | Prisma.TripSeatUncheckedCreateWithoutTripInput[];
    connectOrCreate?: Prisma.TripSeatCreateOrConnectWithoutTripInput | Prisma.TripSeatCreateOrConnectWithoutTripInput[];
    createMany?: Prisma.TripSeatCreateManyTripInputEnvelope;
    connect?: Prisma.TripSeatWhereUniqueInput | Prisma.TripSeatWhereUniqueInput[];
};
export type TripSeatUncheckedCreateNestedManyWithoutTripInput = {
    create?: Prisma.XOR<Prisma.TripSeatCreateWithoutTripInput, Prisma.TripSeatUncheckedCreateWithoutTripInput> | Prisma.TripSeatCreateWithoutTripInput[] | Prisma.TripSeatUncheckedCreateWithoutTripInput[];
    connectOrCreate?: Prisma.TripSeatCreateOrConnectWithoutTripInput | Prisma.TripSeatCreateOrConnectWithoutTripInput[];
    createMany?: Prisma.TripSeatCreateManyTripInputEnvelope;
    connect?: Prisma.TripSeatWhereUniqueInput | Prisma.TripSeatWhereUniqueInput[];
};
export type TripSeatUpdateManyWithoutTripNestedInput = {
    create?: Prisma.XOR<Prisma.TripSeatCreateWithoutTripInput, Prisma.TripSeatUncheckedCreateWithoutTripInput> | Prisma.TripSeatCreateWithoutTripInput[] | Prisma.TripSeatUncheckedCreateWithoutTripInput[];
    connectOrCreate?: Prisma.TripSeatCreateOrConnectWithoutTripInput | Prisma.TripSeatCreateOrConnectWithoutTripInput[];
    upsert?: Prisma.TripSeatUpsertWithWhereUniqueWithoutTripInput | Prisma.TripSeatUpsertWithWhereUniqueWithoutTripInput[];
    createMany?: Prisma.TripSeatCreateManyTripInputEnvelope;
    set?: Prisma.TripSeatWhereUniqueInput | Prisma.TripSeatWhereUniqueInput[];
    disconnect?: Prisma.TripSeatWhereUniqueInput | Prisma.TripSeatWhereUniqueInput[];
    delete?: Prisma.TripSeatWhereUniqueInput | Prisma.TripSeatWhereUniqueInput[];
    connect?: Prisma.TripSeatWhereUniqueInput | Prisma.TripSeatWhereUniqueInput[];
    update?: Prisma.TripSeatUpdateWithWhereUniqueWithoutTripInput | Prisma.TripSeatUpdateWithWhereUniqueWithoutTripInput[];
    updateMany?: Prisma.TripSeatUpdateManyWithWhereWithoutTripInput | Prisma.TripSeatUpdateManyWithWhereWithoutTripInput[];
    deleteMany?: Prisma.TripSeatScalarWhereInput | Prisma.TripSeatScalarWhereInput[];
};
export type TripSeatUncheckedUpdateManyWithoutTripNestedInput = {
    create?: Prisma.XOR<Prisma.TripSeatCreateWithoutTripInput, Prisma.TripSeatUncheckedCreateWithoutTripInput> | Prisma.TripSeatCreateWithoutTripInput[] | Prisma.TripSeatUncheckedCreateWithoutTripInput[];
    connectOrCreate?: Prisma.TripSeatCreateOrConnectWithoutTripInput | Prisma.TripSeatCreateOrConnectWithoutTripInput[];
    upsert?: Prisma.TripSeatUpsertWithWhereUniqueWithoutTripInput | Prisma.TripSeatUpsertWithWhereUniqueWithoutTripInput[];
    createMany?: Prisma.TripSeatCreateManyTripInputEnvelope;
    set?: Prisma.TripSeatWhereUniqueInput | Prisma.TripSeatWhereUniqueInput[];
    disconnect?: Prisma.TripSeatWhereUniqueInput | Prisma.TripSeatWhereUniqueInput[];
    delete?: Prisma.TripSeatWhereUniqueInput | Prisma.TripSeatWhereUniqueInput[];
    connect?: Prisma.TripSeatWhereUniqueInput | Prisma.TripSeatWhereUniqueInput[];
    update?: Prisma.TripSeatUpdateWithWhereUniqueWithoutTripInput | Prisma.TripSeatUpdateWithWhereUniqueWithoutTripInput[];
    updateMany?: Prisma.TripSeatUpdateManyWithWhereWithoutTripInput | Prisma.TripSeatUpdateManyWithWhereWithoutTripInput[];
    deleteMany?: Prisma.TripSeatScalarWhereInput | Prisma.TripSeatScalarWhereInput[];
};
export type EnumSeatTypeFieldUpdateOperationsInput = {
    set?: $Enums.SeatType;
};
export type TripSeatCreateWithoutTripInput = {
    id?: string;
    seatNumber: number;
    seatType: $Enums.SeatType;
    wasAvailable?: boolean;
    createdAt?: Date | string;
};
export type TripSeatUncheckedCreateWithoutTripInput = {
    id?: string;
    seatNumber: number;
    seatType: $Enums.SeatType;
    wasAvailable?: boolean;
    createdAt?: Date | string;
};
export type TripSeatCreateOrConnectWithoutTripInput = {
    where: Prisma.TripSeatWhereUniqueInput;
    create: Prisma.XOR<Prisma.TripSeatCreateWithoutTripInput, Prisma.TripSeatUncheckedCreateWithoutTripInput>;
};
export type TripSeatCreateManyTripInputEnvelope = {
    data: Prisma.TripSeatCreateManyTripInput | Prisma.TripSeatCreateManyTripInput[];
    skipDuplicates?: boolean;
};
export type TripSeatUpsertWithWhereUniqueWithoutTripInput = {
    where: Prisma.TripSeatWhereUniqueInput;
    update: Prisma.XOR<Prisma.TripSeatUpdateWithoutTripInput, Prisma.TripSeatUncheckedUpdateWithoutTripInput>;
    create: Prisma.XOR<Prisma.TripSeatCreateWithoutTripInput, Prisma.TripSeatUncheckedCreateWithoutTripInput>;
};
export type TripSeatUpdateWithWhereUniqueWithoutTripInput = {
    where: Prisma.TripSeatWhereUniqueInput;
    data: Prisma.XOR<Prisma.TripSeatUpdateWithoutTripInput, Prisma.TripSeatUncheckedUpdateWithoutTripInput>;
};
export type TripSeatUpdateManyWithWhereWithoutTripInput = {
    where: Prisma.TripSeatScalarWhereInput;
    data: Prisma.XOR<Prisma.TripSeatUpdateManyMutationInput, Prisma.TripSeatUncheckedUpdateManyWithoutTripInput>;
};
export type TripSeatScalarWhereInput = {
    AND?: Prisma.TripSeatScalarWhereInput | Prisma.TripSeatScalarWhereInput[];
    OR?: Prisma.TripSeatScalarWhereInput[];
    NOT?: Prisma.TripSeatScalarWhereInput | Prisma.TripSeatScalarWhereInput[];
    id?: Prisma.UuidFilter<"TripSeat"> | string;
    tripId?: Prisma.UuidFilter<"TripSeat"> | string;
    seatNumber?: Prisma.IntFilter<"TripSeat"> | number;
    seatType?: Prisma.EnumSeatTypeFilter<"TripSeat"> | $Enums.SeatType;
    wasAvailable?: Prisma.BoolFilter<"TripSeat"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"TripSeat"> | Date | string;
};
export type TripSeatCreateManyTripInput = {
    id?: string;
    seatNumber: number;
    seatType: $Enums.SeatType;
    wasAvailable?: boolean;
    createdAt?: Date | string;
};
export type TripSeatUpdateWithoutTripInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    seatNumber?: Prisma.IntFieldUpdateOperationsInput | number;
    seatType?: Prisma.EnumSeatTypeFieldUpdateOperationsInput | $Enums.SeatType;
    wasAvailable?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TripSeatUncheckedUpdateWithoutTripInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    seatNumber?: Prisma.IntFieldUpdateOperationsInput | number;
    seatType?: Prisma.EnumSeatTypeFieldUpdateOperationsInput | $Enums.SeatType;
    wasAvailable?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TripSeatUncheckedUpdateManyWithoutTripInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    seatNumber?: Prisma.IntFieldUpdateOperationsInput | number;
    seatType?: Prisma.EnumSeatTypeFieldUpdateOperationsInput | $Enums.SeatType;
    wasAvailable?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type TripSeatSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    tripId?: boolean;
    seatNumber?: boolean;
    seatType?: boolean;
    wasAvailable?: boolean;
    createdAt?: boolean;
    trip?: boolean | Prisma.TripDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["tripSeat"]>;
export type TripSeatSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    tripId?: boolean;
    seatNumber?: boolean;
    seatType?: boolean;
    wasAvailable?: boolean;
    createdAt?: boolean;
    trip?: boolean | Prisma.TripDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["tripSeat"]>;
export type TripSeatSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    tripId?: boolean;
    seatNumber?: boolean;
    seatType?: boolean;
    wasAvailable?: boolean;
    createdAt?: boolean;
    trip?: boolean | Prisma.TripDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["tripSeat"]>;
export type TripSeatSelectScalar = {
    id?: boolean;
    tripId?: boolean;
    seatNumber?: boolean;
    seatType?: boolean;
    wasAvailable?: boolean;
    createdAt?: boolean;
};
export type TripSeatOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "tripId" | "seatNumber" | "seatType" | "wasAvailable" | "createdAt", ExtArgs["result"]["tripSeat"]>;
export type TripSeatInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    trip?: boolean | Prisma.TripDefaultArgs<ExtArgs>;
};
export type TripSeatIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    trip?: boolean | Prisma.TripDefaultArgs<ExtArgs>;
};
export type TripSeatIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    trip?: boolean | Prisma.TripDefaultArgs<ExtArgs>;
};
export type $TripSeatPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "TripSeat";
    objects: {
        trip: Prisma.$TripPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        tripId: string;
        seatNumber: number;
        seatType: $Enums.SeatType;
        wasAvailable: boolean;
        createdAt: Date;
    }, ExtArgs["result"]["tripSeat"]>;
    composites: {};
};
export type TripSeatGetPayload<S extends boolean | null | undefined | TripSeatDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$TripSeatPayload, S>;
export type TripSeatCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<TripSeatFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: TripSeatCountAggregateInputType | true;
};
export interface TripSeatDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['TripSeat'];
        meta: {
            name: 'TripSeat';
        };
    };
    findUnique<T extends TripSeatFindUniqueArgs>(args: Prisma.SelectSubset<T, TripSeatFindUniqueArgs<ExtArgs>>): Prisma.Prisma__TripSeatClient<runtime.Types.Result.GetResult<Prisma.$TripSeatPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends TripSeatFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, TripSeatFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__TripSeatClient<runtime.Types.Result.GetResult<Prisma.$TripSeatPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends TripSeatFindFirstArgs>(args?: Prisma.SelectSubset<T, TripSeatFindFirstArgs<ExtArgs>>): Prisma.Prisma__TripSeatClient<runtime.Types.Result.GetResult<Prisma.$TripSeatPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends TripSeatFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, TripSeatFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__TripSeatClient<runtime.Types.Result.GetResult<Prisma.$TripSeatPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends TripSeatFindManyArgs>(args?: Prisma.SelectSubset<T, TripSeatFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TripSeatPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends TripSeatCreateArgs>(args: Prisma.SelectSubset<T, TripSeatCreateArgs<ExtArgs>>): Prisma.Prisma__TripSeatClient<runtime.Types.Result.GetResult<Prisma.$TripSeatPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends TripSeatCreateManyArgs>(args?: Prisma.SelectSubset<T, TripSeatCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends TripSeatCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, TripSeatCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TripSeatPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends TripSeatDeleteArgs>(args: Prisma.SelectSubset<T, TripSeatDeleteArgs<ExtArgs>>): Prisma.Prisma__TripSeatClient<runtime.Types.Result.GetResult<Prisma.$TripSeatPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends TripSeatUpdateArgs>(args: Prisma.SelectSubset<T, TripSeatUpdateArgs<ExtArgs>>): Prisma.Prisma__TripSeatClient<runtime.Types.Result.GetResult<Prisma.$TripSeatPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends TripSeatDeleteManyArgs>(args?: Prisma.SelectSubset<T, TripSeatDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends TripSeatUpdateManyArgs>(args: Prisma.SelectSubset<T, TripSeatUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends TripSeatUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, TripSeatUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TripSeatPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends TripSeatUpsertArgs>(args: Prisma.SelectSubset<T, TripSeatUpsertArgs<ExtArgs>>): Prisma.Prisma__TripSeatClient<runtime.Types.Result.GetResult<Prisma.$TripSeatPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends TripSeatCountArgs>(args?: Prisma.Subset<T, TripSeatCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], TripSeatCountAggregateOutputType> : number>;
    aggregate<T extends TripSeatAggregateArgs>(args: Prisma.Subset<T, TripSeatAggregateArgs>): Prisma.PrismaPromise<GetTripSeatAggregateType<T>>;
    groupBy<T extends TripSeatGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: TripSeatGroupByArgs['orderBy'];
    } : {
        orderBy?: TripSeatGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, TripSeatGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTripSeatGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: TripSeatFieldRefs;
}
export interface Prisma__TripSeatClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    trip<T extends Prisma.TripDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.TripDefaultArgs<ExtArgs>>): Prisma.Prisma__TripClient<runtime.Types.Result.GetResult<Prisma.$TripPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface TripSeatFieldRefs {
    readonly id: Prisma.FieldRef<"TripSeat", 'String'>;
    readonly tripId: Prisma.FieldRef<"TripSeat", 'String'>;
    readonly seatNumber: Prisma.FieldRef<"TripSeat", 'Int'>;
    readonly seatType: Prisma.FieldRef<"TripSeat", 'SeatType'>;
    readonly wasAvailable: Prisma.FieldRef<"TripSeat", 'Boolean'>;
    readonly createdAt: Prisma.FieldRef<"TripSeat", 'DateTime'>;
}
export type TripSeatFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripSeatSelect<ExtArgs> | null;
    omit?: Prisma.TripSeatOmit<ExtArgs> | null;
    include?: Prisma.TripSeatInclude<ExtArgs> | null;
    where: Prisma.TripSeatWhereUniqueInput;
};
export type TripSeatFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripSeatSelect<ExtArgs> | null;
    omit?: Prisma.TripSeatOmit<ExtArgs> | null;
    include?: Prisma.TripSeatInclude<ExtArgs> | null;
    where: Prisma.TripSeatWhereUniqueInput;
};
export type TripSeatFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripSeatSelect<ExtArgs> | null;
    omit?: Prisma.TripSeatOmit<ExtArgs> | null;
    include?: Prisma.TripSeatInclude<ExtArgs> | null;
    where?: Prisma.TripSeatWhereInput;
    orderBy?: Prisma.TripSeatOrderByWithRelationInput | Prisma.TripSeatOrderByWithRelationInput[];
    cursor?: Prisma.TripSeatWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TripSeatScalarFieldEnum | Prisma.TripSeatScalarFieldEnum[];
};
export type TripSeatFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripSeatSelect<ExtArgs> | null;
    omit?: Prisma.TripSeatOmit<ExtArgs> | null;
    include?: Prisma.TripSeatInclude<ExtArgs> | null;
    where?: Prisma.TripSeatWhereInput;
    orderBy?: Prisma.TripSeatOrderByWithRelationInput | Prisma.TripSeatOrderByWithRelationInput[];
    cursor?: Prisma.TripSeatWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TripSeatScalarFieldEnum | Prisma.TripSeatScalarFieldEnum[];
};
export type TripSeatFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripSeatSelect<ExtArgs> | null;
    omit?: Prisma.TripSeatOmit<ExtArgs> | null;
    include?: Prisma.TripSeatInclude<ExtArgs> | null;
    where?: Prisma.TripSeatWhereInput;
    orderBy?: Prisma.TripSeatOrderByWithRelationInput | Prisma.TripSeatOrderByWithRelationInput[];
    cursor?: Prisma.TripSeatWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TripSeatScalarFieldEnum | Prisma.TripSeatScalarFieldEnum[];
};
export type TripSeatCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripSeatSelect<ExtArgs> | null;
    omit?: Prisma.TripSeatOmit<ExtArgs> | null;
    include?: Prisma.TripSeatInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TripSeatCreateInput, Prisma.TripSeatUncheckedCreateInput>;
};
export type TripSeatCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.TripSeatCreateManyInput | Prisma.TripSeatCreateManyInput[];
    skipDuplicates?: boolean;
};
export type TripSeatCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripSeatSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.TripSeatOmit<ExtArgs> | null;
    data: Prisma.TripSeatCreateManyInput | Prisma.TripSeatCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.TripSeatIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type TripSeatUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripSeatSelect<ExtArgs> | null;
    omit?: Prisma.TripSeatOmit<ExtArgs> | null;
    include?: Prisma.TripSeatInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TripSeatUpdateInput, Prisma.TripSeatUncheckedUpdateInput>;
    where: Prisma.TripSeatWhereUniqueInput;
};
export type TripSeatUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.TripSeatUpdateManyMutationInput, Prisma.TripSeatUncheckedUpdateManyInput>;
    where?: Prisma.TripSeatWhereInput;
    limit?: number;
};
export type TripSeatUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripSeatSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.TripSeatOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TripSeatUpdateManyMutationInput, Prisma.TripSeatUncheckedUpdateManyInput>;
    where?: Prisma.TripSeatWhereInput;
    limit?: number;
    include?: Prisma.TripSeatIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type TripSeatUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripSeatSelect<ExtArgs> | null;
    omit?: Prisma.TripSeatOmit<ExtArgs> | null;
    include?: Prisma.TripSeatInclude<ExtArgs> | null;
    where: Prisma.TripSeatWhereUniqueInput;
    create: Prisma.XOR<Prisma.TripSeatCreateInput, Prisma.TripSeatUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.TripSeatUpdateInput, Prisma.TripSeatUncheckedUpdateInput>;
};
export type TripSeatDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripSeatSelect<ExtArgs> | null;
    omit?: Prisma.TripSeatOmit<ExtArgs> | null;
    include?: Prisma.TripSeatInclude<ExtArgs> | null;
    where: Prisma.TripSeatWhereUniqueInput;
};
export type TripSeatDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TripSeatWhereInput;
    limit?: number;
};
export type TripSeatDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripSeatSelect<ExtArgs> | null;
    omit?: Prisma.TripSeatOmit<ExtArgs> | null;
    include?: Prisma.TripSeatInclude<ExtArgs> | null;
};
