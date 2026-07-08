import { render, screen } from '@testing-library/react';
import { makeSnapshot } from '../../testUtils';
import { FreshnessBadge } from './FreshnessBadge';

describe('FreshnessBadge', () => {
  it('shows "no data yet" without a snapshot', () => {
    render(<FreshnessBadge snapshot={null} connected={false} />);
    screen.getByText('no data yet');
  });

  it('shows a fresh ticking age while connected and recent', () => {
    render(<FreshnessBadge snapshot={makeSnapshot()} connected />);
    expect(screen.getByText(/updated 0s ago/).className).toContain('fresh');
  });

  it('flags data past the staleness threshold', () => {
    const old = new Date(Date.now() - 5 * 60_000).toISOString();
    render(<FreshnessBadge snapshot={makeSnapshot({ lastFetchAt: old })} connected />);
    expect(screen.getByText(/data may be stale · updated 5m ago/).className).toContain('stale');
  });

  it('shows reconnecting while the socket is down', () => {
    render(<FreshnessBadge snapshot={makeSnapshot()} connected={false} />);
    expect(screen.getByText(/reconnecting/).className).toContain('stale');
  });
});
