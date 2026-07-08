import { render } from '@testing-library/react';
import { CoinTableSkeleton, SKELETON_ROWS } from './CoinTableSkeleton';

describe('CoinTableSkeleton', () => {
  it('renders pulsing placeholder rows while data loads', () => {
    const { container } = render(<CoinTableSkeleton />);
    expect(container.querySelectorAll('tbody tr')).toHaveLength(SKELETON_ROWS);
    expect(container.querySelectorAll('.skel').length).toBe(SKELETON_ROWS * 5);
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
  });
});
