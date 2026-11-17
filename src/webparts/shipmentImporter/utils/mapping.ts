import type { ShipmentStatus } from '../../shipmentTracker/models/IShipment';
import type { Cell, Rows } from './spreadsheet';

export type FieldKey = 'reference' | 'customer' | 'origin' | 'destination' | 'carrier' | 'status' | 'eta';

export interface IFieldDef {
  key: FieldKey;
  label: string;
  /** Internal name of the column in the Shipments list. */
  column: string;
  required: boolean;
  /** Header names people commonly use for this column. */
  aliases: string[];
}

export const FIELDS: IFieldDef[] = [
  { key: 'reference', label: 'Reference', column: 'Title', required: true, aliases: ['reference', 'ref', 'consignment', 'consignment ref', 'consignment number', 'title', 'cn', 'shipment', 'shipment id'] },
  { key: 'customer', label: 'Customer', column: 'Customer', required: true, aliases: ['customer', 'client', 'account', 'customer name'] },
  { key: 'origin', label: 'Origin', column: 'Origin', required: false, aliases: ['origin', 'from', 'collection', 'collect from', 'depot', 'source'] },
  { key: 'destination', label: 'Destination', column: 'Destination', required: false, aliases: ['destination', 'to', 'deliver to', 'delivery address', 'delivery town'] },
  { key: 'carrier', label: 'Carrier', column: 'Carrier', required: false, aliases: ['carrier', 'haulier', 'mode', 'transport'] },
  { key: 'status', label: 'Status', column: 'Status', required: false, aliases: ['status', 'state', 'stage'] },
  { key: 'eta', label: 'ETA', column: 'ETA', required: true, aliases: ['eta', 'due', 'due date', 'delivery date', 'expected', 'expected delivery', 'arrival'] }
];

export type ColumnMapping = Record<FieldKey, number>;

export interface IImportShipment {
  reference: string;
  customer: string;
  origin: string;
  destination: string;
  carrier: string;
  status: ShipmentStatus;
  /** YYYY-MM-DD */
  eta: string;
}

export interface IRowResult {
  /** Row number as Excel shows it (header is row 1). */
  rowNumber: number;
  shipment?: IImportShipment;
  errors: string[];
}

const squash = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Matches each field to a header: exact alias first, then a header that contains an alias. -1 when not found. */
export function autoMap(headers: Cell[]): ColumnMapping {
  const names = headers.map((h) => squash(String(h)));
  const used: Record<number, boolean> = {};
  const mapping = {} as ColumnMapping;

  FIELDS.forEach((f) => {
    const aliases = f.aliases.map(squash);
    let index = names.findIndex((n, i) => !used[i] && aliases.indexOf(n) >= 0);
    if (index < 0) {
      index = names.findIndex((n, i) => !used[i] && n.length > 2 && aliases.some((a) => a.length > 2 && n.indexOf(a) >= 0));
    }
    if (index >= 0) {
      used[index] = true;
    }
    mapping[f.key] = index;
  });
  return mapping;
}

const STATUS_WORDS: Record<string, ShipmentStatus> = {
  booked: 'Booked',
  pending: 'Booked',
  new: 'Booked',
  planned: 'Booked',
  intransit: 'In transit',
  transit: 'In transit',
  ontheroad: 'In transit',
  outfordelivery: 'In transit',
  dispatched: 'In transit',
  shipped: 'In transit',
  delivered: 'Delivered',
  complete: 'Delivered',
  completed: 'Delivered',
  pod: 'Delivered',
  exception: 'Exception',
  delayed: 'Exception',
  failed: 'Exception',
  problem: 'Exception',
  onhold: 'Exception',
  damaged: 'Exception'
};

/** Understands common ways of writing a status. Empty means Booked. Undefined means not recognised. */
export function normaliseStatus(value: Cell): ShipmentStatus | undefined {
  const key = squash(String(value ?? ''));
  if (!key) {
    return 'Booked';
  }
  return STATUS_WORDS[key];
}

const iso = (y: number, m: number, d: number): string | undefined => {
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return undefined;
  }
  return date.toISOString().slice(0, 10);
};

/**
 * Turns an ETA cell into YYYY-MM-DD. Accepts Excel date numbers, 2026-11-18, and UK-style 18/11/2026.
 */
export function parseEta(value: Cell): string | undefined {
  if (typeof value === 'number' || /^\d+(\.\d+)?$/.test(String(value).trim())) {
    const serial = Number(value);
    if (serial < 1 || serial > 2958465) {
      return undefined;
    }
    // Excel counts days from 30 Dec 1899 (allowing for its 1900 leap-year bug).
    return new Date(Date.UTC(1899, 11, 30) + Math.floor(serial) * 86400000).toISOString().slice(0, 10);
  }
  const text = String(value || '').trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
  if (m) {
    return iso(Number(m[1]), Number(m[2]), Number(m[3]));
  }
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(text);
  if (m) {
    const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return iso(year, Number(m[2]), Number(m[1]));
  }
  return undefined;
}

/** Checks every data row against the mapping. Duplicate references in the file are flagged. */
export function validateRows(dataRows: Rows, mapping: ColumnMapping): IRowResult[] {
  const seen: Record<string, number> = {};
  const cell = (row: Cell[], key: FieldKey): Cell => (mapping[key] >= 0 ? row[mapping[key]] ?? '' : '');
  const text = (row: Cell[], key: FieldKey): string => String(cell(row, key)).trim();

  return dataRows.map((row, i) => {
    const rowNumber = i + 2;
    const errors: string[] = [];

    FIELDS.filter((f) => f.required && mapping[f.key] < 0).forEach((f) => errors.push(`No column chosen for ${f.label}`));

    const reference = text(row, 'reference');
    const customer = text(row, 'customer');
    if (mapping.reference >= 0 && !reference) {
      errors.push('Reference is empty');
    }
    if (mapping.customer >= 0 && !customer) {
      errors.push('Customer is empty');
    }
    if (reference) {
      const key = reference.toLowerCase();
      if (seen[key]) {
        errors.push(`Same reference as row ${seen[key]}`);
      } else {
        seen[key] = rowNumber;
      }
    }

    const status = normaliseStatus(cell(row, 'status'));
    if (!status) {
      errors.push(`Status "${text(row, 'status')}" isn't one of Booked, In transit, Delivered, Exception`);
    }

    const etaRaw = cell(row, 'eta');
    const eta = parseEta(etaRaw);
    if (mapping.eta >= 0 && !eta) {
      errors.push(String(etaRaw).trim() ? `ETA "${String(etaRaw).trim()}" isn't a date` : 'ETA is empty');
    }

    if (errors.length) {
      return { rowNumber, errors };
    }
    return {
      rowNumber,
      errors,
      shipment: {
        reference,
        customer,
        origin: text(row, 'origin'),
        destination: text(row, 'destination'),
        carrier: text(row, 'carrier'),
        status: status as ShipmentStatus,
        eta: eta as string
      }
    };
  });
}

/** A ready-to-fill CSV with the expected headers and one example row. */
export function templateCsv(): string {
  return ['Reference,Customer,Origin,Destination,Carrier,Status,ETA', 'CN-20001,Northwind Retail,Birmingham DC,Leeds,Road (in-house),Booked,2026-12-01'].join('\r\n') + '\r\n';
}
