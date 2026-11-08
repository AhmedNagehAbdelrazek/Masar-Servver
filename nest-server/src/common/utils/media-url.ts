const ABSOLUTE_URL = /^[a-z][a-z0-9+.-]*:\/\//i;
const SCHEMELESS_HOST = /^[a-z0-9.-]+\.[a-z]{2,}(?::\d+)?(\/|$)/i;

function normalizeBase(value: string): string {
  const base = String(value || '').trim();
  if (!base) return '';
  if (base.startsWith('//')) return `https:${base}`;
  if (ABSOLUTE_URL.test(base)) return base.replace(/\/+$/, '');
  return `https://${base.replace(/^\/+/, '').replace(/\/+$/, '')}`;
}

function publicBase(): string {
  return normalizeBase(process.env.PUBLIC_BASE_URL || process.env.API_PUBLIC_URL || '');
}

function rewriteS3PublicUrl(value: string): string {
  const endpoint = normalizeBase(process.env.S3_ENDPOINT || '');
  const bucket = String(process.env.S3_BUCKET || '').trim();
  const base = normalizeBase(process.env.S3_PUBLIC_URL || process.env.S3_BASE_URL || '');
  if (!endpoint || !bucket || !base) return value;
  const prefix = `${endpoint}/${bucket}/`;
  if (value.startsWith(prefix)) return `${base}/${value.slice(prefix.length)}`;
  return value;
}

/**
 * Mirrors main-server/utils/mediaUrl.ts: preserve absolute S3/Garage/Cloudinary
 * URLs, repair protocol-relative/schemeless values, rewrite old path-style S3
 * endpoint URLs to the public web host, and make `/uploads/...` absolute when
 * PUBLIC_BASE_URL is configured.
 */
export function toAbsoluteMediaUrl(url: string | null | undefined): string | null {
  if (url == null || url === '') return null;
  const value = String(url).trim();
  if (value.startsWith('//')) return rewriteS3PublicUrl(`https:${value}`);
  if (ABSOLUTE_URL.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
    return rewriteS3PublicUrl(value);
  }
  if (SCHEMELESS_HOST.test(value)) return rewriteS3PublicUrl(`https://${value}`);
  const base = publicBase();
  if (!base) return value;
  return `${base}/${value.replace(/^\/+/, '')}`;
}
