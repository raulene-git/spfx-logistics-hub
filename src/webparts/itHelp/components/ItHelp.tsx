import * as React from 'react';
import styles from './ItHelp.module.scss';
import RaiseTicket from './RaiseTicket';
import TicketQueue from './TicketQueue';
import type { ITicketAccess, ITicketService } from '../services/ITicketService';

export type ItHelpView = 'raise' | 'queue';

export interface IItHelpProps {
  service: ITicketService;
  siteTitle: string;
  dateText: string;
  title: string;
  accent: string;
  lede: string;
  promise: string;
  /** From the page address: ?ticket=incident opens that template, ?view=queue opens the queue for IT. */
  initialTemplate?: string;
  initialView?: ItHelpView;
}

let idCounter = 0;

const ItHelp: React.FC<IItHelpProps> = (props) => {
  const { service, siteTitle, dateText, initialView } = props;
  const [access, setAccess] = React.useState<ITicketAccess | undefined>(undefined);
  const [accessError, setAccessError] = React.useState<string | undefined>(undefined);
  const [view, setView] = React.useState<ItHelpView>('raise');
  const titleId = React.useMemo(() => `fn-ithelp-title-${(idCounter += 1)}`, []);

  React.useEffect(() => {
    let cancelled = false;
    setAccess(undefined);
    setAccessError(undefined);
    service.getAccess().then(
      (a) => {
        if (!cancelled) {
          setAccess(a);
          setView(a.canManage && initialView === 'queue' ? 'queue' : 'raise');
        }
      },
      (e: Error) => !cancelled && setAccessError(e.message)
    );
    return () => {
      cancelled = true;
    };
  }, [service, initialView]);

  const canManage = !!access?.canManage;
  const metaLeft = `${siteTitle} / IT help`;
  const metaRight = service.isDemo ? `${dateText} · Demo data` : dateText;

  const switcher = canManage ? (
    <div className={styles.switcher} role="group" aria-label="Choose a view">
      <button type="button" className={styles.switch} aria-pressed={view === 'raise'} onClick={() => setView('raise')}>
        Raise a ticket
      </button>
      <button type="button" className={styles.switch} aria-pressed={view === 'queue'} onClick={() => setView('queue')}>
        IT queue
      </button>
      <span className={styles.switchNote}>{service.isDemo ? 'Demo: everyone can preview the queue' : 'You’re in IT, so you can see the queue'}</span>
    </div>
  ) : undefined;

  const shared = { titleId, metaLeft, metaRight, switcher, service };

  return (
    <section className={styles.root} aria-labelledby={titleId}>
      {accessError ? (
        <div className={styles.inner}>
          <div className={styles.error} role="alert">
            {accessError}
          </div>
        </div>
      ) : view === 'queue' && canManage ? (
        <TicketQueue {...shared} />
      ) : (
        <RaiseTicket
          {...shared}
          title={props.title}
          accent={props.accent}
          lede={props.lede}
          promise={props.promise}
          userName={access?.userName || ''}
          initialTemplate={props.initialTemplate}
        />
      )}
    </section>
  );
};

export default ItHelp;
