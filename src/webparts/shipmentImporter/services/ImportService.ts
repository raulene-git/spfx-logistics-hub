import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import type { IImportShipment } from '../utils/mapping';

export interface IImportResult {
  added: number;
  updated: number;
  failed: { reference: string; message: string }[];
}

/**
 * Writes shipments to the Shipments list. Rows whose reference (Title) already exists are
 * updated; new references are added. One request per row keeps errors tied to their row.
 */
export class ImportService {
  constructor(
    private readonly _client: SPHttpClient,
    private readonly _webUrl: string,
    private readonly _listTitle: string
  ) {}

  private get _listUrl(): string {
    return `${this._webUrl}/_api/web/lists/getbytitle('${encodeURIComponent(this._listTitle.replace(/'/g, "''"))}')`;
  }

  /** Reference (lower case) -> item id, for every item already in the list. */
  public async existingReferences(): Promise<Record<string, number>> {
    const map: Record<string, number> = {};
    let url: string | undefined = `${this._listUrl}/items?$select=Id,Title&$top=5000`;
    while (url) {
      const response: SPHttpClientResponse = await this._client.get(url, SPHttpClient.configurations.v1);
      if (!response.ok) {
        throw new Error(`Could not read list "${this._listTitle}" (HTTP ${response.status}). Check the list name in the settings.`);
      }
      const json: { value: { Id: number; Title: string }[]; '@odata.nextLink'?: string } = await response.json();
      json.value.forEach((item) => {
        if (item.Title) {
          map[item.Title.trim().toLowerCase()] = item.Id;
        }
      });
      url = json['@odata.nextLink'];
    }
    return map;
  }

  public async importRows(rows: IImportShipment[], onProgress: (done: number) => void): Promise<IImportResult> {
    const existing = await this.existingReferences();
    const result: IImportResult = { added: 0, updated: 0, failed: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const body = JSON.stringify({
        Title: row.reference,
        Customer: row.customer,
        Origin: row.origin,
        Destination: row.destination,
        Carrier: row.carrier,
        Status: row.status,
        // Midday UTC so the date doesn't slip a day in the site's time zone.
        ETA: `${row.eta}T12:00:00Z`
      });
      const id = existing[row.reference.toLowerCase()];

      try {
        const response = id
          ? await this._client.post(`${this._listUrl}/items(${id})`, SPHttpClient.configurations.v1, {
              headers: { 'IF-MATCH': '*', 'X-HTTP-Method': 'MERGE' },
              body
            })
          : await this._client.post(`${this._listUrl}/items`, SPHttpClient.configurations.v1, { body });

        if (!response.ok) {
          result.failed.push({ reference: row.reference, message: await errorMessage(response) });
        } else if (id) {
          result.updated += 1;
        } else {
          result.added += 1;
        }
      } catch (e) {
        result.failed.push({ reference: row.reference, message: (e as Error).message });
      }
      onProgress(i + 1);
    }
    return result;
  }
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
