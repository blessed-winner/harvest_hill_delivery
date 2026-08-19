# 🌾 Harvest Hill Delivery — Complete End-to-End Test Guide

> **An exhaustive, step-by-step test guide for validating all user journeys, portal workflows, Product Requirement templates vs. Farmer Harvest Submissions, auto-closure of expired requirements, text-driven requirement spec cards (no images on templates), zero-quantity/price guards, compact filter bar dropdowns, side-by-side requirement comparison panes, live stock quantity tracking, B2B harvest submissions, sequential supply tracking (`SUP-000001`), aspect-square multi-photo management grids with Cloudinary deletion, mutual B2B negotiation with dual action controls (`Counter` vs `Accept`), mandatory transport fee & tax assessment before order approval, 100% RWF transactions, user-scoped privacy isolation, real-time notifications, guest login redirections, client product requests, and session locks starting from a clean database containing ONLY the superuser admin.**

---

## 📑 Table of Contents

- [1. System Architecture & Prerequisites](#1-system-architecture--prerequisites)
- [2. Clean Database Baseline & Admin Credentials](#2-clean-database-baseline--admin-credentials)
- [3. Complete End-to-End Walkthrough Flow](#3-complete-end-to-end-walkthrough-flow)
- [4. Test Suite 1: Admin Initial Login & Clean State Verification](#4-test-suite-1-admin-initial-login--clean-state-verification)
- [5. Test Suite 2: Unified Role Registration (Client vs Farmer Toggle)](#5-test-suite-2-unified-role-registration-client-vs-farmer-toggle)
- [6. Test Suite 3: Product Template / Requirement Creation & Zero Guard](#6-test-suite-3-product-template--requirement-creation--zero-guard)
- [7. Test Suite 4: Compact Filter Bar & Aesthetic Requirement Form Redesign](#7-test-suite-4-compact-filter-bar--aesthetic-requirement-form-redesign)
- [8. Test Suite 5: Single Entry Point Farmer Requirement Discovery & Harvest Submission](#8-test-suite-5-single-entry-point-farmer-requirement-discovery--harvest-submission)
- [9. Test Suite 6: Multi-Photo Proof Grid & SUP-000001 Sequential Tracking](#9-test-suite-6-multi-photo-proof-grid--sup-000001-sequential-tracking)
- [10. Test Suite 7: Contextual Negotiation System (Farmer & Admin Modes)](#10-test-suite-7-contextual-negotiation-system-farmer--admin-modes)
- [11. Test Suite 8: Requirement vs. Harvest Submission Comparison & Column Separation](#11-test-suite-8-requirement-vs-harvest-submission-comparison--column-separation)
- [12. Test Suite 9: Protected Requirement Deletion & Auto-Closure on Deadline Expiry](#12-test-suite-9-protected-requirement-deletion--auto-closure-on-deadline-expiry)
- [13. Test Suite 10: Farmer Dashboard "Products Currently Needed" Text-Driven Spec Cards](#13-test-suite-10-farmer-dashboard-products-currently-needed-text-driven-spec-cards)
- [14. Test Suite 11: Landing Page Approved Harvest Display & Dynamic Live Stock](#14-test-suite-11-landing-page-approved-harvest-display--dynamic-live-stock)
- [15. Test Suite 12: Admin Special Fresh Discount Delegation (🏷️ Delegate Discount)](#15-test-suite-12-admin-special-fresh-discount-delegation-️-delegate-discount)
- [16. Test Suite 13: Unlisted Product Sourcing (Client Product Requests)](#16-test-suite-13-unlisted-product-sourcing-client-product-requests)
- [17. Test Suite 14: Free-Form Harvest Submissions (Custom Crop Proposals)](#17-test-suite-14-free-form-harvest-submissions-custom-crop-proposals)
- [18. Test Suite 15: Mandatory Transport Fee & Tax Assessment Before Order Approval](#18-test-suite-15-mandatory-transport-fee--tax-assessment-before-order-approval)
- [19. Test Suite 16: Client Itemized Payment Breakdown & Order Fulfillment (PDF Delivery Note)](#19-test-suite-16-client-itemized-payment-breakdown--order-fulfillment-pdf-delivery-note)
- [20. Test Suite 17: Guest Redirections, Farmer Anonymity & Session Locks](#20-test-suite-17-guest-redirections-farmer-anonymity--session-locks)
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

# Terminal 2 — Frontend Dev Server (Vite / React)
cd frontend
npm run dev                   # → http://localhost:3000
```

---

## 2. Clean Database Baseline & Admin Credentials

The database baseline contains the master administrator account:

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
[3. Admin Creates Product Requirement Template @ /admin?tab=products] 
       ↓ (Creates "Musanze Sweet Irish Potatoes" requirement template — No images, specs & reference price set)
[4. Farmer Discovers Requirement & Submits Harvest @ /farmer?view=submit] 
       ↓ (Farmer A submits 40kg harvest offer with proof photos via single "Submit Harvest" section)
[5. Admin Compares Requirement vs. Harvest Offer & Negotiates @ /admin?tab=supplies] 
       ↓ (Side-by-side vertical divider comparison; counter-offers 720 RWF/kg → Agreement Reached)
[6. Approved Harvest Appears on Landing Page @ /] 
       ↓ (Renders actual live stock e.g. "40 kg live stock"; template requirements never show on landing)
[7. Expired Requirements Auto-Close & Protected Deletion] 
       ↓ (Passed deadline auto-closes requirement; deletion blocked if active harvest submissions exist)
[8. Client Browses & Places Order @ /client?screen=catalog] 
       ↓ (Places order for 30kg of approved harvest offer)
[9. Admin Fee Assessment & Order Approval @ /admin?tab=orders] 
       ↓ (Admin enters Transport Fee + Tax → Order approved & itemized breakdown generated)
[10. Order Fulfillment & Delivery Note PDF]
       ↓ (Admin delivers order → Live stock deducts to 10kg → Delivery Note PDF issued)
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

## 6. Test Suite 3: Product Template / Requirement Creation & Zero Guard

1. Log in as Admin (`admin@harvesthill.test` / `adminpass123`).
2. Open Product Requirement Manager (`/admin?tab=products`).
3. Click **+ Create Requirement**.
4. **No Image Check**: Verify the Product Requirement drawer does **NOT** contain an image upload field or image slot.
5. **Zero Quantity Guard Test**:
   - Enter `0` in **Quantity Needed**.
   - **Validation Check**: Input displays red border, inline warning text `"Quantity needed must be greater than 0."`, and `min="1"` attribute blocks zero submission.
6. **Complete Requirement Creation**:
   - **Product Name**: `Musanze Sweet Irish Potatoes`
   - **Category**: `Vegetables`
   - **Quantity Needed**: `500`
   - **Unit**: `kg`
   - **Target Reference Price**: `750 RWF`
   - **Submission Deadline**: Select a future date (e.g. 14 days from today).
   - **Preferred Harvest Period**: `Mid-August 2026`
   - **Quality Requirements**: `"Grade A tubers, dry-cleaned, size 50mm+, zero pest damage, packed in 50kg breathable mesh bags."`
   - **Requirement Description**: `"Harvest Hill is looking for premium Irish Potatoes to supply hotel and restaurant partners in Kigali."`
   - Click **Save Product Requirement**.

---

## 7. Test Suite 4: Compact Filter Bar & Aesthetic Requirement Form Redesign

1. Open Admin Product Catalog (`/admin?tab=products`).
2. **Compact Filter Bar Check**:
   - **Status Dropdown Placement**: Verify the status filter is a compact `<select>` dropdown (`Status: All`, `Status: Open`, `Status: Draft`, `Status: Closed`, `Status: Archived`) positioned inside the category bar right before category tabs (`All`, `Vegetables`, `Fruits`, etc.).
   - **No Emojis & Small Font**: Options contain clean text without emoji dots (`🟢`, `🟡`), formatted with `text-[10.5px] font-bold`.
   - **"All" Category Button**: Category reset button is cleanly titled `"All"` (not `"All Requirements"`).
3. **Aesthetic Form Drawer Verification**:
   - Open drawer form $\rightarrow$ Drawer header reads `"New Product Requirement"` / `"Edit Product Requirement"` with clean subtitle `"Specify crop demand specs, target reference price, and submission deadline for local farmers."`
   - Form fields organized into 4 card-structured sections with icon titles:
     1. `1. Basic Specifications`
     2. `2. Volume & Target Reference Price`
     3. `3. Lifecycle & Timeline`
     4. `4. Quality Standards & Details`
   - **Unbiased Quality Field**: Quality Requirements textarea opens empty without forced default text and features a neutral background placeholder (`"Describe specific quality standards, grading criteria, or packaging requirements for this crop..."`).

---

## 8. Test Suite 5: Single Entry Point Farmer Requirement Discovery & Harvest Submission

1. Log in as **Farmer A** (`farmer_a@harvesthill.test` / `FarmerPass2026!`).
2. Navigate to **Submit Harvest** (`/farmer?view=submit`).
3. **Single Entry Point Verification**:
   - Verify there is **NO** separate "Available Opportunities" section. All active requirement opportunities appear in the existing **Submit Harvest** grid as text-driven spec cards (no placeholder images).
4. **Text-Driven Spec Card Verification**:
   - Inspect requirement card for `Musanze Sweet Irish Potatoes`:
     - Displays Category tag (`Vegetables`), Quantity Needed (`500 kg`), Reference Price (`RWF 750/kg`), and Submit By deadline.
5. **Submit Harvest Offer**:
   - Click card for `Musanze Sweet Irish Potatoes`.
   - **Quantity Available**: `40 kg`.
   - **Asking Price**: `700 RWF / kg`.
   - **Harvest Date**: Today's date.
   - **Quality Grade**: `Premium (Grade A)`.
   - **Proof Photos**: Upload 2 photos of harvested potatoes.
   - Click **Submit Harvest Offer**.

---

## 9. Test Suite 6: Multi-Photo Proof Grid & SUP-000001 Sequential Tracking

1. Log in as **Farmer A** (`farmer_a@harvesthill.test`).
2. Open **My Supplies** (`/farmer?view=supplies`).
3. **Sequential Identifier Verification**:
   - **Validation Check**: Harvest offer displays human-readable tracking number **`SUP-000001`** (never raw internal UUIDs).
4. Submit Harvest for **Farmer B** (`farmer_b@harvesthill.test`):
   - Submit offer for `Musanze Sweet Irish Potatoes` (`60 kg` @ `720 RWF / kg`).
   - **Validation Check**: Displays **`SUP-000002`**.
5. **Multi-Photo Management Check**:
   - Click **Edit** on a pending harvest.
   - Photos display in an aspect-square preview grid. Hovering over a photo displays a delete button (`<X />` / `<Trash2 />`) to remove photos individually.

---

## 10. Test Suite 7: Contextual Negotiation System (Admin Initiation & Farmer Response)

1. **Admin Initiates Negotiation & Sends Terms**:
   - Log in as Admin (`admin@harvesthill.test` / `adminpass123`).
   - Open **Supplies Management** (`/admin?tab=supplies`).
   - Click pending submission `SUP-000001` (`40 kg` @ `700 RWF / kg`) to open Detail Drawer.
   - Under **Negotiate Terms & Aggregate Inventory**:
     - Enter **Agreed Accepted Qty**: `35 kg`.
     - Enter **Agreed Farmer Price**: `720 RWF`.
     - Enter **Optional Custom Terms / Notes**: `"Pickup at Musanze collection center on Friday"`.
   - Click **Counter** to send counter-proposal terms to the farmer.
2. **Real-Time Notification & Farmer Drawer Activation**:
   - **Validation Check**: System dispatches a real-time notification to Farmer A (`"Negotiation Started for SUP-000001: Harvest Hill admin sent negotiation terms"`).
   - Log in as **Farmer A** (`farmer_a@harvesthill.test` / `FarmerPass2026!`).
   - Open **My Supplies** (`/farmer?view=supplies`) or click the negotiation notification bell.
   - **Validation Check**: `SUP-000001` displays active negotiation badge (`has_admin_negotiation`). Click **[Negotiate]** to open negotiation drawer.
3. **Farmer Counter Offer or Acceptance Flow**:
   - Farmer A inspects Admin's proposed terms (`35 kg` @ `720 RWF / kg` + `"Pickup at Musanze collection center on Friday"`).
   - **Option A (Accept)**: Farmer clicks **Accept** $\rightarrow$ Confirmation dialog triggers $\rightarrow$ Pane displays green **`✓ AGREEMENT REACHED`** summary banner (Qty `35 kg`, Price `RWF 720/kg`, Total `RWF 25,200`), locks further price edits, and aggregates accepted stock!
   - **Option B (Counter)**: Farmer adjusts price to `715 RWF` and clicks **Counter** to send a counter-proposal.

---

## 11. Test Suite 8: Requirement vs. Harvest Submission Comparison & Column Separation

1. Log in as Admin (`admin@harvesthill.test`).
2. Open Supplies Management (`/admin?tab=supplies`).
3. Click on submission `SUP-000001` to open Detail Drawer.
4. **Side-by-Side Comparison Box Check**:
   - **Harvest Hill Requirement Box**:
     - Displays `Harvest Hill Requirement` header with deadline.
     - **Column Separation**: Left side (*Crop Requirement* & *Target Reference Price*) and right side (*Quantity Needed* & *Category*) are separated by a vertical divider line (`border-l border-[#E8E4DA] pl-3.5`) and `gap-x-4 gap-y-3`.
     - **Word Wrap Test**: Long requirement names (e.g. *"Musanze Sweet Irish Potatoes Special Harvest Requirement"*) wrap cleanly (`break-words`) without colliding with the right column.
     - **Template Data Sync**: Displays actual template values (`500 kg` needed, `RWF 750/kg` reference price) instead of evaluating to `0`.
   - **Farmer Harvest Offer Box**:
     - Displays farmer's submitted offer (`40 kg`, `RWF 700/kg` asking price, quality grade, harvest date, and uploaded photos).

---

## 12. Test Suite 9: Protected Requirement Deletion & Auto-Closure on Deadline Expiry

1. Log in as Admin (`admin@harvesthill.test`).
2. Open Product Catalog (`/admin?tab=products`).
3. **Protected Requirement Deletion Test**:
   - Locate `Musanze Sweet Irish Potatoes` (has active farmer submission `SUP-000001`).
   - Click **Archive / Delete** button.
   - **Validation Check**: System blocks deletion and throws validation error: *"Cannot delete requirement 'Musanze Sweet Irish Potatoes' because active farmer harvest submissions exist. Please archive the requirement instead."*
4. **Auto-Closure on Expiry Test**:
   - Edit requirement deadline to yesterday's date.
   - Refresh page or execute query.
   - **Validation Check**: Requirement status automatically transitions from `open` $\rightarrow$ `closed`.
   - Log in as Farmer A $\rightarrow$ Open **Submit Harvest**.
   - **Validation Check**: The expired requirement automatically disappears from the farmer's **Submit Harvest** section. If no other open requirements exist, empty state *"No Active Harvest Requirements"* is shown.

---

## 13. Test Suite 10: Farmer Dashboard "Products Currently Needed" Text-Driven Spec Cards

1. Log in as Farmer (`farmer_a@harvesthill.test`).
2. Open Farmer Dashboard (`/farmer?view=dashboard`).
3. Scroll to **Products currently needed** section.
4. **Text-Driven Card Check (No Images)**:
   - **Validation Check**: Requirements render as clean text-driven spec cards matching `SubmitHarvest.tsx` (Category pill, Quantity Needed, Reference Price, Submit By deadline).
   - **No Image Slots**: Contains **NO** image container (`<img />`), placeholder unsplash slots, or fallback photo boxes.

---

## 14. Test Suite 11: Landing Page Approved Harvest Display & Dynamic Live Stock

1. Open Public Landing Page (`http://localhost:3000/`).
2. **Approved Harvest Visibility**:
   - **Validation Check**: Approved farmer harvest submissions (`status='accepted'`) are displayed on the landing page for all visitors (unauthenticated guests, clients, and farmers).
   - **No Template Leakage**: Product templates (requirements) are **NEVER** displayed on the landing page. Only actual approved farmer harvest submissions are shown.
3. **Dynamic Live Stock Quantity Check**:
   - Inspect product card text under crop name.
   - **Validation Check**: Text displays exact available live stock (e.g. `40 kg live stock`) instead of static `approx. 1 kg` fallback text.

---

## 15. Test Suite 12: Admin Special Fresh Discount Delegation (🏷️ Delegate Discount)

1. Log in as Admin (`admin@harvesthill.test`).
2. Open Product Catalog (`/admin?tab=products`).
3. Click **🏷️ Discount** on an approved crop card.
4. Toggle **Enable Fresh Deals Discount** to ON $\rightarrow$ Enter **Discounted Offer Price**: `650 RWF` $\rightarrow$ Save.
5. Open Homepage (`http://localhost:3000/`) $\rightarrow$ Product appears under **Fresh Deals** with a **Save %** badge and strikethrough original price.

---

## 16. Test Suite 13: Unlisted Product Sourcing (Client Product Requests)

1. Log in as Client (`alice.client@harvesthill.test`).
2. Go to Profile Settings → **My Product Requests** tab.
3. Click **New Request**: Enter `Yellow Passion Fruits`, `Fruits`, `120 kg`, `1500 RWF` $\rightarrow$ Submit.
4. Log in as Admin $\rightarrow$ Go to Catalog (`/admin?tab=products`) → **Client Requests** tab $\rightarrow$ Click **Approve** $\rightarrow$ Click **Create Template**.
5. Admin fills template specs $\rightarrow$ Requirement becomes available for farmers to discover in **Submit Harvest**.

---

## 17. Test Suite 14: Free-Form Harvest Submissions (Custom Crop Proposals)

1. Log in as Farmer (`farmer_a@harvesthill.test`).
2. Go to **Submit Harvest** (`/farmer?view=submit`) $\rightarrow$ Click **Submit Custom Crop** card.
3. Enter `Red Gala Apples`, `Fruits`, `150 kg`, `1800 RWF / kg` $\rightarrow$ Submit.
4. Admin logs in $\rightarrow$ Opens Supplies Manager (`/admin?tab=supplies`) $\rightarrow$ Sees custom proposal badge $\rightarrow$ Accepts proposal into catalog.

---

## 18. Test Suite 15: Mandatory Transport Fee & Tax Assessment Before Order Approval

1. Log in as Client (`alice.client@harvesthill.test`).
2. Add `30 kg` of `Musanze Sweet Irish Potatoes` to Cart → Proceed to Checkout.
3. Enter Delivery Address (`124 KG 7 Ave, Remera, Kigali`) and place order.
4. Log in as Admin (`admin@harvesthill.test`).
5. Open Orders Management (`/admin?tab=orders`).
6. **Unassessed Approval Attempt Check**:
   - Attempt to change order status to `Processing` or `Approved`.
   - **Validation Check**: Action is **BLOCKED**. Toast displays: `Order cannot be approved yet. Transport fee and tax amount must be determined first.`
7. **Complete Fee Assessment**:
   - In Order Assessment Drawer: Enter **Transport Fee**: `3,500 RWF`, **Tax Amount**: `1,500 RWF` $\rightarrow$ Click **Approve Order & Attach Assessment**.
   - Order transitions cleanly to `Processing` / `Approved`.

---

## 19. Test Suite 16: Client Itemized Payment Breakdown & Order Fulfillment (PDF Delivery Note)

1. Log in as Client (`alice.client@harvesthill.test`) $\rightarrow$ Open Order History (`/client?screen=order-history`).
2. **Itemized Payment Breakdown Check**:
   - Items Subtotal: `21,300 RWF` (30 kg @ 710 RWF)
   - Transport / Logistics Fee: `3,500 RWF`
   - Tax Amount: `1,500 RWF`
   - **Total Payment Amount**: **`26,300 RWF`**
3. Log in as Admin $\rightarrow$ Update status to **`Delivered`**.
4. Open Delivery Notes (`/admin?tab=deliveries`) $\rightarrow$ Click **View Delivery Note PDF** $\rightarrow$ Print view opens with complete itemized breakdown, tax, transport fee, and digital signature.
5. Check Admin Catalog $\rightarrow$ Live stock automatically deducts (`40 kg - 30 kg = 10 kg`).

---

## 20. Test Suite 17: Guest Redirections, Farmer Anonymity & Session Locks

1. **Guest Redirection**:
   - Unauthenticated guest attempting to add items to cart is redirected to `/login?redirect=cart`.
2. **Farmer Anonymity Toggle**:
   - Admin toggle **🔒 Client Privacy: Farmer Names Hidden** hides farm names from client view (renders `Harvest Hill Delivery`).
3. **Portal Security**:
   - Authenticated role paths (`/admin`, `/farmer`, `/client`) lock back-navigation to login page during active sessions.
   - Signing out clears tokens and redirects to public homepage `/`.

---

---

## 21. Test Suite 18: Master Product Aggregation, Single Image Rule & Farmer Crop Suggestions

1. **Farmer A & Farmer B Submissions**:
   - **Farmer A** submits 40 kg of potatoes with proof photos. Harvest Hill Delivery negotiates price and agrees to take **30 kg**.
   - **Farmer B** submits 60 kg of potatoes with proof photos. Harvest Hill Delivery negotiates price and agrees to take **60 kg**.
2. **Master Product Consolidation**:
   - Harvest Hill Delivery accepts both supplies into the master product `"Potatoes"`.
   - **Validation Check**: Public marketplace & client catalog displays **1 single card** for `"Potatoes"` with **90 kg total available stock** (`30 kg + 60 kg = 90 kg`).
3. **Master Single Image & Privacy Rule**:
   - **Validation Check**: The card image displayed on the client/public marketplace is **strictly Harvest Hill Delivery's official Master Product picture**, NOT raw farmer proof photos (farmer proof photos remain private to Harvest Hill for negotiation inspection).
4. **Farmer Unlisted Crop Suggestion**:
   - Farmer submits harvest choosing *"Suggest Unlisted Crop"*.
   - Admin inspects custom proposal on `Supplies.tsx` $\rightarrow$ Accepts terms $\rightarrow$ Creates/links Master Product template $\rightarrow$ Accepted quantity is added to master list and becomes visible to clients/public.

---

## 22. Test Suite 19: Admin Supply Visibility & Access Controls (🔒 Visibility Controls)

1. Log in as Admin (`admin@harvesthill.test`).
2. Open Supplies Management (`/admin?tab=supplies`).
3. Select an approved supply $\rightarrow$ Click **🔒 Visibility**.
4. **Scope Selection**:
   - `🔒 Harvest Hill Delivery Only (Private)`: Visible only in Admin Portal.
   - `👥 Specific Chosen Clients`: Visible only to selected client profiles.
   - `🔑 All Registered Clients`: Visible to logged-in client accounts.
   - `🌐 Public to All People`: Visible to all public visitors on landing page & catalog.
5. **Disclose Farmer Name Toggle**:
   - Check **Disclose Farmer Name to Buyers/Public** to show farm name. Unchecked displays supplier anonymously as `"Harvest Hill Delivery"`.

---

## 23. Quick Sanity Verification Checklist

```
CLEAN BASELINE & REGISTRATION
[ ] Baseline initialized with admin@harvesthill.test only
[ ] /signup role toggle switch allows registering Farmer vs Client accounts cleanly

PRODUCT REQUIREMENTS (TEMPLATES) & ZERO GUARDS
[ ] Product Templates are strictly text-driven requirement specifications (NO images)
[ ] Quantity Needed input enforces min="1" and live zero validation ("Quantity needed must be greater than 0.")
[ ] Quality Requirements field opens with neutral, unbiased placeholder text
[ ] Compact filter bar consolidates status dropdown (Status: All, Open, Draft, Closed, Archived) before category tabs
[ ] Requirement deletion blocked with HTTP 400 if active farmer submissions exist (instructs admin to archive)
[ ] Expired requirements (submission_deadline < today) auto-close to 'closed' and disappear from farmer view

FARMER DISCOVERY & HARVEST SUBMISSIONS
[ ] Farmers discover requirements and submit harvest offers in single "Submit Harvest" section
[ ] Harvest submissions assigned sequential tracking numbers (SUP-000001, SUP-000002)
[ ] Proof photos rendered in aspect-square grid with hover delete button
[ ] Farmer Dashboard "Products currently needed" renders text-driven spec cards matching SubmitHarvest (no images)
[ ] Discount controls removed from Farmer Portal (managed exclusively by Admin)
[ ] Farmers can suggest unlisted crops for admin verification & master listing

ADMIN SUPPLIES COMPARISON, NEGOTIATION & GOVERNANCE
[ ] Detail drawer displays side-by-side comparison with vertical divider separation between left/right columns
[ ] Long crop names wrap cleanly (break-words) without colliding with adjacent columns
[ ] Requirement box correctly displays actual template values (Quantity Needed & Reference Price)
[ ] Contextual negotiation supports dual action controls (Counter offer vs Accept) and pre-filled fields
[ ] Admin can delegate Fresh Deals discount (is_discounted & discount_price) on approved supplies
[ ] Admin can configure Visibility Controls (private_admin, specific_clients, all_clients, public) & disclose_farmer_name toggle

LANDING PAGE, MASTER AGGREGATION & FULFILLMENT
[ ] Accepted supplies consolidated into 1 single Master Product card with total accepted stock (e.g. 30kg + 60kg = 90kg)
[ ] Client/Public marketplace displays single official Harvest Hill Master Product image (farmer photos remain private)
[ ] Supplier name defaults to "Harvest Hill Delivery" unless disclose_farmer_name is explicitly enabled by Admin
[ ] Orders require mandatory Transport Fee and Tax Assessment (> 0) before approval
[ ] Fulfilling orders to Delivered auto-deducts live stock and issues itemized Delivery Note PDF
```

---

*Last Updated: 2026-08-19*
