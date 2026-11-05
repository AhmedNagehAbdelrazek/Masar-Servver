/**
 * Mask a phone number so only the trailing digits are visible.
 * Example: "+962791111111" -> "+96279***1111"
 */
export function maskPhone(phone: string | number | null | undefined): string | null {
  if (!phone) return null;
  const str: string = String(phone).trim();
  if (str.length <= 7) return '***';
  return `${str.slice(0, str.length - 7)}***${str.slice(-4)}`;
}

/**
 * Mask a national ID keeping only the first and last three characters.
 * Example: "1234567890" -> "123***890"
 */
export function maskNationalId(id: string | number | null | undefined): string | null {
  if (!id) return null;
  const str: string = String(id).trim();
  if (str.length <= 6) return '***';
  return `${str.slice(0, 3)}***${str.slice(-3)}`;
}

const masking = { maskPhone, maskNationalId };
export default masking;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { maskPhone, maskNationalId };
  // @ts-ignore
  module.exports.maskPhone = maskPhone;
  // @ts-ignore
  module.exports.maskNationalId = maskNationalId;
  // @ts-ignore
  module.exports.default = masking;
}
