import * as React from 'react';
import styles from './QuickLinks.module.scss';
import { Section } from '../../../common/components/Section';
import { Icon, type IconName } from '../../../common/components/Icon';
import { safeLink } from '../../../common/links';

export interface IQuickLink {
  text: string;
  url: string;
  icon: IconName;
}

export interface IQuickLinksProps {
  eyebrow?: string;
  title?: string;
  accent?: string;
  anchor?: string;
  links: IQuickLink[];
  newTab: boolean;
  isEditMode: boolean;
}

const QuickLinks: React.FC<IQuickLinksProps> = ({ eyebrow, title, accent, anchor, links, newTab, isEditMode }) => {
  const named = links.filter((l) => (l.text || '').trim());

  return (
    <Section eyebrow={eyebrow} title={title} accent={accent} anchor={anchor || 'quick-links'}>
      <ul className={styles.grid}>
        {named.map((l, i) => {
          const href = safeLink(l.url);
          const content = (
            <>
              <Icon name={l.icon} className={styles.icon} />
              <span>{l.text}</span>
            </>
          );
          return (
            <li key={i}>
              {href ? (
                <a
                  className={styles.tile}
                  href={href}
                  target={newTab ? '_blank' : undefined}
                  rel={newTab ? 'noopener noreferrer' : undefined}
                  data-interception={newTab ? 'off' : undefined}
                >
                  {content}
                </a>
              ) : (
                // No address yet: editors see a dashed tile, readers see nothing clickable.
                isEditMode && <span className={`${styles.tile} ${styles.unlinked}`}>{content}</span>
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
};

export default QuickLinks;
