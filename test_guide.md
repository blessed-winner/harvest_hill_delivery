# 🌾 Harvest Hill Delivery — Complete End-to-End Test Guide

> **An exhaustive, intentional test suite for validating all user journeys, portal workflows, inventory deductions, multi-currency conversions, and administrative controls across Harvest Hill Delivery.**

---

## 📑 Table of Contents

- [1. System Architecture & Prerequisites](#1-system-architecture--prerequisites)
- [2. Flow Overview](#2-flow-overview)
- [3. Test Suite 1: Prospective Farmer & Admin Verification](#3-test-suite-1-prospective-farmer--admin-verification)
- [4. Test Suite 2: Farmer Operations & Harvest Submissions](#4-test-suite-2-farmer-operations--harvest-submissions)
- [5. Test Suite 3: Admin Catalog & Supply Approval](#5-test-suite-3-admin-catalog--supply-approval)
- [6. Test Suite 4: Client Marketplace & Checkout Flow](#6-test-suite-4-client-marketplace--checkout-flow)
- [7. Test Suite 5: Automated Supply Subtraction & Fulfillment](#7-test-suite-5-automated-supply-subtraction--fulfillment)
- [8. Test Suite 6: Multi-Currency & Conversion Widget](#8-test-suite-6-multi-currency--conversion-widget)
- [9. Test Suite 7: Settings & Shipping Address Management](#9-test-suite-7-settings--shipping-address-management)
- [10. Test Suite 8: Deep-Link Routing & Session Security](#10-test-suite-8-deep-link-routing--session-security)
- [11. Quick Sanity Verification Checklist](#11-quick-sanity-verification-checklist)

---

## 1. System Architecture & Prerequisites

Before initiating any test scenario, verify that the local environment services are running cleanly.

### Environment Setup

```bash
# Terminal 1 — Backend REST Server
cd backend
# Activate Virtual Environment
.\venv\Scripts\Activate.ps1   # Windows
source venv/bin/activate      # Linux / macOS

python manage.py runserver    # → http://localhost:8000

# Terminal 2 — Frontend Dev Server
cd frontend
npm run dev                   # → http://localhost:3000
```

### Pre-Flight Verification Checklist
- [ ] Backend running at `http://localhost:8000` (PostgreSQL & WebSockets active)
- [ ] Frontend running at `http://localhost:3000`
- [ ] Environment file `frontend/.env.local` contains:
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:8000
  NEXT_PUBLIC_WS_URL=ws://localhost:8000
  NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
  ```
- [ ] At least one Superuser / Admin account exists (`python manage.py createsuperuser`)

---

## 2. Flow Overview

```
[1. Farmer Applies @ /apply] 
       ↓ (Submits Rwanda certs + custom certs)
[2. Admin Approves Application @ /admin?tab=applications] 
       ↓ (Generates account & temp credentials)
[3. Farmer Submits Harvest Batch @ /farmer?view=submit] 
       ↓ (Inputs asking price, quality grade & crop photos + Live RWF/USD Converter)
[4. Admin Reviews & Accepts Supply @ /admin?tab=supplies] 
       ↓ (Publishes item to Client Catalog with farmer photo & price)
[5. Client Browses Catalog @ /client?screen=catalog] 
       ↓ (RWF primary currency, distinct line-item cart badge)
[6. Client Saves Address & Places Order @ /client?screen=checkout] 
       ↓ (Prefilled default shipping address & delivery time window)
[7. Admin Updates Order Status to 'Delivered' @ /admin?tab=orders] 
       ↓ (Backend OrderSerializer automatically deducts qty from active Supply)
[8. Client Inspects PDF Invoice & Delivery Note @ /client?screen=invoices]
```

---

## 3. Test Suite 1: Prospective Farmer & Admin Verification

### Scenario 1.1: Submit Farmer Application (`/apply`)
1. Open browser to `http://localhost:3000/apply`.
2. Inspect the header: Verify it contains **only** the **Home** (`/`) and **Sign In** (`/login`) buttons.
3. Fill out the application form:
   - **Full Name**: `Jean-Paul Hakizimana`
   - **Email**: `jeanpaul.farmer@harvesthill.test`
   - **Phone**: `+250 788 987 654`
   - **Farm Name**: `Kigali Organic Produce Ltd`
   - **Farm Location**: `Gasabo District, Kigali`
   - **Primary Crops**: `Roma Tomatoes, Bell Peppers, Irish Potatoes`
   - **Certifications Selection**: Select `GAP Certified`, `RSB Organic`, and `Organic Certified`.
   - **Custom Certification**: Type `Kigali Cooperative Guild Certified`.
   - **Password**: `SecurePass2026!`
4. Click **Submit Application**.

**Expected Result**:
- Success toast notification appears confirming application submission.
- Application payload is saved in the database with status `pending`.

---

### Scenario 1.2: Admin Application Approval (`/admin?tab=applications`)
1. Log in as Admin at `http://localhost:3000/login`.
2. Navigate to `/admin?tab=users` and click the **Applications** tab (or direct URL `http://localhost:3000/admin?tab=applications`).
3. Locate `Kigali Organic Produce Ltd` (`jeanpaul.farmer@harvesthill.test`).
4. Click row to open application details modal.
5. Verify selected certifications (`GAP Certified`, `RSB Organic`, `Organic Certified`) and custom certification (`Kigali Cooperative Guild Certified`) are displayed.
6. Click **Approve & Create Account**.

**Expected Result**:
- Modal shows generated username and temporary password.
- Application status changes to `approved`.
- A new user account with role `farmer` is created in the system.

---

## 4. Test Suite 2: Farmer Operations & Harvest Submissions

### Scenario 2.1: Farmer Login & Dashboard Overview (`/farmer`)
1. Navigate to `http://localhost:3000/login`.
2. Log in with `jeanpaul.farmer@harvesthill.test` / `SecurePass2026!`.
3. Verify automatic redirect to `http://localhost:3000/farmer?view=dashboard`.
4. Inspect Dashboard KPIs: Supply Volume, Pending Negotiations, Acceptance Rate, Earnings.

---

### Scenario 2.2: Submit Harvest Batch with Live Currency Converter (`/farmer?view=submit`)
1. Navigate to **Submit Harvest** (`http://localhost:3000/farmer?view=submit`).
2. Select a master crop product (e.g., `Roma Tomatoes`).
3. Fill out harvest parameters:
   - **Quantity Available**: `800` (Unit: `kg`)
   - **Ready Date**: Select date (e.g., `2026-08-01`)
   - **Quality Grade**: Select `Premium`
   - **Asking Price**: Type `1300` (RWF)
4. Inspect the **Live Currency Conversion** widget:
   - Verify it automatically calculates and renders `$1.00 USD` (1300 RWF / 1300 = $1.00 USD).
5. Upload crop batch photo.
6. Click **Submit Harvest**.

**Expected Result**:
- Harvest batch is created with status `pending`.
- Record appears under Farmer's **My Supplies** log (`/farmer?view=supplies`).

---

### Scenario 2.3: Farmer Profile & Payout Settings (`/farmer?view=settings`)
1. Navigate to **Profile & Settings** (`http://localhost:3000/farmer?view=settings`).
2. Verify Farm Legal Name, Phone, and Rwanda Certifications pills are visible.
3. Locate the **Default Payout Method for Invoices** card:
   - Select Payment Provider: `MTN Mobile Money (MoMo)`
   - Account / Phone: `+250 788 987 654`
4. Profile Picture Upload:
   - Upload a new avatar image.
   - Test the **Remove Picture** button to restore standard avatar placeholder.
5. Click **Save Changes**.

**Expected Result**:
- Profile updates persist and notification confirms settings saved.

---

## 5. Test Suite 3: Admin Catalog & Supply Approval

### Scenario 3.1: Master Product Catalog & Unit Enforcement (`/admin?tab=products`)
1. Log in as Admin and navigate to `/admin?tab=products`.
2. Click **Add Product**.
3. Create a master crop template:
   - **Product Name**: `Red Cherry Tomatoes`
   - **Category**: `Vegetables`
   - **Unit**: Verify unit dropdown displays singular unit options (`kg`, `litre`, `crate`, `jar`, `bundle`). Select `litre`.
   - **Base Price**: `1500` (RWF)
   - **Quantity Needed**: `500`
4. Click **Save Product**.

**Expected Result**:
- Product template is saved with unit `litre` (not `litres`).

---

### Scenario 3.2: Admin Supply Review & Counter-Offer (`/admin?tab=supplies`)
1. Navigate to `/admin?tab=supplies`.
2. Locate the pending `Roma Tomatoes` submission (800 kg @ 1300 RWF) from `Jean-Paul Hakizimana`.
3. Click row to inspect details.
4. Click **Accept Proposal**.

**Expected Result**:
- Supply status changes to `accepted`.
- Batch becomes instantly published and visible in the **Client Marketplace Catalog**.

---

### Scenario 3.3: Orders by Status Analytics (`/admin?tab=dashboard`)
1. Navigate to `/admin?tab=dashboard`.
2. Inspect the **Orders by Status** chart:
   - Verify the chart renders all status breakdowns (`Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`).

---

## 6. Test Suite 4: Client Marketplace & Checkout Flow

### Scenario 4.1: Browse Catalog & Currency Toggle (`/client?screen=catalog`)
1. Log in as a Client at `http://localhost:3000/login` (or sign up at `/signup`).
2. Navigate to `/client?screen=catalog`.
3. Inspect catalog prices:
   - Verify prices display in **RWF** by default (`RWF 1,300`).
4. Click the **Currency Switcher** in the top navigation bar to toggle to **USD**.

**Expected Result**:
- Catalog card prices update instantly to USD (`$1.00`).

---

### Scenario 4.2: Cart Line-Item Count Validation (`/client?screen=cart`)
1. Find `Roma Tomatoes` in the catalog.
2. Select quantity `60` (kg) and click **Add to Cart**.
3. Inspect the Cart icon badge in the top navigation bar:
   - **Validation Check**: Verify the badge displays **1** (distinct product line count), NOT 60.
4. Add a second distinct product (e.g., `Durum Wheat`).
   - Verify cart badge updates to **2**.

---

### Scenario 4.3: Shipping Address Visible Fields & Editing (`/client?screen=dashboard`)
1. Navigate to Client Settings (`/client?screen=dashboard`).
2. Click the **Shipping Addresses** tab.
3. Verify address fields are rendered as visible card fields:
   - Street / Warehouse Address
   - City / District
   - Delivery Contact Phone
4. Click the pencil icon (`<Edit2 size={13} />`) on **Street Address**.
5. Type `100 Harvest Avenue, Gasabo Industrial Zone, Kigali` and click **Done**.
6. Click **Save Shipping Address**.

**Expected Result**:
- Saved shipping address notification appears and value stores in local persistence.

---

### Scenario 4.4: Checkout & Prefilled Address (`/client?screen=checkout`)
1. Navigate to `/client?screen=cart` and click **Proceed to Checkout**.
2. Inspect the **Delivery Address** field:
   - Verify it is automatically prefilled with `100 Harvest Avenue, Gasabo Industrial Zone, Kigali`.
3. Select Delivery Schedule:
   - Select day (e.g., `Mon`).
   - Select Time Window: `Morning (8:00 AM - 12:00 PM)`.
4. Click **Place Your Order**.

**Expected Result**:
- Order submitted successfully with status `pending`.
- Cart is cleared and user is redirected to Order History.

---

## 7. Test Suite 5: Automated Supply Subtraction & Fulfillment

### Scenario 5.1: Automatic Supply Inventory Subtraction
1. **Initial Supply Quantity**: Note `Roma Tomatoes` supply batch quantity = `800 kg`.
2. **Order Placed**: Client places an order for `300 kg` of `Roma Tomatoes`.
3. **Admin Fulfillment**:
   - Log in as Admin at `/admin?tab=orders`.
   - Locate the client's order.
   - Update order status from `Pending` → `Processing` → `Shipped` → **`Delivered`**.
4. **Verification**:
   - Inspect backend active `Supply` records for `Roma Tomatoes`.

**Expected Result**:
- Backend `OrderSerializer` automatically calculates `800 kg - 300 kg = 500 kg`.
- Active supply quantity in database and catalog updates widely to **500 kg**.

---

## 8. Test Suite 6: Multi-Currency & Conversion Widget

### Test Matrix

| Location | Action | Expected Output |
|---|---|---|
| Client Catalog | Default State | RWF (`RWF 1,300 / kg`) |
| Client Header | Toggle Currency to USD | `$1.00 / kg` |
| Farmer Submit Harvest | Type Asking Price `2600 RWF` | Live Converter displays `$2.00 USD` |
| Admin Master Product | Admin sets currency USD | Forced USD pricing for farmers on template |

---

## 9. Test Suite 7: Settings & Shipping Address Management

### Verification Matrix

| Portal | Setting | Action | Verification |
|---|---|---|---|
| Client | Shipping Address | Click Pencil Icon → Edit → Save | Prefills on `/client?screen=checkout` |
| Farmer | Certifications | Toggle Rwanda Cert Pills + Custom Input | Displayed on profile & admin review |
| Farmer | Payout Method | Select MTN MoMo + Phone number | Saved to profile for auto-invoicing |
| Client/Farmer/Admin | TopBar Avatar | Upload custom photo / Remove photo | Renders photo or avatar placeholder |

---

## 10. Test Suite 8: Deep-Link Routing & Session Security

### Scenario 10.1: Address Bar Query Parameter Sync
1. In Client portal, navigate between screens:
   - Click Catalog → URL updates to `/client?screen=catalog`.
   - Click Cart → URL updates to `/client?screen=cart`.
2. In Farmer portal, switch views:
   - Click My Supplies → URL updates to `/farmer?view=supplies`.
   - Click Settings → URL updates to `/farmer?view=settings`.
3. In Admin portal, switch tabs:
   - Click User Management → URL updates to `/admin?tab=users`.
   - Click Reports → URL updates to `/admin?tab=reports`.
4. Refresh browser on `/farmer?view=supplies`.

**Expected Result**:
- Browser reloads directly on the `My Supplies` view without losing state.

---

### Scenario 10.2: Session Keeper & Auto Token Refresh
1. Keep the browser open on `/client` or `/farmer` for an extended session.
2. Observe network traffic in browser developer tools:
   - Background refresh calls to `/api/accounts/token/refresh/` keep JWT access token fresh.

**Expected Result**:
- User browsing session continues indefinitely without abrupt logouts.

---

## 11. Quick Sanity Verification Checklist

```
AUTHENTICATION & SESSIONS
[ ] Session Keeper background refresh active (no unexpected logouts)
[ ] Session expiry redirects user gracefully to /
[ ] Google OAuth login endpoint (/api/accounts/google-login/) operational

RWANDA CERTIFICATIONS & FARMER APPLICATION
[ ] Application form (/apply) includes Rwanda certs & optional custom cert field
[ ] Simplified application header (Home & Sign In only)
[ ] Admin application approval generates user account & temporary credentials

SUPPLY & INVENTORY MANAGEMENT
[ ] Live RWF/USD currency conversion widget on Submit Harvest page
[ ] Delivering an order (e.g. 300kg from 800kg) automatically updates active supply to 500kg
[ ] Farmer supplies filter includes 'Negotiating' option and status pills

CLIENT MARKETPLACE & CHECKOUT
[ ] Cart icon badge displays distinct product line count (items.length)
[ ] Saved shipping address displays as visible card fields with pencil edit toggles
[ ] Saved shipping address automatically pre-fills on checkout form
[ ] RWF is primary currency with USD switcher

ADMIN & ANALYTICS
[ ] Orders by Status chart displays all statuses (Pending, Processing, Shipped, Delivered, Cancelled)
[ ] Master product catalog unit dropdown uses singular 'litre'
[ ] Deep-link URL query params (?screen=, ?view=, ?tab=) sync cleanly with address bar
```

---

*Last Updated: 2026-07-24*
