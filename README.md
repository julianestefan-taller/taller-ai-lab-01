# URL Shortener — Lab 01

A production-grade URL shortener built with Next.js App Router and Supabase. Users paste a long URL and get a short one back instantly, with an optional custom slug, click analytics, and a generated QR code.

**Live demo:** https://taller-ai-lab-01.vercel.app

---

## Features

| Feature | Details |
|---|---|
| URL shortening | Cryptographically random 6-char base64url slug |
| Custom codes | User-specified slug with format validation |
| Deduplication | Same long URL always returns the same short code |
| Click analytics | Every redirect increments a counter atomically |
| QR code | SVG QR rendered client-side via `qrcode.react` |

---

## Architecture

```
src/
├── app/
│   ├── page.tsx                   # Client component — form, result, QR
│   ├── api/shorten/route.ts       # POST  — create / look up short URL
│   └── [shortCode]/route.ts       # GET   — redirect + fire-and-forget click increment
└── lib/
    └── db.ts                      # Supabase query layer (server-only)
```

The app has exactly two API routes. Everything else is edge cases of those two routes.

---

## Design Decisions

### Server-only Supabase credentials

`SUPABASE_URL` and `SUPABASE_ANON_KEY` use **no** `NEXT_PUBLIC_` prefix. Variables with that prefix are bundled into the client JavaScript and become visible to anyone who inspects the page source. Even though the Supabase anon key has row-level security, leaking the project URL and key is unnecessary attack surface. The DB layer (`src/lib/db.ts`) is only ever imported by server-side route handlers, so this is safe.

### Atomic click counting via Postgres function

`incrementClicks` calls a Supabase RPC (`increment_clicks` stored procedure) that runs `UPDATE urls SET clicks = clicks + 1 WHERE short_code = $1` inside Postgres. A read-then-write approach (`SELECT clicks`, then `UPDATE clicks = clicks + 1`) would have a race condition under concurrent requests. The stored procedure avoids that.

```sql
create or replace function increment_clicks(code text)
returns void language sql as $$
  update urls set clicks = clicks + 1 where short_code = code;
$$;
```

### Fire-and-forget click increment

In `[shortCode]/route.ts`, `incrementClicks(shortCode)` is called **without `await`**. The redirect response is sent immediately; the Postgres write happens in the background. This keeps redirect latency minimal — a 1 ms database write shouldn't add to the user's time-to-redirect. If the increment fails silently, analytics drift by one; that's an acceptable trade-off for a URL shortener.

### Protocol detection from the `Host` header

The short URL returned in the JSON response (`http://localhost:3000/abc123` vs `https://myapp.vercel.app/abc123`) is assembled from the request's `Host` header. The protocol is inferred: if the host starts with `localhost` it uses `http`, otherwise `https`. This works for both local development and Vercel production without any extra config.

### Dedup before custom-code conflict check

The POST handler checks whether the long URL already exists in the database *before* checking whether a custom code is taken. If a user submits a URL that was already shortened and also requests a custom code that is taken, they get back the existing short URL rather than a conflict error. Dedup takes priority — the URL is already shortened, which is what the user wanted.

### Short code generation

Random codes are generated with `crypto.randomBytes(4).toString('base64url').slice(0, 6)`. This gives 48 bits of entropy in a URL-safe alphabet. There is no collision check before insertion; if the generated code collides with an existing one, Postgres returns a unique-constraint error which surfaces as a 500 to the user. At the scale of a lab project this is fine; at scale you would retry or use a hash-based scheme.

---

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Create env file
cp .env.local.example .env.local
# Fill in SUPABASE_URL and SUPABASE_ANON_KEY from your Supabase project

# 3. Run the dev server
npm run dev
```

### Required Supabase schema

```sql
create table urls (
  id         bigint primary key generated always as identity,
  short_code text   not null unique,
  original_url text not null unique,
  created_at timestamptz default now() not null,
  clicks     bigint default 0 not null
);

create or replace function increment_clicks(code text)
returns void language sql as $$
  update urls set clicks = clicks + 1 where short_code = code;
$$;
```

### Environment variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL (Project Settings → API) |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |

---

## Tests

```bash
npm test          # run once
npm run test:watch  # watch mode
```

31 tests across three suites:

| Suite | What it covers |
|---|---|
| `src/lib/__tests__/db.test.ts` | Supabase query layer — all four functions |
| `src/app/api/shorten/__tests__/route.test.ts` | POST handler — validation, dedup, custom codes, creation |
| `src/app/[shortCode]/__tests__/route.test.ts` | GET handler — 404, redirect, click tracking |

The Supabase client is mocked with `vi.hoisted()` so the chainable builder API (`from().select().eq().single()`) is fully faked without hitting the network.

---

## Deployment

The app auto-deploys to Vercel on push to `main`.
