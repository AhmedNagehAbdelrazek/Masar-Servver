import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type RecentSearchModel = runtime.Types.Result.DefaultSelection<Prisma.$RecentSearchPayload>;
export type AggregateRecentSearch = {
    _count: RecentSearchCountAggregateOutputType | null;
    _min: RecentSearchMinAggregateOutputType | null;
    _max: RecentSearchMaxAggregateOutputType | null;
};
export type RecentSearchMinAggregateOutputType = {
    id: string | null;
    passengerId: string | null;
    originCity: string | null;
    destinationCity: string | null;
    searchedOn: Date | null;
    createdAt: Date | null;
};
export type RecentSearchMaxAggregateOutputType = {
    id: string | null;
    passengerId: string | null;
    originCity: string | null;
    destinationCity: string | null;
    searchedOn: Date | null;
    createdAt: Date | null;
};
export type RecentSearchCountAggregateOutputType = {
    id: number;
    passengerId: number;
    originCity: number;
    destinationCity: number;
    searchedOn: number;
    createdAt: number;
    _all: number;
};
export type RecentSearchMinAggregateInputType = {
    id?: true;
    passengerId?: true;
    originCity?: true;
    destinationCity?: true;
    searchedOn?: true;
    createdAt?: true;
};
export type RecentSearchMaxAggregateInputType = {
    id?: true;
    passengerId?: true;
    originCity?: true;
    destinationCity?: true;
    searchedOn?: true;
    createdAt?: true;
};
export type RecentSearchCountAggregateInputType = {
    id?: true;
    passengerId?: true;
    originCity?: true;
    destinationCity?: true;
    searchedOn?: true;
    createdAt?: true;
    _all?: true;
};
export type RecentSearchAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RecentSearchWhereInput;
    orderBy?: Prisma.RecentSearchOrderByWithRelationInput | Prisma.RecentSearchOrderByWithRelationInput[];
    cursor?: Prisma.RecentSearchWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | RecentSearchCountAggregateInputType;
    _min?: RecentSearchMinAggregateInputType;
    _max?: RecentSearchMaxAggregateInputType;
};
export type GetRecentSearchAggregateType<T extends RecentSearchAggregateArgs> = {
    [P in keyof T & keyof AggregateRecentSearch]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateRecentSearch[P]> : Prisma.GetScalarType<T[P], AggregateRecentSearch[P]>;
};
export type RecentSearchGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RecentSearchWhereInput;
    orderBy?: Prisma.RecentSearchOrderByWithAggregationInput | Prisma.RecentSearchOrderByWithAggregationInput[];
    by: Prisma.RecentSearchScalarFieldEnum[] | Prisma.RecentSearchScalarFieldEnum;
    having?: Prisma.RecentSearchScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: RecentSearchCountAggregateInputType | true;
    _min?: RecentSearchMinAggregateInputType;
    _max?: RecentSearchMaxAggregateInputType;
};
export type RecentSearchGroupByOutputType = {
    id: string;
    passengerId: string;
    originCity: string;
    destinationCity: string;
    searchedOn: Date;
    createdAt: Date;
    _count: RecentSearchCountAggregateOutputType | null;
    _min: RecentSearchMinAggregateOutputType | null;
    _max: RecentSearchMaxAggregateOutputType | null;
};
export type GetRecentSearchGroupByPayload<T extends RecentSearchGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<RecentSearchGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof RecentSearchGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], RecentSearchGroupByOutputType[P]> : Prisma.GetScalarType<T[P], RecentSearchGroupByOutputType[P]>;
}>>;
export type RecentSearchWhereInput = {
    AND?: Prisma.RecentSearchWhereInput | Prisma.RecentSearchWhereInput[];
    OR?: Prisma.RecentSearchWhereInput[];
    NOT?: Prisma.RecentSearchWhereInput | Prisma.RecentSearchWhereInput[];
    id?: Prisma.UuidFilter<"RecentSearch"> | string;
    passengerId?: Prisma.UuidFilter<"RecentSearch"> | string;
    originCity?: Prisma.StringFilter<"RecentSearch"> | string;
    destinationCity?: Prisma.StringFilter<"RecentSearch"> | string;
    searchedOn?: Prisma.DateTimeFilter<"RecentSearch"> | Date | string;
    createdAt?: Prisma.DateTimeFilter<"RecentSearch"> | Date | string;
    passenger?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
};
export type RecentSearchOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    passengerId?: Prisma.SortOrder;
    originCity?: Prisma.SortOrder;
    destinationCity?: Prisma.SortOrder;
    searchedOn?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    passenger?: Prisma.UserOrderByWithRelationInput;
};
export type RecentSearchWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    passengerId_originCity_destinationCity?: Prisma.RecentSearchPassengerIdOriginCityDestinationCityCompoundUniqueInput;
    AND?: Prisma.RecentSearchWhereInput | Prisma.RecentSearchWhereInput[];
    OR?: Prisma.RecentSearchWhereInput[];
    NOT?: Prisma.RecentSearchWhereInput | Prisma.RecentSearchWhereInput[];
    passengerId?: Prisma.UuidFilter<"RecentSearch"> | string;
    originCity?: Prisma.StringFilter<"RecentSearch"> | string;
    destinationCity?: Prisma.StringFilter<"RecentSearch"> | string;
    searchedOn?: Prisma.DateTimeFilter<"RecentSearch"> | Date | string;
    createdAt?: Prisma.DateTimeFilter<"RecentSearch"> | Date | string;
    passenger?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
}, "id" | "passengerId_originCity_destinationCity">;
export type RecentSearchOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    passengerId?: Prisma.SortOrder;
    originCity?: Prisma.SortOrder;
    destinationCity?: Prisma.SortOrder;
    searchedOn?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.RecentSearchCountOrderByAggregateInput;
    _max?: Prisma.RecentSearchMaxOrderByAggregateInput;
    _min?: Prisma.RecentSearchMinOrderByAggregateInput;
};
export type RecentSearchScalarWhereWithAggregatesInput = {
    AND?: Prisma.RecentSearchScalarWhereWithAggregatesInput | Prisma.RecentSearchScalarWhereWithAggregatesInput[];
    OR?: Prisma.RecentSearchScalarWhereWithAggregatesInput[];
    NOT?: Prisma.RecentSearchScalarWhereWithAggregatesInput | Prisma.RecentSearchScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"RecentSearch"> | string;
    passengerId?: Prisma.UuidWithAggregatesFilter<"RecentSearch"> | string;
    originCity?: Prisma.StringWithAggregatesFilter<"RecentSearch"> | string;
    destinationCity?: Prisma.StringWithAggregatesFilter<"RecentSearch"> | string;
    searchedOn?: Prisma.DateTimeWithAggregatesFilter<"RecentSearch"> | Date | string;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"RecentSearch"> | Date | string;
};
export type RecentSearchCreateInput = {
    id?: string;
    originCity: string;
    destinationCity: string;
    searchedOn: Date | string;
    createdAt?: Date | string;
    passenger: Prisma.UserCreateNestedOneWithoutRecentSearchesInput;
};
export type RecentSearchUncheckedCreateInput = {
    id?: string;
    passengerId: string;
    originCity: string;
    destinationCity: string;
    searchedOn: Date | string;
    createdAt?: Date | string;
};
export type RecentSearchUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    originCity?: Prisma.StringFieldUpdateOperationsInput | string;
    destinationCity?: Prisma.StringFieldUpdateOperationsInput | string;
    searchedOn?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    passenger?: Prisma.UserUpdateOneRequiredWithoutRecentSearchesNestedInput;
};
export type RecentSearchUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    passengerId?: Prisma.StringFieldUpdateOperationsInput | string;
    originCity?: Prisma.StringFieldUpdateOperationsInput | string;
    destinationCity?: Prisma.StringFieldUpdateOperationsInput | string;
    searchedOn?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RecentSearchCreateManyInput = {
    id?: string;
    passengerId: string;
    originCity: string;
    destinationCity: string;
    searchedOn: Date | string;
    createdAt?: Date | string;
};
export type RecentSearchUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    originCity?: Prisma.StringFieldUpdateOperationsInput | string;
    destinationCity?: Prisma.StringFieldUpdateOperationsInput | string;
    searchedOn?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RecentSearchUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    passengerId?: Prisma.StringFieldUpdateOperationsInput | string;
    originCity?: Prisma.StringFieldUpdateOperationsInput | string;
    destinationCity?: Prisma.StringFieldUpdateOperationsInput | string;
    searchedOn?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RecentSearchListRelationFilter = {
    every?: Prisma.RecentSearchWhereInput;
    some?: Prisma.RecentSearchWhereInput;
    none?: Prisma.RecentSearchWhereInput;
};
export type RecentSearchOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type RecentSearchPassengerIdOriginCityDestinationCityCompoundUniqueInput = {
    passengerId: string;
    originCity: string;
    destinationCity: string;
};
export type RecentSearchCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    passengerId?: Prisma.SortOrder;
    originCity?: Prisma.SortOrder;
    destinationCity?: Prisma.SortOrder;
    searchedOn?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type RecentSearchMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    passengerId?: Prisma.SortOrder;
    originCity?: Prisma.SortOrder;
    destinationCity?: Prisma.SortOrder;
    searchedOn?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type RecentSearchMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    passengerId?: Prisma.SortOrder;
    originCity?: Prisma.SortOrder;
    destinationCity?: Prisma.SortOrder;
    searchedOn?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type RecentSearchCreateNestedManyWithoutPassengerInput = {
    create?: Prisma.XOR<Prisma.RecentSearchCreateWithoutPassengerInput, Prisma.RecentSearchUncheckedCreateWithoutPassengerInput> | Prisma.RecentSearchCreateWithoutPassengerInput[] | Prisma.RecentSearchUncheckedCreateWithoutPassengerInput[];
    connectOrCreate?: Prisma.RecentSearchCreateOrConnectWithoutPassengerInput | Prisma.RecentSearchCreateOrConnectWithoutPassengerInput[];
    createMany?: Prisma.RecentSearchCreateManyPassengerInputEnvelope;
    connect?: Prisma.RecentSearchWhereUniqueInput | Prisma.RecentSearchWhereUniqueInput[];
};
export type RecentSearchUncheckedCreateNestedManyWithoutPassengerInput = {
    create?: Prisma.XOR<Prisma.RecentSearchCreateWithoutPassengerInput, Prisma.RecentSearchUncheckedCreateWithoutPassengerInput> | Prisma.RecentSearchCreateWithoutPassengerInput[] | Prisma.RecentSearchUncheckedCreateWithoutPassengerInput[];
    connectOrCreate?: Prisma.RecentSearchCreateOrConnectWithoutPassengerInput | Prisma.RecentSearchCreateOrConnectWithoutPassengerInput[];
    createMany?: Prisma.RecentSearchCreateManyPassengerInputEnvelope;
    connect?: Prisma.RecentSearchWhereUniqueInput | Prisma.RecentSearchWhereUniqueInput[];
};
export type RecentSearchUpdateManyWithoutPassengerNestedInput = {
    create?: Prisma.XOR<Prisma.RecentSearchCreateWithoutPassengerInput, Prisma.RecentSearchUncheckedCreateWithoutPassengerInput> | Prisma.RecentSearchCreateWithoutPassengerInput[] | Prisma.RecentSearchUncheckedCreateWithoutPassengerInput[];
    connectOrCreate?: Prisma.RecentSearchCreateOrConnectWithoutPassengerInput | Prisma.RecentSearchCreateOrConnectWithoutPassengerInput[];
    upsert?: Prisma.RecentSearchUpsertWithWhereUniqueWithoutPassengerInput | Prisma.RecentSearchUpsertWithWhereUniqueWithoutPassengerInput[];
    createMany?: Prisma.RecentSearchCreateManyPassengerInputEnvelope;
    set?: Prisma.RecentSearchWhereUniqueInput | Prisma.RecentSearchWhereUniqueInput[];
    disconnect?: Prisma.RecentSearchWhereUniqueInput | Prisma.RecentSearchWhereUniqueInput[];
    delete?: Prisma.RecentSearchWhereUniqueInput | Prisma.RecentSearchWhereUniqueInput[];
    connect?: Prisma.RecentSearchWhereUniqueInput | Prisma.RecentSearchWhereUniqueInput[];
    update?: Prisma.RecentSearchUpdateWithWhereUniqueWithoutPassengerInput | Prisma.RecentSearchUpdateWithWhereUniqueWithoutPassengerInput[];
    updateMany?: Prisma.RecentSearchUpdateManyWithWhereWithoutPassengerInput | Prisma.RecentSearchUpdateManyWithWhereWithoutPassengerInput[];
    deleteMany?: Prisma.RecentSearchScalarWhereInput | Prisma.RecentSearchScalarWhereInput[];
};
export type RecentSearchUncheckedUpdateManyWithoutPassengerNestedInput = {
    create?: Prisma.XOR<Prisma.RecentSearchCreateWithoutPassengerInput, Prisma.RecentSearchUncheckedCreateWithoutPassengerInput> | Prisma.RecentSearchCreateWithoutPassengerInput[] | Prisma.RecentSearchUncheckedCreateWithoutPassengerInput[];
    connectOrCreate?: Prisma.RecentSearchCreateOrConnectWithoutPassengerInput | Prisma.RecentSearchCreateOrConnectWithoutPassengerInput[];
    upsert?: Prisma.RecentSearchUpsertWithWhereUniqueWithoutPassengerInput | Prisma.RecentSearchUpsertWithWhereUniqueWithoutPassengerInput[];
    createMany?: Prisma.RecentSearchCreateManyPassengerInputEnvelope;
    set?: Prisma.RecentSearchWhereUniqueInput | Prisma.RecentSearchWhereUniqueInput[];
    disconnect?: Prisma.RecentSearchWhereUniqueInput | Prisma.RecentSearchWhereUniqueInput[];
    delete?: Prisma.RecentSearchWhereUniqueInput | Prisma.RecentSearchWhereUniqueInput[];
    connect?: Prisma.RecentSearchWhereUniqueInput | Prisma.RecentSearchWhereUniqueInput[];
    update?: Prisma.RecentSearchUpdateWithWhereUniqueWithoutPassengerInput | Prisma.RecentSearchUpdateWithWhereUniqueWithoutPassengerInput[];
    updateMany?: Prisma.RecentSearchUpdateManyWithWhereWithoutPassengerInput | Prisma.RecentSearchUpdateManyWithWhereWithoutPassengerInput[];
    deleteMany?: Prisma.RecentSearchScalarWhereInput | Prisma.RecentSearchScalarWhereInput[];
};
export type RecentSearchCreateWithoutPassengerInput = {
    id?: string;
    originCity: string;
    destinationCity: string;
    searchedOn: Date | string;
    createdAt?: Date | string;
};
export type RecentSearchUncheckedCreateWithoutPassengerInput = {
    id?: string;
    originCity: string;
    destinationCity: string;
    searchedOn: Date | string;
    createdAt?: Date | string;
};
export type RecentSearchCreateOrConnectWithoutPassengerInput = {
    where: Prisma.RecentSearchWhereUniqueInput;
    create: Prisma.XOR<Prisma.RecentSearchCreateWithoutPassengerInput, Prisma.RecentSearchUncheckedCreateWithoutPassengerInput>;
};
export type RecentSearchCreateManyPassengerInputEnvelope = {
    data: Prisma.RecentSearchCreateManyPassengerInput | Prisma.RecentSearchCreateManyPassengerInput[];
    skipDuplicates?: boolean;
};
export type RecentSearchUpsertWithWhereUniqueWithoutPassengerInput = {
    where: Prisma.RecentSearchWhereUniqueInput;
    update: Prisma.XOR<Prisma.RecentSearchUpdateWithoutPassengerInput, Prisma.RecentSearchUncheckedUpdateWithoutPassengerInput>;
    create: Prisma.XOR<Prisma.RecentSearchCreateWithoutPassengerInput, Prisma.RecentSearchUncheckedCreateWithoutPassengerInput>;
};
export type RecentSearchUpdateWithWhereUniqueWithoutPassengerInput = {
    where: Prisma.RecentSearchWhereUniqueInput;
    data: Prisma.XOR<Prisma.RecentSearchUpdateWithoutPassengerInput, Prisma.RecentSearchUncheckedUpdateWithoutPassengerInput>;
};
export type RecentSearchUpdateManyWithWhereWithoutPassengerInput = {
    where: Prisma.RecentSearchScalarWhereInput;
    data: Prisma.XOR<Prisma.RecentSearchUpdateManyMutationInput, Prisma.RecentSearchUncheckedUpdateManyWithoutPassengerInput>;
};
export type RecentSearchScalarWhereInput = {
    AND?: Prisma.RecentSearchScalarWhereInput | Prisma.RecentSearchScalarWhereInput[];
    OR?: Prisma.RecentSearchScalarWhereInput[];
    NOT?: Prisma.RecentSearchScalarWhereInput | Prisma.RecentSearchScalarWhereInput[];
    id?: Prisma.UuidFilter<"RecentSearch"> | string;
    passengerId?: Prisma.UuidFilter<"RecentSearch"> | string;
    originCity?: Prisma.StringFilter<"RecentSearch"> | string;
    destinationCity?: Prisma.StringFilter<"RecentSearch"> | string;
    searchedOn?: Prisma.DateTimeFilter<"RecentSearch"> | Date | string;
    createdAt?: Prisma.DateTimeFilter<"RecentSearch"> | Date | string;
};
export type RecentSearchCreateManyPassengerInput = {
    id?: string;
    originCity: string;
    destinationCity: string;
    searchedOn: Date | string;
    createdAt?: Date | string;
};
export type RecentSearchUpdateWithoutPassengerInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    originCity?: Prisma.StringFieldUpdateOperationsInput | string;
    destinationCity?: Prisma.StringFieldUpdateOperationsInput | string;
    searchedOn?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RecentSearchUncheckedUpdateWithoutPassengerInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    originCity?: Prisma.StringFieldUpdateOperationsInput | string;
    destinationCity?: Prisma.StringFieldUpdateOperationsInput | string;
    searchedOn?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RecentSearchUncheckedUpdateManyWithoutPassengerInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    originCity?: Prisma.StringFieldUpdateOperationsInput | string;
    destinationCity?: Prisma.StringFieldUpdateOperationsInput | string;
    searchedOn?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type RecentSearchSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    passengerId?: boolean;
    originCity?: boolean;
    destinationCity?: boolean;
    searchedOn?: boolean;
    createdAt?: boolean;
    passenger?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["recentSearch"]>;
export type RecentSearchSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    passengerId?: boolean;
    originCity?: boolean;
    destinationCity?: boolean;
    searchedOn?: boolean;
    createdAt?: boolean;
    passenger?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["recentSearch"]>;
export type RecentSearchSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    passengerId?: boolean;
    originCity?: boolean;
    destinationCity?: boolean;
    searchedOn?: boolean;
    createdAt?: boolean;
    passenger?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["recentSearch"]>;
export type RecentSearchSelectScalar = {
    id?: boolean;
    passengerId?: boolean;
    originCity?: boolean;
    destinationCity?: boolean;
    searchedOn?: boolean;
    createdAt?: boolean;
};
export type RecentSearchOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "passengerId" | "originCity" | "destinationCity" | "searchedOn" | "createdAt", ExtArgs["result"]["recentSearch"]>;
export type RecentSearchInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    passenger?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type RecentSearchIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    passenger?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type RecentSearchIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    passenger?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type $RecentSearchPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "RecentSearch";
    objects: {
        passenger: Prisma.$UserPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        passengerId: string;
        originCity: string;
        destinationCity: string;
        searchedOn: Date;
        createdAt: Date;
    }, ExtArgs["result"]["recentSearch"]>;
    composites: {};
};
export type RecentSearchGetPayload<S extends boolean | null | undefined | RecentSearchDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$RecentSearchPayload, S>;
export type RecentSearchCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<RecentSearchFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: RecentSearchCountAggregateInputType | true;
};
export interface RecentSearchDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['RecentSearch'];
        meta: {
            name: 'RecentSearch';
        };
    };
    findUnique<T extends RecentSearchFindUniqueArgs>(args: Prisma.SelectSubset<T, RecentSearchFindUniqueArgs<ExtArgs>>): Prisma.Prisma__RecentSearchClient<runtime.Types.Result.GetResult<Prisma.$RecentSearchPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends RecentSearchFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, RecentSearchFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__RecentSearchClient<runtime.Types.Result.GetResult<Prisma.$RecentSearchPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends RecentSearchFindFirstArgs>(args?: Prisma.SelectSubset<T, RecentSearchFindFirstArgs<ExtArgs>>): Prisma.Prisma__RecentSearchClient<runtime.Types.Result.GetResult<Prisma.$RecentSearchPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends RecentSearchFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, RecentSearchFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__RecentSearchClient<runtime.Types.Result.GetResult<Prisma.$RecentSearchPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends RecentSearchFindManyArgs>(args?: Prisma.SelectSubset<T, RecentSearchFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RecentSearchPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends RecentSearchCreateArgs>(args: Prisma.SelectSubset<T, RecentSearchCreateArgs<ExtArgs>>): Prisma.Prisma__RecentSearchClient<runtime.Types.Result.GetResult<Prisma.$RecentSearchPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends RecentSearchCreateManyArgs>(args?: Prisma.SelectSubset<T, RecentSearchCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends RecentSearchCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, RecentSearchCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RecentSearchPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends RecentSearchDeleteArgs>(args: Prisma.SelectSubset<T, RecentSearchDeleteArgs<ExtArgs>>): Prisma.Prisma__RecentSearchClient<runtime.Types.Result.GetResult<Prisma.$RecentSearchPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends RecentSearchUpdateArgs>(args: Prisma.SelectSubset<T, RecentSearchUpdateArgs<ExtArgs>>): Prisma.Prisma__RecentSearchClient<runtime.Types.Result.GetResult<Prisma.$RecentSearchPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends RecentSearchDeleteManyArgs>(args?: Prisma.SelectSubset<T, RecentSearchDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends RecentSearchUpdateManyArgs>(args: Prisma.SelectSubset<T, RecentSearchUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends RecentSearchUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, RecentSearchUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$RecentSearchPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends RecentSearchUpsertArgs>(args: Prisma.SelectSubset<T, RecentSearchUpsertArgs<ExtArgs>>): Prisma.Prisma__RecentSearchClient<runtime.Types.Result.GetResult<Prisma.$RecentSearchPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends RecentSearchCountArgs>(args?: Prisma.Subset<T, RecentSearchCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], RecentSearchCountAggregateOutputType> : number>;
    aggregate<T extends RecentSearchAggregateArgs>(args: Prisma.Subset<T, RecentSearchAggregateArgs>): Prisma.PrismaPromise<GetRecentSearchAggregateType<T>>;
    groupBy<T extends RecentSearchGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: RecentSearchGroupByArgs['orderBy'];
    } : {
        orderBy?: RecentSearchGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, RecentSearchGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRecentSearchGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: RecentSearchFieldRefs;
}
export interface Prisma__RecentSearchClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    passenger<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface RecentSearchFieldRefs {
    readonly id: Prisma.FieldRef<"RecentSearch", 'String'>;
    readonly passengerId: Prisma.FieldRef<"RecentSearch", 'String'>;
    readonly originCity: Prisma.FieldRef<"RecentSearch", 'String'>;
    readonly destinationCity: Prisma.FieldRef<"RecentSearch", 'String'>;
    readonly searchedOn: Prisma.FieldRef<"RecentSearch", 'DateTime'>;
    readonly createdAt: Prisma.FieldRef<"RecentSearch", 'DateTime'>;
}
export type RecentSearchFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RecentSearchSelect<ExtArgs> | null;
    omit?: Prisma.RecentSearchOmit<ExtArgs> | null;
    include?: Prisma.RecentSearchInclude<ExtArgs> | null;
    where: Prisma.RecentSearchWhereUniqueInput;
};
export type RecentSearchFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RecentSearchSelect<ExtArgs> | null;
    omit?: Prisma.RecentSearchOmit<ExtArgs> | null;
    include?: Prisma.RecentSearchInclude<ExtArgs> | null;
    where: Prisma.RecentSearchWhereUniqueInput;
};
export type RecentSearchFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RecentSearchSelect<ExtArgs> | null;
    omit?: Prisma.RecentSearchOmit<ExtArgs> | null;
    include?: Prisma.RecentSearchInclude<ExtArgs> | null;
    where?: Prisma.RecentSearchWhereInput;
    orderBy?: Prisma.RecentSearchOrderByWithRelationInput | Prisma.RecentSearchOrderByWithRelationInput[];
    cursor?: Prisma.RecentSearchWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RecentSearchScalarFieldEnum | Prisma.RecentSearchScalarFieldEnum[];
};
export type RecentSearchFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RecentSearchSelect<ExtArgs> | null;
    omit?: Prisma.RecentSearchOmit<ExtArgs> | null;
    include?: Prisma.RecentSearchInclude<ExtArgs> | null;
    where?: Prisma.RecentSearchWhereInput;
    orderBy?: Prisma.RecentSearchOrderByWithRelationInput | Prisma.RecentSearchOrderByWithRelationInput[];
    cursor?: Prisma.RecentSearchWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RecentSearchScalarFieldEnum | Prisma.RecentSearchScalarFieldEnum[];
};
export type RecentSearchFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RecentSearchSelect<ExtArgs> | null;
    omit?: Prisma.RecentSearchOmit<ExtArgs> | null;
    include?: Prisma.RecentSearchInclude<ExtArgs> | null;
    where?: Prisma.RecentSearchWhereInput;
    orderBy?: Prisma.RecentSearchOrderByWithRelationInput | Prisma.RecentSearchOrderByWithRelationInput[];
    cursor?: Prisma.RecentSearchWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.RecentSearchScalarFieldEnum | Prisma.RecentSearchScalarFieldEnum[];
};
export type RecentSearchCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RecentSearchSelect<ExtArgs> | null;
    omit?: Prisma.RecentSearchOmit<ExtArgs> | null;
    include?: Prisma.RecentSearchInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RecentSearchCreateInput, Prisma.RecentSearchUncheckedCreateInput>;
};
export type RecentSearchCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.RecentSearchCreateManyInput | Prisma.RecentSearchCreateManyInput[];
    skipDuplicates?: boolean;
};
export type RecentSearchCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RecentSearchSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.RecentSearchOmit<ExtArgs> | null;
    data: Prisma.RecentSearchCreateManyInput | Prisma.RecentSearchCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.RecentSearchIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type RecentSearchUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RecentSearchSelect<ExtArgs> | null;
    omit?: Prisma.RecentSearchOmit<ExtArgs> | null;
    include?: Prisma.RecentSearchInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RecentSearchUpdateInput, Prisma.RecentSearchUncheckedUpdateInput>;
    where: Prisma.RecentSearchWhereUniqueInput;
};
export type RecentSearchUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.RecentSearchUpdateManyMutationInput, Prisma.RecentSearchUncheckedUpdateManyInput>;
    where?: Prisma.RecentSearchWhereInput;
    limit?: number;
};
export type RecentSearchUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RecentSearchSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.RecentSearchOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.RecentSearchUpdateManyMutationInput, Prisma.RecentSearchUncheckedUpdateManyInput>;
    where?: Prisma.RecentSearchWhereInput;
    limit?: number;
    include?: Prisma.RecentSearchIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type RecentSearchUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RecentSearchSelect<ExtArgs> | null;
    omit?: Prisma.RecentSearchOmit<ExtArgs> | null;
    include?: Prisma.RecentSearchInclude<ExtArgs> | null;
    where: Prisma.RecentSearchWhereUniqueInput;
    create: Prisma.XOR<Prisma.RecentSearchCreateInput, Prisma.RecentSearchUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.RecentSearchUpdateInput, Prisma.RecentSearchUncheckedUpdateInput>;
};
export type RecentSearchDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RecentSearchSelect<ExtArgs> | null;
    omit?: Prisma.RecentSearchOmit<ExtArgs> | null;
    include?: Prisma.RecentSearchInclude<ExtArgs> | null;
    where: Prisma.RecentSearchWhereUniqueInput;
};
export type RecentSearchDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.RecentSearchWhereInput;
    limit?: number;
};
export type RecentSearchDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.RecentSearchSelect<ExtArgs> | null;
    omit?: Prisma.RecentSearchOmit<ExtArgs> | null;
    include?: Prisma.RecentSearchInclude<ExtArgs> | null;
};
