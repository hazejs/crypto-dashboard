import { fireEvent, render, screen } from '@testing-library/react';
import { makeCoin } from '../../testUtils';
import { CoinTable } from './CoinTable';

vi.mock('../../api/history', () => ({ fetchHistory: vi.fn(() => new Promise(() => {})) }));

const coins = [
  makeCoin(),
  makeCoin({ id: 'ethereum', name: 'Ethereum', symbol: 'eth', rank: 2, price: 1747 })
];

describe('CoinTable', () => {
  it('renders one row per coin plus a header', () => {
    render(<CoinTable coins={coins} selectedId={null} onSelect={vi.fn()} lastFetchAt={null} />);
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('opens a detail drawer row under the selected coin', () => {
    render(<CoinTable coins={coins} selectedId="bitcoin" onSelect={vi.fn()} lastFetchAt={null} />);
    expect(screen.getAllByRole('row')).toHaveLength(4);
    screen.getByText('Loading history…');
  });

  it('selects an unselected coin and deselects the selected one', () => {
    const onSelect = vi.fn();
    render(<CoinTable coins={coins} selectedId="bitcoin" onSelect={onSelect} lastFetchAt={null} />);
    fireEvent.click(screen.getByText(/Ethereum/));
    expect(onSelect).toHaveBeenLastCalledWith('ethereum');
    fireEvent.click(screen.getAllByText(/Bitcoin/)[0]);
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });
});
