import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import { TICKET_PRIORITIES, TICKET_STATUSES, type ITicket, type ITicketDetail, type ITicketDraft, type IWorklog, type TicketPriority, type TicketStatus } from '../models/tickets';
import { changeNote, type ITicketAccess, type ITicketChange, type ITicketService } from './ITicketService';

interface ITicketItem {
  Id: number;
  Title: string;
  TicketType?: string;
  TicketCategory?: string;
  TicketPriority?: string;
  TicketStatus?: string;
  TicketDescription?: string;
  TicketDetails?: string;
  TicketDepot?: string;
  Created: string;
  Modified: string;
  Author?: { Title?: string };
  TicketAssignee?: { Title?: string };
}

interface IWorklogItem {
  Id: number;
  TicketId: number;
  LogMessage?: string;
  Title?: string;
  Created: string;
  Author?: { Title?: string };
}

const TICKET_SELECT =
  '$select=Id,Title,TicketType,TicketCategory,TicketPriority,TicketStatus,TicketDescription,TicketDetails,TicketDepot,Created,Modified,Author/Title,TicketAssignee/Title' +
  '&$expand=Author,TicketAssignee';

/** SharePoint's "Manage Lists" permission bit (SP.PermissionKind.manageLists = 12) in the low word. */
const MANAGE_LISTS_BIT = 1 << 11;

/**
 * Tickets and worklogs in two SharePoint lists, created by scripts/provision-it-helpdesk.ps1.
 *
 * Who sees what is enforced by SharePoint, not by this code: the tickets list uses item-level
 * permissions (people read and edit only their own items) and only the IT group has Edit on the
 * list, which bypasses that. The web part just checks the same permission to decide which view to show.
 */
export class SharePointTicketService implements ITicketService {
  public readonly isDemo: boolean = false;

  constructor(
    private readonly _client: SPHttpClient,
    private readonly _webUrl: string,
    private readonly _ticketList: string,
    private readonly _worklogList: string,
    private readonly _userId: number,
    private readonly _userName: string
  ) {}

  private _list(title: string): string {
    return `${this._webUrl}/_api/web/lists/getbytitle('${encodeURIComponent(title.replace(/'/g, "''"))}')`;
  }

  public async getAccess(): Promise<ITicketAccess> {
    const json = await this._get<{ EffectiveBasePermissions?: { Low?: string } }>(
      `${this._list(this._ticketList)}?$select=EffectiveBasePermissions`,
      'tickets'
    );
    const low = parseInt(json.EffectiveBasePermissions?.Low || '0', 10);
    return { canManage: (low & MANAGE_LISTS_BIT) !== 0, userName: this._userName };
  }

  public async getMyTickets(): Promise<ITicket[]> {
    const json = await this._get<{ value: ITicketItem[] }>(
      `${this._list(this._ticketList)}/items?${TICKET_SELECT}&$filter=AuthorId eq ${this._userId}&$orderby=Created desc&$top=50`,
      'tickets'
    );
    return json.value.map(toTicket);
  }

  public async getAllTickets(): Promise<ITicket[]> {
    const json = await this._get<{ value: ITicketItem[] }>(`${this._list(this._ticketList)}/items?${TICKET_SELECT}&$orderby=Created desc&$top=500`, 'tickets');
    return json.value.map(toTicket);
  }

  public async createTicket(draft: ITicketDraft): Promise<ITicket> {
    const response = await this._client.post(`${this._list(this._ticketList)}/items`, SPHttpClient.configurations.v1, {
      body: JSON.stringify({
        Title: draft.title,
        TicketType: draft.type,
        TicketCategory: draft.category,
        TicketPriority: draft.priority,
        TicketStatus: 'Open',
        TicketDescription: draft.description,
        TicketDetails: JSON.stringify(draft.details),
        TicketDepot: draft.depot
      })
    });
    if (!response.ok) {
      throw new Error(`Your ticket could not be saved. ${await errorMessage(response)}`);
    }
    const created: { Id: number } = await response.json();
    return this._getTicket(created.Id);
  }

  public async updateTicket(id: number, change: ITicketChange): Promise<ITicket> {
    const body: Record<string, unknown> = {};
    if (change.status) {
      body.TicketStatus = change.status;
    }
    if (change.assignToMe) {
      body.TicketAssigneeId = this._userId;
    }
    const response = await this._client.post(`${this._list(this._ticketList)}/items(${id})`, SPHttpClient.configurations.v1, {
      headers: { 'IF-MATCH': '*', 'X-HTTP-Method': 'MERGE' },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw new Error(`The ticket could not be updated. ${await errorMessage(response)}`);
    }
    await this.addWorklog(id, changeNote(change, this._userName));
    return this._getTicket(id);
  }

  public async getWorklogs(ticketId: number): Promise<IWorklog[]> {
    const json = await this._get<{ value: IWorklogItem[] }>(
      `${this._list(this._worklogList)}/items?$select=Id,TicketId,Title,LogMessage,Created,Author/Title&$expand=Author&$filter=TicketId eq ${ticketId}&$orderby=Created asc&$top=200`,
      'worklogs'
    );
    return json.value.map(toWorklog);
  }

  public async addWorklog(ticketId: number, message: string): Promise<IWorklog> {
    const response = await this._client.post(`${this._list(this._worklogList)}/items`, SPHttpClient.configurations.v1, {
      body: JSON.stringify({ Title: message.slice(0, 250), LogMessage: message, TicketId: ticketId })
    });
    if (!response.ok) {
      throw new Error(`The note could not be saved. ${await errorMessage(response)}`);
    }
    const item: IWorklogItem = await response.json();
    return { id: item.Id, ticketId, message, author: this._userName, created: item.Created || new Date().toISOString() };
  }

  private async _getTicket(id: number): Promise<ITicket> {
    return toTicket(await this._get<ITicketItem>(`${this._list(this._ticketList)}/items(${id})?${TICKET_SELECT}`, 'tickets'));
  }

  private async _get<T>(url: string, what: 'tickets' | 'worklogs'): Promise<T> {
    const response = await this._client.get(url, SPHttpClient.configurations.v1);
    if (response.status === 404) {
      const list = what === 'tickets' ? this._ticketList : this._worklogList;
      throw new Error(`The "${list}" list isn't on this site yet. Run scripts/provision-it-helpdesk.ps1, or switch the web part to demo data.`);
    }
    if (!response.ok) {
      throw new Error(`Could not load ${what} (HTTP ${response.status}).`);
    }
    return response.json();
  }
}

function oneOf<T extends string>(value: string | undefined, allowed: T[], fallback: T): T {
  return allowed.indexOf(value as T) !== -1 ? (value as T) : fallback;
}

function parseDetails(json: string | undefined): ITicketDetail[] {
  try {
    const parsed: unknown = JSON.parse(json || '[]');
    return Array.isArray(parsed)
      ? (parsed as ITicketDetail[]).filter((d) => d && typeof d.label === 'string' && typeof d.value === 'string')
      : [];
  } catch {
    return [];
  }
}

function toTicket(item: ITicketItem): ITicket {
  return {
    id: item.Id,
    title: item.Title || '(no summary)',
    type: item.TicketType === 'Incident' ? 'Incident' : 'Service request',
    category: item.TicketCategory || '',
    priority: oneOf<TicketPriority>(item.TicketPriority, TICKET_PRIORITIES, 'Low'),
    status: oneOf<TicketStatus>(item.TicketStatus, TICKET_STATUSES, 'Open'),
    description: item.TicketDescription || '',
    depot: item.TicketDepot || '',
    details: parseDetails(item.TicketDetails),
    requester: item.Author?.Title || '',
    assignee: item.TicketAssignee?.Title || undefined,
    created: item.Created,
    modified: item.Modified
  };
}

function toWorklog(item: IWorklogItem): IWorklog {
  return {
    id: item.Id,
    ticketId: item.TicketId,
    message: item.LogMessage || item.Title || '',
    author: item.Author?.Title || '',
    created: item.Created
  };
}

async function errorMessage(response: SPHttpClientResponse): Promise<string> {
  try {
    const json: { error?: { message?: string | { value?: string } } } = await response.json();
    const message = json.error?.message;
    return (typeof message === 'string' ? message : message?.value) || `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}
