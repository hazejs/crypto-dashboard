import { fireEvent, render, screen } from '@testing-library/react';
import { makeCoin } from '../../testUtils';
import { CoinTable } from './CoinTable';

const coins = [
  makeCoin(),
  makeCoin({ id: 'ethereum', name: 'Ethereum', symbol: 'eth', rank: 2, price: 1747 })
];

describe('CoinTable', () => {
  it('renders one row per coin plus a header', () => {
    render(<CoinTable coins={coins} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('selects an unselected coin and deselects the selected one', () => {
    const onSelect = vi.fn();
    render(<CoinTable coins={coins} selectedId="bitcoin" onSelect={onSelect} />);
    fireEvent.click(screen.getByText(/Ethereum/));
    expect(onSelect).toHaveBeenLastCalledWith('ethereum');
    fireEvent.click(screen.getByText(/Bitcoin/));
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });
});
