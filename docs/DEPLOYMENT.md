# Propentra Deployment Guide (Render + Vercel)

Two deployables:

- **frontend/** – Next.js app (JavaScript). Static + SSR via **Vercel** (free Hobby tier).
- **backend/** – Laravel 11 API (Sanctum token auth, Chapa payments).

The backend runs on **Render** — a modern cloud platform with native Laravel support (Docker), managed MySQL, automatic SSL, custom domains, and GitHub CI/CD. Free tier includes 750 hours/month, 512 MB RAM, shared CPU, and a managed MySQL database.

## Backend — Render (free tier)

### 1. Prerequisites
- GitHub repo with backend code (can be monorepo or separate `backend/` repo)
- Render account (free, no credit card for hobby tier)

### 2. Create Render Web Service for Backend
1. Go to [Render Dashboard](https://dashboard.render.com) → **New +** → **Web Service**
2. Connect your GitHub repo (select the repo containing `backend/`)
3. Configure:
   - **Name**: `propentra-api` (or your choice)
   - **Region**: Oregon (US West) or Frankfurt (EU) — pick closest to users
   - **Branch**: `main`
   - **Root Directory**: `backend` (if using monorepo) or leave blank (if separate repo)
   - **Runtime**: `Docker` (recommended for Laravel)

### 3. Create `render.yaml` (Infrastructure as Code)
Add this file at repo root (or `backend/render.yaml`):

```yaml
# backend/render.yaml
services:
  - type: web
    name: propentra-api
    runtime: docker
    dockerfilePath: ./Dockerfile
    region: oregon
    plan: free
    envVars:
      - key: APP_ENV
        value: production
      - key: APP_DEBUG
        value: "false"
      - key: QUEUE_CONNECTION
        value: sync
      - key: SESSION_DRIVER
        value: database
      - key: CACHE_STORE
        value: database
      - key: LOG_CHANNEL
        value: stderr
      - key: FILESYSTEM_DISK
        value: public
      - key: CHAPA_TEST_MODE
        value: "true"
    # Secrets (set in dashboard, not in yaml):
    # APP_KEY, APP_BOOTSTRAP_TOKEN, CHAPA_SECRET_KEY,
    # FRONTEND_URL, CORS_ALLOWED_ORIGINS, SANCTUM_STATEFUL_DOMAINS
databases:
  - name: propentra-db
    databaseName: propentra
    user: propentra
    region: oregon
    plan: free
    ipAllowList: []  # allow all for Render internal
```

### 4. Dockerfile for Laravel
Create `backend/Dockerfile`:

```dockerfile
# backend/Dockerfile
FROM php:8.3-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    linux-headers \
    $PHPIZE_DEPS \
    && docker-php-ext-install pdo_mysql bcmath opcache \
    && pecl install redis && docker-php-ext-enable redis

# Configure PHP
COPY docker/php.ini /usr/local/etc/php/conf.d/app.ini
COPY docker/php-fpm.conf /usr/local/etc/php-fpm.d/www.conf

# Configure Nginx
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Set working directory
WORKDIR /var/www/html

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy application code
COPY . .

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Generate optimized autoloader & config cache
RUN php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache

# Permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Expose port
EXPOSE 8080

# Start supervisor (nginx + php-fpm)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
```

### 5. Required Docker Config Files
Create these in `backend/docker/`:

**`docker/php.ini`**
```ini
memory_limit = 256M
upload_max_filesize = 10M
post_max_size = 10M
max_execution_time = 60
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=4000
```

**`docker/php-fpm.conf`**
```ini
[www]
user = www-data
group = www-data
listen = 9000
pm = dynamic
pm.max_children = 5
pm.start_servers = 2
pm.min_spare_servers = 1
pm.max_spare_servers = 3
```

**`docker/nginx.conf`**
```nginx
server {
    listen 8080;
    server_name _;
    root /var/www/html/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

**`docker/supervisord.conf`**
```ini
[supervisord]
nodaemon=true
logfile=/dev/stdout
loglevel=info

[program:php-fpm]
command=php-fpm
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:nginx]
command=nginx -g "daemon off;"
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
```

### 6. Environment Variables (set in Render Dashboard → Environment)
| Variable | Value | Notes |
|----------|-------|-------|
| `APP_KEY` | `php artisan key:generate` output | **Secret** |
| `APP_ENV` | `production` | |
| `APP_DEBUG` | `false` | |
| `APP_URL` | `https://your-api.onrender.com` | Render provides this |
| `APP_BOOTSTRAP_TOKEN` | Long random string | **Secret** |
| `DB_CONNECTION` | `mysql` | |
| `DB_HOST` | (auto from DB) | Render injects via `DATABASE_URL` |
| `DB_PORT` | `3306` | |
| `DB_DATABASE` | `propentra` | |
| `DB_USERNAME` | (auto from DB) | |
| `DB_PASSWORD` | (auto from DB) | **Secret** |
| `SESSION_DRIVER` | `database` | |
| `CACHE_STORE` | `database` | |
| `QUEUE_CONNECTION` | `sync` | Serverless - no worker |
| `CACHE_STORE` | `database` | |
| `LOG_CHANNEL` | `stderr` | |
| `FILESYSTEM_DISK` | `public` | |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | **Secret** |
| `CORS_ALLOWED_ORIGINS` | `https://your-frontend.vercel.app` | **Secret** |
| `SANCTUM_STATEFUL_DOMAINS` | `your-frontend.vercel.app` | **Secret** |
| `CHAPA_SECRET_KEY` | Your Chapa key | **Secret** |
| `CHAPA_TEST_MODE` | `true` | |

> **Important**: Render automatically provides `DATABASE_URL` for the managed MySQL. Update `config/database.php` to parse it:
```php
// config/database.php - add at top
$url = parse_url(env('DATABASE_URL'));
if ($url) {
    config([
        'database.connections.mysql.host' => $url['host'],
        'database.connections.mysql.port' => $url['port'] ?? 3306,
        'database.connections.mysql.database' => ltrim($url['path'], '/'),
        'database.connections.mysql.username' => $url['user'],
        'database.connections.mysql.password' => $url['pass'],
    ]);
}
```

### 7. Bootstrap (run migrations)
After first deploy, call once:
```
https://your-api.onrender.com/__bootstrap?token=YOUR_APP_BOOTSTRAP_TOKEN
```
Returns `{"ok":true}`. Runs `migrate --force` (idempotent).

### 8. Smoke Test
```bash
curl -i https://your-api.onrender.com/api/v1/auth/me     # 401 JSON
curl -i https://your-api.onrender.com/storage/foobar.png # 404
```

## Frontend — Vercel (free tier)

### 1. Create Vercel Project
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → **Add New...** → **Project**
2. Import the GitHub repo (`Bekeli75/Property-Management-Software`)
3. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: `.next` (or leave default)
   - **Install Command**: `npm ci`

### 2. Environment Variables (Vercel Project Settings → Environment Variables)
| Variable | Production Value |
|----------|------------------|
| `NEXT_PUBLIC_API_URL` | `https://your-api.onrender.com/api/v1` |

> **Critical**: Must end with `/api/v1`. The frontend does **not** append `/v1`.

### 3. `next.config.mjs` (ensure output: standalone for optimal Vercel)
```js
// frontend/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: { unoptimized: true },
};
export default nextConfig;
```

### 4. `vercel.json` (optional, for explicit config)
```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm ci",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

### 5. Deploy
- Push to `main` → Vercel auto-deploys on every push
- Preview deployments for PRs, production for `main`
- Custom domain in Vercel Settings → Domains

## CORS / Cross-Origin Checklist
- **Backend (Render)**: Set `CORS_ALLOWED_ORIGINS` = exact Vercel frontend URL (e.g., `https://propentra.vercel.app`)
- **Backend (Render)**: Set `SANCTUM_STATEFUL_DOMAINS` = Vercel frontend domain only (e.g., `propentra.vercel.app`)
- **Chapa**: Keep `CHAPA_TEST_MODE=true` with test keys for launch; flip to `false` with live keys only after merchant approval + UAT. The callback `POST /api/v1/payments/chapa/callback` is outside `auth:sanctum` by design and must be publicly reachable.

## Secrets Management
- **Never commit** `.env` or `frontend/.env.local`
- **Render**: Use Dashboard → Environment → mark secrets as "Secret"
- **Vercel**: Use Project Settings → Environment Variables → mark as "Production"
- Rotate `APP_KEY` and `APP_BOOTSTRAP_TOKEN` per environment

## Pre-Deploy Checklist
```bash
# Frontend
cd frontend && npm run lint && npm run build && npm run test

# Backend
cd backend && php artisan test
```

## Quick Start (One-time setup)
```bash
# 1. Push to GitHub
git push origin main

# 2. In Render Dashboard:
#    - New Web Service → backend (Docker, rootDir: backend)
#    - New Database → MySQL (free)
#    - Set env vars (see table above)

# 3. In Vercel Dashboard:
#    - New Project → Import repo → Root Directory: frontend
#    - Set NEXT_PUBLIC_API_URL = https://your-api.onrender.com/api/v1

# 4. Deploy → Both auto-deploy on push to main

# 5. Bootstrap backend:
curl "https://your-api.onrender.com/__bootstrap?token=YOUR_TOKEN"

# 6. Verify:
curl -i https://your-api.onrender.com/api/v1/auth/me
```

**Done.** 🎉 Your Propentra app is live: **Backend on Render**, **Frontend on Vercel**.