export declare class PhoneDto {
    phone: string;
}
export declare class ResendOtpDto extends PhoneDto {
    purpose: 'register' | 'forgot_password';
}
export declare class RefreshDto {
    refresh_token: string;
}
export declare class LogoutDto {
    refresh_token?: string;
}
