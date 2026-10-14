import { type PhoneCode } from './phoneCodes.js';
export interface PhoneValidationSuccess {
    valid: true;
    fullPhone: string;
    dialCode: string;
    localNumber: string;
    countryCode: string;
    countryName: string;
}
export interface PhoneValidationFailure {
    valid: false;
    error: string;
}
export type PhoneValidationResult = PhoneValidationSuccess | PhoneValidationFailure;
export declare function findByCountryCode(countryCode: string | null | undefined): PhoneCode | null;
export declare function findByDialCode(dialCode: string | null | undefined): PhoneCode | null;
export declare function validatePhone(countryCode: string, phone: string): PhoneValidationResult;
