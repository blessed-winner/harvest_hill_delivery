# 🌾 Harvest Hill Delivery — Complete End-to-End Test Guide

> **An exhaustive, intentional test suite for validating all user journeys, portal workflows, inventory deductions, multi-currency conversions, country phone selection, client account privacy isolation, and administrative controls across Harvest Hill Delivery.**

---

## 📑 Table of Contents

- [1. System Architecture & Prerequisites](#1-system-architecture--prerequisites)
- [2. Flow Overview](#2-flow-overview)
- [3. Test Suite 1: Prospective Farmer & Admin Verification](#3-test-suite-1-prospective-farmer--admin-verification)
- [4. Test Suite 2: Farmer Operations & Harvest Submissions](#4-test-suite-2-farmer-operations--harvest-submissions)
- [5. Test Suite 3: Admin Catalog & Supply Approval](#5-test-suite-3-admin-catalog--supply-approval)
- [6. Test Suite 4: Client Marketplace & Checkout Flow](#6-test-suite-4-client-marketplace--checkout-flow)
- [7. Test Suite 5: Client Account Privacy Isolation](#7-test-suite-5-client-account-privacy-isolation)
- [8. Test Suite 6: Automated Supply Subtraction & Fulfillment](#8-test-suite-6-automated-supply-subtraction--fulfillment)
- [9. Test Suite 7: Multi-Currency & Unit Quantity Thresholds](#9-test-suite-7-multi-currency--unit-quantity-thresholds)
- [10. Test Suite 8: Settings & Shipping Address Management](#10-test-suite-8-settings--shipping-address-management)
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

---

## 2. Flow Overview

```
[1. Farmer Applies @ /apply] 
       ↓ (Validates 8+ char password & Country Phone input)
[2. Admin receives Notification & 'Needs Attention' alert] 
       ↓ (Always-on 'Applications (1)' badge on Admin tab)
[3. Admin Approves Application @ /admin?tab=applications] 
       ↓ (Generates account using applicant's entered password)
[4. Farmer Submits Harvest Batch @ /farmer?view=submit] 
       ↓ (Enforces unit-specific thresholds: 20kg, 10L, 10 crates + Live RWF/USD Converter)
[5. Admin Reviews & Accepts Supply @ /admin?tab=supplies] 
       ↓ (Publishes item to Client Catalog with farmer photo & price)
[6. Client Browses Catalog & Adds to Cart @ /client?screen=catalog] 
       ↓ (User-scoped cart storage key: cart_items_client_email)
[7. Client Saves Address & Places Order @ /client?screen=checkout] 
       ↓ (Prefilled default shipping address & delivery time window)
[8. Admin Updates Order Status to 'Delivered' @ /admin?tab=orders] 
       ↓ (Backend OrderSerializer automatically deducts qty from active Supply)
[9. Client Inspects PDF Invoice & RWF KPI Spend Card @ /client?screen=dashboard]
```

---

## 3. Test Suite 1: Prospective Farmer & Admin Verification

### Scenario 1.1: Submit Farmer Application (`/apply`)
1. Open browser to `http://localhost:3000/apply`.
2. Inspect the header: Verify it contains **only** the **Home** (`/`) and **Sign In** (`/login`) buttons.
3. Test Password Length Validation:
   - Type password `short` (5 characters).
   - Click **Submit Application**.
   - **Validation Check**: Verify inline error `Password must be at least 8 characters long.` is displayed.
4. Fill out the application form with valid data:
   - **Full Name**: `Jean-Paul Hakizimana`
   - **Email**: `jeanpaul.farmer@harvesthill.test`
   - **Contact Phone**: Test Country Selector dropdown (`🇷🇼 +250`), enter `788 987 654`.
   - **Farm Name**: `Kigali Organic Produce Ltd`
   - **Farm Location**: `Gasabo District, Kigali`
   - **Primary Crops**: `Roma Tomatoes, Bell Peppers, Irish Potatoes` (Verify `Herbs` option is removed).
   - **Certifications Selection**: Select `GAP Certified`, `RSB Organic`, and `Organic Certified`.
   - **Custom Certification**: Type `Kigali Cooperative Guild Certified`.
   - **Password**: `SecurePass2026!` (>= 8 chars).
5. Click **Submit Application**.

**Expected Result**:
- Application submitted successfully.
- An Admin `Notification` and `AuditLog` entry are automatically generated for all administrators.

---

### Scenario 1.2: Admin Notification & Application Approval (`/admin`)
1. Log in as Admin at `http://localhost:3000/login`.
2. Check TopBar Notifications:
   - Verify notification alert: `"New Farmer Application from Jean-Paul Hakizimana (Kigali Organic Produce Ltd)."`
3. Inspect Dashboard "Needs Attention" Panel:
   - Verify `Farmer Application: Kigali Organic Produce Ltd` appears in the list.
4. Navigate to User Management (`/admin?tab=users`).
   - **Badge Check**: Verify the `Applications (1)` tab badge displays `(1)` immediately without requiring prior clicks into the applications tab.
5. Click the **Applications** tab → inspect row for `Kigali Organic Produce Ltd`.
6. Click **Approve & Create Account**.

**Expected Result**:
- Account created using applicant's entered password `SecurePass2026!`.
- Deleting an application record leaves the created user account active.

---

## 4. Test Suite 2: Farmer Operations & Harvest Submissions

### Scenario 2.1: Unit-Specific Quantity Thresholds (`/farmer?view=submit`)
1. Log in as Farmer (`jeanpaul.farmer@harvesthill.test` / `SecurePass2026!`).
2. Navigate to **Submit Harvest** (`/farmer?view=submit`).
3. **Test kg Unit Threshold**:
   - Select a `kg` product (e.g. `Roma Tomatoes`).
   - Enter Quantity `15 kg` → click Submit.
   - **Validation Check**: Error `Quantity must be at least 20 kg.` is shown.
4. **Test Litre Unit Threshold**:
   - Select a `litre` product (e.g. `Grass-fed Whole Milk`).
   - Enter Quantity `5 litres` → click Submit.
   - **Validation Check**: Error `Quantity must be at least 15 litres.` is shown.
5. Enter Quantity `25 litres`, Asking Price `1500 RWF`.
6. Click **Submit Harvest**.

**Expected Result**:
- Harvest batch submitted successfully.

---

### Scenario 2.2: Farmer Settings & Payout Methods (`/farmer?view=settings`)
1. Navigate to **Settings** (`/farmer?view=settings`).
2. **Profile Avatar Check**:
   - Verify default avatar displays a neutral SVG user silhouette icon (not a stock photo).
3. **Contact Phone Selector**:
   - Verify phone field uses `CountryPhoneInput`.
4. **Payout Method Selection**:
   - Open Payout Provider dropdown.
   - Verify available options: `MTN Mobile Money (MoMo)`, `Airtel Money`, `Bank Transfer (Bank of Kigali)`, `Bank Transfer (I&M Bank)`, `Bank Transfer (Equity Bank)`.
   - Select `Bank Transfer (I&M Bank)` and enter Account `# 00123-98745-01`.
5. Click **Save Changes** and refresh browser (`F5`).

**Expected Result**:
- On browser refresh, payout method `Bank Transfer (I&M Bank)` and account number remain permanently saved.

---

## 5. Test Suite 3: Admin Catalog & Detail View UI

### Scenario 3.1: Master Product Catalog Base Price RWF Default (`/admin?tab=products`)
1. Log in as Admin → `/admin?tab=products` → Click **Add Product**.
2. Inspect Base Price label:
   - **Check**: Verify label defaults to `Base Price (RWF)`.
   - Click **Toggle Currency** to switch between RWF and USD.
3. Select unit `litre` → enter quantity needed `5` → click Save.
   - **Validation Check**: Error `Quantity needed must be at least 10 litres.` is shown.

---

### Scenario 3.2: Refined Admin Detail Drawer Typography
1. Open Admin User Management (`/admin?tab=users`), Supplies (`/admin?tab=supplies`), or Orders (`/admin?tab=orders`).
2. Click any row to open the Detail Drawer.
3. Verify typography is crisp, compact, and non-oversized (`text-xs font-bold` / `font-mono`).

---

## 6. Test Suite 4: Client Marketplace & Checkout Flow

### Scenario 4.1: Client Dashboard RWF Spend Card (`/client?screen=dashboard`)
1. Log in as Client at `/login`.
2. Navigate to `/client?screen=dashboard`.
3. Inspect **Spend This Month** card:
   - **Check**: Monetary volume renders in **RWF** by default (`RWF 150,000`).
   - Click **Toggle (RWF)** inside the card header to translate value to USD (`$115.38`).

---

## 7. Test Suite 5: Client Account Privacy Isolation

### Scenario 7.1: Isolated Cart & Session Privacy
1. Log in as **Client A** (`clientA@harvesthill.test`).
2. Add 3 items to cart (e.g. 50 kg Tomatoes, 20 L Milk, 30 kg Wheat).
3. Verify Cart icon badge displays **3**.
4. Log out of Client A.
5. Log in as **Client B** (`clientB@harvesthill.test`).
6. Navigate to `/client?screen=cart`.

**Expected Result**:
- Client B's cart is empty (badge displays **0**).
- Client A's cart items are strictly isolated under `cart_items_client_clientA@harvesthill_test` and never leak to Client B.

---

## 8. Test Suite 6: Automated Supply Subtraction & Fulfillment

### Scenario 8.1: Inventory Subtraction Execution
1. Farmer submits `800 kg` of Roma Tomatoes → Admin approves supply.
2. Client A orders `300 kg` of Roma Tomatoes.
3. Admin changes order status to **`Delivered`**.
4. Inspect active supply inventory in database/catalog.

**Expected Result**:
- Active supply quantity automatically updates from `800 kg` to `500 kg`.

---

## 9. Test Suite 7: Multi-Currency & Unit Quantity Thresholds

| Unit Type | Minimum Threshold | Validation Error Message |
|---|---|---|
| `kg` | 20 kg | Quantity must be at least 20 kg. |
| `litre` / `liter` | 10 litres | Quantity must be at least 10 litres. |
| `crate` | 10 crates | Quantity must be at least 10 crates. |
| `jar` | 10 jars | Quantity must be at least 10 jars. |
| `bundle` | 10 bundles | Quantity must be at least 10 bundles. |

---

## 10. Test Suite 8: Settings & Shipping Address Management

| Portal | Feature | Verification |
|---|---|---|
| Client | Shipping Address | Visible card fields with pencil edit toggle prefilling checkout |
| Client | Dashboard KPI | RWF spend metric by default with inline toggle |
| Farmer | Phone Input | `CountryPhoneInput` with country flag & dial code |
| Farmer | Payout Options | Includes I&M Bank, MoMo, Airtel, BK, Equity (Cash removed) |
| Farmer | Profile Avatar | Neutral SVG user silhouette placeholder |

---

## 11. Quick Sanity Verification Checklist

```
ACCOUNT PRIVACY & SECURITY
[ ] Cart storage is user-scoped (cart_items_role_email)
[ ] Client A items do not appear in Client B cart
[ ] Password length on application form requires >= 8 characters

ADMIN NOTIFICATIONS & BADGES
[ ] New farmer application generates Admin notification & 'Needs Attention' alert
[ ] Applications (x) pending count badge is always visible on User Management tab

UNIT THRESHOLDS & CURRENCY
[ ] kg threshold min 20 kg
[ ] litre threshold min 10 litres
[ ] crate/jar/bundle min 10 units
[ ] Base Price on Admin Product form defaults to Base Price (RWF)
[ ] Client Dashboard Spend KPI displays RWF by default with toggle button

FARMER PAYOUT & SETTINGS
[ ] Payout options include I&M Bank, MoMo, Airtel, BK, Equity Bank
[ ] Cash on delivery option removed from farmer payout dropdown
[ ] Profile avatar uses neutral SVG silhouette icon
[ ] Farmer settings persist permanently upon page refresh
```

---

*Last Updated: 2026-07-24*
