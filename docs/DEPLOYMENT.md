# Propentra Deployment Guide

Two deployables:

- **frontend/** – Next.js app (JavaScript). Static + SSR via Vercel (free Hobby tier).
- **backend/** – Laravel 11 API (Sanctum token auth, Chapa payments).

The backend runs on **Wasmer Edge** — the hosting option named in the master plan.
As of 2026 Wasmer offers free Laravel hosting with a managed MySQL database, automatic
SSL, custom domains, and GitHub CI/CD — **no credit card required** for the free tier
(100k requests/mo, 1 GB storage, 100 MB database, 1 app).

> Fallback: if you later leave the free tier, `deploy/vps/` has a complete
> nginx + PHP-FPM + MySQL + Supervisor setup for any VPS. See `deploy/README.md`.

## Backend — Wasmer Edge (free, no card)

### 1. Push the backend as its own repo
Wasmer auto-detects Laravel from a repo that contains PHP. Pushing the whole monorepo
confuses detection with the Next.js frontend, so the backend deploys from its **own**
GitHub repo. From the GitHub web UI: new empty repo (e.g. `propentra-api`), then from
`backend/` locally:

```bash
git init -b main .            # run inside backend/
git remote add origin git@github.com:<you>/propentra-api.git
git add -A && git commit -m "chore: initial backend export"
git push -u origin main
```

### 2. Import into Wasmer
1. [Wasmer dashboard](https://wasmer.io) → **New App → Import from GitHub** → select
   `propentra-api`.
2. Wasmer detects **Laravel**, installs Composer dependencies, serves `public/`, and
   attaches a **managed MySQL** database. It injects `DB_HOST`, `DB_PORT`, `DB_NAME`,
   `DB_USER`, `DB_PASSWORD` automatically. (`config/database.php` already falls back
   to `DB_USER` for the username.)
3. Wait for the first deploy to succeed; note your app URL `https://<app>.wasmer.app`.

### 3. Add secrets and environment
App → **Settings → Secrets / Environment**. (Never put these in the repo.)

| Variable | Value |
| -------- | ----- |
| `APP_KEY` | generated locally with `php artisan key:generate` |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_BOOTSTRAP_TOKEN` | a long random string (guards the one-time setup route) |
| `QUEUE_CONNECTION` | `sync` (serverless — no long-running worker) |
| `SESSION_DRIVER` | `database` |
| `CACHE_STORE` | `database` |
| `LOG_CHANNEL` | `stderr` |
| `FILESYSTEM_DISK` | `public` |
| `FRONTEND_URL` | `https://<your-app>.vercel.app` |
| `CORS_ALLOWED_ORIGINS` | `https://<your-app>.vercel.app` |
| `SANCTUM_STATEFUL_DOMAINS` | `<your-app>.vercel.app` |
| `CHAPA_SECRET_KEY` | Chapa key (test first, then live) |
| `CHAPA_TEST_MODE` | `true` to start |

### 4. Create the database schema
One HTTP call (no shell needed on serverless). After deploy:

```text
https://<app>.wasmer.app/__bootstrap?token=<APP_BOOTSTRAP_TOKEN>
```

This runs `migrate --force` (idempotent — safe to re-run after redeploys). It does
**not** seed demo data; production starts clean.

### 5. Custom domain (optional)
App → Settings → **Domains** → add your domain. SSL is issued automatically.

### 6. Smoke test
```bash
curl -i https://<app>.wasmer.app/api/v1/auth/me     # expect 401 JSON (no token)
curl -i https://<app>.wasmer.app/storage/foobar.png # expect 404 (route works)
```

## Frontend (Vercel, free)

1. Push the repo, then in Vercel: **New Project → Import** the GitHub repo.
2. Framework preset: **Next.js** (auto-detected; `vercel.json` pins build/install commands).
3. Root directory: `frontend`.
4. Add the environment variable:

   | Variable             | Production value                         |
   | -------------------- | ---------------------------------------- |
   | `NEXT_PUBLIC_API_URL`| `https://<app>.wasmer.app/api`           |

   The app appends `/v1`, so `NEXT_PUBLIC_API_URL` must be the API base **including `/api`**
   (e.g. local: `http://localhost:8000/api`).
5. Deploy. Check `Settings → General` Node.js version is 18+.
6. Create your first real account via `/register` (tenant) and the admin Users page
   for owner/manager/admin accounts.

## CORS / cross-origin checklist
- `CORS_ALLOWED_ORIGINS` = exact frontend origin (no trailing slash).
- `SANCTUM_STATEFUL_DOMAINS` = comma list of frontend domains.
- Chapa: keep `CHAPA_TEST_MODE=true` with test keys for launch; flip to `false` with live
  keys only after merchant approval + UAT. The callback `POST /api/v1/payments/chapa/callback`
  is outside `auth:sanctum` by design and must be publicly reachable.

## Secrets
Never commit `.env` or `frontend/.env.local`. On Wasmer, secrets live in the dashboard
(or `wasmer app secrets`) — never in the repo.

## Repository hygiene
- Run before deploy: `npm run lint`, `npm run build`, `npm run test` in `frontend/` and
  `php artisan test` in `backend/`.
- See `docs/UAT.md` for the pre-release journey checks.