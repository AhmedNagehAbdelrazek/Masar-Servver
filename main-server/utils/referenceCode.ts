import crypto from 'crypto';

const ALPHABET: string = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a short human-readable reference code, e.g. "MSR-7H2KQD".
 * @param prefix e.g. 'MSR' | 'TKT'
 * @returns "{PREFIX}-{6 chars}"
 */
export function generateReferenceCode(prefix: string): string {
  let code = '';
  const bytes: Buffer = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `${prefix}-${code}`;
}

const referenceCode = { generateReferenceCode };
export default referenceCode;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { generateReferenceCode };
  // @ts-ignore
  module.exports.generateReferenceCode = generateReferenceCode;
  // @ts-ignore
  module.exports.default = referenceCode;
}
