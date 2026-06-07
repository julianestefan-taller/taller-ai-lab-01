<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Lab 01 — URL Shortener: Agent Context

## What this project is

A URL shortener. Two API routes:

- `POST /api/shorten` — accepts `{ url, custom_code? }`, returns `{ short_code, short_url, clicks }`
- `GET /[shortCode]` — redirects to the original URL with a 301 and increments a click counter

Persistence is Supabase. The DB layer is entirely in `src/lib/db.ts`.

## Rules for this codebase

### Never add `NEXT_PUBLIC_` to server env vars

`SUPABASE_URL` and `SUPABASE_ANON_KEY` must stay without `NEXT_PUBLIC_`. They are only used in `src/lib/db.ts`, which is server-only. Adding `NEXT_PUBLIC_` exposes credentials in the client bundle.

### Don't await `incrementClicks` in the redirect route

`incrementClicks` is intentionally fire-and-forget in `src/app/[shortCode]/route.ts`. Awaiting it would add DB latency to every redirect. If you add error handling here, do it without blocking the response.

### Click counting must use the Postgres stored procedure

`incrementClicks` must call `supabase.rpc('increment_clicks', { code: shortCode })`. Do not replace it with a read-then-write pattern — that has a race condition under concurrent requests.

## Key files

| File | Role |
|---|---|
| `src/lib/db.ts` | All Supabase queries. The only file that imports `@supabase/supabase-js`. |
| `src/app/api/shorten/route.ts` | POST handler. Validates, deduplicates, handles custom codes, inserts. |
| `src/app/[shortCode]/route.ts` | GET handler. Looks up short code, redirects, fires click increment. |
| `src/app/page.tsx` | Client component. Form, copy button, click count badge, QR code. |

## Testing

Tests use Vitest. The Supabase client is mocked via `vi.hoisted()` — do not change the mock structure in `src/lib/__tests__/db.test.ts` without understanding why `vi.hoisted` is required (the factory needs references that must exist before module evaluation).

Run tests: `npm test`
