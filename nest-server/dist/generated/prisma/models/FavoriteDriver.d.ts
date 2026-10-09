import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type FavoriteDriverModel = runtime.Types.Result.DefaultSelection<Prisma.$FavoriteDriverPayload>;
export type AggregateFavoriteDriver = {
    _count: FavoriteDriverCountAggregateOutputType | null;
    _min: FavoriteDriverMinAggregateOutputType | null;
    _max: FavoriteDriverMaxAggregateOutputType | null;
};
export type FavoriteDriverMinAggregateOutputType = {
    id: string | null;
    passengerId: string | null;
    driverId: string | null;
    createdAt: Date | null;
};
export type FavoriteDriverMaxAggregateOutputType = {
    id: string | null;
    passengerId: string | null;
    driverId: string | null;
    createdAt: Date | null;
};
export type FavoriteDriverCountAggregateOutputType = {
    id: number;
    passengerId: number;
    driverId: number;
    createdAt: number;
    _all: number;
};
export type FavoriteDriverMinAggregateInputType = {
    id?: true;
    passengerId?: true;
    driverId?: true;
    createdAt?: true;
};
export type FavoriteDriverMaxAggregateInputType = {
    id?: true;
    passengerId?: true;
    driverId?: true;
    createdAt?: true;
};
export type FavoriteDriverCountAggregateInputType = {
    id?: true;
    passengerId?: true;
    driverId?: true;
    createdAt?: true;
    _all?: true;
};
export type FavoriteDriverAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.FavoriteDriverWhereInput;
    orderBy?: Prisma.FavoriteDriverOrderByWithRelationInput | Prisma.FavoriteDriverOrderByWithRelationInput[];
    cursor?: Prisma.FavoriteDriverWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | FavoriteDriverCountAggregateInputType;
    _min?: FavoriteDriverMinAggregateInputType;
    _max?: FavoriteDriverMaxAggregateInputType;
};
export type GetFavoriteDriverAggregateType<T extends FavoriteDriverAggregateArgs> = {
    [P in keyof T & keyof AggregateFavoriteDriver]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateFavoriteDriver[P]> : Prisma.GetScalarType<T[P], AggregateFavoriteDriver[P]>;
};
export type FavoriteDriverGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.FavoriteDriverWhereInput;
    orderBy?: Prisma.FavoriteDriverOrderByWithAggregationInput | Prisma.FavoriteDriverOrderByWithAggregationInput[];
    by: Prisma.FavoriteDriverScalarFieldEnum[] | Prisma.FavoriteDriverScalarFieldEnum;
    having?: Prisma.FavoriteDriverScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: FavoriteDriverCountAggregateInputType | true;
    _min?: FavoriteDriverMinAggregateInputType;
    _max?: FavoriteDriverMaxAggregateInputType;
};
export type FavoriteDriverGroupByOutputType = {
    id: string;
    passengerId: string;
    driverId: string;
    createdAt: Date;
    _count: FavoriteDriverCountAggregateOutputType | null;
    _min: FavoriteDriverMinAggregateOutputType | null;
    _max: FavoriteDriverMaxAggregateOutputType | null;
};
export type GetFavoriteDriverGroupByPayload<T extends FavoriteDriverGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<FavoriteDriverGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof FavoriteDriverGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], FavoriteDriverGroupByOutputType[P]> : Prisma.GetScalarType<T[P], FavoriteDriverGroupByOutputType[P]>;
}>>;
export type FavoriteDriverWhereInput = {
    AND?: Prisma.FavoriteDriverWhereInput | Prisma.FavoriteDriverWhereInput[];
    OR?: Prisma.FavoriteDriverWhereInput[];
    NOT?: Prisma.FavoriteDriverWhereInput | Prisma.FavoriteDriverWhereInput[];
    id?: Prisma.UuidFilter<"FavoriteDriver"> | string;
    passengerId?: Prisma.UuidFilter<"FavoriteDriver"> | string;
    driverId?: Prisma.UuidFilter<"FavoriteDriver"> | string;
    createdAt?: Prisma.DateTimeFilter<"FavoriteDriver"> | Date | string;
    passenger?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    driver?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
};
export type FavoriteDriverOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    passengerId?: Prisma.SortOrder;
    driverId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    passenger?: Prisma.UserOrderByWithRelationInput;
    driver?: Prisma.UserOrderByWithRelationInput;
};
export type FavoriteDriverWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    passengerId_driverId?: Prisma.FavoriteDriverPassengerIdDriverIdCompoundUniqueInput;
    AND?: Prisma.FavoriteDriverWhereInput | Prisma.FavoriteDriverWhereInput[];
    OR?: Prisma.FavoriteDriverWhereInput[];
    NOT?: Prisma.FavoriteDriverWhereInput | Prisma.FavoriteDriverWhereInput[];
    passengerId?: Prisma.UuidFilter<"FavoriteDriver"> | string;
    driverId?: Prisma.UuidFilter<"FavoriteDriver"> | string;
    createdAt?: Prisma.DateTimeFilter<"FavoriteDriver"> | Date | string;
    passenger?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    driver?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
}, "id" | "passengerId_driverId">;
export type FavoriteDriverOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    passengerId?: Prisma.SortOrder;
    driverId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.FavoriteDriverCountOrderByAggregateInput;
    _max?: Prisma.FavoriteDriverMaxOrderByAggregateInput;
    _min?: Prisma.FavoriteDriverMinOrderByAggregateInput;
};
export type FavoriteDriverScalarWhereWithAggregatesInput = {
    AND?: Prisma.FavoriteDriverScalarWhereWithAggregatesInput | Prisma.FavoriteDriverScalarWhereWithAggregatesInput[];
    OR?: Prisma.FavoriteDriverScalarWhereWithAggregatesInput[];
    NOT?: Prisma.FavoriteDriverScalarWhereWithAggregatesInput | Prisma.FavoriteDriverScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"FavoriteDriver"> | string;
    passengerId?: Prisma.UuidWithAggregatesFilter<"FavoriteDriver"> | string;
    driverId?: Prisma.UuidWithAggregatesFilter<"FavoriteDriver"> | string;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"FavoriteDriver"> | Date | string;
};
export type FavoriteDriverCreateInput = {
    id?: string;
    createdAt?: Date | string;
    passenger: Prisma.UserCreateNestedOneWithoutFavoriteDriversInput;
    driver: Prisma.UserCreateNestedOneWithoutFavoritedByInput;
};
export type FavoriteDriverUncheckedCreateInput = {
    id?: string;
    passengerId: string;
    driverId: string;
    createdAt?: Date | string;
};
export type FavoriteDriverUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    passenger?: Prisma.UserUpdateOneRequiredWithoutFavoriteDriversNestedInput;
    driver?: Prisma.UserUpdateOneRequiredWithoutFavoritedByNestedInput;
};
export type FavoriteDriverUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    passengerId?: Prisma.StringFieldUpdateOperationsInput | string;
    driverId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FavoriteDriverCreateManyInput = {
    id?: string;
    passengerId: string;
    driverId: string;
    createdAt?: Date | string;
};
export type FavoriteDriverUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FavoriteDriverUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    passengerId?: Prisma.StringFieldUpdateOperationsInput | string;
    driverId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FavoriteDriverListRelationFilter = {
    every?: Prisma.FavoriteDriverWhereInput;
    some?: Prisma.FavoriteDriverWhereInput;
    none?: Prisma.FavoriteDriverWhereInput;
};
export type FavoriteDriverOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type FavoriteDriverPassengerIdDriverIdCompoundUniqueInput = {
    passengerId: string;
    driverId: string;
};
export type FavoriteDriverCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    passengerId?: Prisma.SortOrder;
    driverId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type FavoriteDriverMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    passengerId?: Prisma.SortOrder;
    driverId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type FavoriteDriverMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    passengerId?: Prisma.SortOrder;
    driverId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type FavoriteDriverCreateNestedManyWithoutPassengerInput = {
    create?: Prisma.XOR<Prisma.FavoriteDriverCreateWithoutPassengerInput, Prisma.FavoriteDriverUncheckedCreateWithoutPassengerInput> | Prisma.FavoriteDriverCreateWithoutPassengerInput[] | Prisma.FavoriteDriverUncheckedCreateWithoutPassengerInput[];
    connectOrCreate?: Prisma.FavoriteDriverCreateOrConnectWithoutPassengerInput | Prisma.FavoriteDriverCreateOrConnectWithoutPassengerInput[];
    createMany?: Prisma.FavoriteDriverCreateManyPassengerInputEnvelope;
    connect?: Prisma.FavoriteDriverWhereUniqueInput | Prisma.FavoriteDriverWhereUniqueInput[];
};
export type FavoriteDriverCreateNestedManyWithoutDriverInput = {
    create?: Prisma.XOR<Prisma.FavoriteDriverCreateWithoutDriverInput, Prisma.FavoriteDriverUncheckedCreateWithoutDriverInput> | Prisma.FavoriteDriverCreateWithoutDriverInput[] | Prisma.FavoriteDriverUncheckedCreateWithoutDriverInput[];
    connectOrCreate?: Prisma.FavoriteDriverCreateOrConnectWithoutDriverInput | Prisma.FavoriteDriverCreateOrConnectWithoutDriverInput[];
    createMany?: Prisma.FavoriteDriverCreateManyDriverInputEnvelope;
    connect?: Prisma.FavoriteDriverWhereUniqueInput | Prisma.FavoriteDriverWhereUniqueInput[];
};
export type FavoriteDriverUncheckedCreateNestedManyWithoutPassengerInput = {
    create?: Prisma.XOR<Prisma.FavoriteDriverCreateWithoutPassengerInput, Prisma.FavoriteDriverUncheckedCreateWithoutPassengerInput> | Prisma.FavoriteDriverCreateWithoutPassengerInput[] | Prisma.FavoriteDriverUncheckedCreateWithoutPassengerInput[];
    connectOrCreate?: Prisma.FavoriteDriverCreateOrConnectWithoutPassengerInput | Prisma.FavoriteDriverCreateOrConnectWithoutPassengerInput[];
    createMany?: Prisma.FavoriteDriverCreateManyPassengerInputEnvelope;
    connect?: Prisma.FavoriteDriverWhereUniqueInput | Prisma.FavoriteDriverWhereUniqueInput[];
};
export type FavoriteDriverUncheckedCreateNestedManyWithoutDriverInput = {
    create?: Prisma.XOR<Prisma.FavoriteDriverCreateWithoutDriverInput, Prisma.FavoriteDriverUncheckedCreateWithoutDriverInput> | Prisma.FavoriteDriverCreateWithoutDriverInput[] | Prisma.FavoriteDriverUncheckedCreateWithoutDriverInput[];
    connectOrCreate?: Prisma.FavoriteDriverCreateOrConnectWithoutDriverInput | Prisma.FavoriteDriverCreateOrConnectWithoutDriverInput[];
    createMany?: Prisma.FavoriteDriverCreateManyDriverInputEnvelope;
    connect?: Prisma.FavoriteDriverWhereUniqueInput | Prisma.FavoriteDriverWhereUniqueInput[];
};
export type FavoriteDriverUpdateManyWithoutPassengerNestedInput = {
    create?: Prisma.XOR<Prisma.FavoriteDriverCreateWithoutPassengerInput, Prisma.FavoriteDriverUncheckedCreateWithoutPassengerInput> | Prisma.FavoriteDriverCreateWithoutPassengerInput[] | Prisma.FavoriteDriverUncheckedCreateWithoutPassengerInput[];
    connectOrCreate?: Prisma.FavoriteDriverCreateOrConnectWithoutPassengerInput | Prisma.FavoriteDriverCreateOrConnectWithoutPassengerInput[];
    upsert?: Prisma.FavoriteDriverUpsertWithWhereUniqueWithoutPassengerInput | Prisma.FavoriteDriverUpsertWithWhereUniqueWithoutPassengerInput[];
    createMany?: Prisma.FavoriteDriverCreateManyPassengerInputEnvelope;
    set?: Prisma.FavoriteDriverWhereUniqueInput | Prisma.FavoriteDriverWhereUniqueInput[];
    disconnect?: Prisma.FavoriteDriverWhereUniqueInput | Prisma.FavoriteDriverWhereUniqueInput[];
    delete?: Prisma.FavoriteDriverWhereUniqueInput | Prisma.FavoriteDriverWhereUniqueInput[];
    connect?: Prisma.FavoriteDriverWhereUniqueInput | Prisma.FavoriteDriverWhereUniqueInput[];
    update?: Prisma.FavoriteDriverUpdateWithWhereUniqueWithoutPassengerInput | Prisma.FavoriteDriverUpdateWithWhereUniqueWithoutPassengerInput[];
    updateMany?: Prisma.FavoriteDriverUpdateManyWithWhereWithoutPassengerInput | Prisma.FavoriteDriverUpdateManyWithWhereWithoutPassengerInput[];
    deleteMany?: Prisma.FavoriteDriverScalarWhereInput | Prisma.FavoriteDriverScalarWhereInput[];
};
export type FavoriteDriverUpdateManyWithoutDriverNestedInput = {
    create?: Prisma.XOR<Prisma.FavoriteDriverCreateWithoutDriverInput, Prisma.FavoriteDriverUncheckedCreateWithoutDriverInput> | Prisma.FavoriteDriverCreateWithoutDriverInput[] | Prisma.FavoriteDriverUncheckedCreateWithoutDriverInput[];
    connectOrCreate?: Prisma.FavoriteDriverCreateOrConnectWithoutDriverInput | Prisma.FavoriteDriverCreateOrConnectWithoutDriverInput[];
    upsert?: Prisma.FavoriteDriverUpsertWithWhereUniqueWithoutDriverInput | Prisma.FavoriteDriverUpsertWithWhereUniqueWithoutDriverInput[];
    createMany?: Prisma.FavoriteDriverCreateManyDriverInputEnvelope;
    set?: Prisma.FavoriteDriverWhereUniqueInput | Prisma.FavoriteDriverWhereUniqueInput[];
    disconnect?: Prisma.FavoriteDriverWhereUniqueInput | Prisma.FavoriteDriverWhereUniqueInput[];
    delete?: Prisma.FavoriteDriverWhereUniqueInput | Prisma.FavoriteDriverWhereUniqueInput[];
    connect?: Prisma.FavoriteDriverWhereUniqueInput | Prisma.FavoriteDriverWhereUniqueInput[];
    update?: Prisma.FavoriteDriverUpdateWithWhereUniqueWithoutDriverInput | Prisma.FavoriteDriverUpdateWithWhereUniqueWithoutDriverInput[];
    updateMany?: Prisma.FavoriteDriverUpdateManyWithWhereWithoutDriverInput | Prisma.FavoriteDriverUpdateManyWithWhereWithoutDriverInput[];
    deleteMany?: Prisma.FavoriteDriverScalarWhereInput | Prisma.FavoriteDriverScalarWhereInput[];
};
export type FavoriteDriverUncheckedUpdateManyWithoutPassengerNestedInput = {
    create?: Prisma.XOR<Prisma.FavoriteDriverCreateWithoutPassengerInput, Prisma.FavoriteDriverUncheckedCreateWithoutPassengerInput> | Prisma.FavoriteDriverCreateWithoutPassengerInput[] | Prisma.FavoriteDriverUncheckedCreateWithoutPassengerInput[];
    connectOrCreate?: Prisma.FavoriteDriverCreateOrConnectWithoutPassengerInput | Prisma.FavoriteDriverCreateOrConnectWithoutPassengerInput[];
    upsert?: Prisma.FavoriteDriverUpsertWithWhereUniqueWithoutPassengerInput | Prisma.FavoriteDriverUpsertWithWhereUniqueWithoutPassengerInput[];
    createMany?: Prisma.FavoriteDriverCreateManyPassengerInputEnvelope;
    set?: Prisma.FavoriteDriverWhereUniqueInput | Prisma.FavoriteDriverWhereUniqueInput[];
    disconnect?: Prisma.FavoriteDriverWhereUniqueInput | Prisma.FavoriteDriverWhereUniqueInput[];
    delete?: Prisma.FavoriteDriverWhereUniqueInput | Prisma.FavoriteDriverWhereUniqueInput[];
    connect?: Prisma.FavoriteDriverWhereUniqueInput | Prisma.FavoriteDriverWhereUniqueInput[];
    update?: Prisma.FavoriteDriverUpdateWithWhereUniqueWithoutPassengerInput | Prisma.FavoriteDriverUpdateWithWhereUniqueWithoutPassengerInput[];
    updateMany?: Prisma.FavoriteDriverUpdateManyWithWhereWithoutPassengerInput | Prisma.FavoriteDriverUpdateManyWithWhereWithoutPassengerInput[];
    deleteMany?: Prisma.FavoriteDriverScalarWhereInput | Prisma.FavoriteDriverScalarWhereInput[];
};
export type FavoriteDriverUncheckedUpdateManyWithoutDriverNestedInput = {
    create?: Prisma.XOR<Prisma.FavoriteDriverCreateWithoutDriverInput, Prisma.FavoriteDriverUncheckedCreateWithoutDriverInput> | Prisma.FavoriteDriverCreateWithoutDriverInput[] | Prisma.FavoriteDriverUncheckedCreateWithoutDriverInput[];
    connectOrCreate?: Prisma.FavoriteDriverCreateOrConnectWithoutDriverInput | Prisma.FavoriteDriverCreateOrConnectWithoutDriverInput[];
    upsert?: Prisma.FavoriteDriverUpsertWithWhereUniqueWithoutDriverInput | Prisma.FavoriteDriverUpsertWithWhereUniqueWithoutDriverInput[];
    createMany?: Prisma.FavoriteDriverCreateManyDriverInputEnvelope;
    set?: Prisma.FavoriteDriverWhereUniqueInput | Prisma.FavoriteDriverWhereUniqueInput[];
    disconnect?: Prisma.FavoriteDriverWhereUniqueInput | Prisma.FavoriteDriverWhereUniqueInput[];
    delete?: Prisma.FavoriteDriverWhereUniqueInput | Prisma.FavoriteDriverWhereUniqueInput[];
    connect?: Prisma.FavoriteDriverWhereUniqueInput | Prisma.FavoriteDriverWhereUniqueInput[];
    update?: Prisma.FavoriteDriverUpdateWithWhereUniqueWithoutDriverInput | Prisma.FavoriteDriverUpdateWithWhereUniqueWithoutDriverInput[];
    updateMany?: Prisma.FavoriteDriverUpdateManyWithWhereWithoutDriverInput | Prisma.FavoriteDriverUpdateManyWithWhereWithoutDriverInput[];
    deleteMany?: Prisma.FavoriteDriverScalarWhereInput | Prisma.FavoriteDriverScalarWhereInput[];
};
export type FavoriteDriverCreateWithoutPassengerInput = {
    id?: string;
    createdAt?: Date | string;
    driver: Prisma.UserCreateNestedOneWithoutFavoritedByInput;
};
export type FavoriteDriverUncheckedCreateWithoutPassengerInput = {
    id?: string;
    driverId: string;
    createdAt?: Date | string;
};
export type FavoriteDriverCreateOrConnectWithoutPassengerInput = {
    where: Prisma.FavoriteDriverWhereUniqueInput;
    create: Prisma.XOR<Prisma.FavoriteDriverCreateWithoutPassengerInput, Prisma.FavoriteDriverUncheckedCreateWithoutPassengerInput>;
};
export type FavoriteDriverCreateManyPassengerInputEnvelope = {
    data: Prisma.FavoriteDriverCreateManyPassengerInput | Prisma.FavoriteDriverCreateManyPassengerInput[];
    skipDuplicates?: boolean;
};
export type FavoriteDriverCreateWithoutDriverInput = {
    id?: string;
    createdAt?: Date | string;
    passenger: Prisma.UserCreateNestedOneWithoutFavoriteDriversInput;
};
export type FavoriteDriverUncheckedCreateWithoutDriverInput = {
    id?: string;
    passengerId: string;
    createdAt?: Date | string;
};
export type FavoriteDriverCreateOrConnectWithoutDriverInput = {
    where: Prisma.FavoriteDriverWhereUniqueInput;
    create: Prisma.XOR<Prisma.FavoriteDriverCreateWithoutDriverInput, Prisma.FavoriteDriverUncheckedCreateWithoutDriverInput>;
};
export type FavoriteDriverCreateManyDriverInputEnvelope = {
    data: Prisma.FavoriteDriverCreateManyDriverInput | Prisma.FavoriteDriverCreateManyDriverInput[];
    skipDuplicates?: boolean;
};
export type FavoriteDriverUpsertWithWhereUniqueWithoutPassengerInput = {
    where: Prisma.FavoriteDriverWhereUniqueInput;
    update: Prisma.XOR<Prisma.FavoriteDriverUpdateWithoutPassengerInput, Prisma.FavoriteDriverUncheckedUpdateWithoutPassengerInput>;
    create: Prisma.XOR<Prisma.FavoriteDriverCreateWithoutPassengerInput, Prisma.FavoriteDriverUncheckedCreateWithoutPassengerInput>;
};
export type FavoriteDriverUpdateWithWhereUniqueWithoutPassengerInput = {
    where: Prisma.FavoriteDriverWhereUniqueInput;
    data: Prisma.XOR<Prisma.FavoriteDriverUpdateWithoutPassengerInput, Prisma.FavoriteDriverUncheckedUpdateWithoutPassengerInput>;
};
export type FavoriteDriverUpdateManyWithWhereWithoutPassengerInput = {
    where: Prisma.FavoriteDriverScalarWhereInput;
    data: Prisma.XOR<Prisma.FavoriteDriverUpdateManyMutationInput, Prisma.FavoriteDriverUncheckedUpdateManyWithoutPassengerInput>;
};
export type FavoriteDriverScalarWhereInput = {
    AND?: Prisma.FavoriteDriverScalarWhereInput | Prisma.FavoriteDriverScalarWhereInput[];
    OR?: Prisma.FavoriteDriverScalarWhereInput[];
    NOT?: Prisma.FavoriteDriverScalarWhereInput | Prisma.FavoriteDriverScalarWhereInput[];
    id?: Prisma.UuidFilter<"FavoriteDriver"> | string;
    passengerId?: Prisma.UuidFilter<"FavoriteDriver"> | string;
    driverId?: Prisma.UuidFilter<"FavoriteDriver"> | string;
    createdAt?: Prisma.DateTimeFilter<"FavoriteDriver"> | Date | string;
};
export type FavoriteDriverUpsertWithWhereUniqueWithoutDriverInput = {
    where: Prisma.FavoriteDriverWhereUniqueInput;
    update: Prisma.XOR<Prisma.FavoriteDriverUpdateWithoutDriverInput, Prisma.FavoriteDriverUncheckedUpdateWithoutDriverInput>;
    create: Prisma.XOR<Prisma.FavoriteDriverCreateWithoutDriverInput, Prisma.FavoriteDriverUncheckedCreateWithoutDriverInput>;
};
export type FavoriteDriverUpdateWithWhereUniqueWithoutDriverInput = {
    where: Prisma.FavoriteDriverWhereUniqueInput;
    data: Prisma.XOR<Prisma.FavoriteDriverUpdateWithoutDriverInput, Prisma.FavoriteDriverUncheckedUpdateWithoutDriverInput>;
};
export type FavoriteDriverUpdateManyWithWhereWithoutDriverInput = {
    where: Prisma.FavoriteDriverScalarWhereInput;
    data: Prisma.XOR<Prisma.FavoriteDriverUpdateManyMutationInput, Prisma.FavoriteDriverUncheckedUpdateManyWithoutDriverInput>;
};
export type FavoriteDriverCreateManyPassengerInput = {
    id?: string;
    driverId: string;
    createdAt?: Date | string;
};
export type FavoriteDriverCreateManyDriverInput = {
    id?: string;
    passengerId: string;
    createdAt?: Date | string;
};
export type FavoriteDriverUpdateWithoutPassengerInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    driver?: Prisma.UserUpdateOneRequiredWithoutFavoritedByNestedInput;
};
export type FavoriteDriverUncheckedUpdateWithoutPassengerInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    driverId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FavoriteDriverUncheckedUpdateManyWithoutPassengerInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    driverId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FavoriteDriverUpdateWithoutDriverInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    passenger?: Prisma.UserUpdateOneRequiredWithoutFavoriteDriversNestedInput;
};
export type FavoriteDriverUncheckedUpdateWithoutDriverInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    passengerId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FavoriteDriverUncheckedUpdateManyWithoutDriverInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    passengerId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type FavoriteDriverSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    passengerId?: boolean;
    driverId?: boolean;
    createdAt?: boolean;
    passenger?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    driver?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["favoriteDriver"]>;
export type FavoriteDriverSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    passengerId?: boolean;
    driverId?: boolean;
    createdAt?: boolean;
    passenger?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    driver?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["favoriteDriver"]>;
export type FavoriteDriverSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    passengerId?: boolean;
    driverId?: boolean;
    createdAt?: boolean;
    passenger?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    driver?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["favoriteDriver"]>;
export type FavoriteDriverSelectScalar = {
    id?: boolean;
    passengerId?: boolean;
    driverId?: boolean;
    createdAt?: boolean;
};
export type FavoriteDriverOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "passengerId" | "driverId" | "createdAt", ExtArgs["result"]["favoriteDriver"]>;
export type FavoriteDriverInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    passenger?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    driver?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type FavoriteDriverIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    passenger?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    driver?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type FavoriteDriverIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    passenger?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    driver?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type $FavoriteDriverPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "FavoriteDriver";
    objects: {
        passenger: Prisma.$UserPayload<ExtArgs>;
        driver: Prisma.$UserPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        passengerId: string;
        driverId: string;
        createdAt: Date;
    }, ExtArgs["result"]["favoriteDriver"]>;
    composites: {};
};
export type FavoriteDriverGetPayload<S extends boolean | null | undefined | FavoriteDriverDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$FavoriteDriverPayload, S>;
export type FavoriteDriverCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<FavoriteDriverFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: FavoriteDriverCountAggregateInputType | true;
};
export interface FavoriteDriverDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['FavoriteDriver'];
        meta: {
            name: 'FavoriteDriver';
        };
    };
    findUnique<T extends FavoriteDriverFindUniqueArgs>(args: Prisma.SelectSubset<T, FavoriteDriverFindUniqueArgs<ExtArgs>>): Prisma.Prisma__FavoriteDriverClient<runtime.Types.Result.GetResult<Prisma.$FavoriteDriverPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends FavoriteDriverFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, FavoriteDriverFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__FavoriteDriverClient<runtime.Types.Result.GetResult<Prisma.$FavoriteDriverPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends FavoriteDriverFindFirstArgs>(args?: Prisma.SelectSubset<T, FavoriteDriverFindFirstArgs<ExtArgs>>): Prisma.Prisma__FavoriteDriverClient<runtime.Types.Result.GetResult<Prisma.$FavoriteDriverPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends FavoriteDriverFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, FavoriteDriverFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__FavoriteDriverClient<runtime.Types.Result.GetResult<Prisma.$FavoriteDriverPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends FavoriteDriverFindManyArgs>(args?: Prisma.SelectSubset<T, FavoriteDriverFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$FavoriteDriverPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends FavoriteDriverCreateArgs>(args: Prisma.SelectSubset<T, FavoriteDriverCreateArgs<ExtArgs>>): Prisma.Prisma__FavoriteDriverClient<runtime.Types.Result.GetResult<Prisma.$FavoriteDriverPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends FavoriteDriverCreateManyArgs>(args?: Prisma.SelectSubset<T, FavoriteDriverCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends FavoriteDriverCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, FavoriteDriverCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$FavoriteDriverPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends FavoriteDriverDeleteArgs>(args: Prisma.SelectSubset<T, FavoriteDriverDeleteArgs<ExtArgs>>): Prisma.Prisma__FavoriteDriverClient<runtime.Types.Result.GetResult<Prisma.$FavoriteDriverPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends FavoriteDriverUpdateArgs>(args: Prisma.SelectSubset<T, FavoriteDriverUpdateArgs<ExtArgs>>): Prisma.Prisma__FavoriteDriverClient<runtime.Types.Result.GetResult<Prisma.$FavoriteDriverPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends FavoriteDriverDeleteManyArgs>(args?: Prisma.SelectSubset<T, FavoriteDriverDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends FavoriteDriverUpdateManyArgs>(args: Prisma.SelectSubset<T, FavoriteDriverUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends FavoriteDriverUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, FavoriteDriverUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$FavoriteDriverPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends FavoriteDriverUpsertArgs>(args: Prisma.SelectSubset<T, FavoriteDriverUpsertArgs<ExtArgs>>): Prisma.Prisma__FavoriteDriverClient<runtime.Types.Result.GetResult<Prisma.$FavoriteDriverPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends FavoriteDriverCountArgs>(args?: Prisma.Subset<T, FavoriteDriverCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], FavoriteDriverCountAggregateOutputType> : number>;
    aggregate<T extends FavoriteDriverAggregateArgs>(args: Prisma.Subset<T, FavoriteDriverAggregateArgs>): Prisma.PrismaPromise<GetFavoriteDriverAggregateType<T>>;
    groupBy<T extends FavoriteDriverGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: FavoriteDriverGroupByArgs['orderBy'];
    } : {
        orderBy?: FavoriteDriverGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, FavoriteDriverGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFavoriteDriverGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: FavoriteDriverFieldRefs;
}
export interface Prisma__FavoriteDriverClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    passenger<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    driver<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface FavoriteDriverFieldRefs {
    readonly id: Prisma.FieldRef<"FavoriteDriver", 'String'>;
    readonly passengerId: Prisma.FieldRef<"FavoriteDriver", 'String'>;
    readonly driverId: Prisma.FieldRef<"FavoriteDriver", 'String'>;
    readonly createdAt: Prisma.FieldRef<"FavoriteDriver", 'DateTime'>;
}
export type FavoriteDriverFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FavoriteDriverSelect<ExtArgs> | null;
    omit?: Prisma.FavoriteDriverOmit<ExtArgs> | null;
    include?: Prisma.FavoriteDriverInclude<ExtArgs> | null;
    where: Prisma.FavoriteDriverWhereUniqueInput;
};
export type FavoriteDriverFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FavoriteDriverSelect<ExtArgs> | null;
    omit?: Prisma.FavoriteDriverOmit<ExtArgs> | null;
    include?: Prisma.FavoriteDriverInclude<ExtArgs> | null;
    where: Prisma.FavoriteDriverWhereUniqueInput;
};
export type FavoriteDriverFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FavoriteDriverSelect<ExtArgs> | null;
    omit?: Prisma.FavoriteDriverOmit<ExtArgs> | null;
    include?: Prisma.FavoriteDriverInclude<ExtArgs> | null;
    where?: Prisma.FavoriteDriverWhereInput;
    orderBy?: Prisma.FavoriteDriverOrderByWithRelationInput | Prisma.FavoriteDriverOrderByWithRelationInput[];
    cursor?: Prisma.FavoriteDriverWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.FavoriteDriverScalarFieldEnum | Prisma.FavoriteDriverScalarFieldEnum[];
};
export type FavoriteDriverFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FavoriteDriverSelect<ExtArgs> | null;
    omit?: Prisma.FavoriteDriverOmit<ExtArgs> | null;
    include?: Prisma.FavoriteDriverInclude<ExtArgs> | null;
    where?: Prisma.FavoriteDriverWhereInput;
    orderBy?: Prisma.FavoriteDriverOrderByWithRelationInput | Prisma.FavoriteDriverOrderByWithRelationInput[];
    cursor?: Prisma.FavoriteDriverWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.FavoriteDriverScalarFieldEnum | Prisma.FavoriteDriverScalarFieldEnum[];
};
export type FavoriteDriverFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FavoriteDriverSelect<ExtArgs> | null;
    omit?: Prisma.FavoriteDriverOmit<ExtArgs> | null;
    include?: Prisma.FavoriteDriverInclude<ExtArgs> | null;
    where?: Prisma.FavoriteDriverWhereInput;
    orderBy?: Prisma.FavoriteDriverOrderByWithRelationInput | Prisma.FavoriteDriverOrderByWithRelationInput[];
    cursor?: Prisma.FavoriteDriverWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.FavoriteDriverScalarFieldEnum | Prisma.FavoriteDriverScalarFieldEnum[];
};
export type FavoriteDriverCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FavoriteDriverSelect<ExtArgs> | null;
    omit?: Prisma.FavoriteDriverOmit<ExtArgs> | null;
    include?: Prisma.FavoriteDriverInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.FavoriteDriverCreateInput, Prisma.FavoriteDriverUncheckedCreateInput>;
};
export type FavoriteDriverCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.FavoriteDriverCreateManyInput | Prisma.FavoriteDriverCreateManyInput[];
    skipDuplicates?: boolean;
};
export type FavoriteDriverCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FavoriteDriverSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.FavoriteDriverOmit<ExtArgs> | null;
    data: Prisma.FavoriteDriverCreateManyInput | Prisma.FavoriteDriverCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.FavoriteDriverIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type FavoriteDriverUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FavoriteDriverSelect<ExtArgs> | null;
    omit?: Prisma.FavoriteDriverOmit<ExtArgs> | null;
    include?: Prisma.FavoriteDriverInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.FavoriteDriverUpdateInput, Prisma.FavoriteDriverUncheckedUpdateInput>;
    where: Prisma.FavoriteDriverWhereUniqueInput;
};
export type FavoriteDriverUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.FavoriteDriverUpdateManyMutationInput, Prisma.FavoriteDriverUncheckedUpdateManyInput>;
    where?: Prisma.FavoriteDriverWhereInput;
    limit?: number;
};
export type FavoriteDriverUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FavoriteDriverSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.FavoriteDriverOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.FavoriteDriverUpdateManyMutationInput, Prisma.FavoriteDriverUncheckedUpdateManyInput>;
    where?: Prisma.FavoriteDriverWhereInput;
    limit?: number;
    include?: Prisma.FavoriteDriverIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type FavoriteDriverUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FavoriteDriverSelect<ExtArgs> | null;
    omit?: Prisma.FavoriteDriverOmit<ExtArgs> | null;
    include?: Prisma.FavoriteDriverInclude<ExtArgs> | null;
    where: Prisma.FavoriteDriverWhereUniqueInput;
    create: Prisma.XOR<Prisma.FavoriteDriverCreateInput, Prisma.FavoriteDriverUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.FavoriteDriverUpdateInput, Prisma.FavoriteDriverUncheckedUpdateInput>;
};
export type FavoriteDriverDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FavoriteDriverSelect<ExtArgs> | null;
    omit?: Prisma.FavoriteDriverOmit<ExtArgs> | null;
    include?: Prisma.FavoriteDriverInclude<ExtArgs> | null;
    where: Prisma.FavoriteDriverWhereUniqueInput;
};
export type FavoriteDriverDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.FavoriteDriverWhereInput;
    limit?: number;
};
export type FavoriteDriverDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.FavoriteDriverSelect<ExtArgs> | null;
    omit?: Prisma.FavoriteDriverOmit<ExtArgs> | null;
    include?: Prisma.FavoriteDriverInclude<ExtArgs> | null;
};
