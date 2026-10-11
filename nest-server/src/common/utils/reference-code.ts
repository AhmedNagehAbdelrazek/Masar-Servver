import { randomBytes } from 'node:crypto';

// Port of Main Server/utils/referenceCode.ts generateReferenceCode(prefix):
// PREFIX-{6 chars from unambiguous alphabet}.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateReferenceCode(prefix: string): string {
  const bytes = randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[(bytes[i] as number) % ALPHABET.length];
  }
  return `${prefix}-${code}`;
}
