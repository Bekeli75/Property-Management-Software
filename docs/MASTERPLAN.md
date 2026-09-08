# Property Management Software — Master Plan

**Document:** `MASTERPLAN.md`  
**Version:** 1.0  
**Status:** Implementation Master Plan  
**Project:** Property Management Software MVP  
**Delivery Target:** 6 weeks  
**Frontend:** React.js → Vercel  
**Backend:** Laravel REST API → Wasmer  
**Database:** MySQL / approved relational database  
**Payment:** Chapa Developer Tier / test environment  
**Currency:** ETB

---

# 1. Purpose

This master plan converts the approved PRD, SRS, and API Contract into one practical execution plan for building, testing, securing, and deploying the MVP.

The PRD defines product vision, scope, priorities, journeys, acceptance, and release criteria; the SRS defines detailed functional, technical, data, security, validation, and verification requirements; and the API Contract defines the frontend/backend integration agreement. fileciteturn1file2L233-L253

---

# 2. Source-of-Truth Hierarchy

Use the project documents in this order:

### Product decisions
**PRD v1.0**

Controls:

- product vision
- MVP scope
- feature priorities
- product journeys
- product-level acceptance
- release criteria

### Technical requirements
**SRS v2.0**

Controls:

- detailed functional requirements
- security
- data
- business rules
- non-functional requirements
- testing
- deployment

The PRD explicitly states that the SRS is authoritative for technical/detail interpretation. fileciteturn2file8L818-L831

### Integration contract
**API Contract v1.0**

Controls:

- endpoint names
- request fields
- response structures
- status codes
- validation expectations
- frontend/backend integration behavior

The API Contract requires changes to be agreed and documented rather than silently changing endpoints or fields. fileciteturn2file1L99-L119

---

# 3. Important Document Alignment Issue

The uploaded documents contain a version-label mismatch:

- SRS is **Version 2.0**
- API Contract says it is aligned to **SRS v1.0** in some references

Do not silently choose a new requirement interpretation.

**Action:** treat the SRS v2.0 as the technical authority because the PRD explicitly assigns that authority, then update the API Contract wording/document references through the project's change-control process.

This is documentation alignment work, not a reason to invent new product behavior.

---

# 4. MVP Definition

The product centralizes:

**Properties → Units → Tenants → Leases → Rent & Payments → Maintenance → Financials → Dashboards**

Core MVP areas include authentication/RBAC, property management, units, tenants, leases, rent/payment management, maintenance, financial management, dashboards, profiles, notifications, discussion cases, early termination, reports, validation, security, and deployment. fileciteturn2file8L840-L849

---

# 5. Priority Model

## P0 — Must Have

These are release blockers:

- Authentication & RBAC
- Property Management
- Unit Management
- Tenant Management
- Lease Management
- Rent & Payment Management
- Maintenance Management

The PRD identifies these as P0. fileciteturn2file4L359-L390

## P1 — Included

- Financial Management
- Dashboards
- Profile Management
- Payment due-date notifications where approved
- Discussion Cases
- Early Lease Termination

## P2 / Out of Scope

Do not build:

- advanced accounting/tax
- AI recommendations
- IoT/smart-home integrations
- native mobile apps
- advanced tenant screening
- property marketplace
- general-purpose real-time chat
- complex international billing
- live production payment settlement
- automated legal determination
- advanced arbitration/dispute resolution
- unapproved SMS/email/push notifications
- advanced BI/predictive analytics

These are explicitly outside the initial MVP. fileciteturn2file4L391-L405

---

# 6. Non-Negotiable Business Rules

Implement these server-side.

### Authorization

- Owner → owned properties only
- Manager → explicitly assigned properties only
- Tenant → own tenancy information only
- Administrator → system-level administration

### Data integrity

- Unit belongs to one property.
- Lease references one valid tenant and one valid unit.
- Lease end date follows start date.
- Active leases cannot overlap on the same unit unless explicitly approved.
- Occupancy remains consistent with active leases.
- Payment/expense amounts are positive.
- Monetary values use ETB.
- Manual and simulated online payments remain distinguishable.
- Test Chapa transactions are never treated as live settlement.
- Records with active dependencies should be archived/deactivated rather than casually hard-deleted.

These business rules are explicitly defined by the SRS. fileciteturn1file5L563-L585

---

# 7. Architecture

```text
                    ┌──────────────────────┐
                    │      Browser         │
                    │ Desktop / Tablet /   │
                    │ Mobile               │
                    └──────────┬───────────┘
                               │ HTTPS
                               ▼
                    ┌──────────────────────┐
                    │ React.js Frontend    │
                    │        Vercel        │
                    └──────────┬───────────┘
                               │ REST/JSON
                               │ /api/v1
                               ▼
                    ┌──────────────────────┐
                    │ Laravel REST API     │
                    │       Wasmer         │
                    ├──────────────────────┤
                    │ Sanctum              │
                    │ Form Requests        │
                    │ Policies / Gates     │
                    │ API Resources        │
                    │ Domain Services      │
                    └───────┬───────┬──────┘
                            │       │
                    ┌───────▼──┐ ┌──▼──────────┐
                    │  MySQL   │ │ Chapa Test  │
                    │ Database │ │ Integration │
                    └──────────┘ └─────────────┘
```

The SRS specifies React.js, Laravel REST API, relational database, HTTPS/REST/JSON, Vercel, Wasmer, and server-side Chapa test integration. fileciteturn2file10L1029-L1053

---

# 8. Repository Strategy

Recommended top-level structure:

```text
property-management-software/
├── frontend/
├── backend/
├── docs/
│   ├── DESIGN.md
│   ├── MASTERPLAN.md
│   ├── API-CONTRACT.md
│   ├── ERD.md
│   └── CHANGELOG.md
├── .gitignore
└── README.md
```

If frontend/backend already exist separately, preserve the current repository strategy rather than restructuring unnecessarily.

---

# 9. Environment and Secrets

Never commit:

```text
.env
.env.local
.env.production
```

or any secret credential.

Use environment variables for:

### Frontend

- API base URL
- non-secret public configuration

### Backend

- database credentials
- application key
- Chapa secret
- other private integration configuration

The SRS explicitly requires secrets/API keys/database credentials to remain outside source code, and Chapa credentials must never be exposed to React. fileciteturn1file9L898-L911

---

# 10. API Contract Baseline

Base:

```text
/api/v1
```

Core modules:

```text
/auth
/users
/properties
/units
/tenants
/leases
/payments
/maintenance
/discussion-cases
/expenses
/financials
/reports
/dashboard
/notifications
```

The API Contract defines these resources and their endpoints. fileciteturn2file1L120-L148

Standard response:

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "meta": {}
}
```

Error response:

```json
{
  "success": false,
  "message": "...",
  "errors": {},
  "data": null
}
```

Do not create ad-hoc response formats per controller.

---

# 11. Backend Implementation Rules

Use:

- Laravel Sanctum
- Form Request validation
- Policies/Gates
- API Resources
- Services for sufficiently complex business logic
- database relationships and constraints
- automated feature tests

The API Contract specifically recommends Form Requests, API Resources, Policies/Gates, and services for complex logic such as outstanding-rent calculations and Chapa integration. fileciteturn2file1L96-L112

---

# 12. Backend Module Order

Build in dependency order.

## Phase A — Foundation

1. Laravel setup
2. Database connection
3. Environment configuration
4. Sanctum
5. Base API response format
6. Exception/error handling
7. Form Request conventions
8. API Resource conventions
9. Policy conventions
10. Test framework
11. API documentation

## Phase B — Identity

12. User model
13. Roles
14. Login
15. Logout
16. Current user
17. Password reset
18. Profile
19. Role authorization
20. Scope authorization

## Phase C — Core Property Domain

21. Properties
22. Property ownership
23. Manager assignments
24. Units
25. Tenant records

## Phase D — Tenancy

26. Leases
27. Lease lifecycle
28. Overlap prevention
29. Occupancy consistency
30. Early termination requests

## Phase E — Money

31. Manual payments
32. Payment references
33. Outstanding rent logic
34. Chapa test initiation
35. Chapa callback
36. Test payment status
37. Expenses
38. Financial overview

## Phase F — Operations

39. Maintenance
40. Discussion Cases
41. Notifications
42. Reports
43. Dashboard aggregation

---

# 13. Frontend Implementation Order

Do not build every screen independently.

## Foundation

1. React project setup
2. Routing
3. Styling/design tokens
4. API client
5. auth context/state
6. protected routes
7. role-aware navigation
8. reusable UI components
9. form patterns
10. table patterns
11. loading/error/empty states

## Authentication

12. Login
13. Logout
14. Forgot password
15. Reset password
16. Profile

## P0 Modules

17. Properties
18. Units
19. Tenants
20. Leases
21. Payments
22. Maintenance

## P1 Modules

23. Financials
24. Dashboards
25. Notifications
26. Discussion Cases
27. Early Termination
28. Reports

## Final UX

29. responsive pass
30. accessibility pass
31. error-state pass
32. empty-state pass
33. loading-state pass
34. consistency pass
35. visual polish

---

# 14. Six-Week Delivery Plan

## Week 1 — Foundation, Decisions, Security Baseline

### Objectives

Create a stable foundation before building feature-heavy screens.

### Backend

- Laravel project baseline
- database setup
- Sanctum
- User model
- roles
- authentication endpoints
- API response envelope
- validation/error conventions
- initial authorization policies
- initial tests

### Frontend

- React project baseline
- routing
- app shell
- design system
- login
- auth state
- protected routes
- role-aware navigation

### Integration

- connect frontend to `/api/v1`
- verify login
- verify authenticated `/auth/me`
- verify logout

### Required decisions

Resolve the highest-risk open questions early:

- OQ-01 billing/allocation rules
- OQ-02 mandatory property fields
- OQ-03 unit statuses
- OQ-04 notification timing

The PRD identifies OQ-01 and OQ-02 as particularly important to Week 1. fileciteturn3file2L270-L308

### Deployment

Perform an early staging deployment rather than waiting for Week 6. The PRD specifically recommends exercising Vercel/Wasmer deployment from Week 1. fileciteturn3file4L512-L517

---

# 15. Week 2 — Properties, Units, Tenants

### Backend

- properties CRUD
- ownership scope
- manager assignment
- units CRUD
- tenant CRUD
- policies
- validation
- feature tests

### Frontend

- property list/detail/form
- manager assignment UI
- unit list/detail/form
- tenant list/detail/form
- responsive tables/cards

### Security tests

Verify:

- Owner cannot access another owner's property.
- Manager cannot access an unassigned property.
- Tenant cannot access management resources.
- Unauthorized users cannot modify resources.

---

# 16. Week 3 — Leases and Payment Foundation

### Backend

- leases CRUD
- lease validation
- overlap rule
- occupancy synchronization
- termination request model/workflow
- manual payments
- payment validation
- payment references
- outstanding rent service

### Frontend

- lease list
- lease creation workflow
- lease detail
- termination request UI
- payment list
- record payment form
- payment detail
- outstanding-rent display

### Critical test cases

- end date before start date
- overlapping active lease
- invalid unit
- invalid tenant
- negative rent
- zero payment
- duplicate reference
- unauthorized payment access

---

# 17. Week 4 — Chapa Test, Maintenance, Financials

### Backend

- Chapa test initiation
- callback
- status handling
- transaction/reference storage
- maintenance CRUD/workflow
- expenses
- financial overview

### Frontend

- tenant payment workflow
- explicit test-payment messaging
- maintenance request form
- maintenance management board/list
- expense form/list
- financial overview

### Security

Confirm:

- Chapa secret remains backend-only.
- Payment callback is controlled.
- Test transactions cannot be interpreted as live settlement.
- Tenant sees only own payment/maintenance information.

The SRS requires test-payment status/reference tracking and specifically separates simulated payments from live settlement. fileciteturn1file6L623-L643

---

# 18. Week 5 — Dashboards, Reports, Notifications, UAT

### Backend

- dashboard aggregation
- reports
- notifications
- discussion cases
- final profile behavior

### Frontend

- Owner dashboard
- Manager dashboard
- Tenant dashboard
- Administrator dashboard/oversight
- reports
- notifications
- discussion cases
- final navigation refinement

### UAT preparation

Prepare:

- realistic test data
- UAT scenarios
- role accounts
- expected outcomes
- defect tracking

The PRD requires UAT planning and resolution of UAT-related open questions before release. fileciteturn3file2L245-L261

---

# 19. Week 6 — Hardening, Testing, Deployment, Release

No major feature expansion unless a critical acceptance issue requires it.

### Functional testing

- all P0 requirements
- baseline P1 requirements
- all six core journeys

### Security testing

Test:

- authentication
- RBAC
- ownership
- manager assignment
- tenant isolation
- ID guessing
- direct URL access
- unauthorized API requests
- client-side role manipulation attempts

### Payment testing

Cover:

- successful test payment
- failure
- cancellation
- invalid input
- duplicate references
- status transitions

The SRS explicitly requires these payment tests. fileciteturn2file10L960-L975

### Responsive testing

Minimum viewport target:

```text
360px
375px
390px
414px
768px
1024px
1280px
1440px
1920px
```

### Regression

Run regression after major fixes.

### Deployment

- production frontend → Vercel
- production backend → Wasmer
- production database configuration
- environment variables
- HTTPS
- Chapa test integration
- smoke tests

---

# 20. Core User Journeys to Verify

## J1 — Tenant Rent

```text
Login
→ Dashboard
→ Review lease/rent
→ Review outstanding
→ Test payment or manual payment
→ Payment status/reference
→ Updated history/outstanding
```

## J2 — Maintenance

```text
Login
→ My Maintenance
→ Create request
→ Pending
→ Owner/Manager reviews
→ In Progress
→ Completed
→ Tenant sees updated status
```

## J3 — Lease Creation

```text
Property
→ Unit
→ Tenant
→ Lease information
→ Validation
→ Overlap check
→ Create
→ Lifecycle status
```

## J4 — Early Termination

```text
Request
→ Discussion
→ Proposed terms
→ Review
→ Agreed/withdrawn
→ Recorded outcome
```

No automatic legal determination.

## J5 — Owner

```text
Login
→ Dashboard
→ Properties
→ Occupancy
→ Tenants
→ Leases
→ Rent
→ Maintenance
→ Expenses
→ Financials
→ Reports
```

## J6 — Manager

Same operational flow as Owner, but only within explicitly assigned properties.

These journeys are directly defined by the PRD. fileciteturn2file4L406-L431

---

# 21. Security Master Checklist

## Authentication

- [ ] Protected endpoints require authentication.
- [ ] Passwords are hashed.
- [ ] Logout invalidates active authentication.
- [ ] Password reset is controlled.
- [ ] Session/authentication behavior is tested.

## Authorization

- [ ] Policies/Gates exist.
- [ ] Authorization happens server-side.
- [ ] Ownership is checked server-side.
- [ ] Manager assignments are checked server-side.
- [ ] Tenant ownership is checked server-side.
- [ ] Client-supplied role/user/property IDs are never blindly trusted.

## Secrets

- [ ] `.env` excluded from Git.
- [ ] production credentials outside source code.
- [ ] Chapa secret backend-only.
- [ ] database credentials outside repository.
- [ ] no secrets in frontend bundles.
- [ ] no secrets in logs.

## API

- [ ] validation before persistence
- [ ] correct HTTP status codes
- [ ] controlled errors
- [ ] no stack traces
- [ ] no sensitive fields in unnecessary responses
- [ ] HTTPS in production

The SRS security requirements explicitly cover these areas. fileciteturn1file9L898-L920

---

# 22. Data Model Baseline

High-level relationships:

```text
User
 ├── role
 └── may correspond to Tenant

Property Owner
 └── owns Properties

Property Manager
 └── assigned to Properties

Property
 └── Units

Tenant + Unit
 └── Lease

Lease
 └── Payments

Tenant
 └── Maintenance Requests

Property
 └── Expenses
```

The SRS requires a detailed ERD before database implementation. fileciteturn2file10L1015-L1027

---

# 23. API Definition of Done

Every endpoint is incomplete until all are true:

- [ ] route exists under `/api/v1`
- [ ] authentication middleware is correct
- [ ] authorization/policy exists
- [ ] Form Request validation exists
- [ ] controller delegates appropriately
- [ ] business rules are server-side
- [ ] API Resource/response matches contract
- [ ] ETB handling is correct
- [ ] HTTP status is correct
- [ ] error envelope is correct
- [ ] automated backend test exists
- [ ] frontend integration is tested
- [ ] documentation is updated if contract changes

This checklist comes directly from the API Contract's endpoint definition of done. fileciteturn2file1L99-L112

---

# 24. Frontend Definition of Done

Every screen is incomplete until:

- [ ] correct route
- [ ] correct role access
- [ ] correct API endpoint
- [ ] loading state
- [ ] empty state
- [ ] error state
- [ ] success feedback
- [ ] form validation
- [ ] responsive layout
- [ ] accessible controls
- [ ] correct status labels
- [ ] correct ETB formatting
- [ ] no unauthorized data displayed
- [ ] no duplicated business logic that belongs on backend

---

# 25. Testing Pyramid

```text
             UAT
              ▲
       Integration Tests
              ▲
       API / Feature Tests
              ▲
     Unit / Service Tests
```

### Backend

- unit/service logic
- API feature tests
- validation
- policies
- business rules

### Frontend

- forms
- interactions
- protected routes
- important components

### Integration

- React ↔ Laravel
- Laravel ↔ MySQL
- Laravel ↔ Chapa test

### Security

- four roles
- scope boundaries
- tenant isolation
- direct URL/API access

### Regression

Repeat after major changes.

The SRS explicitly requires unit/service tests, API tests, frontend tests, integration testing, role/permission tests, payment tests, responsive testing, regression testing, and UAT. fileciteturn2file10L960-L975

---

# 26. Performance Targets

Target:

**95% of common CRUD/dashboard requests ≤ 3 seconds under expected MVP usage.**

Avoid:

- unnecessary API calls
- repeated dashboard requests
- loading every related record when only summary data is needed
- frontend calculations that should be server-side
- unbounded list queries

The 3-second target is defined by NFR-02. fileciteturn1file5L586-L603

---

# 27. Scope-Control Rules

When a new feature is requested:

1. Identify whether it is P0, P1, P2, or out of scope.
2. Check whether it affects the API contract.
3. Check whether it changes data relationships.
4. Check security implications.
5. Check timeline impact.
6. Get approval if it materially changes scope.
7. Update PRD/SRS/API/tests as applicable.
8. Only then implement.

Do not allow “small” additions to silently create scope creep.

The PRD requires material changes to scope, behavior, business rules, security, data, API, timeline, or deployment to go through change control. fileciteturn3file4L580-L585

---

# 28. Risk Management

| Risk | Mitigation |
|---|---|
| Chapa unavailable | Integrate early; keep manual payments independent |
| Scope creep | Enforce P0/P1 priorities |
| Billing rules unresolved | Resolve OQ-01 early |
| RBAC mistakes | Test boundaries continuously |
| Integration blockers | Integrate frontend/backend continuously |
| Deployment surprises | Stage on Vercel/Wasmer from Week 1 |
| UAT participants unavailable | Schedule before Week 5 |
| API changes late | Version and change-control the contract |

These risks and mitigations are explicitly identified by the PRD. fileciteturn3file2L286-L345

---

# 29. Release Gate

The product is **not ready** merely because all pages exist.

Release requires:

## Functional

- [ ] 100% P0 requirements implemented and passing acceptance criteria
- [ ] baseline P1 requirements implemented
- [ ] six core journeys work end-to-end
- [ ] lease lifecycle works
- [ ] overlap rules work
- [ ] payment workflows work
- [ ] maintenance workflow works
- [ ] basic financials work in ETB

## Security

- [ ] all four roles work
- [ ] ownership restrictions work
- [ ] manager assignment restrictions work
- [ ] tenant isolation works
- [ ] no unresolved Critical/High authorization defects

## UX

- [ ] workflows understandable without guidance
- [ ] forms validate
- [ ] errors are clear
- [ ] responsive behavior works from 360px upward

## Quality

- [ ] functional testing complete
- [ ] integration testing complete
- [ ] security testing complete
- [ ] responsive testing complete
- [ ] regression testing complete
- [ ] UAT completed
- [ ] no unresolved Critical/High defects

## Deployment

- [ ] Vercel frontend verified
- [ ] Wasmer backend verified
- [ ] environment configuration verified
- [ ] Chapa test workflow verified in deployed environment

The PRD defines these release-readiness requirements. fileciteturn3file4L534-L559

---

# 30. Daily Development Loop

For every implementation task:

```text
Read requirement
      ↓
Confirm API/data dependency
      ↓
Design UI/flow
      ↓
Implement backend
      ↓
Write backend tests
      ↓
Implement frontend
      ↓
Integrate exact API contract
      ↓
Test role/scope boundaries
      ↓
Test responsive behavior
      ↓
Review error/loading/empty states
      ↓
Commit
      ↓
Update documentation if needed
```

Never postpone authorization testing until the final week.

---

# 31. Git / Documentation Discipline

Recommended commit style:

```text
feat(auth): implement Sanctum login flow
feat(properties): add property management
feat(units): add unit management
feat(leases): implement lease validation
feat(payments): add manual payment recording
feat(payments): integrate Chapa test workflow
feat(maintenance): add maintenance request workflow
feat(financials): add expense and financial overview
feat(dashboard): add role-specific dashboards
test(auth): cover role authorization boundaries
fix(leases): prevent overlapping active leases
docs(api): update API contract
```

Keep API Contract and master documentation version-controlled.

The API Contract explicitly requires `docs/API-CONTRACT.md` to be treated as a version-controlled artifact. fileciteturn2file1L113-L119

---

# 32. Final Project Completion Checklist

## Product

- [ ] all P0 complete
- [ ] P1 baseline complete
- [ ] out-of-scope features excluded

## Backend

- [ ] Laravel API
- [ ] Sanctum
- [ ] policies
- [ ] validation
- [ ] resources
- [ ] services
- [ ] business rules
- [ ] automated tests

## Frontend

- [ ] React
- [ ] role-specific routing
- [ ] reusable components
- [ ] professional design
- [ ] responsive behavior
- [ ] accessibility
- [ ] API integration
- [ ] error/loading/empty states

## Data

- [ ] ERD approved
- [ ] relationships correct
- [ ] indexes/constraints reviewed
- [ ] data integrity tested

## Payments

- [ ] manual payments
- [ ] Chapa test initiation
- [ ] callback/status
- [ ] references
- [ ] test-only messaging
- [ ] secrets protected

## Security

- [ ] authentication
- [ ] RBAC
- [ ] ownership scope
- [ ] manager assignment scope
- [ ] tenant isolation
- [ ] HTTPS
- [ ] secrets excluded
- [ ] no stack traces

## Quality

- [ ] unit/service tests
- [ ] API tests
- [ ] frontend tests
- [ ] integration tests
- [ ] security tests
- [ ] responsive tests
- [ ] regression tests
- [ ] UAT

## Deployment

- [ ] Vercel
- [ ] Wasmer
- [ ] environment configuration
- [ ] database
- [ ] smoke tests
- [ ] Chapa test verification

---

# 33. Final Definition of Done

The MVP is complete when:

> A real Property Owner can securely manage owned properties and their operational/financial information; a Property Manager can efficiently manage only assigned properties; a Tenant can securely view their own tenancy, track/pay rent through the approved test workflow, and submit maintenance requests; and an Administrator can perform platform-level administration — with backend-enforced authorization, reliable data integrity, traceable payments, responsive UX, automated testing, and verified deployment.

The release bar is intentionally strict: 100% of P0 acceptance criteria, no unresolved Critical/High defects, and verified deployment. fileciteturn1file2L221-L232

---

# 34. Master Principle

**Build the foundation first, enforce security continuously, integrate against the exact contract, deliver P0 before polishing P1, and never confuse “the screen works” with “the feature is complete.”**

---

# 35. Current Implementation Status

**Document:** `MASTERPLAN.md`  
**As of:** September 2026  

## Built

### Backend (Laravel, `/api/v1`)
- Access-role authorization (administrator / owner / manager / tenant) enforced server-side on every API call.
- Properties with owner + assigned-manager scoping; units; tenants; leases (incl. overlap prevention, early-termination workflow); manual payments; Chapa test-payment flow; maintenance requests (with photo upload); expenses; financial overview; reports; dashboard aggregation; notifications; discussion cases; profiles.
- Automated feature tests (`php artisan test`, 12 tests / 26 assertions) including role-boundary checks.
- `DemoDataSeeder` — realistic, idempotent demo dataset with GD-generated property/maintenance/lease images for every role.

### Frontend (Next.js, `app/`)
- Role-aware dashboards (dashboard, reports, profile, settings) with AuthGuard route protection (`roles` allow-list; unauthenticated → `/login`, unauthorized → `/dashboard`).
- Full P0 modules: properties, units, tenants, leases, payments, maintenance. P1: notifications, discussion, reports, financial insights.
- Premium design system (teal palette, `card`/`btn`/`Badge`/`Modal`/`FormField`/`EmptyState`/skeleton states), replaceable brand assets (`Logo`), toast feedback, and per-module detail pages via a shared `ResourceDetailPage`.
- Pages: role-aware dashboard, notifications, settings, payments, leases, maintenance, units manager, login, register — all wired to the live API, no dead mock data or dead nav.
- Rebuilt premium pages: root redirect, login (with demo-account quick-fill), register (tenant), property units manager (AuthGuard-restricted, card grid, add-unit modal).

## Verified
- AuthGuard blocks unauthenticated/unauthorized access and page-level guards prevent hydration crashes (eager JSX children rule handled in every protected page).
- Payments workflow works for all roles; tenant sees only own records; owner/manager scoping confirmed backend-side.
- Seeder idempotent (rerun leaves counts unchanged); demo images valid PNGs.

## Remaining / Backlog
- Production deployment (Vercel frontend + Wasmer/Laravel backend + MySQL + HTTPS + Chapa test verify in deployed env).
- Six core journeys end-to-end UAT with the seeded accounts.
- Responsive pass across 360px–1920px and accessibility review.
- Frontend automated tests (ESLint passes; component-level tests not yet added).
