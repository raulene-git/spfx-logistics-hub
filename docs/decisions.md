# Decision log

| # | Decision | Status | Date |
| --- | --- | --- | --- |
| 001 | Use SPFx 1.24.1 with React 18.3.1 and the Heft toolchain | Accepted | 2026-11-17 |
| 002 | Node.js 26 LTS, pinned in `.node-version` and managed with fnm | Accepted | 2026-11-17 |
| 003 | SharePoint list as the first data source, behind an `IShipmentService` interface | Accepted | 2026-11-17 |
| 004 | Built-in demo data mode so the web part can be shown without a list | Accepted | 2026-11-17 |

---

### 001: SPFx 1.24.1, React 18.3.1, Heft

- **Context:** Starting a new SPFx portfolio in November 2026.
- **Decision:** Use the latest GA generator (1.24.1, checked with `npm view` and against Microsoft's compatibility page). React is pinned to exactly 18.3.1, as SPFx 1.24 requires.
- **Consequences:** Uses the Heft build (`npm run build` / `npm run start`), not Gulp.

### 002: Node.js 26 LTS via fnm

- **Context:** SPFx 1.24 supports Node 22, 24 and 26. Microsoft recommends 26 LTS.
- **Decision:** Pin `26` in `.node-version`. fnm switches to it on `cd`, and CI reads the same file.
- **Consequences:** Local builds and CI use the same Node version.

### 003: SharePoint list behind a service interface

- **Context:** Data could come from SharePoint lists, Microsoft Graph or an external API.
- **Options:** 1) call REST directly from components, 2) PnPjs, 3) `SPHttpClient` behind an interface.
- **Decision:** Option 3. `SPHttpClient` needs no extra dependencies, and the interface keeps components independent of the data source.
- **Consequences:** Switching to PnPjs or Graph later means writing one new class.

### 004: Demo data mode

- **Context:** There's no tenant yet, and visitors to the repo can't deploy it themselves.
- **Decision:** The default data source is built-in fictional data. A "Demo data" badge shows when it's in use.
- **Consequences:** The web part shows something useful on any page straight away, and screenshots are easy.
