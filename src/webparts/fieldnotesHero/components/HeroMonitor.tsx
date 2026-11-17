import * as React from 'react';
import styles from './FieldnotesHero.module.scss';
import demoShipments from '../../shipmentTracker/services/demoShipments';
import { countByStatus } from '../../shipmentTracker/utils/shipmentUtils';

const counts = countByStatus(demoShipments);
const moving = demoShipments.filter((s) => s.status === 'In transit' || s.status === 'Booked').slice(0, 2);

/** Decorative retro monitor showing a mini dispatch board, built from the Shipment Tracker demo data. */
const HeroMonitor: React.FC = () => (
  <div className={styles.illustration} aria-hidden="true">
    <div className={styles.monitor}>
      <div className={styles.screen}>
        <div className={styles.screenBar}>
          <span>fieldnotes / dispatch</span>
          <span>● ● ●</span>
        </div>
        <div className={styles.screenTitle}>
          Dispatch <em>board</em>
        </div>
        <div className={styles.tiles}>
          <div className={styles.tileGreen}><small>BOOKED</small>{pad(counts.Booked)}</div>
          <div className={styles.tileYellow}><small>MOVING</small>{pad(counts['In transit'])}</div>
          <div className={styles.tilePink}><small>DONE</small>{pad(counts.Delivered)}</div>
        </div>
        {moving.map((s) => (
          <div key={s.id} className={styles.row}>
            <span>{s.reference} · {s.destination}</span>
            <span className={s.status === 'Booked' ? styles.pillGreen : styles.pillYellow}>{s.status}</span>
          </div>
        ))}
      </div>
      <div className={styles.badge}>fn</div>
    </div>
    <div className={styles.neck} />
    <div className={styles.foot} />
  </div>
);

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export default HeroMonitor;
