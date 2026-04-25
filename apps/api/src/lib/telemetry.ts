import * as appInsights from 'applicationinsights';

let started = false;

export function initTelemetry(): void {
  if (started) return;
  if (!process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) return;
  appInsights
    .setup()
    .setAutoCollectConsole(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectRequests(true)
    .start();
  started = true;
}

export function trackEvent(name: string, properties: Record<string, string | number>): void {
  if (!started) return;
  const stringified = Object.fromEntries(
    Object.entries(properties).map(([k, v]) => [k, String(v)]),
  );
  appInsights.defaultClient?.trackEvent({ name, properties: stringified });
}
