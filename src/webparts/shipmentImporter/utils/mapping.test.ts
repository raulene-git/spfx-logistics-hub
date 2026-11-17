import { autoMap, normaliseStatus, parseEta, validateRows } from './mapping';
import { columnIndex, parseCsv } from './spreadsheet';

describe('autoMap', () => {
  it('matches common header names in any order', () => {
    const m = autoMap(['ETA', 'Consignment Ref', 'Client', 'From', 'Deliver to', 'Haulier', 'State']);
    expect(m).toEqual({ reference: 1, customer: 2, origin: 3, destination: 4, carrier: 5, status: 6, eta: 0 });
  });

  it('marks missing columns with -1', () => {
    expect(autoMap(['Reference', 'Customer']).eta).toBe(-1);
  });
});

describe('normaliseStatus', () => {
  it('understands everyday wording', () => {
    expect(normaliseStatus('in-transit')).toBe('In transit');
    expect(normaliseStatus('Out for delivery')).toBe('In transit');
    expect(normaliseStatus('COMPLETED')).toBe('Delivered');
    expect(normaliseStatus('On hold')).toBe('Exception');
    expect(normaliseStatus('')).toBe('Booked');
    expect(normaliseStatus('lost in space')).toBeUndefined();
  });
});

describe('parseEta', () => {
  it('reads Excel date numbers', () => {
    expect(parseEta(46344)).toBe('2026-11-18');
  });

  it('reads ISO and UK dates', () => {
    expect(parseEta('2026-11-18')).toBe('2026-11-18');
    expect(parseEta('18/11/2026')).toBe('2026-11-18');
    expect(parseEta('18.11.26')).toBe('2026-11-18');
  });

  it('rejects impossible dates and text', () => {
    expect(parseEta('31/02/2026')).toBeUndefined();
    expect(parseEta('next week')).toBeUndefined();
  });
});

describe('validateRows', () => {
  const mapping = autoMap(['Reference', 'Customer', 'Origin', 'Destination', 'Carrier', 'Status', 'ETA']);

  it('accepts a good row', () => {
    const [r] = validateRows([['CN-1', 'Northwind', 'Leeds', 'York', 'Road', 'Delivered', '2026-11-18']], mapping);
    expect(r.errors).toEqual([]);
    expect(r.shipment).toMatchObject({ reference: 'CN-1', status: 'Delivered', eta: '2026-11-18' });
    expect(r.rowNumber).toBe(2);
  });

  it('explains what is wrong with a bad row', () => {
    const results = validateRows(
      [
        ['CN-1', 'Northwind', '', '', '', 'Booked', '2026-11-18'],
        ['CN-1', '', '', '', '', 'Unknown', 'soon']
      ],
      mapping
    );
    expect(results[1].shipment).toBeUndefined();
    expect(results[1].errors).toEqual([
      'Customer is empty',
      'Same reference as row 2',
      'Status "Unknown" isn\'t one of Booked, In transit, Delivered, Exception',
      'ETA "soon" isn\'t a date'
    ]);
  });
});

describe('spreadsheet helpers', () => {
  it('parses CSV with quotes and commas', () => {
    expect(parseCsv('a,b\r\n"Leeds, UK","say ""hi"""\n')).toEqual([
      ['a', 'b'],
      ['Leeds, UK', 'say "hi"']
    ]);
  });

  it('converts column letters', () => {
    expect(columnIndex('A1')).toBe(0);
    expect(columnIndex('C7')).toBe(2);
    expect(columnIndex('AA3')).toBe(26);
  });
});
