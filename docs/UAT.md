# UAT Checklist & Journey Verification

This document is the user-acceptance checklist for Propentra. It maps the six core
journeys to UI steps and to an automated API smoke check that confirms the backend
behaves correctly (scoping, RBAC, and data availability).

## Demo accounts

All passwords are `password`.

| Role          | Email                            | Scope                                   |
| ------------- | -------------------------------- | --------------------------------------- |
| administrator | demo.admin@propentra.local       | Everything                              |
| owner         | demo.owner@propentra.local       | Sunrise Heights, Green Valley           |
| manager       | demo.manager@propentra.local     | Sunrise Heights, Green Valley           |
| tenant        | demo.tenant@propentra.local      | Letina (Unit B-104, Sunrise)            |
| other tenants | test5@example.com … test7@example.com | Cedar Executive / Baro Garden tenants |

## The six journeys

### J1 — Tenant pays rent (portal)
1. Register or log in as a tenant → redirected to the tenant dashboard.
2. Dashboard shows the assigned unit, rent amount, due date, and balance.
3. "Pay rent" opens payment; a recorded payment appears in the payments list.
4. Notifications reflect new payment/bill activity.

### J2 — Tenant reports maintenance
1. Tenant submits a maintenance request with an optional photo.
2. Request appears in the tenant's maintenance list as `pending`.
3. Manager/owner/administrator sees the request in their maintenance list.

### J3 — Staff creates a lease
1. Administrator/owner/manager opens Leases → New lease.
2. Property → unit → tenant → rent → start/end dates are validated.
3. Overlapping or conflicting leases are rejected; the new lease appears in lists.

### J4 — Early lease termination
1. Open a lease → Request/Complete termination → status becomes `pending_termination`.
2. On approval the lease is terminated and the unit frees up.

### J5 — Owner dashboard & reports
1. Owner logs in; sees only owned properties on the dashboard (Sunrise, Green — not Cedar, Baro).
2. Reports respond to date ranges and show rent collected / outstanding.

### J6 — Manager operations
1. Manager sees only assigned properties (Sunrise, Green).
2. Manager can manage units, tenants, leases, maintenance, and payments within that scope
   but cannot administer users (owner/administrator only).

## RBAC matrix (verified)

| Endpoint                      | admin | owner | manager | tenant  |
| ----------------------------- | :---: | :---: | :-----: | :-----: |
| GET /dashboard                | yes   | yes   | yes     | yes     |
| GET /properties               | all   | own   | assigned| **403** |
| GET /users                    | yes   | 403   | 403     | 403     |
| GET /leases / payments        | all   | own   | assigned| own     |
| GET /maintenance              | all   | own   | assigned| own     |
| GET /tenant-portal/*          | –     | –     | –       | yes     |
| GET /search                   | all   | own   | assigned| own     |

## Automated smoke check

`docs/smoke/journey-smoke.ps1` logs in as each role and asserts the invariants above
(read-only; it never mutates data). Run it against a seeded, running backend:

```powershell
# backend running on http://localhost:8000
powershell -ExecutionPolicy Bypass -File docs/smoke/journey-smoke.ps1
```

Expected: `RESULT: 27 passed, 0 failed`.

### Bug caught & fixed during this audit
- **Tenant property leak**: `GET /api/v1/properties` returned the full property
  directory to any authenticated tenant. Fixed in
  `backend/app/Http/Controllers/Api/V1/PropertyController.php` — tenants now receive
  `403`, consistent with the RBAC matrix (frontend already prevented the page).

## Manual UAT tracking

Use a copy of the matrix below while clicking through in the browser:

| Journey | Verified by | Date | Notes |
| ------- | ----------- | ---- | ----- |
| J1 Tenant rent |            |      |       |
| J2 Maintenance |            |      |       |
| J3 Lease creation |          |      |       |
| J4 Early termination |       |      |       |
| J5 Owner dashboard |         |      |       |
| J6 Manager ops |             |      |       |

## Known limitations
- Payment initiation shells out to the Chapa sandbox; callback requires real Chapa
  keys to go end-to-end.
- `pending_termination` records exist only once a termination is requested manually;
  the seeder ships leases in `active`/`expired` states.