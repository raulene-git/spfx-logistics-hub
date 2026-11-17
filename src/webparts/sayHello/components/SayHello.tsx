import * as React from 'react';
import styles from './SayHello.module.scss';
import { DemoNote } from '../../../common/components/Section';
import { initials, relativeDay } from '../../../common/links';
import { starterSentence, type IPeopleService, type IPerson } from '../services/people';

export interface ISayHelloProps {
  eyebrow?: string;
  service: IPeopleService;
  days: number;
  max: number;
  department?: string;
  showList: boolean;
  isDemo: boolean;
  isEditMode: boolean;
  locale: string;
}

const AVATAR_COLOURS = [styles.pink, styles.yellow, styles.sage, styles.green];

const SayHello: React.FC<ISayHelloProps> = ({ eyebrow, service, days, max, department, showList, isDemo, isEditMode, locale }) => {
  const [people, setPeople] = React.useState<IPerson[] | undefined>(undefined);
  const [error, setError] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    let cancelled = false;
    setPeople(undefined);
    setError(undefined);
    service.getNewStarters(days, max, department).then(
      (result) => !cancelled && setPeople(result),
      (e: Error) => {
        if (!cancelled) {
          setError(e.message);
          setPeople([]);
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [service, days, max, department]);

  // With nobody new, readers see nothing; editors see why.
  if (people && people.length === 0 && !isEditMode) {
    return null;
  }

  return (
    <section className={styles.card} data-fn-section="say-hello" data-fn-section-label={eyebrow || 'Say hello'}>
      {eyebrow && <h2 className={styles.eyebrow}>{eyebrow}</h2>}

      {!people && <p className={styles.sentence}>Looking for new starters…</p>}

      {people && people.length > 0 && (
        <>
          <ul className={styles.avatars} aria-hidden="true">
            {people.map((p, i) => (
              <li key={i} className={`${styles.avatar} ${AVATAR_COLOURS[i % AVATAR_COLOURS.length]}`}>
                {initials(p.name)}
              </li>
            ))}
          </ul>
          <p className={styles.sentence}>{starterSentence(people)}</p>

          {showList && (
            <ul className={styles.people}>
              {people.map((p, i) => (
                <li key={i}>
                  <span className={styles.name}>{p.name}</span>
                  <span className={styles.role}>
                    {[p.jobTitle, p.department].filter(Boolean).join(', ')}
                    {p.started && ` · joined ${relativeDay(p.started, new Date(), locale).toLowerCase()}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {people && people.length === 0 && (
        <p className={styles.sentence}>
          {error
            ? `Couldn't read new starters: ${error}. Has User.Read.All been approved in SharePoint admin > Advanced > API access?`
            : `No new starters in the last ${days} days. This card is hidden from readers until someone joins.`}
        </p>
      )}

      {isDemo && <DemoNote>Example people. Switch the source to Entra ID to show real new starters.</DemoNote>}
    </section>
  );
};

export default SayHello;
