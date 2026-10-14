export declare const PAYMENT_METHOD_TYPES: readonly ["bank_account", "e-wallet", "mobile_money"];
export declare class CreatePaymentMethodDto {
    name: string;
    account_number: string;
    type: (typeof PAYMENT_METHOD_TYPES)[number];
    email?: string | null;
}
export declare class UpdatePaymentMethodDto {
    name?: string;
    account_number?: string;
    type?: (typeof PAYMENT_METHOD_TYPES)[number];
    email?: string | null;
}
export declare class UuidMethodIdParam {
    method_id: string;
}
