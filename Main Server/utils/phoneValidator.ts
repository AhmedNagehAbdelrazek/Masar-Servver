import { codes } from '../config/phoneCodes';
import type { PhoneCode } from '../config/phoneCodes';

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
  const code: string = countryCode.toUpperCase();
  return codes.find((c: PhoneCode) => c.iso && c.iso['alpha-2'] === code) || null;
}

export function findByDialCode(dialCode: string | null | undefined): PhoneCode | null {
  if (!dialCode) return null;
  const normalized: string = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  return codes.find((c: PhoneCode) => c.phone.includes(normalized)) || null;
}

export function validatePhone(countryCode: string, phone: string): PhoneValidationResult {
  const country: PhoneCode | null = findByCountryCode(countryCode);
  if (!country) {
    return { valid: false, error: 'Invalid country code' };
  }

  const dialCode: string = country.phone[0];
  const phoneLengths: number[] = Array.isArray(country.phoneLength) ? (country.phoneLength as number[]) : [country.phoneLength as number];

  // Strip any spaces, dashes, or dots from phone
  const cleanPhone: string = phone.replace(/[\s\-\.]/g, '');

  // Check if phone already includes the dial code
  let localNumber: string = cleanPhone;
  if (cleanPhone.startsWith(dialCode.replace(/\s/g, ''))) {
    localNumber = cleanPhone.slice(dialCode.replace(/\s/g, '').length);
  }

  // Validate local number is numeric
  if (!/^\d+$/.test(localNumber)) {
    return { valid: false, error: 'Phone number must contain only digits' };
  }

  // Validate length
  if (!phoneLengths.includes(localNumber.length)) {
    return {
      valid: false,
      error: `Phone number must be ${phoneLengths.join(' or ')} digits for ${country.name}`,
    };
  }

  // Return full phone with dial code (no + prefix stored clean? keep as is)
  const fullPhone: string = `${dialCode}${localNumber}`;

  return {
    valid: true,
    fullPhone,
    dialCode,
    localNumber,
    countryCode: country.iso['alpha-2'],
    countryName: country.name,
  };
}

const phoneValidator = { findByCountryCode, findByDialCode, validatePhone };
export default phoneValidator;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { findByCountryCode, findByDialCode, validatePhone };
  // @ts-ignore
  module.exports.findByCountryCode = findByCountryCode;
  // @ts-ignore
  module.exports.findByDialCode = findByDialCode;
  // @ts-ignore
  module.exports.validatePhone = validatePhone;
  // @ts-ignore
  module.exports.default = phoneValidator;
}
