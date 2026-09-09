# Propentra Deployment Guide

Two deployables:

- **frontend/** – Next.js app (JavaScript). Static + SSR via Vercel (free Hobby tier).
- **backend/** – Laravel 11 API (Sanctum token auth, Chapa payments). Runs on a
  VPS with nginx + PHP-FPM + MySQL (see `deploy/backend/` for ready-made configs).

> **Note:** the earlier master plan mentioned hosting the backend on *Wasmer*. Wasmer
> is a WebAssembly edge platform and cannot host a PHP/MySQL application (no managed
> MySQL, no queue workers, no persistent upload storage). The approved target below is
> a self-managed VPS, per the SRS rule *"any PHP 8.2+ host with MySQL."*

## Repository assets (`deploy/backend/`)

| File | Purpose |
| ---------------- | ------------------------------------------------------- |
| `setup-vps.sh`   | One-command Ubuntu 22.04/24.04 provisioning (run as root) |
| `nginx.conf`     | Laravel server block (template; placeholders substituted) |
| `queues.conf`    | Supervisor config for the down-queue worker |
| `.env.production.example` | Canonical production environment (secrets injected at setup) |

## Frontend (Vercel, free)

1. Push the repo, then in Vercel: **New Project → Import** the GitHub repo.
2. Framework preset: **Next.js** (auto-detected; `vercel.json` pins build/install commands).
3. Root directory: `frontend`.
4. Add the environment variable:

   | Variable             | Production value                          |
   | -------------------- | ----------------------------------------- |
   | `NEXT_PUBLIC_API_URL`| `https://api.yourdomain.com/api`          |

   The app appends `/v1`, so `NEXT_PUBLIC_API_URL` must be the API base **including `/api`**
   (e.g. local: `http://localhost:8000/api`).
5. Deploy. Check `Settings → General` Node.js version is 18+.

> The app renders images directly via the Laravel storage URL (`.../storage/...`).
> A shared domain or `images.remotePatterns` in `next.config.mjs` is only relevant if
> you switch to `next/image` — the current `<img>` usage works from any host.

## Backend (Laravel on a VPS)

### Option A — Free tier (recommended): Oracle Cloud Always-Free ARM VM
Create a `VM.Standard.A1.Flex` AMD ARM instance (4 OCPU / 24 GB RAM), Ubuntu 22.04,
reserve a public IP, and open ports **22, 80, 443** in the security list. If Oracle
sign-up is not possible, any VPS works (e.g. Hetzner CX22 ~$4/mo).

### One-command setup
Upload or clone the repo to the VM, then from `deploy/backend/`:

```bash
sudo bash setup-vps.sh api.yourdomain.com propentra.vercel.app test_XXXX_YYYY true
```

The script (idempotent) will:

1. Install nginx, PHP 8.3-FPM (+ extensions), MySQL 8, Supervisor, Composer, certbot.
2. Create a MySQL database + non-root `propentra` user (random strong password saved
   to `/root/.propentra-db-pass`).
3. Clone the `backend/` into `/var/www/propentra-api`, `composer install --no-dev`.
4. Write `.env` from `.env.production.example` with domain/DB/Chapa values.
5. `key:generate`, `migrate --force`, `storage:link`, `config:cache`, `route:cache`.
6. Install nginx site + Supervisor queue worker; request a Let's Encrypt cert.

### If you prefer to do it manually
1. Upload project, point web root at `backend/public/`.
2. `composer install --no-dev --optimize-autoloader`.
3. Copy `.env.example` → `.env` and set:
   - `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://api.yourdomain.com`
   - `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` = exact frontend origin (no trailing slash)
   - `SANCTUM_STATEFUL_DOMAINS` = frontend hostname
   - `DB_*` strong non-root MySQL credentials
   - `CHAPA_SECRET_KEY`, `CHAPA_TEST_MODE`
4. `php artisan key:generate`
5. `php artisan config:cache route:cache migrate --force`
6. *(Optional demo data)* `php -d extension=gd artisan db:seed --class=DemoDataSeeder`
7. Queue worker: `php artisan queue:work` via Supervisor (`deploy/backend/queues.conf`).

## CORS / cross-origin checklist
- `CORS_ALLOWED_ORIGINS` = exact frontend origin (no trailing slash).
- `SANCTUM_STATEFUL_DOMAINS` = comma list of frontend domains (Sanctum token auth is
  header-based, but this list matters for cookies/CSRF if endpoints are switched to cookies).
- Chapa: keep `CHAPA_TEST_MODE=true` with test keys for launch. Flip to `false` with live
  keys only after merchant approval + UAT. The callback `POST /api/v1/payments/chapa/callback`
  must be publicly reachable (it is outside `auth:sanctum` by design).

## Secrets
Never commit `.env` or `frontend/.env.local`. `.env.example` (backend) is the canonical
variable list and is already committed; `deploy/backend/.env.production.example` is the
production base and has no real secrets.

## Repository hygiene
- Run before deploy: `npm run lint`, `npm run build`, `npm run test` in `frontend/`.
- See `docs/UAT.md` for the pre-release journey checks and `docs/smoke/journey-smoke.ps1`
  for the read-only API smoke run.