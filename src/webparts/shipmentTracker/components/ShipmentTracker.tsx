import * as React from 'react';
import styles from './ShipmentTracker.module.scss';
import type { IShipmentTrackerProps } from './IShipmentTrackerProps';
import { SHIPMENT_STATUSES, type ShipmentStatus } from '../models/IShipment';
import { useShipments } from './useShipments';
import { countByStatus, filterShipments, isLate, summariseBoard, type StatusFilter } from '../utils/shipmentUtils';

const STATUS_CLASS: Record<ShipmentStatus, string> = {
  Booked: styles.booked,
  'In transit': styles.inTransit,
  Delivered: styles.delivered,
  Exception: styles.exception
};

const FILTER_LABEL: Record<StatusFilter, string> = {
  All: 'All consignments',
  Booked: 'Booked',
  'In transit': 'In transit',
  Delivered: 'Delivered',
  Exception: 'Exceptions',
  Late: 'Running late'
};

function formatDate(iso: string): string {
  if (!iso) {
    return '';
  }
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

let idCounter = 0;

const ShipmentTracker: React.FC<IShipmentTrackerProps> = ({ title, accentWord, siteTitle, dateText, service, isDemo }) => {
  const { shipments, loading, error } = useShipments(service);
  const [filter, setFilter] = React.useState<StatusFilter>('All');
  const [query, setQuery] = React.useState<string>('');
  const ids = React.useMemo(() => {
    idCounter += 1;
    return { title: `fn-board-title-${idCounter}`, search: `fn-board-search-${idCounter}` };
  }, []);

  const counts = React.useMemo(() => countByStatus(shipments), [shipments]);
  const summary = React.useMemo(() => summariseBoard(shipments), [shipments]);
  const visible = React.useMemo(() => filterShipments(shipments, filter, query), [shipments, filter, query]);

  const lede =
    summary.total === 0
      ? 'Nothing on the board yet.'
      : `${plural(summary.total, 'consignment', 'consignments')} on the board. ` +
        (summary.needsLook === 0 ? 'Everything is on track.' : `${plural(summary.needsLook, 'needs', 'need')} a look.`);

  const tiles: { key: StatusFilter; label: string; value: number; className: string }[] = [
    ...SHIPMENT_STATUSES.map((s) => ({ key: s as StatusFilter, label: s, value: counts[s], className: STATUS_CLASS[s] })),
    { key: 'Late', label: 'Running late', value: summary.late, className: styles.lateTile }
  ];

  const toggle = (key: StatusFilter): void => setFilter((current) => (current === key ? 'All' : key));

  return (
    <section className={styles.board} aria-labelledby={ids.title}>
      <div className={styles.band}>
        <div className={styles.inner}>
          <div className={styles.meta}>
            <span>{siteTitle} / Operations</span>
            <span>{isDemo ? `${dateText} · Demo data` : `${dateText} · Live`}</span>
          </div>

          <div className={styles.heading}>
            <h2 id={ids.title} className={styles.title}>
              {title}
              {accentWord && <> <em className={styles.accent}>{accentWord}</em></>}
            </h2>
            <p className={styles.lede} aria-live="polite">
              {loading ? 'Loading the board…' : error ? 'The board could not load.' : lede}
            </p>
          </div>

          {!loading && !error && (
            <div className={styles.tiles} role="group" aria-label="Filter by status">
              {tiles.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`${styles.tile} ${t.className}`}
                  aria-pressed={filter === t.key}
                  onClick={() => toggle(t.key)}
                >
                  <span className={styles.tileValue}>{pad(t.value)}</span>
                  <span className={styles.tileLabel}>{t.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`${styles.inner} ${styles.body}`}>
        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className={styles.toolbar}>
              <div className={styles.showing}>
                <span className={styles.showingLabel}>Showing</span>
                <span>
                  {FILTER_LABEL[filter]} · {visible.length} of {shipments.length}
                </span>
                {filter !== 'All' && (
                  <button type="button" className={styles.clear} onClick={() => setFilter('All')}>
                    Clear filter
                  </button>
                )}
              </div>
              <div className={styles.search}>
                <label htmlFor={ids.search}>Search</label>
                <input
                  id={ids.search}
                  type="search"
                  placeholder="Reference, customer, route…"
                  autoComplete="off"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.tableScroll}>
              <table className={styles.table} aria-labelledby={ids.title}>
                <thead>
                  <tr>
                    <th scope="col">Reference</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Route</th>
                    <th scope="col">Carrier</th>
                    <th scope="col">Status</th>
                    <th scope="col">ETA</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((s) => {
                    const late = isLate(s);
                    return (
                      <tr key={s.id}>
                        <td className={styles.ref}>{s.reference}</td>
                        <td>{s.customer}</td>
                        <td>
                          {s.origin}
                          <span className={styles.arrow} aria-hidden="true">→</span>
                          <span className={styles.srOnly}> to </span>
                          {s.destination}
                        </td>
                        <td>{s.carrier}</td>
                        <td>
                          <span className={`${styles.chip} ${STATUS_CLASS[s.status]}`}>{s.status}</span>
                        </td>
                        <td className={late ? styles.late : undefined}>
                          {formatDate(s.eta)}
                          {late && <span className={styles.lateTag}>Late</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {visible.length === 0 && <p className={styles.empty}>No consignments match. Try another filter or search.</p>}
            </div>

            {isDemo && <p className={styles.foot}>Fictional demo data. All companies and consignments are made up.</p>}
          </>
        )}
      </div>
    </section>
  );
};

export default ShipmentTracker;
