import type { ITicket, ITicketDraft, IWorklog } from '../models/tickets';
import { changeNote, type ITicketAccess, type ITicketChange, type ITicketService } from './ITicketService';

const hoursAgo = (h: number): string => new Date(Date.now() - h * 3600000).toISOString();

function seedTickets(): ITicket[] {
  const t = (over: Partial<ITicket> & Pick<ITicket, 'id' | 'title'>): ITicket => ({
    type: 'Incident',
    category: 'Something else',
    priority: 'Low',
    status: 'Open',
    description: '',
    depot: 'Birmingham DC',
    details: [],
    requester: 'Amira Malik',
    created: hoursAgo(2),
    modified: hoursAgo(2),
    ...over
  });
  return [
    t({
      id: 1042,
      title: 'Label printer on Bay 2 won’t print',
      category: 'Label printer',
      priority: 'Critical',
      depot: 'Bristol Hub',
      requester: 'Jordan Taylor',
      created: hoursAgo(1),
      description: 'Printer shows a red light and labels come out blank. Every outbound pallet on Bay 2 is waiting.',
      details: [
        { label: 'What’s affected?', value: 'Label printer' },
        { label: 'Who does it affect?', value: 'The whole site' },
        { label: 'Can you keep working?', value: 'No, I’m stuck' }
      ]
    }),
    t({
      id: 1041,
      title: 'Handheld scanner won’t connect to Wi-Fi',
      category: 'Handheld scanner',
      priority: 'High',
      status: 'In progress',
      assignee: 'Priya Shah',
      depot: 'Glasgow Hub',
      requester: 'Sam Kowalski',
      created: hoursAgo(5),
      description: 'Scanner 14 drops off the network as soon as I walk into the chiller.',
      details: [
        { label: 'What’s affected?', value: 'Handheld scanner' },
        { label: 'Who does it affect?', value: 'My team' },
        { label: 'Can you keep working?', value: 'No, I’m stuck' }
      ]
    }),
    t({
      id: 1040,
      title: 'New starter: Ellie Brooks',
      type: 'Service request',
      category: 'New starter',
      priority: 'High',
      depot: 'Felixstowe Port',
      requester: 'Marcus Reid',
      created: hoursAgo(20),
      details: [
        { label: 'Starter’s name', value: 'Ellie Brooks' },
        { label: 'Job title', value: 'Transport planner' },
        { label: 'What do they need?', value: 'Laptop, Mobile phone, Headset' }
      ]
    }),
    t({
      id: 1039,
      title: 'Access to Ops shared mailbox (Edit)',
      type: 'Service request',
      category: 'Access',
      depot: 'Head office',
      requester: 'Hannah Okafor',
      created: hoursAgo(28),
      description: 'Covering the customer desk while Lee is on leave.',
      details: [{ label: 'What level of access?', value: 'Edit' }]
    }),
    t({
      id: 1038,
      title: 'Teams keeps signing me out',
      category: 'Email and Teams',
      priority: 'Medium',
      status: 'In progress',
      assignee: 'Dan Moore',
      depot: 'Working remotely',
      requester: 'Chloe Evans',
      created: hoursAgo(30)
    }),
    t({
      id: 1037,
      title: 'Second monitor for the planning desk',
      type: 'Service request',
      category: 'New equipment',
      depot: 'Southampton Port',
      requester: 'Tom Hughes',
      created: hoursAgo(52)
    }),
    t({
      id: 1036,
      title: 'Dispatch board shows yesterday’s routes',
      category: 'Dispatch system',
      priority: 'High',
      status: 'Resolved',
      assignee: 'Priya Shah',
      requester: 'Jordan Taylor',
      created: hoursAgo(70),
      modified: hoursAgo(60)
    }),
    t({
      id: 1035,
      title: 'Install Power BI Desktop',
      type: 'Service request',
      category: 'New software',
      status: 'Closed',
      assignee: 'Dan Moore',
      depot: 'Head office',
      requester: 'Hannah Okafor',
      created: hoursAgo(120),
      modified: hoursAgo(96)
    })
  ];
}

function seedWorklogs(): IWorklog[] {
  return [
    { id: 1, ticketId: 1041, message: 'Assigned to Priya Shah. Status changed to In progress.', author: 'Priya Shah', created: hoursAgo(4) },
    { id: 2, ticketId: 1041, message: 'Chiller access point is down. Engineer booked for 2pm.', author: 'Priya Shah', created: hoursAgo(3) },
    { id: 3, ticketId: 1036, message: 'Overnight sync job had stalled. Restarted it and the board caught up.', author: 'Priya Shah', created: hoursAgo(61) },
    { id: 4, ticketId: 1036, message: 'Status changed to Resolved.', author: 'Priya Shah', created: hoursAgo(60) }
  ];
}

// One store per page, so tickets raised in the requester view show up in the IT queue preview.
let store: { tickets: ITicket[]; worklogs: IWorklog[] } | undefined;

function getStore(): { tickets: ITicket[]; worklogs: IWorklog[] } {
  if (!store) {
    store = { tickets: seedTickets(), worklogs: seedWorklogs() };
  }
  return store;
}

/**
 * Fictional tickets kept in memory, so the web part works on any page with no lists.
 * Everyone can preview the IT queue here; with real lists only IT can.
 */
export class DemoTicketService implements ITicketService {
  public readonly isDemo: boolean = true;

  constructor(private readonly _userName: string) {}

  public getAccess(): Promise<ITicketAccess> {
    return Promise.resolve({ canManage: true, userName: this._userName });
  }

  public getMyTickets(): Promise<ITicket[]> {
    return Promise.resolve(getStore().tickets.filter((t) => t.requester === this._userName));
  }

  public getAllTickets(): Promise<ITicket[]> {
    return Promise.resolve(getStore().tickets.slice());
  }

  public createTicket(draft: ITicketDraft): Promise<ITicket> {
    const s = getStore();
    const now = new Date().toISOString();
    const ticket: ITicket = {
      ...draft,
      id: Math.max(...s.tickets.map((t) => t.id)) + 1,
      status: 'Open',
      requester: this._userName,
      created: now,
      modified: now
    };
    s.tickets.unshift(ticket);
    return Promise.resolve(ticket);
  }

  public updateTicket(id: number, change: ITicketChange): Promise<ITicket> {
    const s = getStore();
    const ticket = s.tickets.filter((t) => t.id === id)[0];
    if (!ticket) {
      return Promise.reject(new Error('That ticket no longer exists.'));
    }
    if (change.status) {
      ticket.status = change.status;
    }
    if (change.assignToMe) {
      ticket.assignee = this._userName;
    }
    ticket.modified = new Date().toISOString();
    s.worklogs.push(this._log(id, changeNote(change, this._userName)));
    return Promise.resolve({ ...ticket });
  }

  public getWorklogs(ticketId: number): Promise<IWorklog[]> {
    return Promise.resolve(getStore().worklogs.filter((w) => w.ticketId === ticketId));
  }

  public addWorklog(ticketId: number, message: string): Promise<IWorklog> {
    const log = this._log(ticketId, message);
    getStore().worklogs.push(log);
    return Promise.resolve(log);
  }

  private _log(ticketId: number, message: string): IWorklog {
    const s = getStore();
    return { id: s.worklogs.length + 1, ticketId, message, author: this._userName, created: new Date().toISOString() };
  }
}
