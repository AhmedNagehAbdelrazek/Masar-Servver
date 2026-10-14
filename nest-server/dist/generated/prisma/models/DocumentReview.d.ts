import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums.js";
import type * as Prisma from "../internal/prismaNamespace.js";
export type DocumentReviewModel = runtime.Types.Result.DefaultSelection<Prisma.$DocumentReviewPayload>;
export type AggregateDocumentReview = {
    _count: DocumentReviewCountAggregateOutputType | null;
    _min: DocumentReviewMinAggregateOutputType | null;
    _max: DocumentReviewMaxAggregateOutputType | null;
};
export type DocumentReviewMinAggregateOutputType = {
    id: string | null;
    driverId: string | null;
    documentKey: string | null;
    decision: $Enums.DocumentDecision | null;
    reason: string | null;
    decidedBy: string | null;
    decidedAt: Date | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type DocumentReviewMaxAggregateOutputType = {
    id: string | null;
    driverId: string | null;
    documentKey: string | null;
    decision: $Enums.DocumentDecision | null;
    reason: string | null;
    decidedBy: string | null;
    decidedAt: Date | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type DocumentReviewCountAggregateOutputType = {
    id: number;
    driverId: number;
    documentKey: number;
    decision: number;
    reason: number;
    decidedBy: number;
    decidedAt: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type DocumentReviewMinAggregateInputType = {
    id?: true;
    driverId?: true;
    documentKey?: true;
    decision?: true;
    reason?: true;
    decidedBy?: true;
    decidedAt?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type DocumentReviewMaxAggregateInputType = {
    id?: true;
    driverId?: true;
    documentKey?: true;
    decision?: true;
    reason?: true;
    decidedBy?: true;
    decidedAt?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type DocumentReviewCountAggregateInputType = {
    id?: true;
    driverId?: true;
    documentKey?: true;
    decision?: true;
    reason?: true;
    decidedBy?: true;
    decidedAt?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type DocumentReviewAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DocumentReviewWhereInput;
    orderBy?: Prisma.DocumentReviewOrderByWithRelationInput | Prisma.DocumentReviewOrderByWithRelationInput[];
    cursor?: Prisma.DocumentReviewWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | DocumentReviewCountAggregateInputType;
    _min?: DocumentReviewMinAggregateInputType;
    _max?: DocumentReviewMaxAggregateInputType;
};
export type GetDocumentReviewAggregateType<T extends DocumentReviewAggregateArgs> = {
    [P in keyof T & keyof AggregateDocumentReview]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateDocumentReview[P]> : Prisma.GetScalarType<T[P], AggregateDocumentReview[P]>;
};
export type DocumentReviewGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DocumentReviewWhereInput;
    orderBy?: Prisma.DocumentReviewOrderByWithAggregationInput | Prisma.DocumentReviewOrderByWithAggregationInput[];
    by: Prisma.DocumentReviewScalarFieldEnum[] | Prisma.DocumentReviewScalarFieldEnum;
    having?: Prisma.DocumentReviewScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: DocumentReviewCountAggregateInputType | true;
    _min?: DocumentReviewMinAggregateInputType;
    _max?: DocumentReviewMaxAggregateInputType;
};
export type DocumentReviewGroupByOutputType = {
    id: string;
    driverId: string;
    documentKey: string;
    decision: $Enums.DocumentDecision;
    reason: string | null;
    decidedBy: string | null;
    decidedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    _count: DocumentReviewCountAggregateOutputType | null;
    _min: DocumentReviewMinAggregateOutputType | null;
    _max: DocumentReviewMaxAggregateOutputType | null;
};
export type GetDocumentReviewGroupByPayload<T extends DocumentReviewGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<DocumentReviewGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof DocumentReviewGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], DocumentReviewGroupByOutputType[P]> : Prisma.GetScalarType<T[P], DocumentReviewGroupByOutputType[P]>;
}>>;
export type DocumentReviewWhereInput = {
    AND?: Prisma.DocumentReviewWhereInput | Prisma.DocumentReviewWhereInput[];
    OR?: Prisma.DocumentReviewWhereInput[];
    NOT?: Prisma.DocumentReviewWhereInput | Prisma.DocumentReviewWhereInput[];
    id?: Prisma.UuidFilter<"DocumentReview"> | string;
    driverId?: Prisma.UuidFilter<"DocumentReview"> | string;
    documentKey?: Prisma.StringFilter<"DocumentReview"> | string;
    decision?: Prisma.EnumDocumentDecisionFilter<"DocumentReview"> | $Enums.DocumentDecision;
    reason?: Prisma.StringNullableFilter<"DocumentReview"> | string | null;
    decidedBy?: Prisma.UuidNullableFilter<"DocumentReview"> | string | null;
    decidedAt?: Prisma.DateTimeFilter<"DocumentReview"> | Date | string;
    createdAt?: Prisma.DateTimeFilter<"DocumentReview"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"DocumentReview"> | Date | string;
};
export type DocumentReviewOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    driverId?: Prisma.SortOrder;
    documentKey?: Prisma.SortOrder;
    decision?: Prisma.SortOrder;
    reason?: Prisma.SortOrderInput | Prisma.SortOrder;
    decidedBy?: Prisma.SortOrderInput | Prisma.SortOrder;
    decidedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type DocumentReviewWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    driverId_documentKey?: Prisma.DocumentReviewDriverIdDocumentKeyCompoundUniqueInput;
    AND?: Prisma.DocumentReviewWhereInput | Prisma.DocumentReviewWhereInput[];
    OR?: Prisma.DocumentReviewWhereInput[];
    NOT?: Prisma.DocumentReviewWhereInput | Prisma.DocumentReviewWhereInput[];
    driverId?: Prisma.UuidFilter<"DocumentReview"> | string;
    documentKey?: Prisma.StringFilter<"DocumentReview"> | string;
    decision?: Prisma.EnumDocumentDecisionFilter<"DocumentReview"> | $Enums.DocumentDecision;
    reason?: Prisma.StringNullableFilter<"DocumentReview"> | string | null;
    decidedBy?: Prisma.UuidNullableFilter<"DocumentReview"> | string | null;
    decidedAt?: Prisma.DateTimeFilter<"DocumentReview"> | Date | string;
    createdAt?: Prisma.DateTimeFilter<"DocumentReview"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"DocumentReview"> | Date | string;
}, "id" | "driverId_documentKey">;
export type DocumentReviewOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    driverId?: Prisma.SortOrder;
    documentKey?: Prisma.SortOrder;
    decision?: Prisma.SortOrder;
    reason?: Prisma.SortOrderInput | Prisma.SortOrder;
    decidedBy?: Prisma.SortOrderInput | Prisma.SortOrder;
    decidedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.DocumentReviewCountOrderByAggregateInput;
    _max?: Prisma.DocumentReviewMaxOrderByAggregateInput;
    _min?: Prisma.DocumentReviewMinOrderByAggregateInput;
};
export type DocumentReviewScalarWhereWithAggregatesInput = {
    AND?: Prisma.DocumentReviewScalarWhereWithAggregatesInput | Prisma.DocumentReviewScalarWhereWithAggregatesInput[];
    OR?: Prisma.DocumentReviewScalarWhereWithAggregatesInput[];
    NOT?: Prisma.DocumentReviewScalarWhereWithAggregatesInput | Prisma.DocumentReviewScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"DocumentReview"> | string;
    driverId?: Prisma.UuidWithAggregatesFilter<"DocumentReview"> | string;
    documentKey?: Prisma.StringWithAggregatesFilter<"DocumentReview"> | string;
    decision?: Prisma.EnumDocumentDecisionWithAggregatesFilter<"DocumentReview"> | $Enums.DocumentDecision;
    reason?: Prisma.StringNullableWithAggregatesFilter<"DocumentReview"> | string | null;
    decidedBy?: Prisma.UuidNullableWithAggregatesFilter<"DocumentReview"> | string | null;
    decidedAt?: Prisma.DateTimeWithAggregatesFilter<"DocumentReview"> | Date | string;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"DocumentReview"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"DocumentReview"> | Date | string;
};
export type DocumentReviewCreateInput = {
    id?: string;
    driverId: string;
    documentKey: string;
    decision: $Enums.DocumentDecision;
    reason?: string | null;
    decidedBy?: string | null;
    decidedAt?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type DocumentReviewUncheckedCreateInput = {
    id?: string;
    driverId: string;
    documentKey: string;
    decision: $Enums.DocumentDecision;
    reason?: string | null;
    decidedBy?: string | null;
    decidedAt?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type DocumentReviewUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    driverId?: Prisma.StringFieldUpdateOperationsInput | string;
    documentKey?: Prisma.StringFieldUpdateOperationsInput | string;
    decision?: Prisma.EnumDocumentDecisionFieldUpdateOperationsInput | $Enums.DocumentDecision;
    reason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    decidedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    decidedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DocumentReviewUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    driverId?: Prisma.StringFieldUpdateOperationsInput | string;
    documentKey?: Prisma.StringFieldUpdateOperationsInput | string;
    decision?: Prisma.EnumDocumentDecisionFieldUpdateOperationsInput | $Enums.DocumentDecision;
    reason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    decidedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    decidedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DocumentReviewCreateManyInput = {
    id?: string;
    driverId: string;
    documentKey: string;
    decision: $Enums.DocumentDecision;
    reason?: string | null;
    decidedBy?: string | null;
    decidedAt?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type DocumentReviewUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    driverId?: Prisma.StringFieldUpdateOperationsInput | string;
    documentKey?: Prisma.StringFieldUpdateOperationsInput | string;
    decision?: Prisma.EnumDocumentDecisionFieldUpdateOperationsInput | $Enums.DocumentDecision;
    reason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    decidedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    decidedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DocumentReviewUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    driverId?: Prisma.StringFieldUpdateOperationsInput | string;
    documentKey?: Prisma.StringFieldUpdateOperationsInput | string;
    decision?: Prisma.EnumDocumentDecisionFieldUpdateOperationsInput | $Enums.DocumentDecision;
    reason?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    decidedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    decidedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type DocumentReviewDriverIdDocumentKeyCompoundUniqueInput = {
    driverId: string;
    documentKey: string;
};
export type DocumentReviewCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    driverId?: Prisma.SortOrder;
    documentKey?: Prisma.SortOrder;
    decision?: Prisma.SortOrder;
    reason?: Prisma.SortOrder;
    decidedBy?: Prisma.SortOrder;
    decidedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type DocumentReviewMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    driverId?: Prisma.SortOrder;
    documentKey?: Prisma.SortOrder;
    decision?: Prisma.SortOrder;
    reason?: Prisma.SortOrder;
    decidedBy?: Prisma.SortOrder;
    decidedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type DocumentReviewMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    driverId?: Prisma.SortOrder;
    documentKey?: Prisma.SortOrder;
    decision?: Prisma.SortOrder;
    reason?: Prisma.SortOrder;
    decidedBy?: Prisma.SortOrder;
    decidedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type EnumDocumentDecisionFieldUpdateOperationsInput = {
    set?: $Enums.DocumentDecision;
};
export type DocumentReviewSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    driverId?: boolean;
    documentKey?: boolean;
    decision?: boolean;
    reason?: boolean;
    decidedBy?: boolean;
    decidedAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["documentReview"]>;
export type DocumentReviewSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    driverId?: boolean;
    documentKey?: boolean;
    decision?: boolean;
    reason?: boolean;
    decidedBy?: boolean;
    decidedAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["documentReview"]>;
export type DocumentReviewSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    driverId?: boolean;
    documentKey?: boolean;
    decision?: boolean;
    reason?: boolean;
    decidedBy?: boolean;
    decidedAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["documentReview"]>;
export type DocumentReviewSelectScalar = {
    id?: boolean;
    driverId?: boolean;
    documentKey?: boolean;
    decision?: boolean;
    reason?: boolean;
    decidedBy?: boolean;
    decidedAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type DocumentReviewOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "driverId" | "documentKey" | "decision" | "reason" | "decidedBy" | "decidedAt" | "createdAt" | "updatedAt", ExtArgs["result"]["documentReview"]>;
export type $DocumentReviewPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "DocumentReview";
    objects: {};
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        driverId: string;
        documentKey: string;
        decision: $Enums.DocumentDecision;
        reason: string | null;
        decidedBy: string | null;
        decidedAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["documentReview"]>;
    composites: {};
};
export type DocumentReviewGetPayload<S extends boolean | null | undefined | DocumentReviewDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$DocumentReviewPayload, S>;
export type DocumentReviewCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<DocumentReviewFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: DocumentReviewCountAggregateInputType | true;
};
export interface DocumentReviewDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['DocumentReview'];
        meta: {
            name: 'DocumentReview';
        };
    };
    findUnique<T extends DocumentReviewFindUniqueArgs>(args: Prisma.SelectSubset<T, DocumentReviewFindUniqueArgs<ExtArgs>>): Prisma.Prisma__DocumentReviewClient<runtime.Types.Result.GetResult<Prisma.$DocumentReviewPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends DocumentReviewFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, DocumentReviewFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__DocumentReviewClient<runtime.Types.Result.GetResult<Prisma.$DocumentReviewPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends DocumentReviewFindFirstArgs>(args?: Prisma.SelectSubset<T, DocumentReviewFindFirstArgs<ExtArgs>>): Prisma.Prisma__DocumentReviewClient<runtime.Types.Result.GetResult<Prisma.$DocumentReviewPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends DocumentReviewFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, DocumentReviewFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__DocumentReviewClient<runtime.Types.Result.GetResult<Prisma.$DocumentReviewPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends DocumentReviewFindManyArgs>(args?: Prisma.SelectSubset<T, DocumentReviewFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DocumentReviewPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends DocumentReviewCreateArgs>(args: Prisma.SelectSubset<T, DocumentReviewCreateArgs<ExtArgs>>): Prisma.Prisma__DocumentReviewClient<runtime.Types.Result.GetResult<Prisma.$DocumentReviewPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends DocumentReviewCreateManyArgs>(args?: Prisma.SelectSubset<T, DocumentReviewCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends DocumentReviewCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, DocumentReviewCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DocumentReviewPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends DocumentReviewDeleteArgs>(args: Prisma.SelectSubset<T, DocumentReviewDeleteArgs<ExtArgs>>): Prisma.Prisma__DocumentReviewClient<runtime.Types.Result.GetResult<Prisma.$DocumentReviewPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends DocumentReviewUpdateArgs>(args: Prisma.SelectSubset<T, DocumentReviewUpdateArgs<ExtArgs>>): Prisma.Prisma__DocumentReviewClient<runtime.Types.Result.GetResult<Prisma.$DocumentReviewPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends DocumentReviewDeleteManyArgs>(args?: Prisma.SelectSubset<T, DocumentReviewDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends DocumentReviewUpdateManyArgs>(args: Prisma.SelectSubset<T, DocumentReviewUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends DocumentReviewUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, DocumentReviewUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DocumentReviewPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends DocumentReviewUpsertArgs>(args: Prisma.SelectSubset<T, DocumentReviewUpsertArgs<ExtArgs>>): Prisma.Prisma__DocumentReviewClient<runtime.Types.Result.GetResult<Prisma.$DocumentReviewPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends DocumentReviewCountArgs>(args?: Prisma.Subset<T, DocumentReviewCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], DocumentReviewCountAggregateOutputType> : number>;
    aggregate<T extends DocumentReviewAggregateArgs>(args: Prisma.Subset<T, DocumentReviewAggregateArgs>): Prisma.PrismaPromise<GetDocumentReviewAggregateType<T>>;
    groupBy<T extends DocumentReviewGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: DocumentReviewGroupByArgs['orderBy'];
    } : {
        orderBy?: DocumentReviewGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, DocumentReviewGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDocumentReviewGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: DocumentReviewFieldRefs;
}
export interface Prisma__DocumentReviewClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface DocumentReviewFieldRefs {
    readonly id: Prisma.FieldRef<"DocumentReview", 'String'>;
    readonly driverId: Prisma.FieldRef<"DocumentReview", 'String'>;
    readonly documentKey: Prisma.FieldRef<"DocumentReview", 'String'>;
    readonly decision: Prisma.FieldRef<"DocumentReview", 'DocumentDecision'>;
    readonly reason: Prisma.FieldRef<"DocumentReview", 'String'>;
    readonly decidedBy: Prisma.FieldRef<"DocumentReview", 'String'>;
    readonly decidedAt: Prisma.FieldRef<"DocumentReview", 'DateTime'>;
    readonly createdAt: Prisma.FieldRef<"DocumentReview", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"DocumentReview", 'DateTime'>;
}
export type DocumentReviewFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DocumentReviewSelect<ExtArgs> | null;
    omit?: Prisma.DocumentReviewOmit<ExtArgs> | null;
    where: Prisma.DocumentReviewWhereUniqueInput;
};
export type DocumentReviewFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DocumentReviewSelect<ExtArgs> | null;
    omit?: Prisma.DocumentReviewOmit<ExtArgs> | null;
    where: Prisma.DocumentReviewWhereUniqueInput;
};
export type DocumentReviewFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DocumentReviewSelect<ExtArgs> | null;
    omit?: Prisma.DocumentReviewOmit<ExtArgs> | null;
    where?: Prisma.DocumentReviewWhereInput;
    orderBy?: Prisma.DocumentReviewOrderByWithRelationInput | Prisma.DocumentReviewOrderByWithRelationInput[];
    cursor?: Prisma.DocumentReviewWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DocumentReviewScalarFieldEnum | Prisma.DocumentReviewScalarFieldEnum[];
};
export type DocumentReviewFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DocumentReviewSelect<ExtArgs> | null;
    omit?: Prisma.DocumentReviewOmit<ExtArgs> | null;
    where?: Prisma.DocumentReviewWhereInput;
    orderBy?: Prisma.DocumentReviewOrderByWithRelationInput | Prisma.DocumentReviewOrderByWithRelationInput[];
    cursor?: Prisma.DocumentReviewWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DocumentReviewScalarFieldEnum | Prisma.DocumentReviewScalarFieldEnum[];
};
export type DocumentReviewFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DocumentReviewSelect<ExtArgs> | null;
    omit?: Prisma.DocumentReviewOmit<ExtArgs> | null;
    where?: Prisma.DocumentReviewWhereInput;
    orderBy?: Prisma.DocumentReviewOrderByWithRelationInput | Prisma.DocumentReviewOrderByWithRelationInput[];
    cursor?: Prisma.DocumentReviewWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DocumentReviewScalarFieldEnum | Prisma.DocumentReviewScalarFieldEnum[];
};
export type DocumentReviewCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DocumentReviewSelect<ExtArgs> | null;
    omit?: Prisma.DocumentReviewOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DocumentReviewCreateInput, Prisma.DocumentReviewUncheckedCreateInput>;
};
export type DocumentReviewCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.DocumentReviewCreateManyInput | Prisma.DocumentReviewCreateManyInput[];
    skipDuplicates?: boolean;
};
export type DocumentReviewCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DocumentReviewSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.DocumentReviewOmit<ExtArgs> | null;
    data: Prisma.DocumentReviewCreateManyInput | Prisma.DocumentReviewCreateManyInput[];
    skipDuplicates?: boolean;
};
export type DocumentReviewUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DocumentReviewSelect<ExtArgs> | null;
    omit?: Prisma.DocumentReviewOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DocumentReviewUpdateInput, Prisma.DocumentReviewUncheckedUpdateInput>;
    where: Prisma.DocumentReviewWhereUniqueInput;
};
export type DocumentReviewUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.DocumentReviewUpdateManyMutationInput, Prisma.DocumentReviewUncheckedUpdateManyInput>;
    where?: Prisma.DocumentReviewWhereInput;
    limit?: number;
};
export type DocumentReviewUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DocumentReviewSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.DocumentReviewOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.DocumentReviewUpdateManyMutationInput, Prisma.DocumentReviewUncheckedUpdateManyInput>;
    where?: Prisma.DocumentReviewWhereInput;
    limit?: number;
};
export type DocumentReviewUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DocumentReviewSelect<ExtArgs> | null;
    omit?: Prisma.DocumentReviewOmit<ExtArgs> | null;
    where: Prisma.DocumentReviewWhereUniqueInput;
    create: Prisma.XOR<Prisma.DocumentReviewCreateInput, Prisma.DocumentReviewUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.DocumentReviewUpdateInput, Prisma.DocumentReviewUncheckedUpdateInput>;
};
export type DocumentReviewDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DocumentReviewSelect<ExtArgs> | null;
    omit?: Prisma.DocumentReviewOmit<ExtArgs> | null;
    where: Prisma.DocumentReviewWhereUniqueInput;
};
export type DocumentReviewDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DocumentReviewWhereInput;
    limit?: number;
};
export type DocumentReviewDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.DocumentReviewSelect<ExtArgs> | null;
    omit?: Prisma.DocumentReviewOmit<ExtArgs> | null;
};
