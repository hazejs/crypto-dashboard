import { STR } from '../../strings';
import { CoinTableHead } from '../CoinTable/CoinTable';

export const SKELETON_ROWS = 8;
const COLUMN_WIDTHS_PX = [20, 150, 90, 50, 80];
const NUM_COLUMNS_FROM = 2;

export function CoinTableSkeleton() {
  return (
    <div aria-busy="true" aria-label={STR.loadingMarket}>
      <table className="coin-table" aria-hidden="true">
        <CoinTableHead />
        <tbody>
          {Array.from({ length: SKELETON_ROWS }, (_, row) => (
            <tr key={row}>
              {COLUMN_WIDTHS_PX.map((width, col) => (
                <td key={col} className={col >= NUM_COLUMNS_FROM ? 'num' : ''}>
                  <span className="skel" style={{ width }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
