# Testing

## Automated

| Suite | Location | What it covers | How to run |
| --- | --- | --- | --- |
| Jest unit tests | `src/**/*.test.ts` | Filtering, counts per status, late detection | `npm run build` (runs `heft test`) |
| CI | `.github/workflows/ci.yml` | Lint, compile, tests, packaging on every push and PR | Automatic |

Last local run: 2026-11-17, Node 26.13.1. 7 tests passed and the `.sppkg` was packaged.

## Manual (once a tenant is available)

| ID | Scenario | Expected result | Result |
| --- | --- | --- | --- |
| T-001 | Add the web part with the default (demo) data source | Tiles, tabs and the table render; "Demo data" badge shows | Not run |
| T-002 | Switch to *SharePoint list* → `Shipments` | Items load from the list; the badge disappears | Not run |
| T-003 | Enter a list name that doesn't exist | An error message bar shows the HTTP status | Not run |
| T-004 | Switch the site to a dark theme | Text and tiles stay readable | Not run |
| T-005 | Add as a Teams tab | Renders the same as on a SharePoint page | Not run |
