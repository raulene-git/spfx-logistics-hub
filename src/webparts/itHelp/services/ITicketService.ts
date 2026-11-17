import type { ITicket, ITicketDraft, IWorklog, TicketStatus } from '../models/tickets';

export interface ITicketAccess {
  /** True for IT: can see and work the whole queue. */
  canManage: boolean;
  userName: string;
}

export interface ITicketChange {
  status?: TicketStatus;
  assignToMe?: boolean;
}

export interface ITicketService {
  readonly isDemo: boolean;
  getAccess(): Promise<ITicketAccess>;
  /** Tickets the current user raised. */
  getMyTickets(): Promise<ITicket[]>;
  /** Every ticket. Only works for people who can manage the queue. */
  getAllTickets(): Promise<ITicket[]>;
  createTicket(draft: ITicketDraft): Promise<ITicket>;
  /** Changes status or assignee and records the change in the worklog. */
  updateTicket(id: number, change: ITicketChange): Promise<ITicket>;
  getWorklogs(ticketId: number): Promise<IWorklog[]>;
  addWorklog(ticketId: number, message: string): Promise<IWorklog>;
}

/** The worklog line written when a ticket changes, so the history explains itself. */
export function changeNote(change: ITicketChange, userName: string): string {
  const parts: string[] = [];
  if (change.assignToMe) {
    parts.push(`Assigned to ${userName}`);
  }
  if (change.status) {
    parts.push(`Status changed to ${change.status}`);
  }
  return parts.join('. ') + '.';
}
