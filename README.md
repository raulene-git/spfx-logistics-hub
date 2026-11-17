# SPFx Logistics Hub

SharePoint Framework (SPFx) solutions for a fictional logistics company: tracking consignments, warehouse stock and deliveries inside SharePoint and Teams.

![SPFx](https://img.shields.io/badge/SPFx-1.24.1-0078d4)
![React](https://img.shields.io/badge/React-18.3.1-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6)
![Node](https://img.shields.io/badge/Node-26_LTS-339933)
[![CI](https://github.com/raulene-git/spfx-logistics-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/raulene-git/spfx-logistics-hub/actions/workflows/ci.yml)

> **Status:** in progress. Web part 1 of the hub, the **Shipment Tracker**, is built and tested.
> Screenshots will be added once it's deployed to a test tenant.

## Components

| Component | Type | Status |
| --- | --- | --- |
| **Shipment Tracker** | Web part | ✅ Built |
| Delivery status pills | Field customizer | Planned |
| "Mark as delivered" bulk action | List view command set | Planned |
| Depot alert banner | Application customizer | Planned |
| Warehouse stock dashboard | Web part (Microsoft Graph) | Planned |
| Delivery summary card | Viva Connections Adaptive Card Extension | Planned |

## Shipment Tracker

Shows consignments from a SharePoint list with:

- **Summary tiles:** counts per status, plus how many are running late
- **Status filter tabs** with counts, and **free-text search** across reference, customer, route and carrier
- **Colour-coded status pills** and a **late** flag when the ETA has passed and the shipment isn't delivered
- **Two data sources**, chosen in the property pane:
  - *Demo data* (built in), so it works on any page with no setup
  - *SharePoint list*, read with `SPHttpClient` from a list created by the provisioning script
- Follows the site theme and runs in SharePoint pages, full-page apps and Teams tabs

### How it's built

```
src/webparts/shipmentTracker/
├─ ShipmentTrackerWebPart.ts       Web part class, property pane, picks the data service
├─ components/ShipmentTracker.tsx  React function component (Fluent UI DetailsList, Pivot, SearchBox)
├─ models/IShipment.ts             Shipment type and status values
├─ services/
│  ├─ IShipmentService.ts          Data access interface
│  ├─ MockShipmentService.ts       Built-in demo data
│  └─ SharePointShipmentService.ts SharePoint REST via SPHttpClient
└─ utils/shipmentUtils.ts          Filtering, counts, late logic (+ Jest tests)
```

The UI depends only on `IShipmentService`, so the data source can be swapped without touching components. The same approach will be used for a Microsoft Graph or PnPjs service later.

## Getting started

**Prerequisites:** Node.js 26 LTS (this repo pins it in `.node-version`; [fnm](https://github.com/Schniz/fnm) switches automatically).

```powershell
npm install
npm run build      # lint + compile + Jest tests + package sharepoint/solution/spfx-logistics-hub.sppkg
npm run start      # serve locally for the SharePoint hosted workbench
```

### Deploy to a tenant

1. Create the list and demo data (needs [PnP.PowerShell](https://pnp.github.io/powershell/)):
   ```powershell
   ./scripts/provision-shipments-list.ps1 -SiteUrl https://<tenant>.sharepoint.com/sites/<site> -ClientId <entra-app-id>
   ```
2. Upload `sharepoint/solution/spfx-logistics-hub.sppkg` to the tenant **App Catalog** and deploy it.
3. Add **Shipment Tracker** to a page. In the property pane, choose *SharePoint list* and enter `Shipments`.

## Quality

- **CI:** GitHub Actions runs `npm ci` and `npm run build` on every push and pull request, then uploads the `.sppkg` as a build artifact.
- **Tests:** Jest unit tests for the filtering, counting and late-detection logic (`*.test.ts`).
- **Decisions** are recorded in [`docs/decisions.md`](docs/decisions.md), and the plan is in [`docs/backlog.md`](docs/backlog.md).

## Data

All data in this repository (`demo-data/`, `demoShipments.ts`) is **fictional**. Company names are Microsoft's standard sample names.

## License

[MIT](LICENSE)
