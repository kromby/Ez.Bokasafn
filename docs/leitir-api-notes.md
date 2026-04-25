# leitir.is API notes

Reverse-engineered from live network traffic on `www.leitir.is` (Ex Libris Primo / Alma — Icelandic library consortium discovery layer).

## Identifiers

- **Institution:** `354ILC_NETWORK`
- **View ID:** `354ILC_NETWORK:10000_UNION`
- **Scope** (library/collection filter, e.g. `10000_MYLIB`) — list the available scopes for a view via:
  ```
  GET /primaws/rest/pub/configuration/vid/354ILC_NETWORK:10000_UNION
  ```

## Auth

All `/primaws/` calls require `Authorization: Bearer <jwt>`.

### Get a guest JWT (anonymous)

```
GET https://www.leitir.is/primaws/rest/pub/institution/354ILC_NETWORK/guestJwt
    ?isGuest=true
    &lang=is
    &viewId=354ILC_NETWORK:10000_UNION
```

JWT decoded claims (observed):
- `userGroup: "GUEST"`
- `institution: "354ILC_NETWORK"`
- `userIp: <caller IP>` — may be enforced; if so, fetch from a stable origin or proxy through your backend
- `exp` ≈ 24 hours after `iat`

Cache and refresh before expiry.

## Endpoints

### 1. Autocomplete / suggest

```
GET /primaws/rest/pub/suggest
    ?q=<partial query>
    &scope=10000_MYLIB
    &vid=354ILC_NETWORK:10000_UNION
    &lang=is
```

**Response:**
```json
{
  "response": {
    "docs": [
      { "text": "hringana" },
      { "text": "hringavitleysa" },
      { "text": "hringadrottinssaga" },
      { "text": "hringadróttinssaga" }
    ]
  }
}
```

Notes:
- Flat list of strings under `response.docs[].text`, ~5 items max.
- Returns both unaccented and accented variants — useful, users skip diacritics.
- Empty `docs[]` for no matches; no special "too short" response.
- Live UI fires on every keystroke starting at 4 chars, with no debounce or cancellation. Recommended client behavior:
  - Trigger at 3–4 chars
  - Debounce 150–250 ms
  - Use `AbortController` to cancel stale in-flight requests

```js
const r = await fetch(
  `https://www.leitir.is/primaws/rest/pub/suggest?q=${encodeURIComponent(q)}` +
  `&scope=${scope}&vid=354ILC_NETWORK:10000_UNION&lang=is`,
  { headers: { Authorization: `Bearer ${jwt}` }, signal: ctrl.signal }
);
const { response: { docs } } = await r.json();
return docs.map(d => d.text);
```

### 2. Search (PNX)

```
GET /primaws/rest/pub/pnxs
    ?q=any,contains,<query>
    &inst=354ILC_NETWORK
    &scope=<library-scope>
    &vid=354ILC_NETWORK:10000_UNION
    &tab=MyLibrary
    &limit=10&offset=0
    &sort=rank
    &lang=is
```

**Response shape:**
```json
{
  "info": { "total": <n>, "totalResultsLocal": <n>, "totalResultsPC": <n>, "first": 1, "last": 10 },
  "docs": [ /* result records — each has an mms_id used for follow-up calls */ ],
  "did_u_mean": "<spelling correction>"
}
```

Each `doc` has an `mms_id` (e.g. `991009684239706886`) — that's the record key used for holdings/details.

### 3. Holdings / availability

For a search result set (delivers status across libraries):
```
POST /primaws/rest/pub/delivery?<same query params as pnxs>
```

For a single record (physical):
```
GET /primaws/rest/pub/getPhysicalService/<mmsId>
    ?vid=354ILC_NETWORK:10000_UNION
    &recordOwner=354ILC_NETWORK
    &sourceRecordId=<mmsId>
    &resource_type=book
```

Copy-level details (call number, due dates, location):
```
GET /primaws/rest/priv/ILSServices/titleServices/<svcId>
    ?lang=is
    &record-institution=354ILC_NETWORK
```
(`/priv/` still works with the guest JWT.)

### 4. Full record (PNX)

```
GET /primaws/rest/priv/nz/pnx/P/<mmsId>
    ?record-institution=354ILC_ALM
    &lang=is
```

### 5. Facets (sidebar filters — optional)

```
GET /primaws/rest/pub/facets?<same query params as pnxs>
```

## Endpoints to ignore

- `/ia4mrxc2-...` POSTs — Akamai bot manager beacons, do not reproduce.
- `beacon-eu.hosted.exlibrisgroup.com/boom/apache_pb.gif` — analytics pixels.
- `resourceRecommender`, `snippets`, `relatedItems`, `browse` — UI extras unless you want them.

## Cover thumbnails

The site tries a fallback chain. Working sources observed:
- `https://baekur.is/cover/tbn/<id>` (302 → image)
- `https://timarit.is/cover/tbn/<id>` (often 404; sometimes 200)
- `https://proxy-euf.hosted.exlibrisgroup.com/exl_rewrite/syndetics.com/index.php?client=primo&isbn=<isbn>/sc.jpg` — Syndetics via Ex Libris proxy (reliable when ISBN is known)

`thumbs.leitir.is/<id>.jpg` is blocked by ORB from cross-origin contexts.

## Caveats before building

- **Terms of use / rate limits** — Ex Libris Primo APIs are vendor-owned. Check whether Landsbókasafn permits third-party clients hitting `leitir.is`. Ex Libris also publishes an official documented API at `api-eu.hosted.exlibrisgroup.com` that may be the proper path.
- **JWT IP binding** — token's `userIp` claim may be enforced; plan a backend proxy for stable origin.
- **CORS** — calling `leitir.is` from a browser on another origin will be blocked. Backend proxy required.
- **i18n / accents** — accept and normalize both accented and unaccented Icelandic input; the suggest endpoint returns both forms.
