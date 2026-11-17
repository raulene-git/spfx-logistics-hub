import * as React from 'react';
import styles from './ItHelp.module.scss';

export interface IBandProps {
  titleId: string;
  metaLeft: string;
  metaRight: string;
  title: string;
  accent?: string;
  lede: React.ReactNode;
  /** The "Raise a ticket / IT queue" switch, only passed for IT. */
  switcher?: React.ReactNode;
  children?: React.ReactNode;
}

/** The green hero band both views share: meta line, big title with the yellow accent, and a lede. */
const Band: React.FC<IBandProps> = ({ titleId, metaLeft, metaRight, title, accent, lede, switcher, children }) => (
  <div className={styles.band}>
    <div className={styles.inner}>
      <div className={styles.meta}>
        <span>{metaLeft}</span>
        <span>{metaRight}</span>
      </div>
      {switcher}
      <div className={styles.heading}>
        <h2 id={titleId} className={styles.title}>
          {title}
          {accent && <> <em className={styles.accent}>{accent}</em></>}
        </h2>
        <p className={styles.lede} aria-live="polite">
          {lede}
        </p>
      </div>
      {children}
    </div>
  </div>
);

export default Band;
