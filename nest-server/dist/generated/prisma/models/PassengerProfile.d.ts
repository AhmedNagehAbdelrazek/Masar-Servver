import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type PassengerProfileModel = runtime.Types.Result.DefaultSelection<Prisma.$PassengerProfilePayload>;
export type AggregatePassengerProfile = {
    _count: PassengerProfileCountAggregateOutputType | null;
    _min: PassengerProfileMinAggregateOutputType | null;
    _max: PassengerProfileMaxAggregateOutputType | null;
};
export type PassengerProfileMinAggregateOutputType = {
    id: string | null;
    passengerId: string | null;
    preferredGender: string | null;
    smokingPreference: string | null;
    nationalID: string | null;
    homeAddress: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type PassengerProfileMaxAggregateOutputType = {
    id: string | null;
    passengerId: string | null;
    preferredGender: string | null;
    smokingPreference: string | null;
    nationalID: string | null;
    homeAddress: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type PassengerProfileCountAggregateOutputType = {
    id: number;
    passengerId: number;
    preferredGender: number;
    smokingPreference: number;
    savedRoutes: number;
    nationalID: number;
    homeAddress: number;
    emergencyContacts: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type PassengerProfileMinAggregateInputType = {
    id?: true;
    passengerId?: true;
    preferredGender?: true;
    smokingPreference?: true;
    nationalID?: true;
    homeAddress?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type PassengerProfileMaxAggregateInputType = {
    id?: true;
    passengerId?: true;
    preferredGender?: true;
    smokingPreference?: true;
    nationalID?: true;
    homeAddress?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type PassengerProfileCountAggregateInputType = {
    id?: true;
    passengerId?: true;
    preferredGender?: true;
    smokingPreference?: true;
    savedRoutes?: true;
    nationalID?: true;
    homeAddress?: true;
    emergencyContacts?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type PassengerProfileAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PassengerProfileWhereInput;
    orderBy?: Prisma.PassengerProfileOrderByWithRelationInput | Prisma.PassengerProfileOrderByWithRelationInput[];
    cursor?: Prisma.PassengerProfileWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | PassengerProfileCountAggregateInputType;
    _min?: PassengerProfileMinAggregateInputType;
    _max?: PassengerProfileMaxAggregateInputType;
};
export type GetPassengerProfileAggregateType<T extends PassengerProfileAggregateArgs> = {
    [P in keyof T & keyof AggregatePassengerProfile]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregatePassengerProfile[P]> : Prisma.GetScalarType<T[P], AggregatePassengerProfile[P]>;
};
export type PassengerProfileGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PassengerProfileWhereInput;
    orderBy?: Prisma.PassengerProfileOrderByWithAggregationInput | Prisma.PassengerProfileOrderByWithAggregationInput[];
    by: Prisma.PassengerProfileScalarFieldEnum[] | Prisma.PassengerProfileScalarFieldEnum;
    having?: Prisma.PassengerProfileScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: PassengerProfileCountAggregateInputType | true;
    _min?: PassengerProfileMinAggregateInputType;
    _max?: PassengerProfileMaxAggregateInputType;
};
export type PassengerProfileGroupByOutputType = {
    id: string;
    passengerId: string;
    preferredGender: string | null;
    smokingPreference: string | null;
    savedRoutes: runtime.JsonValue | null;
    nationalID: string | null;
    homeAddress: string | null;
    emergencyContacts: runtime.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
    _count: PassengerProfileCountAggregateOutputType | null;
    _min: PassengerProfileMinAggregateOutputType | null;
    _max: PassengerProfileMaxAggregateOutputType | null;
};
export type GetPassengerProfileGroupByPayload<T extends PassengerProfileGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<PassengerProfileGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof PassengerProfileGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], PassengerProfileGroupByOutputType[P]> : Prisma.GetScalarType<T[P], PassengerProfileGroupByOutputType[P]>;
}>>;
export type PassengerProfileWhereInput = {
    AND?: Prisma.PassengerProfileWhereInput | Prisma.PassengerProfileWhereInput[];
    OR?: Prisma.PassengerProfileWhereInput[];
    NOT?: Prisma.PassengerProfileWhereInput | Prisma.PassengerProfileWhereInput[];
    id?: Prisma.UuidFilter<"PassengerProfile"> | string;
    passengerId?: Prisma.UuidFilter<"PassengerProfile"> | string;
    preferredGender?: Prisma.StringNullableFilter<"PassengerProfile"> | string | null;
    smokingPreference?: Prisma.StringNullableFilter<"PassengerProfile"> | string | null;
    savedRoutes?: Prisma.JsonNullableFilter<"PassengerProfile">;
    nationalID?: Prisma.StringNullableFilter<"PassengerProfile"> | string | null;
    homeAddress?: Prisma.StringNullableFilter<"PassengerProfile"> | string | null;
    emergencyContacts?: Prisma.JsonNullableFilter<"PassengerProfile">;
    createdAt?: Prisma.DateTimeFilter<"PassengerProfile"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"PassengerProfile"> | Date | string;
    passenger?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
};
export type PassengerProfileOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    passengerId?: Prisma.SortOrder;
    preferredGender?: Prisma.SortOrderInput | Prisma.SortOrder;
    smokingPreference?: Prisma.SortOrderInput | Prisma.SortOrder;
    savedRoutes?: Prisma.SortOrderInput | Prisma.SortOrder;
    nationalID?: Prisma.SortOrderInput | Prisma.SortOrder;
    homeAddress?: Prisma.SortOrderInput | Prisma.SortOrder;
    emergencyContacts?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    passenger?: Prisma.UserOrderByWithRelationInput;
};
export type PassengerProfileWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    passengerId?: string;
    AND?: Prisma.PassengerProfileWhereInput | Prisma.PassengerProfileWhereInput[];
    OR?: Prisma.PassengerProfileWhereInput[];
    NOT?: Prisma.PassengerProfileWhereInput | Prisma.PassengerProfileWhereInput[];
    preferredGender?: Prisma.StringNullableFilter<"PassengerProfile"> | string | null;
    smokingPreference?: Prisma.StringNullableFilter<"PassengerProfile"> | string | null;
    savedRoutes?: Prisma.JsonNullableFilter<"PassengerProfile">;
    nationalID?: Prisma.StringNullableFilter<"PassengerProfile"> | string | null;
    homeAddress?: Prisma.StringNullableFilter<"PassengerProfile"> | string | null;
    emergencyContacts?: Prisma.JsonNullableFilter<"PassengerProfile">;
    createdAt?: Prisma.DateTimeFilter<"PassengerProfile"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"PassengerProfile"> | Date | string;
    passenger?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
}, "id" | "passengerId">;
export type PassengerProfileOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    passengerId?: Prisma.SortOrder;
    preferredGender?: Prisma.SortOrderInput | Prisma.SortOrder;
    smokingPreference?: Prisma.SortOrderInput | Prisma.SortOrder;
    savedRoutes?: Prisma.SortOrderInput | Prisma.SortOrder;
    nationalID?: Prisma.SortOrderInput | Prisma.SortOrder;
    homeAddress?: Prisma.SortOrderInput | Prisma.SortOrder;
    emergencyContacts?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.PassengerProfileCountOrderByAggregateInput;
    _max?: Prisma.PassengerProfileMaxOrderByAggregateInput;
    _min?: Prisma.PassengerProfileMinOrderByAggregateInput;
};
export type PassengerProfileScalarWhereWithAggregatesInput = {
    AND?: Prisma.PassengerProfileScalarWhereWithAggregatesInput | Prisma.PassengerProfileScalarWhereWithAggregatesInput[];
    OR?: Prisma.PassengerProfileScalarWhereWithAggregatesInput[];
    NOT?: Prisma.PassengerProfileScalarWhereWithAggregatesInput | Prisma.PassengerProfileScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"PassengerProfile"> | string;
    passengerId?: Prisma.UuidWithAggregatesFilter<"PassengerProfile"> | string;
    preferredGender?: Prisma.StringNullableWithAggregatesFilter<"PassengerProfile"> | string | null;
    smokingPreference?: Prisma.StringNullableWithAggregatesFilter<"PassengerProfile"> | string | null;
    savedRoutes?: Prisma.JsonNullableWithAggregatesFilter<"PassengerProfile">;
    nationalID?: Prisma.StringNullableWithAggregatesFilter<"PassengerProfile"> | string | null;
    homeAddress?: Prisma.StringNullableWithAggregatesFilter<"PassengerProfile"> | string | null;
    emergencyContacts?: Prisma.JsonNullableWithAggregatesFilter<"PassengerProfile">;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"PassengerProfile"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"PassengerProfile"> | Date | string;
};
export type PassengerProfileCreateInput = {
    id?: string;
    preferredGender?: string | null;
    smokingPreference?: string | null;
    savedRoutes?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    nationalID?: string | null;
    homeAddress?: string | null;
    emergencyContacts?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    passenger: Prisma.UserCreateNestedOneWithoutPassengerProfileInput;
};
export type PassengerProfileUncheckedCreateInput = {
    id?: string;
    passengerId: string;
    preferredGender?: string | null;
    smokingPreference?: string | null;
    savedRoutes?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    nationalID?: string | null;
    homeAddress?: string | null;
    emergencyContacts?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type PassengerProfileUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    preferredGender?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    smokingPreference?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    savedRoutes?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    nationalID?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    homeAddress?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emergencyContacts?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    passenger?: Prisma.UserUpdateOneRequiredWithoutPassengerProfileNestedInput;
};
export type PassengerProfileUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    passengerId?: Prisma.StringFieldUpdateOperationsInput | string;
    preferredGender?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    smokingPreference?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    savedRoutes?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    nationalID?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    homeAddress?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emergencyContacts?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PassengerProfileCreateManyInput = {
    id?: string;
    passengerId: string;
    preferredGender?: string | null;
    smokingPreference?: string | null;
    savedRoutes?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    nationalID?: string | null;
    homeAddress?: string | null;
    emergencyContacts?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type PassengerProfileUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    preferredGender?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    smokingPreference?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    savedRoutes?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    nationalID?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    homeAddress?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emergencyContacts?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PassengerProfileUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    passengerId?: Prisma.StringFieldUpdateOperationsInput | string;
    preferredGender?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    smokingPreference?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    savedRoutes?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    nationalID?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    homeAddress?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emergencyContacts?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PassengerProfileNullableScalarRelationFilter = {
    is?: Prisma.PassengerProfileWhereInput | null;
    isNot?: Prisma.PassengerProfileWhereInput | null;
};
export type PassengerProfileCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    passengerId?: Prisma.SortOrder;
    preferredGender?: Prisma.SortOrder;
    smokingPreference?: Prisma.SortOrder;
    savedRoutes?: Prisma.SortOrder;
    nationalID?: Prisma.SortOrder;
    homeAddress?: Prisma.SortOrder;
    emergencyContacts?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type PassengerProfileMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    passengerId?: Prisma.SortOrder;
    preferredGender?: Prisma.SortOrder;
    smokingPreference?: Prisma.SortOrder;
    nationalID?: Prisma.SortOrder;
    homeAddress?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type PassengerProfileMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    passengerId?: Prisma.SortOrder;
    preferredGender?: Prisma.SortOrder;
    smokingPreference?: Prisma.SortOrder;
    nationalID?: Prisma.SortOrder;
    homeAddress?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type PassengerProfileCreateNestedOneWithoutPassengerInput = {
    create?: Prisma.XOR<Prisma.PassengerProfileCreateWithoutPassengerInput, Prisma.PassengerProfileUncheckedCreateWithoutPassengerInput>;
    connectOrCreate?: Prisma.PassengerProfileCreateOrConnectWithoutPassengerInput;
    connect?: Prisma.PassengerProfileWhereUniqueInput;
};
export type PassengerProfileUncheckedCreateNestedOneWithoutPassengerInput = {
    create?: Prisma.XOR<Prisma.PassengerProfileCreateWithoutPassengerInput, Prisma.PassengerProfileUncheckedCreateWithoutPassengerInput>;
    connectOrCreate?: Prisma.PassengerProfileCreateOrConnectWithoutPassengerInput;
    connect?: Prisma.PassengerProfileWhereUniqueInput;
};
export type PassengerProfileUpdateOneWithoutPassengerNestedInput = {
    create?: Prisma.XOR<Prisma.PassengerProfileCreateWithoutPassengerInput, Prisma.PassengerProfileUncheckedCreateWithoutPassengerInput>;
    connectOrCreate?: Prisma.PassengerProfileCreateOrConnectWithoutPassengerInput;
    upsert?: Prisma.PassengerProfileUpsertWithoutPassengerInput;
    disconnect?: Prisma.PassengerProfileWhereInput | boolean;
    delete?: Prisma.PassengerProfileWhereInput | boolean;
    connect?: Prisma.PassengerProfileWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.PassengerProfileUpdateToOneWithWhereWithoutPassengerInput, Prisma.PassengerProfileUpdateWithoutPassengerInput>, Prisma.PassengerProfileUncheckedUpdateWithoutPassengerInput>;
};
export type PassengerProfileUncheckedUpdateOneWithoutPassengerNestedInput = {
    create?: Prisma.XOR<Prisma.PassengerProfileCreateWithoutPassengerInput, Prisma.PassengerProfileUncheckedCreateWithoutPassengerInput>;
    connectOrCreate?: Prisma.PassengerProfileCreateOrConnectWithoutPassengerInput;
    upsert?: Prisma.PassengerProfileUpsertWithoutPassengerInput;
    disconnect?: Prisma.PassengerProfileWhereInput | boolean;
    delete?: Prisma.PassengerProfileWhereInput | boolean;
    connect?: Prisma.PassengerProfileWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.PassengerProfileUpdateToOneWithWhereWithoutPassengerInput, Prisma.PassengerProfileUpdateWithoutPassengerInput>, Prisma.PassengerProfileUncheckedUpdateWithoutPassengerInput>;
};
export type PassengerProfileCreateWithoutPassengerInput = {
    id?: string;
    preferredGender?: string | null;
    smokingPreference?: string | null;
    savedRoutes?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    nationalID?: string | null;
    homeAddress?: string | null;
    emergencyContacts?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type PassengerProfileUncheckedCreateWithoutPassengerInput = {
    id?: string;
    preferredGender?: string | null;
    smokingPreference?: string | null;
    savedRoutes?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    nationalID?: string | null;
    homeAddress?: string | null;
    emergencyContacts?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type PassengerProfileCreateOrConnectWithoutPassengerInput = {
    where: Prisma.PassengerProfileWhereUniqueInput;
    create: Prisma.XOR<Prisma.PassengerProfileCreateWithoutPassengerInput, Prisma.PassengerProfileUncheckedCreateWithoutPassengerInput>;
};
export type PassengerProfileUpsertWithoutPassengerInput = {
    update: Prisma.XOR<Prisma.PassengerProfileUpdateWithoutPassengerInput, Prisma.PassengerProfileUncheckedUpdateWithoutPassengerInput>;
    create: Prisma.XOR<Prisma.PassengerProfileCreateWithoutPassengerInput, Prisma.PassengerProfileUncheckedCreateWithoutPassengerInput>;
    where?: Prisma.PassengerProfileWhereInput;
};
export type PassengerProfileUpdateToOneWithWhereWithoutPassengerInput = {
    where?: Prisma.PassengerProfileWhereInput;
    data: Prisma.XOR<Prisma.PassengerProfileUpdateWithoutPassengerInput, Prisma.PassengerProfileUncheckedUpdateWithoutPassengerInput>;
};
export type PassengerProfileUpdateWithoutPassengerInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    preferredGender?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    smokingPreference?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    savedRoutes?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    nationalID?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    homeAddress?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emergencyContacts?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PassengerProfileUncheckedUpdateWithoutPassengerInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    preferredGender?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    smokingPreference?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    savedRoutes?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    nationalID?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    homeAddress?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    emergencyContacts?: Prisma.NullableJsonNullValueInput | runtime.InputJsonValue;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PassengerProfileSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    passengerId?: boolean;
    preferredGender?: boolean;
    smokingPreference?: boolean;
    savedRoutes?: boolean;
    nationalID?: boolean;
    homeAddress?: boolean;
    emergencyContacts?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    passenger?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["passengerProfile"]>;
export type PassengerProfileSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    passengerId?: boolean;
    preferredGender?: boolean;
    smokingPreference?: boolean;
    savedRoutes?: boolean;
    nationalID?: boolean;
    homeAddress?: boolean;
    emergencyContacts?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    passenger?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["passengerProfile"]>;
export type PassengerProfileSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    passengerId?: boolean;
    preferredGender?: boolean;
    smokingPreference?: boolean;
    savedRoutes?: boolean;
    nationalID?: boolean;
    homeAddress?: boolean;
    emergencyContacts?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    passenger?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["passengerProfile"]>;
export type PassengerProfileSelectScalar = {
    id?: boolean;
    passengerId?: boolean;
    preferredGender?: boolean;
    smokingPreference?: boolean;
    savedRoutes?: boolean;
    nationalID?: boolean;
    homeAddress?: boolean;
    emergencyContacts?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type PassengerProfileOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "passengerId" | "preferredGender" | "smokingPreference" | "savedRoutes" | "nationalID" | "homeAddress" | "emergencyContacts" | "createdAt" | "updatedAt", ExtArgs["result"]["passengerProfile"]>;
export type PassengerProfileInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    passenger?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type PassengerProfileIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    passenger?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type PassengerProfileIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    passenger?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type $PassengerProfilePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "PassengerProfile";
    objects: {
        passenger: Prisma.$UserPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        passengerId: string;
        preferredGender: string | null;
        smokingPreference: string | null;
        savedRoutes: runtime.JsonValue | null;
        nationalID: string | null;
        homeAddress: string | null;
        emergencyContacts: runtime.JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["passengerProfile"]>;
    composites: {};
};
export type PassengerProfileGetPayload<S extends boolean | null | undefined | PassengerProfileDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$PassengerProfilePayload, S>;
export type PassengerProfileCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<PassengerProfileFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: PassengerProfileCountAggregateInputType | true;
};
export interface PassengerProfileDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['PassengerProfile'];
        meta: {
            name: 'PassengerProfile';
        };
    };
    findUnique<T extends PassengerProfileFindUniqueArgs>(args: Prisma.SelectSubset<T, PassengerProfileFindUniqueArgs<ExtArgs>>): Prisma.Prisma__PassengerProfileClient<runtime.Types.Result.GetResult<Prisma.$PassengerProfilePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends PassengerProfileFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, PassengerProfileFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__PassengerProfileClient<runtime.Types.Result.GetResult<Prisma.$PassengerProfilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends PassengerProfileFindFirstArgs>(args?: Prisma.SelectSubset<T, PassengerProfileFindFirstArgs<ExtArgs>>): Prisma.Prisma__PassengerProfileClient<runtime.Types.Result.GetResult<Prisma.$PassengerProfilePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends PassengerProfileFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, PassengerProfileFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__PassengerProfileClient<runtime.Types.Result.GetResult<Prisma.$PassengerProfilePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends PassengerProfileFindManyArgs>(args?: Prisma.SelectSubset<T, PassengerProfileFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PassengerProfilePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends PassengerProfileCreateArgs>(args: Prisma.SelectSubset<T, PassengerProfileCreateArgs<ExtArgs>>): Prisma.Prisma__PassengerProfileClient<runtime.Types.Result.GetResult<Prisma.$PassengerProfilePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends PassengerProfileCreateManyArgs>(args?: Prisma.SelectSubset<T, PassengerProfileCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends PassengerProfileCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, PassengerProfileCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PassengerProfilePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends PassengerProfileDeleteArgs>(args: Prisma.SelectSubset<T, PassengerProfileDeleteArgs<ExtArgs>>): Prisma.Prisma__PassengerProfileClient<runtime.Types.Result.GetResult<Prisma.$PassengerProfilePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends PassengerProfileUpdateArgs>(args: Prisma.SelectSubset<T, PassengerProfileUpdateArgs<ExtArgs>>): Prisma.Prisma__PassengerProfileClient<runtime.Types.Result.GetResult<Prisma.$PassengerProfilePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends PassengerProfileDeleteManyArgs>(args?: Prisma.SelectSubset<T, PassengerProfileDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends PassengerProfileUpdateManyArgs>(args: Prisma.SelectSubset<T, PassengerProfileUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends PassengerProfileUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, PassengerProfileUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PassengerProfilePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends PassengerProfileUpsertArgs>(args: Prisma.SelectSubset<T, PassengerProfileUpsertArgs<ExtArgs>>): Prisma.Prisma__PassengerProfileClient<runtime.Types.Result.GetResult<Prisma.$PassengerProfilePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends PassengerProfileCountArgs>(args?: Prisma.Subset<T, PassengerProfileCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], PassengerProfileCountAggregateOutputType> : number>;
    aggregate<T extends PassengerProfileAggregateArgs>(args: Prisma.Subset<T, PassengerProfileAggregateArgs>): Prisma.PrismaPromise<GetPassengerProfileAggregateType<T>>;
    groupBy<T extends PassengerProfileGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: PassengerProfileGroupByArgs['orderBy'];
    } : {
        orderBy?: PassengerProfileGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, PassengerProfileGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPassengerProfileGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: PassengerProfileFieldRefs;
}
export interface Prisma__PassengerProfileClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    passenger<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface PassengerProfileFieldRefs {
    readonly id: Prisma.FieldRef<"PassengerProfile", 'String'>;
    readonly passengerId: Prisma.FieldRef<"PassengerProfile", 'String'>;
    readonly preferredGender: Prisma.FieldRef<"PassengerProfile", 'String'>;
    readonly smokingPreference: Prisma.FieldRef<"PassengerProfile", 'String'>;
    readonly savedRoutes: Prisma.FieldRef<"PassengerProfile", 'Json'>;
    readonly nationalID: Prisma.FieldRef<"PassengerProfile", 'String'>;
    readonly homeAddress: Prisma.FieldRef<"PassengerProfile", 'String'>;
    readonly emergencyContacts: Prisma.FieldRef<"PassengerProfile", 'Json'>;
    readonly createdAt: Prisma.FieldRef<"PassengerProfile", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"PassengerProfile", 'DateTime'>;
}
export type PassengerProfileFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PassengerProfileSelect<ExtArgs> | null;
    omit?: Prisma.PassengerProfileOmit<ExtArgs> | null;
    include?: Prisma.PassengerProfileInclude<ExtArgs> | null;
    where: Prisma.PassengerProfileWhereUniqueInput;
};
export type PassengerProfileFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PassengerProfileSelect<ExtArgs> | null;
    omit?: Prisma.PassengerProfileOmit<ExtArgs> | null;
    include?: Prisma.PassengerProfileInclude<ExtArgs> | null;
    where: Prisma.PassengerProfileWhereUniqueInput;
};
export type PassengerProfileFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PassengerProfileSelect<ExtArgs> | null;
    omit?: Prisma.PassengerProfileOmit<ExtArgs> | null;
    include?: Prisma.PassengerProfileInclude<ExtArgs> | null;
    where?: Prisma.PassengerProfileWhereInput;
    orderBy?: Prisma.PassengerProfileOrderByWithRelationInput | Prisma.PassengerProfileOrderByWithRelationInput[];
    cursor?: Prisma.PassengerProfileWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PassengerProfileScalarFieldEnum | Prisma.PassengerProfileScalarFieldEnum[];
};
export type PassengerProfileFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PassengerProfileSelect<ExtArgs> | null;
    omit?: Prisma.PassengerProfileOmit<ExtArgs> | null;
    include?: Prisma.PassengerProfileInclude<ExtArgs> | null;
    where?: Prisma.PassengerProfileWhereInput;
    orderBy?: Prisma.PassengerProfileOrderByWithRelationInput | Prisma.PassengerProfileOrderByWithRelationInput[];
    cursor?: Prisma.PassengerProfileWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PassengerProfileScalarFieldEnum | Prisma.PassengerProfileScalarFieldEnum[];
};
export type PassengerProfileFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PassengerProfileSelect<ExtArgs> | null;
    omit?: Prisma.PassengerProfileOmit<ExtArgs> | null;
    include?: Prisma.PassengerProfileInclude<ExtArgs> | null;
    where?: Prisma.PassengerProfileWhereInput;
    orderBy?: Prisma.PassengerProfileOrderByWithRelationInput | Prisma.PassengerProfileOrderByWithRelationInput[];
    cursor?: Prisma.PassengerProfileWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PassengerProfileScalarFieldEnum | Prisma.PassengerProfileScalarFieldEnum[];
};
export type PassengerProfileCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PassengerProfileSelect<ExtArgs> | null;
    omit?: Prisma.PassengerProfileOmit<ExtArgs> | null;
    include?: Prisma.PassengerProfileInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PassengerProfileCreateInput, Prisma.PassengerProfileUncheckedCreateInput>;
};
export type PassengerProfileCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.PassengerProfileCreateManyInput | Prisma.PassengerProfileCreateManyInput[];
    skipDuplicates?: boolean;
};
export type PassengerProfileCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PassengerProfileSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.PassengerProfileOmit<ExtArgs> | null;
    data: Prisma.PassengerProfileCreateManyInput | Prisma.PassengerProfileCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.PassengerProfileIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type PassengerProfileUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PassengerProfileSelect<ExtArgs> | null;
    omit?: Prisma.PassengerProfileOmit<ExtArgs> | null;
    include?: Prisma.PassengerProfileInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PassengerProfileUpdateInput, Prisma.PassengerProfileUncheckedUpdateInput>;
    where: Prisma.PassengerProfileWhereUniqueInput;
};
export type PassengerProfileUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.PassengerProfileUpdateManyMutationInput, Prisma.PassengerProfileUncheckedUpdateManyInput>;
    where?: Prisma.PassengerProfileWhereInput;
    limit?: number;
};
export type PassengerProfileUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PassengerProfileSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.PassengerProfileOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PassengerProfileUpdateManyMutationInput, Prisma.PassengerProfileUncheckedUpdateManyInput>;
    where?: Prisma.PassengerProfileWhereInput;
    limit?: number;
    include?: Prisma.PassengerProfileIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type PassengerProfileUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PassengerProfileSelect<ExtArgs> | null;
    omit?: Prisma.PassengerProfileOmit<ExtArgs> | null;
    include?: Prisma.PassengerProfileInclude<ExtArgs> | null;
    where: Prisma.PassengerProfileWhereUniqueInput;
    create: Prisma.XOR<Prisma.PassengerProfileCreateInput, Prisma.PassengerProfileUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.PassengerProfileUpdateInput, Prisma.PassengerProfileUncheckedUpdateInput>;
};
export type PassengerProfileDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PassengerProfileSelect<ExtArgs> | null;
    omit?: Prisma.PassengerProfileOmit<ExtArgs> | null;
    include?: Prisma.PassengerProfileInclude<ExtArgs> | null;
    where: Prisma.PassengerProfileWhereUniqueInput;
};
export type PassengerProfileDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PassengerProfileWhereInput;
    limit?: number;
};
export type PassengerProfileDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PassengerProfileSelect<ExtArgs> | null;
    omit?: Prisma.PassengerProfileOmit<ExtArgs> | null;
    include?: Prisma.PassengerProfileInclude<ExtArgs> | null;
};
