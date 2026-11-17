import { findTemplate, type ITicketTemplate } from '../models/templates';
import type { ITicket } from '../models/tickets';
import { buildTicket, filterTickets, queueSummary, sortQueue, ticketRef, validateAnswers } from './ticketUtils';

const today = new Date(2026, 10, 17);
const incident = findTemplate('incident') as ITicketTemplate;
const starter = findTemplate('starter') as ITicketTemplate;

function ticket(over: Partial<ITicket>): ITicket {
  return {
    id: 1,
    title: 'Printer down',
    type: 'Incident',
    category: 'Label printer',
    priority: 'Low',
    status: 'Open',
    description: '',
    depot: 'Bristol Hub',
    details: [],
    requester: 'Amira Malik',
    created: '2026-11-17T09:00:00Z',
    modified: '2026-11-17T09:00:00Z',
    ...over
  };
}

describe('ticketRef', () => {
  it('pads to four digits', () => {
    expect(ticketRef(7)).toBe('IT-0007');
    expect(ticketRef(1234)).toBe('IT-1234');
    expect(ticketRef(12345)).toBe('IT-12345');
  });
});

describe('validateAnswers', () => {
  it('flags missing required answers', () => {
    const errors = validateAnswers(incident, { summary: 'x' }, today);
    expect(errors.summary).toBeUndefined();
    expect(errors.affected).toBe('Choose an option.');
    expect(errors.description).toBe('Fill this in.');
  });

  it('rejects past and malformed dates', () => {
    expect(validateAnswers(starter, { startDate: '2026-11-01' }, today).startDate).toBe('That date has passed.');
    expect(validateAnswers(starter, { startDate: 'next week' }, today).startDate).toMatch(/Use a date/);
  });
});

describe('buildTicket', () => {
  it('works out priority from impact and whether the person can work', () => {
    const base = { summary: 'Scanner dead', affected: 'Handheld scanner', depot: 'Glasgow Hub', description: 'No power' };
    expect(buildTicket(incident, { ...base, impact: 'The whole site', canWork: 'No, I’m stuck' }, today).priority).toBe('Critical');
    expect(buildTicket(incident, { ...base, impact: 'My team', canWork: 'Yes, with a workaround' }, today).priority).toBe('Medium');
    expect(buildTicket(incident, { ...base, impact: 'Just me', canWork: 'Yes, with a workaround' }, today).priority).toBe('Low');
  });

  it('keeps the other answers as labelled details', () => {
    const draft = buildTicket(
      starter,
      { starterName: ' Sam Kowalski ', startDate: '2026-11-20', role: 'Stock controller', depot: 'Bristol Hub', kit: 'Laptop|Headset' },
      today
    );
    expect(draft.title).toBe('New starter: Sam Kowalski');
    expect(draft.priority).toBe('High');
    expect(draft.category).toBe('New starter');
    expect(draft.depot).toBe('Bristol Hub');
    expect(draft.details).toContainEqual({ label: 'What do they need?', value: 'Laptop, Headset' });
  });
});

describe('queue', () => {
  const tickets = [
    ticket({ id: 1, status: 'Resolved', priority: 'Critical' }),
    ticket({ id: 2, status: 'Open', priority: 'Low', created: '2026-11-16T09:00:00Z' }),
    ticket({ id: 3, status: 'Open', priority: 'High', requester: 'Jordan Taylor' }),
    ticket({ id: 4, status: 'In progress', priority: 'Medium' })
  ];

  it('sorts open, urgent and newest first', () => {
    expect(sortQueue(tickets).map((t) => t.id)).toEqual([3, 2, 4, 1]);
  });

  it('filters urgent tickets and searches by reference or person', () => {
    expect(filterTickets(tickets, 'Urgent', '').map((t) => t.id)).toEqual([3]);
    expect(filterTickets(tickets, 'All', 'jordan').map((t) => t.id)).toEqual([3]);
    expect(filterTickets(tickets, 'All', 'it-0004').map((t) => t.id)).toEqual([4]);
  });

  it('summarises the queue in a sentence', () => {
    expect(queueSummary(tickets)).toBe('3 open tickets. 1 is urgent.');
    expect(queueSummary([])).toBe('Nothing waiting. The queue is clear.');
  });
});
