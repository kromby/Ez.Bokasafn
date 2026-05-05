import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { search } from '../lib/leitir.js';
import { shapeSearch } from '../lib/shape.js';
import { assertAllowedOrigin } from '../lib/originCheck.js';
import { HttpError } from '../lib/errors.js';
import { initTelemetry, trackEvent } from '../lib/telemetry.js';
initTelemetry();

export async function searchHandler(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  try {
    assertAllowedOrigin(req);
    const q = req.query.get('q')?.trim();
    const lib = req.query.get('lib')?.trim();
    const offset = Math.max(0, Number(req.query.get('offset') ?? '0') || 0);
    if (!q || !lib) return { status: 400, jsonBody: { error: { message: 'missing q or lib' } } };

    const pnxs = await search(q, lib, offset);
    const shaped = shapeSearch(pnxs, { docs: [] });
    trackEvent('search_performed', { lib, qLength: q.length, total: shaped.total });
    return { jsonBody: shaped };
  } catch (e) {
    if (e instanceof HttpError) return { status: e.status, jsonBody: { error: { message: e.message } } };
    ctx.log('error', e);
    return { status: 502, jsonBody: { error: { message: 'upstream failure' } } };
  }
}

app.http('search', { route: 'search', methods: ['GET'], authLevel: 'anonymous', handler: searchHandler });
