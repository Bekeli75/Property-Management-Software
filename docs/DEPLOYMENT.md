# Propentra Deployment Guide

Two deployables:

- **frontend/** – Next.js app (JavaScript). Static + SSR via Vercel.
- **backend/** – Laravel 11 API (Sanctum token auth, Chapa payments). Any PHP 8.2+ host with MySQL.

## Frontend (Vercel)

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

> Note: the app renders some images directly via the Laravel storage URL. Point `NEXT_PUBLIC_API_URL`
> at the same host serving those assets, or configure `images.remotePatterns` in `next.config.mjs`
> for the storage domain if you switch to `next/image`.

## Backend (Laravel API)

### Option A – Shared PHP host or VPS
1. Upload `backend/` contents, point the web root at `backend/public/`.
2. `composer install --no-dev --optimize-autoloader`.
3. Copy `.env.example` → `.env` and set:

   | Variable                  | Production value                                 |
   | ------------------------- | ------------------------------------------------ |
   | `APP_ENV`                 | `production`                                     |
   | `APP_DEBUG`               | `false`                                          |
   | `APP_URL`                 | `https://api.yourdomain.com`                     |
   | `FRONTEND_URL`            | `https://yourdomain.com`                         |
   | `CORS_ALLOWED_ORIGINS`    | `https://yourdomain.com`                         |
   | `SANCTUM_STATEFUL_DOMAINS`| `yourdomain.com`                                 |
   | `DB_*` / `MYSQL_*`        | your managed MySQL (strong password, non-root)   |
   | `CHAPA_SECRET_KEY`        | production Chapa secret → `CHAPA_TEST_MODE=false`|

4. `php artisan key:generate`
5. `php artisan config:cache route:cache migrate --force`
6. *(Optional demo data)* `php -d extension=gd artisan db:seed --class=DemoDataSeeder`
7. Queue worker: `php artisan queue:work` (systemd/supervisor for production).

### Option B – Managed Laravel (Forge/Railway/Heroku)
Same steps; set the env vars above in the platform dashboard. For container platforms
add a `php artisan migrate --force` release command.

## CORS / cross-origin checklist
- `CORS_ALLOWED_ORIGINS` = exact frontend origin (no trailing slash).
- `SANCTUM_STATEFUL_DOMAINS` = comma list of frontend domains (Sanctum token auth is
  header-based, but this list matters for cookies/CSRF if endpoints are switched to cookies).
- Chapa: payment initiate/callback need `CHAPA_SECRET_KEY`; keep `CHAPA_TEST_MODE=true`
  for sandbox, switch to `false` only with live keys. The callback endpoint
  `POST /api/v1/payments/chapa/callback` must be publicly reachable (it is outside
  `auth:sanctum` by design).

## Secrets
Never commit `.env` or `frontend/.env.local`. `.env.example` (backend) is the canonical
variable list and is already committed.

## Repository hygiene
- Run before deploy: `npm run lint`, `npm run build`, `npm run test` in `frontend/`.
- See `docs/UAT.md` for the pre-release journey checks and `docs/smoke/journey-smoke.ps1`
  for the read-only API smoke run.