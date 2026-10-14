import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type DelayEventModel = runtime.Types.Result.DefaultSelection<Prisma.$DelayEventPayload>;
export type AggregateDelayEvent = {
    _count: DelayEventCountAggregateOutputType | null;
    _avg: DelayEventAvgAggregateOutputType | null;
    _sum: DelayEventSumAggregateOutputType | null;
    _min: DelayEventMinAggregateOutputType | null;
    _max: DelayEventMaxAggregateOutputType | null;
};
export type DelayEventAvgAggregateOutputType = {
    delayMinutes: number | null;
};
export type DelayEventSumAggregateOutputType = {
    delayMinutes: number | null;
};
export type DelayEventMinAggregateOutputType = {
    id: string | null;
    bookingId: string | null;
    party: string | null;
    delayMinutes: number | null;
    reason: string | null;
    reportedBy: string | null;
    createdAt: Date | null;
};
export type DelayEventMaxAggregateOutputType = {
    id: string | null;
    bookingId: string | null;
    party: string | null;
    delayMinutes: number | null;
    reason: string | null;
    reportedBy: string | null;
    createdAt: Date | null;
};
export type DelayEventCountAggregateOutputType = {
    id: number;
    bookingId: number;
    party: number;
    delayMinutes: number;
    reason: number;
    reportedBy: number;
    createdAt: number;
    _all: number;
};
export type DelayEventAvgAggregateInputType = {
    delayMinutes?: true;
};
export type DelayEventSumAggregateInputType = {
    delayMinutes?: true;
};
export type DelayEventMinAggregateInputType = {
    id?: true;
    bookingId?: true;
    party?: true;
    delayMinutes?: true;
    reason?: true;
    reportedBy?: true;
    createdAt?: true;
};
export type DelayEventMaxAggregateInputType = {
    id?: true;
    bookingId?: true;
    party?: true;
    delayMinutes?: true;
    reason?: true;
    reportedBy?: true;
    createdAt?: true;
};
export type DelayEventCountAggregateInputType = {
    id?: true;
    bookingId?: true;
    party?: true;
    delayMinutes?: true;
    reason?: true;
    reportedBy?: true;
    createdAt?: true;
    _all?: true;
};
export type DelayEventAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DelayEventWhereInput;
    orderBy?: Prisma.DelayEventOrderByWithRelationInput | Prisma.DelayEventOrderByWithRelationInput[];
    cursor?: Prisma.DelayEventWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | DelayEventCountAggregateInputType;
    _avg?: DelayEventAvgAggregateInputType;
    _sum?: DelayEventSumAggregateInputType;
    _min?: DelayEventMinAggregateInputType;
    _max?: DelayEventMaxAggregateInputType;
};
export type GetDelayEventAggregateType<T extends DelayEventAggregateArgs> = {
    [P in keyof T & keyof AggregateDelayEvent]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateDelayEvent[P]> : Prisma.GetScalarType<T[P], AggregateDelayEvent[P]>;
};
export type DelayEventGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DelayEventWhereInput;
    orderBy?: Prisma.DelayEventOrderByWithAggregationInput | Prisma.DelayEventOrderByWithAggregationInput[];
    by: Prisma.DelayEventScalarFieldEnum[] | Prisma.DelayEventScalarFieldEnum;
    having?: Prisma.DelayEventScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: DelayEventCountAggregateInputType | true;
    _avg?: DelayEventAvgAggregateInputType;
    _sum?: DelayEventSumAggregateInputType;
    _min?: DelayEventMinAggregateInputType;
    _max?: DelayEventMaxAggregateInputType;
};
export type DelayEventGroupByOutputType = {
    id: string;
    bookingId: string;
    party: string;
    delayMinutes: number;
    reason: string | null;
    reportedBy: string;
    createdAt: Date;
    _count: DelayEventCountAggregateOutputType | null;
    _avg: DelayEventAvgAggregateOutputType | null;
    _sum: DelayEventSumAggregateOutputType | null;
    _min: DelayEventMinAggregateOutputType | null;
    _max: DelayEventMaxAggregateOutputType | null;
};
export type GetDelayEventGroupByPayload<T extends DelayEventGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<DelayEventGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof DelayEventGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], DelayEventGroupByOutputType[P]> : Prisma.GetScalarType<T[P], DelayEventGroupByOutputType[P]>;
}>>;
export type DelayEventWhereInput = {
    AND?: Prisma.DelayEventWhereInput | Prisma.DelayEventWhereInput[];
    OR?: Prisma.DelayEventWhereInput[];
    NOT?: Prisma.DelayEventWhereInput | Prisma.DelayEventWhereInput[];
    id?: Prisma.UuidFilter<"DelayEvent"> | string;
    bookingId?: Prisma.UuidFilter<"DelayEvent"> | string;
    party?: Prisma.StringFilter<"DelayEvent"> | string;
    delayMinutes?: Prisma.IntFilter<"DelayEvent"> | number;
    reason?: Prisma.StringNullableFilter<"DelayEvent"> | string | null;
    reportedBy?: Prisma.UuidFilter<"DelayEvent"> | string;
    createdAt?: Prisma.DateTimeFilter<"DelayEvent"> | Date | string;
    booking?: Prisma.XOR<Prisma.BookingScalarRelationFilter, Prisma.BookingWhereInput>;
};
export type DelayEventOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    bookingId?: Prisma.SortOrder;
    party?: Prisma.SortOrder;
    delayMinutes?: Prisma.SortOrder;
    reason?: Prisma.SortOrderInput | Prisma.SortOrder;
    reportedBy?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    booking?: Prisma.BookingOrderByWithRelationInput;
};
export type DelayEventWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.DelayEventWhereInput | Prisma.DelayEventWhereInput[];
    OR?: Prisma.DelayEventWhereInput[];
    NOT?: Prisma.DelayEventWhereInput | Prisma.DelayEventWhereInput[];
    bookingId?: Prisma.UuidFilter<"DelayEvent"> | string;
    party?: Prisma.StringFilter<"DelayEvent"> | string;
    delayMinutes?: Prisma.IntFilter<"DelayEvent"> | number;
    reason?: Prisma.StringNullableFilter<"DelayEvent"> | string | null;
    reportedBy?: Prisma.UuidFilter<"DelayEvent"> | string;
    createdAt?: Prisma.DateTimeFilter<"DelayEvent"> | Date | string;
    booking?: Prisma.XOR<Prisma.BookingScalarRelationFilter, Prisma.BookingWhereInput>;
}, "id">;
export type DelayEventOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    bookingId?: Prisma.SortOrder;
    party?: Prisma.SortOrder;
    delayMinutes?: Prisma.SortOrder;
    reason?: Prisma.SortOrderInput | Prisma.SortOrder;
    reportedBy?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.DelayEventCountOrderByAggregateInput;
    _avg?: Prisma.DelayEventAvgOrderByAggregateInput;
    _max?: Prisma.DelayEventMaxOrderByAggregateInput;
    _min?: Prisma.DelayEventMinOrderByAggregateInput;
    _sum?: Prisma.DelayEventSumOrderByAggregateInput;
};
export type DelayEventScalarWhereWithAggregatesInput = {
    AND?: Prisma.DelayEventScalarWhereWithAggregatesInput | Prisma.DelayEventScalarWhereWithAggregatesInput[];
    OR?: Prisma.DelayEventScalarWhereWithAggregatesInput[];
    NOT?: Prisma.DelayEventScalarWhereWithAggregatesInput | Prisma.DelayEventScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"DelayEvent"> | string;
    bookingId?: Prisma.UuidWithAggregatesFilter<"DelayEvent"> | string;
    party?: Prisma.StringWithAggregatesFilter<"DelayEvent"> | string;
    delayMinutes?: Prisma.IntWithAggregatesFilter<"DelayEvent"> | number;
    reason?: Prisma.StringNullableWithAggregatesFilter<"DelayEvent"> | string | null;
    reportedBy?: Prisma.UuidWithAggregatesFilter<"DelayEvent"> | string;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"DelayEvent"> | Date | string;
};
export type DelayEventCreateInput = {
    id?: string;
    party: string;
    delayMinutes: number;
    reason?: string | null;
    reportedBy: string;
    createdAt?: Date | string;
    booking: Prisma.BookingCreateNestedOneWithoutDelayEventsInput;
};
export type DelayEventUncheckedCreateInput = {
    id?: string;
    bookingId: string;
    party: string;
    delayMinutes: number;
    reason?: string | null;
    reportedBy: string;
    createdAt?: Date | string;
};
export type DelayEventUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    party?: Prisma.StringFieldUpdateOperationsInput | string;
    delayMinutes?: Prisma.IntFieldUpdateOperationsInput | number;
    reason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    reportedBy?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    booking?: Prisma.BookingUpdateOneRequiredWithoutDelayEventsNestedInput;
};
export type DelayEventUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    bookingId?: Prisma.StringFieldUpdateOperationsInput | string;
    party?: Prisma.StringFieldUpdateOperationsInput | string;
    delayMinutes?: Prisma.IntFieldUpdateOperationsInput | number;
    reason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    reportedBy?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DelayEventCreateManyInput = {
    id?: string;
    bookingId: string;
    party: string;
    delayMinutes: number;
    reason?: string | null;
    reportedBy: string;
    createdAt?: Date | string;
};
export type DelayEventUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    party?: Prisma.StringFieldUpdateOperationsInput | string;
    delayMinutes?: Prisma.IntFieldUpdateOperationsInput | number;
    reason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    reportedBy?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DelayEventUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    bookingId?: Prisma.StringFieldUpdateOperationsInput | string;
    party?: Prisma.StringFieldUpdateOperationsInput | string;
    delayMinutes?: Prisma.IntFieldUpdateOperationsInput | number;
    reason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    reportedBy?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DelayEventListRelationFilter = {
    every?: Prisma.DelayEventWhereInput;
    some?: Prisma.DelayEventWhereInput;
    none?: Prisma.DelayEventWhereInput;
};
export type DelayEventOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type DelayEventCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    bookingId?: Prisma.SortOrder;
    party?: Prisma.SortOrder;
    delayMinutes?: Prisma.SortOrder;
    reason?: Prisma.SortOrder;
    reportedBy?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type DelayEventAvgOrderByAggregateInput = {
    delayMinutes?: Prisma.SortOrder;
};
export type DelayEventMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    bookingId?: Prisma.SortOrder;
    party?: Prisma.SortOrder;
    delayMinutes?: Prisma.SortOrder;
    reason?: Prisma.SortOrder;
    reportedBy?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type DelayEventMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    bookingId?: Prisma.SortOrder;
    party?: Prisma.SortOrder;
    delayMinutes?: Prisma.SortOrder;
    reason?: Prisma.SortOrder;
    reportedBy?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type DelayEventSumOrderByAggregateInput = {
    delayMinutes?: Prisma.SortOrder;
};
export type DelayEventCreateNestedManyWithoutBookingInput = {
    create?: Prisma.XOR<Prisma.DelayEventCreateWithoutBookingInput, Prisma.DelayEventUncheckedCreateWithoutBookingInput> | Prisma.DelayEventCreateWithoutBookingInput[] | Prisma.DelayEventUncheckedCreateWithoutBookingInput[];
    connectOrCreate?: Prisma.DelayEventCreateOrConnectWithoutBookingInput | Prisma.DelayEventCreateOrConnectWithoutBookingInput[];
    createMany?: Prisma.DelayEventCreateManyBookingInputEnvelope;
    connect?: Prisma.DelayEventWhereUniqueInput | Prisma.DelayEventWhereUniqueInput[];
};
export type DelayEventUncheckedCreateNestedManyWithoutBookingInput = {
    create?: Prisma.XOR<Prisma.DelayEventCreateWithoutBookingInput, Prisma.DelayEventUncheckedCreateWithoutBookingInput> | Prisma.DelayEventCreateWithoutBookingInput[] | Prisma.DelayEventUncheckedCreateWithoutBookingInput[];
    connectOrCreate?: Prisma.DelayEventCreateOrConnectWithoutBookingInput | Prisma.DelayEventCreateOrConnectWithoutBookingInput[];
    createMany?: Prisma.DelayEventCreateManyBookingInputEnvelope;
    connect?: Prisma.DelayEventWhereUniqueInput | Prisma.DelayEventWhereUniqueInput[];
};
export type DelayEventUpdateManyWithoutBookingNestedInput = {
    create?: Prisma.XOR<Prisma.DelayEventCreateWithoutBookingInput, Prisma.DelayEventUncheckedCreateWithoutBookingInput> | Prisma.DelayEventCreateWithoutBookingInput[] | Prisma.DelayEventUncheckedCreateWithoutBookingInput[];
    connectOrCreate?: Prisma.DelayEventCreateOrConnectWithoutBookingInput | Prisma.DelayEventCreateOrConnectWithoutBookingInput[];
    upsert?: Prisma.DelayEventUpsertWithWhereUniqueWithoutBookingInput | Prisma.DelayEventUpsertWithWhereUniqueWithoutBookingInput[];
    createMany?: Prisma.DelayEventCreateManyBookingInputEnvelope;
    set?: Prisma.DelayEventWhereUniqueInput | Prisma.DelayEventWhereUniqueInput[];
    disconnect?: Prisma.DelayEventWhereUniqueInput | Prisma.DelayEventWhereUniqueInput[];
    delete?: Prisma.DelayEventWhereUniqueInput | Prisma.DelayEventWhereUniqueInput[];
    connect?: Prisma.DelayEventWhereUniqueInput | Prisma.DelayEventWhereUniqueInput[];
    update?: Prisma.DelayEventUpdateWithWhereUniqueWithoutBookingInput | Prisma.DelayEventUpdateWithWhereUniqueWithoutBookingInput[];
    updateMany?: Prisma.DelayEventUpdateManyWithWhereWithoutBookingInput | Prisma.DelayEventUpdateManyWithWhereWithoutBookingInput[];
    deleteMany?: Prisma.DelayEventScalarWhereInput | Prisma.DelayEventScalarWhereInput[];
};
export type DelayEventUncheckedUpdateManyWithoutBookingNestedInput = {
    create?: Prisma.XOR<Prisma.DelayEventCreateWithoutBookingInput, Prisma.DelayEventUncheckedCreateWithoutBookingInput> | Prisma.DelayEventCreateWithoutBookingInput[] | Prisma.DelayEventUncheckedCreateWithoutBookingInput[];
    connectOrCreate?: Prisma.DelayEventCreateOrConnectWithoutBookingInput | Prisma.DelayEventCreateOrConnectWithoutBookingInput[];
    upsert?: Prisma.DelayEventUpsertWithWhereUniqueWithoutBookingInput | Prisma.DelayEventUpsertWithWhereUniqueWithoutBookingInput[];
    createMany?: Prisma.DelayEventCreateManyBookingInputEnvelope;
    set?: Prisma.DelayEventWhereUniqueInput | Prisma.DelayEventWhereUniqueInput[];
    disconnect?: Prisma.DelayEventWhereUniqueInput | Prisma.DelayEventWhereUniqueInput[];
    delete?: Prisma.DelayEventWhereUniqueInput | Prisma.DelayEventWhereUniqueInput[];
    connect?: Prisma.DelayEventWhereUniqueInput | Prisma.DelayEventWhereUniqueInput[];
    update?: Prisma.DelayEventUpdateWithWhereUniqueWithoutBookingInput | Prisma.DelayEventUpdateWithWhereUniqueWithoutBookingInput[];
    updateMany?: Prisma.DelayEventUpdateManyWithWhereWithoutBookingInput | Prisma.DelayEventUpdateManyWithWhereWithoutBookingInput[];
    deleteMany?: Prisma.DelayEventScalarWhereInput | Prisma.DelayEventScalarWhereInput[];
};
export type DelayEventCreateWithoutBookingInput = {
    id?: string;
    party: string;
    delayMinutes: number;
    reason?: string | null;
    reportedBy: string;
    createdAt?: Date | string;
};
export type DelayEventUncheckedCreateWithoutBookingInput = {
    id?: string;
    party: string;
    delayMinutes: number;
    reason?: string | null;
    reportedBy: string;
    createdAt?: Date | string;
};
export type DelayEventCreateOrConnectWithoutBookingInput = {
    where: Prisma.DelayEventWhereUniqueInput;
    create: Prisma.XOR<Prisma.DelayEventCreateWithoutBookingInput, Prisma.DelayEventUncheckedCreateWithoutBookingInput>;
};
export type DelayEventCreateManyBookingInputEnvelope = {
    data: Prisma.DelayEventCreateManyBookingInput | Prisma.DelayEventCreateManyBookingInput[];
    skipDuplicates?: boolean;
};
export type DelayEventUpsertWithWhereUniqueWithoutBookingInput = {
    where: Prisma.DelayEventWhereUniqueInput;
    update: Prisma.XOR<Prisma.DelayEventUpdateWithoutBookingInput, Prisma.DelayEventUncheckedUpdateWithoutBookingInput>;
    create: Prisma.XOR<Prisma.DelayEventCreateWithoutBookingInput, Prisma.DelayEventUncheckedCreateWithoutBookingInput>;
};
export type DelayEventUpdateWithWhereUniqueWithoutBookingInput = {
    where: Prisma.DelayEventWhereUniqueInput;
    data: Prisma.XOR<Prisma.DelayEventUpdateWithoutBookingInput, Prisma.DelayEventUncheckedUpdateWithoutBookingInput>;
};
export type DelayEventUpdateManyWithWhereWithoutBookingInput = {
    where: Prisma.DelayEventScalarWhereInput;
    data: Prisma.XOR<Prisma.DelayEventUpdateManyMutationInput, Prisma.DelayEventUncheckedUpdateManyWithoutBookingInput>;
};
export type DelayEventScalarWhereInput = {
    AND?: Prisma.DelayEventScalarWhereInput | Prisma.DelayEventScalarWhereInput[];
    OR?: Prisma.DelayEventScalarWhereInput[];
    NOT?: Prisma.DelayEventScalarWhereInput | Prisma.DelayEventScalarWhereInput[];
    id?: Prisma.UuidFilter<"DelayEvent"> | string;
    bookingId?: Prisma.UuidFilter<"DelayEvent"> | string;
    party?: Prisma.StringFilter<"DelayEvent"> | string;
    delayMinutes?: Prisma.IntFilter<"DelayEvent"> | number;
    reason?: Prisma.StringNullableFilter<"DelayEvent"> | string | null;
    reportedBy?: Prisma.UuidFilter<"DelayEvent"> | string;
    createdAt?: Prisma.DateTimeFilter<"DelayEvent"> | Date | string;
};
export type DelayEventCreateManyBookingInput = {
    id?: string;
    party: string;
    delayMinutes: number;
    reason?: string | null;
    reportedBy: string;
    createdAt?: Date | string;
};
export type DelayEventUpdateWithoutBookingInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    party?: Prisma.StringFieldUpdateOperationsInput | string;
    delayMinutes?: Prisma.IntFieldUpdateOperationsInput | number;
    reason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    reportedBy?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DelayEventUncheckedUpdateWithoutBookingInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    party?: Prisma.StringFieldUpdateOperationsInput | string;
    delayMinutes?: Prisma.IntFieldUpdateOperationsInput | number;
    reason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    reportedBy?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DelayEventUncheckedUpdateManyWithoutBookingInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    party?: Prisma.StringFieldUpdateOperationsInput | string;
    delayMinutes?: Prisma.IntFieldUpdateOperationsInput | number;
    reason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    reportedBy?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DelayEventSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    bookingId?: boolean;
    party?: boolean;
    delayMinutes?: boolean;
    reason?: boolean;
    reportedBy?: boolean;
    createdAt?: boolean;
    booking?: boolean | Prisma.BookingDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["delayEvent"]>;
export type DelayEventSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    bookingId?: boolean;
    party?: boolean;
    delayMinutes?: boolean;
    reason?: boolean;
    reportedBy?: boolean;
    createdAt?: boolean;
    booking?: boolean | Prisma.BookingDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["delayEvent"]>;
export type DelayEventSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    bookingId?: boolean;
    party?: boolean;
    delayMinutes?: boolean;
    reason?: boolean;
    reportedBy?: boolean;
    createdAt?: boolean;
    booking?: boolean | Prisma.BookingDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["delayEvent"]>;
export type DelayEventSelectScalar = {
    id?: boolean;
    bookingId?: boolean;
    party?: boolean;
    delayMinutes?: boolean;
    reason?: boolean;
    reportedBy?: boolean;
    createdAt?: boolean;
};
export type DelayEventOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "bookingId" | "party" | "delayMinutes" | "reason" | "reportedBy" | "createdAt", ExtArgs["result"]["delayEvent"]>;
export type DelayEventInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    booking?: boolean | Prisma.BookingDefaultArgs<ExtArgs>;
};
export type DelayEventIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    booking?: boolean | Prisma.BookingDefaultArgs<ExtArgs>;
};
export type DelayEventIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    booking?: boolean | Prisma.BookingDefaultArgs<ExtArgs>;
};
export type $DelayEventPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "DelayEvent";
    objects: {
        booking: Prisma.$BookingPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        bookingId: string;
        party: string;
        delayMinutes: number;
        reason: string | null;
        reportedBy: string;
        createdAt: Date;
    }, ExtArgs["result"]["delayEvent"]>;
    composites: {};
};
export type DelayEventGetPayload<S extends boolean | null | undefined | DelayEventDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$DelayEventPayload, S>;
export type DelayEventCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<DelayEventFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: DelayEventCountAggregateInputType | true;
};
export interface DelayEventDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['DelayEvent'];
        meta: {
            name: 'DelayEvent';
        };
    };
    findUnique<T extends DelayEventFindUniqueArgs>(args: Prisma.SelectSubset<T, DelayEventFindUniqueArgs<ExtArgs>>): Prisma.Prisma__DelayEventClient<runtime.Types.Result.GetResult<Prisma.$DelayEventPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends DelayEventFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, DelayEventFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__DelayEventClient<runtime.Types.Result.GetResult<Prisma.$DelayEventPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends DelayEventFindFirstArgs>(args?: Prisma.SelectSubset<T, DelayEventFindFirstArgs<ExtArgs>>): Prisma.Prisma__DelayEventClient<runtime.Types.Result.GetResult<Prisma.$DelayEventPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends DelayEventFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, DelayEventFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__DelayEventClient<runtime.Types.Result.GetResult<Prisma.$DelayEventPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends DelayEventFindManyArgs>(args?: Prisma.SelectSubset<T, DelayEventFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DelayEventPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends DelayEventCreateArgs>(args: Prisma.SelectSubset<T, DelayEventCreateArgs<ExtArgs>>): Prisma.Prisma__DelayEventClient<runtime.Types.Result.GetResult<Prisma.$DelayEventPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends DelayEventCreateManyArgs>(args?: Prisma.SelectSubset<T, DelayEventCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends DelayEventCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, DelayEventCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DelayEventPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends DelayEventDeleteArgs>(args: Prisma.SelectSubset<T, DelayEventDeleteArgs<ExtArgs>>): Prisma.Prisma__DelayEventClient<runtime.Types.Result.GetResult<Prisma.$DelayEventPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends DelayEventUpdateArgs>(args: Prisma.SelectSubset<T, DelayEventUpdateArgs<ExtArgs>>): Prisma.Prisma__DelayEventClient<runtime.Types.Result.GetResult<Prisma.$DelayEventPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends DelayEventDeleteManyArgs>(args?: Prisma.SelectSubset<T, DelayEventDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends DelayEventUpdateManyArgs>(args: Prisma.SelectSubset<T, DelayEventUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends DelayEventUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, DelayEventUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DelayEventPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends DelayEventUpsertArgs>(args: Prisma.SelectSubset<T, DelayEventUpsertArgs<ExtArgs>>): Prisma.Prisma__DelayEventClient<runtime.Types.Result.GetResult<Prisma.$DelayEventPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends DelayEventCountArgs>(args?: Prisma.Subset<T, DelayEventCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], DelayEventCountAggregateOutputType> : number>;
    aggregate<T extends DelayEventAggregateArgs>(args: Prisma.Subset<T, DelayEventAggregateArgs>): Prisma.PrismaPromise<GetDelayEventAggregateType<T>>;
    groupBy<T extends DelayEventGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: DelayEventGroupByArgs['orderBy'];
    } : {
        orderBy?: DelayEventGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, DelayEventGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDelayEventGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: DelayEventFieldRefs;
}
export interface Prisma__DelayEventClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    booking<T extends Prisma.BookingDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.BookingDefaultArgs<ExtArgs>>): Prisma.Prisma__BookingClient<runtime.Types.Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface DelayEventFieldRefs {
    readonly id: Prisma.FieldRef<"DelayEvent", 'String'>;
    readonly bookingId: Prisma.FieldRef<"DelayEvent", 'String'>;
    readonly party: Prisma.FieldRef<"DelayEvent", 'String'>;
    readonly delayMinutes: Prisma.FieldRef<"DelayEvent", 'Int'>;
    readonly reason: Prisma.FieldRef<"DelayEvent", 'String'>;
    readonly reportedBy: Prisma.FieldRef<"DelayEvent", 'String'>;
    readonly createdAt: Prisma.FieldRef<"DelayEvent", 'DateTime'>;
}
export type DelayEventFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DelayEventSelect<ExtArgs> | null;
    omit?: Prisma.DelayEventOmit<ExtArgs> | null;
    include?: Prisma.DelayEventInclude<ExtArgs> | null;
    where: Prisma.DelayEventWhereUniqueInput;
};
export type DelayEventFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DelayEventSelect<ExtArgs> | null;
    omit?: Prisma.DelayEventOmit<ExtArgs> | null;
    include?: Prisma.DelayEventInclude<ExtArgs> | null;
    where: Prisma.DelayEventWhereUniqueInput;
};
export type DelayEventFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DelayEventSelect<ExtArgs> | null;
    omit?: Prisma.DelayEventOmit<ExtArgs> | null;
    include?: Prisma.DelayEventInclude<ExtArgs> | null;
    where?: Prisma.DelayEventWhereInput;
    orderBy?: Prisma.DelayEventOrderByWithRelationInput | Prisma.DelayEventOrderByWithRelationInput[];
    cursor?: Prisma.DelayEventWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DelayEventScalarFieldEnum | Prisma.DelayEventScalarFieldEnum[];
};
export type DelayEventFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DelayEventSelect<ExtArgs> | null;
    omit?: Prisma.DelayEventOmit<ExtArgs> | null;
    include?: Prisma.DelayEventInclude<ExtArgs> | null;
    where?: Prisma.DelayEventWhereInput;
    orderBy?: Prisma.DelayEventOrderByWithRelationInput | Prisma.DelayEventOrderByWithRelationInput[];
    cursor?: Prisma.DelayEventWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DelayEventScalarFieldEnum | Prisma.DelayEventScalarFieldEnum[];
};
export type DelayEventFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DelayEventSelect<ExtArgs> | null;
    omit?: Prisma.DelayEventOmit<ExtArgs> | null;
    include?: Prisma.DelayEventInclude<ExtArgs> | null;
    where?: Prisma.DelayEventWhereInput;
    orderBy?: Prisma.DelayEventOrderByWithRelationInput | Prisma.DelayEventOrderByWithRelationInput[];
    cursor?: Prisma.DelayEventWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DelayEventScalarFieldEnum | Prisma.DelayEventScalarFieldEnum[];
};
export type DelayEventCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DelayEventSelect<ExtArgs> | null;
    omit?: Prisma.DelayEventOmit<ExtArgs> | null;
    include?: Prisma.DelayEventInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DelayEventCreateInput, Prisma.DelayEventUncheckedCreateInput>;
};
export type DelayEventCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.DelayEventCreateManyInput | Prisma.DelayEventCreateManyInput[];
    skipDuplicates?: boolean;
};
export type DelayEventCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DelayEventSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.DelayEventOmit<ExtArgs> | null;
    data: Prisma.DelayEventCreateManyInput | Prisma.DelayEventCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.DelayEventIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type DelayEventUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DelayEventSelect<ExtArgs> | null;
    omit?: Prisma.DelayEventOmit<ExtArgs> | null;
    include?: Prisma.DelayEventInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DelayEventUpdateInput, Prisma.DelayEventUncheckedUpdateInput>;
    where: Prisma.DelayEventWhereUniqueInput;
};
export type DelayEventUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.DelayEventUpdateManyMutationInput, Prisma.DelayEventUncheckedUpdateManyInput>;
    where?: Prisma.DelayEventWhereInput;
    limit?: number;
};
export type DelayEventUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DelayEventSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.DelayEventOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DelayEventUpdateManyMutationInput, Prisma.DelayEventUncheckedUpdateManyInput>;
    where?: Prisma.DelayEventWhereInput;
    limit?: number;
    include?: Prisma.DelayEventIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type DelayEventUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DelayEventSelect<ExtArgs> | null;
    omit?: Prisma.DelayEventOmit<ExtArgs> | null;
    include?: Prisma.DelayEventInclude<ExtArgs> | null;
    where: Prisma.DelayEventWhereUniqueInput;
    create: Prisma.XOR<Prisma.DelayEventCreateInput, Prisma.DelayEventUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.DelayEventUpdateInput, Prisma.DelayEventUncheckedUpdateInput>;
};
export type DelayEventDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DelayEventSelect<ExtArgs> | null;
    omit?: Prisma.DelayEventOmit<ExtArgs> | null;
    include?: Prisma.DelayEventInclude<ExtArgs> | null;
    where: Prisma.DelayEventWhereUniqueInput;
};
export type DelayEventDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DelayEventWhereInput;
    limit?: number;
};
export type DelayEventDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DelayEventSelect<ExtArgs> | null;
    omit?: Prisma.DelayEventOmit<ExtArgs> | null;
    include?: Prisma.DelayEventInclude<ExtArgs> | null;
};
