import * as React from 'react';
import styles from './News.module.scss';
import { DemoNote, Placeholder, Section } from '../../../common/components/Section';
import { relativeDay } from '../../../common/links';
import { demoNews, type INewsItem, type NewsService } from '../services/NewsService';

export interface INewsProps {
  eyebrow?: string;
  title?: string;
  accent?: string;
  anchor?: string;
  allNewsUrl?: string;
  siteUrl: string;
  count: number;
  showThumbnails: boolean;
  showDescription: boolean;
  showDemoWhenEmpty: boolean;
  service: NewsService;
  locale: string;
}

const FALLBACK_COLOURS = [styles.pink, styles.yellow, styles.sage];

/** Two words for the coloured block when a post has no image, e.g. "Route 7". */
function blockWord(item: INewsItem): string {
  if (item.topic) {
    return item.topic;
  }
  return item.title.split(/\s+/).slice(0, 2).join(' ');
}

const News: React.FC<INewsProps> = (props) => {
  const { eyebrow, title, accent, anchor, allNewsUrl, siteUrl, count, showThumbnails, showDescription, showDemoWhenEmpty, service, locale } = props;
  const [items, setItems] = React.useState<INewsItem[] | undefined>(undefined);
  const [error, setError] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    let cancelled = false;
    setItems(undefined);
    setError(undefined);
    service.getLatest(siteUrl, count).then(
      (result) => !cancelled && setItems(result),
      (e: Error) => {
        if (!cancelled) {
          setError(e.message);
          setItems([]);
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [service, siteUrl, count]);

  const usingDemo = !!items && items.length === 0 && showDemoWhenEmpty;
  const shown = usingDemo ? demoNews().slice(0, count) : items || [];

  return (
    <Section eyebrow={eyebrow} title={title} accent={accent} anchor={anchor || 'news'} linkText={allNewsUrl ? 'All news' : undefined} linkUrl={allNewsUrl}>
      {!items && <p className={styles.loading} aria-live="polite">Loading the latest news…</p>}
      {error && !usingDemo && <Placeholder>{error}</Placeholder>}
      {items && shown.length === 0 && !error && <Placeholder>No news yet. Publish a news post on this site and it appears here.</Placeholder>}

      {shown.length > 0 && (
        <ul className={styles.grid}>
          {shown.map((item, i) => {
            const meta = [item.topic || 'News', relativeDay(item.published, new Date(), locale)].filter(Boolean).join(' · ');
            const card = (
              <>
                {showThumbnails &&
                  (item.imageUrl ? (
                    <img className={styles.image} src={item.imageUrl} alt="" loading="lazy" />
                  ) : (
                    <span className={`${styles.block} ${FALLBACK_COLOURS[i % FALLBACK_COLOURS.length]}`} aria-hidden="true">
                      {blockWord(item)}
                    </span>
                  ))}
                <span className={styles.meta}>{meta}</span>
                <span className={styles.headline}>{item.title}</span>
                {showDescription && item.description && <span className={styles.description}>{item.description}</span>}
              </>
            );
            return (
              <li key={i}>
                {item.url ? (
                  <a className={styles.card} href={item.url}>
                    {card}
                  </a>
                ) : (
                  <div className={styles.card}>{card}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {usingDemo && <DemoNote>Example stories. Your first published news post replaces them automatically.</DemoNote>}
    </Section>
  );
};

export default News;
