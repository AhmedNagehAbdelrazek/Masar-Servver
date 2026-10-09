import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type UploadedImageModel = runtime.Types.Result.DefaultSelection<Prisma.$UploadedImagePayload>;
export type AggregateUploadedImage = {
    _count: UploadedImageCountAggregateOutputType | null;
    _avg: UploadedImageAvgAggregateOutputType | null;
    _sum: UploadedImageSumAggregateOutputType | null;
    _min: UploadedImageMinAggregateOutputType | null;
    _max: UploadedImageMaxAggregateOutputType | null;
};
export type UploadedImageAvgAggregateOutputType = {
    id: number | null;
    size: number | null;
};
export type UploadedImageSumAggregateOutputType = {
    id: number | null;
    size: number | null;
};
export type UploadedImageMinAggregateOutputType = {
    id: number | null;
    hash: string | null;
    url: string | null;
    filename: string | null;
    mimetype: string | null;
    size: number | null;
    provider: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type UploadedImageMaxAggregateOutputType = {
    id: number | null;
    hash: string | null;
    url: string | null;
    filename: string | null;
    mimetype: string | null;
    size: number | null;
    provider: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type UploadedImageCountAggregateOutputType = {
    id: number;
    hash: number;
    url: number;
    filename: number;
    mimetype: number;
    size: number;
    provider: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type UploadedImageAvgAggregateInputType = {
    id?: true;
    size?: true;
};
export type UploadedImageSumAggregateInputType = {
    id?: true;
    size?: true;
};
export type UploadedImageMinAggregateInputType = {
    id?: true;
    hash?: true;
    url?: true;
    filename?: true;
    mimetype?: true;
    size?: true;
    provider?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type UploadedImageMaxAggregateInputType = {
    id?: true;
    hash?: true;
    url?: true;
    filename?: true;
    mimetype?: true;
    size?: true;
    provider?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type UploadedImageCountAggregateInputType = {
    id?: true;
    hash?: true;
    url?: true;
    filename?: true;
    mimetype?: true;
    size?: true;
    provider?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type UploadedImageAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.UploadedImageWhereInput;
    orderBy?: Prisma.UploadedImageOrderByWithRelationInput | Prisma.UploadedImageOrderByWithRelationInput[];
    cursor?: Prisma.UploadedImageWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | UploadedImageCountAggregateInputType;
    _avg?: UploadedImageAvgAggregateInputType;
    _sum?: UploadedImageSumAggregateInputType;
    _min?: UploadedImageMinAggregateInputType;
    _max?: UploadedImageMaxAggregateInputType;
};
export type GetUploadedImageAggregateType<T extends UploadedImageAggregateArgs> = {
    [P in keyof T & keyof AggregateUploadedImage]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateUploadedImage[P]> : Prisma.GetScalarType<T[P], AggregateUploadedImage[P]>;
};
export type UploadedImageGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.UploadedImageWhereInput;
    orderBy?: Prisma.UploadedImageOrderByWithAggregationInput | Prisma.UploadedImageOrderByWithAggregationInput[];
    by: Prisma.UploadedImageScalarFieldEnum[] | Prisma.UploadedImageScalarFieldEnum;
    having?: Prisma.UploadedImageScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: UploadedImageCountAggregateInputType | true;
    _avg?: UploadedImageAvgAggregateInputType;
    _sum?: UploadedImageSumAggregateInputType;
    _min?: UploadedImageMinAggregateInputType;
    _max?: UploadedImageMaxAggregateInputType;
};
export type UploadedImageGroupByOutputType = {
    id: number;
    hash: string;
    url: string;
    filename: string;
    mimetype: string;
    size: number | null;
    provider: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count: UploadedImageCountAggregateOutputType | null;
    _avg: UploadedImageAvgAggregateOutputType | null;
    _sum: UploadedImageSumAggregateOutputType | null;
    _min: UploadedImageMinAggregateOutputType | null;
    _max: UploadedImageMaxAggregateOutputType | null;
};
export type GetUploadedImageGroupByPayload<T extends UploadedImageGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<UploadedImageGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof UploadedImageGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], UploadedImageGroupByOutputType[P]> : Prisma.GetScalarType<T[P], UploadedImageGroupByOutputType[P]>;
}>>;
export type UploadedImageWhereInput = {
    AND?: Prisma.UploadedImageWhereInput | Prisma.UploadedImageWhereInput[];
    OR?: Prisma.UploadedImageWhereInput[];
    NOT?: Prisma.UploadedImageWhereInput | Prisma.UploadedImageWhereInput[];
    id?: Prisma.IntFilter<"UploadedImage"> | number;
    hash?: Prisma.StringFilter<"UploadedImage"> | string;
    url?: Prisma.StringFilter<"UploadedImage"> | string;
    filename?: Prisma.StringFilter<"UploadedImage"> | string;
    mimetype?: Prisma.StringFilter<"UploadedImage"> | string;
    size?: Prisma.IntNullableFilter<"UploadedImage"> | number | null;
    provider?: Prisma.StringNullableFilter<"UploadedImage"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"UploadedImage"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"UploadedImage"> | Date | string;
    subscriptions?: Prisma.DriverSubscriptionListRelationFilter;
};
export type UploadedImageOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    hash?: Prisma.SortOrder;
    url?: Prisma.SortOrder;
    filename?: Prisma.SortOrder;
    mimetype?: Prisma.SortOrder;
    size?: Prisma.SortOrderInput | Prisma.SortOrder;
    provider?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    subscriptions?: Prisma.DriverSubscriptionOrderByRelationAggregateInput;
};
export type UploadedImageWhereUniqueInput = Prisma.AtLeast<{
    id?: number;
    hash?: string;
    AND?: Prisma.UploadedImageWhereInput | Prisma.UploadedImageWhereInput[];
    OR?: Prisma.UploadedImageWhereInput[];
    NOT?: Prisma.UploadedImageWhereInput | Prisma.UploadedImageWhereInput[];
    url?: Prisma.StringFilter<"UploadedImage"> | string;
    filename?: Prisma.StringFilter<"UploadedImage"> | string;
    mimetype?: Prisma.StringFilter<"UploadedImage"> | string;
    size?: Prisma.IntNullableFilter<"UploadedImage"> | number | null;
    provider?: Prisma.StringNullableFilter<"UploadedImage"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"UploadedImage"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"UploadedImage"> | Date | string;
    subscriptions?: Prisma.DriverSubscriptionListRelationFilter;
}, "id" | "hash">;
export type UploadedImageOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    hash?: Prisma.SortOrder;
    url?: Prisma.SortOrder;
    filename?: Prisma.SortOrder;
    mimetype?: Prisma.SortOrder;
    size?: Prisma.SortOrderInput | Prisma.SortOrder;
    provider?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.UploadedImageCountOrderByAggregateInput;
    _avg?: Prisma.UploadedImageAvgOrderByAggregateInput;
    _max?: Prisma.UploadedImageMaxOrderByAggregateInput;
    _min?: Prisma.UploadedImageMinOrderByAggregateInput;
    _sum?: Prisma.UploadedImageSumOrderByAggregateInput;
};
export type UploadedImageScalarWhereWithAggregatesInput = {
    AND?: Prisma.UploadedImageScalarWhereWithAggregatesInput | Prisma.UploadedImageScalarWhereWithAggregatesInput[];
    OR?: Prisma.UploadedImageScalarWhereWithAggregatesInput[];
    NOT?: Prisma.UploadedImageScalarWhereWithAggregatesInput | Prisma.UploadedImageScalarWhereWithAggregatesInput[];
    id?: Prisma.IntWithAggregatesFilter<"UploadedImage"> | number;
    hash?: Prisma.StringWithAggregatesFilter<"UploadedImage"> | string;
    url?: Prisma.StringWithAggregatesFilter<"UploadedImage"> | string;
    filename?: Prisma.StringWithAggregatesFilter<"UploadedImage"> | string;
    mimetype?: Prisma.StringWithAggregatesFilter<"UploadedImage"> | string;
    size?: Prisma.IntNullableWithAggregatesFilter<"UploadedImage"> | number | null;
    provider?: Prisma.StringNullableWithAggregatesFilter<"UploadedImage"> | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"UploadedImage"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"UploadedImage"> | Date | string;
};
export type UploadedImageCreateInput = {
    hash: string;
    url: string;
    filename: string;
    mimetype: string;
    size?: number | null;
    provider?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    subscriptions?: Prisma.DriverSubscriptionCreateNestedManyWithoutScreenshotInput;
};
export type UploadedImageUncheckedCreateInput = {
    id?: number;
    hash: string;
    url: string;
    filename: string;
    mimetype: string;
    size?: number | null;
    provider?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    subscriptions?: Prisma.DriverSubscriptionUncheckedCreateNestedManyWithoutScreenshotInput;
};
export type UploadedImageUpdateInput = {
    hash?: Prisma.StringFieldUpdateOperationsInput | string;
    url?: Prisma.StringFieldUpdateOperationsInput | string;
    filename?: Prisma.StringFieldUpdateOperationsInput | string;
    mimetype?: Prisma.StringFieldUpdateOperationsInput | string;
    size?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    provider?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    subscriptions?: Prisma.DriverSubscriptionUpdateManyWithoutScreenshotNestedInput;
};
export type UploadedImageUncheckedUpdateInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    hash?: Prisma.StringFieldUpdateOperationsInput | string;
    url?: Prisma.StringFieldUpdateOperationsInput | string;
    filename?: Prisma.StringFieldUpdateOperationsInput | string;
    mimetype?: Prisma.StringFieldUpdateOperationsInput | string;
    size?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    provider?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    subscriptions?: Prisma.DriverSubscriptionUncheckedUpdateManyWithoutScreenshotNestedInput;
};
export type UploadedImageCreateManyInput = {
    id?: number;
    hash: string;
    url: string;
    filename: string;
    mimetype: string;
    size?: number | null;
    provider?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type UploadedImageUpdateManyMutationInput = {
    hash?: Prisma.StringFieldUpdateOperationsInput | string;
    url?: Prisma.StringFieldUpdateOperationsInput | string;
    filename?: Prisma.StringFieldUpdateOperationsInput | string;
    mimetype?: Prisma.StringFieldUpdateOperationsInput | string;
    size?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    provider?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UploadedImageUncheckedUpdateManyInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    hash?: Prisma.StringFieldUpdateOperationsInput | string;
    url?: Prisma.StringFieldUpdateOperationsInput | string;
    filename?: Prisma.StringFieldUpdateOperationsInput | string;
    mimetype?: Prisma.StringFieldUpdateOperationsInput | string;
    size?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    provider?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UploadedImageNullableScalarRelationFilter = {
    is?: Prisma.UploadedImageWhereInput | null;
    isNot?: Prisma.UploadedImageWhereInput | null;
};
export type UploadedImageCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    hash?: Prisma.SortOrder;
    url?: Prisma.SortOrder;
    filename?: Prisma.SortOrder;
    mimetype?: Prisma.SortOrder;
    size?: Prisma.SortOrder;
    provider?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type UploadedImageAvgOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    size?: Prisma.SortOrder;
};
export type UploadedImageMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    hash?: Prisma.SortOrder;
    url?: Prisma.SortOrder;
    filename?: Prisma.SortOrder;
    mimetype?: Prisma.SortOrder;
    size?: Prisma.SortOrder;
    provider?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type UploadedImageMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    hash?: Prisma.SortOrder;
    url?: Prisma.SortOrder;
    filename?: Prisma.SortOrder;
    mimetype?: Prisma.SortOrder;
    size?: Prisma.SortOrder;
    provider?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type UploadedImageSumOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    size?: Prisma.SortOrder;
};
export type UploadedImageCreateNestedOneWithoutSubscriptionsInput = {
    create?: Prisma.XOR<Prisma.UploadedImageCreateWithoutSubscriptionsInput, Prisma.UploadedImageUncheckedCreateWithoutSubscriptionsInput>;
    connectOrCreate?: Prisma.UploadedImageCreateOrConnectWithoutSubscriptionsInput;
    connect?: Prisma.UploadedImageWhereUniqueInput;
};
export type UploadedImageUpdateOneWithoutSubscriptionsNestedInput = {
    create?: Prisma.XOR<Prisma.UploadedImageCreateWithoutSubscriptionsInput, Prisma.UploadedImageUncheckedCreateWithoutSubscriptionsInput>;
    connectOrCreate?: Prisma.UploadedImageCreateOrConnectWithoutSubscriptionsInput;
    upsert?: Prisma.UploadedImageUpsertWithoutSubscriptionsInput;
    disconnect?: Prisma.UploadedImageWhereInput | boolean;
    delete?: Prisma.UploadedImageWhereInput | boolean;
    connect?: Prisma.UploadedImageWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.UploadedImageUpdateToOneWithWhereWithoutSubscriptionsInput, Prisma.UploadedImageUpdateWithoutSubscriptionsInput>, Prisma.UploadedImageUncheckedUpdateWithoutSubscriptionsInput>;
};
export type UploadedImageCreateWithoutSubscriptionsInput = {
    hash: string;
    url: string;
    filename: string;
    mimetype: string;
    size?: number | null;
    provider?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type UploadedImageUncheckedCreateWithoutSubscriptionsInput = {
    id?: number;
    hash: string;
    url: string;
    filename: string;
    mimetype: string;
    size?: number | null;
    provider?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type UploadedImageCreateOrConnectWithoutSubscriptionsInput = {
    where: Prisma.UploadedImageWhereUniqueInput;
    create: Prisma.XOR<Prisma.UploadedImageCreateWithoutSubscriptionsInput, Prisma.UploadedImageUncheckedCreateWithoutSubscriptionsInput>;
};
export type UploadedImageUpsertWithoutSubscriptionsInput = {
    update: Prisma.XOR<Prisma.UploadedImageUpdateWithoutSubscriptionsInput, Prisma.UploadedImageUncheckedUpdateWithoutSubscriptionsInput>;
    create: Prisma.XOR<Prisma.UploadedImageCreateWithoutSubscriptionsInput, Prisma.UploadedImageUncheckedCreateWithoutSubscriptionsInput>;
    where?: Prisma.UploadedImageWhereInput;
};
export type UploadedImageUpdateToOneWithWhereWithoutSubscriptionsInput = {
    where?: Prisma.UploadedImageWhereInput;
    data: Prisma.XOR<Prisma.UploadedImageUpdateWithoutSubscriptionsInput, Prisma.UploadedImageUncheckedUpdateWithoutSubscriptionsInput>;
};
export type UploadedImageUpdateWithoutSubscriptionsInput = {
    hash?: Prisma.StringFieldUpdateOperationsInput | string;
    url?: Prisma.StringFieldUpdateOperationsInput | string;
    filename?: Prisma.StringFieldUpdateOperationsInput | string;
    mimetype?: Prisma.StringFieldUpdateOperationsInput | string;
    size?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    provider?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UploadedImageUncheckedUpdateWithoutSubscriptionsInput = {
    id?: Prisma.IntFieldUpdateOperationsInput | number;
    hash?: Prisma.StringFieldUpdateOperationsInput | string;
    url?: Prisma.StringFieldUpdateOperationsInput | string;
    filename?: Prisma.StringFieldUpdateOperationsInput | string;
    mimetype?: Prisma.StringFieldUpdateOperationsInput | string;
    size?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    provider?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type UploadedImageCountOutputType = {
    subscriptions: number;
};
export type UploadedImageCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    subscriptions?: boolean | UploadedImageCountOutputTypeCountSubscriptionsArgs;
};
export type UploadedImageCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UploadedImageCountOutputTypeSelect<ExtArgs> | null;
};
export type UploadedImageCountOutputTypeCountSubscriptionsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DriverSubscriptionWhereInput;
};
export type UploadedImageSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    hash?: boolean;
    url?: boolean;
    filename?: boolean;
    mimetype?: boolean;
    size?: boolean;
    provider?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    subscriptions?: boolean | Prisma.UploadedImage$subscriptionsArgs<ExtArgs>;
    _count?: boolean | Prisma.UploadedImageCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["uploadedImage"]>;
export type UploadedImageSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    hash?: boolean;
    url?: boolean;
    filename?: boolean;
    mimetype?: boolean;
    size?: boolean;
    provider?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["uploadedImage"]>;
export type UploadedImageSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    hash?: boolean;
    url?: boolean;
    filename?: boolean;
    mimetype?: boolean;
    size?: boolean;
    provider?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
}, ExtArgs["result"]["uploadedImage"]>;
export type UploadedImageSelectScalar = {
    id?: boolean;
    hash?: boolean;
    url?: boolean;
    filename?: boolean;
    mimetype?: boolean;
    size?: boolean;
    provider?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type UploadedImageOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "hash" | "url" | "filename" | "mimetype" | "size" | "provider" | "createdAt" | "updatedAt", ExtArgs["result"]["uploadedImage"]>;
export type UploadedImageInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    subscriptions?: boolean | Prisma.UploadedImage$subscriptionsArgs<ExtArgs>;
    _count?: boolean | Prisma.UploadedImageCountOutputTypeDefaultArgs<ExtArgs>;
};
export type UploadedImageIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type UploadedImageIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $UploadedImagePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "UploadedImage";
    objects: {
        subscriptions: Prisma.$DriverSubscriptionPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: number;
        hash: string;
        url: string;
        filename: string;
        mimetype: string;
        size: number | null;
        provider: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["uploadedImage"]>;
    composites: {};
};
export type UploadedImageGetPayload<S extends boolean | null | undefined | UploadedImageDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$UploadedImagePayload, S>;
export type UploadedImageCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<UploadedImageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: UploadedImageCountAggregateInputType | true;
};
export interface UploadedImageDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['UploadedImage'];
        meta: {
            name: 'UploadedImage';
        };
    };
    findUnique<T extends UploadedImageFindUniqueArgs>(args: Prisma.SelectSubset<T, UploadedImageFindUniqueArgs<ExtArgs>>): Prisma.Prisma__UploadedImageClient<runtime.Types.Result.GetResult<Prisma.$UploadedImagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends UploadedImageFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, UploadedImageFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__UploadedImageClient<runtime.Types.Result.GetResult<Prisma.$UploadedImagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends UploadedImageFindFirstArgs>(args?: Prisma.SelectSubset<T, UploadedImageFindFirstArgs<ExtArgs>>): Prisma.Prisma__UploadedImageClient<runtime.Types.Result.GetResult<Prisma.$UploadedImagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends UploadedImageFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, UploadedImageFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__UploadedImageClient<runtime.Types.Result.GetResult<Prisma.$UploadedImagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends UploadedImageFindManyArgs>(args?: Prisma.SelectSubset<T, UploadedImageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UploadedImagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends UploadedImageCreateArgs>(args: Prisma.SelectSubset<T, UploadedImageCreateArgs<ExtArgs>>): Prisma.Prisma__UploadedImageClient<runtime.Types.Result.GetResult<Prisma.$UploadedImagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends UploadedImageCreateManyArgs>(args?: Prisma.SelectSubset<T, UploadedImageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends UploadedImageCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, UploadedImageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UploadedImagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends UploadedImageDeleteArgs>(args: Prisma.SelectSubset<T, UploadedImageDeleteArgs<ExtArgs>>): Prisma.Prisma__UploadedImageClient<runtime.Types.Result.GetResult<Prisma.$UploadedImagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends UploadedImageUpdateArgs>(args: Prisma.SelectSubset<T, UploadedImageUpdateArgs<ExtArgs>>): Prisma.Prisma__UploadedImageClient<runtime.Types.Result.GetResult<Prisma.$UploadedImagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends UploadedImageDeleteManyArgs>(args?: Prisma.SelectSubset<T, UploadedImageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends UploadedImageUpdateManyArgs>(args: Prisma.SelectSubset<T, UploadedImageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends UploadedImageUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, UploadedImageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$UploadedImagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends UploadedImageUpsertArgs>(args: Prisma.SelectSubset<T, UploadedImageUpsertArgs<ExtArgs>>): Prisma.Prisma__UploadedImageClient<runtime.Types.Result.GetResult<Prisma.$UploadedImagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends UploadedImageCountArgs>(args?: Prisma.Subset<T, UploadedImageCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], UploadedImageCountAggregateOutputType> : number>;
    aggregate<T extends UploadedImageAggregateArgs>(args: Prisma.Subset<T, UploadedImageAggregateArgs>): Prisma.PrismaPromise<GetUploadedImageAggregateType<T>>;
    groupBy<T extends UploadedImageGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: UploadedImageGroupByArgs['orderBy'];
    } : {
        orderBy?: UploadedImageGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, UploadedImageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUploadedImageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: UploadedImageFieldRefs;
}
export interface Prisma__UploadedImageClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    subscriptions<T extends Prisma.UploadedImage$subscriptionsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UploadedImage$subscriptionsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DriverSubscriptionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface UploadedImageFieldRefs {
    readonly id: Prisma.FieldRef<"UploadedImage", 'Int'>;
    readonly hash: Prisma.FieldRef<"UploadedImage", 'String'>;
    readonly url: Prisma.FieldRef<"UploadedImage", 'String'>;
    readonly filename: Prisma.FieldRef<"UploadedImage", 'String'>;
    readonly mimetype: Prisma.FieldRef<"UploadedImage", 'String'>;
    readonly size: Prisma.FieldRef<"UploadedImage", 'Int'>;
    readonly provider: Prisma.FieldRef<"UploadedImage", 'String'>;
    readonly createdAt: Prisma.FieldRef<"UploadedImage", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"UploadedImage", 'DateTime'>;
}
export type UploadedImageFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UploadedImageSelect<ExtArgs> | null;
    omit?: Prisma.UploadedImageOmit<ExtArgs> | null;
    include?: Prisma.UploadedImageInclude<ExtArgs> | null;
    where: Prisma.UploadedImageWhereUniqueInput;
};
export type UploadedImageFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UploadedImageSelect<ExtArgs> | null;
    omit?: Prisma.UploadedImageOmit<ExtArgs> | null;
    include?: Prisma.UploadedImageInclude<ExtArgs> | null;
    where: Prisma.UploadedImageWhereUniqueInput;
};
export type UploadedImageFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UploadedImageSelect<ExtArgs> | null;
    omit?: Prisma.UploadedImageOmit<ExtArgs> | null;
    include?: Prisma.UploadedImageInclude<ExtArgs> | null;
    where?: Prisma.UploadedImageWhereInput;
    orderBy?: Prisma.UploadedImageOrderByWithRelationInput | Prisma.UploadedImageOrderByWithRelationInput[];
    cursor?: Prisma.UploadedImageWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.UploadedImageScalarFieldEnum | Prisma.UploadedImageScalarFieldEnum[];
};
export type UploadedImageFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UploadedImageSelect<ExtArgs> | null;
    omit?: Prisma.UploadedImageOmit<ExtArgs> | null;
    include?: Prisma.UploadedImageInclude<ExtArgs> | null;
    where?: Prisma.UploadedImageWhereInput;
    orderBy?: Prisma.UploadedImageOrderByWithRelationInput | Prisma.UploadedImageOrderByWithRelationInput[];
    cursor?: Prisma.UploadedImageWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.UploadedImageScalarFieldEnum | Prisma.UploadedImageScalarFieldEnum[];
};
export type UploadedImageFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UploadedImageSelect<ExtArgs> | null;
    omit?: Prisma.UploadedImageOmit<ExtArgs> | null;
    include?: Prisma.UploadedImageInclude<ExtArgs> | null;
    where?: Prisma.UploadedImageWhereInput;
    orderBy?: Prisma.UploadedImageOrderByWithRelationInput | Prisma.UploadedImageOrderByWithRelationInput[];
    cursor?: Prisma.UploadedImageWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.UploadedImageScalarFieldEnum | Prisma.UploadedImageScalarFieldEnum[];
};
export type UploadedImageCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UploadedImageSelect<ExtArgs> | null;
    omit?: Prisma.UploadedImageOmit<ExtArgs> | null;
    include?: Prisma.UploadedImageInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.UploadedImageCreateInput, Prisma.UploadedImageUncheckedCreateInput>;
};
export type UploadedImageCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.UploadedImageCreateManyInput | Prisma.UploadedImageCreateManyInput[];
    skipDuplicates?: boolean;
};
export type UploadedImageCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UploadedImageSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.UploadedImageOmit<ExtArgs> | null;
    data: Prisma.UploadedImageCreateManyInput | Prisma.UploadedImageCreateManyInput[];
    skipDuplicates?: boolean;
};
export type UploadedImageUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UploadedImageSelect<ExtArgs> | null;
    omit?: Prisma.UploadedImageOmit<ExtArgs> | null;
    include?: Prisma.UploadedImageInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.UploadedImageUpdateInput, Prisma.UploadedImageUncheckedUpdateInput>;
    where: Prisma.UploadedImageWhereUniqueInput;
};
export type UploadedImageUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.UploadedImageUpdateManyMutationInput, Prisma.UploadedImageUncheckedUpdateManyInput>;
    where?: Prisma.UploadedImageWhereInput;
    limit?: number;
};
export type UploadedImageUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UploadedImageSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.UploadedImageOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.UploadedImageUpdateManyMutationInput, Prisma.UploadedImageUncheckedUpdateManyInput>;
    where?: Prisma.UploadedImageWhereInput;
    limit?: number;
};
export type UploadedImageUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UploadedImageSelect<ExtArgs> | null;
    omit?: Prisma.UploadedImageOmit<ExtArgs> | null;
    include?: Prisma.UploadedImageInclude<ExtArgs> | null;
    where: Prisma.UploadedImageWhereUniqueInput;
    create: Prisma.XOR<Prisma.UploadedImageCreateInput, Prisma.UploadedImageUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.UploadedImageUpdateInput, Prisma.UploadedImageUncheckedUpdateInput>;
};
export type UploadedImageDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UploadedImageSelect<ExtArgs> | null;
    omit?: Prisma.UploadedImageOmit<ExtArgs> | null;
    include?: Prisma.UploadedImageInclude<ExtArgs> | null;
    where: Prisma.UploadedImageWhereUniqueInput;
};
export type UploadedImageDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.UploadedImageWhereInput;
    limit?: number;
};
export type UploadedImage$subscriptionsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type UploadedImageDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UploadedImageSelect<ExtArgs> | null;
    omit?: Prisma.UploadedImageOmit<ExtArgs> | null;
    include?: Prisma.UploadedImageInclude<ExtArgs> | null;
};
