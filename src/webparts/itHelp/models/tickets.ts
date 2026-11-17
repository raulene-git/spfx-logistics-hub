export type TicketType = 'Incident' | 'Service request';
export type TicketStatus = 'Open' | 'In progress' | 'Resolved' | 'Closed';
export type TicketPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export const TICKET_STATUSES: TicketStatus[] = ['Open', 'In progress', 'Resolved', 'Closed'];
export const TICKET_PRIORITIES: TicketPriority[] = ['Critical', 'High', 'Medium', 'Low'];

/** One answer from the template, kept with its question so IT sees exactly what was asked. */
export interface ITicketDetail {
  label: string;
  value: string;
}

export interface ITicket {
  id: number;
  title: string;
  type: TicketType;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  depot: string;
  details: ITicketDetail[];
  requester: string;
  assignee?: string;
  /** ISO dates. */
  created: string;
  modified: string;
}

/** What the requester's form produces, before SharePoint gives it an id. */
export interface ITicketDraft {
  title: string;
  type: TicketType;
  category: string;
  priority: TicketPriority;
  description: string;
  depot: string;
  details: ITicketDetail[];
}

export interface IWorklog {
  id: number;
  ticketId: number;
  message: string;
  author: string;
  created: string;
}

export const DEPOTS: string[] = [
  'Birmingham DC',
  'Bristol Hub',
  'Felixstowe Port',
  'Glasgow Hub',
  'Southampton Port',
  'Head office',
  'Working remotely'
];
