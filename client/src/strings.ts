export const STR = {
  appTitle: 'Crypto Market Dashboard',
  loadingMarket: 'Loading market data…',
  serverUnreachable: "Couldn't reach the server — retrying automatically…",
  noDataYet: 'No data yet — waiting for the first successful upstream fetch.',
  tableHint: 'Click a coin to see its last-hour price history.',

  badgeNoData: 'no data yet',
  badgeReconnecting: (age: string) => `reconnecting… · updated ${age}`,
  badgeStale: (age: string) => `data may be stale · updated ${age}`,
  badgeFresh: (age: string) => `updated ${age}`,

  upstreamBanner: (error: string | null) =>
    `⚠ Live source unreachable (${error}) — showing last-known-good data.`,

  detailAria: (name: string) => `${name} details`,
  closeDetails: 'Close details',
  change24hSuffix: '· 24h',
  historyHeading: 'Last hour',
  historySource: '· from our database',
  historyLoading: 'Loading history…',
  historyError: (error: string) => `Couldn't load history (${error}).`,
  historyTooShort: 'Not enough history yet — a point is recorded on every server refresh. Check back in a minute.',

  colRank: '#',
  colCoin: 'Coin',
  colPrice: 'Price',
  colChange: '24h',
  colMarketCap: 'Market cap',

  sparklineAria: (from: string, to: string) => `Price over the last hour, from ${from} to ${to}`,
  ageSeconds: (n: number) => `${n}s ago`,
  ageMinutes: (n: number) => `${n}m ago`,
  ageHours: (n: number) => `${n}h ago`,
  changeUnknown: '—'
} as const;
