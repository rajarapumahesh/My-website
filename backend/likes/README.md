# Shared portfolio hearts

The static site stays on GitHub Pages. This small Cloudflare Worker keeps one
shared counter in SQLite-backed Durable Object storage. Successful first clicks
from distinct browser IDs each add one heart. Refreshes, retries, and repeated
clicks from the same browser do not add duplicates. No email addresses, names,
or IP addresses are stored. Clearing browser storage creates a new identity;
this is a lightweight appreciation counter, not verified unique-person analytics.

The implementation follows [Cloudflare's SQLite storage API](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/).

## Deploy and connect

Use a current Node version supported by Wrangler, then in this directory:

```sh
npm install
npx wrangler login
npm run deploy
```

Sign into your Cloudflare account. Deployment provisions the SQLite-backed
Durable Object namespace via `wrangler.jsonc`. Keep the name and migration tag
unchanged on subsequent deployments to preserve stored hearts.

Copy the deployed URL and append `/api/likes`, then set:

```js
// assets/js/likes-config.js
window.PORTFOLIO_LIKES = Object.freeze({
    endpoint: 'https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev/api/likes',
});
```

Publish the frontend change to GitHub Pages. No database secret belongs in the
frontend; the public URL is sufficient. The configured origin allowlist includes
the existing GitHub Pages origin and local previews on port 8000.

## API

- `GET /api/likes?visitorId=<UUID>` returns `{ "count": 123, "liked": false }`.
- `POST /api/likes` with JSON `{ "visitorId": "<UUID>" }` returns the persistent
  total and `liked: true`. Concurrent submissions are stored atomically; retries
  are idempotent.
- The frontend refreshes the total on load, focus, and every 30 seconds while
  visible. Failed writes show an error and do not pretend to increase the count.

Without an endpoint, the frontend explicitly labels browser-only local preview
hearts. Those historical local counts are not imported into the shared total.

## Local backend preview

Run `npm run dev`. The frontend's `localPreviewEndpoint` automatically connects
to `http://127.0.0.1:8787/api/likes` when opened at http://localhost:8000/ and no
public endpoint is set. The page labels this mode as a local shared preview.
Local persistence lives under `.wrangler/`; it is separate from deployed data.
