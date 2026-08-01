# 🌾 Harvest Hill Delivery — Complete End-to-End Test Guide

> **An exhaustive, step-by-step test guide for validating all user journeys, portal workflows, inventory deductions, 100% RWF transactions, user-scoped privacy isolation, real-time notifications, and administrative controls starting from a clean database.**

---

## 📑 Table of Contents

- [1. System Architecture & Prerequisites](#1-system-architecture--prerequisites)
- [2. Clean Database Baseline & Admin Credentials](#2-clean-database-baseline--admin-credentials)
- [3. Complete End-to-End Walkthrough Flow](#3-complete-end-to-end-walkthrough-flow)
- [4. Test Suite 1: Admin Initial Login & Clean State](#4-test-suite-1-admin-initial-login--clean-state)
- [5. Test Suite 2: Prospective Farmer Application (`/apply`)](#5-test-suite-2-prospective-farmer-application-apply)
- [6. Test Suite 3: Admin Review, Application Approval & User Isolation](#6-test-suite-3-admin-review-application-approval--user-isolation)
- [7. Test Suite 4: Master Product Catalog Management (`/admin?tab=products`)](#7-test-suite-4-master-product-catalog-management-admintabproducts)
- [8. Test Suite 5: Farmer Operations, Harvest Submissions & Live Thresholds](#8-test-suite-5-farmer-operations-harvest-submissions--live-thresholds)
- [9. Test Suite 6: Admin Supply Approval](#9-test-suite-6-admin-supply-approval)
- [10. Test Suite 7: Client Registration & Marketplace Browsing](#10-test-suite-7-client-registration--marketplace-browsing)
- [11. Test Suite 8: Price Counter-Proposals & Negotiation Threads](#11-test-suite-8-price-counter-proposals--negotiation-threads)
- [12. Test Suite 9: Client Cart, Checkout & Privacy Isolation](#12-test-suite-9-client-cart-checkout--privacy-isolation)
- [13. Test Suite 10: Order Fulfillment & Automated Inventory Subtraction](#13-test-suite-10-order-fulfillment--automated-inventory-subtraction)
- [14. Test Suite 11: Settings, Avatars & Real-Time Profile Sync](#14-test-suite-11-settings-avatars--real-time-profile-sync)
- [15. Quick Sanity Verification Checklist](#15-quick-sanity-verification-checklist)

---

## 1. System Architecture & Prerequisites

Verify that backend and frontend services are running cleanly.

### Environment Commands

```bash
# Terminal 1 — Backend REST Server
cd backend
.\venv\Scripts\Activate.ps1   # Windows PowerShell
python manage.py runserver    # → http://localhost:8000

# Terminal 2 — Frontend Dev Server
cd frontend
npm run dev                   # → http://localhost:3000
```

---

## 2. Clean Database Baseline & Admin Credentials

The database has been wiped clean. Only the master administrator account exists:

* **Role**: Admin
* **Email**: `admin@harvesthill.test`
* **Password**: `adminpass123`

---

## 3. Complete End-to-End Walkthrough Flow

```
[1. Admin Logs In @ /login]
       ↓ (Sees clean empty dashboard & zeroed KPI metrics)
[2. Farmer Applies @ /apply] 
       ↓ (Validates >=8 char password, non-country cert label & Country Phone input)
[3. Admin Notification & Approval @ /admin?tab=users] 
       ↓ (Generates farmer account using applicant password; app deletion leaves user intact)
[4. Admin Creates Catalog Product @ /admin?tab=products] 
       ↓ (100% RWF base price & unit quantity thresholds)
[5. Farmer Submits Harvest Batch @ /farmer?view=submit] 
       ↓ (Enforces live thresholds: 20kg, 15L, 10 crates/jars/bundles + RWF prices)
[6. Admin Reviews & Accepts Supply @ /admin?tab=supplies] 
       ↓ (Publishes item to Client Catalog with farmer photo & RWF price)
[7. Client Registers & Initiates Price Negotiation @ /client] 
       ↓ (NegotiationThread created for buyer; farmer accepts offer & generates pending invoice)
[8. Client Adds to Cart & Places Order @ /client?screen=checkout] 
       ↓ (User-scoped cart storage key: cart_items_role_email; default shipping address in RWF)
[9. Admin Updates Order Status to 'Delivered' @ /admin?tab=orders] 
       ↓ (Backend OrderSerializer automatically deducts ordered quantity from active Supply batch)
[10. Client & Admin Inspect Invoices & KPI Spend Cards]
```

---

## 4. Test Suite 1: Admin Initial Login & Clean State

1. Open browser to `http://localhost:3000/login`.
2. Enter Credentials:
   - **Email**: `admin@harvesthill.test`
   - **Password**: `adminpass123`
3. Click **Sign In**.
4. Inspect Admin Overview (`/admin?tab=overview`):
   - **KPI Check**: Active Orders (`0`), Deliveries (`0`), Revenue (`RWF 0`), Approvals (`0`), Clients (`0`).
   - **Needs Attention**: Displays `"All caught up! No items require urgent attention."`

---

## 5. Test Suite 2: Prospective Farmer Application (`/apply`)

1. Open browser to `http://localhost:3000/apply`.
2. Inspect Header: Verify it contains **only** **Home** (`/`) and **Sign In** (`/login`).
3. **Password Validation Test**:
   - Type Password `short` (5 chars).
   - Click **Submit Application**.
   - **Validation Check**: Inline error `Password must be at least 8 characters long.` is displayed on the application form.
4. Complete Application Form with Valid Data:
   - **Full Name**: `Jean-Paul Hakizimana`
   - **Email**: `jeanpaul.farmer@harvesthill.test`
   - **Contact Phone**: Select Country (`🇷🇼 +250`), enter `788 987 654`.
   - **Farm Name**: `Kigali Organic Produce Ltd`
   - **Farm Location**: `Gasabo District, Kigali`
   - **Certifications**: Select `GAP Certified`, `RSB Organic`, `Organic Certified`.
   - **Custom Certification**: Type `Kigali Cooperative Guild Certified`.
   - **Password**: `SecurePass2026!` (>= 8 chars).
5. Click **Submit Application**.

**Expected Result**:
- Application submitted successfully.
- Admin receives a live notification and a "Needs Attention" alert.

---

## 6. Test Suite 3: Admin Review, Application Approval & User Isolation

1. Log in as Admin (`admin@harvesthill.test` / `adminpass123`).
2. **TopBar Notification Check**:
   - Verify notification alert: `"New Farmer Application from Jean-Paul Hakizimana (Kigali Organic Produce Ltd)."`
3. **Needs Attention Panel Check**:
   - Verify `Farmer Application: Kigali Organic Produce Ltd` appears in the list.
4. Navigate to User Management (`/admin?tab=users`).
   - **Badge Check**: Verify `Applications (1)` tab badge displays `Applications (1)` immediately.
5. Click **Applications** tab → click **Approve & Create Account**.
6. **Application Deletion Isolation Test**:
   - Delete the approved application record from the Applications tab.
   - **Validation Check**: Verify deleting the application record leaves the newly created user account (`jeanpaul.farmer@harvesthill.test`) intact and active under the **Users** tab.

---

## 7. Test Suite 4: Master Product Catalog Management (`/admin?tab=products`)

1. Open Admin Product Management (`/admin?tab=products`).
2. Click **Add Product**.
   - **Name**: `Organic Roma Tomatoes`
   - **Category**: `Vegetables`
   - **Base Price**: `1,200 RWF` (Verify label is strictly in **RWF**).
   - **Unit**: `kg`
   - **Quantity Needed**: `50`
   - **Urgency**: `High`
3. Click **Save Product**.
4. Repeat to create a second product:
   - **Name**: `Fresh Whole Milk`
   - **Category**: `Dairy` / `Animal-Based`
   - **Base Price**: `800 RWF`
   - **Unit**: `litre`
   - **Quantity Needed**: `30`
   - **Urgency**: `Medium`

---

## 8. Test Suite 5: Farmer Operations, Harvest Submissions & Live Thresholds

1. Log in as Farmer (`jeanpaul.farmer@harvesthill.test` / `SecurePass2026!`).
2. Navigate to **Submit Harvest** (`/farmer?view=submit`).
3. **Test Live kg Unit Threshold**:
   - Select `Organic Roma Tomatoes` (`kg`).
   - Type Quantity `10` → **Live Check**: Warning `Quantity must be at least 20 kg.` appears dynamically.
   - Update Quantity to `200 kg`, Asking Price to `1,000 RWF`.
   - Click **Submit Harvest**.
4. **Test Live Litre Unit Threshold**:
   - Select `Fresh Whole Milk` (`litre`).
   - Type Quantity `5` → **Live Check**: Warning `Quantity must be at least 15 litres.` appears dynamically.
   - Update Quantity to `100 litres`, Asking Price to `750 RWF`.
   - Click **Submit Harvest**.
5. Navigate to **My Supplies** (`/farmer?view=supplies`):
   - **Quick Filters Check**: Verify quick filter pills render `All Statuses`, `accepted`, `pending`, `draft` (Confirm `negotiating` and dropdown filter are cleanly removed).

---

## 8. Test Suite 5: Farmer Operations, Harvest Submissions & Approval Workflow

1. Log in as Farmer (`jeanpaul.farmer@harvesthill.test` / `SecurePass2026!`).
2. Navigate to **Submit Harvest** (`/farmer?view=submit`).
3. **Test Live kg Unit Threshold**:
   - Select `Organic Roma Tomatoes` (`kg`).
   - Type Quantity `10` → **Live Check**: Warning `Quantity must be at least 20 kg.` appears dynamically.
   - Update Quantity to `200 kg`, Asking Price to `1,000 RWF`.
   - Click **Submit Harvest**.
4. **Approval Workflow Check**:
   - Navigating to **My Supplies** (`/farmer?view=supplies`) shows harvest status as `pending`.
   - Log out of farmer and open guest homepage (`http://localhost:3000/`).
   - **Public Visibility Check**: The farmer's pending harvest is NOT yet visible to the public or clients until Harvest Hill Delivery approves it.

---

## 9. Test Suite 6: Harvest Hill Delivery Approval & Auto-Approve Admin Supplies

1. Log in as Admin / Harvest Hill Delivery (`admin@harvesthill.test` / `adminpass123`).
2. Navigate to **Supplies Management** (`/admin?tab=supplies`).
3. Locate farmer's pending harvest submission for `Organic Roma Tomatoes`.
4. Click **Approve / Accept Supply**.
5. **Immediate Admin Supply Test**:
   - As Admin, create a new supply/product directly from the Admin portal.
   - **Verification Check**: Supplies created by Harvest Hill Delivery are auto-accepted immediately (`status='accepted'`) and instantly visible to clients without extra approval steps.

---

## 10. Test Suite 7: Guest Redirections, Client Marketplace Browsing & Product Requests

1. Open browser to `http://localhost:3000/` as an unauthenticated guest.
2. Click **Add to Cart** or **Plus (+)** on any produce item card.
   - **Guest Redirect Check**: Automatically redirected to Login screen (`/login?redirect=cart`).
3. Return to Homepage (`/`), click on a product to view details, then click **Propose Price Negotiation / Bulk Deal**.
   - **Negotiation Redirect Check**: Automatically redirected to Login screen (`/login?redirect=cart`).
4. Log in as Client (`alice.client@harvesthill.test` / `ClientPass2026!`).
5. Navigate to Client Catalog (`/client?screen=catalog`).
6. **Request Unlisted Product Test**:
   - Click **Request Unlisted Product** button in top header.
   - Fill in Crop Name: `Yellow Passion Fruits`, Quantity: `50`, Unit: `kg`.
   - Click **Submit Sourcing Request**.
   - Verify success dialog confirms market demand logging.

---

## 11. Test Suite 8: Price Counter-Proposals & Negotiation Threads

1. As Client (`alice.client@harvesthill.test`), click on `Organic Roma Tomatoes` in catalog.
2. Click **Negotiate Price**:
   - Proposed Price: `950 RWF` per kg.
   - Quantity: `50 kg`.
   - Message: `Requesting bulk restaurant discount.`
3. Click **Send Offer**.
4. Log in as Farmer (`jeanpaul.farmer@harvesthill.test`).
5. Navigate to **Negotiations** (`/farmer?view=negotiations`).
6. Open active negotiation thread for `Organic Roma Tomatoes`:
   - Click **Accept Offer**.
7. **Validation Check**:
   - Negotiation status changes to `accepted`.

---

## 12. Test Suite 9: Client Cart, Checkout & Privacy Isolation

1. Log in as **Client A** (`alice.client@harvesthill.test`).
2. Add `30 kg` of `Organic Roma Tomatoes` to Cart.
3. Open Cart (`/client?screen=cart`) → Click **Proceed to Checkout**.
4. Enter Delivery Address (`124 KG 7 Ave, Remera, Kigali`) and place order.
5. Log out of Client A.
6. Register and log in as **Client B** (`bob.client@harvesthill.test` / `ClientPass2026!`).
7. Open Cart (`/client?screen=cart`).

**Expected Result**:
- Client B's cart is empty (badge displays `0`).
- Client A's cart items are strictly isolated under user-scoped storage (`cart_items_client_alice.client@harvesthill.test`) and never leak to Client B.

---

## 13. Test Suite 10: Order Fulfillment, Delivery Note PDF & Inventory Subtraction

1. Log in as Admin (`admin@harvesthill.test` / `adminpass123`).
2. Navigate to Orders Management (`/admin?tab=orders`).
3. Locate Client A's order for `Organic Roma Tomatoes` (`30 kg`).
4. Change status from `pending` to **`Delivered`**.
5. Navigate to Delivery Notes (`/admin?tab=deliveries`).
6. Click **View Delivery Note PDF** on the order delivery note.
7. **Delivery Note PDF Inspection**:
   - Verify table columns include **PRODUCT NAME**, **QUANTITY**, **UNIT PRICE**, **TOTAL PRICE**, and **Total Cost** footer.
   - Verify digital signature / recipient signature area is displayed cleanly.
   - Click **Print / Export PDF** button.
8. Navigate to Supplies Management (`/admin?tab=supplies`).

**Expected Result**:
- Supply inventory automatically deducts from `200 kg` to `170 kg`.

---

## 14. Test Suite 11: Settings, Avatars & Real-Time Profile Sync

1. Open Farmer Profile & Settings (`/farmer?view=settings`).
2. Upload a new profile picture.
3. **Real-Time Sync Check**: TopBar header avatar updates instantly without needing page reloads.
4. Select Payout Method `MTN MoMo` and enter account number.
5. Save settings and refresh browser (`F5`) to confirm persistence.

---

## 15. Quick Sanity Verification Checklist

```
ACCOUNT PRIVACY & SECURITY
[ ] Database baseline reset cleanly with only admin@harvesthill.test
[ ] Cart storage is user-scoped (cart_items_role_email)
[ ] Client A items do not appear in Client B cart
[ ] Password length on application form requires >= 8 characters
[ ] Deleting an approved application record leaves user account active

GUEST REDIRECTIONS & APPROVAL WORKFLOWS
[ ] Unauthenticated Add to Cart clicks redirect to /login?redirect=cart
[ ] Unauthenticated Price Negotiation clicks redirect to /login?redirect=cart
[ ] Harvest Hill Delivery added products are auto-accepted & immediate
[ ] Farmer added products require Harvest Hill Delivery approval before public visibility
[ ] Request Unlisted Product button & modal functional in Client Catalog

DELIVERY NOTES & PDF EXPORT
[ ] Delivery Note lists Product Name, Quantity, Unit Price, Total Price & Total Cost
[ ] Digital / Issued Signature applied cleanly to Delivery Note
[ ] Print / Export PDF feature functional for Delivery Notes
```

---

*Last Updated: 2026-07-26*
