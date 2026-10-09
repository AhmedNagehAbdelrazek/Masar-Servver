import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type MessageModel = runtime.Types.Result.DefaultSelection<Prisma.$MessagePayload>;
export type AggregateMessage = {
    _count: MessageCountAggregateOutputType | null;
    _min: MessageMinAggregateOutputType | null;
    _max: MessageMaxAggregateOutputType | null;
};
export type MessageMinAggregateOutputType = {
    id: string | null;
    senderId: string | null;
    receiverId: string | null;
    bookingId: string | null;
    supportTicketId: string | null;
    message: string | null;
    messageType: string | null;
    isRead: boolean | null;
    readAt: Date | null;
    createdAt: Date | null;
};
export type MessageMaxAggregateOutputType = {
    id: string | null;
    senderId: string | null;
    receiverId: string | null;
    bookingId: string | null;
    supportTicketId: string | null;
    message: string | null;
    messageType: string | null;
    isRead: boolean | null;
    readAt: Date | null;
    createdAt: Date | null;
};
export type MessageCountAggregateOutputType = {
    id: number;
    senderId: number;
    receiverId: number;
    bookingId: number;
    supportTicketId: number;
    message: number;
    messageType: number;
    isRead: number;
    readAt: number;
    createdAt: number;
    _all: number;
};
export type MessageMinAggregateInputType = {
    id?: true;
    senderId?: true;
    receiverId?: true;
    bookingId?: true;
    supportTicketId?: true;
    message?: true;
    messageType?: true;
    isRead?: true;
    readAt?: true;
    createdAt?: true;
};
export type MessageMaxAggregateInputType = {
    id?: true;
    senderId?: true;
    receiverId?: true;
    bookingId?: true;
    supportTicketId?: true;
    message?: true;
    messageType?: true;
    isRead?: true;
    readAt?: true;
    createdAt?: true;
};
export type MessageCountAggregateInputType = {
    id?: true;
    senderId?: true;
    receiverId?: true;
    bookingId?: true;
    supportTicketId?: true;
    message?: true;
    messageType?: true;
    isRead?: true;
    readAt?: true;
    createdAt?: true;
    _all?: true;
};
export type MessageAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MessageWhereInput;
    orderBy?: Prisma.MessageOrderByWithRelationInput | Prisma.MessageOrderByWithRelationInput[];
    cursor?: Prisma.MessageWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | MessageCountAggregateInputType;
    _min?: MessageMinAggregateInputType;
    _max?: MessageMaxAggregateInputType;
};
export type GetMessageAggregateType<T extends MessageAggregateArgs> = {
    [P in keyof T & keyof AggregateMessage]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateMessage[P]> : Prisma.GetScalarType<T[P], AggregateMessage[P]>;
};
export type MessageGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MessageWhereInput;
    orderBy?: Prisma.MessageOrderByWithAggregationInput | Prisma.MessageOrderByWithAggregationInput[];
    by: Prisma.MessageScalarFieldEnum[] | Prisma.MessageScalarFieldEnum;
    having?: Prisma.MessageScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: MessageCountAggregateInputType | true;
    _min?: MessageMinAggregateInputType;
    _max?: MessageMaxAggregateInputType;
};
export type MessageGroupByOutputType = {
    id: string;
    senderId: string;
    receiverId: string | null;
    bookingId: string | null;
    supportTicketId: string | null;
    message: string;
    messageType: string;
    isRead: boolean;
    readAt: Date | null;
    createdAt: Date;
    _count: MessageCountAggregateOutputType | null;
    _min: MessageMinAggregateOutputType | null;
    _max: MessageMaxAggregateOutputType | null;
};
export type GetMessageGroupByPayload<T extends MessageGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<MessageGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof MessageGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], MessageGroupByOutputType[P]> : Prisma.GetScalarType<T[P], MessageGroupByOutputType[P]>;
}>>;
export type MessageWhereInput = {
    AND?: Prisma.MessageWhereInput | Prisma.MessageWhereInput[];
    OR?: Prisma.MessageWhereInput[];
    NOT?: Prisma.MessageWhereInput | Prisma.MessageWhereInput[];
    id?: Prisma.UuidFilter<"Message"> | string;
    senderId?: Prisma.UuidFilter<"Message"> | string;
    receiverId?: Prisma.UuidNullableFilter<"Message"> | string | null;
    bookingId?: Prisma.UuidNullableFilter<"Message"> | string | null;
    supportTicketId?: Prisma.UuidNullableFilter<"Message"> | string | null;
    message?: Prisma.StringFilter<"Message"> | string;
    messageType?: Prisma.StringFilter<"Message"> | string;
    isRead?: Prisma.BoolFilter<"Message"> | boolean;
    readAt?: Prisma.DateTimeNullableFilter<"Message"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"Message"> | Date | string;
    sender?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    receiver?: Prisma.XOR<Prisma.UserNullableScalarRelationFilter, Prisma.UserWhereInput> | null;
    booking?: Prisma.XOR<Prisma.BookingNullableScalarRelationFilter, Prisma.BookingWhereInput> | null;
    supportTicket?: Prisma.XOR<Prisma.SupportTicketNullableScalarRelationFilter, Prisma.SupportTicketWhereInput> | null;
};
export type MessageOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    senderId?: Prisma.SortOrder;
    receiverId?: Prisma.SortOrderInput | Prisma.SortOrder;
    bookingId?: Prisma.SortOrderInput | Prisma.SortOrder;
    supportTicketId?: Prisma.SortOrderInput | Prisma.SortOrder;
    message?: Prisma.SortOrder;
    messageType?: Prisma.SortOrder;
    isRead?: Prisma.SortOrder;
    readAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    sender?: Prisma.UserOrderByWithRelationInput;
    receiver?: Prisma.UserOrderByWithRelationInput;
    booking?: Prisma.BookingOrderByWithRelationInput;
    supportTicket?: Prisma.SupportTicketOrderByWithRelationInput;
};
export type MessageWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.MessageWhereInput | Prisma.MessageWhereInput[];
    OR?: Prisma.MessageWhereInput[];
    NOT?: Prisma.MessageWhereInput | Prisma.MessageWhereInput[];
    senderId?: Prisma.UuidFilter<"Message"> | string;
    receiverId?: Prisma.UuidNullableFilter<"Message"> | string | null;
    bookingId?: Prisma.UuidNullableFilter<"Message"> | string | null;
    supportTicketId?: Prisma.UuidNullableFilter<"Message"> | string | null;
    message?: Prisma.StringFilter<"Message"> | string;
    messageType?: Prisma.StringFilter<"Message"> | string;
    isRead?: Prisma.BoolFilter<"Message"> | boolean;
    readAt?: Prisma.DateTimeNullableFilter<"Message"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"Message"> | Date | string;
    sender?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    receiver?: Prisma.XOR<Prisma.UserNullableScalarRelationFilter, Prisma.UserWhereInput> | null;
    booking?: Prisma.XOR<Prisma.BookingNullableScalarRelationFilter, Prisma.BookingWhereInput> | null;
    supportTicket?: Prisma.XOR<Prisma.SupportTicketNullableScalarRelationFilter, Prisma.SupportTicketWhereInput> | null;
}, "id">;
export type MessageOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    senderId?: Prisma.SortOrder;
    receiverId?: Prisma.SortOrderInput | Prisma.SortOrder;
    bookingId?: Prisma.SortOrderInput | Prisma.SortOrder;
    supportTicketId?: Prisma.SortOrderInput | Prisma.SortOrder;
    message?: Prisma.SortOrder;
    messageType?: Prisma.SortOrder;
    isRead?: Prisma.SortOrder;
    readAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.MessageCountOrderByAggregateInput;
    _max?: Prisma.MessageMaxOrderByAggregateInput;
    _min?: Prisma.MessageMinOrderByAggregateInput;
};
export type MessageScalarWhereWithAggregatesInput = {
    AND?: Prisma.MessageScalarWhereWithAggregatesInput | Prisma.MessageScalarWhereWithAggregatesInput[];
    OR?: Prisma.MessageScalarWhereWithAggregatesInput[];
    NOT?: Prisma.MessageScalarWhereWithAggregatesInput | Prisma.MessageScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"Message"> | string;
    senderId?: Prisma.UuidWithAggregatesFilter<"Message"> | string;
    receiverId?: Prisma.UuidNullableWithAggregatesFilter<"Message"> | string | null;
    bookingId?: Prisma.UuidNullableWithAggregatesFilter<"Message"> | string | null;
    supportTicketId?: Prisma.UuidNullableWithAggregatesFilter<"Message"> | string | null;
    message?: Prisma.StringWithAggregatesFilter<"Message"> | string;
    messageType?: Prisma.StringWithAggregatesFilter<"Message"> | string;
    isRead?: Prisma.BoolWithAggregatesFilter<"Message"> | boolean;
    readAt?: Prisma.DateTimeNullableWithAggregatesFilter<"Message"> | Date | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Message"> | Date | string;
};
export type MessageCreateInput = {
    id?: string;
    message: string;
    messageType?: string;
    isRead?: boolean;
    readAt?: Date | string | null;
    createdAt?: Date | string;
    sender: Prisma.UserCreateNestedOneWithoutSentMessagesInput;
    receiver?: Prisma.UserCreateNestedOneWithoutReceivedMessagesInput;
    booking?: Prisma.BookingCreateNestedOneWithoutMessagesInput;
    supportTicket?: Prisma.SupportTicketCreateNestedOneWithoutChatMessagesInput;
};
export type MessageUncheckedCreateInput = {
    id?: string;
    senderId: string;
    receiverId?: string | null;
    bookingId?: string | null;
    supportTicketId?: string | null;
    message: string;
    messageType?: string;
    isRead?: boolean;
    readAt?: Date | string | null;
    createdAt?: Date | string;
};
export type MessageUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    messageType?: Prisma.StringFieldUpdateOperationsInput | string;
    isRead?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    readAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    sender?: Prisma.UserUpdateOneRequiredWithoutSentMessagesNestedInput;
    receiver?: Prisma.UserUpdateOneWithoutReceivedMessagesNestedInput;
    booking?: Prisma.BookingUpdateOneWithoutMessagesNestedInput;
    supportTicket?: Prisma.SupportTicketUpdateOneWithoutChatMessagesNestedInput;
};
export type MessageUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    senderId?: Prisma.StringFieldUpdateOperationsInput | string;
    receiverId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    supportTicketId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    messageType?: Prisma.StringFieldUpdateOperationsInput | string;
    isRead?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    readAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MessageCreateManyInput = {
    id?: string;
    senderId: string;
    receiverId?: string | null;
    bookingId?: string | null;
    supportTicketId?: string | null;
    message: string;
    messageType?: string;
    isRead?: boolean;
    readAt?: Date | string | null;
    createdAt?: Date | string;
};
export type MessageUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    messageType?: Prisma.StringFieldUpdateOperationsInput | string;
    isRead?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    readAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MessageUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    senderId?: Prisma.StringFieldUpdateOperationsInput | string;
    receiverId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    supportTicketId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    messageType?: Prisma.StringFieldUpdateOperationsInput | string;
    isRead?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    readAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MessageListRelationFilter = {
    every?: Prisma.MessageWhereInput;
    some?: Prisma.MessageWhereInput;
    none?: Prisma.MessageWhereInput;
};
export type MessageOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type MessageCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    senderId?: Prisma.SortOrder;
    receiverId?: Prisma.SortOrder;
    bookingId?: Prisma.SortOrder;
    supportTicketId?: Prisma.SortOrder;
    message?: Prisma.SortOrder;
    messageType?: Prisma.SortOrder;
    isRead?: Prisma.SortOrder;
    readAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type MessageMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    senderId?: Prisma.SortOrder;
    receiverId?: Prisma.SortOrder;
    bookingId?: Prisma.SortOrder;
    supportTicketId?: Prisma.SortOrder;
    message?: Prisma.SortOrder;
    messageType?: Prisma.SortOrder;
    isRead?: Prisma.SortOrder;
    readAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type MessageMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    senderId?: Prisma.SortOrder;
    receiverId?: Prisma.SortOrder;
    bookingId?: Prisma.SortOrder;
    supportTicketId?: Prisma.SortOrder;
    message?: Prisma.SortOrder;
    messageType?: Prisma.SortOrder;
    isRead?: Prisma.SortOrder;
    readAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type MessageCreateNestedManyWithoutSenderInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutSenderInput, Prisma.MessageUncheckedCreateWithoutSenderInput> | Prisma.MessageCreateWithoutSenderInput[] | Prisma.MessageUncheckedCreateWithoutSenderInput[];
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutSenderInput | Prisma.MessageCreateOrConnectWithoutSenderInput[];
    createMany?: Prisma.MessageCreateManySenderInputEnvelope;
    connect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
};
export type MessageCreateNestedManyWithoutReceiverInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutReceiverInput, Prisma.MessageUncheckedCreateWithoutReceiverInput> | Prisma.MessageCreateWithoutReceiverInput[] | Prisma.MessageUncheckedCreateWithoutReceiverInput[];
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutReceiverInput | Prisma.MessageCreateOrConnectWithoutReceiverInput[];
    createMany?: Prisma.MessageCreateManyReceiverInputEnvelope;
    connect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
};
export type MessageUncheckedCreateNestedManyWithoutSenderInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutSenderInput, Prisma.MessageUncheckedCreateWithoutSenderInput> | Prisma.MessageCreateWithoutSenderInput[] | Prisma.MessageUncheckedCreateWithoutSenderInput[];
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutSenderInput | Prisma.MessageCreateOrConnectWithoutSenderInput[];
    createMany?: Prisma.MessageCreateManySenderInputEnvelope;
    connect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
};
export type MessageUncheckedCreateNestedManyWithoutReceiverInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutReceiverInput, Prisma.MessageUncheckedCreateWithoutReceiverInput> | Prisma.MessageCreateWithoutReceiverInput[] | Prisma.MessageUncheckedCreateWithoutReceiverInput[];
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutReceiverInput | Prisma.MessageCreateOrConnectWithoutReceiverInput[];
    createMany?: Prisma.MessageCreateManyReceiverInputEnvelope;
    connect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
};
export type MessageUpdateManyWithoutSenderNestedInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutSenderInput, Prisma.MessageUncheckedCreateWithoutSenderInput> | Prisma.MessageCreateWithoutSenderInput[] | Prisma.MessageUncheckedCreateWithoutSenderInput[];
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutSenderInput | Prisma.MessageCreateOrConnectWithoutSenderInput[];
    upsert?: Prisma.MessageUpsertWithWhereUniqueWithoutSenderInput | Prisma.MessageUpsertWithWhereUniqueWithoutSenderInput[];
    createMany?: Prisma.MessageCreateManySenderInputEnvelope;
    set?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    disconnect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    delete?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    connect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    update?: Prisma.MessageUpdateWithWhereUniqueWithoutSenderInput | Prisma.MessageUpdateWithWhereUniqueWithoutSenderInput[];
    updateMany?: Prisma.MessageUpdateManyWithWhereWithoutSenderInput | Prisma.MessageUpdateManyWithWhereWithoutSenderInput[];
    deleteMany?: Prisma.MessageScalarWhereInput | Prisma.MessageScalarWhereInput[];
};
export type MessageUpdateManyWithoutReceiverNestedInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutReceiverInput, Prisma.MessageUncheckedCreateWithoutReceiverInput> | Prisma.MessageCreateWithoutReceiverInput[] | Prisma.MessageUncheckedCreateWithoutReceiverInput[];
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutReceiverInput | Prisma.MessageCreateOrConnectWithoutReceiverInput[];
    upsert?: Prisma.MessageUpsertWithWhereUniqueWithoutReceiverInput | Prisma.MessageUpsertWithWhereUniqueWithoutReceiverInput[];
    createMany?: Prisma.MessageCreateManyReceiverInputEnvelope;
    set?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    disconnect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    delete?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    connect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    update?: Prisma.MessageUpdateWithWhereUniqueWithoutReceiverInput | Prisma.MessageUpdateWithWhereUniqueWithoutReceiverInput[];
    updateMany?: Prisma.MessageUpdateManyWithWhereWithoutReceiverInput | Prisma.MessageUpdateManyWithWhereWithoutReceiverInput[];
    deleteMany?: Prisma.MessageScalarWhereInput | Prisma.MessageScalarWhereInput[];
};
export type MessageUncheckedUpdateManyWithoutSenderNestedInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutSenderInput, Prisma.MessageUncheckedCreateWithoutSenderInput> | Prisma.MessageCreateWithoutSenderInput[] | Prisma.MessageUncheckedCreateWithoutSenderInput[];
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutSenderInput | Prisma.MessageCreateOrConnectWithoutSenderInput[];
    upsert?: Prisma.MessageUpsertWithWhereUniqueWithoutSenderInput | Prisma.MessageUpsertWithWhereUniqueWithoutSenderInput[];
    createMany?: Prisma.MessageCreateManySenderInputEnvelope;
    set?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    disconnect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    delete?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    connect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    update?: Prisma.MessageUpdateWithWhereUniqueWithoutSenderInput | Prisma.MessageUpdateWithWhereUniqueWithoutSenderInput[];
    updateMany?: Prisma.MessageUpdateManyWithWhereWithoutSenderInput | Prisma.MessageUpdateManyWithWhereWithoutSenderInput[];
    deleteMany?: Prisma.MessageScalarWhereInput | Prisma.MessageScalarWhereInput[];
};
export type MessageUncheckedUpdateManyWithoutReceiverNestedInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutReceiverInput, Prisma.MessageUncheckedCreateWithoutReceiverInput> | Prisma.MessageCreateWithoutReceiverInput[] | Prisma.MessageUncheckedCreateWithoutReceiverInput[];
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutReceiverInput | Prisma.MessageCreateOrConnectWithoutReceiverInput[];
    upsert?: Prisma.MessageUpsertWithWhereUniqueWithoutReceiverInput | Prisma.MessageUpsertWithWhereUniqueWithoutReceiverInput[];
    createMany?: Prisma.MessageCreateManyReceiverInputEnvelope;
    set?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    disconnect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    delete?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    connect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    update?: Prisma.MessageUpdateWithWhereUniqueWithoutReceiverInput | Prisma.MessageUpdateWithWhereUniqueWithoutReceiverInput[];
    updateMany?: Prisma.MessageUpdateManyWithWhereWithoutReceiverInput | Prisma.MessageUpdateManyWithWhereWithoutReceiverInput[];
    deleteMany?: Prisma.MessageScalarWhereInput | Prisma.MessageScalarWhereInput[];
};
export type MessageCreateNestedManyWithoutBookingInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutBookingInput, Prisma.MessageUncheckedCreateWithoutBookingInput> | Prisma.MessageCreateWithoutBookingInput[] | Prisma.MessageUncheckedCreateWithoutBookingInput[];
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutBookingInput | Prisma.MessageCreateOrConnectWithoutBookingInput[];
    createMany?: Prisma.MessageCreateManyBookingInputEnvelope;
    connect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
};
export type MessageUncheckedCreateNestedManyWithoutBookingInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutBookingInput, Prisma.MessageUncheckedCreateWithoutBookingInput> | Prisma.MessageCreateWithoutBookingInput[] | Prisma.MessageUncheckedCreateWithoutBookingInput[];
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutBookingInput | Prisma.MessageCreateOrConnectWithoutBookingInput[];
    createMany?: Prisma.MessageCreateManyBookingInputEnvelope;
    connect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
};
export type MessageUpdateManyWithoutBookingNestedInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutBookingInput, Prisma.MessageUncheckedCreateWithoutBookingInput> | Prisma.MessageCreateWithoutBookingInput[] | Prisma.MessageUncheckedCreateWithoutBookingInput[];
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutBookingInput | Prisma.MessageCreateOrConnectWithoutBookingInput[];
    upsert?: Prisma.MessageUpsertWithWhereUniqueWithoutBookingInput | Prisma.MessageUpsertWithWhereUniqueWithoutBookingInput[];
    createMany?: Prisma.MessageCreateManyBookingInputEnvelope;
    set?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    disconnect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    delete?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    connect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    update?: Prisma.MessageUpdateWithWhereUniqueWithoutBookingInput | Prisma.MessageUpdateWithWhereUniqueWithoutBookingInput[];
    updateMany?: Prisma.MessageUpdateManyWithWhereWithoutBookingInput | Prisma.MessageUpdateManyWithWhereWithoutBookingInput[];
    deleteMany?: Prisma.MessageScalarWhereInput | Prisma.MessageScalarWhereInput[];
};
export type MessageUncheckedUpdateManyWithoutBookingNestedInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutBookingInput, Prisma.MessageUncheckedCreateWithoutBookingInput> | Prisma.MessageCreateWithoutBookingInput[] | Prisma.MessageUncheckedCreateWithoutBookingInput[];
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutBookingInput | Prisma.MessageCreateOrConnectWithoutBookingInput[];
    upsert?: Prisma.MessageUpsertWithWhereUniqueWithoutBookingInput | Prisma.MessageUpsertWithWhereUniqueWithoutBookingInput[];
    createMany?: Prisma.MessageCreateManyBookingInputEnvelope;
    set?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    disconnect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    delete?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    connect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    update?: Prisma.MessageUpdateWithWhereUniqueWithoutBookingInput | Prisma.MessageUpdateWithWhereUniqueWithoutBookingInput[];
    updateMany?: Prisma.MessageUpdateManyWithWhereWithoutBookingInput | Prisma.MessageUpdateManyWithWhereWithoutBookingInput[];
    deleteMany?: Prisma.MessageScalarWhereInput | Prisma.MessageScalarWhereInput[];
};
export type MessageCreateNestedManyWithoutSupportTicketInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutSupportTicketInput, Prisma.MessageUncheckedCreateWithoutSupportTicketInput> | Prisma.MessageCreateWithoutSupportTicketInput[] | Prisma.MessageUncheckedCreateWithoutSupportTicketInput[];
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutSupportTicketInput | Prisma.MessageCreateOrConnectWithoutSupportTicketInput[];
    createMany?: Prisma.MessageCreateManySupportTicketInputEnvelope;
    connect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
};
export type MessageUncheckedCreateNestedManyWithoutSupportTicketInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutSupportTicketInput, Prisma.MessageUncheckedCreateWithoutSupportTicketInput> | Prisma.MessageCreateWithoutSupportTicketInput[] | Prisma.MessageUncheckedCreateWithoutSupportTicketInput[];
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutSupportTicketInput | Prisma.MessageCreateOrConnectWithoutSupportTicketInput[];
    createMany?: Prisma.MessageCreateManySupportTicketInputEnvelope;
    connect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
};
export type MessageUpdateManyWithoutSupportTicketNestedInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutSupportTicketInput, Prisma.MessageUncheckedCreateWithoutSupportTicketInput> | Prisma.MessageCreateWithoutSupportTicketInput[] | Prisma.MessageUncheckedCreateWithoutSupportTicketInput[];
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutSupportTicketInput | Prisma.MessageCreateOrConnectWithoutSupportTicketInput[];
    upsert?: Prisma.MessageUpsertWithWhereUniqueWithoutSupportTicketInput | Prisma.MessageUpsertWithWhereUniqueWithoutSupportTicketInput[];
    createMany?: Prisma.MessageCreateManySupportTicketInputEnvelope;
    set?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    disconnect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    delete?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    connect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    update?: Prisma.MessageUpdateWithWhereUniqueWithoutSupportTicketInput | Prisma.MessageUpdateWithWhereUniqueWithoutSupportTicketInput[];
    updateMany?: Prisma.MessageUpdateManyWithWhereWithoutSupportTicketInput | Prisma.MessageUpdateManyWithWhereWithoutSupportTicketInput[];
    deleteMany?: Prisma.MessageScalarWhereInput | Prisma.MessageScalarWhereInput[];
};
export type MessageUncheckedUpdateManyWithoutSupportTicketNestedInput = {
    create?: Prisma.XOR<Prisma.MessageCreateWithoutSupportTicketInput, Prisma.MessageUncheckedCreateWithoutSupportTicketInput> | Prisma.MessageCreateWithoutSupportTicketInput[] | Prisma.MessageUncheckedCreateWithoutSupportTicketInput[];
    connectOrCreate?: Prisma.MessageCreateOrConnectWithoutSupportTicketInput | Prisma.MessageCreateOrConnectWithoutSupportTicketInput[];
    upsert?: Prisma.MessageUpsertWithWhereUniqueWithoutSupportTicketInput | Prisma.MessageUpsertWithWhereUniqueWithoutSupportTicketInput[];
    createMany?: Prisma.MessageCreateManySupportTicketInputEnvelope;
    set?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    disconnect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    delete?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    connect?: Prisma.MessageWhereUniqueInput | Prisma.MessageWhereUniqueInput[];
    update?: Prisma.MessageUpdateWithWhereUniqueWithoutSupportTicketInput | Prisma.MessageUpdateWithWhereUniqueWithoutSupportTicketInput[];
    updateMany?: Prisma.MessageUpdateManyWithWhereWithoutSupportTicketInput | Prisma.MessageUpdateManyWithWhereWithoutSupportTicketInput[];
    deleteMany?: Prisma.MessageScalarWhereInput | Prisma.MessageScalarWhereInput[];
};
export type MessageCreateWithoutSenderInput = {
    id?: string;
    message: string;
    messageType?: string;
    isRead?: boolean;
    readAt?: Date | string | null;
    createdAt?: Date | string;
    receiver?: Prisma.UserCreateNestedOneWithoutReceivedMessagesInput;
    booking?: Prisma.BookingCreateNestedOneWithoutMessagesInput;
    supportTicket?: Prisma.SupportTicketCreateNestedOneWithoutChatMessagesInput;
};
export type MessageUncheckedCreateWithoutSenderInput = {
    id?: string;
    receiverId?: string | null;
    bookingId?: string | null;
    supportTicketId?: string | null;
    message: string;
    messageType?: string;
    isRead?: boolean;
    readAt?: Date | string | null;
    createdAt?: Date | string;
};
export type MessageCreateOrConnectWithoutSenderInput = {
    where: Prisma.MessageWhereUniqueInput;
    create: Prisma.XOR<Prisma.MessageCreateWithoutSenderInput, Prisma.MessageUncheckedCreateWithoutSenderInput>;
};
export type MessageCreateManySenderInputEnvelope = {
    data: Prisma.MessageCreateManySenderInput | Prisma.MessageCreateManySenderInput[];
    skipDuplicates?: boolean;
};
export type MessageCreateWithoutReceiverInput = {
    id?: string;
    message: string;
    messageType?: string;
    isRead?: boolean;
    readAt?: Date | string | null;
    createdAt?: Date | string;
    sender: Prisma.UserCreateNestedOneWithoutSentMessagesInput;
    booking?: Prisma.BookingCreateNestedOneWithoutMessagesInput;
    supportTicket?: Prisma.SupportTicketCreateNestedOneWithoutChatMessagesInput;
};
export type MessageUncheckedCreateWithoutReceiverInput = {
    id?: string;
    senderId: string;
    bookingId?: string | null;
    supportTicketId?: string | null;
    message: string;
    messageType?: string;
    isRead?: boolean;
    readAt?: Date | string | null;
    createdAt?: Date | string;
};
export type MessageCreateOrConnectWithoutReceiverInput = {
    where: Prisma.MessageWhereUniqueInput;
    create: Prisma.XOR<Prisma.MessageCreateWithoutReceiverInput, Prisma.MessageUncheckedCreateWithoutReceiverInput>;
};
export type MessageCreateManyReceiverInputEnvelope = {
    data: Prisma.MessageCreateManyReceiverInput | Prisma.MessageCreateManyReceiverInput[];
    skipDuplicates?: boolean;
};
export type MessageUpsertWithWhereUniqueWithoutSenderInput = {
    where: Prisma.MessageWhereUniqueInput;
    update: Prisma.XOR<Prisma.MessageUpdateWithoutSenderInput, Prisma.MessageUncheckedUpdateWithoutSenderInput>;
    create: Prisma.XOR<Prisma.MessageCreateWithoutSenderInput, Prisma.MessageUncheckedCreateWithoutSenderInput>;
};
export type MessageUpdateWithWhereUniqueWithoutSenderInput = {
    where: Prisma.MessageWhereUniqueInput;
    data: Prisma.XOR<Prisma.MessageUpdateWithoutSenderInput, Prisma.MessageUncheckedUpdateWithoutSenderInput>;
};
export type MessageUpdateManyWithWhereWithoutSenderInput = {
    where: Prisma.MessageScalarWhereInput;
    data: Prisma.XOR<Prisma.MessageUpdateManyMutationInput, Prisma.MessageUncheckedUpdateManyWithoutSenderInput>;
};
export type MessageScalarWhereInput = {
    AND?: Prisma.MessageScalarWhereInput | Prisma.MessageScalarWhereInput[];
    OR?: Prisma.MessageScalarWhereInput[];
    NOT?: Prisma.MessageScalarWhereInput | Prisma.MessageScalarWhereInput[];
    id?: Prisma.UuidFilter<"Message"> | string;
    senderId?: Prisma.UuidFilter<"Message"> | string;
    receiverId?: Prisma.UuidNullableFilter<"Message"> | string | null;
    bookingId?: Prisma.UuidNullableFilter<"Message"> | string | null;
    supportTicketId?: Prisma.UuidNullableFilter<"Message"> | string | null;
    message?: Prisma.StringFilter<"Message"> | string;
    messageType?: Prisma.StringFilter<"Message"> | string;
    isRead?: Prisma.BoolFilter<"Message"> | boolean;
    readAt?: Prisma.DateTimeNullableFilter<"Message"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"Message"> | Date | string;
};
export type MessageUpsertWithWhereUniqueWithoutReceiverInput = {
    where: Prisma.MessageWhereUniqueInput;
    update: Prisma.XOR<Prisma.MessageUpdateWithoutReceiverInput, Prisma.MessageUncheckedUpdateWithoutReceiverInput>;
    create: Prisma.XOR<Prisma.MessageCreateWithoutReceiverInput, Prisma.MessageUncheckedCreateWithoutReceiverInput>;
};
export type MessageUpdateWithWhereUniqueWithoutReceiverInput = {
    where: Prisma.MessageWhereUniqueInput;
    data: Prisma.XOR<Prisma.MessageUpdateWithoutReceiverInput, Prisma.MessageUncheckedUpdateWithoutReceiverInput>;
};
export type MessageUpdateManyWithWhereWithoutReceiverInput = {
    where: Prisma.MessageScalarWhereInput;
    data: Prisma.XOR<Prisma.MessageUpdateManyMutationInput, Prisma.MessageUncheckedUpdateManyWithoutReceiverInput>;
};
export type MessageCreateWithoutBookingInput = {
    id?: string;
    message: string;
    messageType?: string;
    isRead?: boolean;
    readAt?: Date | string | null;
    createdAt?: Date | string;
    sender: Prisma.UserCreateNestedOneWithoutSentMessagesInput;
    receiver?: Prisma.UserCreateNestedOneWithoutReceivedMessagesInput;
    supportTicket?: Prisma.SupportTicketCreateNestedOneWithoutChatMessagesInput;
};
export type MessageUncheckedCreateWithoutBookingInput = {
    id?: string;
    senderId: string;
    receiverId?: string | null;
    supportTicketId?: string | null;
    message: string;
    messageType?: string;
    isRead?: boolean;
    readAt?: Date | string | null;
    createdAt?: Date | string;
};
export type MessageCreateOrConnectWithoutBookingInput = {
    where: Prisma.MessageWhereUniqueInput;
    create: Prisma.XOR<Prisma.MessageCreateWithoutBookingInput, Prisma.MessageUncheckedCreateWithoutBookingInput>;
};
export type MessageCreateManyBookingInputEnvelope = {
    data: Prisma.MessageCreateManyBookingInput | Prisma.MessageCreateManyBookingInput[];
    skipDuplicates?: boolean;
};
export type MessageUpsertWithWhereUniqueWithoutBookingInput = {
    where: Prisma.MessageWhereUniqueInput;
    update: Prisma.XOR<Prisma.MessageUpdateWithoutBookingInput, Prisma.MessageUncheckedUpdateWithoutBookingInput>;
    create: Prisma.XOR<Prisma.MessageCreateWithoutBookingInput, Prisma.MessageUncheckedCreateWithoutBookingInput>;
};
export type MessageUpdateWithWhereUniqueWithoutBookingInput = {
    where: Prisma.MessageWhereUniqueInput;
    data: Prisma.XOR<Prisma.MessageUpdateWithoutBookingInput, Prisma.MessageUncheckedUpdateWithoutBookingInput>;
};
export type MessageUpdateManyWithWhereWithoutBookingInput = {
    where: Prisma.MessageScalarWhereInput;
    data: Prisma.XOR<Prisma.MessageUpdateManyMutationInput, Prisma.MessageUncheckedUpdateManyWithoutBookingInput>;
};
export type MessageCreateWithoutSupportTicketInput = {
    id?: string;
    message: string;
    messageType?: string;
    isRead?: boolean;
    readAt?: Date | string | null;
    createdAt?: Date | string;
    sender: Prisma.UserCreateNestedOneWithoutSentMessagesInput;
    receiver?: Prisma.UserCreateNestedOneWithoutReceivedMessagesInput;
    booking?: Prisma.BookingCreateNestedOneWithoutMessagesInput;
};
export type MessageUncheckedCreateWithoutSupportTicketInput = {
    id?: string;
    senderId: string;
    receiverId?: string | null;
    bookingId?: string | null;
    message: string;
    messageType?: string;
    isRead?: boolean;
    readAt?: Date | string | null;
    createdAt?: Date | string;
};
export type MessageCreateOrConnectWithoutSupportTicketInput = {
    where: Prisma.MessageWhereUniqueInput;
    create: Prisma.XOR<Prisma.MessageCreateWithoutSupportTicketInput, Prisma.MessageUncheckedCreateWithoutSupportTicketInput>;
};
export type MessageCreateManySupportTicketInputEnvelope = {
    data: Prisma.MessageCreateManySupportTicketInput | Prisma.MessageCreateManySupportTicketInput[];
    skipDuplicates?: boolean;
};
export type MessageUpsertWithWhereUniqueWithoutSupportTicketInput = {
    where: Prisma.MessageWhereUniqueInput;
    update: Prisma.XOR<Prisma.MessageUpdateWithoutSupportTicketInput, Prisma.MessageUncheckedUpdateWithoutSupportTicketInput>;
    create: Prisma.XOR<Prisma.MessageCreateWithoutSupportTicketInput, Prisma.MessageUncheckedCreateWithoutSupportTicketInput>;
};
export type MessageUpdateWithWhereUniqueWithoutSupportTicketInput = {
    where: Prisma.MessageWhereUniqueInput;
    data: Prisma.XOR<Prisma.MessageUpdateWithoutSupportTicketInput, Prisma.MessageUncheckedUpdateWithoutSupportTicketInput>;
};
export type MessageUpdateManyWithWhereWithoutSupportTicketInput = {
    where: Prisma.MessageScalarWhereInput;
    data: Prisma.XOR<Prisma.MessageUpdateManyMutationInput, Prisma.MessageUncheckedUpdateManyWithoutSupportTicketInput>;
};
export type MessageCreateManySenderInput = {
    id?: string;
    receiverId?: string | null;
    bookingId?: string | null;
    supportTicketId?: string | null;
    message: string;
    messageType?: string;
    isRead?: boolean;
    readAt?: Date | string | null;
    createdAt?: Date | string;
};
export type MessageCreateManyReceiverInput = {
    id?: string;
    senderId: string;
    bookingId?: string | null;
    supportTicketId?: string | null;
    message: string;
    messageType?: string;
    isRead?: boolean;
    readAt?: Date | string | null;
    createdAt?: Date | string;
};
export type MessageUpdateWithoutSenderInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    messageType?: Prisma.StringFieldUpdateOperationsInput | string;
    isRead?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    readAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    receiver?: Prisma.UserUpdateOneWithoutReceivedMessagesNestedInput;
    booking?: Prisma.BookingUpdateOneWithoutMessagesNestedInput;
    supportTicket?: Prisma.SupportTicketUpdateOneWithoutChatMessagesNestedInput;
};
export type MessageUncheckedUpdateWithoutSenderInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    receiverId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    supportTicketId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    messageType?: Prisma.StringFieldUpdateOperationsInput | string;
    isRead?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    readAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MessageUncheckedUpdateManyWithoutSenderInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    receiverId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    supportTicketId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    messageType?: Prisma.StringFieldUpdateOperationsInput | string;
    isRead?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    readAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MessageUpdateWithoutReceiverInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    messageType?: Prisma.StringFieldUpdateOperationsInput | string;
    isRead?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    readAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    sender?: Prisma.UserUpdateOneRequiredWithoutSentMessagesNestedInput;
    booking?: Prisma.BookingUpdateOneWithoutMessagesNestedInput;
    supportTicket?: Prisma.SupportTicketUpdateOneWithoutChatMessagesNestedInput;
};
export type MessageUncheckedUpdateWithoutReceiverInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    senderId?: Prisma.StringFieldUpdateOperationsInput | string;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    supportTicketId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    messageType?: Prisma.StringFieldUpdateOperationsInput | string;
    isRead?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    readAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MessageUncheckedUpdateManyWithoutReceiverInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    senderId?: Prisma.StringFieldUpdateOperationsInput | string;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    supportTicketId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    messageType?: Prisma.StringFieldUpdateOperationsInput | string;
    isRead?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    readAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MessageCreateManyBookingInput = {
    id?: string;
    senderId: string;
    receiverId?: string | null;
    supportTicketId?: string | null;
    message: string;
    messageType?: string;
    isRead?: boolean;
    readAt?: Date | string | null;
    createdAt?: Date | string;
};
export type MessageUpdateWithoutBookingInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    messageType?: Prisma.StringFieldUpdateOperationsInput | string;
    isRead?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    readAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    sender?: Prisma.UserUpdateOneRequiredWithoutSentMessagesNestedInput;
    receiver?: Prisma.UserUpdateOneWithoutReceivedMessagesNestedInput;
    supportTicket?: Prisma.SupportTicketUpdateOneWithoutChatMessagesNestedInput;
};
export type MessageUncheckedUpdateWithoutBookingInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    senderId?: Prisma.StringFieldUpdateOperationsInput | string;
    receiverId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    supportTicketId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    messageType?: Prisma.StringFieldUpdateOperationsInput | string;
    isRead?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    readAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MessageUncheckedUpdateManyWithoutBookingInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    senderId?: Prisma.StringFieldUpdateOperationsInput | string;
    receiverId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    supportTicketId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    messageType?: Prisma.StringFieldUpdateOperationsInput | string;
    isRead?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    readAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MessageCreateManySupportTicketInput = {
    id?: string;
    senderId: string;
    receiverId?: string | null;
    bookingId?: string | null;
    message: string;
    messageType?: string;
    isRead?: boolean;
    readAt?: Date | string | null;
    createdAt?: Date | string;
};
export type MessageUpdateWithoutSupportTicketInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    messageType?: Prisma.StringFieldUpdateOperationsInput | string;
    isRead?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    readAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    sender?: Prisma.UserUpdateOneRequiredWithoutSentMessagesNestedInput;
    receiver?: Prisma.UserUpdateOneWithoutReceivedMessagesNestedInput;
    booking?: Prisma.BookingUpdateOneWithoutMessagesNestedInput;
};
export type MessageUncheckedUpdateWithoutSupportTicketInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    senderId?: Prisma.StringFieldUpdateOperationsInput | string;
    receiverId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    messageType?: Prisma.StringFieldUpdateOperationsInput | string;
    isRead?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    readAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MessageUncheckedUpdateManyWithoutSupportTicketInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    senderId?: Prisma.StringFieldUpdateOperationsInput | string;
    receiverId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    bookingId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    message?: Prisma.StringFieldUpdateOperationsInput | string;
    messageType?: Prisma.StringFieldUpdateOperationsInput | string;
    isRead?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    readAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MessageSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    senderId?: boolean;
    receiverId?: boolean;
    bookingId?: boolean;
    supportTicketId?: boolean;
    message?: boolean;
    messageType?: boolean;
    isRead?: boolean;
    readAt?: boolean;
    createdAt?: boolean;
    sender?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    receiver?: boolean | Prisma.Message$receiverArgs<ExtArgs>;
    booking?: boolean | Prisma.Message$bookingArgs<ExtArgs>;
    supportTicket?: boolean | Prisma.Message$supportTicketArgs<ExtArgs>;
}, ExtArgs["result"]["message"]>;
export type MessageSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    senderId?: boolean;
    receiverId?: boolean;
    bookingId?: boolean;
    supportTicketId?: boolean;
    message?: boolean;
    messageType?: boolean;
    isRead?: boolean;
    readAt?: boolean;
    createdAt?: boolean;
    sender?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    receiver?: boolean | Prisma.Message$receiverArgs<ExtArgs>;
    booking?: boolean | Prisma.Message$bookingArgs<ExtArgs>;
    supportTicket?: boolean | Prisma.Message$supportTicketArgs<ExtArgs>;
}, ExtArgs["result"]["message"]>;
export type MessageSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    senderId?: boolean;
    receiverId?: boolean;
    bookingId?: boolean;
    supportTicketId?: boolean;
    message?: boolean;
    messageType?: boolean;
    isRead?: boolean;
    readAt?: boolean;
    createdAt?: boolean;
    sender?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    receiver?: boolean | Prisma.Message$receiverArgs<ExtArgs>;
    booking?: boolean | Prisma.Message$bookingArgs<ExtArgs>;
    supportTicket?: boolean | Prisma.Message$supportTicketArgs<ExtArgs>;
}, ExtArgs["result"]["message"]>;
export type MessageSelectScalar = {
    id?: boolean;
    senderId?: boolean;
    receiverId?: boolean;
    bookingId?: boolean;
    supportTicketId?: boolean;
    message?: boolean;
    messageType?: boolean;
    isRead?: boolean;
    readAt?: boolean;
    createdAt?: boolean;
};
export type MessageOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "senderId" | "receiverId" | "bookingId" | "supportTicketId" | "message" | "messageType" | "isRead" | "readAt" | "createdAt", ExtArgs["result"]["message"]>;
export type MessageInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    sender?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    receiver?: boolean | Prisma.Message$receiverArgs<ExtArgs>;
    booking?: boolean | Prisma.Message$bookingArgs<ExtArgs>;
    supportTicket?: boolean | Prisma.Message$supportTicketArgs<ExtArgs>;
};
export type MessageIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    sender?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    receiver?: boolean | Prisma.Message$receiverArgs<ExtArgs>;
    booking?: boolean | Prisma.Message$bookingArgs<ExtArgs>;
    supportTicket?: boolean | Prisma.Message$supportTicketArgs<ExtArgs>;
};
export type MessageIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    sender?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    receiver?: boolean | Prisma.Message$receiverArgs<ExtArgs>;
    booking?: boolean | Prisma.Message$bookingArgs<ExtArgs>;
    supportTicket?: boolean | Prisma.Message$supportTicketArgs<ExtArgs>;
};
export type $MessagePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Message";
    objects: {
        sender: Prisma.$UserPayload<ExtArgs>;
        receiver: Prisma.$UserPayload<ExtArgs> | null;
        booking: Prisma.$BookingPayload<ExtArgs> | null;
        supportTicket: Prisma.$SupportTicketPayload<ExtArgs> | null;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        senderId: string;
        receiverId: string | null;
        bookingId: string | null;
        supportTicketId: string | null;
        message: string;
        messageType: string;
        isRead: boolean;
        readAt: Date | null;
        createdAt: Date;
    }, ExtArgs["result"]["message"]>;
    composites: {};
};
export type MessageGetPayload<S extends boolean | null | undefined | MessageDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$MessagePayload, S>;
export type MessageCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<MessageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: MessageCountAggregateInputType | true;
};
export interface MessageDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Message'];
        meta: {
            name: 'Message';
        };
    };
    findUnique<T extends MessageFindUniqueArgs>(args: Prisma.SelectSubset<T, MessageFindUniqueArgs<ExtArgs>>): Prisma.Prisma__MessageClient<runtime.Types.Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends MessageFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, MessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__MessageClient<runtime.Types.Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends MessageFindFirstArgs>(args?: Prisma.SelectSubset<T, MessageFindFirstArgs<ExtArgs>>): Prisma.Prisma__MessageClient<runtime.Types.Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends MessageFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, MessageFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__MessageClient<runtime.Types.Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends MessageFindManyArgs>(args?: Prisma.SelectSubset<T, MessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends MessageCreateArgs>(args: Prisma.SelectSubset<T, MessageCreateArgs<ExtArgs>>): Prisma.Prisma__MessageClient<runtime.Types.Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends MessageCreateManyArgs>(args?: Prisma.SelectSubset<T, MessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends MessageCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, MessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends MessageDeleteArgs>(args: Prisma.SelectSubset<T, MessageDeleteArgs<ExtArgs>>): Prisma.Prisma__MessageClient<runtime.Types.Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends MessageUpdateArgs>(args: Prisma.SelectSubset<T, MessageUpdateArgs<ExtArgs>>): Prisma.Prisma__MessageClient<runtime.Types.Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends MessageDeleteManyArgs>(args?: Prisma.SelectSubset<T, MessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends MessageUpdateManyArgs>(args: Prisma.SelectSubset<T, MessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends MessageUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, MessageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends MessageUpsertArgs>(args: Prisma.SelectSubset<T, MessageUpsertArgs<ExtArgs>>): Prisma.Prisma__MessageClient<runtime.Types.Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends MessageCountArgs>(args?: Prisma.Subset<T, MessageCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], MessageCountAggregateOutputType> : number>;
    aggregate<T extends MessageAggregateArgs>(args: Prisma.Subset<T, MessageAggregateArgs>): Prisma.PrismaPromise<GetMessageAggregateType<T>>;
    groupBy<T extends MessageGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: MessageGroupByArgs['orderBy'];
    } : {
        orderBy?: MessageGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, MessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: MessageFieldRefs;
}
export interface Prisma__MessageClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    sender<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    receiver<T extends Prisma.Message$receiverArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Message$receiverArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    booking<T extends Prisma.Message$bookingArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Message$bookingArgs<ExtArgs>>): Prisma.Prisma__BookingClient<runtime.Types.Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    supportTicket<T extends Prisma.Message$supportTicketArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Message$supportTicketArgs<ExtArgs>>): Prisma.Prisma__SupportTicketClient<runtime.Types.Result.GetResult<Prisma.$SupportTicketPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface MessageFieldRefs {
    readonly id: Prisma.FieldRef<"Message", 'String'>;
    readonly senderId: Prisma.FieldRef<"Message", 'String'>;
    readonly receiverId: Prisma.FieldRef<"Message", 'String'>;
    readonly bookingId: Prisma.FieldRef<"Message", 'String'>;
    readonly supportTicketId: Prisma.FieldRef<"Message", 'String'>;
    readonly message: Prisma.FieldRef<"Message", 'String'>;
    readonly messageType: Prisma.FieldRef<"Message", 'String'>;
    readonly isRead: Prisma.FieldRef<"Message", 'Boolean'>;
    readonly readAt: Prisma.FieldRef<"Message", 'DateTime'>;
    readonly createdAt: Prisma.FieldRef<"Message", 'DateTime'>;
}
export type MessageFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageSelect<ExtArgs> | null;
    omit?: Prisma.MessageOmit<ExtArgs> | null;
    include?: Prisma.MessageInclude<ExtArgs> | null;
    where: Prisma.MessageWhereUniqueInput;
};
export type MessageFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageSelect<ExtArgs> | null;
    omit?: Prisma.MessageOmit<ExtArgs> | null;
    include?: Prisma.MessageInclude<ExtArgs> | null;
    where: Prisma.MessageWhereUniqueInput;
};
export type MessageFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageSelect<ExtArgs> | null;
    omit?: Prisma.MessageOmit<ExtArgs> | null;
    include?: Prisma.MessageInclude<ExtArgs> | null;
    where?: Prisma.MessageWhereInput;
    orderBy?: Prisma.MessageOrderByWithRelationInput | Prisma.MessageOrderByWithRelationInput[];
    cursor?: Prisma.MessageWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.MessageScalarFieldEnum | Prisma.MessageScalarFieldEnum[];
};
export type MessageFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageSelect<ExtArgs> | null;
    omit?: Prisma.MessageOmit<ExtArgs> | null;
    include?: Prisma.MessageInclude<ExtArgs> | null;
    where?: Prisma.MessageWhereInput;
    orderBy?: Prisma.MessageOrderByWithRelationInput | Prisma.MessageOrderByWithRelationInput[];
    cursor?: Prisma.MessageWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.MessageScalarFieldEnum | Prisma.MessageScalarFieldEnum[];
};
export type MessageFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageSelect<ExtArgs> | null;
    omit?: Prisma.MessageOmit<ExtArgs> | null;
    include?: Prisma.MessageInclude<ExtArgs> | null;
    where?: Prisma.MessageWhereInput;
    orderBy?: Prisma.MessageOrderByWithRelationInput | Prisma.MessageOrderByWithRelationInput[];
    cursor?: Prisma.MessageWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.MessageScalarFieldEnum | Prisma.MessageScalarFieldEnum[];
};
export type MessageCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageSelect<ExtArgs> | null;
    omit?: Prisma.MessageOmit<ExtArgs> | null;
    include?: Prisma.MessageInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.MessageCreateInput, Prisma.MessageUncheckedCreateInput>;
};
export type MessageCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.MessageCreateManyInput | Prisma.MessageCreateManyInput[];
    skipDuplicates?: boolean;
};
export type MessageCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.MessageOmit<ExtArgs> | null;
    data: Prisma.MessageCreateManyInput | Prisma.MessageCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.MessageIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type MessageUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageSelect<ExtArgs> | null;
    omit?: Prisma.MessageOmit<ExtArgs> | null;
    include?: Prisma.MessageInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.MessageUpdateInput, Prisma.MessageUncheckedUpdateInput>;
    where: Prisma.MessageWhereUniqueInput;
};
export type MessageUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.MessageUpdateManyMutationInput, Prisma.MessageUncheckedUpdateManyInput>;
    where?: Prisma.MessageWhereInput;
    limit?: number;
};
export type MessageUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.MessageOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.MessageUpdateManyMutationInput, Prisma.MessageUncheckedUpdateManyInput>;
    where?: Prisma.MessageWhereInput;
    limit?: number;
    include?: Prisma.MessageIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type MessageUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageSelect<ExtArgs> | null;
    omit?: Prisma.MessageOmit<ExtArgs> | null;
    include?: Prisma.MessageInclude<ExtArgs> | null;
    where: Prisma.MessageWhereUniqueInput;
    create: Prisma.XOR<Prisma.MessageCreateInput, Prisma.MessageUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.MessageUpdateInput, Prisma.MessageUncheckedUpdateInput>;
};
export type MessageDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageSelect<ExtArgs> | null;
    omit?: Prisma.MessageOmit<ExtArgs> | null;
    include?: Prisma.MessageInclude<ExtArgs> | null;
    where: Prisma.MessageWhereUniqueInput;
};
export type MessageDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MessageWhereInput;
    limit?: number;
};
export type Message$receiverArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserSelect<ExtArgs> | null;
    omit?: Prisma.UserOmit<ExtArgs> | null;
    include?: Prisma.UserInclude<ExtArgs> | null;
    where?: Prisma.UserWhereInput;
};
export type Message$bookingArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.BookingSelect<ExtArgs> | null;
    omit?: Prisma.BookingOmit<ExtArgs> | null;
    include?: Prisma.BookingInclude<ExtArgs> | null;
    where?: Prisma.BookingWhereInput;
};
export type Message$supportTicketArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.SupportTicketSelect<ExtArgs> | null;
    omit?: Prisma.SupportTicketOmit<ExtArgs> | null;
    include?: Prisma.SupportTicketInclude<ExtArgs> | null;
    where?: Prisma.SupportTicketWhereInput;
};
export type MessageDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MessageSelect<ExtArgs> | null;
    omit?: Prisma.MessageOmit<ExtArgs> | null;
    include?: Prisma.MessageInclude<ExtArgs> | null;
};
