# Propentra Deployment Assets

Two ways to run the Propentra API. The **free, no-card path is Wasmer Edge**;
the VPS path exists as a fallback if you ever leave the free tier.

| Path | Location | Cost |
| ---- | -------- | ---- |
| **Wasmer Edge** (recommended) | `backend/wasmer.toml` + `backend/app.yaml` | Free forever: 100k req/mo, managed MySQL, SSL, no card |
| VPS fallback | `deploy/vps/` | Free-tier VPS, or ~$4/mo |

Full walkthroughs live in `docs/DEPLOYMENT.md`.

## Wasmer Edge (backend)

1. Push the `backend/` folder as its **own GitHub repo** (Wasmer auto-detects Laravel;
   a monorepo with the Next.js frontend would confuse detection).
2. In the [Wasmer dashboard](https://wasmer.io): **New App → Import from GitHub** →
   select that repo. Wasmer detects PHP/Laravel, installs Composer deps, serves
   `public/`, and attaches a **managed MySQL** database (`DB_HOST/DB_PORT/DB_NAME/
   DB_USER/DB_PASSWORD` env vars are pre-populated).
3. Add **secrets** (Settings → Secrets): `APP_KEY` (from `php artisan key:generate`),
   `APP_BOOTSTRAP_TOKEN` (random), `CHAPA_SECRET_KEY`, and set
   `FRONTEND_URL`/`CORS_ALLOWED_ORIGINS`/`SANCTUM_STATEFUL_DOMAINS` to your Vercel URL.
4. After the first deploy, hit the one-time assistant to create the schema:

   ```text
   https://<your-app>.wasmer.app/__bootstrap?token=<APP_BOOTSTRAP_TOKEN>
   ```
   (Idempotent; can be re-run after redeploys. It performs `migrate --force`. It does
   **not** seed demo data — production starts clean.)

### Notes / limits
- `QUEUE_CONNECTION=sync` — serverless has no long-running worker; jobs run inline.
- `SESSION_DRIVER` and `CACHE_STORE` = `database` (no shared memory/files).
- `/storage/*` images are served by `routes/web.php` (no `storage:link` symlink needed).
- Uploaded files live on the instance filesystem (ephemeral across cold starts) — fine
  for demo; move uploads to object storage before heavy use.
- Custom domain + automatic SSL: dashboard → Settings → Domains.

## CLI alternative

```bash
# from backend/
wasmer deploy
wasmer app secrets create APP_KEY "base64:..." 
wasmer app secrets create APP_BOOTSTRAP_TOKEN "..."
```

## VPS fallback (`deploy/vps/`)

- `setup-vps.sh` — one-command Ubuntu provisioning (nginx + PHP 8.3 + MySQL +
  Supervisor + Certbot); run as root.
- `nginx.conf` / `queues.conf` — nginx site + Supervisor queue worker templates.
- `.env.production.example` — canonical production env template.