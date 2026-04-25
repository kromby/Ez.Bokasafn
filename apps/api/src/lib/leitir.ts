import { getJwt } from './jwtCache.js';
import { HttpError } from './errors.js';

const BASE = () => process.env.LEITIR_BASE_URL ?? 'https://www.leitir.is';
const VID = () => process.env.LEITIR_VID ?? '354ILC_NETWORK:10000_UNION';
const INST = () => process.env.LEITIR_INST ?? '354ILC_NETWORK';

async function authedJson(url: string, init: RequestInit = {}): Promise<any> {
  const jwt = await getJwt();
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${jwt}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`[leitir] ${init.method || 'GET'} -> ${res.status}: ${body.substring(0, 200)}`);
    throw new HttpError(res.status, `Upstream ${res.status}`);
  }
  return res.json();
}

export interface SuggestRaw { text: string }

export async function suggest(q: string, scope: string): Promise<SuggestRaw[]> {
  const url =
    `${BASE()}/primaws/rest/pub/suggest` +
    `?q=${encodeURIComponent(q)}&scope=${encodeURIComponent(scope)}` +
    `&vid=${encodeURIComponent(VID())}&lang=is`;
  const data = await authedJson(url);
  return (data?.response?.docs ?? []) as SuggestRaw[];
}

export interface PnxsRaw {
  info: { total: number; first?: number; last?: number };
  docs: any[];
  did_u_mean?: string;
}

export async function search(q: string, scope: string, offset: number): Promise<PnxsRaw> {
  const url =
    `${BASE()}/primaws/rest/pub/pnxs` +
    `?q=any,contains,${encodeURIComponent(q)}` +
    `&inst=${encodeURIComponent(INST())}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&vid=${encodeURIComponent(VID())}` +
    `&tab=MyLibrary&limit=20&offset=${offset}&sort=rank&lang=is`;
  return authedJson(url);
}

export async function delivery(q: string, scope: string, offset: number): Promise<any> {
  const url =
    `${BASE()}/primaws/rest/pub/delivery` +
    `?q=any,contains,${encodeURIComponent(q)}` +
    `&inst=${encodeURIComponent(INST())}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&vid=${encodeURIComponent(VID())}&lang=is&limit=20&offset=${offset}`;
  return authedJson(url);
}

export async function getPhysicalService(mmsId: string): Promise<any> {
  const url =
    `${BASE()}/primaws/rest/pub/getPhysicalService/${encodeURIComponent(mmsId)}` +
    `?vid=${encodeURIComponent(VID())}` +
    `&recordOwner=${encodeURIComponent(INST())}` +
    `&sourceRecordId=${encodeURIComponent(mmsId)}` +
    `&resource_type=book`;
  return authedJson(url);
}

export async function getFullRecord(mmsId: string): Promise<any> {
  const url =
    `${BASE()}/primaws/rest/priv/nz/pnx/P/${encodeURIComponent(mmsId)}` +
    `?record-institution=354ILC_ALM&lang=is`;
  return authedJson(url);
}
