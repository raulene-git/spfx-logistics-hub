/** Only https, http, site-relative and in-page links. Blocks javascript: and similar. */
export function isSafeLink(value: string | undefined): boolean {
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

/** The link if it is safe, otherwise undefined. */
export function safeLink(value: string | undefined): string | undefined {
  return isSafeLink(value) ? (value as string).trim() : undefined;
}

/** Property pane validator: empty is fine, anything else must be a safe link. */
export function validateLink(value: string): string {
  return !value || isSafeLink(value) ? '' : 'Use an address that starts with https://, / or #';
}

/** "Find your way around" -> "find-your-way-around". */
export function slugify(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** "Today", "Yesterday", "3 days ago", "2 weeks ago", or a date for anything older than a month. */
export function relativeDay(iso: string, now: Date = new Date(), locale: string = 'en-GB'): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    return '';
  }
  const startOf = (x: Date): number => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (days <= 0) {
    return 'Today';
  }
  if (days === 1) {
    return 'Yesterday';
  }
  if (days < 7) {
    return `${days} days ago`;
  }
  if (days < 31) {
    const weeks = Math.round(days / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** "Amira Malik" -> "AM". */
export function initials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}
