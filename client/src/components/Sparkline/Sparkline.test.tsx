import { fireEvent, render } from '@testing-library/react';
import { niceTicks } from './geometry';
import { Sparkline } from './Sparkline';

const pts = Array.from({ length: 5 }, (_, i) => ({
  ts: new Date(1700_000_000_000 + i * 30_000).toISOString(),
  price: 100 + i
}));

describe('niceTicks', () => {
  it('produces clean 1/2/5 steps inside the domain', () => {
    expect(niceTicks(0, 10)).toEqual([0, 5, 10]);
    expect(niceTicks(97, 103)).toEqual([98, 100, 102]);
  });
});

describe('Sparkline', () => {
  it('renders line, area wash, gridlines and an end-of-line label', () => {
    const { container } = render(<Sparkline points={pts} />);
    expect(container.querySelector('path.line')).toBeTruthy();
    expect(container.querySelector('path.area')).toBeTruthy();
    expect(container.querySelectorAll('line.grid').length).toBeGreaterThan(0);
    expect(container.querySelector('text.end-label')!.textContent).toBe('$104.00');
  });

  it('shows a crosshair tooltip on hover and clears it on leave', () => {
    const { container } = render(<Sparkline points={pts} />);
    const wrap = container.querySelector('.sparkline') as HTMLElement;
    vi.spyOn(wrap, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, width: 560, height: 220, right: 560, bottom: 220, x: 0, y: 0, toJSON: () => ({})
    } as DOMRect);
    fireEvent.pointerMove(wrap, { clientX: 10 });
    expect(container.querySelector('.tooltip')).toBeTruthy();
    fireEvent.pointerLeave(wrap);
    expect(container.querySelector('.tooltip')).toBeNull();
  });
});
