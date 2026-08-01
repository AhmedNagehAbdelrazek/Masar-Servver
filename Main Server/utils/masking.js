/**
 * Mask a phone number so only the trailing digits are visible.
 * Example: "+962791111111" -> "+96279***1111"
 */
function maskPhone(phone) {
  if (!phone) return null;
  const str = String(phone).trim();
  if (str.length <= 7) return '***';
  return `${str.slice(0, str.length - 7)}***${str.slice(-4)}`;
}

/**
 * Mask a national ID keeping only the first and last three characters.
 * Example: "1234567890" -> "123***890"
 */
function maskNationalId(id) {
  if (!id) return null;
  const str = String(id).trim();
  if (str.length <= 6) return '***';
  return `${str.slice(0, 3)}***${str.slice(-3)}`;
}

module.exports = { maskPhone, maskNationalId };
