import { DEPOTS, type TicketPriority, type TicketType } from './tickets';

export type FieldKind = 'text' | 'textarea' | 'choice' | 'date' | 'multi';
export type TemplateKey = 'incident' | 'service' | 'access' | 'starter';
export type TemplateColour = 'pink' | 'yellow' | 'sage' | 'cream';

export interface ITemplateField {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  hint?: string;
  /** Spans both columns of the form. */
  wide?: boolean;
}

export type Answers = Record<string, string>;

export interface ITicketTemplate {
  key: TemplateKey;
  type: TicketType;
  /** Card heading, e.g. "Something's" + italic "broken". */
  name: string;
  accent: string;
  blurb: string;
  colour: TemplateColour;
  fields: ITemplateField[];
  /** The rules that turn answers into the ticket's summary, category and priority. */
  titleOf(answers: Answers): string;
  categoryOf(answers: Answers): string;
  priorityOf(answers: Answers, today: Date): TicketPriority;
}

const depotField: ITemplateField = { key: 'depot', label: 'Where are you?', kind: 'choice', required: true, options: DEPOTS };

/** Whole days from today to an ISO date (negative if it has passed), or undefined if not a date. */
export function daysUntil(iso: string, today: Date): number | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((iso || '').trim());
  if (!m) {
    return undefined;
  }
  const target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((target - start) / 86400000);
}

export const TEMPLATES: ITicketTemplate[] = [
  {
    key: 'incident',
    type: 'Incident',
    name: 'Something’s',
    accent: 'broken',
    blurb: 'A laptop, scanner, printer or system that isn’t working.',
    colour: 'pink',
    fields: [
      { key: 'summary', label: 'Short summary', kind: 'text', required: true, placeholder: 'Label printer on Bay 2 won’t print', wide: true },
      {
        key: 'affected',
        label: 'What’s affected?',
        kind: 'choice',
        required: true,
        options: ['Laptop or PC', 'Handheld scanner', 'Label printer', 'Phone', 'Email and Teams', 'Wi-Fi or network', 'Dispatch system', 'Something else']
      },
      depotField,
      { key: 'impact', label: 'Who does it affect?', kind: 'choice', required: true, options: ['Just me', 'My team', 'The whole site'] },
      { key: 'canWork', label: 'Can you keep working?', kind: 'choice', required: true, options: ['Yes, with a workaround', 'No, I’m stuck'] },
      {
        key: 'description',
        label: 'What happened?',
        kind: 'textarea',
        required: true,
        hint: 'Include any error message and what you were doing when it started.',
        wide: true
      }
    ],
    titleOf: (a) => a.summary,
    categoryOf: (a) => a.affected,
    priorityOf: (a) => {
      const stuck = a.canWork === 'No, I’m stuck';
      if (a.impact === 'The whole site') {
        return stuck ? 'Critical' : 'High';
      }
      if (a.impact === 'My team') {
        return stuck ? 'High' : 'Medium';
      }
      return stuck ? 'Medium' : 'Low';
    }
  },
  {
    key: 'service',
    type: 'Service request',
    name: 'I need',
    accent: 'something',
    blurb: 'New software or equipment, or a change to something that works.',
    colour: 'yellow',
    fields: [
      { key: 'summary', label: 'Short summary', kind: 'text', required: true, placeholder: 'Second monitor for the planning desk', wide: true },
      {
        key: 'need',
        label: 'What kind of request?',
        kind: 'choice',
        required: true,
        options: ['New software', 'New equipment', 'Change to something', 'Information or advice']
      },
      depotField,
      { key: 'neededBy', label: 'Needed by (optional)', kind: 'date' },
      { key: 'description', label: 'What do you need, and why?', kind: 'textarea', required: true, wide: true }
    ],
    titleOf: (a) => a.summary,
    categoryOf: (a) => a.need,
    priorityOf: (a, today) => {
      const days = daysUntil(a.neededBy, today);
      return days !== undefined && days <= 2 ? 'Medium' : 'Low';
    }
  },
  {
    key: 'access',
    type: 'Service request',
    name: 'Access',
    accent: 'please',
    blurb: 'A system, shared mailbox, Teams channel or SharePoint site.',
    colour: 'sage',
    fields: [
      { key: 'system', label: 'Which system or site?', kind: 'text', required: true, placeholder: 'Dispatch board, Ops shared mailbox…', wide: true },
      { key: 'level', label: 'What level of access?', kind: 'choice', required: true, options: ['View only', 'Edit', 'Owner or admin'] },
      { key: 'forWhom', label: 'Who needs it?', kind: 'text', placeholder: 'Leave empty if it’s you' },
      { key: 'description', label: 'Why is it needed?', kind: 'textarea', required: true, wide: true }
    ],
    titleOf: (a) => `Access to ${a.system} (${a.level})`,
    categoryOf: () => 'Access',
    priorityOf: () => 'Low'
  },
  {
    key: 'starter',
    type: 'Service request',
    name: 'Kit for a',
    accent: 'new starter',
    blurb: 'Laptop, phone, handheld and accounts ready for day one.',
    colour: 'cream',
    fields: [
      { key: 'starterName', label: 'Starter’s name', kind: 'text', required: true },
      { key: 'startDate', label: 'First day', kind: 'date', required: true },
      { key: 'role', label: 'Job title', kind: 'text', required: true, placeholder: 'Warehouse operative' },
      depotField,
      {
        key: 'kit',
        label: 'What do they need?',
        kind: 'multi',
        required: true,
        options: ['Laptop', 'Mobile phone', 'Handheld scanner', 'Headset', 'Door access card'],
        wide: true
      },
      { key: 'description', label: 'Anything else? (optional)', kind: 'textarea', wide: true }
    ],
    titleOf: (a) => `New starter: ${a.starterName}`,
    categoryOf: () => 'New starter',
    priorityOf: (a, today) => {
      const days = daysUntil(a.startDate, today);
      return days !== undefined && days <= 5 ? 'High' : 'Medium';
    }
  }
];

export function findTemplate(key: string | undefined): ITicketTemplate | undefined {
  return TEMPLATES.filter((t) => t.key === key)[0];
}
