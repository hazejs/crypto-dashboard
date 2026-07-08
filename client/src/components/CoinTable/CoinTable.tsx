import type { Coin } from '../../../../shared/types';
import { STR } from '../../strings';
import { CoinRow } from '../CoinRow/CoinRow';

export interface CoinTableProps {
  coins: Coin[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function CoinTable({ coins, selectedId, onSelect }: CoinTableProps) {
  return (
    <table className="coin-table">
      <thead>
        <tr>
          <th>{STR.colRank}</th>
          <th>{STR.colCoin}</th>
          <th className="num">{STR.colPrice}</th>
          <th className="num">{STR.colChange}</th>
          <th className="num">{STR.colMarketCap}</th>
        </tr>
      </thead>
      <tbody>
        {coins.map((coin) => (
          <CoinRow
            key={coin.id}
            coin={coin}
            selected={coin.id === selectedId}
            onSelect={(id) => onSelect(id === selectedId ? null : id)}
          />
        ))}
      </tbody>
    </table>
  );
}
