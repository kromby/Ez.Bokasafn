const REFRESH_THRESHOLD_MS = 30 * 60 * 1000;

let cachedToken: string | null = null;
let cachedExp = 0;
let inFlight: Promise<string> | null = null;

function decodeExp(jwt: string): number {
  const parts = jwt.split('.');
  if (parts.length < 2) throw new Error('Invalid JWT shape');
  const payload = JSON.parse(Buffer.from(parts[1]!, 'base64url').toString('utf8'));
  if (typeof payload.exp !== 'number') throw new Error('JWT missing exp');
  return payload.exp * 1000;
}

async function fetchFresh(reason: 'expiry' | 'auth-error' = 'expiry'): Promise<string> {
  const base = process.env.LEITIR_BASE_URL ?? 'https://www.leitir.is';
  const inst = process.env.LEITIR_INST ?? '354ILC_NETWORK';
  const vid = process.env.LEITIR_VID ?? '354ILC_NETWORK:10000_UNION';
  const url =
    `${base}/primaws/rest/pub/institution/${inst}/guestJwt` +
    `?isGuest=true&lang=is&viewId=${encodeURIComponent(vid)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`JWT fetch failed: ${res.status}`);
    const token = (await res.text()).trim().replace(/^"|"$/g, '');
    cachedToken = token;
    cachedExp = decodeExp(token);
    try {
      const { trackEvent } = await import('./telemetry.js');
      trackEvent('jwt_refreshed', { reason });
    } catch {}
    return token;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getJwt(): Promise<string> {
  const now = Date.now();
  const stale = !cachedToken || cachedExp - now < REFRESH_THRESHOLD_MS;
  if (!stale) return cachedToken!;
  if (inFlight) return inFlight;
  inFlight = fetchFresh().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** Test-only: reset module state. */
export function __resetJwtCacheForTests(): void {
  cachedToken = null;
  cachedExp = 0;
  inFlight = null;
}
