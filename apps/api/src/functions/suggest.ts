import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { suggest } from '../lib/leitir.js';
import { shapeSuggest } from '../lib/shape.js';
import { assertAllowedOrigin } from '../lib/originCheck.js';
import { HttpError } from '../lib/errors.js';
import { initTelemetry } from '../lib/telemetry.js';
initTelemetry();

export async function suggestHandler(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  try {
    assertAllowedOrigin(req);
    const q = req.query.get('q')?.trim();
    const lib = req.query.get('lib')?.trim();
    if (!q || !lib) return { status: 400, jsonBody: { error: { message: 'missing q or lib' } } };

    const raw = await suggest(q, lib);
    const out = shapeSuggest(raw);
    return { jsonBody: out };
  } catch (e) {
    if (e instanceof HttpError) return { status: e.status, jsonBody: { error: { message: e.message } } };
    ctx.log('error', e);
    return { status: 502, jsonBody: { error: { message: 'upstream failure' } } };
  }
}

app.http('suggest', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'suggest',
  handler: suggestHandler
});
