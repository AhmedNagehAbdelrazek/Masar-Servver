import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type SubscriptionTransactionModel = runtime.Types.Result.DefaultSelection<Prisma.$SubscriptionTransactionPayload>;
export type AggregateSubscriptionTransaction = {
    _count: SubscriptionTransactionCountAggregateOutputType | null;
    _avg: SubscriptionTransactionAvgAggregateOutputType | null;
    _sum: SubscriptionTransactionSumAggregateOutputType | null;
    _min: SubscriptionTransactionMinAggregateOutputType | null;
    _max: SubscriptionTransactionMaxAggregateOutputType | null;
};
export type SubscriptionTransactionAvgAggregateOutputType = {
    amount: runtime.Decimal | null;
};
export type SubscriptionTransactionSumAggregateOutputType = {
    amount: runtime.Decimal | null;
};
export type SubscriptionTransactionMinAggregateOutputType = {
    id: string | null;
    driverId: string | null;
    tier: string | null;
    amount: runtime.Decimal | null;
    currency: string | null;
    paymentMethod: string | null;
    status: string | null;
    providerTransactionId: string | null;
    expiresAt: Date | null;
    createdAt: Date | null;
};
export type SubscriptionTransactionMaxAggregateOutputType = {
    id: string | null;
    driverId: string | null;
    tier: string | null;
    amount: runtime.Decimal | null;
    currency: string | null;
    paymentMethod: string | null;
    status: string | null;
    providerTransactionId: string | null;
    expiresAt: Date | null;
    createdAt: Date | null;
};
export type SubscriptionTransactionCountAggregateOutputType = {
    id: number;
    driverId: number;
    tier: number;
    amount: number;
    currency: number;
    paymentMethod: number;
    status: number;
    providerTransactionId: number;
    expiresAt: number;
    createdAt: number;
    _all: number;
};
export type SubscriptionTransactionAvgAggregateInputType = {
    amount?: true;
};
export type SubscriptionTransactionSumAggregateInputType = {
    amount?: true;
};
export type SubscriptionTransactionMinAggregateInputType = {
    id?: true;
    driverId?: true;
    tier?: true;
    amount?: true;
    currency?: true;
    paymentMethod?: true;
    status?: true;
    providerTransactionId?: true;
    expiresAt?: true;
    createdAt?: true;
};
export type SubscriptionTransactionMaxAggregateInputType = {
    id?: true;
    driverId?: true;
    tier?: true;
    amount?: true;
    currency?: true;
    paymentMethod?: true;
    status?: true;
    providerTransactionId?: true;
    expiresAt?: true;
    createdAt?: true;
};
export type SubscriptionTransactionCountAggregateInputType = {
    id?: true;
    driverId?: true;
    tier?: true;
    amount?: true;
    currency?: true;
    paymentMethod?: true;
    status?: true;
    providerTransactionId?: true;
    expiresAt?: true;
    createdAt?: true;
    _all?: true;
};
export type SubscriptionTransactionAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SubscriptionTransactionWhereInput;
    orderBy?: Prisma.SubscriptionTransactionOrderByWithRelationInput | Prisma.SubscriptionTransactionOrderByWithRelationInput[];
    cursor?: Prisma.SubscriptionTransactionWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | SubscriptionTransactionCountAggregateInputType;
    _avg?: SubscriptionTransactionAvgAggregateInputType;
    _sum?: SubscriptionTransactionSumAggregateInputType;
    _min?: SubscriptionTransactionMinAggregateInputType;
    _max?: SubscriptionTransactionMaxAggregateInputType;
};
export type GetSubscriptionTransactionAggregateType<T extends SubscriptionTransactionAggregateArgs> = {
    [P in keyof T & keyof AggregateSubscriptionTransaction]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateSubscriptionTransaction[P]> : Prisma.GetScalarType<T[P], AggregateSubscriptionTransaction[P]>;
};
export type SubscriptionTransactionGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SubscriptionTransactionWhereInput;
    orderBy?: Prisma.SubscriptionTransactionOrderByWithAggregationInput | Prisma.SubscriptionTransactionOrderByWithAggregationInput[];
    by: Prisma.SubscriptionTransactionScalarFieldEnum[] | Prisma.SubscriptionTransactionScalarFieldEnum;
    having?: Prisma.SubscriptionTransactionScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: SubscriptionTransactionCountAggregateInputType | true;
    _avg?: SubscriptionTransactionAvgAggregateInputType;
    _sum?: SubscriptionTransactionSumAggregateInputType;
    _min?: SubscriptionTransactionMinAggregateInputType;
    _max?: SubscriptionTransactionMaxAggregateInputType;
};
export type SubscriptionTransactionGroupByOutputType = {
    id: string;
    driverId: string;
    tier: string;
    amount: runtime.Decimal;
    currency: string | null;
    paymentMethod: string;
    status: string | null;
    providerTransactionId: string | null;
    expiresAt: Date;
    createdAt: Date;
    _count: SubscriptionTransactionCountAggregateOutputType | null;
    _avg: SubscriptionTransactionAvgAggregateOutputType | null;
    _sum: SubscriptionTransactionSumAggregateOutputType | null;
    _min: SubscriptionTransactionMinAggregateOutputType | null;
    _max: SubscriptionTransactionMaxAggregateOutputType | null;
};
export type GetSubscriptionTransactionGroupByPayload<T extends SubscriptionTransactionGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<SubscriptionTransactionGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof SubscriptionTransactionGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], SubscriptionTransactionGroupByOutputType[P]> : Prisma.GetScalarType<T[P], SubscriptionTransactionGroupByOutputType[P]>;
}>>;
export type SubscriptionTransactionWhereInput = {
    AND?: Prisma.SubscriptionTransactionWhereInput | Prisma.SubscriptionTransactionWhereInput[];
    OR?: Prisma.SubscriptionTransactionWhereInput[];
    NOT?: Prisma.SubscriptionTransactionWhereInput | Prisma.SubscriptionTransactionWhereInput[];
    id?: Prisma.UuidFilter<"SubscriptionTransaction"> | string;
    driverId?: Prisma.UuidFilter<"SubscriptionTransaction"> | string;
    tier?: Prisma.StringFilter<"SubscriptionTransaction"> | string;
    amount?: Prisma.DecimalFilter<"SubscriptionTransaction"> | runtime.Decimal | runtime.DecimalJsLike | number | string;
    currency?: Prisma.StringNullableFilter<"SubscriptionTransaction"> | string | null;
    paymentMethod?: Prisma.StringFilter<"SubscriptionTransaction"> | string;
    status?: Prisma.StringNullableFilter<"SubscriptionTransaction"> | string | null;
    providerTransactionId?: Prisma.StringNullableFilter<"SubscriptionTransaction"> | string | null;
    expiresAt?: Prisma.DateTimeFilter<"SubscriptionTransaction"> | Date | string;
    createdAt?: Prisma.DateTimeFilter<"SubscriptionTransaction"> | Date | string;
};
export type SubscriptionTransactionOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    driverId?: Prisma.SortOrder;
    tier?: Prisma.SortOrder;
    amount?: Prisma.SortOrder;
    currency?: Prisma.SortOrderInput | Prisma.SortOrder;
    paymentMethod?: Prisma.SortOrder;
    status?: Prisma.SortOrderInput | Prisma.SortOrder;
    providerTransactionId?: Prisma.SortOrderInput | Prisma.SortOrder;
    expiresAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type SubscriptionTransactionWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.SubscriptionTransactionWhereInput | Prisma.SubscriptionTransactionWhereInput[];
    OR?: Prisma.SubscriptionTransactionWhereInput[];
    NOT?: Prisma.SubscriptionTransactionWhereInput | Prisma.SubscriptionTransactionWhereInput[];
    driverId?: Prisma.UuidFilter<"SubscriptionTransaction"> | string;
    tier?: Prisma.StringFilter<"SubscriptionTransaction"> | string;
    amount?: Prisma.DecimalFilter<"SubscriptionTransaction"> | runtime.Decimal | runtime.DecimalJsLike | number | string;
    currency?: Prisma.StringNullableFilter<"SubscriptionTransaction"> | string | null;
    paymentMethod?: Prisma.StringFilter<"SubscriptionTransaction"> | string;
    status?: Prisma.StringNullableFilter<"SubscriptionTransaction"> | string | null;
    providerTransactionId?: Prisma.StringNullableFilter<"SubscriptionTransaction"> | string | null;
    expiresAt?: Prisma.DateTimeFilter<"SubscriptionTransaction"> | Date | string;
    createdAt?: Prisma.DateTimeFilter<"SubscriptionTransaction"> | Date | string;
}, "id">;
export type SubscriptionTransactionOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    driverId?: Prisma.SortOrder;
    tier?: Prisma.SortOrder;
    amount?: Prisma.SortOrder;
    currency?: Prisma.SortOrderInput | Prisma.SortOrder;
    paymentMethod?: Prisma.SortOrder;
    status?: Prisma.SortOrderInput | Prisma.SortOrder;
    providerTransactionId?: Prisma.SortOrderInput | Prisma.SortOrder;
    expiresAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.SubscriptionTransactionCountOrderByAggregateInput;
    _avg?: Prisma.SubscriptionTransactionAvgOrderByAggregateInput;
    _max?: Prisma.SubscriptionTransactionMaxOrderByAggregateInput;
    _min?: Prisma.SubscriptionTransactionMinOrderByAggregateInput;
    _sum?: Prisma.SubscriptionTransactionSumOrderByAggregateInput;
};
export type SubscriptionTransactionScalarWhereWithAggregatesInput = {
    AND?: Prisma.SubscriptionTransactionScalarWhereWithAggregatesInput | Prisma.SubscriptionTransactionScalarWhereWithAggregatesInput[];
    OR?: Prisma.SubscriptionTransactionScalarWhereWithAggregatesInput[];
    NOT?: Prisma.SubscriptionTransactionScalarWhereWithAggregatesInput | Prisma.SubscriptionTransactionScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"SubscriptionTransaction"> | string;
    driverId?: Prisma.UuidWithAggregatesFilter<"SubscriptionTransaction"> | string;
    tier?: Prisma.StringWithAggregatesFilter<"SubscriptionTransaction"> | string;
    amount?: Prisma.DecimalWithAggregatesFilter<"SubscriptionTransaction"> | runtime.Decimal | runtime.DecimalJsLike | number | string;
    currency?: Prisma.StringNullableWithAggregatesFilter<"SubscriptionTransaction"> | string | null;
    paymentMethod?: Prisma.StringWithAggregatesFilter<"SubscriptionTransaction"> | string;
    status?: Prisma.StringNullableWithAggregatesFilter<"SubscriptionTransaction"> | string | null;
    providerTransactionId?: Prisma.StringNullableWithAggregatesFilter<"SubscriptionTransaction"> | string | null;
    expiresAt?: Prisma.DateTimeWithAggregatesFilter<"SubscriptionTransaction"> | Date | string;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"SubscriptionTransaction"> | Date | string;
};
export type SubscriptionTransactionCreateInput = {
    id?: string;
    driverId: string;
    tier: string;
    amount: runtime.Decimal | runtime.DecimalJsLike | number | string;
    currency?: string | null;
    paymentMethod: string;
    status?: string | null;
    providerTransactionId?: string | null;
    expiresAt: Date | string;
    createdAt?: Date | string;
};
export type SubscriptionTransactionUncheckedCreateInput = {
    id?: string;
    driverId: string;
    tier: string;
    amount: runtime.Decimal | runtime.DecimalJsLike | number | string;
    currency?: string | null;
    paymentMethod: string;
    status?: string | null;
    providerTransactionId?: string | null;
    expiresAt: Date | string;
    createdAt?: Date | string;
};
export type SubscriptionTransactionUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    driverId?: Prisma.StringFieldUpdateOperationsInput | string;
    tier?: Prisma.StringFieldUpdateOperationsInput | string;
    amount?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    currency?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    paymentMethod?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    providerTransactionId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SubscriptionTransactionUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    driverId?: Prisma.StringFieldUpdateOperationsInput | string;
    tier?: Prisma.StringFieldUpdateOperationsInput | string;
    amount?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    currency?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    paymentMethod?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    providerTransactionId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SubscriptionTransactionCreateManyInput = {
    id?: string;
    driverId: string;
    tier: string;
    amount: runtime.Decimal | runtime.DecimalJsLike | number | string;
    currency?: string | null;
    paymentMethod: string;
    status?: string | null;
    providerTransactionId?: string | null;
    expiresAt: Date | string;
    createdAt?: Date | string;
};
export type SubscriptionTransactionUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    driverId?: Prisma.StringFieldUpdateOperationsInput | string;
    tier?: Prisma.StringFieldUpdateOperationsInput | string;
    amount?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    currency?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    paymentMethod?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    providerTransactionId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SubscriptionTransactionUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    driverId?: Prisma.StringFieldUpdateOperationsInput | string;
    tier?: Prisma.StringFieldUpdateOperationsInput | string;
    amount?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    currency?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    paymentMethod?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    providerTransactionId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SubscriptionTransactionCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    driverId?: Prisma.SortOrder;
    tier?: Prisma.SortOrder;
    amount?: Prisma.SortOrder;
    currency?: Prisma.SortOrder;
    paymentMethod?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    providerTransactionId?: Prisma.SortOrder;
    expiresAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type SubscriptionTransactionAvgOrderByAggregateInput = {
    amount?: Prisma.SortOrder;
};
export type SubscriptionTransactionMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    driverId?: Prisma.SortOrder;
    tier?: Prisma.SortOrder;
    amount?: Prisma.SortOrder;
    currency?: Prisma.SortOrder;
    paymentMethod?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    providerTransactionId?: Prisma.SortOrder;
    expiresAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type SubscriptionTransactionMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    driverId?: Prisma.SortOrder;
    tier?: Prisma.SortOrder;
    amount?: Prisma.SortOrder;
    currency?: Prisma.SortOrder;
    paymentMethod?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    providerTransactionId?: Prisma.SortOrder;
    expiresAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type SubscriptionTransactionSumOrderByAggregateInput = {
    amount?: Prisma.SortOrder;
};
export type SubscriptionTransactionSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    driverId?: boolean;
    tier?: boolean;
    amount?: boolean;
    currency?: boolean;
    paymentMethod?: boolean;
    status?: boolean;
    providerTransactionId?: boolean;
    expiresAt?: boolean;
    createdAt?: boolean;
}, ExtArgs["result"]["subscriptionTransaction"]>;
export type SubscriptionTransactionSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    driverId?: boolean;
    tier?: boolean;
    amount?: boolean;
    currency?: boolean;
    paymentMethod?: boolean;
    status?: boolean;
    providerTransactionId?: boolean;
    expiresAt?: boolean;
    createdAt?: boolean;
}, ExtArgs["result"]["subscriptionTransaction"]>;
export type SubscriptionTransactionSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    driverId?: boolean;
    tier?: boolean;
    amount?: boolean;
    currency?: boolean;
    paymentMethod?: boolean;
    status?: boolean;
    providerTransactionId?: boolean;
    expiresAt?: boolean;
    createdAt?: boolean;
}, ExtArgs["result"]["subscriptionTransaction"]>;
export type SubscriptionTransactionSelectScalar = {
    id?: boolean;
    driverId?: boolean;
    tier?: boolean;
    amount?: boolean;
    currency?: boolean;
    paymentMethod?: boolean;
    status?: boolean;
    providerTransactionId?: boolean;
    expiresAt?: boolean;
    createdAt?: boolean;
};
export type SubscriptionTransactionOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "driverId" | "tier" | "amount" | "currency" | "paymentMethod" | "status" | "providerTransactionId" | "expiresAt" | "createdAt", ExtArgs["result"]["subscriptionTransaction"]>;
export type $SubscriptionTransactionPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "SubscriptionTransaction";
    objects: {};
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        driverId: string;
        tier: string;
        amount: runtime.Decimal;
        currency: string | null;
        paymentMethod: string;
        status: string | null;
        providerTransactionId: string | null;
        expiresAt: Date;
        createdAt: Date;
    }, ExtArgs["result"]["subscriptionTransaction"]>;
    composites: {};
};
export type SubscriptionTransactionGetPayload<S extends boolean | null | undefined | SubscriptionTransactionDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$SubscriptionTransactionPayload, S>;
export type SubscriptionTransactionCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<SubscriptionTransactionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: SubscriptionTransactionCountAggregateInputType | true;
};
export interface SubscriptionTransactionDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['SubscriptionTransaction'];
        meta: {
            name: 'SubscriptionTransaction';
        };
    };
    findUnique<T extends SubscriptionTransactionFindUniqueArgs>(args: Prisma.SelectSubset<T, SubscriptionTransactionFindUniqueArgs<ExtArgs>>): Prisma.Prisma__SubscriptionTransactionClient<runtime.Types.Result.GetResult<Prisma.$SubscriptionTransactionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends SubscriptionTransactionFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, SubscriptionTransactionFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__SubscriptionTransactionClient<runtime.Types.Result.GetResult<Prisma.$SubscriptionTransactionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends SubscriptionTransactionFindFirstArgs>(args?: Prisma.SelectSubset<T, SubscriptionTransactionFindFirstArgs<ExtArgs>>): Prisma.Prisma__SubscriptionTransactionClient<runtime.Types.Result.GetResult<Prisma.$SubscriptionTransactionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends SubscriptionTransactionFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, SubscriptionTransactionFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__SubscriptionTransactionClient<runtime.Types.Result.GetResult<Prisma.$SubscriptionTransactionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends SubscriptionTransactionFindManyArgs>(args?: Prisma.SelectSubset<T, SubscriptionTransactionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SubscriptionTransactionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends SubscriptionTransactionCreateArgs>(args: Prisma.SelectSubset<T, SubscriptionTransactionCreateArgs<ExtArgs>>): Prisma.Prisma__SubscriptionTransactionClient<runtime.Types.Result.GetResult<Prisma.$SubscriptionTransactionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends SubscriptionTransactionCreateManyArgs>(args?: Prisma.SelectSubset<T, SubscriptionTransactionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends SubscriptionTransactionCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, SubscriptionTransactionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SubscriptionTransactionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends SubscriptionTransactionDeleteArgs>(args: Prisma.SelectSubset<T, SubscriptionTransactionDeleteArgs<ExtArgs>>): Prisma.Prisma__SubscriptionTransactionClient<runtime.Types.Result.GetResult<Prisma.$SubscriptionTransactionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends SubscriptionTransactionUpdateArgs>(args: Prisma.SelectSubset<T, SubscriptionTransactionUpdateArgs<ExtArgs>>): Prisma.Prisma__SubscriptionTransactionClient<runtime.Types.Result.GetResult<Prisma.$SubscriptionTransactionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends SubscriptionTransactionDeleteManyArgs>(args?: Prisma.SelectSubset<T, SubscriptionTransactionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends SubscriptionTransactionUpdateManyArgs>(args: Prisma.SelectSubset<T, SubscriptionTransactionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends SubscriptionTransactionUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, SubscriptionTransactionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SubscriptionTransactionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends SubscriptionTransactionUpsertArgs>(args: Prisma.SelectSubset<T, SubscriptionTransactionUpsertArgs<ExtArgs>>): Prisma.Prisma__SubscriptionTransactionClient<runtime.Types.Result.GetResult<Prisma.$SubscriptionTransactionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends SubscriptionTransactionCountArgs>(args?: Prisma.Subset<T, SubscriptionTransactionCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], SubscriptionTransactionCountAggregateOutputType> : number>;
    aggregate<T extends SubscriptionTransactionAggregateArgs>(args: Prisma.Subset<T, SubscriptionTransactionAggregateArgs>): Prisma.PrismaPromise<GetSubscriptionTransactionAggregateType<T>>;
    groupBy<T extends SubscriptionTransactionGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: SubscriptionTransactionGroupByArgs['orderBy'];
    } : {
        orderBy?: SubscriptionTransactionGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, SubscriptionTransactionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSubscriptionTransactionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: SubscriptionTransactionFieldRefs;
}
export interface Prisma__SubscriptionTransactionClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface SubscriptionTransactionFieldRefs {
    readonly id: Prisma.FieldRef<"SubscriptionTransaction", 'String'>;
    readonly driverId: Prisma.FieldRef<"SubscriptionTransaction", 'String'>;
    readonly tier: Prisma.FieldRef<"SubscriptionTransaction", 'String'>;
    readonly amount: Prisma.FieldRef<"SubscriptionTransaction", 'Decimal'>;
    readonly currency: Prisma.FieldRef<"SubscriptionTransaction", 'String'>;
    readonly paymentMethod: Prisma.FieldRef<"SubscriptionTransaction", 'String'>;
    readonly status: Prisma.FieldRef<"SubscriptionTransaction", 'String'>;
    readonly providerTransactionId: Prisma.FieldRef<"SubscriptionTransaction", 'String'>;
    readonly expiresAt: Prisma.FieldRef<"SubscriptionTransaction", 'DateTime'>;
    readonly createdAt: Prisma.FieldRef<"SubscriptionTransaction", 'DateTime'>;
}
export type SubscriptionTransactionFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SubscriptionTransactionSelect<ExtArgs> | null;
    omit?: Prisma.SubscriptionTransactionOmit<ExtArgs> | null;
    where: Prisma.SubscriptionTransactionWhereUniqueInput;
};
export type SubscriptionTransactionFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SubscriptionTransactionSelect<ExtArgs> | null;
    omit?: Prisma.SubscriptionTransactionOmit<ExtArgs> | null;
    where: Prisma.SubscriptionTransactionWhereUniqueInput;
};
export type SubscriptionTransactionFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SubscriptionTransactionSelect<ExtArgs> | null;
    omit?: Prisma.SubscriptionTransactionOmit<ExtArgs> | null;
    where?: Prisma.SubscriptionTransactionWhereInput;
    orderBy?: Prisma.SubscriptionTransactionOrderByWithRelationInput | Prisma.SubscriptionTransactionOrderByWithRelationInput[];
    cursor?: Prisma.SubscriptionTransactionWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SubscriptionTransactionScalarFieldEnum | Prisma.SubscriptionTransactionScalarFieldEnum[];
};
export type SubscriptionTransactionFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SubscriptionTransactionSelect<ExtArgs> | null;
    omit?: Prisma.SubscriptionTransactionOmit<ExtArgs> | null;
    where?: Prisma.SubscriptionTransactionWhereInput;
    orderBy?: Prisma.SubscriptionTransactionOrderByWithRelationInput | Prisma.SubscriptionTransactionOrderByWithRelationInput[];
    cursor?: Prisma.SubscriptionTransactionWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SubscriptionTransactionScalarFieldEnum | Prisma.SubscriptionTransactionScalarFieldEnum[];
};
export type SubscriptionTransactionFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SubscriptionTransactionSelect<ExtArgs> | null;
    omit?: Prisma.SubscriptionTransactionOmit<ExtArgs> | null;
    where?: Prisma.SubscriptionTransactionWhereInput;
    orderBy?: Prisma.SubscriptionTransactionOrderByWithRelationInput | Prisma.SubscriptionTransactionOrderByWithRelationInput[];
    cursor?: Prisma.SubscriptionTransactionWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SubscriptionTransactionScalarFieldEnum | Prisma.SubscriptionTransactionScalarFieldEnum[];
};
export type SubscriptionTransactionCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SubscriptionTransactionSelect<ExtArgs> | null;
    omit?: Prisma.SubscriptionTransactionOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SubscriptionTransactionCreateInput, Prisma.SubscriptionTransactionUncheckedCreateInput>;
};
export type SubscriptionTransactionCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.SubscriptionTransactionCreateManyInput | Prisma.SubscriptionTransactionCreateManyInput[];
    skipDuplicates?: boolean;
};
export type SubscriptionTransactionCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SubscriptionTransactionSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.SubscriptionTransactionOmit<ExtArgs> | null;
    data: Prisma.SubscriptionTransactionCreateManyInput | Prisma.SubscriptionTransactionCreateManyInput[];
    skipDuplicates?: boolean;
};
export type SubscriptionTransactionUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SubscriptionTransactionSelect<ExtArgs> | null;
    omit?: Prisma.SubscriptionTransactionOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SubscriptionTransactionUpdateInput, Prisma.SubscriptionTransactionUncheckedUpdateInput>;
    where: Prisma.SubscriptionTransactionWhereUniqueInput;
};
export type SubscriptionTransactionUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.SubscriptionTransactionUpdateManyMutationInput, Prisma.SubscriptionTransactionUncheckedUpdateManyInput>;
    where?: Prisma.SubscriptionTransactionWhereInput;
    limit?: number;
};
export type SubscriptionTransactionUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SubscriptionTransactionSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.SubscriptionTransactionOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SubscriptionTransactionUpdateManyMutationInput, Prisma.SubscriptionTransactionUncheckedUpdateManyInput>;
    where?: Prisma.SubscriptionTransactionWhereInput;
    limit?: number;
};
export type SubscriptionTransactionUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SubscriptionTransactionSelect<ExtArgs> | null;
    omit?: Prisma.SubscriptionTransactionOmit<ExtArgs> | null;
    where: Prisma.SubscriptionTransactionWhereUniqueInput;
    create: Prisma.XOR<Prisma.SubscriptionTransactionCreateInput, Prisma.SubscriptionTransactionUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.SubscriptionTransactionUpdateInput, Prisma.SubscriptionTransactionUncheckedUpdateInput>;
};
export type SubscriptionTransactionDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SubscriptionTransactionSelect<ExtArgs> | null;
    omit?: Prisma.SubscriptionTransactionOmit<ExtArgs> | null;
    where: Prisma.SubscriptionTransactionWhereUniqueInput;
};
export type SubscriptionTransactionDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SubscriptionTransactionWhereInput;
    limit?: number;
};
export type SubscriptionTransactionDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SubscriptionTransactionSelect<ExtArgs> | null;
    omit?: Prisma.SubscriptionTransactionOmit<ExtArgs> | null;
};
