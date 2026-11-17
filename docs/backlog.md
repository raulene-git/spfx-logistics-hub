# Backlog

## Done

- [x] Choose the scenario: logistics hub, starting with the Shipment Tracker
- [x] Record the SPFx and Node versions (see `decisions.md`)
- [x] Create the SPFx 1.24.1 solution with the official generator
- [x] Shipment Tracker web part: summary tiles, status filter, search, late flag
- [x] Demo data (`demo-data/shipments.csv`) and list provisioning script (`scripts/`)
- [x] Jest tests for the shipment logic
- [x] GitHub Actions CI building the `.sppkg`
- [x] Microsoft 365 tenant
- [x] Fieldnotes brand logo (`assets/brand/`)
- [x] Fieldnotes Hero web part: full-width banner, configurable button link, section picker
- [x] Shipment Tracker restyled as the full-width Dispatch Board: brand colours, live summary line, status tiles that filter, "Running late" filter
- [x] Fieldnotes tenant theme (`scripts/add-fieldnotes-theme.ps1`)
- [x] Toolbox groups: Fieldnotes: Page sections / News and people / Operations
- [x] Shared section frame, icons, brand tokens and web part base class (`src/common/`)
- [x] Discover, Callout Band and Quick Links web parts
- [x] News web part: latest published news posts with thumbnails, example stories until the first post
- [x] Coming Up web part: editable events, past ones drop off
- [x] Say Hello web part: example people, or new accounts from Entra ID via Microsoft Graph
- [x] Board Snapshot: compact "today at a glance" layout of the Dispatch Board
- [x] Shipment Importer: Excel/CSV upload, column matching, row checks, add or update list items (no library)

## Next

- [ ] Entra ID test users with departments, approve User.Read.All, switch Say Hello to Entra
- [ ] Say Hello: profile photos from Graph
- [ ] Deploy, run `provision-shipments-list.ps1`, and add screenshots and a GIF to the README
- [ ] Field customizer: status pills in list views
- [ ] List view command set: "Mark as delivered" bulk action
- [ ] Application customizer: depot alert banner
- [ ] Warehouse stock dashboard web part (Microsoft Graph)
- [ ] Viva Connections card: delivery summary
- [ ] GitHub Release with the `.sppkg` attached for each milestone
