export type ShipmentStatus = 'Booked' | 'In transit' | 'Delivered' | 'Exception';

export const SHIPMENT_STATUSES: ShipmentStatus[] = ['Booked', 'In transit', 'Delivered', 'Exception'];

export interface IShipment {
  id: number;
  /** Consignment reference, e.g. CN-10421 (the SharePoint list Title column). */
  reference: string;
  customer: string;
  origin: string;
  destination: string;
  carrier: string;
  status: ShipmentStatus;
  /** ISO 8601 date string. */
  eta: string;
  /** ISO 8601 date string. */
  lastUpdated: string;
}
