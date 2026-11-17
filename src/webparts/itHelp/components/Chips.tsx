import * as React from 'react';
import styles from './ItHelp.module.scss';
import type { TicketPriority, TicketStatus } from '../models/tickets';
import { relativeDay } from '../../../common/links';

const STATUS_CLASS: Record<TicketStatus, string> = {
  Open: styles.sOpen,
  'In progress': styles.sProgress,
  Resolved: styles.sResolved,
  Closed: styles.sClosed
};

const PRIORITY_CLASS: Record<TicketPriority, string> = {
  Critical: styles.pCritical,
  High: styles.pHigh,
  Medium: styles.pMedium,
  Low: styles.pLow
};

export const StatusChip: React.FC<{ status: TicketStatus }> = ({ status }) => (
  <span className={`${styles.chip} ${STATUS_CLASS[status]}`}>{status}</span>
);

export const PriorityChip: React.FC<{ priority: TicketPriority }> = ({ priority }) => (
  <span className={`${styles.chip} ${PRIORITY_CLASS[priority]}`}>{priority}</span>
);

/** "Just now", "25 min ago", "3 hours ago", then "Yesterday", "4 days ago"... */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) {
    return '';
  }
  const minutes = Math.floor((now.getTime() - then) / 60000);
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 12) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  return relativeDay(iso, now);
}
