import type { IShipmentService } from '../services/IShipmentService';

export interface IShipmentTrackerProps {
  title: string;
  service: IShipmentService;
  /** True when showing built-in demo data instead of a SharePoint list. */
  isDemo: boolean;
  isDarkTheme: boolean;
}
