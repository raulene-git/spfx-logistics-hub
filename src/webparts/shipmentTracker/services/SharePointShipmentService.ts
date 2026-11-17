import { SPHttpClient, type SPHttpClientResponse } from '@microsoft/sp-http';
import { SHIPMENT_STATUSES, type IShipment, type ShipmentStatus } from '../models/IShipment';
import type { IShipmentService } from './IShipmentService';

interface IShipmentListItem {
  Id: number;
  Title: string;
  Customer?: string;
  Origin?: string;
  Destination?: string;
  Carrier?: string;
  Status?: string;
  ETA?: string;
  Modified: string;
}

/**
 * Reads shipments from a SharePoint list (see scripts/provision-shipments-list.ps1).
 * Columns: Title (reference), Customer, Origin, Destination, Carrier, Status (choice), ETA (date).
 */
export class SharePointShipmentService implements IShipmentService {
  constructor(
    private readonly _spHttpClient: SPHttpClient,
    private readonly _webUrl: string,
    private readonly _listTitle: string
  ) {}

  public async getShipments(): Promise<IShipment[]> {
    const select = 'Id,Title,Customer,Origin,Destination,Carrier,Status,ETA,Modified';
    const listTitle = encodeURIComponent(this._listTitle.replace(/'/g, "''"));
    const url = `${this._webUrl}/_api/web/lists/getbytitle('${listTitle}')/items?$select=${select}&$orderby=ETA asc&$top=500`;

    const response: SPHttpClientResponse = await this._spHttpClient.get(url, SPHttpClient.configurations.v1);
    if (!response.ok) {
      throw new Error(`Could not load list "${this._listTitle}" (HTTP ${response.status}).`);
    }

    const json: { value: IShipmentListItem[] } = await response.json();
    return json.value.map((item) => ({
      id: item.Id,
      reference: item.Title,
      customer: item.Customer ?? '',
      origin: item.Origin ?? '',
      destination: item.Destination ?? '',
      carrier: item.Carrier ?? '',
      status: toStatus(item.Status),
      eta: item.ETA ?? '',
      lastUpdated: item.Modified
    }));
  }
}

function toStatus(value: string | undefined): ShipmentStatus {
  return SHIPMENT_STATUSES.indexOf(value as ShipmentStatus) >= 0 ? (value as ShipmentStatus) : 'Booked';
}
