<div dir="ltr">

# عيادتي — Clinic Management Desktop App

A full-featured, offline-first clinic management system built with **Electron + React + TypeScript**. Designed for Arabic-speaking clinics with full RTL support.

---

## Features

- **Patient Management** — Create and manage complete patient profiles with medical history, emergency contacts, and visit records
- **Appointment Scheduling** — Calendar view with time-slot management, queue tracking, and printable schedules
- **Medical Records** — Document visits, vital signs, diagnoses, prescriptions, and lab requests
- **Invoicing & Billing** — Generate invoices, track payments, and export PDF receipts
- **Reports & Analytics** — Daily summaries, financial reports, and visual dashboards with charts
- **Role-Based Access** — Admin, Doctor, and Receptionist roles with granular permissions
- **Audit Log** — Full action history for compliance and accountability
- **Recycle Bin** — Soft-delete with 30-day retention and restore
- **Backup & Restore** — Scheduled auto-backups with USB and Google Drive support
- **License Activation** — Built-in license management for distribution

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop Shell | Electron 34 |
| Frontend | React 18 + TypeScript 5 |
| Styling | Tailwind CSS + Radix UI |
| State | Zustand + TanStack Query |
| Database | SQLite via Better SQLite3 |
| ORM | Drizzle ORM |
| PDF Export | @react-pdf/renderer |
| Excel Export | ExcelJS |
| Build | Electron Vite + Electron Builder |
| Package Manager | pnpm |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Install

```bash
pnpm install
pnpm patch-apply   # apply required textkit patch for Arabic PDF rendering
```

### Development

```bash
pnpm dev
```

### Build

```bash
# macOS (Apple Silicon)
pnpm build:mac

# Windows (x64)
pnpm build:win
```

### Database

```bash
pnpm db:generate   # generate migrations from schema changes
pnpm db:push       # push schema to the local database
pnpm db:studio     # open Drizzle Studio to inspect data
```

---

## Project Structure

```
├── electron/
│   └── main/
│       ├── db/          # Schema, migrations, seed
│       ├── ipc/         # IPC handlers (one per feature)
│       └── services/    # Business logic layer
├── src/
│   ├── pages/           # App pages (Auth, Dashboard, Patients, …)
│   ├── components/      # Shared UI components
│   ├── hooks/           # Custom React hooks
│   ├── stores/          # Zustand stores
│   └── types/           # Shared TypeScript types
└── patches/             # Dependency patches
```

---

## Architecture

The app uses Electron's main/renderer separation strictly:

- **Main process** owns the SQLite database and all business logic through service classes
- **Renderer process** (React) communicates exclusively through typed IPC channels exposed via a preload script
- No direct database access from the renderer — all data flows through `window.api.*`

---

## License

MIT

</div>
<img width="2784" height="1824" alt="image" src="https://github.com/user-attachments/assets/a3c1faa8-30dc-40d7-8ed5-02d0012ba917" />
<img width="2880" height="1740" alt="image" src="https://github.com/user-attachments/assets/1aa337be-cafe-41bf-ac6d-53fb39bcdab8" />
<img width="2880" height="1740" alt="image" src="https://github.com/user-attachments/assets/d1dd32d6-3cfa-4c3b-a20a-cef8553dfbe7" />
<img width="2880" height="1740" alt="image" src="https://github.com/user-attachments/assets/dd405a72-6e40-4b19-a94e-3f248481d0a0" />
<img width="2880" height="1740" alt="image" src="https://github.com/user-attachments/assets/9f26b0d4-05d5-46bf-b5a3-884f0f9ab8a5" />

<img width="2880" height="1740" alt="image" src="https://github.com/user-attachments/assets/94cb0eb5-9052-48f3-aafd-f266bb6af0c5" />

