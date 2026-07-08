# Crypto Market Dashboard

Live dashboard of the top 20 cryptocurrencies - current price, 24h change and market cap,
plus a price history chart for every coin. Built with React 19, Node.js (TypeScript) and
MongoDB, with live updates pushed over WebSocket. Market data comes from the free
CoinGecko API (no key needed).

## Run with Docker

```sh
docker compose up --build
```

Open http://localhost:4000. MongoDB, the API server and the frontend all come up
together, nothing else to install.

## Run locally (dev mode)

You'll need Node 22.18+ and a MongoDB running on localhost:27017
(a local install, or: `docker run -d -p 27017:27017 mongo:7`).

```sh
npm install
npm run dev
```

Open http://localhost:5173. Client and server both hot-reload.

## Configuration

Everything is optional and has defaults. To override, copy `.env.example` to `.env`
(port, Mongo URI, poll interval, history retention). If you ever hit CoinGecko rate
limits, a free demo API key from https://www.coingecko.com/en/api/pricing goes in
`.env` as `COINGECKO_API_KEY`. Don't commit the `.env` file.

## Tests

```sh
npm test           # server (node:test) + client (Vitest) unit tests
npm run typecheck
```
