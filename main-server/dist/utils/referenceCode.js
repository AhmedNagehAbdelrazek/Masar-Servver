"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReferenceCode = generateReferenceCode;
const crypto_1 = __importDefault(require("crypto"));
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/**
 * Generate a short human-readable reference code, e.g. "MSR-7H2KQD".
 * @param prefix e.g. 'MSR' | 'TKT'
 * @returns "{PREFIX}-{6 chars}"
 */
function generateReferenceCode(prefix) {
    let code = '';
    const bytes = crypto_1.default.randomBytes(6);
    for (let i = 0; i < 6; i++) {
        code += ALPHABET[bytes[i] % ALPHABET.length];
    }
    return `${prefix}-${code}`;
}
const referenceCode = { generateReferenceCode };
exports.default = referenceCode;
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
//# sourceMappingURL=referenceCode.js.map