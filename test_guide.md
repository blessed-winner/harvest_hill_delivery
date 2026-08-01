# 🌾 Harvest Hill Delivery — Complete End-to-End Test Guide

> **An exhaustive, step-by-step test guide for validating all user journeys, portal workflows, inventory deductions, 100% RWF transactions, user-scoped privacy isolation, real-time notifications, guest login redirections, and administrative controls starting from a clean database.**

---

## 📑 Table of Contents

- [1. System Architecture & Prerequisites](#1-system-architecture--prerequisites)
- [2. Clean Database Baseline & Admin Credentials](#2-clean-database-baseline--admin-credentials)
- [3. Complete End-to-End Walkthrough Flow](#3-complete-end-to-end-walkthrough-flow)
- [4. Test Suite 1: Admin Initial Login & Clean State](#4-test-suite-1-admin-initial-login--clean-state)
- [5. Test Suite 2: Unified Registration (Supplier vs Client Role Toggle)](#5-test-suite-2-unified-registration-supplier-vs-client-role-toggle)
- [6. Test Suite 3: Admin Direct Harvest Submission (Auto-Accepted)](#6-test-suite-3-admin-direct-harvest-submission-auto-accepted)
- [7. Test Suite 4: Farmer Harvest Submission & Admin Approval Workflow](#7-test-suite-4-farmer-harvest-submission--admin-approval-workflow)
- [8. Test Suite 5: Guest User Redirections (Add to Cart & Negotiation)](#8-test-suite-5-guest-user-redirections-add-to-cart--negotiation)
- [9. Test Suite 6: Sourcing Unlisted Products (Market Demand Requests)](#9-test-suite-6-sourcing-unlisted-products-market-demand-requests)
- [10. Test Suite 7: Price Counter-Proposals & Negotiation Threads](#10-test-suite-7-price-counter-proposals--negotiation-threads)
- [11. Test Suite 8: Client Cart, Checkout & User-Scoped Privacy Isolation](#11-test-suite-8-client-cart-checkout--user-scoped-privacy-isolation)
- [12. Test Suite 9: Order Fulfillment, Delivery Note PDF & Auto Inventory Subtraction](#12-test-suite-9-order-fulfillment-delivery-note-pdf--auto-inventory-subtraction)
- [13. Test Suite 10: Settings, Avatars & Real-Time Profile Sync](#13-test-suite-10-settings-avatars--real-time-profile-sync)
- [14. Quick Sanity Verification Checklist](#14-quick-sanity-verification-checklist)

---

## 1. System Architecture & Prerequisites

Verify that backend and frontend services are running cleanly.

### Environment Commands

```bash
# Terminal 1 — Backend REST Server
cd backend
.\venv\Scripts\Activate.ps1   # Windows PowerShell
python manage.py runserver    # → http://localhost:8000

# Terminal 2 — Frontend Dev Server (Next.js v16.2.12)
cd frontend
npm run dev                   # → http://localhost:3000
```

---

## 2. Clean Database Baseline & Admin Credentials

The database has been wiped clean. Only the master administrator account exists:

* **Role**: Admin / Harvest Hill Delivery Sourcing Head
* **Email**: `admin@harvesthill.test`
* **Password**: `adminpass123`

---

## 3. Complete End-to-End Walkthrough Flow

```
[1. Admin Logs In @ /login]
       ↓ (Sees clean empty dashboard & zeroed KPI metrics)
[2. Unified Registration @ /signup] 
       ↓ (Selects 🛒 Client/Buyer or 🌾 Farmer/Supplier role toggle; registers directly)
[3. Admin Submits Own Harvest @ /admin?tab=products] 
       ↓ (Auto-accepted status='accepted'; immediately live for public & clients)
[4. Farmer Submits Harvest Batch @ /farmer?view=submit] 
       ↓ (Saved as status='pending'; hidden from public until Harvest Hill approves)
[5. Admin Approves Farmer Supply @ /admin?tab=supplies] 
       ↓ (Publishes item to Client Catalog with farmer profile & RWF price)
[6. Unauthenticated Guest Tries Cart/Negotiation @ /] 
       ↓ (Automatically redirected to /login?redirect=cart)
[7. Client Requests Unlisted Product @ /client?screen=catalog] 
       ↓ (Submits custom crop demand request to inform market procurement needs)
[8. Price Negotiation @ /client?screen=product-detail] 
       ↓ (NegotiationThread created; farmer accepts offer)
[9. Client Places Order & Admin Marks 'Delivered'] 
       ↓ (Order items deducted from supply batch; Delivery Note generated)
[10. Delivery Note PDF Inspection & Export]
       ↓ (Displays Product Name, Qty, Unit Price, Total Price, Total Cost & Signature)
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

## 5. Test Suite 2: Unified Registration (Supplier vs Client Role Toggle)

1. Open browser to `http://localhost:3000/signup`.
2. **Role Selection Check**:
   - Verify top toggle switch renders **🛒 Client / Buyer** and **🌾 Farmer / Supplier**.
3. **Register Farmer / Supplier Account**:
   - Click **🌾 Farmer / Supplier**.
   - **Full Name**: `Jean-Paul Hakizimana`
   - **Username**: `jeanpaul_farm`
   - **Email**: `jeanpaul.farmer@harvesthill.test`
   - **Phone**: Select Country (`🇷🇼 +250`), enter `788 987 654`.
   - **Password**: `SecurePass2026!` (>= 8 chars).
   - Agree to terms and click **Register as Supplier**.
   - **Validation Check**: Account created cleanly without backend 400 error!
4. **Register Client / Buyer Account**:
   - Click **🛒 Client / Buyer**.
   - **Full Name**: `Alice Murekatete`
   - **Username**: `alice_buyer`
   - **Email**: `alice.client@harvesthill.test`
   - **Phone**: Select Country (`🇷🇼 +250`), enter `788 123 456`.
   - **Password**: `ClientPass2026!`.
   - Click **Register as Client**.

---

## 6. Test Suite 3: Admin Direct Harvest Submission (Auto-Accepted)

*(Requirement: Ensure that when Harvest Hill Delivery adds products they immediately go to the clients.)*

1. Log in as Admin / Harvest Hill Delivery (`admin@harvesthill.test` / `adminpass123`).
2. Open Admin Product Management (`/admin?tab=products`).
3. Click **Add Product** (or select existing catalog crop):
   - **Name**: `Organic Roma Tomatoes`
   - **Category**: `Vegetables`
   - **Base Price**: `1,200 RWF`
   - **Unit**: `kg`
   - **Quantity Needed**: `50`
   - Click **Save Product**.
4. On the newly created `Organic Roma Tomatoes` card, click **🌾 Submit Harvest**:
   - **Quantity**: `200 kg`
   - **Asking Price**: `1,000 RWF`
   - **Quality Grade**: `Premium`
   - Click **Record Harvest Batch**.
5. **Immediate Public Visibility Check**:
   - Open homepage (`http://localhost:3000/`) or guest catalog.
   - **Validation Check**: The harvest submitted by Harvest Hill Delivery has `status='accepted'` automatically and is **immediately visible to clients and the public** without any approval step!

---

## 7. Test Suite 4: Farmer Harvest Submission & Admin Approval Workflow

*(Requirement: Ensure that when farmers add products, they are first approved by Harvest Hill before displaying them to the public.)*

1. Log in as Farmer (`jeanpaul.farmer@harvesthill.test` / `SecurePass2026!`).
2. Navigate to **Submit Harvest** (`/farmer?view=submit`).
3. Fill Harvest Details:
   - Select `Organic Roma Tomatoes` (`kg`).
   - Quantity: `300 kg`.
   - Asking Price: `950 RWF`.
   - Click **Submit Harvest**.
4. Check Farmer Supply Log (`/farmer?view=supplies`):
   - Verify status is **`pending`**.
5. **Public Visibility Check (Pending State)**:
   - Open guest homepage (`http://localhost:3000/`).
   - **Validation Check**: Farmer's `pending` harvest is **NOT visible** to clients or the public yet.
6. **Admin Approval**:
   - Log in as Admin (`admin@harvesthill.test` / `adminpass123`).
   - Navigate to **Supplies Management** (`/admin?tab=supplies`).
   - Locate pending harvest for `Organic Roma Tomatoes` from `Jean-Paul Hakizimana`.
   - Click **Approve / Accept Supply**.
7. **Public Visibility Check (Approved State)**:
   - Refresh client catalog or homepage.
   - **Validation Check**: Farmer harvest is now **publicly visible to all clients**!

---

## 8. Test Suite 5: Guest User Redirections (Add to Cart & Negotiation)

*(Requirement: Add to cart or negotiation button redirects unauthenticated users to login page.)*

1. Open browser to `http://localhost:3000/` as an unauthenticated guest.
2. **Add to Cart Test**:
   - Locate any produce item card on the homepage.
   - Click **Add to Cart** or the **Plus (+)** button.
   - **Validation Check**: Automatically redirected to `/login?redirect=cart`.
3. **Price Negotiation Test**:
   - Return to homepage (`/`).
   - Click on a produce card to open the Product Details page.
   - Click **Propose Price Negotiation / Bulk Deal**.
   - **Validation Check**: Automatically redirected to `/login?redirect=cart`.

---

## 9. Test Suite 6: Sourcing Unlisted Products (Market Demand Requests)

*(Requirement: Clients will have the functionality to request specific products not listed on the Harvest Hill portal to know market needs.)*

1. Log in as Client (`alice.client@harvesthill.test` / `ClientPass2026!`).
2. Navigate to Client Catalog (`/client?screen=catalog`).
3. Click **Request Unlisted Product** button in top header.
4. Fill Sourcing Request Form:
   - **Product / Crop Name**: `Yellow Passion Fruits`
   - **Target Quantity**: `50`
   - **Unit**: `kg`
   - **Specifications / Timeline**: `Require delivery by next Tuesday, Grade A quality.`
5. Click **Submit Sourcing Request**.
6. **Validation Check**: Success dialog confirms market request logged for procurement analysis.

---

## 10. Test Suite 7: Price Counter-Proposals & Negotiation Threads

1. As Client (`alice.client@harvesthill.test`), click on `Organic Roma Tomatoes` in catalog.
2. Click **Propose Price Negotiation / Bulk Deal**:
   - Proposed Price: `950 RWF` per kg.
   - Quantity: `50 kg`.
   - Message: `Requesting bulk restaurant discount.`
3. Click **Send Offer**.
4. Log in as Farmer (`jeanpaul.farmer@harvesthill.test`).
5. Navigate to **Negotiations** (`/farmer?view=negotiations`).
6. Open active thread → Click **Accept Offer**.
7. **Validation Check**: Status updates to `accepted`.

---

## 11. Test Suite 8: Client Cart, Checkout & User-Scoped Privacy Isolation

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

## 12. Test Suite 9: Order Fulfillment, Delivery Note PDF & Auto Inventory Subtraction

*(Requirement: Delivery note lists product names, quantity, unit price, total price, total cost, signature, PDF view and download.)*

1. Log in as Admin (`admin@harvesthill.test` / `adminpass123`).
2. Navigate to Orders Management (`/admin?tab=orders`).
3. Locate Client A's order for `Organic Roma Tomatoes` (`30 kg`).
4. Change status from `pending` to **`Delivered`**.
5. Navigate to Delivery Notes (`/admin?tab=deliveries`).
6. Click **View Delivery Note PDF** on the order delivery note.
7. **Delivery Note PDF Validation**:
   - **Product Name**: `Organic Roma Tomatoes`
   - **Quantity**: `30 kg`
   - **Unit Price**: `RWF 1,000`
   - **Total Price**: `RWF 30,000`
   - **Total Cost**: `RWF 30,000` (Displayed at bottom of table)
   - **Signature**: Digital / Issued signature displayed clearly at bottom right.
8. Click **Print / Export PDF** to trigger browser print dialog for download.
9. Navigate to Supplies Management (`/admin?tab=supplies`).

**Expected Result**:
- Supply inventory automatically deducts from `200 kg` to `170 kg`.

---

## 13. Test Suite 10: Settings, Avatars & Real-Time Profile Sync

1. Open Farmer Profile & Settings (`/farmer?view=settings`).
2. Upload a new profile picture.
3. **Real-Time Sync Check**: TopBar header avatar updates instantly without needing page reloads.
4. Select Payout Method `MTN MoMo` and enter account number.
5. Save settings and refresh browser (`F5`) to confirm persistence.

---

## 14. Quick Sanity Verification Checklist

```
UNIFIED SIGNUP & PRIVACY
[ ] Unified /signup page with 🛒 Client vs 🌾 Farmer role toggle buttons
[ ] Farmer registration via /signup succeeds cleanly without 400 error
[ ] Database baseline reset cleanly with master admin@harvesthill.test
[ ] Cart storage is user-scoped (cart_items_role_email)

GUEST REDIRECTIONS
[ ] Unauthenticated Add to Cart clicks redirect to /login?redirect=cart
[ ] Unauthenticated Price Negotiation clicks redirect to /login?redirect=cart

SUPPLY APPROVAL WORKFLOWS
[ ] Harvest Hill Delivery direct harvest submissions are auto-accepted & immediate
[ ] Farmer added products require Harvest Hill Delivery approval before public visibility
[ ] Public catalog displays all approved Harvest Hill & Farmer products

MARKET NEED SOURCING
[ ] Request Unlisted Product button & modal functional in Client Catalog

DELIVERY NOTES & PDF EXPORT
[ ] Delivery Note lists Product Name, Quantity, Unit Price, Total Price for each item
[ ] Total Cost for all listed products displayed in table footer
[ ] Issued / Recipient signature applied to Delivery Note
[ ] Print / Export PDF button triggers clean browser PDF print view
```

---

*Last Updated: 2026-08-01*
