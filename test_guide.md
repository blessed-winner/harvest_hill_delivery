# 🌾 Harvest Hill Delivery — Complete End-to-End Test Guide

> **An exhaustive, step-by-step test guide for validating all user journeys, portal workflows, inventory deductions, available stock limits, B2B harvest submissions, privacy scoping, Harvest Hill negotiation & master stock aggregation (e.g. 30kg + 60kg = 90kg), minimal Admin product cards, Admin discount delegation, mandatory transport fee & tax assessment before order approval, 100% RWF transactions, user-scoped privacy isolation, real-time notifications, guest login redirections, client product requests, custom crop proposals, multi-image galleries, and session locks starting from a clean database containing ONLY the superuser admin.**

---

## 📑 Table of Contents

- [1. System Architecture & Prerequisites](#1-system-architecture--prerequisites)
- [2. Clean Database Baseline & Admin Credentials](#2-clean-database-baseline--admin-credentials)
- [3. Complete End-to-End Walkthrough Flow](#3-complete-end-to-end-walkthrough-flow)
- [4. Test Suite 1: Admin Initial Login & Clean State Verification](#4-test-suite-1-admin-initial-login--clean-state-verification)
- [5. Test Suite 2: Unified Role Registration (Client vs Farmer Toggle)](#5-test-suite-2-unified-role-registration-client-vs-farmer-toggle)
- [6. Test Suite 3: Admin Master Crop Catalog & Direct Harvest Submission](#6-test-suite-3-admin-master-crop-catalog--direct-harvest-submission)
- [7. Test Suite 4: Minimal Admin Product Catalog UI & Market Demand Toggle](#7-test-suite-4-minimal-admin-product-catalog-ui--market-demand-toggle)
- [8. Test Suite 5: B2B Farmer Harvest Submission, Proof Photos & Privacy Scoping](#8-test-suite-5-b2b-farmer-harvest-submission-proof-photos--privacy-scoping)
- [9. Test Suite 6: Harvest Hill B2B Negotiation & Automated Stock Aggregation (30kg + 60kg = 90kg)](#9-test-suite-6-harvest-hill-b2b-negotiation--automated-stock-aggregation-30kg--60kg--90kg)
- [10. Test Suite 7: Master Product Sourcing & Negotiation History Audit Log](#10-test-suite-7-master-product-sourcing--negotiation-history-audit-log)
- [11. Test Suite 8: Admin Special Fresh Discount Delegation (🏷️ Delegate Discount)](#11-test-suite-8-admin-special-fresh-discount-delegation-️-delegate-discount)
- [12. Test Suite 9: Unlisted Product Sourcing (Client Product Requests)](#12-test-suite-9-unlisted-product-sourcing-client-product-requests)
- [13. Test Suite 10: Free-Form Harvest Submissions (Custom Crop Proposals)](#13-test-suite-10-free-form-harvest-submissions-custom-crop-proposals)
- [14. Test Suite 11: Single-Product Grouped Catalog & Available Stock Caps](#14-test-suite-11-single-product-grouped-catalog--available-stock-caps)
- [15. Test Suite 12: Price Counter-Proposals & Negotiation Threads](#15-test-suite-12-price-counter-proposals--negotiation-threads)
- [16. Test Suite 13: Mandatory Transport Fee & Tax Assessment Before Order Approval](#16-test-suite-13-mandatory-transport-fee--tax-assessment-before-order-approval)
- [17. Test Suite 14: Client Itemized Payment Breakdown](#17-test-suite-14-client-itemized-payment-breakdown)
- [18. Test Suite 15: Order Fulfillment, Delivery Note PDF & Automatic Stock Deduction](#18-test-suite-15-order-fulfillment-delivery-note-pdf--automatic-stock-deduction)
- [19. Test Suite 16: Guest Redirections, Farmer Anonymity Toggle & User-Scoped Cart Isolation](#19-test-suite-16-guest-redirections-farmer-anonymity-toggle--user-scoped-cart-isolation)
- [20. Test Suite 17: Portal Security & Session Locks](#20-test-suite-17-portal-security--session-locks)
- [21. Quick Sanity Verification Checklist](#21-quick-sanity-verification-checklist)

---

## 1. System Architecture & Prerequisites

Verify that backend and frontend services are running cleanly.

### Environment Commands

```bash
# Terminal 1 — Backend REST Server
cd backend
.\venv\Scripts\Activate.ps1   # Windows PowerShell
python manage.py runserver    # → http://localhost:8000

# Terminal 2 — Frontend Dev Server (Next.js)
cd frontend
npm run dev                   # → http://localhost:3000
```

---

## 2. Clean Database Baseline & Admin Credentials

The database has been wiped completely clean. Only the master administrator account exists:

* **Role**: Admin / Harvest Hill Delivery Sourcing Head
* **Email**: `admin@harvesthill.test`
* **Password**: `adminpass123`

---

## 3. Complete End-to-End Walkthrough Flow

```
[1. Admin Logs In @ /login]
       ↓ (Sees clean empty dashboard & zeroed KPI metrics)
[2. Unified Registration @ /signup] 
       ↓ (Registers Farmer A, Farmer B, and Client accounts cleanly)
[3. Admin Creates Product Template @ /admin?tab=products] 
       ↓ (Creates "Potatoes" master crop & submits direct harvest)
[4. Farmer A & B Submit B2B Harvests @ /farmer?view=submit] 
       ↓ (Farmer A submits 40kg, Farmer B submits 60kg with private proof photo & private_admin scope)
[5. Harvest Hill B2B Price Negotiation & Stock Aggregation @ /admin?tab=supplies] 
       ↓ (Harvest Hill accepts 30kg from Farmer A & 60kg from Farmer B → Master stock = 90kg)
[6. Admin Fresh Discount Delegation @ /admin?tab=products] 
       ↓ (Clicks 🏷️ Delegate Discount to set 700 RWF offer price → Live on Deals section)
[7. Client Requests Unlisted Product @ /client?screen=dashboard] 
       ↓ (Client submits product request → Admin approves request & creates template)
[8. Client Browses & Places Order @ /client?screen=catalog] 
       ↓ (Cap enforced at 90kg; places order for 30kg)
[9. Admin Fee Assessment & Order Approval @ /admin?tab=orders] 
       ↓ (Admin enters Transport Fee + Tax → Order approved)
[10. Order Fulfillment & Delivery Note PDF]
       ↓ (Admin delivers order → Stock deducts to 60kg → Delivery Note PDF issued)
```

---

## 4. Test Suite 1: Admin Initial Login & Clean State Verification

1. Open browser to `http://localhost:3000/login`.
2. Enter Credentials:
   - **Email**: `admin@harvesthill.test`
   - **Password**: `adminpass123`
3. Click **Sign In**.
4. Inspect Admin Overview (`/admin?tab=overview`):
   - **KPI Check**: Active Orders (`0`), Deliveries (`0`), Revenue (`RWF 0`), Approvals (`0`), Clients (`0`).
   - **Needs Attention**: Displays `"All caught up! No items require urgent attention."`

---

## 5. Test Suite 2: Unified Role Registration (Client vs Farmer Toggle)

1. Open browser to `http://localhost:3000/signup`.
2. **Role Selection Check**:
   - Verify top toggle switch renders **🛒 Client / Buyer** and **🌾 Farmer / Supplier**.
3. **Register Farmer A Account**:
   - Click **🌾 Farmer / Supplier**.
   - **Full Name**: `Jean-Paul Hakizimana (Farmer A)`
   - **Username**: `farmer_a`
   - **Email**: `farmer_a@harvesthill.test`
   - **Phone**: Select Country (`🇷🇼 +250`), enter `788 111 222`.
   - **Password**: `FarmerPass2026!`.
   - Click **Register as Supplier**.
4. **Register Farmer B Account**:
   - Click **🌾 Farmer / Supplier**.
   - **Full Name**: `Emmanuel Nshimiyimana (Farmer B)`
   - **Username**: `farmer_b`
   - **Email**: `farmer_b@harvesthill.test`
   - **Phone**: Select Country (`🇷🇼 +250`), enter `788 333 444`.
   - **Password**: `FarmerPass2026!`.
   - Click **Register as Supplier**.
5. **Register Client / Buyer Account**:
   - Click **🛒 Client / Buyer**.
   - **Full Name**: `Alice Murekatete`
   - **Username**: `alice_buyer`
   - **Email**: `alice.client@harvesthill.test`
   - **Phone**: Select Country (`🇷🇼 +250`), enter `788 555 666`.
   - **Password**: `ClientPass2026!`.
   - Click **Register as Client**.

---

## 6. Test Suite 3: Admin Master Crop Catalog & Direct Harvest Submission

1. Log in as Admin (`admin@harvesthill.test` / `adminpass123`).
2. Open Admin Product Management (`/admin?tab=products`).
3. Click **+ Add Product**:
   - **Name**: `Musanze Sweet Irish Potatoes`
   - **Category**: `Vegetables`
   - **Base Price**: `950 RWF`
   - **Unit**: `kg`
   - **Quantity Needed**: `500`
   - Click **Save Product**.
4. On the newly created card, click **🌾 Harvest**:
   - **Quantity**: `100 kg`
   - **Asking Price**: `750 RWF`
   - Click **Record Harvest Batch**.
5. **Immediate Public Visibility Check**:
   - Open homepage (`http://localhost:3000/`) or guest catalog.
   - **Validation Check**: Harvest Hill direct submission is auto-accepted (`status='accepted'`) and immediately visible to clients and the public.

---

## 7. Test Suite 4: Minimal Admin Product Catalog UI & Market Demand Toggle

1. Open Admin Product Catalog (`/admin?tab=products`).
2. **Minimal Card Design Check**:
   - **Image Container**: Aspect ratio `aspect-[4/3]`, subtle rounded corners (`rounded-xl`), floating Category pill at top-left.
   - **Metadata & Prices**: Clean `Base Price` and `Live Stock` row with readable font hierarchy.
   - **Action Buttons Bar**: Balanced 3-column action bar (`🤝 Audit`, `🏷️ Discount`, `🌾 Harvest`).
3. **Toggle Market Demand**:
   - Click the bottom-left `Needed` / `Normal` pill button on the product image.
   - **Validation Check**: Market demand status updates instantly with a pulsing green dot when needed.

---

## 8. Test Suite 5: B2B Farmer Harvest Submission, Proof Photos & Privacy Scoping

1. Log in as **Farmer A** (`farmer_a@harvesthill.test` / `FarmerPass2026!`).
2. Navigate to **Submit Harvest** (`/farmer?view=submit`).
3. Submit Harvest for **Farmer A**:
   - Select `Musanze Sweet Irish Potatoes`.
   - **Quantity**: `40 kg`.
   - **Asking Price**: `700 RWF / kg`.
   - **Visibility Scope**: Select **Harvest Hill Delivery Only (`private_admin`)**.
   - **Proof Photo**: Upload proof photo of real harvest.
   - Click **Submit Harvest**.
4. Log in as **Farmer B** (`farmer_b@harvesthill.test` / `FarmerPass2026!`).
5. Submit Harvest for **Farmer B**:
   - Select `Musanze Sweet Irish Potatoes`.
   - **Quantity**: `60 kg`.
   - **Asking Price**: `750 RWF / kg`.
   - **Visibility Scope**: Select **Harvest Hill Delivery Only (`private_admin`)**.
   - **Proof Photo**: Upload proof photo of real harvest.
   - Click **Submit Harvest**.
6. **Privacy Isolation Verification**:
   - Open client catalog (`http://localhost:3000/`).
   - **Validation Check**: Raw farmer submissions and proof photos are **NOT visible** to clients or the public. Photos remain private to Harvest Hill Delivery for negotiation audit.

---

## 9. Test Suite 6: Harvest Hill B2B Negotiation & Automated Stock Aggregation (30kg + 60kg = 90kg)

1. Log in as Admin (`admin@harvesthill.test` / `adminpass123`).
2. Open **Supplies Management** (`/admin?tab=supplies`).
3. **Negotiate with Farmer A**:
   - Select Farmer A's proposal for `Potatoes` (`40 kg` submitted).
   - Set **Accepted Quantity**: `30 kg` (Harvest Hill decides to accept 30 kg out of 40 kg).
   - Set **Agreed Price**: `700 RWF`.
   - Click **Confirm Terms & Accept into Master Stock**.
4. **Negotiate with Farmer B**:
   - Select Farmer B's proposal for `Potatoes` (`60 kg` submitted).
   - Set **Accepted Quantity**: `60 kg`.
   - Set **Agreed Price**: `720 RWF`.
   - Click **Confirm Terms & Accept into Master Stock**.
5. **Automated Stock Aggregation Check**:
   - Open Admin Product Catalog (`/admin?tab=products`) or Client Catalog (`/client?screen=catalog`).
   - Locate `Musanze Sweet Irish Potatoes`.
   - **Validation Check**: **Live Stock** automatically displays **`190 kg`** (`100 kg admin + 30 kg Farmer A + 60 kg Farmer B = 190 kg`)!

---

## 10. Test Suite 7: Master Product Sourcing & Negotiation History Audit Log

1. Log in as Admin (`admin@harvesthill.test` / `adminpass123`).
2. Open Product Catalog (`/admin?tab=products`).
3. Click **🤝 Audit** on the `Musanze Sweet Irish Potatoes` card.
4. **Sourcing & Negotiation Drawer Verification**:
   - **Farmer A Entry**: Displays `Farmer A`, `30 kg agreed` (`40 kg submitted`), Agreed Price `700 RWF`, `private_admin` scope, and private proof photo thumbnail.
   - **Farmer B Entry**: Displays `Farmer B`, `60 kg agreed`, Agreed Price `720 RWF`, `private_admin` scope, and private proof photo thumbnail.

---

## 11. Test Suite 8: Admin Special Fresh Discount Delegation (🏷️ Delegate Discount)

1. Log in as Admin (`admin@harvesthill.test` / `adminpass123`).
2. Open Product Catalog (`/admin?tab=products`).
3. Click **🏷️ Discount** on the `Musanze Sweet Irish Potatoes` card.
4. **Delegate Discount Modal Check**:
   - Toggle **Enable Fresh Deals Discount** to ON.
   - Enter **Discounted Offer Price**: `700 RWF` (per kg).
   - Notice displays: `✓ Save 26% off standard base price!`.
   - Click **Save Discount Offer**.
5. **Client Landing Page & Catalog Check**:
   - Open homepage (`http://localhost:3000/`).
   - **Validation Check**: Product appears under **Fresh Deals / Seasonal Discounts** with a **Save 26%** badge and strikethrough original price (`RWF 950`).

---

## 12. Test Suite 9: Unlisted Product Sourcing (Client Product Requests)

1. Log in as Client (`alice.client@harvesthill.test` / `ClientPass2026!`).
2. Go to Profile Settings → **My Product Requests** tab.
3. Click **New Request**:
   - **Product Name**: `Yellow Passion Fruits`
   - **Category**: `Fruits`
   - **Quantity Needed**: `120 kg`
   - **Preferred Price**: `1500 RWF`
   - Click **Submit Request**.
4. Log in as Admin (`admin@harvesthill.test` / `adminpass123`).
5. Go to Catalog (`/admin?tab=products`) → **Client Requests** tab.
   - Click **Approve** on the request.
   - Click **Create Template**: Pre-fills drawer with product name, category, unit, quantity, and preferred price! Upload photo and save.
6. Log in as Farmer (`farmer_a@harvesthill.test`).
7. Open **Client Requests** tab → Click **Supply This Demand** to submit harvest against requested market need.

---

## 13. Test Suite 10: Free-Form Harvest Submissions (Custom Crop Proposals)

1. Log in as Farmer (`farmer_a@harvesthill.test`).
2. Go to **Submit Harvest** (`/farmer?view=submit`).
3. Click **Submit Custom Crop** card:
   - **Crop Name**: `Red Gala Apples`
   - **Category**: `Fruits`
   - **Quantity**: `150 kg`
   - **Asking Price**: `1800 RWF / kg`
   - Click **Submit Harvest**.
4. Log in as Admin (`admin@harvesthill.test`).
5. Open Supplies Manager (`/admin?tab=supplies`):
   - Notice warning banner: `⚠ Custom Crop Proposal: This crop is not currently in the product catalog.`
   - Click **Accept Proposal** to create template and accept into catalog.

---

## 14. Test Suite 11: Single-Product Grouped Catalog & Available Stock Caps

1. Log in as Client (`alice.client@harvesthill.test`).
2. Open Catalog (`/client?screen=catalog`).
   - **Validation Check**: Each master product appears **only ONCE** with unified master price and total aggregated stock.
3. Open Product Detail for `Musanze Sweet Irish Potatoes` (Available Live Stock: `190 kg`).
4. **Quantity Input Cap Test**:
   - Type `250` in quantity field.
   - **Validation Check**: System caps quantity at `190 kg` and alerts user.

---

## 15. Test Suite 12: Price Counter-Proposals & Negotiation Threads

1. Log in as Client (`alice.client@harvesthill.test`).
2. Open Product Detail for `Musanze Sweet Irish Potatoes`.
3. Click **Propose Price Negotiation / Bulk Deal**:
   - Proposed Price: `650 RWF` per kg.
   - Quantity: `50 kg`.
   - Click **Send Offer**.
4. Log in as Farmer or Admin → Open **Negotiations** tab → Counter-propose or click **Accept Offer**.

---

## 16. Test Suite 13: Mandatory Transport Fee & Tax Assessment Before Order Approval

1. Log in as Client (`alice.client@harvesthill.test`).
2. Add `30 kg` of `Musanze Sweet Irish Potatoes` to Cart → Proceed to Checkout.
3. Enter Delivery Address (`124 KG 7 Ave, Remera, Kigali`) and place order.
4. Log in as Admin (`admin@harvesthill.test` / `adminpass123`).
5. Open Orders Management (`/admin?tab=orders`).
6. **Unassessed Approval Attempt Check**:
   - Attempt to change order status to `Processing` or `Approved`.
   - **Validation Check**: Status update is **BLOCKED**. Toast displays: `Order cannot be approved yet. Transport fee and tax amount must be determined first.`
7. **Complete Fee Assessment & Approval**:
   - In Order Assessment Drawer:
     - Enter **Transport / Logistics Fee**: `3,500 RWF`.
     - Enter **Tax Amount**: `1,500 RWF`.
     - Click **Approve Order & Attach Assessment**.
   - **Validation Check**: Order transitions to `Processing` / `Approved` cleanly.

---

## 17. Test Suite 14: Client Itemized Payment Breakdown

1. Log in as Client (`alice.client@harvesthill.test`).
2. Open Order History (`/client?screen=order-history`).
3. Click on the assessed order:
   - **Itemized Payment Breakdown Check**:
     - **Items Subtotal**: `21,000 RWF` (30 kg @ 700 RWF)
     - **Transport / Logistics Fee**: `3,500 RWF`
     - **Tax Amount**: `1,500 RWF`
     - **Total Payment Amount**: **`26,000 RWF`**

---

## 18. Test Suite 15: Order Fulfillment, Delivery Note PDF & Automatic Stock Deduction

1. Log in as Admin (`admin@harvesthill.test` / `adminpass123`).
2. Change order status to **`Delivered`**.
3. Open Delivery Notes (`/admin?tab=deliveries`) → Click **View Delivery Note PDF**.
4. **Delivery Note PDF Check**:
   - Lists Product Name, Quantity (`30 kg`), Unit Price (`RWF 700`), Total Cost (`RWF 21,000`), Transport Fee, Tax, Total Payment, and Issued Signature.
   - Click **Print / Export PDF** to trigger browser print view.
5. Open Admin Catalog (`/admin?tab=products`).
   - **Validation Check**: Live Stock automatically deducts from `190 kg` to `160 kg` (`190 - 30 = 160 kg`).

---

## 19. Test Suite 16: Guest Redirections, Farmer Anonymity Toggle & User-Scoped Cart Isolation

1. **Guest Redirection**:
   - Open `http://localhost:3000/` as an unauthenticated guest.
   - Click **Add to Cart** or **Negotiate Price** on any product.
   - **Validation Check**: Automatically redirected to `/login?redirect=cart`.
2. **Farmer Anonymity Toggle**:
   - Log in as Admin (`admin@harvesthill.test`) → Open Supplies (`/admin?tab=supplies`).
   - Toggle **🔒 Client Privacy: Farmer Names Hidden**.
   - Verify client portal displays supplier as `Harvest Hill Delivery` by default, or reveals farm name when toggled ON.
3. **User-Scoped Cart Isolation**:
   - Client A's cart items are saved strictly under user-scoped storage key (`cart_items_client_alice.client@harvesthill.test`) and never leak to Client B.

---

## 20. Test Suite 17: Portal Security & Session Locks

1. Log in as Client (`alice.client@harvesthill.test`).
2. Verify you are redirected to `/client`.
3. Click browser **Back Button**:
   - **Validation Check**: Portal locks navigation back to landing page and maintains active session.
4. Click **Sign Out**:
   - **Validation Check**: Local storage tokens are cleared, and page redirects cleanly to public homepage `/`.

---

## 21. Quick Sanity Verification Checklist

```
CLEAN BASELINE & REGISTRATION
[ ] Database baseline wiped clean with superuser admin@harvesthill.test only
[ ] /signup role toggle switch allows registering Farmer vs Client accounts cleanly

ADMIN CATALOG & MINIMAL CARDS
[ ] Master products display minimal aspect-[4/3] cards with category pill & base price / stock bar
[ ] Needed / Normal market demand pill button toggles requirement status instantly
[ ] 🤝 Audit button opens complete sourcing & negotiation history drawer
[ ] 🏷️ Delegate Discount opens Admin modal to set/delegate Fresh Deals discount prices

B2B HARVEST NEGOTIATION & STOCK AGGREGATION
[ ] Farmers submit harvests with proof photos & private_admin scope (photos hidden from clients)
[ ] Harvest Hill Admin negotiates price & accepted qty (e.g., 30kg out of 40kg)
[ ] Live stock automatically sums accepted farmer batches (e.g. 100kg admin + 30kg + 60kg = 190kg)

ORDER FEE ASSESSMENT & FULFILLMENT
[ ] Admin cannot approve orders without entering Transport Fee and Tax Amount (> 0)
[ ] Client Order History displays itemized subtotal + transport fee + tax = total payment
[ ] Fulfilling order to Delivered auto-deducts master stock (190kg -> 160kg)
[ ] Delivery Note PDF lists itemized breakdown, total cost, and digital signature
```

---

*Last Updated: 2026-08-17*
