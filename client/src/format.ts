import { STR } from './strings';

const LOCALE = 'en-US';
const CURRENCY = { style: 'currency', currency: 'USD' } as const;
const SMALL_PRICE_SIGNIFICANT_DIGITS = 4;
const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;

const usd = new Intl.NumberFormat(LOCALE, CURRENCY);
const usdSmall = new Intl.NumberFormat(LOCALE, { ...CURRENCY, maximumSignificantDigits: SMALL_PRICE_SIGNIFICANT_DIGITS });
const usdCompact = new Intl.NumberFormat(LOCALE, { ...CURRENCY, notation: 'compact', maximumFractionDigits: 1 });

export const formatPrice = (n: number): string => (n >= 1 ? usd.format(n) : usdSmall.format(n));
export const formatMarketCap = (n: number): string => usdCompact.format(n);
export const formatChange = (n: number | null): string =>
  n == null ? STR.changeUnknown : `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

export function formatAge(ms: number): string {
  if (ms < MS_PER_MINUTE) return STR.ageSeconds(Math.max(0, Math.floor(ms / 1000)));
  if (ms < MS_PER_HOUR) return STR.ageMinutes(Math.floor(ms / MS_PER_MINUTE));
  return STR.ageHours(Math.floor(ms / MS_PER_HOUR));
}
