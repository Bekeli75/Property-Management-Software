# Propentra — Frontend

Next.js (App Router, `app/`) client for the Propentra property-management platform. Roles: administrator, property owner, property manager, tenant.

## Prerequisites

- Node.js 18+
- Laravel backend running on `http://localhost:8000` (`php artisan serve`)
- Backend storage linked: `php artisan storage:link` (for property/maintenance images)

## Setup

```bash
npm install
```

Set the backend URL (defaults to `http://localhost:8000/api`):

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Run

```bash
npm run dev
# http://localhost:3000
```

## Demo data

Seed the database with realistic demo data (images require GD; reruns are idempotent):

```bash
php -d extension=gd artisan db:seed --class=DemoDataSeeder
```

Every seeded account uses password `password`:

| Role | Demo account |
|---|---|
| Administrator | `demo.admin@propentra.local` |
| Owner (Sunrise Tower, Green Heights) | `demo.owner@propentra.local` |
| Manager (Sunrise Tower, Green Heights) | `demo.manager@propentra.local` |
| Tenants | `demo.tenant@…demo.tenant5@propentra.local` |
| Extra test accounts | `test4@…test7@example.com` |

## Scripts

- `npm run dev` — development server
- `npm run lint` — ESLint
- `npm run build` — production build (run before shipping)

## Structure

- `app/` — routes (login, register, dashboard, properties, units, tenants, leases, payments, maintenance, expenses is backend-managed, reports, notifications, discussion, settings, profile)
- `components/` — `AppShell`, `AuthGuard`, `ResourceDetailPage`, plus `ui/` design-system primitives (Badge, Modal, FormField, EmptyState, Skeleton, PageHeader)
- `contexts/` — `AuthContext`, `ToastContext`
- `lib/api.js` — API client for `/api/v1`