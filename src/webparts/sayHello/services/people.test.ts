import { filterStarters, starterSentence, type IPerson } from './people';

const person = (name: string, department: string, started: string): IPerson => ({ name, jobTitle: '', department, started });

describe('filterStarters', () => {
  const people = [
    person('Amira Malik', 'Warehouse', '2026-11-14'),
    person('Chris Doe', 'Transport', '2026-11-16'),
    person('', 'Warehouse', '2026-11-17'),
    person('Sam Kowalski', 'warehouse', '2026-11-10')
  ];

  it('drops nameless accounts and sorts newest first', () => {
    expect(filterStarters(people, 10).map((p) => p.name)).toEqual(['Chris Doe', 'Amira Malik', 'Sam Kowalski']);
  });

  it('filters by department, ignoring case', () => {
    expect(filterStarters(people, 10, 'Warehouse').map((p) => p.name)).toEqual(['Amira Malik', 'Sam Kowalski']);
  });

  it('caps the number of people', () => {
    expect(filterStarters(people, 1)).toHaveLength(1);
  });
});

describe('starterSentence', () => {
  it('names the team when everyone is in one', () => {
    expect(starterSentence([person('A B', 'Warehouse', ''), person('C D', 'Warehouse', ''), person('E F', 'Warehouse', '')])).toBe(
      'Three new starters in the Warehouse team.'
    );
  });

  it('counts teams when people are spread out', () => {
    expect(starterSentence([person('A B', 'Warehouse', ''), person('C D', 'Transport', '')])).toBe('Two new starters across 2 teams.');
  });

  it('handles one person and nobody', () => {
    expect(starterSentence([person('A B', '', '')])).toBe('One new starter.');
    expect(starterSentence([])).toBe('No new starters right now.');
  });
});
