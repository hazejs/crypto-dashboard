import { fireEvent, render, screen } from '@testing-library/react';
import { fetchHistory } from '../../api/history';
import { makeCoin } from '../../testUtils';
import { CoinDetail } from './CoinDetail';

vi.mock('../../api/history', () => ({ fetchHistory: vi.fn() }));
const mockFetchHistory = vi.mocked(fetchHistory);

const points = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ ts: new Date(1700_000_000_000 + i * 30_000).toISOString(), price: 100 + i }));

const renderDetail = (onClose = vi.fn()) =>
  render(<CoinDetail coin={makeCoin()} lastFetchAt={null} onClose={onClose} />);

describe('CoinDetail', () => {
  it('shows a loading state first', () => {
    mockFetchHistory.mockReturnValue(new Promise(() => {}));
    renderDetail();
    screen.getByText('Loading history…');
  });

  it('shows an error state when the history request fails', async () => {
    mockFetchHistory.mockRejectedValue(new Error('HTTP 500'));
    renderDetail();
    await screen.findByText(/Couldn't load history \(HTTP 500\)/);
  });

  it('explains when there is not enough history yet', async () => {
    mockFetchHistory.mockResolvedValue({ coinId: 'bitcoin', minutes: 60, points: points(1) });
    renderDetail();
    await screen.findByText(/Not enough history yet/);
  });

  it('renders the chart from database points', async () => {
    mockFetchHistory.mockResolvedValue({ coinId: 'bitcoin', minutes: 60, points: points(5) });
    const { container } = renderDetail();
    await screen.findByRole('img');
    expect(container.querySelectorAll('path.line')).toHaveLength(1);
  });

  it('calls onClose from the close button', () => {
    mockFetchHistory.mockReturnValue(new Promise(() => {}));
    const onClose = vi.fn();
    renderDetail(onClose);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
