export interface PhoneCodeIso {
    'alpha-2': string;
    'alpha-3': string;
    numeric: string;
}
export interface PhoneCode {
    name: string;
    region: string;
    timezones: Record<string, string>;
    iso: PhoneCodeIso;
    phone: string[];
    emoji: string;
    image: string;
    phoneLength?: number | number[];
}
export declare const codes: PhoneCode[];
export type Codes = typeof codes;
export default codes;
