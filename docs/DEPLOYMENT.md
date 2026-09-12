# Propentra Deployment Guide (Render)

Two deployables:

- **frontend/** – Next.js app (JavaScript). Static + SSR via Render (free Web Service tier).
- **backend/** – Laravel 11 API (Sanctum token auth, Chapa payments).

The backend runs on **Render** — a modern cloud platform with native Laravel support, managed PostgreSQL/MySQL, automatic SSL, custom domains, and GitHub CI/CD. Free tier includes 750 hours/month, 512 MB RAM, shared CPU, and a managed MySQL database.

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
   - **Runtime**: `Docker` (recommended) or `Node` → but we'll use Docker for Laravel

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
| `FRONTEND_URL` | `https://your-frontend.onrender.com` | **Secret** |
| `CORS_ALLOWED_ORIGINS` | `https://your-frontend.onrender.com` | **Secret** |
| `SANCTUM_STATEFUL_DOMAINS` | `your-frontend.onrender.com` | **Secret** |
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

## Frontend — Render (free tier)

### 1. Create Render Web Service for Frontend
1. Render Dashboard → **New +** → **Web Service**
2. Connect same GitHub repo
3. Configure:
   - **Name**: `propentra-frontend`
   - **Region**: Same as backend
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Runtime**: `Node`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 2. `next.config.mjs` (ensure output: standalone)
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

### 3. Environment Variable
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-api.onrender.com/api/v1` |

> Must end with `/api/v1`. The frontend does **not** append `/v1`.

### 4. Deploy
- Push to `main` → Render auto-deploys both services
- Frontend gets URL like `https://propentra-frontend.onrender.com`
- Backend gets URL like `https://propentra-api.onrender.com`

## Custom Domains (optional)
- Render Dashboard → Service → Settings → **Custom Domains**
- Add your domain, SSL issued automatically

## CORS / Cross-Origin Checklist
- `CORS_ALLOWED_ORIGINS` = exact frontend origin (no trailing slash)
- `SANCTUM_STATEFUL_DOMAINS` = frontend domain only
- Chapa callback `POST /api/v1/payments/chapa/callback` must be publicly reachable (outside `auth:sanctum`)

## Secrets Management
- Never commit `.env` or `frontend/.env.local`
- Use Render Dashboard → Environment → **Secret Files** or **Environment Variables** (mark as secret)
- Rotate `APP_KEY` and `APP_BOOTSTRAP_TOKEN` per environment

## Pre-Deploy Checklist
```bash
# Frontend
cd frontend && npm run lint && npm run build && npm run test

# Backend
cd backend && php artisan test
```

## Repository Hygiene
- Never commit `.env` files
- Use `render.yaml` for IaC (infrastructure as code)
- See `docs/UAT.md` for pre-release journey checks

---

## Quick Start (One-time setup)
```bash
# 1. Push to GitHub
git push origin main

# 2. In Render Dashboard:
#    - New Web Service → backend (Docker, rootDir: backend)
#    - New Web Service → frontend (Node, rootDir: frontend)
#    - New Database → MySQL (free)

# 3. Set env vars in each service (see tables above)

# 3. Deploy → Render builds & deploys automatically

# 4. Bootstrap backend:
curl "https://your-api.onrender.com/__bootstrap?token=YOUR_TOKEN"

# 5. Verify:
curl -i https://your-api.onrender.com/api/v1/auth/me
```

**Done.** 🎉 Your Propentra app is live on Render free tier.