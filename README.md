# Harvest Hill Delivery System

A comprehensive farm-to-table supply chain management platform connecting farmers, clients, and administrators.

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Installation & Setup](#installation--setup)
- [User Roles & Workflows](#user-roles--workflows)
- [Testing Guide](#testing-guide)
- [API Documentation](#api-documentation)

---

## Overview

Harvest Hill Delivery is a three-portal system that manages agricultural supply chains:

- **Farmer Portal**: Farmers submit harvest supplies with quantities, prices, and photos
- **Admin Portal**: Administrators review and approve farmer submissions, manage products, and oversee operations
- **Client Portal**: Customers browse accepted supplies and place orders

### Key Features

- Real-time supply submission and approval workflow
- Dynamic product catalog based on accepted farmer supplies
- Order management with delivery scheduling
- Notification system (WebSocket-based)
- Multi-user role management (Admin, Farmer, Client)

---

## System Architecture

### Tech Stack

**Backend:**
- Django 5.0+ with Django REST Framework
- PostgreSQL database
- Cloudinary for image storage
- Django Channels for WebSocket notifications

**Frontend:**
- Next.js 14+ (React)
- TypeScript
- Tailwind CSS
- Recharts for data visualization

### Project Structure

```
harvest-hill-delivery/
├── backend/
│   ├── apps/
│   │   ├── accounts/       # User management & authentication
│   │   ├── products/       # Product catalog management
│   │   ├── supplies/       # Farmer supply submissions
│   │   ├── orders/         # Client order management
│   │   ├── delivery_notes/ # Delivery tracking
│   │   ├── invoices/       # Invoice generation
│   │   ├── negotiations/   # Price negotiation system
│   │   ├── notifications/  # Real-time notifications
│   │   └── common/         # Shared utilities
│   └── config/            # Django settings
└── frontend/
    └── src/
        ├── app/           # Next.js app router
        └── portals/       # Portal-specific components
            ├── admin/     # Admin portal
            ├── farmer/    # Farmer portal
            └── client/    # Client portal
```

---

## Installation & Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Cloudinary account (for image uploads)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   Create `.env` file in `backend/` directory:
   ```env
   SECRET_KEY=your-secret-key
   DEBUG=True
   DATABASE_URL=postgresql://user:password@localhost:5432/harvest_hill_db
   
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

5. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Seed database (optional):**
   ```bash
   python manage.py seed_data
   ```

7. **Start development server:**
   ```bash
   python manage.py runserver
   ```

   Backend will be available at: `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create `.env.local` file in `frontend/` directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_WS_URL=ws://localhost:8000
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

   Frontend will be available at: `http://localhost:3000`

---

## User Roles & Workflows

### 1. Admin Workflow

**Purpose:** Manage the platform, review farmer submissions, and oversee operations.

#### Access
- **URL:** `http://localhost:3000/admin`
- **Login:** Use admin credentials or create via Django admin

#### Key Responsibilities

1. **User Management**
   - Create/edit/delete users (farmers, clients)
   - Assign roles and permissions
   - View user activity

2. **Product Catalog Management**
   - Create product templates (categories, base prices, units)
   - Set urgency levels (low, medium, high)
   - Upload default product images

3. **Supply Review & Approval**
   - Review farmer harvest submissions
   - Accept/reject supply proposals
   - **Note:** Accepting a supply automatically makes it visible in the client catalog
   - Archive or delete supplies
   - Bulk operations supported

4. **Order Management**
   - View all client orders
   - Update order statuses
   - Track deliveries

5. **Dashboard Analytics**
   - View order volume trends
   - Monitor top products by volume
   - Track revenue and deliveries
   - Recent activity feed (excludes login/logout events)
   - Supplier rankings based on performance metrics

---

### 2. Farmer Workflow

**Purpose:** Submit harvest supplies for admin review and track submissions.

#### Access
- **URL:** `http://localhost:3000/farmer`
- **Signup:** `http://localhost:3000/apply` (requires admin approval)

#### Complete Farmer Flow

#### Step 1: Apply as Farmer

1. Navigate to `http://localhost:3000/apply`
2. Fill out application form:
   - Email address
   - Username
   - Password
   - Farm name
   - Location
   - Certifications (optional)
   - Coordinates (latitude/longitude)
3. Submit application
4. **Wait for admin approval** (admin creates account via User Management)

#### Step 2: Login

1. Navigate to `http://localhost:3000/login`
2. Enter credentials (username/email + password)
3. System redirects to Farmer Dashboard

#### Step 3: View Dashboard

**Dashboard displays:**
- **Supplies this month:** Count of submissions
- **Pending negotiations:** Active price discussions
- **Acceptance rate:** Percentage of accepted supplies
- **Total earnings:** Revenue from paid invoices this month
- **Supply Volume Chart:** Last 6-12 months
- **Earnings by Category:** Pie chart breakdown

#### Step 4: Submit Harvest Supply

1. Click **"Submit Supply"** or navigate to **Supplies** section
2. Fill out supply form:
   - **Product:** Select from dropdown (products created by admin)
   - **Quantity:** Minimum 50 kg required
   - **Price:** Your proposed price per unit
   - **Available Date:** When product is ready
   - **Quality Grade:** Premium/Standard/Economy
   - **Photo:** Upload harvest photo (shows actual product condition)
   - **Notes:** Additional information
3. Click **"Submit"**
4. Supply status: **"Pending"** (awaiting admin review)

#### Step 5: Track Supply Status

**Supply Statuses:**
- **Draft:** Saved but not submitted
- **Pending:** Submitted, awaiting admin review
- **Accepted:** Admin approved ✅
  - **Product becomes visible in client catalog**
  - **Your photo and price are displayed to customers**
- **Rejected:** Admin declined ❌
- **Delivered:** Product delivered to system
- **Invoiced:** Invoice generated

**View Supply:**
- Navigate to **Supplies** section
- Filter by status
- Click supply to view details
- Edit draft supplies
- Cannot edit after submission

#### Step 6: Negotiation (if applicable)

1. Admin may counter-offer on price
2. Navigate to **Negotiations** section
3. View thread, accept/reject counter-offer
4. Final agreement moves supply to "Accepted"

#### Step 7: Monitor Earnings

1. Navigate to **Dashboard**
2. View earnings breakdown by category
3. Check payment status in **Invoices** section

---

### 3. Client Workflow

**Purpose:** Browse available products, place orders, and track deliveries.

#### Access
- **URL:** `http://localhost:3000/client`
- **Signup:** `http://localhost:3000/signup`

#### Complete Client Flow

#### Step 1: Signup

1. Navigate to `http://localhost:3000/signup`
2. Fill out registration form:
   - Email address
   - Username
   - Password
   - Business name
   - Business title
   - Phone number
3. Account created automatically (no approval needed)
4. Redirected to login

#### Step 2: Login

1. Navigate to `http://localhost:3000/login`
2. Enter credentials
3. System redirects to Client Dashboard

#### Step 3: View Dashboard

**Dashboard displays:**
- **Monthly spend:** Current month expenditure
- **Total deliveries:** Orders delivered
- **Savings:** Cost savings vs. market prices
- **Recent orders:** Last 5 orders with status
- **Volume by category:** Pie chart of purchases

#### Step 4: Browse Product Catalog

1. Navigate to **Catalog** section
2. **Important:** Only **accepted farmer supplies** are displayed
   - You see actual farmer harvest photos
   - Farmer's proposed prices (not base prices)
   - Available quantities from farmers

**Filtering Options:**
- **Category:** Fruits, Vegetables, Dairy, Grains
- **In Season:** High urgency products (urgency='high')
- **Bulk Available:** Products with quantity >= 100kg
- **Search:** Product name search

**Farmer of the Month Banner:**
- Appears in sidebar from 20th of each month onwards
- Shows top-ranked farmer from supplier performance rankings
- Click "Browse Collection" to filter catalog by that farmer's products
- Dynamic data from actual supplier rankings (no mock data)

**Product Card Shows:**
- Product name and category
- Farmer's photo of actual harvest
- Price per unit (farmer's price)
- Available quantity
- Seasonal/Limited badges
- Stock level indicator (green/orange/red based on quantity)

#### Step 5: View Product Details

1. Click any product in catalog
2. **Product Detail Page displays:**
   - Large product photo (farmer's submission)
   - Product name and category
   - Price per unit
   - Available quantity from farmer
   - Quality guarantee information
   - Farmer name (source)

#### Step 6: Add to Cart

**From Catalog:**
1. Click **"Add"** button on product card
2. Product added to cart (quantity: 1)

**From Product Detail:**
1. Use +/- buttons to select quantity
2. Click **"Add to Cart"**
3. System redirects to cart

#### Step 7: Manage Cart

1. Navigate to **Cart** section
2. **Cart displays:**
   - Product image (farmer's photo)
   - Product name and category
   - Price per unit
   - Quantity selector (+/-)
   - Subtotal per item
   - Remove button

3. **Update quantities:**
   - Use +/- buttons
   - Updates automatically

4. **View totals:**
   - Subtotal: Sum of all items
   - Delivery fee: $12.00
   - Taxes: 8% of subtotal
   - **Grand Total**

5. **Select delivery date:**
   - Choose from available dates
   - Delivery window preferences

#### Step 8: Checkout

1. Click **"Proceed to Checkout"** from cart
2. **Checkout page displays:**
   - Order summary (all items)
   - Total amount
   - Delivery address form
   - Delivery day selection
   - Time slot (Morning/Afternoon)

3. Fill out delivery details:
   - Street address
   - City
   - State
   - ZIP code

4. Select delivery schedule:
   - Choose day from calendar
   - Select time slot:
     - Morning: 8:00 AM - 12:00 PM
     - Afternoon: 1:00 PM - 5:00 PM

5. Click **"Place Order"**

**Order Creation:**
- Order sent to backend
- Status: **"Pending"**
- Cart cleared
- Success confirmation displayed

#### Step 9: Track Orders

**Order History:**
1. Navigate to **History** section
2. View all orders with:
   - Order number
   - Date placed
   - Total amount
   - Current status
   - Items list

**Order Statuses:**
- **Pending:** Order received
- **Processing:** Being prepared
- **Shipped:** Out for delivery
- **Delivered:** Successfully delivered ✅
- **Cancelled:** Order cancelled ❌

**Filter orders:**
- All orders
- Pending
- Processing
- Shipped
- Delivered
- Cancelled

#### Step 10: View Delivery Notes

1. Navigate to **Delivery Note** section
2. View delivered orders
3. Pagination: 8 items per page (dynamic page creation)
4. Details shown:
   - Delivery date
   - Items delivered
   - Delivery confirmation

#### Step 11: View Invoices

1. Navigate to **Invoices** section
2. View all invoices with:
   - Invoice number
   - Date
   - Total amount
   - Status (Paid/Pending/Cancelled)
   - Items breakdown

3. **Preview invoice:**
   - Click invoice to expand
   - View detailed breakdown

4. **Export PDF:**
   - Click **"PDF"** button
   - Opens print dialog
   - Professional invoice format
   - Save or print

---

## Testing Guide

This section provides step-by-step testing scenarios to verify system functionality.

### Test Environment Setup

Before testing, ensure:
1. ✅ Backend server running: `http://localhost:8000`
2. ✅ Frontend server running: `http://localhost:3000`
3. ✅ Database seeded with sample data (optional: `python manage.py seed_data`)
4. ✅ At least one product created by admin

### Test Scenario 1: Complete Farmer-to-Client Flow

**Objective:** Verify the full supply chain from farmer submission to client order.

#### Test Steps:

**1. Admin Creates Product Template**

```
URL: http://localhost:3000/admin
Login as: admin user

Steps:
1. Navigate to "Product Catalog"
2. Click "Add Product"
3. Fill form:
   - Name: "Organic Tomatoes"
   - Category: "Vegetables"
   - Unit: "kg"
   - Base Price: 2.50
   - Quantity Needed: 100
   - Urgency: "medium"
   - Upload image (optional)
4. Click "Add Product"

✅ Expected: Product created, visible in admin catalog
```

**2. Farmer Submits Supply**

```
URL: http://localhost:3000/farmer
Login as: farmer user

Steps:
1. Navigate to "Supplies"
2. Click "Submit New Supply"
3. Fill form:
   - Product: Select "Organic Tomatoes"
   - Quantity: 150 (kg)
   - Price: 2.80 (per kg)
   - Available Date: Tomorrow's date
   - Quality Grade: "Premium"
   - Upload photo of actual harvest
   - Notes: "Fresh harvest, ready for immediate delivery"
4. Click "Submit"

✅ Expected: 
   - Supply created with status "Pending"
   - Visible in farmer's supply list
   - Shows in admin's "Supplies" section as "Pending Review"
```

**3. Admin Reviews and Accepts Supply**

```
URL: http://localhost:3000/admin
Login as: admin user

Steps:
1. Navigate to "Supplies"
2. Click "Pending Review" tab
3. Click on "Organic Tomatoes" supply
4. Review details:
   - Farmer name
   - Photo
   - Quantity: 150 kg
   - Proposed price: $2.80/kg
   - Quality: Premium
5. Click "Accept Proposal"

✅ Expected:
   - Supply status changes to "Accepted"
   - Success modal displays
   - Product now visible in client catalog
```

**4. Verify Product Appears in Client Catalog**

```
URL: http://localhost:3000/client
Login as: client user

Steps:
1. Navigate to "Catalog"
2. Look for "Organic Tomatoes"

✅ Expected:
   - Product visible in catalog
   - Shows farmer's actual photo (not admin's product image)
   - Price shows $2.80/kg (farmer's price, not base price)
   - Available quantity: 150 kg
   - Shows farmer name
```

**5. Client Browses and Views Product**

```
Still logged in as client

Steps:
1. Click on "Organic Tomatoes" card
2. Product detail page opens

✅ Expected:
   - Large photo display (farmer's harvest photo)
   - Product name: "Organic Tomatoes"
   - Price: $2.80 per kg
   - Available: 150 kg
   - Category badge: "Vegetables"
   - Quality guarantee text displayed
```

**6. Client Adds to Cart**

```
On product detail page

Steps:
1. Use +/- buttons to set quantity: 10 kg
2. Click "Add to Cart"

✅ Expected:
   - Redirected to cart page
   - Cart shows:
     * Product: Organic Tomatoes
     * Quantity: 10 kg
     * Price: $2.80/kg
     * Subtotal: $28.00
   - Cart count badge updates to "10"
```

**7. Client Manages Cart**

```
On cart page

Steps:
1. Verify all product details correct
2. Test quantity adjustment:
   - Click "+" button (should increment to 11)
   - Click "-" button (should decrement to 10)
3. Verify price calculations update
4. Select delivery date: Tomorrow

✅ Expected:
   - Quantities update in real-time
   - Subtotal recalculates correctly
   - Totals section shows:
     * Subtotal: $28.00
     * Delivery Fee: $12.00
     * Tax (8%): $2.24
     * Grand Total: $42.24
```

**8. Client Proceeds to Checkout**

```
On cart page

Steps:
1. Click "Proceed to Checkout"
2. Fill delivery address:
   - Street: "123 Main Street"
   - City: "Springfield"
   - State: "IL"
   - ZIP: "62701"
3. Select delivery day: Tomorrow
4. Select time: "Morning (8:00 AM - 12:00 PM)"
5. Click "Place Order"

✅ Expected:
   - Loading indicator shows
   - Success message displays
   - Cart clears
   - Redirected to "Order History"
```

**9. Verify Order Created**

```
On order history page

Steps:
1. Check recent orders list

✅ Expected:
   - New order appears at top
   - Shows:
     * Order number (e.g., #123)
     * Date: Today
     * Status: "Pending"
     * Total: $42.24
     * Items: Organic Tomatoes (10 kg)
```

**10. Admin Views Order**

```
URL: http://localhost:3000/admin
Login as: admin

Steps:
1. Navigate to "Orders Management"
2. Find the new order

✅ Expected:
   - Order visible in admin panel
   - Shows client details
   - Shows ordered items with farmer supply reference
   - Can update status to "Processing" → "Shipped" → "Delivered"
```

**11. Admin Updates Order Status**

```
Still in admin orders

Steps:
1. Click on the order
2. Change status to "Delivered"
3. Save changes

✅ Expected:
   - Status updates successfully
   - Client can see "Delivered" status in their order history
```

**12. Client Views Delivery Note**

```
URL: http://localhost:3000/client
Login as: client

Steps:
1. Navigate to "Delivery Note"
2. Check for delivered order

✅ Expected:
   - Order appears in delivery notes
   - Shows delivery confirmation
   - All items listed
```

---

### Test Scenario 2: Supply Rejection Flow

**Objective:** Verify rejected supplies don't appear in client catalog.

**Steps:**

1. **Farmer submits supply** (same as Test 1, Step 2)
2. **Admin reviews supply:**
   - Navigate to admin Supplies → Pending Review
   - Click supply
   - Click "Reject Proposal"
3. **Verify:**
   - ✅ Supply status: "Rejected"
   - ✅ Supply visible in admin "Rejected" tab
   - ✅ Product NOT visible in client catalog
   - ✅ Farmer sees rejection in their supplies list

---

### Test Scenario 3: Bulk Operations

**Objective:** Test admin bulk archive/delete functionality.

**Steps:**

1. **Create multiple supplies** (as farmer)
2. **Admin reviews:**
   - Accept some supplies
   - Reject others
3. **Test bulk archive:**
   - Navigate to "Accepted" tab
   - Select multiple supplies (checkboxes)
   - Click "Archive" button
   - ✅ Expected: All selected supplies archived
4. **Test bulk delete:**
   - Navigate to "Archived" tab
   - Select multiple archived supplies
   - Click "Delete" button
   - Confirm deletion
   - ✅ Expected: All selected supplies deleted permanently

---

### Test Scenario 4: Price Display Consistency

**Objective:** Verify farmer prices (not base prices) are shown to clients.

**Setup:**
- Admin creates product: Base Price = $2.00
- Farmer submits supply: Price = $3.50
- Admin accepts supply

**Test:**

1. **Client views catalog:**
   - ✅ Expected: Shows $3.50 (farmer's price)
   - ❌ Should NOT show $2.00 (base price)

2. **Client views product detail:**
   - ✅ Expected: Shows $3.50

3. **Client adds to cart:**
   - ✅ Expected: Cart shows $3.50

4. **Client checks out:**
   - ✅ Expected: Order total calculated with $3.50

5. **Admin views order:**
   - ✅ Expected: Order items show $3.50

---

### Test Scenario 5: Multiple Supplies Same Product

**Objective:** Test multiple farmers supplying the same product.

**Setup:**
- Farmer A submits tomatoes: 100 kg @ $2.50/kg
- Farmer B submits tomatoes: 150 kg @ $2.80/kg
- Admin accepts both

**Test:**

1. **Client views catalog:**
   - ✅ Expected: Sees TWO entries for tomatoes
   - One from Farmer A (with A's photo and price)
   - One from Farmer B (with B's photo and price)

2. **Client can order from either:**
   - Add both to cart
   - ✅ Expected: Cart shows both separately

---

### Test Scenario 6: Cart Persistence

**Objective:** Verify cart data persists across sessions.

**Steps:**

1. **Client adds items to cart**
2. **Close browser** (or logout and login)
3. **Navigate to cart**
   - ✅ Expected: All items still in cart
   - ✅ Quantities preserved
   - ✅ Prices correct

---

### Test Scenario 7: Filter and Search

**Objective:** Test client catalog filters.

**Setup:**
- Multiple products across categories
- Different price ranges
- Some organic products

**Tests:**

1. **Category filter:**
   - Select "Vegetables"
   - ✅ Expected: Only vegetables shown

2. **In Season filter:**
   - Toggle "In Season"
   - ✅ Expected: Only products with urgency='high' shown
   - Seasonal badge visible on products

3. **Bulk Available filter:**
   - Toggle "Bulk Available"
   - ✅ Expected: Only products with quantity >= 100kg shown

4. **Search:**
   - Type "tomato"
   - ✅ Expected: Only tomato products shown

5. **Combined filters:**
   - Category: Vegetables + In Season + Bulk Available
   - ✅ Expected: Results match ALL filters

6. **Farmer of the Month filter:**
   - Click "Browse Collection" on Farmer of the Month banner (visible from 20th)
   - ✅ Expected: Catalog filters to show only that farmer's products
   - Filter badge appears in header with farmer name
   - Click X to clear filter

---

### Test Scenario 8: Admin Dashboard Analytics

**Objective:** Verify dashboard data accuracy.

**Steps:**

1. **Create test data:**
   - Place several orders as client
   - Various products and quantities

2. **Check admin dashboard:**
   - ✅ Active orders count correct
   - ✅ Revenue matches order totals
   - ✅ Order volume chart displays
   - ✅ Top products listed correctly
   - ✅ Recent activity shows (no login/logout events)

---

### Test Scenario 9: Error Handling

**Objective:** Test system error handling.

**Tests:**

1. **Empty cart checkout:**
   - Try to checkout with empty cart
   - ✅ Expected: Prevented or error message

2. **Invalid delivery address:**
   - Leave address blank
   - ✅ Expected: Validation error

3. **Out of stock:**
   - Try to add more than available quantity
   - ✅ Expected: Warning or limit enforcement

4. **Network error simulation:**
   - Stop backend server
   - Try to load catalog
   - ✅ Expected: Error message displayed

---

### Test Scenario 10: Supply Photo vs Product Image

**Objective:** Confirm farmer supply photos take precedence.

**Setup:**
- Admin creates product with image A
- Farmer submits supply with image B
- Admin accepts supply

**Test:**

1. **Client catalog shows:**
   - ✅ Expected: Image B (farmer's photo)
   - ❌ Should NOT show image A (admin's default)

2. **Verify actual harvest visibility:**
   - Photo should be farmer's uploaded harvest photo
   - Shows real product condition

---

## API Documentation

### Base URL
- Development: `http://localhost:8000/api`

### Authentication
All authenticated endpoints require JWT token in header:
```
Authorization: Bearer <access_token>
```

### Key Endpoints

#### Authentication
```
POST   /accounts/login/          # Login user
POST   /accounts/register/       # Register client
POST   /accounts/token/refresh/  # Refresh access token
```

#### Admin
```
GET    /accounts/admin/users/             # List users
POST   /accounts/admin/users/create/      # Create user
PATCH  /accounts/admin/users/{id}/update/ # Update user
DELETE /accounts/admin/users/{id}/delete/ # Delete user
GET    /accounts/admin/dashboard/         # Dashboard stats
```

#### Farmer
```
GET    /supplies/                  # List farmer's supplies
POST   /supplies/                  # Create supply
PATCH  /supplies/{id}/             # Update supply
DELETE /supplies/{id}/             # Delete supply
GET    /farmer/dashboard/summary/  # Farmer dashboard
```

#### Client
```
GET    /client/products/           # List available products (accepted supplies)
GET    /client/products/{id}/      # Get product detail
POST   /client/orders/             # Create order
GET    /client/orders/             # List client orders
GET    /client/orders/{id}/        # Get order detail
GET    /client/dashboard/summary/  # Client dashboard
```

#### Products (Admin)
```
GET    /products/       # List all products
POST   /products/       # Create product
PATCH  /products/{id}/  # Update product
DELETE /products/{id}/  # Delete product
```

### Swagger Documentation
Access interactive API docs: `http://localhost:8000/api/schema/swagger-ui/`

---

## Common Issues & Troubleshooting

### Issue: Products not showing in client catalog

**Cause:** No accepted supplies
**Solution:**
1. Admin must first create product templates
2. Farmer submits supply referencing that product
3. Admin accepts the supply
4. Product becomes visible in client catalog

### Issue: Cart prices showing as NaN

**Cause:** Price stored as string in localStorage
**Solution:** Clear browser localStorage and re-add items

### Issue: Order creation fails with "product does not exist"

**Cause:** Trying to order using supply ID instead of product ID
**Solution:** Ensure cart stores `product_id` field correctly (the actual Product model ID, not Supply ID)

### Issue: Images not uploading

**Cause:** Cloudinary not configured
**Solution:** Verify Cloudinary credentials in backend `.env` file

---

## Production Deployment

### Backend (Django)

1. Set `DEBUG=False` in production settings
2. Configure allowed hosts
3. Set up PostgreSQL production database
4. Configure static files serving
5. Use Gunicorn/uWSGI for WSGI server
6. Set up Nginx as reverse proxy
7. Configure SSL certificates
8. Set up Django Channels with Redis for WebSockets

### Frontend (Next.js)

1. Build production bundle: `npm run build`
2. Set production environment variables
3. Deploy to Vercel/Netlify or self-host
4. Configure API URL to production backend
5. Set up CDN for static assets

---

## License

[Your License Here]

## Support

For issues and questions:
- GitHub Issues: [Repository URL]
- Email: support@harvesthill.com

---

**Last Updated:** January 2025
**Version:** 1.0.0
