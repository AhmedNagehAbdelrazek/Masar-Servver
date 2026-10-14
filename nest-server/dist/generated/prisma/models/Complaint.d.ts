import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type ComplaintModel = runtime.Types.Result.DefaultSelection<Prisma.$ComplaintPayload>;
export type AggregateComplaint = {
    _count: ComplaintCountAggregateOutputType | null;
    _min: ComplaintMinAggregateOutputType | null;
    _max: ComplaintMaxAggregateOutputType | null;
};
export type ComplaintMinAggregateOutputType = {
    id: string | null;
    bookingId: string | null;
    reporterId: string | null;
    accusedId: string | null;
    category: string | null;
    description: string | null;
    status: string | null;
    resolution: string | null;
    resolvedBy: string | null;
    resolvedAt: Date | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type ComplaintMaxAggregateOutputType = {
    id: string | null;
    bookingId: string | null;
    reporterId: string | null;
    accusedId: string | null;
    category: string | null;
    description: string | null;
    status: string | null;
    resolution: string | null;
    resolvedBy: string | null;
    resolvedAt: Date | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type ComplaintCountAggregateOutputType = {
    id: number;
    bookingId: number;
    reporterId: number;
    accusedId: number;
    category: number;
    description: number;
    evidenceUrls: number;
    status: number;
    resolution: number;
    resolvedBy: number;
    resolvedAt: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type ComplaintMinAggregateInputType = {
    id?: true;
    bookingId?: true;
    reporterId?: true;
    accusedId?: true;
    category?: true;
    description?: true;
    status?: true;
    resolution?: true;
    resolvedBy?: true;
    resolvedAt?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type ComplaintMaxAggregateInputType = {
    id?: true;
    bookingId?: true;
    reporterId?: true;
    accusedId?: true;
    category?: true;
    description?: true;
    status?: true;
    resolution?: true;
    resolvedBy?: true;
    resolvedAt?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type ComplaintCountAggregateInputType = {
    id?: true;
    bookingId?: true;
    reporterId?: true;
    accusedId?: true;
    category?: true;
    description?: true;
    evidenceUrls?: true;
    status?: true;
    resolution?: true;
    resolvedBy?: true;
    resolvedAt?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type ComplaintAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ComplaintWhereInput;
    orderBy?: Prisma.ComplaintOrderByWithRelationInput | Prisma.ComplaintOrderByWithRelationInput[];
    cursor?: Prisma.ComplaintWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | ComplaintCountAggregateInputType;
    _min?: ComplaintMinAggregateInputType;
    _max?: ComplaintMaxAggregateInputType;
};
export type GetComplaintAggregateType<T extends ComplaintAggregateArgs> = {
    [P in keyof T & keyof AggregateComplaint]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateComplaint[P]> : Prisma.GetScalarType<T[P], AggregateComplaint[P]>;
};
export type ComplaintGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ComplaintWhereInput;
    orderBy?: Prisma.ComplaintOrderByWithAggregationInput | Prisma.ComplaintOrderByWithAggregationInput[];
    by: Prisma.ComplaintScalarFieldEnum[] | Prisma.ComplaintScalarFieldEnum;
    having?: Prisma.ComplaintScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: ComplaintCountAggregateInputType | true;
    _min?: ComplaintMinAggregateInputType;
    _max?: ComplaintMaxAggregateInputType;
};
export type ComplaintGroupByOutputType = {
    id: string;
    bookingId: string | null;
    reporterId: string;
    accusedId: string;
    category: string;
    description: string;
    evidenceUrls: string[];
    status: string;
    resolution: string | null;
    resolvedBy: string | null;
    resolvedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    _count: ComplaintCountAggregateOutputType | null;
    _min: ComplaintMinAggregateOutputType | null;
    _max: ComplaintMaxAggregateOutputType | null;
};
export type GetComplaintGroupByPayload<T extends ComplaintGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<ComplaintGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof ComplaintGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], ComplaintGroupByOutputType[P]> : Prisma.GetScalarType<T[P], ComplaintGroupByOutputType[P]>;
}>>;
export type ComplaintWhereInput = {
    AND?: Prisma.ComplaintWhereInput | Prisma.ComplaintWhereInput[];
    OR?: Prisma.ComplaintWhereInput[];
    NOT?: Prisma.ComplaintWhereInput | Prisma.ComplaintWhereInput[];
    id?: Prisma.UuidFilter<"Complaint"> | string;
    bookingId?: Prisma.UuidNullableFilter<"Complaint"> | string | null;
    reporterId?: Prisma.UuidFilter<"Complaint"> | string;
    accusedId?: Prisma.UuidFilter<"Complaint"> | string;
    category?: Prisma.StringFilter<"Complaint"> | string;
    description?: Prisma.StringFilter<"Complaint"> | string;
    evidenceUrls?: Prisma.StringNullableListFilter<"Complaint">;
    status?: Prisma.StringFilter<"Complaint"> | string;
    resolution?: Prisma.StringNullableFilter<"Complaint"> | string | null;
    resolvedBy?: Prisma.UuidNullableFilter<"Complaint"> | string | null;
    resolvedAt?: Prisma.DateTimeNullableFilter<"Complaint"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"Complaint"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Complaint"> | Date | string;
    reporter?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    accused?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    penalties?: Prisma.PenaltyListRelationFilter;
};
export type ComplaintOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    bookingId?: Prisma.SortOrderInput | Prisma.SortOrder;
    reporterId?: Prisma.SortOrder;
    accusedId?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    evidenceUrls?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    resolution?: Prisma.SortOrderInput | Prisma.SortOrder;
    resolvedBy?: Prisma.SortOrderInput | Prisma.SortOrder;
    resolvedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    reporter?: Prisma.UserOrderByWithRelationInput;
    accused?: Prisma.UserOrderByWithRelationInput;
    penalties?: Prisma.PenaltyOrderByRelationAggregateInput;
};
export type ComplaintWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.ComplaintWhereInput | Prisma.ComplaintWhereInput[];
    OR?: Prisma.ComplaintWhereInput[];
    NOT?: Prisma.ComplaintWhereInput | Prisma.ComplaintWhereInput[];
    bookingId?: Prisma.UuidNullableFilter<"Complaint"> | string | null;
    reporterId?: Prisma.UuidFilter<"Complaint"> | string;
    accusedId?: Prisma.UuidFilter<"Complaint"> | string;
    category?: Prisma.StringFilter<"Complaint"> | string;
    description?: Prisma.StringFilter<"Complaint"> | string;
    evidenceUrls?: Prisma.StringNullableListFilter<"Complaint">;
    status?: Prisma.StringFilter<"Complaint"> | string;
    resolution?: Prisma.StringNullableFilter<"Complaint"> | string | null;
    resolvedBy?: Prisma.UuidNullableFilter<"Complaint"> | string | null;
    resolvedAt?: Prisma.DateTimeNullableFilter<"Complaint"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"Complaint"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Complaint"> | Date | string;
    reporter?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    accused?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    penalties?: Prisma.PenaltyListRelationFilter;
}, "id">;
export type ComplaintOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    bookingId?: Prisma.SortOrderInput | Prisma.SortOrder;
    reporterId?: Prisma.SortOrder;
    accusedId?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    evidenceUrls?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    resolution?: Prisma.SortOrderInput | Prisma.SortOrder;
    resolvedBy?: Prisma.SortOrderInput | Prisma.SortOrder;
    resolvedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.ComplaintCountOrderByAggregateInput;
    _max?: Prisma.ComplaintMaxOrderByAggregateInput;
    _min?: Prisma.ComplaintMinOrderByAggregateInput;
};
export type ComplaintScalarWhereWithAggregatesInput = {
    AND?: Prisma.ComplaintScalarWhereWithAggregatesInput | Prisma.ComplaintScalarWhereWithAggregatesInput[];
    OR?: Prisma.ComplaintScalarWhereWithAggregatesInput[];
    NOT?: Prisma.ComplaintScalarWhereWithAggregatesInput | Prisma.ComplaintScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"Complaint"> | string;
    bookingId?: Prisma.UuidNullableWithAggregatesFilter<"Complaint"> | string | null;
    reporterId?: Prisma.UuidWithAggregatesFilter<"Complaint"> | string;
    accusedId?: Prisma.UuidWithAggregatesFilter<"Complaint"> | string;
    category?: Prisma.StringWithAggregatesFilter<"Complaint"> | string;
    description?: Prisma.StringWithAggregatesFilter<"Complaint"> | string;
    evidenceUrls?: Prisma.StringNullableListFilter<"Complaint">;
    status?: Prisma.StringWithAggregatesFilter<"Complaint"> | string;
    resolution?: Prisma.StringNullableWithAggregatesFilter<"Complaint"> | string | null;
    resolvedBy?: Prisma.UuidNullableWithAggregatesFilter<"Complaint"> | string | null;
    resolvedAt?: Prisma.DateTimeNullableWithAggregatesFilter<"Complaint"> | Date | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Complaint"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"Complaint"> | Date | string;
};
export type ComplaintCreateInput = {
    id?: string;
    bookingId?: string | null;
    category: string;
    description: string;
    evidenceUrls?: Prisma.ComplaintCreateevidenceUrlsInput | string[];
    status?: string;
    resolution?: string | null;
    resolvedBy?: string | null;
    resolvedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    reporter: Prisma.UserCreateNestedOneWithoutComplaintsReportedInput;
    accused: Prisma.UserCreateNestedOneWithoutComplaintsAccusedInput;
    penalties?: Prisma.PenaltyCreateNestedManyWithoutComplaintInput;
};
export type ComplaintUncheckedCreateInput = {
    id?: string;
    bookingId?: string | null;
    reporterId: string;
    accusedId: string;
    category: string;
    description: string;
    evidenceUrls?: Prisma.ComplaintCreateevidenceUrlsInput | string[];
    status?: string;
    resolution?: string | null;
    resolvedBy?: string | null;
    resolvedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    penalties?: Prisma.PenaltyUncheckedCreateNestedManyWithoutComplaintInput;
};
export type ComplaintUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    evidenceUrls?: Prisma.ComplaintUpdateevidenceUrlsInput | string[];
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    resolution?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    resolvedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    resolvedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    reporter?: Prisma.UserUpdateOneRequiredWithoutComplaintsReportedNestedInput;
    accused?: Prisma.UserUpdateOneRequiredWithoutComplaintsAccusedNestedInput;
    penalties?: Prisma.PenaltyUpdateManyWithoutComplaintNestedInput;
};
export type ComplaintUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    reporterId?: Prisma.StringFieldUpdateOperationsInput | string;
    accusedId?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    evidenceUrls?: Prisma.ComplaintUpdateevidenceUrlsInput | string[];
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    resolution?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    resolvedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    resolvedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    penalties?: Prisma.PenaltyUncheckedUpdateManyWithoutComplaintNestedInput;
};
export type ComplaintCreateManyInput = {
    id?: string;
    bookingId?: string | null;
    reporterId: string;
    accusedId: string;
    category: string;
    description: string;
    evidenceUrls?: Prisma.ComplaintCreateevidenceUrlsInput | string[];
    status?: string;
    resolution?: string | null;
    resolvedBy?: string | null;
    resolvedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type ComplaintUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    evidenceUrls?: Prisma.ComplaintUpdateevidenceUrlsInput | string[];
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    resolution?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    resolvedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    resolvedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ComplaintUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    reporterId?: Prisma.StringFieldUpdateOperationsInput | string;
    accusedId?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    evidenceUrls?: Prisma.ComplaintUpdateevidenceUrlsInput | string[];
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    resolution?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    resolvedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    resolvedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ComplaintListRelationFilter = {
    every?: Prisma.ComplaintWhereInput;
    some?: Prisma.ComplaintWhereInput;
    none?: Prisma.ComplaintWhereInput;
};
export type ComplaintOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type ComplaintCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    bookingId?: Prisma.SortOrder;
    reporterId?: Prisma.SortOrder;
    accusedId?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    evidenceUrls?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    resolution?: Prisma.SortOrder;
    resolvedBy?: Prisma.SortOrder;
    resolvedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type ComplaintMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    bookingId?: Prisma.SortOrder;
    reporterId?: Prisma.SortOrder;
    accusedId?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    resolution?: Prisma.SortOrder;
    resolvedBy?: Prisma.SortOrder;
    resolvedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type ComplaintMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    bookingId?: Prisma.SortOrder;
    reporterId?: Prisma.SortOrder;
    accusedId?: Prisma.SortOrder;
    category?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    resolution?: Prisma.SortOrder;
    resolvedBy?: Prisma.SortOrder;
    resolvedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type ComplaintNullableScalarRelationFilter = {
    is?: Prisma.ComplaintWhereInput | null;
    isNot?: Prisma.ComplaintWhereInput | null;
};
export type ComplaintCreateNestedManyWithoutReporterInput = {
    create?: Prisma.XOR<Prisma.ComplaintCreateWithoutReporterInput, Prisma.ComplaintUncheckedCreateWithoutReporterInput> | Prisma.ComplaintCreateWithoutReporterInput[] | Prisma.ComplaintUncheckedCreateWithoutReporterInput[];
    connectOrCreate?: Prisma.ComplaintCreateOrConnectWithoutReporterInput | Prisma.ComplaintCreateOrConnectWithoutReporterInput[];
    createMany?: Prisma.ComplaintCreateManyReporterInputEnvelope;
    connect?: Prisma.ComplaintWhereUniqueInput | Prisma.ComplaintWhereUniqueInput[];
};
export type ComplaintCreateNestedManyWithoutAccusedInput = {
    create?: Prisma.XOR<Prisma.ComplaintCreateWithoutAccusedInput, Prisma.ComplaintUncheckedCreateWithoutAccusedInput> | Prisma.ComplaintCreateWithoutAccusedInput[] | Prisma.ComplaintUncheckedCreateWithoutAccusedInput[];
    connectOrCreate?: Prisma.ComplaintCreateOrConnectWithoutAccusedInput | Prisma.ComplaintCreateOrConnectWithoutAccusedInput[];
    createMany?: Prisma.ComplaintCreateManyAccusedInputEnvelope;
    connect?: Prisma.ComplaintWhereUniqueInput | Prisma.ComplaintWhereUniqueInput[];
};
export type ComplaintUncheckedCreateNestedManyWithoutReporterInput = {
    create?: Prisma.XOR<Prisma.ComplaintCreateWithoutReporterInput, Prisma.ComplaintUncheckedCreateWithoutReporterInput> | Prisma.ComplaintCreateWithoutReporterInput[] | Prisma.ComplaintUncheckedCreateWithoutReporterInput[];
    connectOrCreate?: Prisma.ComplaintCreateOrConnectWithoutReporterInput | Prisma.ComplaintCreateOrConnectWithoutReporterInput[];
    createMany?: Prisma.ComplaintCreateManyReporterInputEnvelope;
    connect?: Prisma.ComplaintWhereUniqueInput | Prisma.ComplaintWhereUniqueInput[];
};
export type ComplaintUncheckedCreateNestedManyWithoutAccusedInput = {
    create?: Prisma.XOR<Prisma.ComplaintCreateWithoutAccusedInput, Prisma.ComplaintUncheckedCreateWithoutAccusedInput> | Prisma.ComplaintCreateWithoutAccusedInput[] | Prisma.ComplaintUncheckedCreateWithoutAccusedInput[];
    connectOrCreate?: Prisma.ComplaintCreateOrConnectWithoutAccusedInput | Prisma.ComplaintCreateOrConnectWithoutAccusedInput[];
    createMany?: Prisma.ComplaintCreateManyAccusedInputEnvelope;
    connect?: Prisma.ComplaintWhereUniqueInput | Prisma.ComplaintWhereUniqueInput[];
};
export type ComplaintUpdateManyWithoutReporterNestedInput = {
    create?: Prisma.XOR<Prisma.ComplaintCreateWithoutReporterInput, Prisma.ComplaintUncheckedCreateWithoutReporterInput> | Prisma.ComplaintCreateWithoutReporterInput[] | Prisma.ComplaintUncheckedCreateWithoutReporterInput[];
    connectOrCreate?: Prisma.ComplaintCreateOrConnectWithoutReporterInput | Prisma.ComplaintCreateOrConnectWithoutReporterInput[];
    upsert?: Prisma.ComplaintUpsertWithWhereUniqueWithoutReporterInput | Prisma.ComplaintUpsertWithWhereUniqueWithoutReporterInput[];
    createMany?: Prisma.ComplaintCreateManyReporterInputEnvelope;
    set?: Prisma.ComplaintWhereUniqueInput | Prisma.ComplaintWhereUniqueInput[];
    disconnect?: Prisma.ComplaintWhereUniqueInput | Prisma.ComplaintWhereUniqueInput[];
    delete?: Prisma.ComplaintWhereUniqueInput | Prisma.ComplaintWhereUniqueInput[];
    connect?: Prisma.ComplaintWhereUniqueInput | Prisma.ComplaintWhereUniqueInput[];
    update?: Prisma.ComplaintUpdateWithWhereUniqueWithoutReporterInput | Prisma.ComplaintUpdateWithWhereUniqueWithoutReporterInput[];
    updateMany?: Prisma.ComplaintUpdateManyWithWhereWithoutReporterInput | Prisma.ComplaintUpdateManyWithWhereWithoutReporterInput[];
    deleteMany?: Prisma.ComplaintScalarWhereInput | Prisma.ComplaintScalarWhereInput[];
};
export type ComplaintUpdateManyWithoutAccusedNestedInput = {
    create?: Prisma.XOR<Prisma.ComplaintCreateWithoutAccusedInput, Prisma.ComplaintUncheckedCreateWithoutAccusedInput> | Prisma.ComplaintCreateWithoutAccusedInput[] | Prisma.ComplaintUncheckedCreateWithoutAccusedInput[];
    connectOrCreate?: Prisma.ComplaintCreateOrConnectWithoutAccusedInput | Prisma.ComplaintCreateOrConnectWithoutAccusedInput[];
    upsert?: Prisma.ComplaintUpsertWithWhereUniqueWithoutAccusedInput | Prisma.ComplaintUpsertWithWhereUniqueWithoutAccusedInput[];
    createMany?: Prisma.ComplaintCreateManyAccusedInputEnvelope;
    set?: Prisma.ComplaintWhereUniqueInput | Prisma.ComplaintWhereUniqueInput[];
    disconnect?: Prisma.ComplaintWhereUniqueInput | Prisma.ComplaintWhereUniqueInput[];
    delete?: Prisma.ComplaintWhereUniqueInput | Prisma.ComplaintWhereUniqueInput[];
    connect?: Prisma.ComplaintWhereUniqueInput | Prisma.ComplaintWhereUniqueInput[];
    update?: Prisma.ComplaintUpdateWithWhereUniqueWithoutAccusedInput | Prisma.ComplaintUpdateWithWhereUniqueWithoutAccusedInput[];
    updateMany?: Prisma.ComplaintUpdateManyWithWhereWithoutAccusedInput | Prisma.ComplaintUpdateManyWithWhereWithoutAccusedInput[];
    deleteMany?: Prisma.ComplaintScalarWhereInput | Prisma.ComplaintScalarWhereInput[];
};
export type ComplaintUncheckedUpdateManyWithoutReporterNestedInput = {
    create?: Prisma.XOR<Prisma.ComplaintCreateWithoutReporterInput, Prisma.ComplaintUncheckedCreateWithoutReporterInput> | Prisma.ComplaintCreateWithoutReporterInput[] | Prisma.ComplaintUncheckedCreateWithoutReporterInput[];
    connectOrCreate?: Prisma.ComplaintCreateOrConnectWithoutReporterInput | Prisma.ComplaintCreateOrConnectWithoutReporterInput[];
    upsert?: Prisma.ComplaintUpsertWithWhereUniqueWithoutReporterInput | Prisma.ComplaintUpsertWithWhereUniqueWithoutReporterInput[];
    createMany?: Prisma.ComplaintCreateManyReporterInputEnvelope;
    set?: Prisma.ComplaintWhereUniqueInput | Prisma.ComplaintWhereUniqueInput[];
    disconnect?: Prisma.ComplaintWhereUniqueInput | Prisma.ComplaintWhereUniqueInput[];
    delete?: Prisma.ComplaintWhereUniqueInput | Prisma.ComplaintWhereUniqueInput[];
    connect?: Prisma.ComplaintWhereUniqueInput | Prisma.ComplaintWhereUniqueInput[];
    update?: Prisma.ComplaintUpdateWithWhereUniqueWithoutReporterInput | Prisma.ComplaintUpdateWithWhereUniqueWithoutReporterInput[];
    updateMany?: Prisma.ComplaintUpdateManyWithWhereWithoutReporterInput | Prisma.ComplaintUpdateManyWithWhereWithoutReporterInput[];
    deleteMany?: Prisma.ComplaintScalarWhereInput | Prisma.ComplaintScalarWhereInput[];
};
export type ComplaintUncheckedUpdateManyWithoutAccusedNestedInput = {
    create?: Prisma.XOR<Prisma.ComplaintCreateWithoutAccusedInput, Prisma.ComplaintUncheckedCreateWithoutAccusedInput> | Prisma.ComplaintCreateWithoutAccusedInput[] | Prisma.ComplaintUncheckedCreateWithoutAccusedInput[];
    connectOrCreate?: Prisma.ComplaintCreateOrConnectWithoutAccusedInput | Prisma.ComplaintCreateOrConnectWithoutAccusedInput[];
    upsert?: Prisma.ComplaintUpsertWithWhereUniqueWithoutAccusedInput | Prisma.ComplaintUpsertWithWhereUniqueWithoutAccusedInput[];
    createMany?: Prisma.ComplaintCreateManyAccusedInputEnvelope;
    set?: Prisma.ComplaintWhereUniqueInput | Prisma.ComplaintWhereUniqueInput[];
    disconnect?: Prisma.ComplaintWhereUniqueInput | Prisma.ComplaintWhereUniqueInput[];
    delete?: Prisma.ComplaintWhereUniqueInput | Prisma.ComplaintWhereUniqueInput[];
    connect?: Prisma.ComplaintWhereUniqueInput | Prisma.ComplaintWhereUniqueInput[];
    update?: Prisma.ComplaintUpdateWithWhereUniqueWithoutAccusedInput | Prisma.ComplaintUpdateWithWhereUniqueWithoutAccusedInput[];
    updateMany?: Prisma.ComplaintUpdateManyWithWhereWithoutAccusedInput | Prisma.ComplaintUpdateManyWithWhereWithoutAccusedInput[];
    deleteMany?: Prisma.ComplaintScalarWhereInput | Prisma.ComplaintScalarWhereInput[];
};
export type ComplaintCreateevidenceUrlsInput = {
    set: string[];
};
export type ComplaintUpdateevidenceUrlsInput = {
    set?: string[];
    push?: string | string[];
};
export type ComplaintCreateNestedOneWithoutPenaltiesInput = {
    create?: Prisma.XOR<Prisma.ComplaintCreateWithoutPenaltiesInput, Prisma.ComplaintUncheckedCreateWithoutPenaltiesInput>;
    connectOrCreate?: Prisma.ComplaintCreateOrConnectWithoutPenaltiesInput;
    connect?: Prisma.ComplaintWhereUniqueInput;
};
export type ComplaintUpdateOneWithoutPenaltiesNestedInput = {
    create?: Prisma.XOR<Prisma.ComplaintCreateWithoutPenaltiesInput, Prisma.ComplaintUncheckedCreateWithoutPenaltiesInput>;
    connectOrCreate?: Prisma.ComplaintCreateOrConnectWithoutPenaltiesInput;
    upsert?: Prisma.ComplaintUpsertWithoutPenaltiesInput;
    disconnect?: Prisma.ComplaintWhereInput | boolean;
    delete?: Prisma.ComplaintWhereInput | boolean;
    connect?: Prisma.ComplaintWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.ComplaintUpdateToOneWithWhereWithoutPenaltiesInput, Prisma.ComplaintUpdateWithoutPenaltiesInput>, Prisma.ComplaintUncheckedUpdateWithoutPenaltiesInput>;
};
export type ComplaintCreateWithoutReporterInput = {
    id?: string;
    bookingId?: string | null;
    category: string;
    description: string;
    evidenceUrls?: Prisma.ComplaintCreateevidenceUrlsInput | string[];
    status?: string;
    resolution?: string | null;
    resolvedBy?: string | null;
    resolvedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    accused: Prisma.UserCreateNestedOneWithoutComplaintsAccusedInput;
    penalties?: Prisma.PenaltyCreateNestedManyWithoutComplaintInput;
};
export type ComplaintUncheckedCreateWithoutReporterInput = {
    id?: string;
    bookingId?: string | null;
    accusedId: string;
    category: string;
    description: string;
    evidenceUrls?: Prisma.ComplaintCreateevidenceUrlsInput | string[];
    status?: string;
    resolution?: string | null;
    resolvedBy?: string | null;
    resolvedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    penalties?: Prisma.PenaltyUncheckedCreateNestedManyWithoutComplaintInput;
};
export type ComplaintCreateOrConnectWithoutReporterInput = {
    where: Prisma.ComplaintWhereUniqueInput;
    create: Prisma.XOR<Prisma.ComplaintCreateWithoutReporterInput, Prisma.ComplaintUncheckedCreateWithoutReporterInput>;
};
export type ComplaintCreateManyReporterInputEnvelope = {
    data: Prisma.ComplaintCreateManyReporterInput | Prisma.ComplaintCreateManyReporterInput[];
    skipDuplicates?: boolean;
};
export type ComplaintCreateWithoutAccusedInput = {
    id?: string;
    bookingId?: string | null;
    category: string;
    description: string;
    evidenceUrls?: Prisma.ComplaintCreateevidenceUrlsInput | string[];
    status?: string;
    resolution?: string | null;
    resolvedBy?: string | null;
    resolvedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    reporter: Prisma.UserCreateNestedOneWithoutComplaintsReportedInput;
    penalties?: Prisma.PenaltyCreateNestedManyWithoutComplaintInput;
};
export type ComplaintUncheckedCreateWithoutAccusedInput = {
    id?: string;
    bookingId?: string | null;
    reporterId: string;
    category: string;
    description: string;
    evidenceUrls?: Prisma.ComplaintCreateevidenceUrlsInput | string[];
    status?: string;
    resolution?: string | null;
    resolvedBy?: string | null;
    resolvedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    penalties?: Prisma.PenaltyUncheckedCreateNestedManyWithoutComplaintInput;
};
export type ComplaintCreateOrConnectWithoutAccusedInput = {
    where: Prisma.ComplaintWhereUniqueInput;
    create: Prisma.XOR<Prisma.ComplaintCreateWithoutAccusedInput, Prisma.ComplaintUncheckedCreateWithoutAccusedInput>;
};
export type ComplaintCreateManyAccusedInputEnvelope = {
    data: Prisma.ComplaintCreateManyAccusedInput | Prisma.ComplaintCreateManyAccusedInput[];
    skipDuplicates?: boolean;
};
export type ComplaintUpsertWithWhereUniqueWithoutReporterInput = {
    where: Prisma.ComplaintWhereUniqueInput;
    update: Prisma.XOR<Prisma.ComplaintUpdateWithoutReporterInput, Prisma.ComplaintUncheckedUpdateWithoutReporterInput>;
    create: Prisma.XOR<Prisma.ComplaintCreateWithoutReporterInput, Prisma.ComplaintUncheckedCreateWithoutReporterInput>;
};
export type ComplaintUpdateWithWhereUniqueWithoutReporterInput = {
    where: Prisma.ComplaintWhereUniqueInput;
    data: Prisma.XOR<Prisma.ComplaintUpdateWithoutReporterInput, Prisma.ComplaintUncheckedUpdateWithoutReporterInput>;
};
export type ComplaintUpdateManyWithWhereWithoutReporterInput = {
    where: Prisma.ComplaintScalarWhereInput;
    data: Prisma.XOR<Prisma.ComplaintUpdateManyMutationInput, Prisma.ComplaintUncheckedUpdateManyWithoutReporterInput>;
};
export type ComplaintScalarWhereInput = {
    AND?: Prisma.ComplaintScalarWhereInput | Prisma.ComplaintScalarWhereInput[];
    OR?: Prisma.ComplaintScalarWhereInput[];
    NOT?: Prisma.ComplaintScalarWhereInput | Prisma.ComplaintScalarWhereInput[];
    id?: Prisma.UuidFilter<"Complaint"> | string;
    bookingId?: Prisma.UuidNullableFilter<"Complaint"> | string | null;
    reporterId?: Prisma.UuidFilter<"Complaint"> | string;
    accusedId?: Prisma.UuidFilter<"Complaint"> | string;
    category?: Prisma.StringFilter<"Complaint"> | string;
    description?: Prisma.StringFilter<"Complaint"> | string;
    evidenceUrls?: Prisma.StringNullableListFilter<"Complaint">;
    status?: Prisma.StringFilter<"Complaint"> | string;
    resolution?: Prisma.StringNullableFilter<"Complaint"> | string | null;
    resolvedBy?: Prisma.UuidNullableFilter<"Complaint"> | string | null;
    resolvedAt?: Prisma.DateTimeNullableFilter<"Complaint"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"Complaint"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Complaint"> | Date | string;
};
export type ComplaintUpsertWithWhereUniqueWithoutAccusedInput = {
    where: Prisma.ComplaintWhereUniqueInput;
    update: Prisma.XOR<Prisma.ComplaintUpdateWithoutAccusedInput, Prisma.ComplaintUncheckedUpdateWithoutAccusedInput>;
    create: Prisma.XOR<Prisma.ComplaintCreateWithoutAccusedInput, Prisma.ComplaintUncheckedCreateWithoutAccusedInput>;
};
export type ComplaintUpdateWithWhereUniqueWithoutAccusedInput = {
    where: Prisma.ComplaintWhereUniqueInput;
    data: Prisma.XOR<Prisma.ComplaintUpdateWithoutAccusedInput, Prisma.ComplaintUncheckedUpdateWithoutAccusedInput>;
};
export type ComplaintUpdateManyWithWhereWithoutAccusedInput = {
    where: Prisma.ComplaintScalarWhereInput;
    data: Prisma.XOR<Prisma.ComplaintUpdateManyMutationInput, Prisma.ComplaintUncheckedUpdateManyWithoutAccusedInput>;
};
export type ComplaintCreateWithoutPenaltiesInput = {
    id?: string;
    bookingId?: string | null;
    category: string;
    description: string;
    evidenceUrls?: Prisma.ComplaintCreateevidenceUrlsInput | string[];
    status?: string;
    resolution?: string | null;
    resolvedBy?: string | null;
    resolvedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    reporter: Prisma.UserCreateNestedOneWithoutComplaintsReportedInput;
    accused: Prisma.UserCreateNestedOneWithoutComplaintsAccusedInput;
};
export type ComplaintUncheckedCreateWithoutPenaltiesInput = {
    id?: string;
    bookingId?: string | null;
    reporterId: string;
    accusedId: string;
    category: string;
    description: string;
    evidenceUrls?: Prisma.ComplaintCreateevidenceUrlsInput | string[];
    status?: string;
    resolution?: string | null;
    resolvedBy?: string | null;
    resolvedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type ComplaintCreateOrConnectWithoutPenaltiesInput = {
    where: Prisma.ComplaintWhereUniqueInput;
    create: Prisma.XOR<Prisma.ComplaintCreateWithoutPenaltiesInput, Prisma.ComplaintUncheckedCreateWithoutPenaltiesInput>;
};
export type ComplaintUpsertWithoutPenaltiesInput = {
    update: Prisma.XOR<Prisma.ComplaintUpdateWithoutPenaltiesInput, Prisma.ComplaintUncheckedUpdateWithoutPenaltiesInput>;
    create: Prisma.XOR<Prisma.ComplaintCreateWithoutPenaltiesInput, Prisma.ComplaintUncheckedCreateWithoutPenaltiesInput>;
    where?: Prisma.ComplaintWhereInput;
};
export type ComplaintUpdateToOneWithWhereWithoutPenaltiesInput = {
    where?: Prisma.ComplaintWhereInput;
    data: Prisma.XOR<Prisma.ComplaintUpdateWithoutPenaltiesInput, Prisma.ComplaintUncheckedUpdateWithoutPenaltiesInput>;
};
export type ComplaintUpdateWithoutPenaltiesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    evidenceUrls?: Prisma.ComplaintUpdateevidenceUrlsInput | string[];
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    resolution?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    resolvedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    resolvedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    reporter?: Prisma.UserUpdateOneRequiredWithoutComplaintsReportedNestedInput;
    accused?: Prisma.UserUpdateOneRequiredWithoutComplaintsAccusedNestedInput;
};
export type ComplaintUncheckedUpdateWithoutPenaltiesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    reporterId?: Prisma.StringFieldUpdateOperationsInput | string;
    accusedId?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    evidenceUrls?: Prisma.ComplaintUpdateevidenceUrlsInput | string[];
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    resolution?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    resolvedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    resolvedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ComplaintCreateManyReporterInput = {
    id?: string;
    bookingId?: string | null;
    accusedId: string;
    category: string;
    description: string;
    evidenceUrls?: Prisma.ComplaintCreateevidenceUrlsInput | string[];
    status?: string;
    resolution?: string | null;
    resolvedBy?: string | null;
    resolvedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type ComplaintCreateManyAccusedInput = {
    id?: string;
    bookingId?: string | null;
    reporterId: string;
    category: string;
    description: string;
    evidenceUrls?: Prisma.ComplaintCreateevidenceUrlsInput | string[];
    status?: string;
    resolution?: string | null;
    resolvedBy?: string | null;
    resolvedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type ComplaintUpdateWithoutReporterInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    evidenceUrls?: Prisma.ComplaintUpdateevidenceUrlsInput | string[];
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    resolution?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    resolvedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    resolvedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    accused?: Prisma.UserUpdateOneRequiredWithoutComplaintsAccusedNestedInput;
    penalties?: Prisma.PenaltyUpdateManyWithoutComplaintNestedInput;
};
export type ComplaintUncheckedUpdateWithoutReporterInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    accusedId?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    evidenceUrls?: Prisma.ComplaintUpdateevidenceUrlsInput | string[];
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    resolution?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    resolvedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    resolvedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    penalties?: Prisma.PenaltyUncheckedUpdateManyWithoutComplaintNestedInput;
};
export type ComplaintUncheckedUpdateManyWithoutReporterInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    accusedId?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    evidenceUrls?: Prisma.ComplaintUpdateevidenceUrlsInput | string[];
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    resolution?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    resolvedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    resolvedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ComplaintUpdateWithoutAccusedInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    evidenceUrls?: Prisma.ComplaintUpdateevidenceUrlsInput | string[];
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    resolution?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    resolvedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    resolvedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    reporter?: Prisma.UserUpdateOneRequiredWithoutComplaintsReportedNestedInput;
    penalties?: Prisma.PenaltyUpdateManyWithoutComplaintNestedInput;
};
export type ComplaintUncheckedUpdateWithoutAccusedInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    reporterId?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    evidenceUrls?: Prisma.ComplaintUpdateevidenceUrlsInput | string[];
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    resolution?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    resolvedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    resolvedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    penalties?: Prisma.PenaltyUncheckedUpdateManyWithoutComplaintNestedInput;
};
export type ComplaintUncheckedUpdateManyWithoutAccusedInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    reporterId?: Prisma.StringFieldUpdateOperationsInput | string;
    category?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.StringFieldUpdateOperationsInput | string;
    evidenceUrls?: Prisma.ComplaintUpdateevidenceUrlsInput | string[];
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    resolution?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    resolvedBy?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    resolvedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ComplaintCountOutputType = {
    penalties: number;
};
export type ComplaintCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    penalties?: boolean | ComplaintCountOutputTypeCountPenaltiesArgs;
};
export type ComplaintCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ComplaintCountOutputTypeSelect<ExtArgs> | null;
};
export type ComplaintCountOutputTypeCountPenaltiesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PenaltyWhereInput;
};
export type ComplaintSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    bookingId?: boolean;
    reporterId?: boolean;
    accusedId?: boolean;
    category?: boolean;
    description?: boolean;
    evidenceUrls?: boolean;
    status?: boolean;
    resolution?: boolean;
    resolvedBy?: boolean;
    resolvedAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    reporter?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    accused?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    penalties?: boolean | Prisma.Complaint$penaltiesArgs<ExtArgs>;
    _count?: boolean | Prisma.ComplaintCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["complaint"]>;
export type ComplaintSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    bookingId?: boolean;
    reporterId?: boolean;
    accusedId?: boolean;
    category?: boolean;
    description?: boolean;
    evidenceUrls?: boolean;
    status?: boolean;
    resolution?: boolean;
    resolvedBy?: boolean;
    resolvedAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    reporter?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    accused?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["complaint"]>;
export type ComplaintSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    bookingId?: boolean;
    reporterId?: boolean;
    accusedId?: boolean;
    category?: boolean;
    description?: boolean;
    evidenceUrls?: boolean;
    status?: boolean;
    resolution?: boolean;
    resolvedBy?: boolean;
    resolvedAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    reporter?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    accused?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["complaint"]>;
export type ComplaintSelectScalar = {
    id?: boolean;
    bookingId?: boolean;
    reporterId?: boolean;
    accusedId?: boolean;
    category?: boolean;
    description?: boolean;
    evidenceUrls?: boolean;
    status?: boolean;
    resolution?: boolean;
    resolvedBy?: boolean;
    resolvedAt?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type ComplaintOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "bookingId" | "reporterId" | "accusedId" | "category" | "description" | "evidenceUrls" | "status" | "resolution" | "resolvedBy" | "resolvedAt" | "createdAt" | "updatedAt", ExtArgs["result"]["complaint"]>;
export type ComplaintInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    reporter?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    accused?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    penalties?: boolean | Prisma.Complaint$penaltiesArgs<ExtArgs>;
    _count?: boolean | Prisma.ComplaintCountOutputTypeDefaultArgs<ExtArgs>;
};
export type ComplaintIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    reporter?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    accused?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type ComplaintIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    reporter?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    accused?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type $ComplaintPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Complaint";
    objects: {
        reporter: Prisma.$UserPayload<ExtArgs>;
        accused: Prisma.$UserPayload<ExtArgs>;
        penalties: Prisma.$PenaltyPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        bookingId: string | null;
        reporterId: string;
        accusedId: string;
        category: string;
        description: string;
        evidenceUrls: string[];
        status: string;
        resolution: string | null;
        resolvedBy: string | null;
        resolvedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["complaint"]>;
    composites: {};
};
export type ComplaintGetPayload<S extends boolean | null | undefined | ComplaintDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$ComplaintPayload, S>;
export type ComplaintCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<ComplaintFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: ComplaintCountAggregateInputType | true;
};
export interface ComplaintDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Complaint'];
        meta: {
            name: 'Complaint';
        };
    };
    findUnique<T extends ComplaintFindUniqueArgs>(args: Prisma.SelectSubset<T, ComplaintFindUniqueArgs<ExtArgs>>): Prisma.Prisma__ComplaintClient<runtime.Types.Result.GetResult<Prisma.$ComplaintPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends ComplaintFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, ComplaintFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__ComplaintClient<runtime.Types.Result.GetResult<Prisma.$ComplaintPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends ComplaintFindFirstArgs>(args?: Prisma.SelectSubset<T, ComplaintFindFirstArgs<ExtArgs>>): Prisma.Prisma__ComplaintClient<runtime.Types.Result.GetResult<Prisma.$ComplaintPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends ComplaintFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, ComplaintFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__ComplaintClient<runtime.Types.Result.GetResult<Prisma.$ComplaintPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends ComplaintFindManyArgs>(args?: Prisma.SelectSubset<T, ComplaintFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ComplaintPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends ComplaintCreateArgs>(args: Prisma.SelectSubset<T, ComplaintCreateArgs<ExtArgs>>): Prisma.Prisma__ComplaintClient<runtime.Types.Result.GetResult<Prisma.$ComplaintPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends ComplaintCreateManyArgs>(args?: Prisma.SelectSubset<T, ComplaintCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends ComplaintCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, ComplaintCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ComplaintPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends ComplaintDeleteArgs>(args: Prisma.SelectSubset<T, ComplaintDeleteArgs<ExtArgs>>): Prisma.Prisma__ComplaintClient<runtime.Types.Result.GetResult<Prisma.$ComplaintPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends ComplaintUpdateArgs>(args: Prisma.SelectSubset<T, ComplaintUpdateArgs<ExtArgs>>): Prisma.Prisma__ComplaintClient<runtime.Types.Result.GetResult<Prisma.$ComplaintPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends ComplaintDeleteManyArgs>(args?: Prisma.SelectSubset<T, ComplaintDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends ComplaintUpdateManyArgs>(args: Prisma.SelectSubset<T, ComplaintUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends ComplaintUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, ComplaintUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ComplaintPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends ComplaintUpsertArgs>(args: Prisma.SelectSubset<T, ComplaintUpsertArgs<ExtArgs>>): Prisma.Prisma__ComplaintClient<runtime.Types.Result.GetResult<Prisma.$ComplaintPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends ComplaintCountArgs>(args?: Prisma.Subset<T, ComplaintCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], ComplaintCountAggregateOutputType> : number>;
    aggregate<T extends ComplaintAggregateArgs>(args: Prisma.Subset<T, ComplaintAggregateArgs>): Prisma.PrismaPromise<GetComplaintAggregateType<T>>;
    groupBy<T extends ComplaintGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: ComplaintGroupByArgs['orderBy'];
    } : {
        orderBy?: ComplaintGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, ComplaintGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetComplaintGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: ComplaintFieldRefs;
}
export interface Prisma__ComplaintClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    reporter<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    accused<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    penalties<T extends Prisma.Complaint$penaltiesArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Complaint$penaltiesArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PenaltyPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface ComplaintFieldRefs {
    readonly id: Prisma.FieldRef<"Complaint", 'String'>;
    readonly bookingId: Prisma.FieldRef<"Complaint", 'String'>;
    readonly reporterId: Prisma.FieldRef<"Complaint", 'String'>;
    readonly accusedId: Prisma.FieldRef<"Complaint", 'String'>;
    readonly category: Prisma.FieldRef<"Complaint", 'String'>;
    readonly description: Prisma.FieldRef<"Complaint", 'String'>;
    readonly evidenceUrls: Prisma.FieldRef<"Complaint", 'String[]'>;
    readonly status: Prisma.FieldRef<"Complaint", 'String'>;
    readonly resolution: Prisma.FieldRef<"Complaint", 'String'>;
    readonly resolvedBy: Prisma.FieldRef<"Complaint", 'String'>;
    readonly resolvedAt: Prisma.FieldRef<"Complaint", 'DateTime'>;
    readonly createdAt: Prisma.FieldRef<"Complaint", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"Complaint", 'DateTime'>;
}
export type ComplaintFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ComplaintSelect<ExtArgs> | null;
    omit?: Prisma.ComplaintOmit<ExtArgs> | null;
    include?: Prisma.ComplaintInclude<ExtArgs> | null;
    where: Prisma.ComplaintWhereUniqueInput;
};
export type ComplaintFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ComplaintSelect<ExtArgs> | null;
    omit?: Prisma.ComplaintOmit<ExtArgs> | null;
    include?: Prisma.ComplaintInclude<ExtArgs> | null;
    where: Prisma.ComplaintWhereUniqueInput;
};
export type ComplaintFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ComplaintSelect<ExtArgs> | null;
    omit?: Prisma.ComplaintOmit<ExtArgs> | null;
    include?: Prisma.ComplaintInclude<ExtArgs> | null;
    where?: Prisma.ComplaintWhereInput;
    orderBy?: Prisma.ComplaintOrderByWithRelationInput | Prisma.ComplaintOrderByWithRelationInput[];
    cursor?: Prisma.ComplaintWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ComplaintScalarFieldEnum | Prisma.ComplaintScalarFieldEnum[];
};
export type ComplaintFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ComplaintSelect<ExtArgs> | null;
    omit?: Prisma.ComplaintOmit<ExtArgs> | null;
    include?: Prisma.ComplaintInclude<ExtArgs> | null;
    where?: Prisma.ComplaintWhereInput;
    orderBy?: Prisma.ComplaintOrderByWithRelationInput | Prisma.ComplaintOrderByWithRelationInput[];
    cursor?: Prisma.ComplaintWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ComplaintScalarFieldEnum | Prisma.ComplaintScalarFieldEnum[];
};
export type ComplaintFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ComplaintSelect<ExtArgs> | null;
    omit?: Prisma.ComplaintOmit<ExtArgs> | null;
    include?: Prisma.ComplaintInclude<ExtArgs> | null;
    where?: Prisma.ComplaintWhereInput;
    orderBy?: Prisma.ComplaintOrderByWithRelationInput | Prisma.ComplaintOrderByWithRelationInput[];
    cursor?: Prisma.ComplaintWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ComplaintScalarFieldEnum | Prisma.ComplaintScalarFieldEnum[];
};
export type ComplaintCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ComplaintSelect<ExtArgs> | null;
    omit?: Prisma.ComplaintOmit<ExtArgs> | null;
    include?: Prisma.ComplaintInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.ComplaintCreateInput, Prisma.ComplaintUncheckedCreateInput>;
};
export type ComplaintCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.ComplaintCreateManyInput | Prisma.ComplaintCreateManyInput[];
    skipDuplicates?: boolean;
};
export type ComplaintCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ComplaintSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.ComplaintOmit<ExtArgs> | null;
    data: Prisma.ComplaintCreateManyInput | Prisma.ComplaintCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.ComplaintIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type ComplaintUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ComplaintSelect<ExtArgs> | null;
    omit?: Prisma.ComplaintOmit<ExtArgs> | null;
    include?: Prisma.ComplaintInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.ComplaintUpdateInput, Prisma.ComplaintUncheckedUpdateInput>;
    where: Prisma.ComplaintWhereUniqueInput;
};
export type ComplaintUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.ComplaintUpdateManyMutationInput, Prisma.ComplaintUncheckedUpdateManyInput>;
    where?: Prisma.ComplaintWhereInput;
    limit?: number;
};
export type ComplaintUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ComplaintSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.ComplaintOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.ComplaintUpdateManyMutationInput, Prisma.ComplaintUncheckedUpdateManyInput>;
    where?: Prisma.ComplaintWhereInput;
    limit?: number;
    include?: Prisma.ComplaintIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type ComplaintUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ComplaintSelect<ExtArgs> | null;
    omit?: Prisma.ComplaintOmit<ExtArgs> | null;
    include?: Prisma.ComplaintInclude<ExtArgs> | null;
    where: Prisma.ComplaintWhereUniqueInput;
    create: Prisma.XOR<Prisma.ComplaintCreateInput, Prisma.ComplaintUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.ComplaintUpdateInput, Prisma.ComplaintUncheckedUpdateInput>;
};
export type ComplaintDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ComplaintSelect<ExtArgs> | null;
    omit?: Prisma.ComplaintOmit<ExtArgs> | null;
    include?: Prisma.ComplaintInclude<ExtArgs> | null;
    where: Prisma.ComplaintWhereUniqueInput;
};
export type ComplaintDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ComplaintWhereInput;
    limit?: number;
};
export type Complaint$penaltiesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PenaltySelect<ExtArgs> | null;
    omit?: Prisma.PenaltyOmit<ExtArgs> | null;
    include?: Prisma.PenaltyInclude<ExtArgs> | null;
    where?: Prisma.PenaltyWhereInput;
    orderBy?: Prisma.PenaltyOrderByWithRelationInput | Prisma.PenaltyOrderByWithRelationInput[];
    cursor?: Prisma.PenaltyWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PenaltyScalarFieldEnum | Prisma.PenaltyScalarFieldEnum[];
};
export type ComplaintDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.ComplaintSelect<ExtArgs> | null;
    omit?: Prisma.ComplaintOmit<ExtArgs> | null;
    include?: Prisma.ComplaintInclude<ExtArgs> | null;
};
