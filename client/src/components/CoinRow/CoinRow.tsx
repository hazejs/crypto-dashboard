import type { Coin } from '../../../../shared/types';
import { formatChange, formatMarketCap, formatPrice } from '../../format';

export interface CoinRowProps {
  coin: Coin;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function CoinRow({ coin, selected, onSelect }: CoinRowProps) {
  return (
    <tr
      className={selected ? 'selected' : ''}
      tabIndex={0}
      onClick={() => onSelect(coin.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(coin.id);
        }
      }}
    >
      <td className="muted">{coin.rank}</td>
      <td className="coin-name">
        <img src={coin.image} alt="" width="20" height="20" loading="lazy" />
        {coin.name} <span className="muted">{coin.symbol.toUpperCase()}</span>
      </td>
      <td className="num">{formatPrice(coin.price)}</td>
      <td className={`num ${(coin.change24h ?? 0) >= 0 ? 'up' : 'down'}`}>{formatChange(coin.change24h)}</td>
      <td className="num">{formatMarketCap(coin.marketCap)}</td>
    </tr>
  );
}
