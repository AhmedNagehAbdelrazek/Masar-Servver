const phoneCodes = require('../config/phoneCodes');

function findByCountryCode(countryCode) {
  if (!countryCode) return null;
  const code = countryCode.toUpperCase();
  return phoneCodes.find((c) => c.iso && c.iso['alpha-2'] === code) || null;
}

function findByDialCode(dialCode) {
  if (!dialCode) return null;
  const normalized = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  return phoneCodes.find((c) => c.phone.includes(normalized)) || null;
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

  // Return full phone with dial code (no + prefix, stored clean)
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

module.exports = { findByCountryCode, findByDialCode, validatePhone };
