import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type FavoriteRouteModel = runtime.Types.Result.DefaultSelection<Prisma.$FavoriteRoutePayload>;
export type AggregateFavoriteRoute = {
    _count: FavoriteRouteCountAggregateOutputType | null;
    _min: FavoriteRouteMinAggregateOutputType | null;
    _max: FavoriteRouteMaxAggregateOutputType | null;
};
export type FavoriteRouteMinAggregateOutputType = {
    id: string | null;
    passengerId: string | null;
    originCity: string | null;
    destinationCity: string | null;
    label: string | null;
    createdAt: Date | null;
};
export type FavoriteRouteMaxAggregateOutputType = {
    id: string | null;
    passengerId: string | null;
    originCity: string | null;
    destinationCity: string | null;
    label: string | null;
    createdAt: Date | null;
};
export type FavoriteRouteCountAggregateOutputType = {
    id: number;
    passengerId: number;
    originCity: number;
    destinationCity: number;
    label: number;
    createdAt: number;
    _all: number;
};
export type FavoriteRouteMinAggregateInputType = {
    id?: true;
    passengerId?: true;
    originCity?: true;
    destinationCity?: true;
    label?: true;
    createdAt?: true;
};
export type FavoriteRouteMaxAggregateInputType = {
    id?: true;
    passengerId?: true;
    originCity?: true;
    destinationCity?: true;
    label?: true;
    createdAt?: true;
};
export type FavoriteRouteCountAggregateInputType = {
    id?: true;
    passengerId?: true;
    originCity?: true;
    destinationCity?: true;
    label?: true;
    createdAt?: true;
    _all?: true;
};
export type FavoriteRouteAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.FavoriteRouteWhereInput;
    orderBy?: Prisma.FavoriteRouteOrderByWithRelationInput | Prisma.FavoriteRouteOrderByWithRelationInput[];
    cursor?: Prisma.FavoriteRouteWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | FavoriteRouteCountAggregateInputType;
    _min?: FavoriteRouteMinAggregateInputType;
    _max?: FavoriteRouteMaxAggregateInputType;
};
export type GetFavoriteRouteAggregateType<T extends FavoriteRouteAggregateArgs> = {
    [P in keyof T & keyof AggregateFavoriteRoute]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateFavoriteRoute[P]> : Prisma.GetScalarType<T[P], AggregateFavoriteRoute[P]>;
};
export type FavoriteRouteGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.FavoriteRouteWhereInput;
    orderBy?: Prisma.FavoriteRouteOrderByWithAggregationInput | Prisma.FavoriteRouteOrderByWithAggregationInput[];
    by: Prisma.FavoriteRouteScalarFieldEnum[] | Prisma.FavoriteRouteScalarFieldEnum;
    having?: Prisma.FavoriteRouteScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: FavoriteRouteCountAggregateInputType | true;
    _min?: FavoriteRouteMinAggregateInputType;
    _max?: FavoriteRouteMaxAggregateInputType;
};
export type FavoriteRouteGroupByOutputType = {
    id: string;
    passengerId: string;
    originCity: string;
    destinationCity: string;
    label: string | null;
    createdAt: Date;
    _count: FavoriteRouteCountAggregateOutputType | null;
    _min: FavoriteRouteMinAggregateOutputType | null;
    _max: FavoriteRouteMaxAggregateOutputType | null;
};
export type GetFavoriteRouteGroupByPayload<T extends FavoriteRouteGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<FavoriteRouteGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof FavoriteRouteGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], FavoriteRouteGroupByOutputType[P]> : Prisma.GetScalarType<T[P], FavoriteRouteGroupByOutputType[P]>;
}>>;
export type FavoriteRouteWhereInput = {
    AND?: Prisma.FavoriteRouteWhereInput | Prisma.FavoriteRouteWhereInput[];
    OR?: Prisma.FavoriteRouteWhereInput[];
    NOT?: Prisma.FavoriteRouteWhereInput | Prisma.FavoriteRouteWhereInput[];
    id?: Prisma.UuidFilter<"FavoriteRoute"> | string;
    passengerId?: Prisma.UuidFilter<"FavoriteRoute"> | string;
    originCity?: Prisma.StringFilter<"FavoriteRoute"> | string;
    destinationCity?: Prisma.StringFilter<"FavoriteRoute"> | string;
    label?: Prisma.StringNullableFilter<"FavoriteRoute"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"FavoriteRoute"> | Date | string;
    passenger?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
};
export type FavoriteRouteOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    passengerId?: Prisma.SortOrder;
    originCity?: Prisma.SortOrder;
    destinationCity?: Prisma.SortOrder;
    label?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    passenger?: Prisma.UserOrderByWithRelationInput;
};
export type FavoriteRouteWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    passengerId_originCity_destinationCity?: Prisma.FavoriteRoutePassengerIdOriginCityDestinationCityCompoundUniqueInput;
    AND?: Prisma.FavoriteRouteWhereInput | Prisma.FavoriteRouteWhereInput[];
    OR?: Prisma.FavoriteRouteWhereInput[];
    NOT?: Prisma.FavoriteRouteWhereInput | Prisma.FavoriteRouteWhereInput[];
    passengerId?: Prisma.UuidFilter<"FavoriteRoute"> | string;
    originCity?: Prisma.StringFilter<"FavoriteRoute"> | string;
    destinationCity?: Prisma.StringFilter<"FavoriteRoute"> | string;
    label?: Prisma.StringNullableFilter<"FavoriteRoute"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"FavoriteRoute"> | Date | string;
    passenger?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
}, "id" | "passengerId_originCity_destinationCity">;
export type FavoriteRouteOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    passengerId?: Prisma.SortOrder;
    originCity?: Prisma.SortOrder;
    destinationCity?: Prisma.SortOrder;
    label?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.FavoriteRouteCountOrderByAggregateInput;
    _max?: Prisma.FavoriteRouteMaxOrderByAggregateInput;
    _min?: Prisma.FavoriteRouteMinOrderByAggregateInput;
};
export type FavoriteRouteScalarWhereWithAggregatesInput = {
    AND?: Prisma.FavoriteRouteScalarWhereWithAggregatesInput | Prisma.FavoriteRouteScalarWhereWithAggregatesInput[];
    OR?: Prisma.FavoriteRouteScalarWhereWithAggregatesInput[];
    NOT?: Prisma.FavoriteRouteScalarWhereWithAggregatesInput | Prisma.FavoriteRouteScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"FavoriteRoute"> | string;
    passengerId?: Prisma.UuidWithAggregatesFilter<"FavoriteRoute"> | string;
    originCity?: Prisma.StringWithAggregatesFilter<"FavoriteRoute"> | string;
    destinationCity?: Prisma.StringWithAggregatesFilter<"FavoriteRoute"> | string;
    label?: Prisma.StringNullableWithAggregatesFilter<"FavoriteRoute"> | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"FavoriteRoute"> | Date | string;
};
export type FavoriteRouteCreateInput = {
    id?: string;
    originCity: string;
    destinationCity: string;
    label?: string | null;
    createdAt?: Date | string;
    passenger: Prisma.UserCreateNestedOneWithoutFavoriteRoutesInput;
};
export type FavoriteRouteUncheckedCreateInput = {
    id?: string;
    passengerId: string;
    originCity: string;
    destinationCity: string;
    label?: string | null;
    createdAt?: Date | string;
};
export type FavoriteRouteUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    originCity?: Prisma.StringFieldUpdateOperationsInput | string;
    destinationCity?: Prisma.StringFieldUpdateOperationsInput | string;
    label?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    passenger?: Prisma.UserUpdateOneRequiredWithoutFavoriteRoutesNestedInput;
};
export type FavoriteRouteUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    passengerId?: Prisma.StringFieldUpdateOperationsInput | string;
    originCity?: Prisma.StringFieldUpdateOperationsInput | string;
    destinationCity?: Prisma.StringFieldUpdateOperationsInput | string;
    label?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FavoriteRouteCreateManyInput = {
    id?: string;
    passengerId: string;
    originCity: string;
    destinationCity: string;
    label?: string | null;
    createdAt?: Date | string;
};
export type FavoriteRouteUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    originCity?: Prisma.StringFieldUpdateOperationsInput | string;
    destinationCity?: Prisma.StringFieldUpdateOperationsInput | string;
    label?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FavoriteRouteUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    passengerId?: Prisma.StringFieldUpdateOperationsInput | string;
    originCity?: Prisma.StringFieldUpdateOperationsInput | string;
    destinationCity?: Prisma.StringFieldUpdateOperationsInput | string;
    label?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FavoriteRouteListRelationFilter = {
    every?: Prisma.FavoriteRouteWhereInput;
    some?: Prisma.FavoriteRouteWhereInput;
    none?: Prisma.FavoriteRouteWhereInput;
};
export type FavoriteRouteOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type FavoriteRoutePassengerIdOriginCityDestinationCityCompoundUniqueInput = {
    passengerId: string;
    originCity: string;
    destinationCity: string;
};
export type FavoriteRouteCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    passengerId?: Prisma.SortOrder;
    originCity?: Prisma.SortOrder;
    destinationCity?: Prisma.SortOrder;
    label?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type FavoriteRouteMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    passengerId?: Prisma.SortOrder;
    originCity?: Prisma.SortOrder;
    destinationCity?: Prisma.SortOrder;
    label?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type FavoriteRouteMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    passengerId?: Prisma.SortOrder;
    originCity?: Prisma.SortOrder;
    destinationCity?: Prisma.SortOrder;
    label?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type FavoriteRouteCreateNestedManyWithoutPassengerInput = {
    create?: Prisma.XOR<Prisma.FavoriteRouteCreateWithoutPassengerInput, Prisma.FavoriteRouteUncheckedCreateWithoutPassengerInput> | Prisma.FavoriteRouteCreateWithoutPassengerInput[] | Prisma.FavoriteRouteUncheckedCreateWithoutPassengerInput[];
    connectOrCreate?: Prisma.FavoriteRouteCreateOrConnectWithoutPassengerInput | Prisma.FavoriteRouteCreateOrConnectWithoutPassengerInput[];
    createMany?: Prisma.FavoriteRouteCreateManyPassengerInputEnvelope;
    connect?: Prisma.FavoriteRouteWhereUniqueInput | Prisma.FavoriteRouteWhereUniqueInput[];
};
export type FavoriteRouteUncheckedCreateNestedManyWithoutPassengerInput = {
    create?: Prisma.XOR<Prisma.FavoriteRouteCreateWithoutPassengerInput, Prisma.FavoriteRouteUncheckedCreateWithoutPassengerInput> | Prisma.FavoriteRouteCreateWithoutPassengerInput[] | Prisma.FavoriteRouteUncheckedCreateWithoutPassengerInput[];
    connectOrCreate?: Prisma.FavoriteRouteCreateOrConnectWithoutPassengerInput | Prisma.FavoriteRouteCreateOrConnectWithoutPassengerInput[];
    createMany?: Prisma.FavoriteRouteCreateManyPassengerInputEnvelope;
    connect?: Prisma.FavoriteRouteWhereUniqueInput | Prisma.FavoriteRouteWhereUniqueInput[];
};
export type FavoriteRouteUpdateManyWithoutPassengerNestedInput = {
    create?: Prisma.XOR<Prisma.FavoriteRouteCreateWithoutPassengerInput, Prisma.FavoriteRouteUncheckedCreateWithoutPassengerInput> | Prisma.FavoriteRouteCreateWithoutPassengerInput[] | Prisma.FavoriteRouteUncheckedCreateWithoutPassengerInput[];
    connectOrCreate?: Prisma.FavoriteRouteCreateOrConnectWithoutPassengerInput | Prisma.FavoriteRouteCreateOrConnectWithoutPassengerInput[];
    upsert?: Prisma.FavoriteRouteUpsertWithWhereUniqueWithoutPassengerInput | Prisma.FavoriteRouteUpsertWithWhereUniqueWithoutPassengerInput[];
    createMany?: Prisma.FavoriteRouteCreateManyPassengerInputEnvelope;
    set?: Prisma.FavoriteRouteWhereUniqueInput | Prisma.FavoriteRouteWhereUniqueInput[];
    disconnect?: Prisma.FavoriteRouteWhereUniqueInput | Prisma.FavoriteRouteWhereUniqueInput[];
    delete?: Prisma.FavoriteRouteWhereUniqueInput | Prisma.FavoriteRouteWhereUniqueInput[];
    connect?: Prisma.FavoriteRouteWhereUniqueInput | Prisma.FavoriteRouteWhereUniqueInput[];
    update?: Prisma.FavoriteRouteUpdateWithWhereUniqueWithoutPassengerInput | Prisma.FavoriteRouteUpdateWithWhereUniqueWithoutPassengerInput[];
    updateMany?: Prisma.FavoriteRouteUpdateManyWithWhereWithoutPassengerInput | Prisma.FavoriteRouteUpdateManyWithWhereWithoutPassengerInput[];
    deleteMany?: Prisma.FavoriteRouteScalarWhereInput | Prisma.FavoriteRouteScalarWhereInput[];
};
export type FavoriteRouteUncheckedUpdateManyWithoutPassengerNestedInput = {
    create?: Prisma.XOR<Prisma.FavoriteRouteCreateWithoutPassengerInput, Prisma.FavoriteRouteUncheckedCreateWithoutPassengerInput> | Prisma.FavoriteRouteCreateWithoutPassengerInput[] | Prisma.FavoriteRouteUncheckedCreateWithoutPassengerInput[];
    connectOrCreate?: Prisma.FavoriteRouteCreateOrConnectWithoutPassengerInput | Prisma.FavoriteRouteCreateOrConnectWithoutPassengerInput[];
    upsert?: Prisma.FavoriteRouteUpsertWithWhereUniqueWithoutPassengerInput | Prisma.FavoriteRouteUpsertWithWhereUniqueWithoutPassengerInput[];
    createMany?: Prisma.FavoriteRouteCreateManyPassengerInputEnvelope;
    set?: Prisma.FavoriteRouteWhereUniqueInput | Prisma.FavoriteRouteWhereUniqueInput[];
    disconnect?: Prisma.FavoriteRouteWhereUniqueInput | Prisma.FavoriteRouteWhereUniqueInput[];
    delete?: Prisma.FavoriteRouteWhereUniqueInput | Prisma.FavoriteRouteWhereUniqueInput[];
    connect?: Prisma.FavoriteRouteWhereUniqueInput | Prisma.FavoriteRouteWhereUniqueInput[];
    update?: Prisma.FavoriteRouteUpdateWithWhereUniqueWithoutPassengerInput | Prisma.FavoriteRouteUpdateWithWhereUniqueWithoutPassengerInput[];
    updateMany?: Prisma.FavoriteRouteUpdateManyWithWhereWithoutPassengerInput | Prisma.FavoriteRouteUpdateManyWithWhereWithoutPassengerInput[];
    deleteMany?: Prisma.FavoriteRouteScalarWhereInput | Prisma.FavoriteRouteScalarWhereInput[];
};
export type FavoriteRouteCreateWithoutPassengerInput = {
    id?: string;
    originCity: string;
    destinationCity: string;
    label?: string | null;
    createdAt?: Date | string;
};
export type FavoriteRouteUncheckedCreateWithoutPassengerInput = {
    id?: string;
    originCity: string;
    destinationCity: string;
    label?: string | null;
    createdAt?: Date | string;
};
export type FavoriteRouteCreateOrConnectWithoutPassengerInput = {
    where: Prisma.FavoriteRouteWhereUniqueInput;
    create: Prisma.XOR<Prisma.FavoriteRouteCreateWithoutPassengerInput, Prisma.FavoriteRouteUncheckedCreateWithoutPassengerInput>;
};
export type FavoriteRouteCreateManyPassengerInputEnvelope = {
    data: Prisma.FavoriteRouteCreateManyPassengerInput | Prisma.FavoriteRouteCreateManyPassengerInput[];
    skipDuplicates?: boolean;
};
export type FavoriteRouteUpsertWithWhereUniqueWithoutPassengerInput = {
    where: Prisma.FavoriteRouteWhereUniqueInput;
    update: Prisma.XOR<Prisma.FavoriteRouteUpdateWithoutPassengerInput, Prisma.FavoriteRouteUncheckedUpdateWithoutPassengerInput>;
    create: Prisma.XOR<Prisma.FavoriteRouteCreateWithoutPassengerInput, Prisma.FavoriteRouteUncheckedCreateWithoutPassengerInput>;
};
export type FavoriteRouteUpdateWithWhereUniqueWithoutPassengerInput = {
    where: Prisma.FavoriteRouteWhereUniqueInput;
    data: Prisma.XOR<Prisma.FavoriteRouteUpdateWithoutPassengerInput, Prisma.FavoriteRouteUncheckedUpdateWithoutPassengerInput>;
};
export type FavoriteRouteUpdateManyWithWhereWithoutPassengerInput = {
    where: Prisma.FavoriteRouteScalarWhereInput;
    data: Prisma.XOR<Prisma.FavoriteRouteUpdateManyMutationInput, Prisma.FavoriteRouteUncheckedUpdateManyWithoutPassengerInput>;
};
export type FavoriteRouteScalarWhereInput = {
    AND?: Prisma.FavoriteRouteScalarWhereInput | Prisma.FavoriteRouteScalarWhereInput[];
    OR?: Prisma.FavoriteRouteScalarWhereInput[];
    NOT?: Prisma.FavoriteRouteScalarWhereInput | Prisma.FavoriteRouteScalarWhereInput[];
    id?: Prisma.UuidFilter<"FavoriteRoute"> | string;
    passengerId?: Prisma.UuidFilter<"FavoriteRoute"> | string;
    originCity?: Prisma.StringFilter<"FavoriteRoute"> | string;
    destinationCity?: Prisma.StringFilter<"FavoriteRoute"> | string;
    label?: Prisma.StringNullableFilter<"FavoriteRoute"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"FavoriteRoute"> | Date | string;
};
export type FavoriteRouteCreateManyPassengerInput = {
    id?: string;
    originCity: string;
    destinationCity: string;
    label?: string | null;
    createdAt?: Date | string;
};
export type FavoriteRouteUpdateWithoutPassengerInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    originCity?: Prisma.StringFieldUpdateOperationsInput | string;
    destinationCity?: Prisma.StringFieldUpdateOperationsInput | string;
    label?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FavoriteRouteUncheckedUpdateWithoutPassengerInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    originCity?: Prisma.StringFieldUpdateOperationsInput | string;
    destinationCity?: Prisma.StringFieldUpdateOperationsInput | string;
    label?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FavoriteRouteUncheckedUpdateManyWithoutPassengerInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    originCity?: Prisma.StringFieldUpdateOperationsInput | string;
    destinationCity?: Prisma.StringFieldUpdateOperationsInput | string;
    label?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FavoriteRouteSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    passengerId?: boolean;
    originCity?: boolean;
    destinationCity?: boolean;
    label?: boolean;
    createdAt?: boolean;
    passenger?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["favoriteRoute"]>;
export type FavoriteRouteSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    passengerId?: boolean;
    originCity?: boolean;
    destinationCity?: boolean;
    label?: boolean;
    createdAt?: boolean;
    passenger?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["favoriteRoute"]>;
export type FavoriteRouteSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    passengerId?: boolean;
    originCity?: boolean;
    destinationCity?: boolean;
    label?: boolean;
    createdAt?: boolean;
    passenger?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["favoriteRoute"]>;
export type FavoriteRouteSelectScalar = {
    id?: boolean;
    passengerId?: boolean;
    originCity?: boolean;
    destinationCity?: boolean;
    label?: boolean;
    createdAt?: boolean;
};
export type FavoriteRouteOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "passengerId" | "originCity" | "destinationCity" | "label" | "createdAt", ExtArgs["result"]["favoriteRoute"]>;
export type FavoriteRouteInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    passenger?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type FavoriteRouteIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    passenger?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type FavoriteRouteIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    passenger?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type $FavoriteRoutePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "FavoriteRoute";
    objects: {
        passenger: Prisma.$UserPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        passengerId: string;
        originCity: string;
        destinationCity: string;
        label: string | null;
        createdAt: Date;
    }, ExtArgs["result"]["favoriteRoute"]>;
    composites: {};
};
export type FavoriteRouteGetPayload<S extends boolean | null | undefined | FavoriteRouteDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$FavoriteRoutePayload, S>;
export type FavoriteRouteCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<FavoriteRouteFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: FavoriteRouteCountAggregateInputType | true;
};
export interface FavoriteRouteDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['FavoriteRoute'];
        meta: {
            name: 'FavoriteRoute';
        };
    };
    findUnique<T extends FavoriteRouteFindUniqueArgs>(args: Prisma.SelectSubset<T, FavoriteRouteFindUniqueArgs<ExtArgs>>): Prisma.Prisma__FavoriteRouteClient<runtime.Types.Result.GetResult<Prisma.$FavoriteRoutePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends FavoriteRouteFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, FavoriteRouteFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__FavoriteRouteClient<runtime.Types.Result.GetResult<Prisma.$FavoriteRoutePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends FavoriteRouteFindFirstArgs>(args?: Prisma.SelectSubset<T, FavoriteRouteFindFirstArgs<ExtArgs>>): Prisma.Prisma__FavoriteRouteClient<runtime.Types.Result.GetResult<Prisma.$FavoriteRoutePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends FavoriteRouteFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, FavoriteRouteFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__FavoriteRouteClient<runtime.Types.Result.GetResult<Prisma.$FavoriteRoutePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends FavoriteRouteFindManyArgs>(args?: Prisma.SelectSubset<T, FavoriteRouteFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$FavoriteRoutePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends FavoriteRouteCreateArgs>(args: Prisma.SelectSubset<T, FavoriteRouteCreateArgs<ExtArgs>>): Prisma.Prisma__FavoriteRouteClient<runtime.Types.Result.GetResult<Prisma.$FavoriteRoutePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends FavoriteRouteCreateManyArgs>(args?: Prisma.SelectSubset<T, FavoriteRouteCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends FavoriteRouteCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, FavoriteRouteCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$FavoriteRoutePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends FavoriteRouteDeleteArgs>(args: Prisma.SelectSubset<T, FavoriteRouteDeleteArgs<ExtArgs>>): Prisma.Prisma__FavoriteRouteClient<runtime.Types.Result.GetResult<Prisma.$FavoriteRoutePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends FavoriteRouteUpdateArgs>(args: Prisma.SelectSubset<T, FavoriteRouteUpdateArgs<ExtArgs>>): Prisma.Prisma__FavoriteRouteClient<runtime.Types.Result.GetResult<Prisma.$FavoriteRoutePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends FavoriteRouteDeleteManyArgs>(args?: Prisma.SelectSubset<T, FavoriteRouteDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends FavoriteRouteUpdateManyArgs>(args: Prisma.SelectSubset<T, FavoriteRouteUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends FavoriteRouteUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, FavoriteRouteUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$FavoriteRoutePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends FavoriteRouteUpsertArgs>(args: Prisma.SelectSubset<T, FavoriteRouteUpsertArgs<ExtArgs>>): Prisma.Prisma__FavoriteRouteClient<runtime.Types.Result.GetResult<Prisma.$FavoriteRoutePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends FavoriteRouteCountArgs>(args?: Prisma.Subset<T, FavoriteRouteCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], FavoriteRouteCountAggregateOutputType> : number>;
    aggregate<T extends FavoriteRouteAggregateArgs>(args: Prisma.Subset<T, FavoriteRouteAggregateArgs>): Prisma.PrismaPromise<GetFavoriteRouteAggregateType<T>>;
    groupBy<T extends FavoriteRouteGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: FavoriteRouteGroupByArgs['orderBy'];
    } : {
        orderBy?: FavoriteRouteGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, FavoriteRouteGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFavoriteRouteGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: FavoriteRouteFieldRefs;
}
export interface Prisma__FavoriteRouteClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    passenger<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface FavoriteRouteFieldRefs {
    readonly id: Prisma.FieldRef<"FavoriteRoute", 'String'>;
    readonly passengerId: Prisma.FieldRef<"FavoriteRoute", 'String'>;
    readonly originCity: Prisma.FieldRef<"FavoriteRoute", 'String'>;
    readonly destinationCity: Prisma.FieldRef<"FavoriteRoute", 'String'>;
    readonly label: Prisma.FieldRef<"FavoriteRoute", 'String'>;
    readonly createdAt: Prisma.FieldRef<"FavoriteRoute", 'DateTime'>;
}
export type FavoriteRouteFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FavoriteRouteSelect<ExtArgs> | null;
    omit?: Prisma.FavoriteRouteOmit<ExtArgs> | null;
    include?: Prisma.FavoriteRouteInclude<ExtArgs> | null;
    where: Prisma.FavoriteRouteWhereUniqueInput;
};
export type FavoriteRouteFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FavoriteRouteSelect<ExtArgs> | null;
    omit?: Prisma.FavoriteRouteOmit<ExtArgs> | null;
    include?: Prisma.FavoriteRouteInclude<ExtArgs> | null;
    where: Prisma.FavoriteRouteWhereUniqueInput;
};
export type FavoriteRouteFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FavoriteRouteSelect<ExtArgs> | null;
    omit?: Prisma.FavoriteRouteOmit<ExtArgs> | null;
    include?: Prisma.FavoriteRouteInclude<ExtArgs> | null;
    where?: Prisma.FavoriteRouteWhereInput;
    orderBy?: Prisma.FavoriteRouteOrderByWithRelationInput | Prisma.FavoriteRouteOrderByWithRelationInput[];
    cursor?: Prisma.FavoriteRouteWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.FavoriteRouteScalarFieldEnum | Prisma.FavoriteRouteScalarFieldEnum[];
};
export type FavoriteRouteFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FavoriteRouteSelect<ExtArgs> | null;
    omit?: Prisma.FavoriteRouteOmit<ExtArgs> | null;
    include?: Prisma.FavoriteRouteInclude<ExtArgs> | null;
    where?: Prisma.FavoriteRouteWhereInput;
    orderBy?: Prisma.FavoriteRouteOrderByWithRelationInput | Prisma.FavoriteRouteOrderByWithRelationInput[];
    cursor?: Prisma.FavoriteRouteWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.FavoriteRouteScalarFieldEnum | Prisma.FavoriteRouteScalarFieldEnum[];
};
export type FavoriteRouteFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FavoriteRouteSelect<ExtArgs> | null;
    omit?: Prisma.FavoriteRouteOmit<ExtArgs> | null;
    include?: Prisma.FavoriteRouteInclude<ExtArgs> | null;
    where?: Prisma.FavoriteRouteWhereInput;
    orderBy?: Prisma.FavoriteRouteOrderByWithRelationInput | Prisma.FavoriteRouteOrderByWithRelationInput[];
    cursor?: Prisma.FavoriteRouteWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.FavoriteRouteScalarFieldEnum | Prisma.FavoriteRouteScalarFieldEnum[];
};
export type FavoriteRouteCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FavoriteRouteSelect<ExtArgs> | null;
    omit?: Prisma.FavoriteRouteOmit<ExtArgs> | null;
    include?: Prisma.FavoriteRouteInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.FavoriteRouteCreateInput, Prisma.FavoriteRouteUncheckedCreateInput>;
};
export type FavoriteRouteCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.FavoriteRouteCreateManyInput | Prisma.FavoriteRouteCreateManyInput[];
    skipDuplicates?: boolean;
};
export type FavoriteRouteCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FavoriteRouteSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.FavoriteRouteOmit<ExtArgs> | null;
    data: Prisma.FavoriteRouteCreateManyInput | Prisma.FavoriteRouteCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.FavoriteRouteIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type FavoriteRouteUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FavoriteRouteSelect<ExtArgs> | null;
    omit?: Prisma.FavoriteRouteOmit<ExtArgs> | null;
    include?: Prisma.FavoriteRouteInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.FavoriteRouteUpdateInput, Prisma.FavoriteRouteUncheckedUpdateInput>;
    where: Prisma.FavoriteRouteWhereUniqueInput;
};
export type FavoriteRouteUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.FavoriteRouteUpdateManyMutationInput, Prisma.FavoriteRouteUncheckedUpdateManyInput>;
    where?: Prisma.FavoriteRouteWhereInput;
    limit?: number;
};
export type FavoriteRouteUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FavoriteRouteSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.FavoriteRouteOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.FavoriteRouteUpdateManyMutationInput, Prisma.FavoriteRouteUncheckedUpdateManyInput>;
    where?: Prisma.FavoriteRouteWhereInput;
    limit?: number;
    include?: Prisma.FavoriteRouteIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type FavoriteRouteUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FavoriteRouteSelect<ExtArgs> | null;
    omit?: Prisma.FavoriteRouteOmit<ExtArgs> | null;
    include?: Prisma.FavoriteRouteInclude<ExtArgs> | null;
    where: Prisma.FavoriteRouteWhereUniqueInput;
    create: Prisma.XOR<Prisma.FavoriteRouteCreateInput, Prisma.FavoriteRouteUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.FavoriteRouteUpdateInput, Prisma.FavoriteRouteUncheckedUpdateInput>;
};
export type FavoriteRouteDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FavoriteRouteSelect<ExtArgs> | null;
    omit?: Prisma.FavoriteRouteOmit<ExtArgs> | null;
    include?: Prisma.FavoriteRouteInclude<ExtArgs> | null;
    where: Prisma.FavoriteRouteWhereUniqueInput;
};
export type FavoriteRouteDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.FavoriteRouteWhereInput;
    limit?: number;
};
export type FavoriteRouteDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FavoriteRouteSelect<ExtArgs> | null;
    omit?: Prisma.FavoriteRouteOmit<ExtArgs> | null;
    include?: Prisma.FavoriteRouteInclude<ExtArgs> | null;
};
