const crypto = require('crypto');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a short human-readable reference code, e.g. "MSR-7H2KQD".
 * @param {string} prefix e.g. 'MSR' | 'TKT'
 * @returns {string} "{PREFIX}-{6 chars}"
 */
function generateReferenceCode(prefix) {
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `${prefix}-${code}`;
}

module.exports = { generateReferenceCode };
