import * as React from 'react';
import {
  DetailsList,
  DetailsListLayoutMode,
  type IColumn,
  MessageBar,
  MessageBarType,
  Pivot,
  PivotItem,
  SearchBox,
  SelectionMode,
  Spinner,
  SpinnerSize
} from '@fluentui/react';
import styles from './ShipmentTracker.module.scss';
import type { IShipmentTrackerProps } from './IShipmentTrackerProps';
import { SHIPMENT_STATUSES, type IShipment, type ShipmentStatus } from '../models/IShipment';
import { countByStatus, filterShipments, isLate, type StatusFilter } from '../utils/shipmentUtils';

const STATUS_CLASS: Record<ShipmentStatus, string> = {
  Booked: styles.booked,
  'In transit': styles.inTransit,
  Delivered: styles.delivered,
  Exception: styles.exception
};

function formatDate(iso: string): string {
  if (!iso) {
    return '';
  }
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

const columns: IColumn[] = [
  { key: 'reference', name: 'Reference', fieldName: 'reference', minWidth: 80, maxWidth: 100 },
  { key: 'customer', name: 'Customer', fieldName: 'customer', minWidth: 110, maxWidth: 160, isResizable: true },
  {
    key: 'route',
    name: 'Route',
    minWidth: 160,
    isResizable: true,
    onRender: (s: IShipment) => (
      <span>
        {s.origin} <span aria-hidden="true">→</span>
        <span className={styles.srOnly}> to </span> {s.destination}
      </span>
    )
  },
  { key: 'carrier', name: 'Carrier', fieldName: 'carrier', minWidth: 100, maxWidth: 140, isResizable: true },
  {
    key: 'status',
    name: 'Status',
    minWidth: 90,
    maxWidth: 110,
    onRender: (s: IShipment) => <span className={`${styles.pill} ${STATUS_CLASS[s.status]}`}>{s.status}</span>
  },
  {
    key: 'eta',
    name: 'ETA',
    minWidth: 100,
    maxWidth: 130,
    onRender: (s: IShipment) => (
      <span className={isLate(s) ? styles.late : undefined}>
        {formatDate(s.eta)}
        {isLate(s) && <span className={styles.lateTag}>Late</span>}
      </span>
    )
  }
];

const ShipmentTracker: React.FC<IShipmentTrackerProps> = ({ title, service, isDemo }) => {
  const [shipments, setShipments] = React.useState<IShipment[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [status, setStatus] = React.useState<StatusFilter>('All');
  const [query, setQuery] = React.useState<string>('');

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(undefined);
    service
      .getShipments()
      .then(
        (items) => {
          if (!cancelled) {
            setShipments(items);
            setLoading(false);
          }
        },
        (e: Error) => {
          if (!cancelled) {
            setError(e.message);
            setLoading(false);
          }
        }
      );
    return () => {
      cancelled = true;
    };
  }, [service]);

  const counts = React.useMemo(() => countByStatus(shipments), [shipments]);
  const visible = React.useMemo(() => filterShipments(shipments, status, query), [shipments, status, query]);
  const lateCount = React.useMemo(() => shipments.filter((s) => isLate(s)).length, [shipments]);

  return (
    <section className={styles.shipmentTracker}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {isDemo && <span className={styles.demoBadge}>Demo data</span>}
      </header>

      {error && <MessageBar messageBarType={MessageBarType.error}>{error}</MessageBar>}

      {loading ? (
        <Spinner size={SpinnerSize.large} label="Loading shipments…" />
      ) : (
        <>
          <div className={styles.summary} role="list" aria-label="Shipment summary">
            {SHIPMENT_STATUSES.map((s) => (
              <div key={s} role="listitem" className={`${styles.tile} ${STATUS_CLASS[s]}`}>
                <span className={styles.tileValue}>{counts[s]}</span>
                <span className={styles.tileLabel}>{s}</span>
              </div>
            ))}
            <div role="listitem" className={`${styles.tile} ${styles.lateTile}`}>
              <span className={styles.tileValue}>{lateCount}</span>
              <span className={styles.tileLabel}>Running late</span>
            </div>
          </div>

          <div className={styles.toolbar}>
            <Pivot
              selectedKey={status}
              onLinkClick={(item) => item && setStatus(item.props.itemKey as StatusFilter)}
              headersOnly
              aria-label="Filter by status"
            >
              <PivotItem itemKey="All" headerText="All" itemCount={shipments.length} />
              {SHIPMENT_STATUSES.map((s) => (
                <PivotItem key={s} itemKey={s} headerText={s} itemCount={counts[s]} />
              ))}
            </Pivot>
            <SearchBox
              className={styles.search}
              placeholder="Search reference, customer, route…"
              value={query}
              onChange={(_, v) => setQuery(v ?? '')}
            />
          </div>

          <DetailsList
            items={visible}
            columns={columns}
            selectionMode={SelectionMode.none}
            layoutMode={DetailsListLayoutMode.justified}
            getKey={(s: IShipment) => String(s.id)}
            setKey="shipments"
            ariaLabelForGrid="Shipments"
          />
          {visible.length === 0 && <p className={styles.empty}>No shipments match these filters.</p>}
        </>
      )}
    </section>
  );
};

export default ShipmentTracker;
