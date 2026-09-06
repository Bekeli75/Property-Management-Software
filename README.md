# Propentra Property Management Software

Professional property management system built with Next.js, Laravel, and MySQL.

## Tech Stack

- **Frontend**: Next.js (JavaScript), Tailwind CSS, React
- **Backend**: Laravel (PHP), MySQL Database
- **Authentication**: Laravel Sanctum
- **Payment Integration**: Chapa (Test Environment)
- **Currency**: ETB (Ethiopian Birr)

## Project Structure

```
property-management-software/
├── frontend/          # Next.js application
├── backend/           # Laravel API
├── docs/             # Documentation
└── README.md
```

## User Roles

- **Owner**: Property owners who manage their own properties
- **Manager**: Property managers assigned to specific properties
- **Tenant**: Tenants who rent units
- **Administrator**: System-level administrators

## Core Features

- Property Management
- Unit Management
- Tenant Management
- Lease Management
- Rent & Payment Processing
- Maintenance Requests
- Financial Management
- Dashboards & Reports

## Getting Started

### Prerequisites

- Node.js (v18+)
- PHP (v8.1+)
- Composer
- MySQL
- npm or yarn

### Backend Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## API Documentation

API endpoints follow the REST pattern under `/api/v1`

### Authentication

- POST `/api/v1/auth/login` - User login
- POST `/api/v1/auth/logout` - User logout
- GET `/api/v1/auth/me` - Get current user

### Core Modules

- `/api/v1/properties` - Property management
- `/api/v1/units` - Unit management
- `/api/v1/tenants` - Tenant management
- `/api/v1/leases` - Lease management
- `/api/v1/payments` - Payment processing
- `/api/v1/maintenance` - Maintenance requests

## Security

- All endpoints require authentication except login
- Role-based access control (RBAC)
- Ownership-based data access
- Server-side validation
- Environment-based configuration

## License

Proprietary - All rights reserved
