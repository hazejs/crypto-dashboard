# Crypto Market Dashboard

A live dashboard of the top 20 cryptocurrencies (price, 24h change, market cap) with a
per-coin last-hour price history. Three tiers, TypeScript end to end: **React 19**
frontend, **Node.js/Express** backend, **MongoDB** storage, with **WebSocket** push as
the only live-data channel — the client never polls.

Data source: the free, keyless [CoinGecko](https://www.coingecko.com/en/api) `/coins/markets` endpoint.

## Running it

### Option A — Docker (one command)

```sh
docker compose up --build
```

Then open **http://localhost:4000**. Mongo, the API server, and the built frontend all
come up together.

### Option B — local dev (needs Node ≥ 22.18 and a MongoDB)

```sh
# a local Mongo, e.g.:
docker run -d -p 27017:27017 --name mongo mongo:7
# (or any MongoDB Community install / Atlas URI via MONGODB_URI)

npm install
npm run dev
```

Open the Vite URL it prints (default **http://localhost:5173**). The dev server proxies
`/api` and `/ws` to the backend on port 4000. Configuration is optional — copy
`.env.example` to `.env` to override defaults. The server runs its TypeScript directly
on Node (native type stripping) — no build step, no transpiler.

### Tests & type safety

```sh
npm test        # server: node:test · client: Vitest + Testing Library (every component)
npm run typecheck
```

## Architecture

```
                 ┌─────────────────────────── server ───────────────────────────┐
CoinGecko  ◄──── │ poller (one shared loop, 30s) ──► MongoDB (coins + ticks)    │
 (1 call/30s)    │        │                                   ▲                 │
                 │        ▼                                   │ history reads   │
                 │ in-memory snapshot ──► WebSocket push ─────┼──► REST /api    │
                 └────────────────────────────│───────────────│─────────────────┘
                                              ▼               ▼
                                        React clients (N of them — upstream cost unchanged)
```

The frontend never talks to CoinGecko. One server-side loop fetches every 30s, persists
to Mongo, and pushes the full snapshot to all connected WebSocket clients. Serving a
user costs zero upstream calls and (for the live list) zero DB reads.

Layout: `shared/` holds the wire types and protocol constants used by both tiers;
`server/src` is one module per concern (config, upstream client, db, poller, ws hub,
routes); `client/src` separates I/O from rendering — `api/` (HTTP requests), `live/`
(the WebSocket), `hooks/` (state), `components/` (one presentational component per
file), `strings.ts` (all user-facing copy — no hardcoded text in components).

## Decisions & trade-offs

**Why WebSocket push (not client polling or SSE)?**
The data changes on the *server's* schedule — one upstream poll fans out to N clients.
The socket delivers a full snapshot on connect and after every poll attempt, so the
client needs no polling at all; its single HTTP call is the on-demand history read.
WebSocket over SSE mostly for the mature `ws` library and first-class Vite proxy
support. The client auto-reconnects with exponential backoff (1s → 10s).

**Why poll upstream at 30s?**
CoinGecko has no push API, and its keyless tier allows roughly 5–15 calls/min. One call
per 30s = 2/min — comfortably inside the limit while fresh enough for a market
dashboard, and *independent of user count*. On failure the poller backs off
exponentially (up to 5 min) and honors `Retry-After` on HTTP 429, so it never hammers a
struggling API.

**Why MongoDB, and this schema?**
The upstream payload is a document; storing it as documents means no impedance mismatch,
and Mongo's TTL indexes give retention for free. Two collections, each doing one job:

| Collection | Shape | Job |
|---|---|---|
| `coins` | one doc per coin, replaced each successful fetch (`_id` = coin id, indexed on `rank`) | **last-known-good** — survives restarts, so the app serves data immediately even if upstream is down at boot |
| `ticks` | append-only `{coinId, ts, price, change24h, marketCap}`, compound index `{coinId, ts}`, TTL on `ts` (24h) | **history** — the detail chart reads this, never upstream |

At 20 coins × 1 tick/30s that's ~57.6k small docs/day, and the TTL index caps it there.
SQL would work equally well (a `ticks` table with the same composite index); Mongo was
chosen for document fit + built-in TTL, not for scale reasons.

**Freshness & failure model**
Every snapshot carries `lastFetchAt` and a `stale` flag (age > 90s ≈ 3 missed polls).
The UI shows a ticking "updated Ns ago" badge, flips to an amber "data may be stale"
state, shows a banner naming the upstream error while still displaying last-known-good
data, and shows "reconnecting…" if the socket drops. Upstream failure never blanks the
screen. These paths are unit-tested on both tiers (`poller.test.ts`, the component tests).

**What's deliberately not here**
No auth, no state-management library, no chart library (the sparkline is ~100 lines of
typed SVG) — the brief asks for the minimum code that demonstrates the engineering.
Next additions would be integration tests against a real Mongo (testcontainers) and a
CI workflow.

## Backend API

| Route | Returns |
|---|---|
| `WS /ws` | `{type: 'snapshot', coins, lastFetchAt, stale, staleAfterMs, upstream}` on connect and after every poll attempt — the only channel the UI needs for live data |
| `GET /api/coins` | the same snapshot shape, for curl/debugging |
| `GET /api/coins/:id/history?minutes=60` | `{coinId, minutes, points: [{ts, price}]}` from the DB (1–1440 min) |
| `GET /api/health` | `{ok, lastFetchAt, stale, upstream}` |

## Configuration

All optional, via environment (see [.env.example](.env.example)): `PORT`, `MONGODB_URI`,
`POLL_INTERVAL_MS`, `STALE_AFTER_MS`, `COIN_COUNT`, `HISTORY_TTL_SECONDS`,
`COINGECKO_API_KEY`.

The API works without a key. If you hit rate limits, a free demo key from
[CoinGecko](https://www.coingecko.com/en/api/pricing) raises them — put it in `.env`
(git-ignored). No secrets are committed.
