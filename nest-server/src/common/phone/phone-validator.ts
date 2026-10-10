// Port of Main Server/utils/phoneValidator.ts (logic verbatim; types kept).
import { codes, type PhoneCode } from './phoneCodes.js';

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

export function findByCountryCode(countryCode: string | null | undefined): PhoneCode | null {
  if (!countryCode) return null;
  const code = countryCode.toUpperCase();
  return codes.find((c) => c.iso && c.iso['alpha-2'] === code) || null;
}

export function findByDialCode(dialCode: string | null | undefined): PhoneCode | null {
  if (!dialCode) return null;
  const normalized = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  return codes.find((c) => c.phone.includes(normalized)) || null;
}

export function validatePhone(countryCode: string, phone: string): PhoneValidationResult {
  const country = findByCountryCode(countryCode);
  if (!country) return { valid: false, error: 'Invalid country code' };

  const dialCode = country.phone[0];
  const phoneLengths = Array.isArray(country.phoneLength)
    ? (country.phoneLength as number[])
    : [country.phoneLength as number];

  const cleanPhone = phone.replace(/[\s\-.]/g, '');
  let localNumber = cleanPhone;
  if (cleanPhone.startsWith(dialCode.replace(/\s/g, ''))) {
    localNumber = cleanPhone.slice(dialCode.replace(/\s/g, '').length);
  }
  if (!/^\d+$/.test(localNumber)) {
    return { valid: false, error: 'Phone number must contain only digits' };
  }
  if (!phoneLengths.includes(localNumber.length)) {
    return {
      valid: false,
      error: `Phone number must be ${phoneLengths.join(' or ')} digits for ${country.name}`,
    };
  }
  return {
    valid: true,
    fullPhone: `${dialCode}${localNumber}`,
    dialCode,
    localNumber,
    countryCode: country.iso['alpha-2'],
    countryName: country.name,
  };
}
