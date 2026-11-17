import * as React from 'react';
import styles from './ItHelp.module.scss';
import Band from './Band';
import { PriorityChip, relativeTime, StatusChip } from './Chips';
import { TICKET_STATUSES, type ITicket, type IWorklog, type TicketStatus } from '../models/tickets';
import type { ITicketChange, ITicketService } from '../services/ITicketService';
import { countByStatus, filterTickets, isUrgent, queueSummary, sortQueue, ticketRef, type QueueFilter } from '../utils/ticketUtils';

export interface ITicketQueueProps {
  service: ITicketService;
  titleId: string;
  metaLeft: string;
  metaRight: string;
  switcher?: React.ReactNode;
}

const TILE_CLASS: Record<TicketStatus, string> = {
  Open: styles.tOpen,
  'In progress': styles.tProgress,
  Resolved: styles.tResolved,
  Closed: styles.tClosed
};

const FILTER_LABEL: Record<QueueFilter, string> = {
  All: 'All tickets',
  Open: 'Open',
  'In progress': 'In progress',
  Resolved: 'Resolved',
  Closed: 'Closed',
  Urgent: 'Urgent'
};

const pad2 = (n: number): string => (n < 10 ? `0${n}` : String(n));

let idCounter = 0;

const TicketQueue: React.FC<ITicketQueueProps> = ({ service, titleId, metaLeft, metaRight, switcher }) => {
  const [tickets, setTickets] = React.useState<ITicket[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [filter, setFilter] = React.useState<QueueFilter>('All');
  const [query, setQuery] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<number | undefined>(undefined);
  const [worklogs, setWorklogs] = React.useState<IWorklog[] | undefined>(undefined);
  const [note, setNote] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | undefined>(undefined);
  const ids = React.useMemo(() => {
    idCounter += 1;
    return { search: `fn-queue-search-${idCounter}`, note: `fn-queue-note-${idCounter}`, detail: `fn-queue-detail-${idCounter}` };
  }, []);
  const detailRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    service.getAllTickets().then(
      (all) => {
        if (!cancelled) {
          setTickets(sortQueue(all));
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

  React.useEffect(() => {
    if (selectedId === undefined) {
      return;
    }
    let cancelled = false;
    setWorklogs(undefined);
    service.getWorklogs(selectedId).then(
      (logs) => !cancelled && setWorklogs(logs),
      (e: Error) => {
        if (!cancelled) {
          setWorklogs([]);
          setActionError(e.message);
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [service, selectedId]);

  const counts = React.useMemo(() => countByStatus(tickets), [tickets]);
  const urgent = React.useMemo(() => tickets.filter(isUrgent).length, [tickets]);
  const visible = React.useMemo(() => filterTickets(tickets, filter, query), [tickets, filter, query]);
  const selected = tickets.filter((t) => t.id === selectedId)[0];

  const select = (id: number): void => {
    setSelectedId(id);
    setNote('');
    setActionError(undefined);
    // On narrow pages the detail sits under the list, so bring it into view.
    if (detailRef.current && detailRef.current.getBoundingClientRect().top > window.innerHeight) {
      detailRef.current.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  };

  const reloadLogs = (id: number): Promise<void> => service.getWorklogs(id).then(setWorklogs);

  const change = (c: ITicketChange): void => {
    if (!selected || busy) {
      return;
    }
    setBusy(true);
    setActionError(undefined);
    service
      .updateTicket(selected.id, c)
      .then((updated) => {
        setTickets((all) => sortQueue(all.map((t) => (t.id === updated.id ? updated : t))));
        return reloadLogs(updated.id);
      })
      .catch((e: Error) => setActionError(e.message))
      .then(() => setBusy(false), () => setBusy(false));
  };

  const addNote = (e: React.FormEvent): void => {
    e.preventDefault();
    const message = note.trim();
    if (!selected || !message || busy) {
      return;
    }
    setBusy(true);
    setActionError(undefined);
    service
      .addWorklog(selected.id, message)
      .then(() => {
        setNote('');
        return reloadLogs(selected.id);
      })
      .catch((err: Error) => setActionError(err.message))
      .then(() => setBusy(false), () => setBusy(false));
  };

  const tiles: { key: QueueFilter; label: string; value: number; className: string }[] = [
    ...TICKET_STATUSES.map((s) => ({ key: s as QueueFilter, label: s, value: counts[s], className: TILE_CLASS[s] })),
    { key: 'Urgent', label: 'Urgent', value: urgent, className: styles.tUrgent }
  ];

  return (
    <>
      <Band
        titleId={titleId}
        metaLeft={metaLeft}
        metaRight={metaRight}
        switcher={switcher}
        title="The"
        accent="queue."
        lede={loading ? 'Loading the queue…' : error ? 'The queue could not load.' : queueSummary(tickets)}
      >
        {!loading && !error && (
          <div className={styles.tiles} role="group" aria-label="Filter by status">
            {tiles.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`${styles.tile} ${t.className}`}
                aria-pressed={filter === t.key}
                onClick={() => setFilter((f) => (f === t.key ? 'All' : t.key))}
              >
                <span className={styles.tileValue}>{pad2(t.value)}</span>
                <span className={styles.tileLabel}>{t.label}</span>
              </button>
            ))}
          </div>
        )}
      </Band>

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
                  {FILTER_LABEL[filter]} · {visible.length} of {tickets.length}
                </span>
                {filter !== 'All' && (
                  <button type="button" className={styles.linkButton} onClick={() => setFilter('All')}>
                    Clear filter
                  </button>
                )}
              </div>
              <div className={styles.search}>
                <label htmlFor={ids.search}>Search</label>
                <input
                  id={ids.search}
                  type="search"
                  placeholder="Ticket, person, category…"
                  autoComplete="off"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.queue}>
              <ul className={styles.list} aria-label="Tickets">
                {visible.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      className={styles.row}
                      aria-current={t.id === selectedId ? 'true' : undefined}
                      aria-controls={ids.detail}
                      onClick={() => select(t.id)}
                    >
                      <span className={styles.rowTop}>
                        <span className={styles.ref}>{ticketRef(t.id)}</span>
                        <span className={styles.rowChips}>
                          <PriorityChip priority={t.priority} />
                          <StatusChip status={t.status} />
                        </span>
                      </span>
                      <span className={styles.rowTitle}>{t.title}</span>
                      <span className={styles.rowMeta}>
                        {[t.requester, t.category, t.depot, relativeTime(t.created)].filter(Boolean).join(' · ')}
                        {t.assignee ? ` · With ${t.assignee}` : ' · Unassigned'}
                      </span>
                    </button>
                  </li>
                ))}
                {visible.length === 0 && <li className={styles.empty}>No tickets match. Try another filter or search.</li>}
              </ul>

              <div id={ids.detail} ref={detailRef} className={styles.detail} aria-live="polite">
                {!selected ? (
                  <p className={styles.detailEmpty}>Pick a ticket to see everything the requester told us, change its status and add notes.</p>
                ) : (
                  <>
                    <div className={styles.detailHead}>
                      <span className={styles.ref}>
                        {ticketRef(selected.id)} · {selected.type}
                      </span>
                      <h3 className={styles.detailTitle}>{selected.title}</h3>
                      <span className={styles.rowChips}>
                        <PriorityChip priority={selected.priority} />
                        <StatusChip status={selected.status} />
                      </span>
                    </div>

                    <dl className={styles.dl}>
                      <dt>Raised by</dt>
                      <dd>
                        {selected.requester || 'Unknown'}, {relativeTime(selected.created).toLowerCase()}
                      </dd>
                      {selected.depot && (
                        <>
                          <dt>Where</dt>
                          <dd>{selected.depot}</dd>
                        </>
                      )}
                      <dt>Category</dt>
                      <dd>{selected.category || 'None'}</dd>
                      <dt>Assigned to</dt>
                      <dd>
                        {selected.assignee || 'Nobody yet'}
                        <button type="button" className={styles.linkButton} disabled={busy} onClick={() => change({ assignToMe: true })}>
                          Assign to me
                        </button>
                      </dd>
                      {selected.details.map((d) => (
                        <React.Fragment key={d.label}>
                          <dt>{d.label}</dt>
                          <dd>{d.value}</dd>
                        </React.Fragment>
                      ))}
                    </dl>

                    {selected.description && <p className={styles.desc}>{selected.description}</p>}

                    <div className={styles.statusGroup} role="group" aria-label="Change status">
                      {TICKET_STATUSES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={styles.statusBtn}
                          aria-pressed={selected.status === s}
                          disabled={busy}
                          onClick={() => selected.status !== s && change({ status: s })}
                        >
                          {s}
                        </button>
                      ))}
                    </div>

                    {actionError && (
                      <div className={styles.error} role="alert">
                        {actionError}
                      </div>
                    )}

                    <h4 className={styles.worklogTitle}>Worklog</h4>
                    {!worklogs && <p className={styles.empty}>Loading…</p>}
                    {worklogs && worklogs.length === 0 && <p className={styles.empty}>No notes yet.</p>}
                    {worklogs && worklogs.length > 0 && (
                      <ol className={styles.worklog}>
                        {worklogs.map((w) => (
                          <li key={w.id} className={styles.log}>
                            <span className={styles.logMeta}>
                              {w.author} · {relativeTime(w.created)}
                            </span>
                            {w.message}
                          </li>
                        ))}
                      </ol>
                    )}

                    <form className={styles.noteBox} onSubmit={addNote}>
                      <label htmlFor={ids.note} className={styles.fieldLabel}>
                        Add a note
                      </label>
                      <textarea
                        id={ids.note}
                        className={styles.input}
                        rows={3}
                        placeholder="What you checked, what you changed, what's next…"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                      <button type="submit" className={styles.primary} disabled={busy || !note.trim()}>
                        Add to worklog
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>

            {service.isDemo && <p className={styles.foot}>Demo data. All people and tickets are made up, and changes reset when the page reloads.</p>}
          </>
        )}
      </div>
    </>
  );
};

export default TicketQueue;
