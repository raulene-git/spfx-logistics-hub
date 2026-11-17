import { initials, relativeDay, slugify } from './links';

describe('slugify', () => {
  it('makes a link-friendly id', () => {
    expect(slugify('Find your way around')).toBe('find-your-way-around');
    expect(slugify('  News & updates! ')).toBe('news-updates');
  });
});

describe('relativeDay', () => {
  const now = new Date(2026, 10, 17, 10, 0);

  it('describes recent days in words', () => {
    expect(relativeDay(new Date(2026, 10, 17, 8, 0).toISOString(), now)).toBe('Today');
    expect(relativeDay(new Date(2026, 10, 16, 23, 0).toISOString(), now)).toBe('Yesterday');
    expect(relativeDay(new Date(2026, 10, 13, 9, 0).toISOString(), now)).toBe('4 days ago');
    expect(relativeDay(new Date(2026, 10, 3, 9, 0).toISOString(), now)).toBe('2 weeks ago');
  });

  it('returns nothing for a bad date', () => {
    expect(relativeDay('not a date', now)).toBe('');
  });
});

describe('initials', () => {
  it('uses the first and last name', () => {
    expect(initials('Amira Malik')).toBe('AM');
    expect(initials('Jordan Lee Taylor')).toBe('JT');
    expect(initials('Sam')).toBe('S');
    expect(initials('')).toBe('?');
  });
});
