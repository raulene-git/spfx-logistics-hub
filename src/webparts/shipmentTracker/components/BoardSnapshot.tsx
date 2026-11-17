import * as React from 'react';
import styles from './BoardSnapshot.module.scss';
import { DemoNote, Placeholder, Section } from '../../../common/components/Section';
import { pad2, safeLink } from '../../../common/links';
import type { IShipmentService } from '../services/IShipmentService';
import { countByStatus, isLate, summariseBoard } from '../utils/shipmentUtils';
import { useShipments } from './useShipments';

export interface IBoardSnapshotProps {
  eyebrow?: string;
  title: string;
  accent: string;
  boardUrl?: string;
  service: IShipmentService;
  isDemo: boolean;
}

/** "Today at a glance": the board's counts and the one thing that needs attention, linking to the full board. */
const BoardSnapshot: React.FC<IBoardSnapshotProps> = ({ eyebrow, title, accent, boardUrl, service, isDemo }) => {
  const { shipments, loading, error } = useShipments(service);
  const href = safeLink(boardUrl);
  const counts = countByStatus(shipments);
  const summary = summariseBoard(shipments);
  const attention = shipments.filter((s) => s.status === 'Exception' || isLate(s));
  const first = attention[0];

  const tiles = [
    { label: 'Booked', value: counts.Booked, note: 'Waiting to leave', className: styles.booked },
    { label: 'In transit', value: counts['In transit'], note: 'On the road', className: styles.inTransit },
    { label: 'Delivered', value: counts.Delivered, note: 'Arrived safely', className: styles.delivered }
  ];

  return (
    <Section eyebrow={eyebrow} title={title} accent={accent} anchor="today" linkText={href ? 'Open the dispatch board' : undefined} linkUrl={href}>
      {loading && <p className={styles.muted}>Loading the board…</p>}
      {error && <Placeholder>{error}</Placeholder>}
      {!loading && !error && (
        <div className={styles.grid}>
          {tiles.map((t) => (
            <div key={t.label} className={`${styles.tile} ${t.className}`}>
              <span className={styles.label}>{t.label}</span>
              <span className={styles.value}>{pad2(t.value)}</span>
              <span className={styles.muted}>{t.note}</span>
            </div>
          ))}
          <div className={styles.alert}>
            <span className={styles.alertLabel}>{summary.needsLook === 0 ? 'All clear' : `${summary.needsLook} need${summary.needsLook === 1 ? 's' : ''} a look`}</span>
            <span className={styles.alertText}>
              {first
                ? `${first.reference} ${first.status === 'Exception' ? 'has an exception' : 'is running late'}: ${first.origin} to ${first.destination}.`
                : 'Nothing is late and there are no exceptions.'}
            </span>
            {href && first && (
              <a className={styles.alertLink} href={href}>
                Open the board <span aria-hidden="true">→</span>
              </a>
            )}
          </div>
        </div>
      )}
      {isDemo && !loading && <DemoNote>Fictional demo data · Dispatch Board</DemoNote>}
    </Section>
  );
};

export default BoardSnapshot;
