import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type TripAttributeModel = runtime.Types.Result.DefaultSelection<Prisma.$TripAttributePayload>;
export type AggregateTripAttribute = {
    _count: TripAttributeCountAggregateOutputType | null;
    _min: TripAttributeMinAggregateOutputType | null;
    _max: TripAttributeMaxAggregateOutputType | null;
};
export type TripAttributeMinAggregateOutputType = {
    id: string | null;
    tripId: string | null;
    attrKey: string | null;
    attrValue: string | null;
};
export type TripAttributeMaxAggregateOutputType = {
    id: string | null;
    tripId: string | null;
    attrKey: string | null;
    attrValue: string | null;
};
export type TripAttributeCountAggregateOutputType = {
    id: number;
    tripId: number;
    attrKey: number;
    attrValue: number;
    _all: number;
};
export type TripAttributeMinAggregateInputType = {
    id?: true;
    tripId?: true;
    attrKey?: true;
    attrValue?: true;
};
export type TripAttributeMaxAggregateInputType = {
    id?: true;
    tripId?: true;
    attrKey?: true;
    attrValue?: true;
};
export type TripAttributeCountAggregateInputType = {
    id?: true;
    tripId?: true;
    attrKey?: true;
    attrValue?: true;
    _all?: true;
};
export type TripAttributeAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TripAttributeWhereInput;
    orderBy?: Prisma.TripAttributeOrderByWithRelationInput | Prisma.TripAttributeOrderByWithRelationInput[];
    cursor?: Prisma.TripAttributeWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | TripAttributeCountAggregateInputType;
    _min?: TripAttributeMinAggregateInputType;
    _max?: TripAttributeMaxAggregateInputType;
};
export type GetTripAttributeAggregateType<T extends TripAttributeAggregateArgs> = {
    [P in keyof T & keyof AggregateTripAttribute]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateTripAttribute[P]> : Prisma.GetScalarType<T[P], AggregateTripAttribute[P]>;
};
export type TripAttributeGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TripAttributeWhereInput;
    orderBy?: Prisma.TripAttributeOrderByWithAggregationInput | Prisma.TripAttributeOrderByWithAggregationInput[];
    by: Prisma.TripAttributeScalarFieldEnum[] | Prisma.TripAttributeScalarFieldEnum;
    having?: Prisma.TripAttributeScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: TripAttributeCountAggregateInputType | true;
    _min?: TripAttributeMinAggregateInputType;
    _max?: TripAttributeMaxAggregateInputType;
};
export type TripAttributeGroupByOutputType = {
    id: string;
    tripId: string;
    attrKey: string;
    attrValue: string;
    _count: TripAttributeCountAggregateOutputType | null;
    _min: TripAttributeMinAggregateOutputType | null;
    _max: TripAttributeMaxAggregateOutputType | null;
};
export type GetTripAttributeGroupByPayload<T extends TripAttributeGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<TripAttributeGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof TripAttributeGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], TripAttributeGroupByOutputType[P]> : Prisma.GetScalarType<T[P], TripAttributeGroupByOutputType[P]>;
}>>;
export type TripAttributeWhereInput = {
    AND?: Prisma.TripAttributeWhereInput | Prisma.TripAttributeWhereInput[];
    OR?: Prisma.TripAttributeWhereInput[];
    NOT?: Prisma.TripAttributeWhereInput | Prisma.TripAttributeWhereInput[];
    id?: Prisma.UuidFilter<"TripAttribute"> | string;
    tripId?: Prisma.UuidFilter<"TripAttribute"> | string;
    attrKey?: Prisma.StringFilter<"TripAttribute"> | string;
    attrValue?: Prisma.StringFilter<"TripAttribute"> | string;
    trip?: Prisma.XOR<Prisma.TripScalarRelationFilter, Prisma.TripWhereInput>;
};
export type TripAttributeOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    tripId?: Prisma.SortOrder;
    attrKey?: Prisma.SortOrder;
    attrValue?: Prisma.SortOrder;
    trip?: Prisma.TripOrderByWithRelationInput;
};
export type TripAttributeWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    tripId_attrKey?: Prisma.TripAttributeTripIdAttrKeyCompoundUniqueInput;
    AND?: Prisma.TripAttributeWhereInput | Prisma.TripAttributeWhereInput[];
    OR?: Prisma.TripAttributeWhereInput[];
    NOT?: Prisma.TripAttributeWhereInput | Prisma.TripAttributeWhereInput[];
    tripId?: Prisma.UuidFilter<"TripAttribute"> | string;
    attrKey?: Prisma.StringFilter<"TripAttribute"> | string;
    attrValue?: Prisma.StringFilter<"TripAttribute"> | string;
    trip?: Prisma.XOR<Prisma.TripScalarRelationFilter, Prisma.TripWhereInput>;
}, "id" | "tripId_attrKey">;
export type TripAttributeOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    tripId?: Prisma.SortOrder;
    attrKey?: Prisma.SortOrder;
    attrValue?: Prisma.SortOrder;
    _count?: Prisma.TripAttributeCountOrderByAggregateInput;
    _max?: Prisma.TripAttributeMaxOrderByAggregateInput;
    _min?: Prisma.TripAttributeMinOrderByAggregateInput;
};
export type TripAttributeScalarWhereWithAggregatesInput = {
    AND?: Prisma.TripAttributeScalarWhereWithAggregatesInput | Prisma.TripAttributeScalarWhereWithAggregatesInput[];
    OR?: Prisma.TripAttributeScalarWhereWithAggregatesInput[];
    NOT?: Prisma.TripAttributeScalarWhereWithAggregatesInput | Prisma.TripAttributeScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"TripAttribute"> | string;
    tripId?: Prisma.UuidWithAggregatesFilter<"TripAttribute"> | string;
    attrKey?: Prisma.StringWithAggregatesFilter<"TripAttribute"> | string;
    attrValue?: Prisma.StringWithAggregatesFilter<"TripAttribute"> | string;
};
export type TripAttributeCreateInput = {
    id?: string;
    attrKey: string;
    attrValue: string;
    trip: Prisma.TripCreateNestedOneWithoutAttributesInput;
};
export type TripAttributeUncheckedCreateInput = {
    id?: string;
    tripId: string;
    attrKey: string;
    attrValue: string;
};
export type TripAttributeUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    attrKey?: Prisma.StringFieldUpdateOperationsInput | string;
    attrValue?: Prisma.StringFieldUpdateOperationsInput | string;
    trip?: Prisma.TripUpdateOneRequiredWithoutAttributesNestedInput;
};
export type TripAttributeUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    tripId?: Prisma.StringFieldUpdateOperationsInput | string;
    attrKey?: Prisma.StringFieldUpdateOperationsInput | string;
    attrValue?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type TripAttributeCreateManyInput = {
    id?: string;
    tripId: string;
    attrKey: string;
    attrValue: string;
};
export type TripAttributeUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    attrKey?: Prisma.StringFieldUpdateOperationsInput | string;
    attrValue?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type TripAttributeUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    tripId?: Prisma.StringFieldUpdateOperationsInput | string;
    attrKey?: Prisma.StringFieldUpdateOperationsInput | string;
    attrValue?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type TripAttributeListRelationFilter = {
    every?: Prisma.TripAttributeWhereInput;
    some?: Prisma.TripAttributeWhereInput;
    none?: Prisma.TripAttributeWhereInput;
};
export type TripAttributeOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type TripAttributeTripIdAttrKeyCompoundUniqueInput = {
    tripId: string;
    attrKey: string;
};
export type TripAttributeCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    tripId?: Prisma.SortOrder;
    attrKey?: Prisma.SortOrder;
    attrValue?: Prisma.SortOrder;
};
export type TripAttributeMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    tripId?: Prisma.SortOrder;
    attrKey?: Prisma.SortOrder;
    attrValue?: Prisma.SortOrder;
};
export type TripAttributeMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    tripId?: Prisma.SortOrder;
    attrKey?: Prisma.SortOrder;
    attrValue?: Prisma.SortOrder;
};
export type TripAttributeCreateNestedManyWithoutTripInput = {
    create?: Prisma.XOR<Prisma.TripAttributeCreateWithoutTripInput, Prisma.TripAttributeUncheckedCreateWithoutTripInput> | Prisma.TripAttributeCreateWithoutTripInput[] | Prisma.TripAttributeUncheckedCreateWithoutTripInput[];
    connectOrCreate?: Prisma.TripAttributeCreateOrConnectWithoutTripInput | Prisma.TripAttributeCreateOrConnectWithoutTripInput[];
    createMany?: Prisma.TripAttributeCreateManyTripInputEnvelope;
    connect?: Prisma.TripAttributeWhereUniqueInput | Prisma.TripAttributeWhereUniqueInput[];
};
export type TripAttributeUncheckedCreateNestedManyWithoutTripInput = {
    create?: Prisma.XOR<Prisma.TripAttributeCreateWithoutTripInput, Prisma.TripAttributeUncheckedCreateWithoutTripInput> | Prisma.TripAttributeCreateWithoutTripInput[] | Prisma.TripAttributeUncheckedCreateWithoutTripInput[];
    connectOrCreate?: Prisma.TripAttributeCreateOrConnectWithoutTripInput | Prisma.TripAttributeCreateOrConnectWithoutTripInput[];
    createMany?: Prisma.TripAttributeCreateManyTripInputEnvelope;
    connect?: Prisma.TripAttributeWhereUniqueInput | Prisma.TripAttributeWhereUniqueInput[];
};
export type TripAttributeUpdateManyWithoutTripNestedInput = {
    create?: Prisma.XOR<Prisma.TripAttributeCreateWithoutTripInput, Prisma.TripAttributeUncheckedCreateWithoutTripInput> | Prisma.TripAttributeCreateWithoutTripInput[] | Prisma.TripAttributeUncheckedCreateWithoutTripInput[];
    connectOrCreate?: Prisma.TripAttributeCreateOrConnectWithoutTripInput | Prisma.TripAttributeCreateOrConnectWithoutTripInput[];
    upsert?: Prisma.TripAttributeUpsertWithWhereUniqueWithoutTripInput | Prisma.TripAttributeUpsertWithWhereUniqueWithoutTripInput[];
    createMany?: Prisma.TripAttributeCreateManyTripInputEnvelope;
    set?: Prisma.TripAttributeWhereUniqueInput | Prisma.TripAttributeWhereUniqueInput[];
    disconnect?: Prisma.TripAttributeWhereUniqueInput | Prisma.TripAttributeWhereUniqueInput[];
    delete?: Prisma.TripAttributeWhereUniqueInput | Prisma.TripAttributeWhereUniqueInput[];
    connect?: Prisma.TripAttributeWhereUniqueInput | Prisma.TripAttributeWhereUniqueInput[];
    update?: Prisma.TripAttributeUpdateWithWhereUniqueWithoutTripInput | Prisma.TripAttributeUpdateWithWhereUniqueWithoutTripInput[];
    updateMany?: Prisma.TripAttributeUpdateManyWithWhereWithoutTripInput | Prisma.TripAttributeUpdateManyWithWhereWithoutTripInput[];
    deleteMany?: Prisma.TripAttributeScalarWhereInput | Prisma.TripAttributeScalarWhereInput[];
};
export type TripAttributeUncheckedUpdateManyWithoutTripNestedInput = {
    create?: Prisma.XOR<Prisma.TripAttributeCreateWithoutTripInput, Prisma.TripAttributeUncheckedCreateWithoutTripInput> | Prisma.TripAttributeCreateWithoutTripInput[] | Prisma.TripAttributeUncheckedCreateWithoutTripInput[];
    connectOrCreate?: Prisma.TripAttributeCreateOrConnectWithoutTripInput | Prisma.TripAttributeCreateOrConnectWithoutTripInput[];
    upsert?: Prisma.TripAttributeUpsertWithWhereUniqueWithoutTripInput | Prisma.TripAttributeUpsertWithWhereUniqueWithoutTripInput[];
    createMany?: Prisma.TripAttributeCreateManyTripInputEnvelope;
    set?: Prisma.TripAttributeWhereUniqueInput | Prisma.TripAttributeWhereUniqueInput[];
    disconnect?: Prisma.TripAttributeWhereUniqueInput | Prisma.TripAttributeWhereUniqueInput[];
    delete?: Prisma.TripAttributeWhereUniqueInput | Prisma.TripAttributeWhereUniqueInput[];
    connect?: Prisma.TripAttributeWhereUniqueInput | Prisma.TripAttributeWhereUniqueInput[];
    update?: Prisma.TripAttributeUpdateWithWhereUniqueWithoutTripInput | Prisma.TripAttributeUpdateWithWhereUniqueWithoutTripInput[];
    updateMany?: Prisma.TripAttributeUpdateManyWithWhereWithoutTripInput | Prisma.TripAttributeUpdateManyWithWhereWithoutTripInput[];
    deleteMany?: Prisma.TripAttributeScalarWhereInput | Prisma.TripAttributeScalarWhereInput[];
};
export type TripAttributeCreateWithoutTripInput = {
    id?: string;
    attrKey: string;
    attrValue: string;
};
export type TripAttributeUncheckedCreateWithoutTripInput = {
    id?: string;
    attrKey: string;
    attrValue: string;
};
export type TripAttributeCreateOrConnectWithoutTripInput = {
    where: Prisma.TripAttributeWhereUniqueInput;
    create: Prisma.XOR<Prisma.TripAttributeCreateWithoutTripInput, Prisma.TripAttributeUncheckedCreateWithoutTripInput>;
};
export type TripAttributeCreateManyTripInputEnvelope = {
    data: Prisma.TripAttributeCreateManyTripInput | Prisma.TripAttributeCreateManyTripInput[];
    skipDuplicates?: boolean;
};
export type TripAttributeUpsertWithWhereUniqueWithoutTripInput = {
    where: Prisma.TripAttributeWhereUniqueInput;
    update: Prisma.XOR<Prisma.TripAttributeUpdateWithoutTripInput, Prisma.TripAttributeUncheckedUpdateWithoutTripInput>;
    create: Prisma.XOR<Prisma.TripAttributeCreateWithoutTripInput, Prisma.TripAttributeUncheckedCreateWithoutTripInput>;
};
export type TripAttributeUpdateWithWhereUniqueWithoutTripInput = {
    where: Prisma.TripAttributeWhereUniqueInput;
    data: Prisma.XOR<Prisma.TripAttributeUpdateWithoutTripInput, Prisma.TripAttributeUncheckedUpdateWithoutTripInput>;
};
export type TripAttributeUpdateManyWithWhereWithoutTripInput = {
    where: Prisma.TripAttributeScalarWhereInput;
    data: Prisma.XOR<Prisma.TripAttributeUpdateManyMutationInput, Prisma.TripAttributeUncheckedUpdateManyWithoutTripInput>;
};
export type TripAttributeScalarWhereInput = {
    AND?: Prisma.TripAttributeScalarWhereInput | Prisma.TripAttributeScalarWhereInput[];
    OR?: Prisma.TripAttributeScalarWhereInput[];
    NOT?: Prisma.TripAttributeScalarWhereInput | Prisma.TripAttributeScalarWhereInput[];
    id?: Prisma.UuidFilter<"TripAttribute"> | string;
    tripId?: Prisma.UuidFilter<"TripAttribute"> | string;
    attrKey?: Prisma.StringFilter<"TripAttribute"> | string;
    attrValue?: Prisma.StringFilter<"TripAttribute"> | string;
};
export type TripAttributeCreateManyTripInput = {
    id?: string;
    attrKey: string;
    attrValue: string;
};
export type TripAttributeUpdateWithoutTripInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    attrKey?: Prisma.StringFieldUpdateOperationsInput | string;
    attrValue?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type TripAttributeUncheckedUpdateWithoutTripInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    attrKey?: Prisma.StringFieldUpdateOperationsInput | string;
    attrValue?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type TripAttributeUncheckedUpdateManyWithoutTripInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    attrKey?: Prisma.StringFieldUpdateOperationsInput | string;
    attrValue?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type TripAttributeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    tripId?: boolean;
    attrKey?: boolean;
    attrValue?: boolean;
    trip?: boolean | Prisma.TripDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["tripAttribute"]>;
export type TripAttributeSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    tripId?: boolean;
    attrKey?: boolean;
    attrValue?: boolean;
    trip?: boolean | Prisma.TripDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["tripAttribute"]>;
export type TripAttributeSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    tripId?: boolean;
    attrKey?: boolean;
    attrValue?: boolean;
    trip?: boolean | Prisma.TripDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["tripAttribute"]>;
export type TripAttributeSelectScalar = {
    id?: boolean;
    tripId?: boolean;
    attrKey?: boolean;
    attrValue?: boolean;
};
export type TripAttributeOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "tripId" | "attrKey" | "attrValue", ExtArgs["result"]["tripAttribute"]>;
export type TripAttributeInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    trip?: boolean | Prisma.TripDefaultArgs<ExtArgs>;
};
export type TripAttributeIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    trip?: boolean | Prisma.TripDefaultArgs<ExtArgs>;
};
export type TripAttributeIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    trip?: boolean | Prisma.TripDefaultArgs<ExtArgs>;
};
export type $TripAttributePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "TripAttribute";
    objects: {
        trip: Prisma.$TripPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        tripId: string;
        attrKey: string;
        attrValue: string;
    }, ExtArgs["result"]["tripAttribute"]>;
    composites: {};
};
export type TripAttributeGetPayload<S extends boolean | null | undefined | TripAttributeDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$TripAttributePayload, S>;
export type TripAttributeCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<TripAttributeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: TripAttributeCountAggregateInputType | true;
};
export interface TripAttributeDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['TripAttribute'];
        meta: {
            name: 'TripAttribute';
        };
    };
    findUnique<T extends TripAttributeFindUniqueArgs>(args: Prisma.SelectSubset<T, TripAttributeFindUniqueArgs<ExtArgs>>): Prisma.Prisma__TripAttributeClient<runtime.Types.Result.GetResult<Prisma.$TripAttributePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends TripAttributeFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, TripAttributeFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__TripAttributeClient<runtime.Types.Result.GetResult<Prisma.$TripAttributePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends TripAttributeFindFirstArgs>(args?: Prisma.SelectSubset<T, TripAttributeFindFirstArgs<ExtArgs>>): Prisma.Prisma__TripAttributeClient<runtime.Types.Result.GetResult<Prisma.$TripAttributePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends TripAttributeFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, TripAttributeFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__TripAttributeClient<runtime.Types.Result.GetResult<Prisma.$TripAttributePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends TripAttributeFindManyArgs>(args?: Prisma.SelectSubset<T, TripAttributeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TripAttributePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends TripAttributeCreateArgs>(args: Prisma.SelectSubset<T, TripAttributeCreateArgs<ExtArgs>>): Prisma.Prisma__TripAttributeClient<runtime.Types.Result.GetResult<Prisma.$TripAttributePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends TripAttributeCreateManyArgs>(args?: Prisma.SelectSubset<T, TripAttributeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends TripAttributeCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, TripAttributeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TripAttributePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends TripAttributeDeleteArgs>(args: Prisma.SelectSubset<T, TripAttributeDeleteArgs<ExtArgs>>): Prisma.Prisma__TripAttributeClient<runtime.Types.Result.GetResult<Prisma.$TripAttributePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends TripAttributeUpdateArgs>(args: Prisma.SelectSubset<T, TripAttributeUpdateArgs<ExtArgs>>): Prisma.Prisma__TripAttributeClient<runtime.Types.Result.GetResult<Prisma.$TripAttributePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends TripAttributeDeleteManyArgs>(args?: Prisma.SelectSubset<T, TripAttributeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends TripAttributeUpdateManyArgs>(args: Prisma.SelectSubset<T, TripAttributeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends TripAttributeUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, TripAttributeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TripAttributePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends TripAttributeUpsertArgs>(args: Prisma.SelectSubset<T, TripAttributeUpsertArgs<ExtArgs>>): Prisma.Prisma__TripAttributeClient<runtime.Types.Result.GetResult<Prisma.$TripAttributePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends TripAttributeCountArgs>(args?: Prisma.Subset<T, TripAttributeCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], TripAttributeCountAggregateOutputType> : number>;
    aggregate<T extends TripAttributeAggregateArgs>(args: Prisma.Subset<T, TripAttributeAggregateArgs>): Prisma.PrismaPromise<GetTripAttributeAggregateType<T>>;
    groupBy<T extends TripAttributeGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: TripAttributeGroupByArgs['orderBy'];
    } : {
        orderBy?: TripAttributeGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, TripAttributeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTripAttributeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: TripAttributeFieldRefs;
}
export interface Prisma__TripAttributeClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    trip<T extends Prisma.TripDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.TripDefaultArgs<ExtArgs>>): Prisma.Prisma__TripClient<runtime.Types.Result.GetResult<Prisma.$TripPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface TripAttributeFieldRefs {
    readonly id: Prisma.FieldRef<"TripAttribute", 'String'>;
    readonly tripId: Prisma.FieldRef<"TripAttribute", 'String'>;
    readonly attrKey: Prisma.FieldRef<"TripAttribute", 'String'>;
    readonly attrValue: Prisma.FieldRef<"TripAttribute", 'String'>;
}
export type TripAttributeFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripAttributeSelect<ExtArgs> | null;
    omit?: Prisma.TripAttributeOmit<ExtArgs> | null;
    include?: Prisma.TripAttributeInclude<ExtArgs> | null;
    where: Prisma.TripAttributeWhereUniqueInput;
};
export type TripAttributeFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripAttributeSelect<ExtArgs> | null;
    omit?: Prisma.TripAttributeOmit<ExtArgs> | null;
    include?: Prisma.TripAttributeInclude<ExtArgs> | null;
    where: Prisma.TripAttributeWhereUniqueInput;
};
export type TripAttributeFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripAttributeSelect<ExtArgs> | null;
    omit?: Prisma.TripAttributeOmit<ExtArgs> | null;
    include?: Prisma.TripAttributeInclude<ExtArgs> | null;
    where?: Prisma.TripAttributeWhereInput;
    orderBy?: Prisma.TripAttributeOrderByWithRelationInput | Prisma.TripAttributeOrderByWithRelationInput[];
    cursor?: Prisma.TripAttributeWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TripAttributeScalarFieldEnum | Prisma.TripAttributeScalarFieldEnum[];
};
export type TripAttributeFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripAttributeSelect<ExtArgs> | null;
    omit?: Prisma.TripAttributeOmit<ExtArgs> | null;
    include?: Prisma.TripAttributeInclude<ExtArgs> | null;
    where?: Prisma.TripAttributeWhereInput;
    orderBy?: Prisma.TripAttributeOrderByWithRelationInput | Prisma.TripAttributeOrderByWithRelationInput[];
    cursor?: Prisma.TripAttributeWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TripAttributeScalarFieldEnum | Prisma.TripAttributeScalarFieldEnum[];
};
export type TripAttributeFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripAttributeSelect<ExtArgs> | null;
    omit?: Prisma.TripAttributeOmit<ExtArgs> | null;
    include?: Prisma.TripAttributeInclude<ExtArgs> | null;
    where?: Prisma.TripAttributeWhereInput;
    orderBy?: Prisma.TripAttributeOrderByWithRelationInput | Prisma.TripAttributeOrderByWithRelationInput[];
    cursor?: Prisma.TripAttributeWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TripAttributeScalarFieldEnum | Prisma.TripAttributeScalarFieldEnum[];
};
export type TripAttributeCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripAttributeSelect<ExtArgs> | null;
    omit?: Prisma.TripAttributeOmit<ExtArgs> | null;
    include?: Prisma.TripAttributeInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TripAttributeCreateInput, Prisma.TripAttributeUncheckedCreateInput>;
};
export type TripAttributeCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.TripAttributeCreateManyInput | Prisma.TripAttributeCreateManyInput[];
    skipDuplicates?: boolean;
};
export type TripAttributeCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripAttributeSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.TripAttributeOmit<ExtArgs> | null;
    data: Prisma.TripAttributeCreateManyInput | Prisma.TripAttributeCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.TripAttributeIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type TripAttributeUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripAttributeSelect<ExtArgs> | null;
    omit?: Prisma.TripAttributeOmit<ExtArgs> | null;
    include?: Prisma.TripAttributeInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TripAttributeUpdateInput, Prisma.TripAttributeUncheckedUpdateInput>;
    where: Prisma.TripAttributeWhereUniqueInput;
};
export type TripAttributeUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.TripAttributeUpdateManyMutationInput, Prisma.TripAttributeUncheckedUpdateManyInput>;
    where?: Prisma.TripAttributeWhereInput;
    limit?: number;
};
export type TripAttributeUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripAttributeSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.TripAttributeOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.TripAttributeUpdateManyMutationInput, Prisma.TripAttributeUncheckedUpdateManyInput>;
    where?: Prisma.TripAttributeWhereInput;
    limit?: number;
    include?: Prisma.TripAttributeIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type TripAttributeUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripAttributeSelect<ExtArgs> | null;
    omit?: Prisma.TripAttributeOmit<ExtArgs> | null;
    include?: Prisma.TripAttributeInclude<ExtArgs> | null;
    where: Prisma.TripAttributeWhereUniqueInput;
    create: Prisma.XOR<Prisma.TripAttributeCreateInput, Prisma.TripAttributeUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.TripAttributeUpdateInput, Prisma.TripAttributeUncheckedUpdateInput>;
};
export type TripAttributeDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripAttributeSelect<ExtArgs> | null;
    omit?: Prisma.TripAttributeOmit<ExtArgs> | null;
    include?: Prisma.TripAttributeInclude<ExtArgs> | null;
    where: Prisma.TripAttributeWhereUniqueInput;
};
export type TripAttributeDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TripAttributeWhereInput;
    limit?: number;
};
export type TripAttributeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TripAttributeSelect<ExtArgs> | null;
    omit?: Prisma.TripAttributeOmit<ExtArgs> | null;
    include?: Prisma.TripAttributeInclude<ExtArgs> | null;
};
