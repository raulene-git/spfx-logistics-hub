import type { IShipment } from '../models/IShipment';

export interface IShipmentService {
  getShipments(): Promise<IShipment[]>;
}
