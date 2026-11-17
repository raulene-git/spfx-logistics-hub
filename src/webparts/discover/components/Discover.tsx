import * as React from 'react';
import styles from './Discover.module.scss';
import { Placeholder, Section } from '../../../common/components/Section';
import { pad2, safeLink } from '../../../common/links';
import type { BrandColour } from '../../../common/propertyPane';
import type { HubSitesService } from '../services/HubSitesService';

export interface IDiscoverCard {
  title: string;
  accent: string;
  description: string;
  url: string;
  colour: BrandColour;
  comingSoon: boolean;
}

export interface IDiscoverProps {
  eyebrow?: string;
  title?: string;
  accent?: string;
  anchor?: string;
  linkText?: string;
  linkUrl?: string;
  source: 'manual' | 'hub';
  cards: IDiscoverCard[];
  hub?: { service: HubSitesService; webUrl: string; hubSiteId: string };
  isEditMode: boolean;
}

const COLOUR_CLASS: Record<BrandColour, string> = {
  green: styles.green,
  yellow: styles.yellow,
  pink: styles.pink,
  sage: styles.sage,
  navy: styles.navy,
  white: styles.white
};

const HUB_COLOURS: BrandColour[] = ['green', 'pink', 'yellow', 'sage', 'navy', 'white'];

const Discover: React.FC<IDiscoverProps> = (props) => {
  const { eyebrow, title, accent, anchor, linkText, linkUrl, source, cards, hub, isEditMode } = props;
  const [hubCards, setHubCards] = React.useState<IDiscoverCard[] | undefined>(undefined);
  const [error, setError] = React.useState<string | undefined>(undefined);

  const hubService = hub?.service;
  const hubWebUrl = hub?.webUrl;
  const hubSiteId = hub?.hubSiteId;

  React.useEffect(() => {
    if (source !== 'hub' || !hubService || !hubWebUrl || !hubSiteId) {
      return;
    }
    let cancelled = false;
    setHubCards(undefined);
    setError(undefined);
    hubService.getSites(hubWebUrl, hubSiteId, hubWebUrl).then(
      (sites) =>
        !cancelled &&
        setHubCards(
          sites.map((s, i) => ({ title: s.title, accent: '', description: s.description, url: s.url, colour: HUB_COLOURS[i % HUB_COLOURS.length], comingSoon: false }))
        ),
      (e: Error) => {
        if (!cancelled) {
          setError(e.message);
          setHubCards([]);
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [source, hubService, hubWebUrl, hubSiteId]);

  const shown = source === 'hub' ? hubCards || [] : cards.filter((c) => (c.title || '').trim());

  return (
    <Section eyebrow={eyebrow} title={title} accent={accent} anchor={anchor || 'discover'} linkText={linkText} linkUrl={linkUrl}>
      {source === 'hub' && !hub && <Placeholder>{'This site isn’t part of a hub yet, so there are no sites to list. Register it as a hub or switch to “Pick the cards myself”.'}</Placeholder>}
      {source === 'hub' && hub && !hubCards && <p className={styles.loading}>Finding the sites in this hub…</p>}
      {error && <Placeholder>{error}</Placeholder>}
      {source === 'hub' && hubCards && hubCards.length === 0 && !error && (
        <Placeholder>No other sites are connected to this hub yet. New sites appear here a few minutes after they join.</Placeholder>
      )}

      {shown.length > 0 && (
        <ul className={styles.grid}>
          {shown.map((c, i) => {
            const href = c.comingSoon ? undefined : safeLink(c.url);
            const label = c.comingSoon ? `Site ${pad2(i + 1)} · Coming soon` : `Site ${pad2(i + 1)}`;
            const body = (
              <>
                <span className={styles.label}>{label}</span>
                <span>
                  <span className={styles.cardTitle}>
                    {c.title}
                    {c.accent && <> <em className={styles.accent}>{c.accent}</em></>}
                  </span>
                  {c.description && <span className={styles.description}>{c.description}</span>}
                </span>
                {href && (
                  <span className={styles.arrow} aria-hidden="true">
                    ↗
                  </span>
                )}
              </>
            );
            return (
              <li key={i}>
                {href ? (
                  <a className={`${styles.card} ${COLOUR_CLASS[c.colour] || styles.green}`} href={href}>
                    {body}
                  </a>
                ) : (
                  <div className={`${styles.card} ${COLOUR_CLASS[c.colour] || styles.green} ${!c.comingSoon && isEditMode ? styles.unlinked : ''}`}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
};

export default Discover;
