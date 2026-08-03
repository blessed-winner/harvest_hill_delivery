# 🌾 Harvest Hill Delivery — Complete End-to-End Test Guide

> **An exhaustive, step-by-step test guide for validating all user journeys, portal workflows, inventory deductions, 100% RWF transactions, user-scoped privacy isolation, real-time notifications, guest login redirections, client product requests, custom crop proposals, multi-image galleries, and session locks starting from a clean database.**

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
- [9. Test Suite 6: Sourcing Unlisted Products (Client Product Requests)](#9-test-suite-6-sourcing-unlisted-products-client-product-requests)
- [10. Test Suite 7: Free-Form Harvest Submissions (Custom Crop Proposals)](#10-test-suite-7-free-form-harvest-submissions-custom-crop-proposals)
- [11. Test Suite 8: Price Counter-Proposals & Negotiation Threads](#11-test-suite-8-price-counter-proposals--negotiation-threads)
- [12. Test Suite 9: Client Cart, Checkout & User-Scoped Privacy Isolation](#12-test-suite-9-client-cart-checkout--user-scoped-privacy-isolation)
- [13. Test Suite 10: Multi-Image Uploads & Gallery Selector View](#13-test-suite-10-multi-image-uploads--gallery-selector-view)
- [14. Test Suite 11: Order Fulfillment, Delivery Note PDF & Auto Inventory Subtraction](#14-test-suite-11-order-fulfillment-delivery-note-pdf--auto-inventory-subtraction)
- [15. Test Suite 12: Portal Security, Session Lock & Logout Redirection](#15-test-suite-12-portal-security-session-lock--logout-redirection)
- [16. Test Suite 13: Settings, Avatars & Real-Time Profile Sync](#16-test-suite-13-settings-avatars--real-time-profile-sync)
- [17. Quick Sanity Verification Checklist](#17-quick-sanity-verification-checklist)

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
[4. Client Requests Unlisted Product @ /client?screen=dashboard] 
       ↓ (Client submits product request → Admin approves request & creates template)
[5. Farmer Proposes Custom Harvest @ /farmer?view=submit] 
       ↓ (Uses "Submit Custom Crop" card to submit harvest without an admin product template)
[6. Admin Approves Custom Supply @ /admin?tab=supplies] 
       ↓ (Accepts the custom proposal batch and links it to catalog crop)
[7. Farmer Fulfills Client Request @ /farmer?view=client-requests] 
       ↓ (Sees approved client requests board → Supplies against the requested demand)
[8. Price Negotiation @ /client?screen=product-detail] 
       ↓ (Client proposes custom negotiation; farmer accepts counter offer)
[9. Client Checkout & Multi-Image Gallery Selector] 
       ↓ (Selects images in product detail pane; places order for harvest batch)
[10. Order Fulfillment & Delivery Note PDF]
       ↓ (Admin delivers order; invoice auto-generated; delivery note lists totals & signature)
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
   - **Quality Grade**: `Premium` (Ensure no emojis appear in selector dropdown)
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
   - Verify the ID format uses `#SUP-{id}`.
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

## 9. Test Suite 6: Sourcing Unlisted Products (Client Product Requests)

*(Requirement: Clients can request specific products not listed on the Harvest Hill portal. Admin approves, and farmers view requests to know market needs.)*

1. Log in as Client (`alice.client@harvesthill.test` / `ClientPass2026!`).
2. **Navigate to Sourcing Settings Tab**:
   - Click the **User Avatar (Profile Settings)** icon in the top-right corner of the navigation header bar to enter the **Client Portal Dashboard**.
   - Scroll down to the **Account & Profile Settings** section at the bottom, and select the **My Product Requests** tab on the left.
3. **Submit Sourcing Request**:
   - Click the green **New Request** button. The request form modal will open directly on the dashboard page.
   - Fill Sourcing Request Form:
     - **Product Name**: `Yellow Passion Fruits`
     - **Category**: Select `Fruits`.
     - **Unit**: Select `kg`.
     - **Quantity Needed**: `100`
     - **Preferred Price**: `1500` (RWF/kg)
     - **Notes / Specifications**: `Require Grade A quality for juice production.`
     - Click **Submit Request**.
   - Verify that the request for `Yellow Passion Fruits` is listed under your requests with status **`pending`**.
4. **Update / Edit Sourcing Request**:
   - Hover over the submitted request. An edit pencil button and a delete trash button will appear.
   - Click the **Edit** button, change the quantity to `120`, and click **Update Request**.
   - Verify the request lists with quantity `120` and status is reset to **`pending`** (if it was approved).
5. **Delete Sourcing Request**:
   - Hover over the request, click the red **Delete** (trash) icon, and confirm.
   - Verify that the request is removed from your requests list.
6. Log in as Admin (`admin@harvesthill.test` / `adminpass123`).
7. Navigate to **Product Catalog** (`/admin?tab=products`) → Click **Client Requests** tab.
   - Locate any client request.
   - Verify you can click the red **Delete** button next to it. Confirm the prompt to verify it deletes successfully.
   - Locate another request, click **Approve** (Changes status to `approved` so farmers can see it).
   - Click **Create Template** next to the request:
     - Verify the Add Product drawer slide-out opens with name, category, unit, quantity, and preferred price prefilled!
     - Upload product image and click **Save Product**.
8. Log in as Farmer (`jeanpaul.farmer@harvesthill.test` / `SecurePass2026!`).
9. Click **Client Requests** on the sidebar:
   - Verify the approved request is visible as an approved market demand.
   - Click **Supply This Demand**:
     - Verify it redirects to the Submit Harvest form drawer prefilled with category, unit, quantity requested, and preferred price!

---

## 10. Test Suite 7: Free-Form Harvest Submissions (Custom Crop Proposals)

*(Requirement: Farmers can submit harvests even when admin's product template is not present; Admin verifies/confirms.)*

1. Log in as Farmer (`jeanpaul.farmer@harvesthill.test` / `SecurePass2026!`).
2. Navigate to **Submit Harvest** (`/farmer?view=submit`).
3. Click the dashed card **Submit Custom Crop** at the top of the grid.
4. Fill Custom Crop Specification details:
   - **Crop / Product Name**: `Red Gala Apples`
   - **Category**: Select `Fruits`.
   - **Unit**: Select `kg`.
   - **Quantity Available**: `150` (Will trigger unit validation rules of min 20kg).
   - **Asking Price**: `1800` (RWF/kg).
   - **Ready Date**: Select tomorrow's date.
   - **Quality Grade**: Select `Premium` (Ensure no emojis appear in options).
   - Upload 1-2 photos of apples.
   - Click **Submit Harvest**.
5. Log in as Admin (`admin@harvesthill.test` / `adminpass123`).
6. Navigate to **Supplies Management** (`/admin?tab=supplies`).
   - Locate the proposal crop batch for `Red Gala Apples`.
   - **Validation Check**: A yellow warning banner is displayed: `⚠ Custom Crop Proposal: This crop is not currently in the product catalog.`
   - Click **Accept Proposal** to approve the batch.

---

## 11. Test Suite 8: Price Counter-Proposals & Negotiation Threads

1. Log in as Client (`alice.client@harvesthill.test` / `ClientPass2026!`).
2. Navigate to `Organic Roma Tomatoes` in catalog.
3. Click **Propose Price Negotiation / Bulk Deal**:
   - Proposed Price: `950 RWF` per kg.
   - Quantity: `50 kg`.
   - Message: `Requesting bulk discount.`
   - Click **Send Offer**.
4. Log in as Farmer (`jeanpaul.farmer@harvesthill.test`).
5. Navigate to **Negotiations** (`/farmer?view=negotiations`).
6. Open active thread → Click **Accept Offer** or type a message counter-proposal.
7. **Validation Check**: Status updates to `accepted` for both client and supplier.

---

## 12. Test Suite 9: Client Cart, Checkout & User-Scoped Privacy Isolation

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

## 13. Test Suite 10: Multi-Image Uploads & Gallery Selector View

*(Requirement: Ensure that when adding multiple product images, all of them display in a detail selector gallery pane.)*

1. Log in as Farmer (`jeanpaul.farmer@harvesthill.test` / `SecurePass2026!`).
2. Navigate to **Submit Harvest** (`/farmer?view=submit`).
3. Select `Organic Roma Tomatoes`.
4. Locate the Image Upload section:
   - Select and upload 3 different images.
   - Verify the thumbnails preview all 3 images cleanly.
   - Click **Submit Harvest**.
5. Log in as Admin (`admin@harvesthill.test` / `adminpass123`) and approve the supply proposal.
6. Log in as Client (`alice.client@harvesthill.test` / `ClientPass2026!`).
7. Go to catalog and click on `Organic Roma Tomatoes` to view details:
   - **Validation Check**: Check that all 3 uploaded images are displayed inside the small thumbnail selector div list underneath the main large photo display.
   - Click each thumbnail image and verify it swaps the active picture in the main container layout immediately.

---

## 14. Test Suite 11: Order Fulfillment, Delivery Note PDF & Auto Inventory Subtraction

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

## 15. Test Suite 12: Portal Security, Session Lock & Logout Redirection

*(Requirement: Once logged in, active users cannot navigate back to the landing page via browser back button. Logging out must perform complete clean-up and redirect to / landing page.)*

1. Log in as Client (`alice.client@harvesthill.test` / `ClientPass2026!`).
2. Verify you are redirected to the Client Portal Dashboard `/client`.
3. Try clicking the browser **Back Button**:
   - **Validation Check**: Verify the portal blocks navigation back to the landing page `/` and maintains the active authenticated session on `/client`.
4. Click **Sign Out** / **Logout** button:
   - **Validation Check**: Local storage tokens are cleared, and the page is immediately redirected back to the public homepage `/`.
5. Try clicking the browser **Forward Button**:
   - **Validation Check**: Verify you cannot access `/client` and are forced back to `/login` due to session guard validation.

---

## 16. Test Suite 13: Settings, Avatars & Real-Time Profile Sync

1. Open Farmer Profile & Settings (`/farmer?view=settings`).
2. Upload a new profile picture.
3. **Real-Time Sync Check**: TopBar header avatar updates instantly without needing page reloads.
4. Select Payout Method `MTN MoMo` and enter account number.
5. Save settings and refresh browser (`F5`) to confirm persistence.

---

## 17. Quick Sanity Verification Checklist

```
UNIFIED SIGNUP & PRIVACY
[ ] Unified /signup page with 🛒 Client vs 🌾 Farmer role toggle buttons
[ ] Farmer registration via /signup succeeds cleanly without 400 error
[ ] Database baseline reset cleanly with master admin@harvesthill.test
[ ] Cart storage is user-scoped (cart_items_role_email)

GUEST REDIRECTIONS & SESSION SECURITY
[ ] Unauthenticated Add to Cart clicks redirect to /login?redirect=cart
[ ] Unauthenticated Price Negotiation clicks redirect to /login?redirect=cart
[ ] Active portal sessions lock browser back button navigation to landing page
[ ] Click Sign Out clears tokens and redirects back to / public homepage

SUPPLY APPROVAL WORKFLOWS & CUSTOM PROPOSALS
[ ] Harvest Hill Delivery direct harvest submissions are auto-accepted & immediate
[ ] Farmer added products require Harvest Hill Delivery approval before public visibility
[ ] Farmers can propose custom crops using "Submit Custom Crop" card (Template-free)
[ ] Admins can view/approve Custom Crop Proposals with warnings in supplies manager

MARKET NEED SOURCING (CLIENT REQUESTS)
[ ] Clients can request unlisted products via form (listed under My Requests)
[ ] Admins can approve client requests and click "Create Template" to prefill crop catalog
[ ] Farmers can view approved Requests on client requests page and click "Supply This Demand"

MULTI-IMAGE PRODUCE GALLERIES
[ ] Farmers can upload up to 5 photos during harvest submission
[ ] Product Detail pane displays gallery selector with all thumbnails
[ ] Clicking a thumbnail swaps the main large product photo preview

DELIVERY NOTES & PDF EXPORT
[ ] Delivery Note lists Product Name, Quantity, Unit Price, Total Price for each item
[ ] Total Cost for all listed products displayed in table footer
[ ] Issued / Recipient signature applied to Delivery Note
[ ] Print / Export PDF button triggers clean browser PDF print view
```

---

*Last Updated: 2026-08-03*
