import type { HistoryPoint } from '../../../../shared/types';

// Fixed height; width follows the container (passed in by the component). The
// wide right pad leaves room for the end-of-line direct label.
export const CHART = {
  width: 560, // fallback before the container is measured
  height: 180,
  pad: { top: 14, right: 84, bottom: 26, left: 10 }
} as const;

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
  t0: number;
  t1: number;
}

export function buildGeometry(points: HistoryPoint[], width: number = CHART.width): Geometry {
  const { height, pad } = CHART;
  const times = points.map((p) => new Date(p.ts).getTime());
  const prices = points.map((p) => p.price);
  let lo = Math.min(...prices);
  let hi = Math.max(...prices);
  // Pad the domain so a flat hour still renders a visible line.
  const domainPad = (hi - lo || Math.abs(hi) || 1) * 0.08;
  lo -= domainPad;
  hi += domainPad;
  const t0 = times[0];
  const t1 = times[times.length - 1];
  const x = (t: number) => pad.left + ((t - t0) / (t1 - t0 || 1)) * (width - pad.left - pad.right);
  const y = (v: number) => pad.top + (1 - (v - lo) / (hi - lo)) * (height - pad.top - pad.bottom);
  const xs = times.map(x);
  const ys = prices.map(y);
  const line = xs.map((px, i) => `${i ? 'L' : 'M'}${px.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
  const base = height - pad.bottom;
  const area = `${line} L ${xs[xs.length - 1].toFixed(1)} ${base} L ${xs[0].toFixed(1)} ${base} Z`;
  return { width, times, prices, xs, ys, line, area, ticks: niceTicks(lo, hi), y, t0, t1 };
}
