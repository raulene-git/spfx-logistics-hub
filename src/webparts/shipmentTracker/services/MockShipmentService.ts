import type { IShipment } from '../models/IShipment';
import type { IShipmentService } from './IShipmentService';
import demoShipments from './demoShipments';

/** Returns fictional demo data so the web part can be shown without a SharePoint list. */
export class MockShipmentService implements IShipmentService {
  public getShipments(): Promise<IShipment[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(demoShipments.map((s) => ({ ...s }))), 400);
    });
  }
}
