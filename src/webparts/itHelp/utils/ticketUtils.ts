import type { Answers, ITicketTemplate } from '../models/templates';
import { daysUntil } from '../models/templates';
import { TICKET_PRIORITIES, TICKET_STATUSES, type ITicket, type ITicketDraft, type TicketStatus } from '../models/tickets';

/** "IT-0042". */
export function ticketRef(id: number): string {
  const s = String(id);
  return `IT-${'0000'.slice(Math.min(s.length, 4))}${s}`;
}

/** Field key -> message, for every answer that needs fixing. Empty object means the form is ready. */
export function validateAnswers(template: ITicketTemplate, answers: Answers, today: Date = new Date()): Record<string, string> {
  const errors: Record<string, string> = {};
  template.fields.forEach((f) => {
    const value = (answers[f.key] || '').trim();
    if (!value) {
      if (f.required) {
        errors[f.key] = f.kind === 'choice' || f.kind === 'multi' ? 'Choose an option.' : 'Fill this in.';
      }
      return;
    }
    if (f.kind === 'date') {
      const days = daysUntil(value, today);
      if (days === undefined) {
        errors[f.key] = 'Use a date like 2026-12-01.';
      } else if (days < 0) {
        errors[f.key] = 'That date has passed.';
      }
    }
    if (f.kind === 'text' && value.length > 120) {
      errors[f.key] = 'Keep it under 120 characters.';
    }
  });
  return errors;
}

/** Turns the form into a ticket: summary, category and priority come from the template's rules. */
export function buildTicket(template: ITicketTemplate, answers: Answers, today: Date = new Date()): ITicketDraft {
  const clean: Answers = {};
  Object.keys(answers).forEach((k) => (clean[k] = (answers[k] || '').trim()));

  const details = template.fields
    .filter((f) => f.key !== 'summary' && f.key !== 'description' && f.key !== 'depot' && clean[f.key])
    .map((f) => ({ label: f.label, value: f.kind === 'multi' ? clean[f.key].split('|').join(', ') : clean[f.key] }));

  return {
    title: template.titleOf(clean).slice(0, 255),
    type: template.type,
    category: template.categoryOf(clean),
    priority: template.priorityOf(clean, today),
    description: clean.description || '',
    depot: clean.depot || '',
    details
  };
}

export type QueueFilter = 'All' | TicketStatus | 'Urgent';

export function isActive(t: ITicket): boolean {
  return t.status === 'Open' || t.status === 'In progress';
}

/** Critical or High and not yet resolved. */
export function isUrgent(t: ITicket): boolean {
  return isActive(t) && (t.priority === 'Critical' || t.priority === 'High');
}

export function countByStatus(tickets: ITicket[]): Record<TicketStatus, number> {
  const counts = { Open: 0, 'In progress': 0, Resolved: 0, Closed: 0 } as Record<TicketStatus, number>;
  tickets.forEach((t) => (counts[t.status] = (counts[t.status] || 0) + 1));
  return counts;
}

export function filterTickets(tickets: ITicket[], filter: QueueFilter, query: string): ITicket[] {
  const q = query.trim().toLowerCase();
  return tickets.filter((t) => {
    if (filter === 'Urgent' ? !isUrgent(t) : filter !== 'All' && t.status !== filter) {
      return false;
    }
    if (!q) {
      return true;
    }
    return [ticketRef(t.id), t.title, t.requester, t.category, t.depot, t.assignee || ''].some((v) => v.toLowerCase().indexOf(q) !== -1);
  });
}

/** Open work first, most urgent first, then newest. */
export function sortQueue(tickets: ITicket[]): ITicket[] {
  return tickets.slice().sort((a, b) => {
    const byStatus = TICKET_STATUSES.indexOf(a.status) - TICKET_STATUSES.indexOf(b.status);
    if (byStatus !== 0) {
      return byStatus;
    }
    const byPriority = TICKET_PRIORITIES.indexOf(a.priority) - TICKET_PRIORITIES.indexOf(b.priority);
    return byPriority !== 0 ? byPriority : b.created.localeCompare(a.created);
  });
}

/** "7 open tickets. 2 are urgent." */
export function queueSummary(tickets: ITicket[]): string {
  const active = tickets.filter(isActive).length;
  const urgent = tickets.filter(isUrgent).length;
  if (active === 0) {
    return 'Nothing waiting. The queue is clear.';
  }
  const first = `${active} open ${active === 1 ? 'ticket' : 'tickets'}.`;
  if (urgent === 0) {
    return `${first} Nothing urgent.`;
  }
  return `${first} ${urgent} ${urgent === 1 ? 'is' : 'are'} urgent.`;
}
