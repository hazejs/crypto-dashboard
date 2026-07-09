import { Fragment } from 'react';
import type { Coin } from '../../../../shared/types';
import { STR } from '../../strings';
import { CoinDetail } from '../CoinDetail/CoinDetail';
import { CoinRow } from '../CoinRow/CoinRow';
import { DetailDrawer } from '../DetailDrawer/DetailDrawer';

const COLUMN_COUNT = 5;

export interface CoinTableProps {
  coins: Coin[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  lastFetchAt: string | null;
}

export function CoinTableHead() {
  return (
    <thead>
      <tr>
        <th>{STR.colRank}</th>
        <th>{STR.colCoin}</th>
        <th className="num">{STR.colPrice}</th>
        <th className="num">{STR.colChange}</th>
        <th className="num">{STR.colMarketCap}</th>
      </tr>
    </thead>
  );
}

export function CoinTable({ coins, selectedId, onSelect, lastFetchAt }: CoinTableProps) {
  return (
    <table className="coin-table">
      <CoinTableHead />
      <tbody>
        {coins.map((coin) => (
          <Fragment key={coin.id}>
            <CoinRow
              coin={coin}
              selected={coin.id === selectedId}
              onSelect={(id) => onSelect(id === selectedId ? null : id)}
            />
            <DetailDrawer open={coin.id === selectedId} colSpan={COLUMN_COUNT}>
              <CoinDetail coin={coin} lastFetchAt={lastFetchAt} onClose={() => onSelect(null)} />
            </DetailDrawer>
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}
