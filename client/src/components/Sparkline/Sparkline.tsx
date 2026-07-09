import { useMemo, useRef, useState, type PointerEvent } from 'react';
import type { HistoryPoint } from '../../../../shared/types';
import { formatPrice } from '../../format';
import { useElementWidth } from '../../hooks/useElementWidth';
import { STR } from '../../strings';
import { buildGeometry, CHART, type Geometry } from './geometry';

const { height: H, pad: PAD } = CHART;
const DOT_RADIUS = 4;
const TOOLTIP_MIN_PCT = 5;
const TOOLTIP_MAX_PCT = 92;
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });

function Axes({ geom, last }: { geom: Geometry; last: number }) {
  return (
    <>
      {geom.ticks.map((v) => (
        <g key={v}>
          <line className="grid" x1={PAD.left} x2={geom.width - PAD.right} y1={geom.y(v)} y2={geom.y(v)} />
          <text className="tick" x={PAD.left} y={geom.y(v) - 4}>
            {formatPrice(v)}
          </text>
        </g>
      ))}
      <text className="tick" x={geom.xs[0]} y={H - 8}>
        {timeFmt.format(geom.times[0])}
      </text>
      <text className="tick" x={geom.xs[last]} y={H - 8} textAnchor="end">
        {timeFmt.format(geom.times[last])}
      </text>
    </>
  );
}

function Tooltip({ geom, h }: { geom: Geometry; h: number }) {
  const leftPct = Math.min(TOOLTIP_MAX_PCT, Math.max(TOOLTIP_MIN_PCT, (geom.xs[h] / geom.width) * 100));
  return (
    <div className="tooltip" style={{ left: `${leftPct}%` }}>
      <span className="tooltip-value">{formatPrice(geom.prices[h])}</span>
      <span className="tooltip-time">{timeFmt.format(geom.times[h])}</span>
    </div>
  );
}

export function Sparkline({ points }: { points: HistoryPoint[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(wrapRef);
  const [hover, setHover] = useState<number | null>(null);
  const geom = useMemo(() => buildGeometry(points, width), [points, width]);
  const last = points.length - 1;

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const rect = wrapRef.current!.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * geom.width;
    let best = 0;
    for (let i = 1; i < geom.xs.length; i++) {
      if (Math.abs(geom.xs[i] - px) < Math.abs(geom.xs[best] - px)) best = i;
    }
    setHover(best);
  }

  const h = hover;
  return (
    <div className="sparkline" ref={wrapRef} onPointerMove={onPointerMove} onPointerLeave={() => setHover(null)}>
      <svg
        viewBox={`0 0 ${geom.width} ${H}`}
        role="img"
        aria-label={STR.sparklineAria(formatPrice(geom.prices[0]), formatPrice(geom.prices[last]))}
      >
        <Axes geom={geom} last={last} />
        <path className="area" d={geom.area} />
        <path className="line" d={geom.line} />
        {h != null && (
          <line className="crosshair" x1={geom.xs[h]} x2={geom.xs[h]} y1={PAD.top} y2={H - PAD.bottom} />
        )}
        {h != null && <circle className="dot" cx={geom.xs[h]} cy={geom.ys[h]} r={DOT_RADIUS} />}
        <circle className="dot" cx={geom.xs[last]} cy={geom.ys[last]} r={DOT_RADIUS} />
        <text className="end-label" x={geom.xs[last] + 10} y={geom.ys[last] + 4}>
          {formatPrice(geom.prices[last])}
        </text>
      </svg>
      {h != null && <Tooltip geom={geom} h={h} />}
    </div>
  );
}
