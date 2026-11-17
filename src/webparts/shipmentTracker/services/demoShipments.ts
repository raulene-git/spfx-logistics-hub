import type { IShipment } from '../models/IShipment';

// Fictional sample data only: no real companies or people.
const demoShipments: IShipment[] = [
  { id: 1, reference: 'CN-10421', customer: 'Northwind Retail', origin: 'Birmingham DC', destination: 'Leeds', carrier: 'Road (in-house)', status: 'In transit', eta: '2026-11-18', lastUpdated: '2026-11-17T08:12:00Z' },
  { id: 2, reference: 'CN-10422', customer: 'Contoso Foods', origin: 'Bristol Hub', destination: 'Cardiff', carrier: 'Road (partner)', status: 'Delivered', eta: '2026-11-16', lastUpdated: '2026-11-16T14:40:00Z' },
  { id: 3, reference: 'CN-10423', customer: 'Fabrikam Garden', origin: 'Felixstowe Port', destination: 'Cambridge', carrier: 'Road (partner)', status: 'Exception', eta: '2026-11-17', lastUpdated: '2026-11-17T06:05:00Z' },
  { id: 4, reference: 'CN-10424', customer: 'Tailspin Toys', origin: 'Birmingham DC', destination: 'Manchester', carrier: 'Road (in-house)', status: 'Booked', eta: '2026-11-20', lastUpdated: '2026-11-15T16:22:00Z' },
  { id: 5, reference: 'CN-10425', customer: 'Northwind Retail', origin: 'Southampton Port', destination: 'Reading', carrier: 'Rail freight', status: 'In transit', eta: '2026-11-19', lastUpdated: '2026-11-17T09:30:00Z' },
  { id: 6, reference: 'CN-10426', customer: 'Adventure Works', origin: 'Glasgow Hub', destination: 'Edinburgh', carrier: 'Road (in-house)', status: 'Delivered', eta: '2026-11-15', lastUpdated: '2026-11-15T11:02:00Z' },
  { id: 7, reference: 'CN-10427', customer: 'Contoso Foods', origin: 'Bristol Hub', destination: 'Exeter', carrier: 'Road (partner)', status: 'In transit', eta: '2026-11-18', lastUpdated: '2026-11-17T07:48:00Z' },
  { id: 8, reference: 'CN-10428', customer: 'Fabrikam Garden', origin: 'Birmingham DC', destination: 'Nottingham', carrier: 'Road (in-house)', status: 'Booked', eta: '2026-11-21', lastUpdated: '2026-11-16T10:15:00Z' },
  { id: 9, reference: 'CN-10429', customer: 'Tailspin Toys', origin: 'Felixstowe Port', destination: 'London', carrier: 'Road (partner)', status: 'Exception', eta: '2026-11-16', lastUpdated: '2026-11-16T19:55:00Z' },
  { id: 10, reference: 'CN-10430', customer: 'Adventure Works', origin: 'Glasgow Hub', destination: 'Aberdeen', carrier: 'Air freight', status: 'Delivered', eta: '2026-11-14', lastUpdated: '2026-11-14T13:37:00Z' }
];

export default demoShipments;
