import type { Coin } from '../../../../shared/types';
import { formatChange, formatPrice } from '../../format';
import { useHistory } from '../../hooks/useHistory';
import { STR } from '../../strings';
import { Sparkline } from '../Sparkline/Sparkline';
import { StateMessage } from '../StateMessage/StateMessage';

export interface CoinDetailProps {
  coin: Coin;
  lastFetchAt: string | null;
  onClose: () => void;
}

const MIN_CHART_POINTS = 2;

// History comes from our own database, never a fresh upstream call. The parent
// keys this component by coin id, so switching coins remounts with a clean
// loading state; lastFetchAt refreshes the chart after each server tick.
export function CoinDetail({ coin, lastFetchAt, onClose }: CoinDetailProps) {
  const { points, error } = useHistory(coin.id, lastFetchAt);

  function history() {
    if (error) return <StateMessage error>{STR.historyError(error)}</StateMessage>;
    if (!points) return <StateMessage>{STR.historyLoading}</StateMessage>;
    if (points.length < MIN_CHART_POINTS) return <StateMessage>{STR.historyTooShort}</StateMessage>;
    return <Sparkline points={points} />;
  }

  return (
    <div className="detail" aria-label={STR.detailAria(coin.name)}>
      <header className="detail-header">
        <h2 className="coin-name">
          <img src={coin.image} alt="" width="24" height="24" />
          {coin.name} <span className="muted">{coin.symbol.toUpperCase()}</span>
        </h2>
        <button className="close" onClick={onClose} aria-label={STR.closeDetails}>
          ×
        </button>
      </header>

      <div className="detail-price">
        <span className="big-price">{formatPrice(coin.price)}</span>
        <span className={(coin.change24h ?? 0) >= 0 ? 'up' : 'down'}>
          {formatChange(coin.change24h)} {STR.change24hSuffix}
        </span>
      </div>

      <h3>
        {STR.historyHeading} <span className="muted">{STR.historySource}</span>
      </h3>

      {history()}
    </div>
  );
}
