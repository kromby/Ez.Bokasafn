const TOKEN = import.meta.env.VITE_CF_WA_TOKEN as string | undefined;

export function maybeInjectCfWebAnalytics(): void {
  if (!import.meta.env.PROD) return;
  if (!TOKEN) return;
  if (typeof document === 'undefined') return;
  if (document.getElementById('cf-wa')) return;

  const script = document.createElement('script');
  script.id = 'cf-wa';
  script.defer = true;
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.dataset.cfBeacon = JSON.stringify({ token: TOKEN });
  document.head.appendChild(script);
}
