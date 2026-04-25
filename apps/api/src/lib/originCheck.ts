import { HttpError } from './errors.js';

interface MinimalReq {
  headers: { get(name: string): string | null };
}

export function assertAllowedOrigin(req: MinimalReq): void {
  const allowed = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowed.length === 0) throw new HttpError(403, 'Forbidden');

  const origin = req.headers.get('origin') ?? req.headers.get('referer') ?? '';
  if (!origin) throw new HttpError(403, 'Forbidden');

  if (!allowed.some((a) => origin.startsWith(a))) {
    throw new HttpError(403, 'Forbidden');
  }
}
