# 🌾 Harvest Hill Delivery — Complete End-to-End Test Guide

> **An exhaustive, intentional test suite for validating all user journeys, portal workflows, inventory deductions, 100% RWF currency transactions, Instagram-style profile avatars, country phone selection, client account privacy isolation, and administrative controls across Harvest Hill Delivery.**

---

## 📑 Table of Contents

- [1. System Architecture & Prerequisites](#1-system-architecture--prerequisites)
- [2. Flow Overview](#2-flow-overview)
- [3. Test Suite 1: Prospective Farmer & Admin Verification](#3-test-suite-1-prospective-farmer--admin-verification)
- [4. Test Suite 2: Farmer Operations, Harvest Submissions & Settings](#4-test-suite-2-farmer-operations-harvest-submissions--settings)
- [5. Test Suite 3: Admin Catalog, Supply Approval & User Management](#5-test-suite-3-admin-catalog-supply-approval--user-management)
- [6. Test Suite 4: Client Marketplace, Cart & Checkout Flow](#6-test-suite-4-client-marketplace-cart--checkout-flow)
- [7. Test Suite 5: Client Account Privacy Isolation](#7-test-suite-5-client-account-privacy-isolation)
- [8. Test Suite 6: Automated Supply Subtraction & Fulfillment](#8-test-suite-6-automated-supply-subtraction--fulfillment)
- [9. Test Suite 7: Live Unit Quantity Thresholds](#9-test-suite-7-live-unit-quantity-thresholds)
- [10. Test Suite 8: Settings, Avatar Upload & Real-Time Sync](#10-test-suite-8-settings-avatar-upload--real-time-sync)
- [11. Quick Sanity Verification Checklist](#11-quick-sanity-verification-checklist)

---

## 1. System Architecture & Prerequisites

Before initiating any test scenario, verify that local environment services are running cleanly.

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
       ↓ (Validates 8+ char password, non-country cert label & Country Phone input)
[2. Admin receives Notification & 'Needs Attention' alert] 
       ↓ (Always-on 'Applications (x)' badge on Admin tab)
[3. Admin Approves Application @ /admin?tab=users] 
       ↓ (Generates account using applicant's password; deletion of app leaves user intact)
[4. Farmer Submits Harvest Batch @ /farmer?view=submit] 
       ↓ (Enforces live thresholds: 20kg, 15L, 10 crates/jars/bundles + RWF prices)
[5. Admin Reviews & Accepts Supply @ /admin?tab=supplies] 
       ↓ (Publishes item to Client Catalog with farmer photo & RWF price)
[6. Client Browses Catalog & Adds to Cart @ /client?screen=catalog] 
       ↓ (User-scoped cart storage key: cart_items_client_email)
[7. Client Saves Address & Places Order @ /client?screen=checkout] 
       ↓ (Prefilled default shipping address & delivery time window in RWF)
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
   - **Validation Check**: Verify inline error `Password must be at least 8 characters long.` is displayed on the application page (not preoccupying admin on approval).
4. Fill out the application form with valid data:
   - **Full Name**: `Jean-Paul Hakizimana`
   - **Email**: `jeanpaul.farmer@harvesthill.test`
   - **Contact Phone**: Test Country Selector dropdown (`🇷🇼 +250`), enter `788 987 654`.
   - **Farm Name**: `Kigali Organic Produce Ltd`
   - **Farm Location**: `Gasabo District, Kigali`
   - **Primary Crops**: Select crops (Verify `Herbs` option is completely removed).
   - **Certifications Selection**: Verify generic label `"Select your certifications..."` (non-country specific). Select `GAP Certified`, `RSB Organic`, and `Organic Certified`.
   - **Custom Certification**: Type `Kigali Cooperative Guild Certified`.
   - **Password**: `SecurePass2026!` (>= 8 chars).
5. Click **Submit Application**.

**Expected Result**:
- Application submitted successfully.
- An Admin `Notification` and `AuditLog` entry are automatically generated for administrators.

---

### Scenario 1.2: Admin Notification & Application Approval (`/admin?tab=users`)
1. Log in as Admin at `http://localhost:3000/login`.
2. Check TopBar Notifications:
   - Verify notification alert: `"New Farmer Application from Jean-Paul Hakizimana (Kigali Organic Produce Ltd)."`
3. Inspect Dashboard "Needs Attention" Panel:
   - Verify `Farmer Application: Kigali Organic Produce Ltd` appears in the list.
4. Navigate to User Management (`/admin?tab=users`).
   - **Badge Check**: Verify the `Applications (1)` tab badge displays `Applications (1)` immediately without requiring prior clicks into the applications tab.
5. Click the **Applications** tab → inspect row for `Kigali Organic Produce Ltd`.
   - **Avatar Check**: Verify row displays applicant's profile picture or Instagram-style default avatar (`<DefaultProfileAvatar />`) instead of text initials.
6. Click **Approve & Create Account**.
7. Test Application Deletion Isolation:
   - Delete an accepted application record from the Applications tab.
   - **Validation Check**: Verify deleting an accepted application record leaves the created user account intact and active in the Users tab.

**Expected Result**:
- Account created using applicant's entered password `SecurePass2026!`.
- Deleting an application record does not delete the user account.

---

## 4. Test Suite 2: Farmer Operations, Harvest Submissions & Settings

### Scenario 2.1: Live Unit-Specific Quantity Thresholds (`/farmer?view=submit`)
1. Log in as Farmer (`jeanpaul.farmer@harvesthill.test` / `SecurePass2026!`).
2. Navigate to **Submit Harvest** (`/farmer?view=submit`).
3. **Test Live kg Unit Threshold**:
   - Select a `kg` product (e.g. `Roma Tomatoes`).
   - Type Quantity `15` → **Live Check**: Warning `Quantity must be at least 20 kg.` appears dynamically as you type.
4. **Test Live Litre Unit Threshold**:
   - Select a `litre` product (e.g. `Fresh Whole Milk`).
   - Type Quantity `8` → **Live Check**: Warning `Quantity must be at least 15 litres.` appears dynamically as you type.
5. **Test Live Crate / Jar / Bundle Threshold**:
   - Select a `crate` or `jar` product.
   - Type Quantity `5` → **Live Check**: Warning `Quantity must be at least 10 crates.` appears dynamically.
6. Enter Quantity `25 litres`, Asking Price `1,500 RWF`.
7. Click **Submit Harvest**.

**Expected Result**:
- Harvest batch submitted successfully in RWF currency.

---

### Scenario 2.2: Farmer Profile Settings & Avatar Upload (`/farmer?view=settings`)
1. Navigate to **Farmer Profile & Settings** (`/farmer?view=settings`).
2. **Profile Avatar Check**:
   - Verify default profile picture uses the sleek Instagram-style default avatar (`<DefaultProfileAvatar />`) when no picture is set.
3. **Upload Profile Picture**:
   - Click **Upload Picture** → select a valid JPG/PNG image file.
   - Click **Save Profile**.
   - **Real-Time Sync Check**: Verify topbar header avatar updates instantly in real time via the `profile-updated` event.
4. **Payout Method Selection**:
   - Open Payout Provider dropdown.
   - Select `Bank Transfer (I&M Bank)` and enter Account `# 00123-98745-01`.
5. Click **Save Profile** and refresh browser (`F5`).

**Expected Result**:
- Profile changes, picture, payout method, and account number persist cleanly across page reloads.

---

## 5. Test Suite 3: Admin Catalog, Supply Approval & User Management

### Scenario 3.1: 100% RWF Currency Master Catalog (`/admin?tab=products`)
1. Log in as Admin → Navigate to `/admin?tab=products` → Click **Add Product**.
2. Inspect Price Field:
   - **Check**: Verify price label is strictly `Base Price (RWF)` without any USD or currency conversion controls.
3. Select unit `litre` → enter quantity needed `8` → click Save.
   - **Validation Check**: Error `Quantity needed must be at least 15 litres.` is shown.

---

### Scenario 3.2: User Management Table Avatars & Details (`/admin?tab=users`)
1. Open Admin User Management (`/admin?tab=users`).
2. Inspect Users table rows:
   - **Avatar Check**: Verify user rows render actual uploaded profile pictures or Instagram-style default avatars (`<DefaultProfileAvatar />`) instead of text initials.
3. Click any user row to open the Detail Drawer.
   - **Drawer Header Check**: Verify top card displays the user's avatar, username, email, and role badge cleanly.

---

## 6. Test Suite 4: Client Marketplace, Cart & Checkout Flow

### Scenario 4.1: Pure RWF Client Dashboard & Spend KPI (`/client?screen=dashboard`)
1. Log in as Client at `/login`.
2. Navigate to Client Dashboard (`/client?screen=dashboard`).
3. Inspect **Spend This Month** card:
   - **Check**: Monetary volume renders strictly in **RWF** (`RWF 150,000`) without USD or conversion toggles.
4. TopBar Profile Avatar Check:
   - Verify topbar header displays the client's uploaded profile picture or Instagram-style default avatar.

---

## 7. Test Suite 5: Client Account Privacy Isolation

### Scenario 7.1: Isolated Cart & Session Privacy
1. Log in as **Client A** (`clientA@harvesthill.test`).
2. Add 3 items to cart (e.g. 50 kg Tomatoes, 25 L Milk, 30 kg Wheat).
3. Verify Cart icon badge displays **3**.
4. Log out of Client A.
5. Log in as **Client B** (`clientB@harvesthill.test`).
6. Navigate to `/client?screen=cart`.

**Expected Result**:
- Client B's cart is empty (badge displays **0**).
- Client A's cart items are strictly isolated under user-scoped storage (`cart_items_client_clientA@harvesthill_test`) and never leak to Client B.

---

## 8. Test Suite 6: Automated Supply Subtraction & Fulfillment

### Scenario 8.1: Inventory Subtraction Execution
1. Farmer submits `800 kg` of Roma Tomatoes → Admin approves supply.
2. Client A orders `300 kg` of Roma Tomatoes.
3. Admin changes order status to **`Delivered`** (`/admin?tab=orders`).
4. Inspect active supply inventory in database/catalog.

**Expected Result**:
- Active supply quantity automatically updates from `800 kg` to `500 kg`.

---

## 9. Test Suite 7: Live Unit Quantity Thresholds

| Unit Type | Minimum Threshold | Live Validation Error Message |
|---|---|---|
| `kg` | **20 kg** | `Quantity must be at least 20 kg.` |
| `litre` / `liter` / `l` | **15 litres** | `Quantity must be at least 15 litres.` |
| `crate` | **10 crates** | `Quantity must be at least 10 crates.` |
| `jar` | **10 jars** | `Quantity must be at least 10 jars.` |
| `bundle` | **10 bundles** | `Quantity must be at least 10 bundles.` |

---

## 10. Test Suite 8: Settings, Avatar Upload & Real-Time Sync

| Portal | Feature | Verification |
|---|---|---|
| Farmer | Settings Save | Uploads/removes avatar via MultiPart `FormData`; emits real-time `profile-updated` event |
| Farmer | Map Element | Removed from profile settings for clean, fast layout |
| Farmer | TopBar Avatar | Displays uploaded picture or Instagram-style default avatar |
| Client | TopBar Avatar | Displays uploaded picture or Instagram-style default avatar |
| Admin | TopBar Avatar | Displays uploaded picture or Instagram-style default avatar |
| Admin | User Table | Displays profile pictures / Instagram default avatars instead of text initials |

---

## 11. Quick Sanity Verification Checklist

```
ACCOUNT PRIVACY & SECURITY
[ ] Cart storage is user-scoped (cart_items_role_email)
[ ] Client A items do not appear in Client B cart
[ ] Password length on application form requires >= 8 characters (validated on application page)
[ ] Deleting an accepted application record leaves user account active

ADMIN NOTIFICATIONS & BADGES
[ ] New farmer application generates Admin notification & 'Needs Attention' alert
[ ] Applications (x) pending count badge is always visible on User Management tab
[ ] User Management table displays profile pictures / Instagram default avatars instead of text initials

UNIT THRESHOLDS & PURE RWF CURRENCY
[ ] kg threshold min 20 kg
[ ] litre threshold min 15 litres
[ ] crate/jar/bundle min 10 units
[ ] 100% RWF currency across application (USD and currency toggles completely removed)

FARMER PAYOUT, SETTINGS & AVATARS
[ ] Payout options include I&M Bank, MoMo, Airtel, BK, Equity Bank
[ ] TopNav headers across all portals display uploaded profile picture or Instagram-style default avatar
[ ] Profile photo uploads and settings saves update topbar headers in real time via 'profile-updated' event
[ ] Map element removed from farmer profile settings
```

---

*Last Updated: 2026-07-25*
