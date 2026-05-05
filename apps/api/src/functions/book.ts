import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getFullRecord, getPhysicalService } from '../lib/leitir.js';
import { shapeBook } from '../lib/shape.js';
import { assertAllowedOrigin } from '../lib/originCheck.js';
import { HttpError } from '../lib/errors.js';
import { initTelemetry, trackEvent } from '../lib/telemetry.js';
initTelemetry();

export async function bookHandler(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  try {
    assertAllowedOrigin(req);
    let mmsId = req.params?.mmsId?.trim();
    const lib = req.query.get('lib')?.trim();
    if (!mmsId) return { status: 400, jsonBody: { error: { message: 'missing mmsId' } } };

    mmsId = mmsId.replace(/^alma/, '');

    const [pnxDoc, physical] = await Promise.all([getFullRecord(mmsId), getPhysicalService(mmsId)]);
    const shaped = shapeBook(pnxDoc, physical);
    trackEvent('book_detail_viewed', { mmsId, lib: lib ?? '' });
    return { jsonBody: shaped };
  } catch (e) {
    if (e instanceof HttpError) {
      return { status: e.status, jsonBody: { error: { message: e.message } } };
    }
    ctx.log('error', e);
    return { status: 502, jsonBody: { error: { message: 'upstream failure' } } };
  }
}

export default bookHandler;
