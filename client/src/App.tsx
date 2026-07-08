import { useState } from 'react';
import { CoinDetail } from './components/CoinDetail/CoinDetail';
import { CoinTable } from './components/CoinTable/CoinTable';
import { FreshnessBadge } from './components/FreshnessBadge/FreshnessBadge';
import { StateMessage } from './components/StateMessage/StateMessage';
import { UpstreamBanner } from './components/UpstreamBanner/UpstreamBanner';
import { useLiveData } from './hooks/useLiveData';
import { STR } from './strings';

export default function App() {
  const { snapshot, connected, failedAttempts } = useLiveData();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const coins = snapshot?.coins ?? [];
  const selected = coins.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="app">
      <header className="app-header">
        <h1>{STR.appTitle}</h1>
        <FreshnessBadge snapshot={snapshot} connected={connected} />
      </header>

      {snapshot && coins.length > 0 && <UpstreamBanner upstream={snapshot.upstream} />}

      {!snapshot && failedAttempts === 0 && <StateMessage>{STR.loadingMarket}</StateMessage>}
      {!snapshot && failedAttempts > 0 && <StateMessage error>{STR.serverUnreachable}</StateMessage>}
      {snapshot && coins.length === 0 && <StateMessage>{STR.noDataYet}</StateMessage>}

      {coins.length > 0 && (
        <main className={selected ? 'layout with-detail' : 'layout'}>
          <div>
            <CoinTable coins={coins} selectedId={selectedId} onSelect={setSelectedId} />
            <p className="hint">{STR.tableHint}</p>
          </div>
          {selected && snapshot && (
            <CoinDetail
              key={selected.id}
              coin={selected}
              lastFetchAt={snapshot.lastFetchAt}
              onClose={() => setSelectedId(null)}
            />
          )}
        </main>
      )}
    </div>
  );
}
