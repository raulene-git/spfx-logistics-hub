import { SHIPMENT_STATUSES, type IShipment, type ShipmentStatus } from '../models/IShipment';

export type StatusFilter = ShipmentStatus | 'All';

export type StatusCounts = Record<ShipmentStatus, number>;

/** Filters by status and a free-text query across reference, customer, origin, destination and carrier. */
export function filterShipments(shipments: IShipment[], status: StatusFilter, query: string): IShipment[] {
  const q = query.trim().toLowerCase();
  return shipments.filter((s) => {
    if (status !== 'All' && s.status !== status) {
      return false;
    }
    if (!q) {
      return true;
    }
    return [s.reference, s.customer, s.origin, s.destination, s.carrier].some((field) => field.toLowerCase().indexOf(q) >= 0);
  });
}

export function countByStatus(shipments: IShipment[]): StatusCounts {
  const counts = {} as StatusCounts;
  SHIPMENT_STATUSES.forEach((status) => {
    counts[status] = 0;
  });
  shipments.forEach((s) => {
    counts[s.status] += 1;
  });
  return counts;
}

/** A shipment is late if it isn't delivered and its ETA is before today (compared as YYYY-MM-DD). */
export function isLate(shipment: IShipment, today: Date = new Date()): boolean {
  if (shipment.status === 'Delivered' || !shipment.eta) {
    return false;
  }
  return shipment.eta.slice(0, 10) < today.toISOString().slice(0, 10);
}
