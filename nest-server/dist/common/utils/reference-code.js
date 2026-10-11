import { randomBytes } from 'node:crypto';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function generateReferenceCode(prefix) {
    const bytes = randomBytes(6);
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += ALPHABET[bytes[i] % ALPHABET.length];
    }
    return `${prefix}-${code}`;
}
//# sourceMappingURL=reference-code.js.map