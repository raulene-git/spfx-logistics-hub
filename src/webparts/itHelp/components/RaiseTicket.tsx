import * as React from 'react';
import styles from './ItHelp.module.scss';
import Band from './Band';
import { relativeTime, StatusChip } from './Chips';
import { findTemplate, TEMPLATES, type Answers, type ITemplateField, type ITicketTemplate, type TemplateColour } from '../models/templates';
import type { ITicket } from '../models/tickets';
import type { ITicketService } from '../services/ITicketService';
import { buildTicket, ticketRef, validateAnswers } from '../utils/ticketUtils';

export interface IRaiseTicketProps {
  service: ITicketService;
  titleId: string;
  metaLeft: string;
  metaRight: string;
  switcher?: React.ReactNode;
  title: string;
  accent: string;
  lede: string;
  promise: string;
  userName: string;
  initialTemplate?: string;
}

const CARD_CLASS: Record<TemplateColour, string> = {
  pink: styles.cPink,
  yellow: styles.cYellow,
  sage: styles.cSage,
  cream: styles.cCream
};

let idCounter = 0;

const RaiseTicket: React.FC<IRaiseTicketProps> = (props) => {
  const { service, titleId, metaLeft, metaRight, switcher, promise, initialTemplate } = props;
  const [template, setTemplate] = React.useState<ITicketTemplate | undefined>(() => findTemplate(initialTemplate));
  const [answers, setAnswers] = React.useState<Answers>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [tried, setTried] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | undefined>(undefined);
  const [raised, setRaised] = React.useState<ITicket | undefined>(undefined);
  const [mine, setMine] = React.useState<{ tickets: ITicket[]; loading: boolean; error?: string }>({ tickets: [], loading: true });
  const formRef = React.useRef<HTMLDivElement>(null);
  const prefix = React.useMemo(() => `fn-ticket-${(idCounter += 1)}`, []);

  const loadMine = React.useCallback(() => {
    setMine((m) => ({ ...m, loading: true }));
    service.getMyTickets().then(
      (tickets) => setMine({ tickets, loading: false }),
      (e: Error) => setMine({ tickets: [], loading: false, error: e.message })
    );
  }, [service]);

  React.useEffect(loadMine, [loadMine]);

  const choose = (t: ITicketTemplate): void => {
    setTemplate(t);
    setAnswers({});
    setErrors({});
    setTried(false);
    setRaised(undefined);
    setSaveError(undefined);
    window.setTimeout(() => formRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 0);
  };

  const setAnswer = (key: string, value: string): void => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    if (tried && template) {
      setErrors(validateAnswers(template, next));
    }
  };

  const submit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!template || saving) {
      return;
    }
    const found = validateAnswers(template, answers);
    setTried(true);
    setErrors(found);
    const firstBad = template.fields.filter((f) => found[f.key])[0];
    if (firstBad) {
      document.getElementById(`${prefix}-${firstBad.key}`)?.focus();
      return;
    }
    setSaving(true);
    setSaveError(undefined);
    service.createTicket(buildTicket(template, answers)).then(
      (ticket) => {
        setSaving(false);
        setRaised(ticket);
        setTemplate(undefined);
        loadMine();
      },
      (err: Error) => {
        setSaving(false);
        setSaveError(err.message);
      }
    );
  };

  const renderControl = (f: ITemplateField): React.ReactNode => {
    const id = `${prefix}-${f.key}`;
    const value = answers[f.key] || '';
    const describedBy = [f.hint ? `${id}-hint` : '', errors[f.key] ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
    const common = { id, 'aria-describedby': describedBy, 'aria-invalid': !!errors[f.key] };

    if (f.kind === 'textarea') {
      return <textarea {...common} className={styles.input} rows={5} value={value} onChange={(e) => setAnswer(f.key, e.target.value)} />;
    }
    if (f.kind === 'choice' && (f.options || []).length > 4) {
      return (
        <select {...common} className={styles.input} value={value} onChange={(e) => setAnswer(f.key, e.target.value)}>
          <option value="">Choose…</option>
          {(f.options || []).map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      );
    }
    if (f.kind === 'choice' || f.kind === 'multi') {
      const picked = value ? value.split('|') : [];
      const toggle = (o: string): void => {
        if (f.kind === 'choice') {
          setAnswer(f.key, o);
        } else {
          const next = picked.indexOf(o) === -1 ? [...picked, o] : picked.filter((p) => p !== o);
          setAnswer(f.key, (f.options || []).filter((x) => next.indexOf(x) !== -1).join('|'));
        }
      };
      return (
        <div className={styles.pills} role={f.kind === 'choice' ? 'radiogroup' : 'group'} aria-labelledby={`${id}-label`} aria-describedby={describedBy}>
          {(f.options || []).map((o, i) => (
            <label key={o} className={`${styles.pill} ${picked.indexOf(o) !== -1 ? styles.pillOn : ''}`}>
              <input
                id={i === 0 ? id : undefined}
                type={f.kind === 'choice' ? 'radio' : 'checkbox'}
                name={id}
                checked={picked.indexOf(o) !== -1}
                onChange={() => toggle(o)}
              />
              <span>{o}</span>
            </label>
          ))}
        </div>
      );
    }
    return (
      <input
        {...common}
        className={styles.input}
        type={f.kind === 'date' ? 'date' : 'text'}
        placeholder={f.placeholder}
        value={value}
        onChange={(e) => setAnswer(f.key, e.target.value)}
      />
    );
  };

  const groupKinds = (f: ITemplateField): boolean => f.kind === 'multi' || (f.kind === 'choice' && (f.options || []).length <= 4);

  return (
    <>
      <Band
        titleId={titleId}
        metaLeft={metaLeft}
        metaRight={metaRight}
        switcher={switcher}
        title={props.title}
        accent={props.accent}
        lede={props.lede}
      >
        <div className={styles.cards} role="group" aria-label="What do you need help with?">
          {TEMPLATES.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`${styles.card} ${CARD_CLASS[t.colour]}`}
              aria-pressed={template?.key === t.key}
              onClick={() => choose(t)}
            >
              <span className={styles.cardType}>{t.type}</span>
              <span className={styles.cardName}>
                {t.name} <em>{t.accent}</em>
              </span>
              <span className={styles.cardBlurb}>{t.blurb}</span>
              <span className={styles.cardArrow} aria-hidden="true">
                →
              </span>
            </button>
          ))}
        </div>
      </Band>

      <div className={`${styles.inner} ${styles.body}`} ref={formRef}>
        {raised && (
          <div className={styles.success} role="status">
            <span className={styles.successRef}>{ticketRef(raised.id)}</span>
            <div>
              <h3 className={styles.successTitle}>Thanks, your ticket is in.</h3>
              <p>
                {'“'}
                {raised.title}
                {'” is with the IT team as '}
                {raised.priority.toLowerCase()}
                {` priority. ${promise}`}
              </p>
            </div>
          </div>
        )}

        {template && (
          <div className={styles.formLayout}>
            <form className={styles.form} onSubmit={submit} noValidate>
              <div className={styles.formHead}>
                <span className={styles.cardType}>{template.type}</span>
                <h3 className={styles.formTitle}>
                  {template.name} <em>{template.accent}</em>
                </h3>
                <button type="button" className={styles.linkButton} onClick={() => setTemplate(undefined)}>
                  Cancel
                </button>
              </div>

              <div className={styles.fields}>
                {template.fields.map((f) => {
                  const id = `${prefix}-${f.key}`;
                  return (
                    <div key={f.key} className={`${styles.field} ${f.wide ? styles.wide : ''}`}>
                      {groupKinds(f) ? (
                        <span id={`${id}-label`} className={styles.fieldLabel}>
                          {f.label}
                          {f.required && <span className={styles.req}> *</span>}
                        </span>
                      ) : (
                        <label htmlFor={id} className={styles.fieldLabel}>
                          {f.label}
                          {f.required && <span className={styles.req}> *</span>}
                        </label>
                      )}
                      {f.hint && (
                        <span id={`${id}-hint`} className={styles.hint}>
                          {f.hint}
                        </span>
                      )}
                      {renderControl(f)}
                      {errors[f.key] && (
                        <span id={`${id}-error`} className={styles.fieldError}>
                          {errors[f.key]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {saveError && (
                <div className={styles.error} role="alert">
                  {saveError}
                </div>
              )}

              <div className={styles.actions}>
                <button type="submit" className={styles.primary} disabled={saving}>
                  {saving ? 'Sending…' : 'Send to IT'}
                  {!saving && <span aria-hidden="true"> →</span>}
                </button>
                <span className={styles.hint}>
                  {'Raised as '}
                  {props.userName || 'you'}. * means required.
                </span>
              </div>
            </form>

            <aside className={styles.aside} aria-label="What happens next">
              <h3 className={styles.asideTitle}>What happens next</h3>
              <ol className={styles.steps}>
                <li>
                  <span className={styles.stepNum}>01</span>The IT team gets it straight away, with everything you told us.
                </li>
                <li>
                  <span className={styles.stepNum}>02</span>
                  {promise}
                </li>
                <li>
                  <span className={styles.stepNum}>03</span>You can follow it below under My tickets.
                </li>
              </ol>
            </aside>
          </div>
        )}

        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>My tickets</h3>
            {!template && !raised && <span className={styles.hint}>Pick an option above to raise a new one.</span>}
          </div>
          {mine.loading && <p className={styles.empty}>Loading your tickets…</p>}
          {mine.error && (
            <div className={styles.error} role="alert">
              {mine.error}
            </div>
          )}
          {!mine.loading && !mine.error && mine.tickets.length === 0 && <p className={styles.empty}>{'You haven’t raised any tickets yet.'}</p>}
          {!mine.loading && mine.tickets.length > 0 && (
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Ticket</th>
                    <th scope="col">Summary</th>
                    <th scope="col">Type</th>
                    <th scope="col">Status</th>
                    <th scope="col">Raised</th>
                  </tr>
                </thead>
                <tbody>
                  {mine.tickets.map((t) => (
                    <tr key={t.id}>
                      <td className={styles.ref}>{ticketRef(t.id)}</td>
                      <td>{t.title}</td>
                      <td>{t.type}</td>
                      <td>
                        <StatusChip status={t.status} />
                      </td>
                      <td>{relativeTime(t.created)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {service.isDemo && <p className={styles.foot}>Demo data. Tickets you raise here stay in this browser tab and aren’t sent anywhere.</p>}
      </div>
    </>
  );
};

export default RaiseTicket;
