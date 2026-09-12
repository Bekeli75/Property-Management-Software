# Propentra — Local Development Setup (VS Code)

This guide covers running Propentra entirely on your local machine for development, testing, and demos. No cloud deployment required.

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Git** | 2.40+ | `winget install Git.Git` |
| **PHP** | 8.3+ | `winget install PHP.PHP.8.3` |
| **Composer** | 2.7+ | `winget install Composer.Composer` |
| **Node.js** | 20+ (LTS) | `winget install OpenJS.NodeJS.LTS` |
| **MySQL** | 8.4+ | See below |
| **VS Code** | Latest | `winget install Microsoft.VisualStudioCode` |

## 1. MySQL 8.4 (Local Database)

### Option A: MySQL Installer (Recommended)
```powershell
# Download from https://dev.mysql.com/downloads/installer/
# Run MySQL Installer → Select "Server Only" → MySQL 8.4.x
# Set root password: root
# Port: 3306
```

### Option B: Docker (Quick)
```powershell
docker run -d \
  --name propentra-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=propentra \
  -p 3306:3306 \
  -v propentra-data:/var/lib/mysql \
  mysql:8.4
```

### Verify Connection
```powershell
mysql -h 127.0.0.1 -P 3306 -u root -proot -e "SHOW DATABASES;"
# Should list: propentra, mysql, performance_schema, sys, information_schema
```

## 2. Backend Setup (Laravel 11)

```powershell
cd D:\new project\Property Management Software\backend

# 1. Copy environment
cp .env.example .env

# 2. Update .env with local MySQL credentials
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=propentra
# DB_USERNAME=root
# DB_PASSWORD=root

# 3. Install dependencies
composer install

# 4. Generate app key
php artisan key:generate

# 5. Run migrations + seed demo data
php artisan migrate:fresh --seed

# 6. Start local server (port 8899)
php artisan serve --host=127.0.0.1 --port=8899
```

Backend runs at: `http://127.0.0.1:8899`

### Verify Backend
```powershell
# Health check
curl http://127.0.0.1:8899/api/v1/auth/me
# Expected: 401 JSON (no token)

# Run tests
php artisan test
# Expected: 23/23 pass
```

## 3. Frontend Setup (Next.js 16)

```powershell
cd D:\new project\Property Management Software\frontend

# 1. Create local env
echo "NEXT_PUBLIC_API_URL=http://127.0.0.1:8899/api/v1" > .env.local

# 2. Install dependencies
npm ci

# 3. Start dev server (port 3010)
npm run dev -- --port 3010
```

Frontend runs at: `http://localhost:3010`

### Verify Frontend
```powershell
# Build check
npm run build
# Expected: ✓ Compiled successfully

# Lint
npm run lint
# Expected: 0 errors (7 pre-existing img warnings)

# Tests
npm run test
# Expected: 38/38 pass
```

## 4. VS Code Setup

### Recommended Extensions
```json
// .vscode/extensions.json
{
  "recommendations": [
    "bmewburn.vscode-intelephense-client",      // PHP/Laravel
    "onecentlin.laravel-blade",                  // Blade syntax
    "amiralizadeh9480.laravel-extra-intellisense",
    "esbenp.prettier-vscode",                    // Format JS/TS
    "dbaeumer.vscode-eslint",                    // Lint JS/TS
    "bradlc.vscode-tailwindcss",                 // Tailwind CSS
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml"
  ]
}
```

### Settings (`.vscode/settings.json`)
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "php.validate.executablePath": "C:\\php\\php.exe",
  "intelephense.environment.includePaths": ["backend/vendor"],
  "files.associations": {
    "*.blade.php": "blade"
  },
  "terminal.integrated.defaultProfile.windows": "PowerShell"
}
```

### Launch Configs (`.vscode/launch.json`)
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Laravel: Listen for Xdebug",
      "type": "php",
      "request": "launch",
      "port": 9003,
      "pathMappings": {
        "/var/www/html": "${workspaceFolder}/backend"
      }
    },
    {
      "name": "Next.js: Debug Client",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3010",
      "webRoot": "${workspaceFolder}/frontend"
    },
    {
      "name": "Next.js: Debug Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/frontend/node_modules/next/dist/bin/next",
      "args": ["dev", "--port", "3010"],
      "cwd": "${workspaceFolder}/frontend"
    }
  ],
  "compounds": [
    {
      "name": "Full Stack Debug",
      "configurations": ["Laravel: Listen for Xdebug", "Next.js: Debug Client"]
    }
  ]
}
```

## 5. One-Command Startup (PowerShell)

Create `start-dev.ps1` at repo root:

```powershell
# start-dev.ps1
Write-Host "🚀 Starting Propentra local dev environment..." -ForegroundColor Cyan

# Check MySQL
$mysql = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
if (-not $mysql) {
    Write-Host "❌ MySQL not running. Start MySQL service first." -ForegroundColor Red
    exit 1
}

# Start Backend
Write-Host "📦 Starting Laravel backend on http://127.0.0.1:8899" -ForegroundColor Green
cd backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "php artisan serve --host=127.0.0.1 --port=8899"
cd ..

# Start Frontend
Write-Host "⚛️  Starting Next.js frontend on http://localhost:3010" -ForegroundColor Green
cd frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev -- --port 3010"
cd ..

Write-Host "`n✅ All services started!" -ForegroundColor Cyan
Write-Host "   Backend:  http://127.0.0.1:8899" -ForegroundColor Gray
Write-Host "   Frontend: http://localhost:3010" -ForegroundColor Gray
Write-Host "   API Base: http://127.0.0.1:8899/api/v1" -ForegroundColor Gray
```

Run it:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\start-dev.ps1
```

## 6. Demo Accounts (After `migrate:fresh --seed`)

| Role | Email | Password |
|------|-------|----------|
| **Administrator** | `demo.admin@propentra.local` | `password` |
| **Owner** | `demo.owner@propentra.local` | `password` |
| **Manager** | `demo.manager@propentra.local` | `password` |
| **Tenant** | `demo.tenant@propentra.local` | `password` |
| **Tenant 2** | `demo.tenant2@propentra.local` | `password` |
| ... | `demo.tenant3-5@propentra.local` | `password` |

## 7. Common Commands

```powershell
# Backend
cd backend
php artisan test                    # Run tests
php artisan migrate:fresh --seed    # Reset DB + seed
php artisan route:list              # List API routes
php artisan queue:work              # If using queue (not in dev)

# Frontend
cd frontend
npm run dev -- --port 3010          # Dev server
npm run build                       # Production build
npm run lint                        # ESLint
npm run test                        # Vitest
npm run test -- --ui                # Vitest UI

# Database
mysql -h 127.0.0.1 -u root -proot -e "USE propentra; SHOW TABLES;"
```

## 8. Troubleshooting

| Issue | Fix |
|-------|-----|
| `Connection refused` (MySQL) | Ensure MySQL service is running: `net start mysql` (Windows) or `docker start propentra-mysql` |
| `APP_KEY` missing | Run `php artisan key:generate` in `backend/` |
| CORS errors | Ensure `CORS_ALLOWED_ORIGINS=http://localhost:3010` in backend `.env` |
| Frontend can't reach API | Check `NEXT_PUBLIC_API_URL=http://127.0.0.1:8899/api/v1` in `frontend/.env.local` |
| Port 3010 in use | Change port: `npm run dev -- --port 3011` and update `.env.local` |
| `npm run build` fails | Delete `frontend/.next` and `frontend/node_modules`, re-run `npm ci` |

## 9. Project Structure

```
Property-Management-Software/
├── backend/                 # Laravel 11 API
│   ├── app/
│   │   ├── Http/Controllers/Api/V1/   # Controllers
│   │   ├── Models/                    # Eloquent models
│   │   └── ...
│   ├── config/
│   ├── database/
│   │   ├── migrations/                # 19 tables
│   │   └── seeders/                   # DemoDataSeeder
│   ├── routes/api.php                 # API routes
│   ├── Dockerfile                     # For production (Render)
│   └── ...
├── frontend/               # Next.js 16 + React 19
│   ├── app/                # App Router pages
│   │   ├── (auth)/login, register
│   │   ├── admin/users/    # User management
│   │   ├── dashboard/      # Role-based dashboard
│   │   ├── leases/         # Lease CRUD + attachments
│   │   ├── maintenance/    # Maintenance requests
│   │   ├── payments/       # Payments + Chapa
│   │   ├── properties/     # Properties + units
│   │   ├── tenants/        # Tenant management
│   │   ├── discussion/     # Chat (role-colored bubbles)
│   │   ├── privacy/, terms/, contact/  # Legal pages
│   ├── components/
│   │   ├── ui/             # Reusable UI (Badge, Card, Modal, etc.)
│   │   ├── AppShell.jsx    # Sidebar + header + footer
│   │   └── ...
│   ├── contexts/           # AuthContext, ToastContext, ThemeContext
│   ├── lib/                # api.js, tenantLabel.js
│   ├── globals.css         # Tailwind v4 + dark mode tokens
│   └── ...
├── docs/
│   ├── DEPLOYMENT.md       # This guide (local + prod)
│   ├── UAT.md              # User acceptance test scenarios
│   └── images/             # Dashboard mockups (SVG)
└── start-dev.ps1           # One-command startup
```

## 10. Ready for Demo

1. Run `.\start-dev.ps1`
2. Open `http://localhost:3010` in browser
3. Login as `demo.admin@propentra.local` / `password`
4. Navigate: Dashboard → Leases → Create lease (attachments work) → Discussion (role colors) → Admin/Users (premium UI)
5. Toggle dark mode (sidebar icon)

---

**That's it.** No cloud accounts, no Docker (unless you want it), no CI/CD. Just VS Code, PHP, Node, and MySQL running locally.