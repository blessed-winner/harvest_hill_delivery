# Harvest Hill Delivery System

> **A modern, end-to-end farm-to-table agricultural supply chain platform connecting regional producers, business buyers, and system administrators with real-time tracking, transparent currency conversions, and automated ledger management.**

---

## Table of Contents

- [Overview](#overview)
- [Key Platform Features](#key-platform-features)
- [System Architecture & Tech Stack](#system-architecture--tech-stack)
- [Project Directory Structure](#project-directory-structure)
- [Installation & Setup](#installation--setup)
  - [Prerequisites](#prerequisites)
  - [Backend Setup (Django REST Framework)](#backend-setup-django-rest-framework)
  - [Frontend Setup (Next.js & React)](#frontend-setup-nextjs--react)
- [Portal Workflows](#portal-workflows)
  - [1. Client Portal](#1-client-portal)
  - [2. Farmer Portal](#2-farmer-portal)
  - [3. Admin Portal](#3-admin-portal)
- [Environment Variables Reference](#environment-variables-reference)
- [API Reference](#api-reference)
- [Production Deployment Notes](#production-deployment-notes)
- [License & Support](#license--support)

---

## Overview

**Harvest Hill Delivery** bridges the gap between regional agricultural producers and commercial produce buyers (hotels, restaurants, institutions, and retailers). By removing opaque intermediaries, Harvest Hill provides direct supply visibility, fair harvest pricing, quality grading, and automated invoice tracking.

The application operates across three dedicated, responsive web portals:
1. **Client Portal (`/client`)** — Browse fresh crops, track orders, manage default shipping addresses, select delivery windows, and generate PDF invoices.
2. **Farmer Portal (`/farmer`)** — Submit harvest offers, manage crop photos, review negotiations, set preferred payment payout methods, and inspect yield analytics.
3. **Admin Portal (`/admin`)** — Oversee catalog items, approve farmer applications and supply submissions, manage user roles, and inspect platform analytics.

---

##  Key Platform Features

- 📜 **Agricultural Certifications**: Full support for national and regional agricultural certifications (`GAP Certified`, `RSB Organic`, `Organic Certified`, `Fair Trade`, `RAA Certified`) with custom certification fields.
-  **Multi-Currency System (RWF / USD)**: Rwandan Francs (RWF) is set as the default primary currency across all orders, products, and invoices. Supports real-time price conversion toggles and live conversion widgets for farmers.
-  **Distinct Cart Line Item Counting**: Intelligently counts unique line items in the navigation bar cart badge, preserving accurate unit volume calculations during checkout.
-  **Automatic Supply Inventory Subtraction**: Validated orders automatically deduct fulfilled quantities from active supply inventory in real-time upon delivery confirmation.
-  **Session Keeper & Seamless Auth**: Silent background token refresh guarantees uninterrupted user browsing sessions without abrupt logouts.
-  **Real-Time WebSockets Notifications**: Live updates for new order placements, application approvals, supply submissions, and price negotiations via Django Channels.
-  **Sub-Route Address Bar Synchronization**: Deep-linking query parameters (`/client?screen=catalog`, `/farmer?view=supplies`, `/admin?tab=products`) sync with browser history for clean navigation.
-  **PDF Invoices & Delivery Notes**: Downloadable, professional printable invoices and delivery execution notes with digital signatures.
-  **Google OAuth Integration**: Built-in support for Google One-Tap and OAuth single sign-on flows.

---

##  System Architecture & Tech Stack

```mermaid
graph TD
    Client[Next.js Client Portal] -->|REST API & WebSockets| Backend[Django 5.0 REST Backend]
    Farmer[Next.js Farmer Portal] -->|REST API & WebSockets| Backend
    Admin[Next.js Admin Portal] -->|REST API & WebSockets| Backend
    Backend --> DB[(PostgreSQL Database)]
    Backend --> Cloudinary[Cloudinary Media Storage]
    Backend --> Channels[Django Channels WebSockets]
```

### Stack Breakdown

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Python 3.11+, Django 5.0+, Django REST Framework, SimpleJWT Authentication, Django Channels.
- **Database**: PostgreSQL 14+.
- **Media & Storage**: Cloudinary (Product & Crop Photos).
- **Communication**: WebSockets (WS/WSS) & RESTful JSON APIs.

---

##  Project Directory Structure

```text
harvest-hill-delivery/
├── backend/
│   ├── apps/
│   │   ├── accounts/       # User profiles, auth, farmer applications & admin views
│   │   ├── products/       # Master product templates & categories
│   │   ├── supplies/       # Farmer supply submissions & inventory
│   │   ├── orders/         # Client order processing & inventory deduction
│   │   ├── delivery_notes/ # Delivery tracking & confirmation notes
│   │   ├── invoices/       # Automatic invoicing & billing
│   │   ├── negotiations/   # Price counter-proposals & agreement threads
│   │   ├── notifications/  # Real-time WebSocket notifications
│   │   └── common/         # Shared utilities, audit logging & permissions
│   ├── config/             # Django settings, WSGI, ASGI & URL routing
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App routes (/client, /farmer, /admin, /apply)
│   │   ├── components/     # Shared UI components (Landing, CurrencyToggle)
│   │   ├── context/        # React Context providers (AlertContext, CurrencyContext)
│   │   └── portals/        # Modular portal components
│   │       ├── admin/      # Admin dashboard, user management, reports
│   │       ├── farmer/     # Farmer harvest submission, supplies, settings
│   │       └── client/     # Client catalog, cart, checkout, order history
├── docker-compose.yml
├── README.md
└── package.json
```

---

##  Installation & Setup

### Prerequisites

- **Python 3.11+** installed
- **Node.js 18+** & **npm** installed
- **PostgreSQL 14+** running locally or remotely

---

### Backend Setup (Django REST Framework)

1. **Navigate to the backend folder:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up Environment Variables:**
   Copy `.env.example` to `.env` and fill in configuration details:
   ```bash
   cp .env.example .env
   ```

5. **Apply Database Migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Seed Initial Database Content (Optional):**
   ```bash
   python manage.py seed_data
   ```

7. **Start Django Development Server:**
   ```bash
   python manage.py runserver
   ```
   The backend REST API will run at `http://localhost:8000`.

---

### Frontend Setup (Next.js & React)

1. **Navigate to the frontend folder:**
   ```bash
   cd frontend
   ```

2. **Install Node modules:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create `.env.local` in `frontend/`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_WS_URL=ws://localhost:8000
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

---

## 👥 Portal Workflows

### 1. Client Portal
- **Path**: `/client`
- **Features**:
  - **Marketplace Catalog**: Browse verified farmer crops with live pricing, quality grades, and stock levels.
  - **Cart & Checkout**: Interactive item quantities with prefilled default shipping address settings.
  - **Order History & Statuses**: Track orders across `Pending`, `Processing`, `Shipped`, `Delivered`, or `Cancelled` states.
  - **Invoices**: View billing details and print/export PDF invoices.

### 2. Farmer Portal
- **Path**: `/farmer` (Application required at `/apply`)
- **Features**:
  - **Submit Harvest**: Offer fresh produce batches with target pricing, harvest ready date, grade selection, and crop photos. Live price converter div helps convert values between RWF and USD instantly.
  - **My Supplies Log**: Filter supply logs by status including `Accepted`, `Pending`, and `Draft`.
  - **Profile Settings**: Configure farm details, agricultural certifications, custom certifications, profile photo, and preferred payout methods (MTN MoMo, Airtel Money, Bank Transfer).

### 3. Admin Portal
- **Path**: `/admin`
- **Features**:
  - **User & Application Management**: Approve or reject farmer applications and manage user accounts.
  - **Master Catalog**: Define base crops, standard measurement units (`kg`, `litre`, `crate`, `bundle`), and currency defaults.
  - **Supply Approvals**: Inspect incoming farmer batches and counter-propose prices.
  - **Analytics & Reports**: Visual charts depicting order volume trends, status distributions, category sales, and top-performing suppliers.

---

##  Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Example Value |
|---|---|---|
| `SECRET_KEY` | Django Secret Key | `django-insecure-...` |
| `DEBUG` | Debug mode toggle | `True` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@localhost:5432/harvest_hill` |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name | `harvest_cloud` |
| `GOOGLE_OAUTH_CLIENT_ID` | Google Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google Client Secret | `GOCSPX-...` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Default Value |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | HTTP base URL for REST backend | `http://localhost:8000` |
| `NEXT_PUBLIC_WS_URL` | WebSocket base URL for real-time alerts | `ws://localhost:8000` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Public Google OAuth Client ID | `xxx.apps.googleusercontent.com` |

---

##  Key API Reference

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/accounts/login/` | User authentication token generation | Public |
| `POST` | `/api/accounts/google-login/` | Google OAuth token authentication | Public |
| `POST` | `/api/accounts/farmer-applications/apply/` | Submit new farmer application | Public |
| `GET` | `/api/client/products/` | List accepted marketplace items | Authenticated (Client) |
| `POST` | `/api/orders/` | Place client order | Authenticated (Client) |
| `GET` | `/api/supplies/` | List farmer supply submissions | Authenticated (Farmer) |
| `POST` | `/api/supplies/` | Submit new harvest batch | Authenticated (Farmer) |
| `GET` | `/api/accounts/admin/dashboard/` | Retrieve platform KPI analytics & charts | Admin |
| `POST` | `/api/accounts/admin/farmer-applications/{id}/approve/` | Approve farmer application | Admin |

---

##  Production Deployment Notes

1. **Security**: Ensure `DEBUG=False` in production `backend/.env` and update `SECRET_KEY` and `ALLOWED_HOSTS`.
2. **Database**: Use a managed PostgreSQL database (e.g. AWS RDS or Supabase) with SSL enabled.
3. **WebSockets**: Deploy ASGI server using Daphne or Uvicorn backed by Redis for channel layer management.
4. **Static & Media**: Static files should be served via Nginx/Cloudflare and user uploads via Cloudinary.

---

##  License & Contact

Copyright © 2026 Harvest Hill Supply Chain Platform. All rights reserved.
