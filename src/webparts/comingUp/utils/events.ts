export interface IEventEntry {
  title: string;
  /** YYYY-MM-DD */
  date: string;
  /** Free text, e.g. "09:00 · Main office and Teams". */
  detail: string;
  url: string;
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses YYYY-MM-DD as a local date, or undefined if it isn't a real date. */
export function parseEventDate(value: string): Date | undefined {
  const m = DATE_RE.exec((value || '').trim());
  if (!m) {
    return undefined;
  }
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getMonth() === Number(m[2]) - 1 ? d : undefined;
}

export function validateEventDate(value: string): string {
  return !value || parseEventDate(value) ? '' : 'Use the format YYYY-MM-DD, e.g. 2026-11-19';
}

/** Events with a title and a valid date, soonest first, optionally without past ones, capped at `max`. */
export function upcomingEvents(events: IEventEntry[], max: number, hidePast: boolean, now: Date = new Date()): IEventEntry[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return events
    .filter((e) => (e.title || '').trim() && parseEventDate(e.date))
    .filter((e) => !hidePast || (parseEventDate(e.date) as Date).getTime() >= today)
    .sort((a, b) => (parseEventDate(a.date) as Date).getTime() - (parseEventDate(b.date) as Date).getTime())
    .slice(0, max);
}
