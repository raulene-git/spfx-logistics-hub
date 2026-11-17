import * as React from 'react';
import styles from './Section.module.scss';
import { safeLink, slugify } from '../links';

export interface ISectionProps {
  /** Mono label above the title, e.g. "03 / News". */
  eyebrow?: string;
  title?: string;
  /** Shown after the title in serif italics. */
  accent?: string;
  linkText?: string;
  linkUrl?: string;
  /**
   * Name other web parts (like the hero's section link) use to jump here.
   * Defaults to the title as a slug.
   */
  anchor?: string;
  /** Less padding, for narrow columns. */
  compact?: boolean;
  className?: string;
  children?: React.ReactNode;
}

let counter = 0;

/** The shared frame for Fieldnotes section web parts: anchor, max width, and the eyebrow/title/link header. */
export const Section: React.FC<ISectionProps> = ({ eyebrow, title, accent, linkText, linkUrl, anchor, compact, className, children }) => {
  const headingId = React.useMemo(() => {
    counter += 1;
    return `fn-section-${counter}`;
  }, []);
  const label = [title, accent].filter(Boolean).join(' ');
  const anchorId = anchor || slugify(label);
  const href = safeLink(linkUrl);
  const hasHeader = !!(eyebrow || title || (href && linkText));

  return (
    <section
      className={[styles.section, compact ? styles.compact : '', className || ''].join(' ')}
      aria-labelledby={title ? headingId : undefined}
      data-fn-section={anchorId || undefined}
      data-fn-section-label={label || undefined}
    >
      <div className={styles.inner}>
        {hasHeader && (
          <div className={styles.header}>
            <div>
              {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
              {title && (
                <h2 id={headingId} className={styles.title}>
                  {title}
                  {accent && <> <em className={styles.accent}>{accent}</em></>}
                </h2>
              )}
            </div>
            {href && linkText && (
              <a className={styles.headerLink} href={href}>
                {linkText} <span aria-hidden="true">&nbsp;↗</span>
              </a>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
};

export const Placeholder: React.FC<{ children?: React.ReactNode }> = ({ children }) => <div className={styles.placeholder}>{children}</div>;

export const DemoNote: React.FC<{ children?: React.ReactNode }> = ({ children }) => <p className={styles.demoNote}>{children}</p>;
