import type { MSGraphClientV3 } from '@microsoft/sp-http';

export interface IPerson {
  name: string;
  jobTitle: string;
  department: string;
  /** ISO date: hire date if HR set one, otherwise when the account was created. */
  started: string;
}

export interface IPeopleService {
  getNewStarters(days: number, max: number, department?: string): Promise<IPerson[]>;
}

interface IGraphUser {
  displayName?: string;
  jobTitle?: string;
  department?: string;
  createdDateTime?: string;
  employeeHireDate?: string;
}

/**
 * New accounts in Entra ID (Azure AD), read through Microsoft Graph.
 * Needs the User.Read.All permission approved in SharePoint admin > Advanced > API access.
 * Self-updating: create a user in Entra with a department and they appear here.
 */
export class GraphPeopleService implements IPeopleService {
  constructor(private readonly _getClient: () => Promise<MSGraphClientV3>) {}

  public async getNewStarters(days: number, max: number, department?: string): Promise<IPerson[]> {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const client = await this._getClient();

    // createdDateTime filters are an "advanced query" in Graph: they need ConsistencyLevel and $count.
    const response: { value: IGraphUser[] } = await client
      .api('/users')
      .header('ConsistencyLevel', 'eventual')
      .query({ $count: 'true' })
      .filter(`createdDateTime ge ${since} and accountEnabled eq true and userType eq 'Member'`)
      .select('displayName,jobTitle,department,createdDateTime,employeeHireDate')
      .top(100)
      .get();

    return filterStarters(
      response.value.map((u) => ({
        name: u.displayName || '',
        jobTitle: u.jobTitle || '',
        department: u.department || '',
        started: u.employeeHireDate || u.createdDateTime || ''
      })),
      max,
      department
    );
  }
}

export class DemoPeopleService implements IPeopleService {
  public getNewStarters(_days: number, max: number, department?: string): Promise<IPerson[]> {
    const ago = (n: number): string => new Date(Date.now() - n * 86400000).toISOString();
    const people: IPerson[] = [
      { name: 'Amira Malik', jobTitle: 'Warehouse operative', department: 'Warehouse', started: ago(3) },
      { name: 'Jordan Taylor', jobTitle: 'Forklift driver', department: 'Warehouse', started: ago(6) },
      { name: 'Sam Kowalski', jobTitle: 'Stock controller', department: 'Warehouse', started: ago(9) }
    ];
    return Promise.resolve(filterStarters(people, max, department));
  }
}

/** Named people only, optionally one department, newest first, capped at `max`. */
export function filterStarters(people: IPerson[], max: number, department?: string): IPerson[] {
  const dept = (department || '').trim().toLowerCase();
  return people
    .filter((p) => p.name.trim())
    .filter((p) => !dept || p.department.toLowerCase() === dept)
    .sort((a, b) => (b.started || '').localeCompare(a.started || ''))
    .slice(0, max);
}

const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

/** "Three new starters in the Warehouse team." / "Two new starters across 2 teams." */
export function starterSentence(people: IPerson[]): string {
  const n = people.length;
  const count = n < WORDS.length ? WORDS[n] : String(n);
  const noun = n === 1 ? 'new starter' : 'new starters';
  if (n === 0) {
    return 'No new starters right now.';
  }
  const departments = people.map((p) => p.department).filter((d, i, all) => d && all.indexOf(d) === i);
  if (departments.length === 1 && people.every((p) => p.department)) {
    return `${count} ${noun} in the ${departments[0]} team.`;
  }
  if (departments.length > 1) {
    return `${count} ${noun} across ${departments.length} teams.`;
  }
  return `${count} ${noun}.`;
}
