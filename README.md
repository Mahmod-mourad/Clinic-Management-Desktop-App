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
