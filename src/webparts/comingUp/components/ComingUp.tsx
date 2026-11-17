import * as React from 'react';
import styles from './ComingUp.module.scss';
import { Placeholder, Section } from '../../../common/components/Section';
import { safeLink } from '../../../common/links';
import { parseEventDate, upcomingEvents, type IEventEntry } from '../utils/events';

export interface IComingUpProps {
  eyebrow?: string;
  title?: string;
  accent?: string;
  anchor?: string;
  events: IEventEntry[];
  max: number;
  hidePast: boolean;
  locale: string;
}

const ComingUp: React.FC<IComingUpProps> = ({ eyebrow, title, accent, anchor, events, max, hidePast, locale }) => {
  const shown = upcomingEvents(events, max, hidePast);

  return (
    <Section eyebrow={eyebrow} title={title} accent={accent} anchor={anchor || 'coming-up'} compact>
      {shown.length === 0 ? (
        <Placeholder>Nothing coming up. Add events in the web part settings.</Placeholder>
      ) : (
        <ol className={styles.list}>
          {shown.map((e, i) => {
            const d = parseEventDate(e.date) as Date;
            const href = safeLink(e.url);
            const fullDate = d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
            return (
              <li key={i} className={styles.item}>
                <time className={styles.date} dateTime={e.date} aria-label={fullDate}>
                  <span className={styles.day}>{d.getDate() < 10 ? `0${d.getDate()}` : d.getDate()}</span>
                  <span className={styles.month}>{d.toLocaleDateString(locale, { month: 'short' }).replace('.', '').toUpperCase()}</span>
                </time>
                <div>
                  {href ? (
                    <a className={styles.title} href={href}>
                      {e.title}
                    </a>
                  ) : (
                    <span className={styles.title}>{e.title}</span>
                  )}
                  {e.detail && <span className={styles.detail}>{e.detail}</span>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Section>
  );
};

export default ComingUp;
