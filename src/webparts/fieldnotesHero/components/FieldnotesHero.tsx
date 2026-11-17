import * as React from 'react';
import styles from './FieldnotesHero.module.scss';
import type { IFieldnotesHeroProps } from './IFieldnotesHeroProps';
import HeroMonitor from './HeroMonitor';
import { findSectionElement } from '../utils/heroUtils';

const FieldnotesHero: React.FC<IFieldnotesHeroProps> = (props) => {
  const {
    dateText, location, siteTitle, greeting, headline, accentWord, description,
    primaryText, primaryUrl, primaryNewTab, secondaryText, secondaryHref,
    showIllustration, isEditMode, missingLinkHint
  } = props;

  /** In-page links scroll smoothly; SharePoint scrolls a container, not the window, so the browser's own jump is unreliable. */
  const onSecondaryClick = (event: React.MouseEvent<HTMLAnchorElement>): void => {
    if (!secondaryHref || secondaryHref.charAt(0) !== '#') {
      return;
    }
    const target = findSectionElement(document, secondaryHref);
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', secondaryHref);
      }
    }
  };

  return (
    <section className={styles.hero} aria-label={siteTitle}>
      <div className={styles.inner}>
        <div className={styles.meta}>
          <span>{location ? `${dateText} · ${location}` : dateText}</span>
          <span>{siteTitle} / Home</span>
        </div>

        <div className={styles.body}>
          <div className={styles.copy}>
            <h1 className={styles.headline}>
              {greeting && <span className={styles.greeting}>{greeting}</span>}
              <span className={styles.headlineText}>{headline}</span>
              {accentWord && <> <em className={styles.accent}>{accentWord}</em></>}
            </h1>

            {description && <p className={styles.description}>{description}</p>}

            <div className={styles.actions}>
              {primaryUrl && primaryText && (
                <a
                  className={styles.primary}
                  href={primaryUrl}
                  target={primaryNewTab ? '_blank' : undefined}
                  rel={primaryNewTab ? 'noopener noreferrer' : undefined}
                  data-interception={primaryNewTab ? 'off' : undefined}
                >
                  {primaryText}
                  <span aria-hidden="true">→</span>
                </a>
              )}
              {!primaryUrl && isEditMode && <span className={styles.hint}>{missingLinkHint}</span>}

              {secondaryHref && secondaryText && (
                <a className={styles.secondary} href={secondaryHref} onClick={onSecondaryClick}>
                  {secondaryText}
                  <span aria-hidden="true">{secondaryHref.charAt(0) === '#' ? ' ↓' : ' ↗'}</span>
                </a>
              )}
            </div>
          </div>

          {showIllustration && <HeroMonitor />}
        </div>
      </div>
    </section>
  );
};

export default FieldnotesHero;
