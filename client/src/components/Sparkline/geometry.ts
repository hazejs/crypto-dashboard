import type { HistoryPoint } from '../../../../shared/types';

// Fixed height; width follows the container (passed in by the component). The
// wide right pad leaves room for the end-of-line direct label.
export const CHART = {
  width: 560, // fallback before the container is measured
  height: 180,
  pad: { top: 14, right: 84, bottom: 26, left: 10 }
} as const;

// Extra room above/below the price range so a flat hour still draws mid-chart.
const DOMAIN_PAD_RATIO = 0.08;

// Linear map from a value domain to a pixel range. Inverting an axis is just
// swapping the domain arguments (see the y scale below).
const scale = (d0: number, d1: number, r0: number, r1: number) => (v: number) =>
  r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0);

const toPath = (xs: number[], ys: number[]) =>
  xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');

// ~3 gridlines at clean 1/2/5 x 10^k steps.
export function niceTicks(lo: number, hi: number, count = 3): number[] {
  const rawStep = (hi - lo) / count;
  const mag = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= rawStep) ?? 10 * mag;
  const ticks: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-6; v += step) ticks.push(v);
  return ticks;
}

export interface Geometry {
  width: number;
  times: number[];
  prices: number[];
  xs: number[];
  ys: number[];
  line: string;
  area: string;
  ticks: number[];
  y: (v: number) => number;
}

export function buildGeometry(points: HistoryPoint[], width: number = CHART.width): Geometry {
  const { height, pad } = CHART;
  const times = points.map((p) => new Date(p.ts).getTime());
  const prices = points.map((p) => p.price);

  const domainPad = (Math.max(...prices) - Math.min(...prices) || Math.abs(prices[0]) || 1) * DOMAIN_PAD_RATIO;
  const lo = Math.min(...prices) - domainPad;
  const hi = Math.max(...prices) + domainPad;

  const x = scale(times[0], times[times.length - 1], pad.left, width - pad.right);
  const y = scale(hi, lo, pad.top, height - pad.bottom); // hi maps to the top

  const xs = times.map(x);
  const ys = prices.map(y);
  const line = toPath(xs, ys);
  const baseline = height - pad.bottom;
  const area = `${line} L ${xs[xs.length - 1].toFixed(1)} ${baseline} L ${xs[0].toFixed(1)} ${baseline} Z`;

  return { width, times, prices, xs, ys, line, area, ticks: niceTicks(lo, hi), y };
}
