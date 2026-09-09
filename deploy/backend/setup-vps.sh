#!/usr/bin/env bash
#
# Propentra API - one-command VPS setup (Ubuntu 22.04/24.04, run as root)
#
# Usage:
#   sudo bash setup-vps.sh <api_domain> <frontend_host> <chapa_secret> [chapa_test_mode]
#
#   api_domain        e.g. api.yourdomain.com  (must resolve to this server for TLS)
#   frontend_host     e.g. propentra.vercel.app
#   chapa_secret      your Chapa secret key (test_... to start)
#   chapa_test_mode   true (default) | false
#
# Example:
#   sudo bash setup-vps.sh api.yourdomain.com propentra.vercel.app test_xxxx_yyy true
#
# The script provisions nginx + PHP 8.3 + MySQL + Supervisor, installs the Laravel
# backend at /var/www/propentra-api, prepares .env, runs migrations, and requests a
# Let's Encrypt certificate. Re-running is safe (install steps are idempotent).
set -euo pipefail

API_DOMAIN="${1:?Usage: setup-vps.sh <api_domain> <frontend_host> <chapa_secret> [chapa_test_mode]}"
FRONTEND_HOST="${2:?Missing frontend host}"
CHAPA_SECRET="${3:?Missing Chapa secret key (use a test_... key to start)}"
CHAPA_TEST_MODE="${4:-true}"

DB_NAME="propentra"
DB_USER="propentra"
DB_PASS="$(openssl rand -hex 16)"
APP_DIR="/var/www/propentra-api"
REPO_URL="https://github.com/Bekeli75/Property-Management-Software.git"
REPO_BRANCH="main"
PHP_VER="8.3"

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
die() { printf '\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Run as root (sudo bash setup-vps.sh ...)"
command -v openssl >/dev/null || die "openssl is required"

# --- 1. Packages ------------------------------------------------------------
say "Installing system packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl git unzip software-properties-common \
    nginx mysql-server supervisor certbot python3-certbot-nginx \
    php${PHP_VER}-fpm php${PHP_VER}-mysql php${PHP_VER}-gd php${PHP_VER}-mbstring \
    php${PHP_VER}-xml php${PHP_VER}-curl php${PHP_VER}-zip php${PHP_VER}-bcmath openssl

# --- 2. Composer ------------------------------------------------------------
say "Installing Composer"
if ! command -v composer >/dev/null 2>&1; then
    curl -sS https://getcomposer.org/installer -o /tmp/composer-setup.php
    php /tmp/composer-setup.php --install-dir=/usr/local/bin --filename=composer
fi
composer --version

# --- 3. MySQL: create database + non-root user ------------------------------
say "Creating MySQL database '$DB_NAME' and user '$DB_USER'"
mysql <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL

# --- 4. Application code ----------------------------------------------------
say "Fetching application code (branch $REPO_BRANCH)"
rm -rf /tmp/pms-export
git clone --depth 1 --branch "${REPO_BRANCH}" "${REPO_URL}" /tmp/pms-export
mkdir -p "${APP_DIR}"
cp -a /tmp/pms-export/backend/. "${APP_DIR}/"
rm -f "${APP_DIR}/.env"   # never reuse anything committed

say "Installing Composer dependencies"
cd "${APP_DIR}"
composer install --no-dev --optimize-autoloader --no-interaction

# --- 5. Environment ---------------------------------------------------------
say "Writing production .env"
sed -e "s|__API_DOMAIN__|${API_DOMAIN}|g" \
    -e "s|__FRONTEND_HOST__|${FRONTEND_HOST}|g" \
    -e "s|__DB_NAME__|${DB_NAME}|g" \
    -e "s|__DB_USER__|${DB_USER}|g" \
    -e "s|__DB_PASSWORD__|${DB_PASS}|g" \
    -e "s|__CHAPA_SECRET_KEY__|${CHAPA_SECRET}|g" \
    -e "s|__CHAPA_TEST_MODE__|${CHAPA_TEST_MODE}|g" \
    /tmp/pms-export/deploy/backend/.env.production.example > "${APP_DIR}/.env"

php artisan key:generate --force
php artisan migrate --force --no-interaction
php artisan storage:link
php artisan config:cache
php artisan route:cache

# --- 6. Permissions ---------------------------------------------------------
say "Setting storage permissions"
chown -R www-data:www-data "${APP_DIR}/storage" "${APP_DIR}/bootstrap/cache" "${APP_DIR}/public"

# --- 7. nginx ---------------------------------------------------------------
say "Configuring nginx for ${API_DOMAIN}"
sed \
    -e "s|__API_DOMAIN__|${API_DOMAIN}|g" \
    -e "s|__APP_DIR__|${APP_DIR}|g" \
    /tmp/pms-export/deploy/backend/nginx.conf > /etc/nginx/sites-available/propentra-api
ln -sf /etc/nginx/sites-available/propentra-api /etc/nginx/sites-enabled/propentra-api
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# --- 8. Queue worker --------------------------------------------------------
say "Starting Supervisor queue worker"
cp /tmp/pms-export/deploy/backend/queues.conf /etc/supervisor/conf.d/propentra-api.conf
supervisorctl reread >/dev/null
supervisorctl update >/dev/null
supervisorctl start propentra-api:* || true

# --- 9. Registry of root access to DB credentials ---------------------------
echo "${DB_PASS}" > /root/.propentra-db-pass
chmod 600 /root/.propentra-db-pass

# --- 10. HTTPS (best-effort: needs DNS pointing here) ------------------------
say "Requesting Let's Encrypt certificate for ${API_DOMAIN}"
if command -v certbot >/dev/null 2>&1; then
    if certbot --nginx --non-interactive --agree-tos --redirect \
        --register-unsafely-without-email -d "${API_DOMAIN}" >/tmp/certbot.log 2>&1; then
        systemctl reload nginx
        say "HTTPS configured."
    else
        echo "WARN: certbot failed (probably DNS not pointing here yet)."
        echo "      Once ${API_DOMAIN} -> this server's IP, run:"
        echo "      certbot --nginx --redirect -d ${API_DOMAIN}"
    fi
fi

# --- 11. Smoke test ----------------------------------------------------------
say "Smoke test"
sleep 2
code="$(curl -s -o /dev/null -w '%{http_code}' "http://localhost/" || true)"
echo "HTTP / from localhost: ${code} (expect 302/200). Try:"
echo "  curl -s ${API_DOMAIN}/api/v1/auth/me"

say "DONE"
echo "  API domain : ${API_DOMAIN}"
echo "  DB name    : ${DB_NAME}"
echo "  DB user    : ${DB_USER}"
echo "  DB pass    : saved in /root/.propentra-db-pass"
echo "  App dir    : ${APP_DIR}"
echo
echo "Next steps: point ${API_DOMAIN}'s DNS A record at this server (if not done),"
echo "resolve any certbot warning above, then go to Vercel and connect the frontend."