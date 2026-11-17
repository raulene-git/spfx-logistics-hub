import type { IShipmentService } from '../services/IShipmentService';

export interface IShipmentTrackerProps {
  title: string;
  /** Shown after the title in yellow italics, e.g. "board." */
  accentWord: string;
  /** Site name, shown in the label line above the title. */
  siteTitle: string;
  /** e.g. "Tuesday 17 November". */
  dateText: string;
  service: IShipmentService;
  /** True when showing built-in demo data instead of a SharePoint list. */
  isDemo: boolean;
}
