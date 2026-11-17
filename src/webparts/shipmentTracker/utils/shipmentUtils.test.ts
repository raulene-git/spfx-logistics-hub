import { countByStatus, filterShipments, isLate } from './shipmentUtils';
import demoShipments from '../services/demoShipments';
import type { IShipment } from '../models/IShipment';

describe('filterShipments', () => {
  it('returns everything for All with no query', () => {
    expect(filterShipments(demoShipments, 'All', '')).toHaveLength(demoShipments.length);
  });

  it('filters by status', () => {
    const result = filterShipments(demoShipments, 'Exception', '');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((s) => s.status === 'Exception')).toBe(true);
  });

  it('matches the query case-insensitively across fields', () => {
    expect(filterShipments(demoShipments, 'All', 'northwind').every((s) => s.customer === 'Northwind Retail')).toBe(true);
    expect(filterShipments(demoShipments, 'All', 'cn-10423').map((s) => s.reference)).toEqual(['CN-10423']);
  });
});

describe('countByStatus', () => {
  it('counts every status, including zero', () => {
    expect(countByStatus([])).toEqual({ Booked: 0, 'In transit': 0, Delivered: 0, Exception: 0 });
    const counts = countByStatus(demoShipments);
    const total = counts.Booked + counts['In transit'] + counts.Delivered + counts.Exception;
    expect(total).toBe(demoShipments.length);
  });
});

describe('isLate', () => {
  const base: IShipment = demoShipments[0];
  const today = new Date('2026-11-18T12:00:00Z');

  it('is late when the ETA has passed and it is not delivered', () => {
    expect(isLate({ ...base, status: 'In transit', eta: '2026-11-17' }, today)).toBe(true);
  });

  it('is never late once delivered', () => {
    expect(isLate({ ...base, status: 'Delivered', eta: '2026-11-01' }, today)).toBe(false);
  });

  it('is not late on the ETA day itself', () => {
    expect(isLate({ ...base, status: 'Booked', eta: '2026-11-18' }, today)).toBe(false);
  });
});
