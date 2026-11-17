import * as React from 'react';
import styles from './CalloutBand.module.scss';
import { safeLink } from '../../../common/links';
import type { BrandColour } from '../../../common/propertyPane';

export interface ICalloutLink {
  text: string;
  url: string;
}

export interface ICalloutBandProps {
  colour: BrandColour;
  eyebrow?: string;
  title?: string;
  accent?: string;
  body?: string;
  links: ICalloutLink[];
  isEditMode: boolean;
}

const COLOUR_CLASS: Record<string, string> = {
  yellow: styles.yellow,
  pink: styles.pink,
  green: styles.green,
  navy: styles.navy
};

const CalloutBand: React.FC<ICalloutBandProps> = ({ colour, eyebrow, title, accent, body, links, isEditMode }) => {
  const visibleLinks = links
    .map((l) => ({ text: (l.text || '').trim(), href: safeLink(l.url) }))
    .filter((l) => l.text && l.href) as { text: string; href: string }[];
  const missingLinks = isEditMode && links.some((l) => (l.text || '').trim() && !safeLink(l.url));

  return (
    <section className={`${styles.band} ${COLOUR_CLASS[colour] || styles.yellow}`}>
      <div className={styles.inner}>
        <div className={styles.copy}>
          {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
          {(title || accent) && (
            <p className={styles.title}>
              {title}
              {accent && <> <em className={styles.accent}>{accent}</em></>}
            </p>
          )}
          {body && <p className={styles.body}>{body}</p>}
        </div>

        {visibleLinks.length > 0 && (
          <nav className={styles.links} aria-label={eyebrow || title || 'Links'}>
            {visibleLinks.map((l, i) => (
              <a key={i} href={l.href} className={i === 0 ? styles.primaryLink : styles.link}>
                {l.text} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </nav>
        )}
        {missingLinks && <p className={styles.hint}>Some links have text but no address yet, so they are hidden. This note only shows while editing.</p>}
      </div>
    </section>
  );
};

export default CalloutBand;
