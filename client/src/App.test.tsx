import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { useLiveData } from './hooks/useLiveData';
import { makeSnapshot } from './testUtils';

vi.mock('./hooks/useLiveData', () => ({ useLiveData: vi.fn() }));
vi.mock('./api/history', () => ({ fetchHistory: vi.fn(() => new Promise(() => {})) }));
const mockLive = vi.mocked(useLiveData);

const live = (over: Partial<ReturnType<typeof useLiveData>> = {}) =>
  mockLive.mockReturnValue({ snapshot: makeSnapshot(), connected: true, failedAttempts: 0, ...over });

describe('App', () => {
  it('shows a skeleton table before the first snapshot', () => {
    live({ snapshot: null, connected: false });
    const { container } = render(<App />);
    screen.getByLabelText('Loading market data…');
    expect(container.querySelectorAll('.skel').length).toBeGreaterThan(0);
  });

  it('shows an error state while the server is unreachable', () => {
    live({ snapshot: null, connected: false, failedAttempts: 2 });
    render(<App />);
    screen.getByText(/Couldn't reach the server/);
  });

  it('shows an empty state when no data has ever been fetched', () => {
    live({ snapshot: makeSnapshot({ coins: [], lastFetchAt: null, stale: true }) });
    render(<App />);
    screen.getByText(/No data yet/);
  });

  it('renders the table and opens the detail panel on row click', () => {
    live();
    render(<App />);
    fireEvent.click(screen.getByText(/Bitcoin/));
    screen.getByText('Loading history…');
  });

  it('keeps data visible with a banner during upstream failure', () => {
    live({ snapshot: makeSnapshot({ upstream: { ok: false, consecutiveFailures: 3, lastError: 'HTTP 500' } }) });
    render(<App />);
    screen.getByRole('status');
    screen.getByText(/Bitcoin/);
  });
});
