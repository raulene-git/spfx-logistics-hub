import { SPHttpClient } from '@microsoft/sp-http';

export interface IHubSite {
  title: string;
  url: string;
  description: string;
}

interface ISearchCell {
  Key: string;
  // Search returns null for empty cells; `|| ""` below handles that.
  Value?: string;
}

interface ISearchResponse {
  PrimaryQueryResult?: {
    RelevantResults?: { Table?: { Rows?: { Cells: ISearchCell[] }[] } };
  };
}

/**
 * Finds the sites connected to a hub with SharePoint search (DepartmentId holds the hub id).
 * New sites appear after search has indexed them, usually within minutes.
 */
export class HubSitesService {
  constructor(private readonly _client: SPHttpClient) {}

  public async getSites(webUrl: string, hubSiteId: string, excludeUrl: string): Promise<IHubSite[]> {
    const query = `DepartmentId:{${hubSiteId}} contentclass:STS_Site`;
    const url =
      `${webUrl}/_api/search/query?querytext='${encodeURIComponent(query)}'` +
      `&selectproperties='Title,Path,Description'&rowlimit=50&trimduplicates=false`;

    const response = await this._client.get(url, SPHttpClient.configurations.v1, {
      headers: { Accept: 'application/json;odata=nometadata' }
    });
    if (!response.ok) {
      throw new Error(`Could not search for hub sites (HTTP ${response.status}).`);
    }

    const json: ISearchResponse = await response.json();
    const rows = json.PrimaryQueryResult?.RelevantResults?.Table?.Rows || [];
    const exclude = normalise(excludeUrl);

    return rows
      .map((row) => {
        const get = (key: string): string => row.Cells.filter((c) => c.Key === key)[0]?.Value || '';
        return { title: get('Title'), url: get('Path'), description: get('Description') };
      })
      .filter((s) => s.title && s.url && normalise(s.url) !== exclude)
      .sort((a, b) => a.title.localeCompare(b.title));
  }
}

function normalise(url: string): string {
  return (url || '').replace(/\/+$/, '').toLowerCase();
}
