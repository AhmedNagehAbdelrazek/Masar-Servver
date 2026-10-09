import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type SupportTicketMessageModel = runtime.Types.Result.DefaultSelection<Prisma.$SupportTicketMessagePayload>;
export type AggregateSupportTicketMessage = {
    _count: SupportTicketMessageCountAggregateOutputType | null;
    _min: SupportTicketMessageMinAggregateOutputType | null;
    _max: SupportTicketMessageMaxAggregateOutputType | null;
};
export type SupportTicketMessageMinAggregateOutputType = {
    id: string | null;
    ticketId: string | null;
    senderId: string | null;
    message: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type SupportTicketMessageMaxAggregateOutputType = {
    id: string | null;
    ticketId: string | null;
    senderId: string | null;
    message: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type SupportTicketMessageCountAggregateOutputType = {
    id: number;
    ticketId: number;
    senderId: number;
    message: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type SupportTicketMessageMinAggregateInputType = {
    id?: true;
    ticketId?: true;
    senderId?: true;
    message?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type SupportTicketMessageMaxAggregateInputType = {
    id?: true;
    ticketId?: true;
    senderId?: true;
    message?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type SupportTicketMessageCountAggregateInputType = {
    id?: true;
    ticketId?: true;
    senderId?: true;
    message?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type SupportTicketMessageAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SupportTicketMessageWhereInput;
    orderBy?: Prisma.SupportTicketMessageOrderByWithRelationInput | Prisma.SupportTicketMessageOrderByWithRelationInput[];
    cursor?: Prisma.SupportTicketMessageWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | SupportTicketMessageCountAggregateInputType;
    _min?: SupportTicketMessageMinAggregateInputType;
    _max?: SupportTicketMessageMaxAggregateInputType;
};
export type GetSupportTicketMessageAggregateType<T extends SupportTicketMessageAggregateArgs> = {
    [P in keyof T & keyof AggregateSupportTicketMessage]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateSupportTicketMessage[P]> : Prisma.GetScalarType<T[P], AggregateSupportTicketMessage[P]>;
};
export type SupportTicketMessageGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SupportTicketMessageWhereInput;
    orderBy?: Prisma.SupportTicketMessageOrderByWithAggregationInput | Prisma.SupportTicketMessageOrderByWithAggregationInput[];
    by: Prisma.SupportTicketMessageScalarFieldEnum[] | Prisma.SupportTicketMessageScalarFieldEnum;
    having?: Prisma.SupportTicketMessageScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: SupportTicketMessageCountAggregateInputType | true;
    _min?: SupportTicketMessageMinAggregateInputType;
    _max?: SupportTicketMessageMaxAggregateInputType;
};
export type SupportTicketMessageGroupByOutputType = {
    id: string;
    ticketId: string;
    senderId: string;
    message: string;
    createdAt: Date;
    updatedAt: Date;
    _count: SupportTicketMessageCountAggregateOutputType | null;
    _min: SupportTicketMessageMinAggregateOutputType | null;
    _max: SupportTicketMessageMaxAggregateOutputType | null;
};
export type GetSupportTicketMessageGroupByPayload<T extends SupportTicketMessageGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<SupportTicketMessageGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof SupportTicketMessageGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], SupportTicketMessageGroupByOutputType[P]> : Prisma.GetScalarType<T[P], SupportTicketMessageGroupByOutputType[P]>;
}>>;
export type SupportTicketMessageWhereInput = {
    AND?: Prisma.SupportTicketMessageWhereInput | Prisma.SupportTicketMessageWhereInput[];
    OR?: Prisma.SupportTicketMessageWhereInput[];
    NOT?: Prisma.SupportTicketMessageWhereInput | Prisma.SupportTicketMessageWhereInput[];
    id?: Prisma.UuidFilter<"SupportTicketMessage"> | string;
    ticketId?: Prisma.UuidFilter<"SupportTicketMessage"> | string;
    senderId?: Prisma.UuidFilter<"SupportTicketMessage"> | string;
    message?: Prisma.StringFilter<"SupportTicketMessage"> | string;
    createdAt?: Prisma.DateTimeFilter<"SupportTicketMessage"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"SupportTicketMessage"> | Date | string;
    ticket?: Prisma.XOR<Prisma.SupportTicketScalarRelationFilter, Prisma.SupportTicketWhereInput>;
};
export type SupportTicketMessageOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    ticketId?: Prisma.SortOrder;
    senderId?: Prisma.SortOrder;
    message?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    ticket?: Prisma.SupportTicketOrderByWithRelationInput;
};
export type SupportTicketMessageWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.SupportTicketMessageWhereInput | Prisma.SupportTicketMessageWhereInput[];
    OR?: Prisma.SupportTicketMessageWhereInput[];
    NOT?: Prisma.SupportTicketMessageWhereInput | Prisma.SupportTicketMessageWhereInput[];
    ticketId?: Prisma.UuidFilter<"SupportTicketMessage"> | string;
    senderId?: Prisma.UuidFilter<"SupportTicketMessage"> | string;
    message?: Prisma.StringFilter<"SupportTicketMessage"> | string;
    createdAt?: Prisma.DateTimeFilter<"SupportTicketMessage"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"SupportTicketMessage"> | Date | string;
    ticket?: Prisma.XOR<Prisma.SupportTicketScalarRelationFilter, Prisma.SupportTicketWhereInput>;
}, "id">;
export type SupportTicketMessageOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    ticketId?: Prisma.SortOrder;
    senderId?: Prisma.SortOrder;
    message?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.SupportTicketMessageCountOrderByAggregateInput;
    _max?: Prisma.SupportTicketMessageMaxOrderByAggregateInput;
    _min?: Prisma.SupportTicketMessageMinOrderByAggregateInput;
};
export type SupportTicketMessageScalarWhereWithAggregatesInput = {
    AND?: Prisma.SupportTicketMessageScalarWhereWithAggregatesInput | Prisma.SupportTicketMessageScalarWhereWithAggregatesInput[];
    OR?: Prisma.SupportTicketMessageScalarWhereWithAggregatesInput[];
    NOT?: Prisma.SupportTicketMessageScalarWhereWithAggregatesInput | Prisma.SupportTicketMessageScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"SupportTicketMessage"> | string;
    ticketId?: Prisma.UuidWithAggregatesFilter<"SupportTicketMessage"> | string;
    senderId?: Prisma.UuidWithAggregatesFilter<"SupportTicketMessage"> | string;
    message?: Prisma.StringWithAggregatesFilter<"SupportTicketMessage"> | string;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"SupportTicketMessage"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"SupportTicketMessage"> | Date | string;
};
export type SupportTicketMessageCreateInput = {
    id?: string;
    senderId: string;
    message: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    ticket: Prisma.SupportTicketCreateNestedOneWithoutMessagesInput;
};
export type SupportTicketMessageUncheckedCreateInput = {
    id?: string;
    ticketId: string;
    senderId: string;
    message: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type SupportTicketMessageUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    senderId?: Prisma.StringFieldUpdateOperationsInput | string;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    ticket?: Prisma.SupportTicketUpdateOneRequiredWithoutMessagesNestedInput;
};
export type SupportTicketMessageUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    ticketId?: Prisma.StringFieldUpdateOperationsInput | string;
    senderId?: Prisma.StringFieldUpdateOperationsInput | string;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SupportTicketMessageCreateManyInput = {
    id?: string;
    ticketId: string;
    senderId: string;
    message: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type SupportTicketMessageUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    senderId?: Prisma.StringFieldUpdateOperationsInput | string;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SupportTicketMessageUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    ticketId?: Prisma.StringFieldUpdateOperationsInput | string;
    senderId?: Prisma.StringFieldUpdateOperationsInput | string;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SupportTicketMessageListRelationFilter = {
    every?: Prisma.SupportTicketMessageWhereInput;
    some?: Prisma.SupportTicketMessageWhereInput;
    none?: Prisma.SupportTicketMessageWhereInput;
};
export type SupportTicketMessageOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type SupportTicketMessageCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    ticketId?: Prisma.SortOrder;
    senderId?: Prisma.SortOrder;
    message?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type SupportTicketMessageMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    ticketId?: Prisma.SortOrder;
    senderId?: Prisma.SortOrder;
    message?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type SupportTicketMessageMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    ticketId?: Prisma.SortOrder;
    senderId?: Prisma.SortOrder;
    message?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type SupportTicketMessageCreateNestedManyWithoutTicketInput = {
    create?: Prisma.XOR<Prisma.SupportTicketMessageCreateWithoutTicketInput, Prisma.SupportTicketMessageUncheckedCreateWithoutTicketInput> | Prisma.SupportTicketMessageCreateWithoutTicketInput[] | Prisma.SupportTicketMessageUncheckedCreateWithoutTicketInput[];
    connectOrCreate?: Prisma.SupportTicketMessageCreateOrConnectWithoutTicketInput | Prisma.SupportTicketMessageCreateOrConnectWithoutTicketInput[];
    createMany?: Prisma.SupportTicketMessageCreateManyTicketInputEnvelope;
    connect?: Prisma.SupportTicketMessageWhereUniqueInput | Prisma.SupportTicketMessageWhereUniqueInput[];
};
export type SupportTicketMessageUncheckedCreateNestedManyWithoutTicketInput = {
    create?: Prisma.XOR<Prisma.SupportTicketMessageCreateWithoutTicketInput, Prisma.SupportTicketMessageUncheckedCreateWithoutTicketInput> | Prisma.SupportTicketMessageCreateWithoutTicketInput[] | Prisma.SupportTicketMessageUncheckedCreateWithoutTicketInput[];
    connectOrCreate?: Prisma.SupportTicketMessageCreateOrConnectWithoutTicketInput | Prisma.SupportTicketMessageCreateOrConnectWithoutTicketInput[];
    createMany?: Prisma.SupportTicketMessageCreateManyTicketInputEnvelope;
    connect?: Prisma.SupportTicketMessageWhereUniqueInput | Prisma.SupportTicketMessageWhereUniqueInput[];
};
export type SupportTicketMessageUpdateManyWithoutTicketNestedInput = {
    create?: Prisma.XOR<Prisma.SupportTicketMessageCreateWithoutTicketInput, Prisma.SupportTicketMessageUncheckedCreateWithoutTicketInput> | Prisma.SupportTicketMessageCreateWithoutTicketInput[] | Prisma.SupportTicketMessageUncheckedCreateWithoutTicketInput[];
    connectOrCreate?: Prisma.SupportTicketMessageCreateOrConnectWithoutTicketInput | Prisma.SupportTicketMessageCreateOrConnectWithoutTicketInput[];
    upsert?: Prisma.SupportTicketMessageUpsertWithWhereUniqueWithoutTicketInput | Prisma.SupportTicketMessageUpsertWithWhereUniqueWithoutTicketInput[];
    createMany?: Prisma.SupportTicketMessageCreateManyTicketInputEnvelope;
    set?: Prisma.SupportTicketMessageWhereUniqueInput | Prisma.SupportTicketMessageWhereUniqueInput[];
    disconnect?: Prisma.SupportTicketMessageWhereUniqueInput | Prisma.SupportTicketMessageWhereUniqueInput[];
    delete?: Prisma.SupportTicketMessageWhereUniqueInput | Prisma.SupportTicketMessageWhereUniqueInput[];
    connect?: Prisma.SupportTicketMessageWhereUniqueInput | Prisma.SupportTicketMessageWhereUniqueInput[];
    update?: Prisma.SupportTicketMessageUpdateWithWhereUniqueWithoutTicketInput | Prisma.SupportTicketMessageUpdateWithWhereUniqueWithoutTicketInput[];
    updateMany?: Prisma.SupportTicketMessageUpdateManyWithWhereWithoutTicketInput | Prisma.SupportTicketMessageUpdateManyWithWhereWithoutTicketInput[];
    deleteMany?: Prisma.SupportTicketMessageScalarWhereInput | Prisma.SupportTicketMessageScalarWhereInput[];
};
export type SupportTicketMessageUncheckedUpdateManyWithoutTicketNestedInput = {
    create?: Prisma.XOR<Prisma.SupportTicketMessageCreateWithoutTicketInput, Prisma.SupportTicketMessageUncheckedCreateWithoutTicketInput> | Prisma.SupportTicketMessageCreateWithoutTicketInput[] | Prisma.SupportTicketMessageUncheckedCreateWithoutTicketInput[];
    connectOrCreate?: Prisma.SupportTicketMessageCreateOrConnectWithoutTicketInput | Prisma.SupportTicketMessageCreateOrConnectWithoutTicketInput[];
    upsert?: Prisma.SupportTicketMessageUpsertWithWhereUniqueWithoutTicketInput | Prisma.SupportTicketMessageUpsertWithWhereUniqueWithoutTicketInput[];
    createMany?: Prisma.SupportTicketMessageCreateManyTicketInputEnvelope;
    set?: Prisma.SupportTicketMessageWhereUniqueInput | Prisma.SupportTicketMessageWhereUniqueInput[];
    disconnect?: Prisma.SupportTicketMessageWhereUniqueInput | Prisma.SupportTicketMessageWhereUniqueInput[];
    delete?: Prisma.SupportTicketMessageWhereUniqueInput | Prisma.SupportTicketMessageWhereUniqueInput[];
    connect?: Prisma.SupportTicketMessageWhereUniqueInput | Prisma.SupportTicketMessageWhereUniqueInput[];
    update?: Prisma.SupportTicketMessageUpdateWithWhereUniqueWithoutTicketInput | Prisma.SupportTicketMessageUpdateWithWhereUniqueWithoutTicketInput[];
    updateMany?: Prisma.SupportTicketMessageUpdateManyWithWhereWithoutTicketInput | Prisma.SupportTicketMessageUpdateManyWithWhereWithoutTicketInput[];
    deleteMany?: Prisma.SupportTicketMessageScalarWhereInput | Prisma.SupportTicketMessageScalarWhereInput[];
};
export type SupportTicketMessageCreateWithoutTicketInput = {
    id?: string;
    senderId: string;
    message: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type SupportTicketMessageUncheckedCreateWithoutTicketInput = {
    id?: string;
    senderId: string;
    message: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type SupportTicketMessageCreateOrConnectWithoutTicketInput = {
    where: Prisma.SupportTicketMessageWhereUniqueInput;
    create: Prisma.XOR<Prisma.SupportTicketMessageCreateWithoutTicketInput, Prisma.SupportTicketMessageUncheckedCreateWithoutTicketInput>;
};
export type SupportTicketMessageCreateManyTicketInputEnvelope = {
    data: Prisma.SupportTicketMessageCreateManyTicketInput | Prisma.SupportTicketMessageCreateManyTicketInput[];
    skipDuplicates?: boolean;
};
export type SupportTicketMessageUpsertWithWhereUniqueWithoutTicketInput = {
    where: Prisma.SupportTicketMessageWhereUniqueInput;
    update: Prisma.XOR<Prisma.SupportTicketMessageUpdateWithoutTicketInput, Prisma.SupportTicketMessageUncheckedUpdateWithoutTicketInput>;
    create: Prisma.XOR<Prisma.SupportTicketMessageCreateWithoutTicketInput, Prisma.SupportTicketMessageUncheckedCreateWithoutTicketInput>;
};
export type SupportTicketMessageUpdateWithWhereUniqueWithoutTicketInput = {
    where: Prisma.SupportTicketMessageWhereUniqueInput;
    data: Prisma.XOR<Prisma.SupportTicketMessageUpdateWithoutTicketInput, Prisma.SupportTicketMessageUncheckedUpdateWithoutTicketInput>;
};
export type SupportTicketMessageUpdateManyWithWhereWithoutTicketInput = {
    where: Prisma.SupportTicketMessageScalarWhereInput;
    data: Prisma.XOR<Prisma.SupportTicketMessageUpdateManyMutationInput, Prisma.SupportTicketMessageUncheckedUpdateManyWithoutTicketInput>;
};
export type SupportTicketMessageScalarWhereInput = {
    AND?: Prisma.SupportTicketMessageScalarWhereInput | Prisma.SupportTicketMessageScalarWhereInput[];
    OR?: Prisma.SupportTicketMessageScalarWhereInput[];
    NOT?: Prisma.SupportTicketMessageScalarWhereInput | Prisma.SupportTicketMessageScalarWhereInput[];
    id?: Prisma.UuidFilter<"SupportTicketMessage"> | string;
    ticketId?: Prisma.UuidFilter<"SupportTicketMessage"> | string;
    senderId?: Prisma.UuidFilter<"SupportTicketMessage"> | string;
    message?: Prisma.StringFilter<"SupportTicketMessage"> | string;
    createdAt?: Prisma.DateTimeFilter<"SupportTicketMessage"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"SupportTicketMessage"> | Date | string;
};
export type SupportTicketMessageCreateManyTicketInput = {
    id?: string;
    senderId: string;
    message: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type SupportTicketMessageUpdateWithoutTicketInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    senderId?: Prisma.StringFieldUpdateOperationsInput | string;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SupportTicketMessageUncheckedUpdateWithoutTicketInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    senderId?: Prisma.StringFieldUpdateOperationsInput | string;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SupportTicketMessageUncheckedUpdateManyWithoutTicketInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    senderId?: Prisma.StringFieldUpdateOperationsInput | string;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type SupportTicketMessageSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    ticketId?: boolean;
    senderId?: boolean;
    message?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    ticket?: boolean | Prisma.SupportTicketDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["supportTicketMessage"]>;
export type SupportTicketMessageSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    ticketId?: boolean;
    senderId?: boolean;
    message?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    ticket?: boolean | Prisma.SupportTicketDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["supportTicketMessage"]>;
export type SupportTicketMessageSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    ticketId?: boolean;
    senderId?: boolean;
    message?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    ticket?: boolean | Prisma.SupportTicketDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["supportTicketMessage"]>;
export type SupportTicketMessageSelectScalar = {
    id?: boolean;
    ticketId?: boolean;
    senderId?: boolean;
    message?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type SupportTicketMessageOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "ticketId" | "senderId" | "message" | "createdAt" | "updatedAt", ExtArgs["result"]["supportTicketMessage"]>;
export type SupportTicketMessageInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    ticket?: boolean | Prisma.SupportTicketDefaultArgs<ExtArgs>;
};
export type SupportTicketMessageIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    ticket?: boolean | Prisma.SupportTicketDefaultArgs<ExtArgs>;
};
export type SupportTicketMessageIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    ticket?: boolean | Prisma.SupportTicketDefaultArgs<ExtArgs>;
};
export type $SupportTicketMessagePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "SupportTicketMessage";
    objects: {
        ticket: Prisma.$SupportTicketPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        ticketId: string;
        senderId: string;
        message: string;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["supportTicketMessage"]>;
    composites: {};
};
export type SupportTicketMessageGetPayload<S extends boolean | null | undefined | SupportTicketMessageDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$SupportTicketMessagePayload, S>;
export type SupportTicketMessageCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<SupportTicketMessageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: SupportTicketMessageCountAggregateInputType | true;
};
export interface SupportTicketMessageDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['SupportTicketMessage'];
        meta: {
            name: 'SupportTicketMessage';
        };
    };
    findUnique<T extends SupportTicketMessageFindUniqueArgs>(args: Prisma.SelectSubset<T, SupportTicketMessageFindUniqueArgs<ExtArgs>>): Prisma.Prisma__SupportTicketMessageClient<runtime.Types.Result.GetResult<Prisma.$SupportTicketMessagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends SupportTicketMessageFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, SupportTicketMessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__SupportTicketMessageClient<runtime.Types.Result.GetResult<Prisma.$SupportTicketMessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends SupportTicketMessageFindFirstArgs>(args?: Prisma.SelectSubset<T, SupportTicketMessageFindFirstArgs<ExtArgs>>): Prisma.Prisma__SupportTicketMessageClient<runtime.Types.Result.GetResult<Prisma.$SupportTicketMessagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends SupportTicketMessageFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, SupportTicketMessageFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__SupportTicketMessageClient<runtime.Types.Result.GetResult<Prisma.$SupportTicketMessagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends SupportTicketMessageFindManyArgs>(args?: Prisma.SelectSubset<T, SupportTicketMessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SupportTicketMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends SupportTicketMessageCreateArgs>(args: Prisma.SelectSubset<T, SupportTicketMessageCreateArgs<ExtArgs>>): Prisma.Prisma__SupportTicketMessageClient<runtime.Types.Result.GetResult<Prisma.$SupportTicketMessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends SupportTicketMessageCreateManyArgs>(args?: Prisma.SelectSubset<T, SupportTicketMessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends SupportTicketMessageCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, SupportTicketMessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SupportTicketMessagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends SupportTicketMessageDeleteArgs>(args: Prisma.SelectSubset<T, SupportTicketMessageDeleteArgs<ExtArgs>>): Prisma.Prisma__SupportTicketMessageClient<runtime.Types.Result.GetResult<Prisma.$SupportTicketMessagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends SupportTicketMessageUpdateArgs>(args: Prisma.SelectSubset<T, SupportTicketMessageUpdateArgs<ExtArgs>>): Prisma.Prisma__SupportTicketMessageClient<runtime.Types.Result.GetResult<Prisma.$SupportTicketMessagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends SupportTicketMessageDeleteManyArgs>(args?: Prisma.SelectSubset<T, SupportTicketMessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends SupportTicketMessageUpdateManyArgs>(args: Prisma.SelectSubset<T, SupportTicketMessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends SupportTicketMessageUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, SupportTicketMessageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$SupportTicketMessagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends SupportTicketMessageUpsertArgs>(args: Prisma.SelectSubset<T, SupportTicketMessageUpsertArgs<ExtArgs>>): Prisma.Prisma__SupportTicketMessageClient<runtime.Types.Result.GetResult<Prisma.$SupportTicketMessagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends SupportTicketMessageCountArgs>(args?: Prisma.Subset<T, SupportTicketMessageCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], SupportTicketMessageCountAggregateOutputType> : number>;
    aggregate<T extends SupportTicketMessageAggregateArgs>(args: Prisma.Subset<T, SupportTicketMessageAggregateArgs>): Prisma.PrismaPromise<GetSupportTicketMessageAggregateType<T>>;
    groupBy<T extends SupportTicketMessageGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: SupportTicketMessageGroupByArgs['orderBy'];
    } : {
        orderBy?: SupportTicketMessageGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, SupportTicketMessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSupportTicketMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: SupportTicketMessageFieldRefs;
}
export interface Prisma__SupportTicketMessageClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    ticket<T extends Prisma.SupportTicketDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.SupportTicketDefaultArgs<ExtArgs>>): Prisma.Prisma__SupportTicketClient<runtime.Types.Result.GetResult<Prisma.$SupportTicketPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface SupportTicketMessageFieldRefs {
    readonly id: Prisma.FieldRef<"SupportTicketMessage", 'String'>;
    readonly ticketId: Prisma.FieldRef<"SupportTicketMessage", 'String'>;
    readonly senderId: Prisma.FieldRef<"SupportTicketMessage", 'String'>;
    readonly message: Prisma.FieldRef<"SupportTicketMessage", 'String'>;
    readonly createdAt: Prisma.FieldRef<"SupportTicketMessage", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"SupportTicketMessage", 'DateTime'>;
}
export type SupportTicketMessageFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SupportTicketMessageSelect<ExtArgs> | null;
    omit?: Prisma.SupportTicketMessageOmit<ExtArgs> | null;
    include?: Prisma.SupportTicketMessageInclude<ExtArgs> | null;
    where: Prisma.SupportTicketMessageWhereUniqueInput;
};
export type SupportTicketMessageFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SupportTicketMessageSelect<ExtArgs> | null;
    omit?: Prisma.SupportTicketMessageOmit<ExtArgs> | null;
    include?: Prisma.SupportTicketMessageInclude<ExtArgs> | null;
    where: Prisma.SupportTicketMessageWhereUniqueInput;
};
export type SupportTicketMessageFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SupportTicketMessageSelect<ExtArgs> | null;
    omit?: Prisma.SupportTicketMessageOmit<ExtArgs> | null;
    include?: Prisma.SupportTicketMessageInclude<ExtArgs> | null;
    where?: Prisma.SupportTicketMessageWhereInput;
    orderBy?: Prisma.SupportTicketMessageOrderByWithRelationInput | Prisma.SupportTicketMessageOrderByWithRelationInput[];
    cursor?: Prisma.SupportTicketMessageWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SupportTicketMessageScalarFieldEnum | Prisma.SupportTicketMessageScalarFieldEnum[];
};
export type SupportTicketMessageFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SupportTicketMessageSelect<ExtArgs> | null;
    omit?: Prisma.SupportTicketMessageOmit<ExtArgs> | null;
    include?: Prisma.SupportTicketMessageInclude<ExtArgs> | null;
    where?: Prisma.SupportTicketMessageWhereInput;
    orderBy?: Prisma.SupportTicketMessageOrderByWithRelationInput | Prisma.SupportTicketMessageOrderByWithRelationInput[];
    cursor?: Prisma.SupportTicketMessageWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SupportTicketMessageScalarFieldEnum | Prisma.SupportTicketMessageScalarFieldEnum[];
};
export type SupportTicketMessageFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SupportTicketMessageSelect<ExtArgs> | null;
    omit?: Prisma.SupportTicketMessageOmit<ExtArgs> | null;
    include?: Prisma.SupportTicketMessageInclude<ExtArgs> | null;
    where?: Prisma.SupportTicketMessageWhereInput;
    orderBy?: Prisma.SupportTicketMessageOrderByWithRelationInput | Prisma.SupportTicketMessageOrderByWithRelationInput[];
    cursor?: Prisma.SupportTicketMessageWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.SupportTicketMessageScalarFieldEnum | Prisma.SupportTicketMessageScalarFieldEnum[];
};
export type SupportTicketMessageCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SupportTicketMessageSelect<ExtArgs> | null;
    omit?: Prisma.SupportTicketMessageOmit<ExtArgs> | null;
    include?: Prisma.SupportTicketMessageInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SupportTicketMessageCreateInput, Prisma.SupportTicketMessageUncheckedCreateInput>;
};
export type SupportTicketMessageCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.SupportTicketMessageCreateManyInput | Prisma.SupportTicketMessageCreateManyInput[];
    skipDuplicates?: boolean;
};
export type SupportTicketMessageCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SupportTicketMessageSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.SupportTicketMessageOmit<ExtArgs> | null;
    data: Prisma.SupportTicketMessageCreateManyInput | Prisma.SupportTicketMessageCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.SupportTicketMessageIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type SupportTicketMessageUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SupportTicketMessageSelect<ExtArgs> | null;
    omit?: Prisma.SupportTicketMessageOmit<ExtArgs> | null;
    include?: Prisma.SupportTicketMessageInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SupportTicketMessageUpdateInput, Prisma.SupportTicketMessageUncheckedUpdateInput>;
    where: Prisma.SupportTicketMessageWhereUniqueInput;
};
export type SupportTicketMessageUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.SupportTicketMessageUpdateManyMutationInput, Prisma.SupportTicketMessageUncheckedUpdateManyInput>;
    where?: Prisma.SupportTicketMessageWhereInput;
    limit?: number;
};
export type SupportTicketMessageUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SupportTicketMessageSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.SupportTicketMessageOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.SupportTicketMessageUpdateManyMutationInput, Prisma.SupportTicketMessageUncheckedUpdateManyInput>;
    where?: Prisma.SupportTicketMessageWhereInput;
    limit?: number;
    include?: Prisma.SupportTicketMessageIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type SupportTicketMessageUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SupportTicketMessageSelect<ExtArgs> | null;
    omit?: Prisma.SupportTicketMessageOmit<ExtArgs> | null;
    include?: Prisma.SupportTicketMessageInclude<ExtArgs> | null;
    where: Prisma.SupportTicketMessageWhereUniqueInput;
    create: Prisma.XOR<Prisma.SupportTicketMessageCreateInput, Prisma.SupportTicketMessageUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.SupportTicketMessageUpdateInput, Prisma.SupportTicketMessageUncheckedUpdateInput>;
};
export type SupportTicketMessageDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SupportTicketMessageSelect<ExtArgs> | null;
    omit?: Prisma.SupportTicketMessageOmit<ExtArgs> | null;
    include?: Prisma.SupportTicketMessageInclude<ExtArgs> | null;
    where: Prisma.SupportTicketMessageWhereUniqueInput;
};
export type SupportTicketMessageDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.SupportTicketMessageWhereInput;
    limit?: number;
};
export type SupportTicketMessageDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SupportTicketMessageSelect<ExtArgs> | null;
    omit?: Prisma.SupportTicketMessageOmit<ExtArgs> | null;
    include?: Prisma.SupportTicketMessageInclude<ExtArgs> | null;
};
