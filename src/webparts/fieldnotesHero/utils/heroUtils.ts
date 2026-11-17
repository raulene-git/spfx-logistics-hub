export type DayPart = 'morning' | 'afternoon' | 'evening';

export function getDayPart(now: Date): DayPart {
  const hour = now.getHours();
  if (hour < 12) {
    return 'morning';
  }
  return hour < 18 ? 'afternoon' : 'evening';
}

/** e.g. "Tuesday 17 November". */
export function formatHeroDate(now: Date, locale: string = 'en-GB'): string {
  return now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Only https, http, site-relative and in-page links. Blocks javascript: and similar. */
export function isSafeLink(value: string): boolean {
  const v = (value || '').trim();
  if (!v) {
    return false;
  }
  if (v.charAt(0) === '#') {
    return v.length > 1;
  }
  if (v.charAt(0) === '/') {
    return v.charAt(1) !== '/';
  }
  return /^https?:\/\/\S+$/i.test(v);
}

export const CUSTOM_TARGET = 'custom';

/** Works out where the section link goes from the dropdown choice and the custom address. */
export function resolveSectionLink(target: string, customUrl: string): string | undefined {
  if (!target) {
    return undefined;
  }
  const href = target === CUSTOM_TARGET ? (customUrl || '').trim() : target;
  return isSafeLink(href) ? href : undefined;
}

export interface IPageSection {
  id: string;
  label: string;
}

/**
 * Finds places on the page a link can jump to: headings with an id (SharePoint gives
 * Text web part headings one) and elements marked with data-fn-section.
 */
export function findPageSections(root: ParentNode, exclude?: Element): IPageSection[] {
  const found: IPageSection[] = [];
  const seen: Record<string, boolean> = {};
  const nodes = root.querySelectorAll('h1[id], h2[id], h3[id], h4[id], [data-fn-section]');
  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i] as HTMLElement;
    if (exclude && exclude.contains(el)) {
      continue;
    }
    const id = el.getAttribute('data-fn-section') || el.id;
    const label = (el.getAttribute('data-fn-section-label') || el.textContent || '').trim();
    if (!id || !label || seen[id]) {
      continue;
    }
    seen[id] = true;
    found.push({ id, label: label.length > 60 ? label.slice(0, 57) + '…' : label });
  }
  return found;
}

/** The element a "#id" link points at, by id or data-fn-section. */
export function findSectionElement(doc: Document, hash: string): HTMLElement | undefined {
  const id = hash.replace(/^#/, '');
  if (!id) {
    return undefined;
  }
  const byId = doc.getElementById(id);
  if (byId) {
    return byId;
  }
  const all = doc.querySelectorAll('[data-fn-section]');
  for (let i = 0; i < all.length; i++) {
    if (all[i].getAttribute('data-fn-section') === id) {
      return all[i] as HTMLElement;
    }
  }
  return undefined;
}
