import { HttpError } from './errors.js';

interface MinimalReq {
  headers: { get(name: string): string | null };
}

export function assertAllowedOrigin(req: MinimalReq): void {
  const allowed = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  // If no allowed origins configured, allow all requests (for development/CI)
  if (allowed.length === 0) return;

  const originHeader = req.headers.get('origin') ?? req.headers.get('referer');
  if (!originHeader) throw new HttpError(403, 'Forbidden');

  // Extract origin from URL (handles both Origin and Referer formats)
  let requestOrigin: string;
  try {
    const url = new URL(originHeader);
    requestOrigin = url.origin; // e.g., "https://app.example.com"
  } catch {
    throw new HttpError(403, 'Forbidden');
  }

  if (!allowed.includes(requestOrigin)) {
    throw new HttpError(403, 'Forbidden');
  }
}
