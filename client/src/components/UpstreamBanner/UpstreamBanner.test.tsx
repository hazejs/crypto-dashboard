import { render, screen } from '@testing-library/react';
import { UpstreamBanner } from './UpstreamBanner';

describe('UpstreamBanner', () => {
  it('renders nothing while upstream is healthy', () => {
    const { container } = render(
      <UpstreamBanner upstream={{ ok: true, consecutiveFailures: 0, lastError: null }} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('names the failure and signals last-known-good data', () => {
    render(
      <UpstreamBanner upstream={{ ok: false, consecutiveFailures: 2, lastError: 'rate limited (HTTP 429)' }} />
    );
    const banner = screen.getByRole('status');
    expect(banner.textContent).toContain('rate limited (HTTP 429)');
    expect(banner.textContent).toContain('last-known-good');
  });
});
