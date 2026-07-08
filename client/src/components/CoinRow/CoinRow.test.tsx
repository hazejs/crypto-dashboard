import { fireEvent, render, screen } from '@testing-library/react';
import type { Coin } from '../../../../shared/types';
import { makeCoin } from '../../testUtils';
import { CoinRow } from './CoinRow';

const renderRow = (coin: Coin, onSelect = vi.fn()) => {
  render(
    <table>
      <tbody>
        <CoinRow coin={coin} selected={false} onSelect={onSelect} />
      </tbody>
    </table>
  );
  return onSelect;
};

describe('CoinRow', () => {
  it('renders rank, name, price, change and market cap', () => {
    renderRow(makeCoin());
    screen.getByText(/Bitcoin/);
    screen.getByText('BTC');
    screen.getByText('$62,000.00');
    screen.getByText('$1.2T');
    expect(screen.getByText('+1.23%').className).toContain('up');
  });

  it('colors a negative 24h change down', () => {
    renderRow(makeCoin({ change24h: -2 }));
    expect(screen.getByText('-2.00%').className).toContain('down');
  });

  it('selects on click and on Enter', () => {
    const onSelect = renderRow(makeCoin());
    const row = screen.getByRole('row');
    fireEvent.click(row);
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect).toHaveBeenCalledWith('bitcoin');
  });
});
