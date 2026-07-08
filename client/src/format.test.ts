import { formatAge, formatChange, formatMarketCap, formatPrice } from './format';

describe('format', () => {
  it('formats prices with 2 decimals above $1 and 4 significant digits below', () => {
    expect(formatPrice(62495)).toBe('$62,495.00');
    expect(formatPrice(0.123456)).toBe('$0.1235');
  });

  it('formats market caps compactly', () => {
    expect(formatMarketCap(1_230_000_000_000)).toBe('$1.2T');
  });

  it('formats 24h change signed, em-dash when unknown', () => {
    expect(formatChange(1.234)).toBe('+1.23%');
    expect(formatChange(-0.5)).toBe('-0.50%');
    expect(formatChange(null)).toBe('—');
  });

  it('formats ages in s/m/h', () => {
    expect(formatAge(4000)).toBe('4s ago');
    expect(formatAge(120_000)).toBe('2m ago');
    expect(formatAge(7_200_000)).toBe('2h ago');
  });
});
