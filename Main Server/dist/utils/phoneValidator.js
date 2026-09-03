"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findByCountryCode = findByCountryCode;
exports.findByDialCode = findByDialCode;
exports.validatePhone = validatePhone;
const phoneCodes_1 = require("../config/phoneCodes");
function findByCountryCode(countryCode) {
    if (!countryCode)
        return null;
    const code = countryCode.toUpperCase();
    return phoneCodes_1.codes.find((c) => c.iso && c.iso['alpha-2'] === code) || null;
}
function findByDialCode(dialCode) {
    if (!dialCode)
        return null;
    const normalized = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
    return phoneCodes_1.codes.find((c) => c.phone.includes(normalized)) || null;
}
function validatePhone(countryCode, phone) {
    const country = findByCountryCode(countryCode);
    if (!country) {
        return { valid: false, error: 'Invalid country code' };
    }
    const dialCode = country.phone[0];
    const phoneLengths = Array.isArray(country.phoneLength) ? country.phoneLength : [country.phoneLength];
    // Strip any spaces, dashes, or dots from phone
    const cleanPhone = phone.replace(/[\s\-\.]/g, '');
    // Check if phone already includes the dial code
    let localNumber = cleanPhone;
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
    const fullPhone = `${dialCode}${localNumber}`;
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
exports.default = phoneValidator;
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
//# sourceMappingURL=phoneValidator.js.map