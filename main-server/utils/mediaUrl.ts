const ABSOLUTE_URL = /^[a-z][a-z0-9+.-]*:\/\//i;
const SCHEMELESS_HOST = /^[a-z0-9.-]+\.[a-z]{2,}(?::\d+)?(\/|$)/i;

function normalizeBase(value: string): string {
  const base = String(value || '').trim();
  if (!base) return '';
  if (base.startsWith('//')) return `https:${base}`;
  if (ABSOLUTE_URL.test(base)) return base.replace(/\/+$/, '');
  // S3_BASE_URL is often entered as a bare host (bucket alias).
  return `https://${base.replace(/^\/+/, '').replace(/\/+$/, '')}`;
}

function publicBase(): string {
  const configured =
    process.env.PUBLIC_BASE_URL ||
    process.env.API_PUBLIC_URL ||
    process.env.LOCAL_UPLOAD_BASE_URL ||
    '';
  return normalizeBase(configured);
}

function rewriteS3PublicUrl(value: string): string {
  const endpoint = normalizeBase(process.env.S3_ENDPOINT || '');
  const bucket = String(process.env.S3_BUCKET || '').trim();
  const publicBase = normalizeBase(process.env.S3_PUBLIC_URL || process.env.S3_BASE_URL || '');
  if (!endpoint || !bucket || !publicBase) return value;
  // Path-style S3/Garage values stored before S3_BASE_URL was configured:
  // https://s3-host/<bucket>/uploads/x.jpg -> https://web-host/uploads/x.jpg
  const prefix = `${endpoint}/${bucket}/`;
  if (value.startsWith(prefix)) return `${publicBase}/${value.slice(prefix.length)}`;
  return value;
}

/**
 * Uploaded assets are persisted as either absolute provider URLs (Cloudinary,
 * S3, Garage), protocol-relative URLs, schemeless public hosts, or relative
 * paths (`/uploads/<file>`). Absolute/cross-origin values must pass through
 * unchanged: the S3/Garage public host is different from both API hosts.
 * Relative paths are prefixed with the origin that actually serves `/uploads`.
 */
export function toAbsoluteMediaUrl(url: string | null | undefined, base: string = publicBase()): string | null {
  if (url == null || url === '') return null;
  const value = String(url).trim();
  if (value.startsWith('//')) return rewriteS3PublicUrl(`https:${value}`);
  if (ABSOLUTE_URL.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
    return rewriteS3PublicUrl(value);
  }
  // A schemeless S3/Garage value such as `web-bucket.example.com/uploads/x.jpg`
  // is an absolute public URL missing only the scheme.
  if (SCHEMELESS_HOST.test(value)) return rewriteS3PublicUrl(`https://${value}`);
  const normalizedBase = normalizeBase(base);
  if (!normalizedBase) return value;
  return `${normalizedBase}/${value.replace(/^\/+/, '')}`;
}

export default toAbsoluteMediaUrl;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = toAbsoluteMediaUrl;
  // @ts-ignore
  module.exports.toAbsoluteMediaUrl = toAbsoluteMediaUrl;
  // @ts-ignore
  module.exports.default = toAbsoluteMediaUrl;
}
