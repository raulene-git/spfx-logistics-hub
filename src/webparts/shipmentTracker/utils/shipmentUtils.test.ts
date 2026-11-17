import { countByStatus, filterShipments, isLate, summariseBoard } from './shipmentUtils';
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

  it('filters to shipments running late', () => {
    const today = new Date('2026-11-18T12:00:00Z');
    const result = filterShipments(demoShipments, 'Late', '', today);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((s) => isLate(s, today))).toBe(true);
  });
});

describe('summariseBoard', () => {
  it('counts exceptions and late shipments once each', () => {
    const base: IShipment = demoShipments[0];
    const today = new Date('2026-11-18T12:00:00Z');
    const items: IShipment[] = [
      { ...base, id: 1, status: 'Exception', eta: '2026-11-10' }, // exception and late: counted once
      { ...base, id: 2, status: 'In transit', eta: '2026-11-17' }, // late
      { ...base, id: 3, status: 'Booked', eta: '2026-11-25' }, // fine
      { ...base, id: 4, status: 'Delivered', eta: '2026-11-01' } // fine
    ];
    expect(summariseBoard(items, today)).toEqual({ total: 4, late: 2, needsLook: 2 });
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
