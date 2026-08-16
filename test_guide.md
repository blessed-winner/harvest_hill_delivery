# 🌾 Harvest Hill Delivery — Complete End-to-End Test Guide

> **An exhaustive, step-by-step test guide for validating all user journeys, portal workflows, inventory deductions, available stock limits, B2B harvest submissions, privacy scoping, Harvest Hill negotiation & master stock aggregation (e.g. 30kg + 60kg = 90kg), mandatory transport fee & tax assessment before order approval, 100% RWF transactions, user-scoped privacy isolation, real-time notifications, guest login redirections, client product requests, custom crop proposals, multi-image galleries, and session locks starting from a clean database.**

---

## 📑 Table of Contents

- [1. System Architecture & Prerequisites](#1-system-architecture--prerequisites)
- [2. Clean Database Baseline & Admin Credentials](#2-clean-database-baseline--admin-credentials)
- [3. Complete End-to-End Walkthrough Flow](#3-complete-end-to-end-walkthrough-flow)
- [4. Test Suite 1: Admin Initial Login & Clean State](#4-test-suite-1-admin-initial-login--clean-state)
- [5. Test Suite 2: Unified Registration (Supplier vs Client Role Toggle)](#5-test-suite-2-unified-registration-supplier-vs-client-role-toggle)
- [6. Test Suite 3: Admin Direct Harvest Submission (Auto-Accepted)](#6-test-suite-3-admin-direct-harvest-submission-auto-accepted)
- [7. Test Suite 4: B2B Farmer Harvest Submission & Privacy Scoping](#7-test-suite-4-b2b-farmer-harvest-submission--privacy-scoping)
- [8. Test Suite 5: Harvest Hill Negotiation & Automated Master Stock Aggregation (30kg + 60kg = 90kg)](#8-test-suite-5-harvest-hill-negotiation--automated-master-stock-aggregation-30kg--60kg--90kg)
- [9. Test Suite 6: Master Product Sourcing & Negotiation History Audit Log](#9-test-suite-6-master-product-sourcing--negotiation-history-audit-log)
- [10. Test Suite 7: Available Stock Limits & Cart Quantity Enforcement](#10-test-suite-7-available-stock-limits--cart-quantity-enforcement)
- [11. Test Suite 8: Mandatory Transport Fee & Tax Assessment Before Order Approval](#11-test-suite-8-mandatory-transport-fee--tax-assessment-before-order-approval)
- [12. Test Suite 9: Client Itemized Payment Breakdown & Order History](#12-test-suite-9-client-itemized-payment-breakdown--order-history)
- [13. Test Suite 10: Guest User Redirections (Add to Cart & Negotiation)](#13-test-suite-10-guest-user-redirections-add-to-cart--negotiation)
- [14. Test Suite 11: Sourcing Unlisted Products (Client Product Requests)](#14-test-suite-11-sourcing-unlisted-products-client-product-requests)
- [15. Test Suite 12: Free-Form Harvest Submissions (Custom Crop Proposals)](#15-test-suite-12-free-form-harvest-submissions-custom-crop-proposals)
- [16. Test Suite 13: Price Counter-Proposals & Negotiation Threads](#16-test-suite-13-price-counter-proposals--negotiation-threads)
- [17. Test Suite 14: Client Cart, Checkout & User-Scoped Privacy Isolation](#17-test-suite-14-client-cart-checkout--user-scoped-privacy-isolation)
- [18. Test Suite 15: Multi-Image Uploads & Gallery Selector View](#18-test-suite-15-multi-image-uploads--gallery-selector-view)
- [19. Test Suite 16: Order Fulfillment, Delivery Note PDF & Auto Inventory Subtraction](#19-test-suite-16-order-fulfillment-delivery-note-pdf--auto-inventory-subtraction)
- [20. Test Suite 17: Portal Security, Floating Sidebar Spacing & Session Lock](#20-test-suite-17-portal-security-floating-sidebar-spacing--session-lock)
- [21. Test Suite 18: Settings, Avatars & Real-Time Profile Sync](#21-test-suite-18-settings-avatars--real-time-profile-sync)
- [22. Quick Sanity Verification Checklist](#22-quick-sanity-verification-checklist)

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

## 7. Test Suite 4: B2B Farmer Harvest Submission & Privacy Scoping

*(Requirement: Farmers submit harvest proposals with proof photos and privacy scoping. Proof photos are kept private to Harvest Hill Delivery for negotiation purposes and are not publicly displayed.)*

1. Log in as **Farmer A** (`jeanpaul.farmer@harvesthill.test` / `SecurePass2026!`).
2. Navigate to **Submit Harvest** (`/farmer?view=submit`).
3. Fill Harvest Details for **Farmer A**:
   - Select `Potatoes` (or select custom crop `Potatoes`).
   - **Quantity**: `40 kg`.
   - **Asking Price**: `800 RWF / kg`.
   - **Visibility Scope**: Select **Harvest Hill Delivery Only (`private_admin`)**.
   - **Proof of Harvest Photo**: Upload proof photo of harvest.
   - Click **Submit Harvest**.
4. Log in as **Farmer B** (`farmer_b@harvesthill.test`).
5. Navigate to **Submit Harvest** (`/farmer?view=submit`).
6. Fill Harvest Details for **Farmer B**:
   - Select `Potatoes`.
   - **Quantity**: `60 kg`.
   - **Asking Price**: `850 RWF / kg`.
   - **Visibility Scope**: Select **Harvest Hill Delivery Only (`private_admin`)**.
   - **Proof of Harvest Photo**: Upload proof photo of harvest.
   - Click **Submit Harvest**.
7. **Privacy Check (Client / Public Catalog)**:
   - Open guest homepage (`http://localhost:3000/`) or log in as Client.
   - **Validation Check**: Raw farmer submissions and proof-of-harvest photos are **NOT visible** to clients or the public. Photos are kept strictly private to Harvest Hill Delivery for negotiation.

---

## 8. Test Suite 5: Harvest Hill Negotiation & Automated Master Stock Aggregation (30kg + 60kg = 90kg)

*(Requirement: Harvest Hill Delivery negotiates price & accepted quantity with each farmer. Upon confirmation, accepted quantities automatically sum into the Master Product stock: 30 kg + 60 kg = 90 kg.)*

1. Log in as Admin / Harvest Hill Delivery (`admin@harvesthill.test` / `adminpass123`).
2. Open **Supplies Management** (`/admin?tab=supplies`).
3. **Negotiate with Farmer A**:
   - Click on Farmer A's harvest proposal for `Potatoes` (`40 kg` submitted).
   - In the **Negotiate Terms & Aggregate Inventory** card:
     - **Agreed Accepted Qty**: Enter `30 kg` (Harvest Hill decides to accept 30 kg out of 40 kg).
     - **Agreed Farmer Price**: Enter `750 RWF`.
     - **Target Master Product**: Select `Potatoes` (or approve suggested product).
     - Click **Confirm Terms & Accept into Master Stock**.
   - Verify toast confirms: `Negotiated terms agreed & supply accepted into master stock!`
4. **Negotiate with Farmer B**:
   - Click on Farmer B's harvest proposal for `Potatoes` (`60 kg` submitted).
   - In the **Negotiate Terms & Aggregate Inventory** card:
     - **Agreed Accepted Qty**: Enter `60 kg`.
     - **Agreed Farmer Price**: Enter `800 RWF`.
     - **Target Master Product**: Select `Potatoes`.
     - Click **Confirm Terms & Accept into Master Stock**.
5. **Automated Stock Aggregation Verification**:
   - Open **Product Catalog** (`/admin?tab=products`) or Client Catalog (`/client?screen=catalog`).
   - Locate the Master Product card for `Potatoes`.
   - **Validation Check**: **Aggregated Stock** automatically displays **`90 kg`** (`30 kg + 60 kg = 90 kg`)!
   - The master image rendered is the official Harvest Hill product image, and master price is set dynamically by Harvest Hill Delivery alone.

---

## 9. Test Suite 6: Master Product Sourcing & Negotiation History Audit Log

*(Requirement: Admin can view complete history of all farmer negotiations, agreed prices, quantities, dates, and private proof photos for each Master Product.)*

1. Log in as Admin (`admin@harvesthill.test` / `adminpass123`).
2. Open **Product Catalog** (`/admin?tab=products`).
3. Locate the Master Product card for `Potatoes` (displaying `90 kg` aggregated stock).
4. Click **🤝 Sourcing History** on the card.
5. **Sourcing & Negotiation Audit Drawer Validation**:
   - **Master Overview**: Displays `Potatoes`, Master Price, and **Aggregated Live Stock: 90 kg**.
   - **Farmer Negotiation Log**:
     - **Farmer A Entry**: Displays `Farmer A`, `30 kg agreed` (`40 kg submitted`), Agreed Price `750 RWF`, Status `accepted`, Scope `private admin`, and private proof-of-harvest photo thumbnail.
     - **Farmer B Entry**: Displays `Farmer B`, `60 kg agreed`, Agreed Price `800 RWF`, Status `accepted`, Scope `private admin`, and private proof-of-harvest photo thumbnail.
   - Test search filter by farmer name and status filter tabs (`Accepted`, `Pending`, `Rejected`).

---

## 10. Test Suite 7: Available Stock Limits & Cart Quantity Enforcement

*(Requirement: Clients cannot order or add to cart more than the total available supply stock.)*

1. Log in as Client (`alice.client@harvesthill.test` / `ClientPass2026!`).
2. Open Product Details for `Potatoes` (Available Stock: `90 kg`).
3. **Quantity Input Cap Test**:
   - In quantity selector, type `150`.
   - **Validation Check**: System caps quantity at `90 kg` and displays toast: `Maximum available stock is 90 kg`.
4. **Add-to-Cart Stock Cap Test**:
   - Add `90 kg` of `Potatoes` to cart.
   - Go back to product page or catalog and attempt to click **Add to Cart** again.
   - **Validation Check**: System blocks addition and alerts: `Cannot add more. Maximum available stock for "Potatoes" is 90 kg.`
5. **Cart Page Quantity Adjustment Check**:
   - Open Cart (`/client?screen=cart`).
   - Attempt to click `+` or type `120` in manual quantity field.
   - **Validation Check**: Quantity is capped at `90 kg` and alerts user.

---

## 11. Test Suite 8: Mandatory Transport Fee & Tax Assessment Before Order Approval

*(Requirement: Orders cannot be approved by Admin until both transport fee and tax amount have been determined and attached.)*

1. Log in as Client (`alice.client@harvesthill.test`).
2. Open Cart with `30 kg` of `Potatoes` → Proceed to Checkout.
3. Enter Delivery Address (`124 KG 7 Ave, Remera, Kigali`) and click **Place Your Order**.
4. Log in as Admin (`admin@harvesthill.test` / `adminpass123`).
5. Open Orders Management (`/admin?tab=orders`).
6. **Unassessed Order Approval Attempt Check**:
   - Locate the newly placed pending order (`#ORD-000001`).
   - Attempt to change status dropdown directly to `Processing` or `Approved`.
   - **Validation Check**: Status update is **BLOCKED**. A warning toast displays: `Order cannot be approved yet. Transport fee and tax amount must be determined first.`
   - The Order Assessment Drawer automatically opens!
7. **Complete Fee Assessment & Approval**:
   - In Order Assessment Drawer:
     - Enter **Transport / Logistics Fee**: `3,500 RWF`.
     - Enter **Tax Amount**: `1,500 RWF`.
     - Click **Approve Order & Attach Assessment**.
   - **Validation Check**: Order status successfully updates to `Processing` and `is_assessed` becomes `True`!

---

## 12. Test Suite 9: Client Itemized Payment Breakdown & Order History

*(Requirement: Once fees are applied by Admin, client sees complete itemized breakdown with exact transport fee, tax fee, and total payment amount.)*

1. Log in as Client (`alice.client@harvesthill.test`).
2. Open Order History (`/client?screen=order-history`).
3. Click on Order `#ORD-000001` to expand details.
4. **Itemized Payment Breakdown Check**:
   - Verify green badge renders: `✓ Fees Assessed & Attached`.
   - Verify itemized rows:
     - **Items Subtotal**: `30,000 RWF` (30 kg @ 1,000 RWF)
     - **Transport / Logistics Fee**: `3,500 RWF`
     - **Tax Fee**: `1,500 RWF`
     - **Total Payment Amount**: **`35,000 RWF`**
5. Expand an unassessed pending order:
   - Verify yellow badge renders: `Pending Admin Fee Assessment`.
   - Verify notice explains: `Transport fee & tax will be determined by the Admin based on your delivery address upon order approval.`

---

## 13. Test Suite 10: Guest User Redirections (Add to Cart & Negotiation)

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

## 14. Test Suite 11: Dynamic Transport Fee & Tax Assessment by Admin

*(Requirement: Static delivery fees and taxes are removed. Final transport fee and taxes are assessed dynamically by the Admin based on destination delivery address upon order review.)*

1. Log in as Client (`alice.client@harvesthill.test` / `ClientPass2026!`).
2. Add products to Cart (`/client?screen=cart`) → Proceed to Checkout (`/client?screen=checkout`).
3. **Cart & Checkout Notice Verification**:
   - Verify static 2,500 RWF delivery fee and 5% tax are **removed**.
   - Verify a prominent notice renders: `🚚 Transport Fee & Tax Assessment: Based on your delivery address, the Admin will calculate and attach the transport fee and taxes upon order approval.`
4. Enter Delivery Address (`124 KG 7 Ave, Remera, Kigali`) and click **Place Your Order**.
5. Log in as Admin (`admin@harvesthill.test` / `adminpass123`).
6. Navigate to Orders Management (`/admin?tab=orders`).
7. Click the pending order to open the Detail Drawer:
   - **Form Card Check**: Verify the **🚚 Transport Fee & Tax Determination** section renders.
   - **Delivery Address Display**: Verify the destination address `124 KG 7 Ave, Remera, Kigali` is displayed prominently in a highlighted card.
   - Enter **Transport / Logistics Fee**: `3,500 RWF`.
   - Enter **Tax Amount**: `1,500 RWF`.
   - Click **Approve Order & Attach Assessment**.
8. **Grand Total Calculation Check**:
   - Verify the order summary grand total updates to `Items Subtotal + Transport Fee (3,500 RWF) + Tax Amount (1,500 RWF)`.

---

## 15. Test Suite 12: Order Fulfillment, Delivery Note PDF & Auto Inventory Subtraction

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

## 16. Test Suite 13: Portal Security, Session Lock & Logout Redirection

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

## 17. Test Suite 14: Settings, Avatars & Real-Time Profile Sync

1. Open Farmer Profile & Settings (`/farmer?view=settings`).
2. Upload a new profile picture.
3. **Real-Time Sync Check**: TopBar header avatar updates instantly without needing page reloads.
4. Select Payout Method `MTN MoMo` and enter account number.
5. Save settings and refresh browser (`F5`) to confirm persistence.

---

## 17. Test Suite 13: Bulk Deals & Volume Tier Discounts

*(Requirement: Farmers and Admin can submit optional bulk deals with min bulk qty and special bulk unit price. Bulk deal discounts automatically apply when purchasing in bulk.)*

1. Log in as Farmer (`jeanpaul.farmer@harvesthill.test` / `SecurePass2026!`) or Admin (`admin@harvesthill.test` / `adminpass123`).
2. Submit a harvest batch for `Organic Roma Tomatoes`:
   - Set **Asking Price**: `1,200 RWF / kg`.
   - In **Optional Bulk Deal Offer**:
     - **Min Bulk Qty**: `50 kg`.
     - **Bulk Price / Unit**: `950 RWF`.
   - Click **Submit Harvest**.
3. Log in as Client (`alice.client@harvesthill.test` / `ClientPass2026!`).
4. Go to Catalog (`/client?screen=catalog`).
   - **Validation Check**: Verify the card displays `⚡ Bulk Offer Available` and price starting `From RWF 1,200 / kg`.
5. Click the product to open **Product Detail**:
   - **Validation Check**: Verify the **⚡ Bulk Purchase Offer** banner displays: `Buy 50 kg or more for RWF 950/kg!`.
6. Set Quantity to `10 kg` (Standard order):
   - Verify unit price displays `RWF 1,200 / kg`.
7. Increase Quantity to `50 kg` (Qualifies for Bulk Deal):
   - **Validation Check**: Verify unit price updates to `RWF 950 / kg` with a `Bulk Deal Applied` badge!
8. Click **Add to Cart** and view Cart (`/client?screen=cart`):
   - Verify line item displays `⚡ Bulk Price Applied (RWF 950/unit)` and subtotal is `47,500 RWF`.

---

## 18. Test Suite 14: Single-Product Grouped Catalog & Farmer Anonymity Toggle

*(Requirement: Client catalog lists only 1 clean card per product type, aggregating stock across background suppliers. Farmer names are hidden by default for clients under Harvest Hill Delivery brand, with Admin toggle capability.)*

1. **Farmer Anonymity Verification**:
   - Log in as Client (`alice.client@harvesthill.test` / `ClientPass2026!`).
   - Browse catalog & product detail screens.
   - **Validation Check**: Verify farmer supplier name displays as **Harvest Hill Delivery** (Farmer real identity is hidden).
2. **Admin Privacy Toggle**:
   - Log in as Admin (`admin@harvesthill.test` / `adminpass123`) and navigate to Supplies (`/admin?tab=supplies`).
   - Click **🔒 Client Privacy: Farmer Names Hidden** in top bar header.
   - Verify toast notifies: `Farmer names are now VISIBLE to clients.`
3. **Client Visibility Check**:
   - Log in as Client (`alice.client@harvesthill.test` / `ClientPass2026!`) and refresh.
   - Verify real farm name (e.g., `Jean Paul Farm`) is now visible.
4. **Grouped Product Catalog Check**:
   - Have multiple suppliers submit harvest batches for `Roma Tomatoes`.
   - Log in as Client and navigate to Catalog (`/client?screen=catalog`).
   - **Validation Check**: Verify `Roma Tomatoes` appears **only ONCE** on the catalog, displaying combined total stock and starting price, rather than multiple duplicate cards.

---

## 19. Test Suite 15: Herbs Category & Flexible Order Quantities (> 0)

*(Requirement: "Herbs" is supported as a product category. Fixed 20kg minimum constraints are removed so clients and suppliers can order/supply any quantity > 0.)*

1. Log in as Admin (`admin@harvesthill.test` / `adminpass123`).
2. Go to Product Catalog (`/admin?tab=catalog`) and click **Add Product Spec**:
   - Set **Product Name**: `Fresh Rosemary Herbs`.
   - Set **Category**: `Herbs`.
   - Set **Quantity Needed**: `5 kg` (Verify system accepts < 20kg without error).
   - Click **Save Product Spec**.
3. Log in as Farmer (`jeanpaul.farmer@harvesthill.test` / `SecurePass2026!`).
4. Go to **Submit Harvest**:
   - Select `Herbs` in category filter or submit a custom crop under `Herbs` category.
   - Set Quantity to `2 kg` (Verify submission succeeds cleanly without 20kg restriction).
5. Log in as Client (`alice.client@harvesthill.test` / `ClientPass2026!`).
6. Click `Herbs` category bubble or filter in catalog:
   - Verify `Fresh Rosemary Herbs` is listed.
   - Set quantity to `1 kg` and proceed to checkout successfully.

---

## 20. Quick Sanity Verification Checklist

```
UNIFIED SIGNUP & PRIVACY
[ ] Unified /signup page with 🛒 Client vs 🌾 Farmer role toggle buttons
[ ] Farmer registration via /signup succeeds cleanly without 400 error
[ ] Database baseline reset cleanly with master admin@harvesthill.test
[ ] Cart storage is user-scoped (cart_items_role_email)
[ ] Farmer names hidden by default on client portal (Harvest Hill Delivery brand)
[ ] Admin privacy toggle switches farmer identity visibility for clients

SPECIAL FRESH DISCOUNTS & ADMIN DELEGATION
[ ] Only Harvest Hill Delivery Admin can delegate or apply special Fresh Discount prices (removed from Farmers)
[ ] Admin Product Catalog renders 🏷️ Delegate Discount button and modal to enable/disable discounts per product
[ ] Product Detail & Landing Page render Fresh Deals discount badges ("Save %") and strikethrough original prices

SINGLE-PRODUCT CATALOG GROUPING & CATEGORIES
[ ] Client catalog lists only ONE card per product type (e.g. Eggs/Tomatoes), aggregating total stock
[ ] "Herbs" category supported in backend models and frontend pickers/filters
[ ] Minimum order/supply thresholds (e.g. 20kg) removed so any valid quantity > 0 is allowed

GUEST REDIRECTIONS & SESSION SECURITY
[ ] Unauthenticated Add to Cart clicks redirect to /login?redirect=cart
[ ] Unauthenticated Price Negotiation clicks redirect to /login?redirect=cart
[ ] Active portal sessions lock browser back button navigation to landing page
[ ] Click Sign Out clears tokens and redirects back to / public homepage

SUPPLY APPROVAL WORKFLOWS, PRIVACY SCOPING & STOCK AGGREGATION
[ ] Harvest Hill Delivery direct harvest submissions are auto-accepted & immediate
[ ] Farmers select Visibility Scope (private_admin, specific_clients, all_clients, public)
[ ] Farmer proof-of-harvest photos are kept private to Admin negotiation view & hidden from clients
[ ] Harvest Hill Delivery negotiates price & accepted quantity per farmer proposal (e.g. 30kg out of 40kg)
[ ] Master Product live stock automatically sums accepted farmer batches (e.g. 30kg + 60kg = 90kg)
[ ] Admin can open 🤝 Sourcing History on Master Product cards to view full negotiation audit log
[ ] Farmers can propose custom crops using "Submit Custom Crop" card (Template-free)
[ ] Admins can view/approve Custom Crop Proposals with warnings in supplies manager

AVAILABLE STOCK LIMITS & MANDATORY ORDER FEE ASSESSMENT
[ ] Backend blocks order placement if requested items exceed total available supply stock
[ ] Client quantity selectors, Add to Cart, and Cart quantity controls cap at available stock
[ ] Admin CANNOT approve an order until BOTH transport fee and tax amount are provided (> 0)
[ ] Attempting to approve an unassessed order blocks status change and opens assessment drawer
[ ] Client Order History displays complete itemized payment breakdown (Items Subtotal + Transport Fee + Tax Fee = Total Payment)

DELIVERY NOTES & PDF EXPORT
[ ] Delivery Note lists Product Name, Quantity, Unit Price, Total Price for each item
[ ] Total Cost for all listed products displayed in table footer
[ ] Issued / Recipient signature applied to Delivery Note
[ ] Print / Export PDF button triggers clean browser PDF print view
```

---

*Last Updated: 2026-08-16*

