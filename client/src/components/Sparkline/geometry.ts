import type { HistoryPoint } from '../../../../shared/types';

export const CHART = {
  width: 560,
  height: 180,
  pad: { top: 14, right: 84, bottom: 26, left: 10 },
} as const;

const DOMAIN_PAD_RATIO = 0.08;

const scale = (d0: number, d1: number, r0: number, r1: number) => (v: number) =>
  r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0);

const toPath = (xs: number[], ys: number[]) =>
  xs
    .map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${ys[i].toFixed(1)}`)
    .join(' ');

const EPSILON = 1e-9;

function niceStep(roughStep: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const multiplier =
    [1, 2, 5, 10].find((m) => m * magnitude >= roughStep) ?? 10;
  return multiplier * magnitude;
}

export function niceTicks(lo: number, hi: number, count = 3): number[] {
  const step = niceStep((hi - lo) / count);
  const firstIndex = Math.ceil(lo / step);
  const lastIndex = Math.floor(hi / step + EPSILON);
  const ticks: number[] = [];
  for (let i = firstIndex; i <= lastIndex; i++) ticks.push(i * step);
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

export function buildGeometry(
  points: HistoryPoint[],
  width: number = CHART.width,
): Geometry {
  const { height, pad } = CHART;
  const times = points.map((p) => new Date(p.ts).getTime());
  const prices = points.map((p) => p.price);

  const domainPad =
    (Math.max(...prices) - Math.min(...prices) || Math.abs(prices[0]) || 1) *
    DOMAIN_PAD_RATIO;
  const lo = Math.min(...prices) - domainPad;
  const hi = Math.max(...prices) + domainPad;

  const x = scale(
    times[0],
    times[times.length - 1],
    pad.left,
    width - pad.right,
  );
  const y = scale(hi, lo, pad.top, height - pad.bottom);

  const xs = times.map(x);
  const ys = prices.map(y);
  const line = toPath(xs, ys);
  const baseline = height - pad.bottom;
  const area = `${line} L ${xs[xs.length - 1].toFixed(1)} ${baseline} L ${xs[0].toFixed(1)} ${baseline} Z`;

  return {
    width,
    times,
    prices,
    xs,
    ys,
    line,
    area,
    ticks: niceTicks(lo, hi),
    y,
  };
}
