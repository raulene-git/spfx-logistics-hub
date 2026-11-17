import { parseEventDate, upcomingEvents, validateEventDate, type IEventEntry } from './events';

const ev = (title: string, date: string): IEventEntry => ({ title, date, detail: '', url: '' });

describe('parseEventDate', () => {
  it('accepts real YYYY-MM-DD dates only', () => {
    expect(parseEventDate('2026-11-19')?.getDate()).toBe(19);
    expect(parseEventDate('2026-02-30')).toBeUndefined();
    expect(parseEventDate('19/11/2026')).toBeUndefined();
  });

  it('gives a friendly validation message', () => {
    expect(validateEventDate('')).toBe('');
    expect(validateEventDate('2026-11-19')).toBe('');
    expect(validateEventDate('tomorrow')).not.toBe('');
  });
});

describe('upcomingEvents', () => {
  const now = new Date(2026, 10, 17, 15, 0);
  const events = [ev('Winter social', '2026-12-05'), ev('Old briefing', '2026-11-10'), ev('Today', '2026-11-17'), ev('', '2026-11-20'), ev('Bad date', 'soon')];

  it('sorts soonest first and drops untitled or undated events', () => {
    expect(upcomingEvents(events, 10, false, now).map((e) => e.title)).toEqual(['Old briefing', 'Today', 'Winter social']);
  });

  it('hides past events but keeps today', () => {
    expect(upcomingEvents(events, 10, true, now).map((e) => e.title)).toEqual(['Today', 'Winter social']);
  });

  it('respects the maximum', () => {
    expect(upcomingEvents(events, 1, true, now)).toHaveLength(1);
  });
});
