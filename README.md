# Harvest Hill Delivery System

A comprehensive farm-to-table supply chain management platform connecting farmers, clients, and administrators.

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Installation & Setup](#installation--setup)
- [User Roles & Workflows](#user-roles--workflows)
- [API Documentation](#api-documentation)

> 📋 **Testing:** See [`test_guide.md`](./test_guide.md) for the full test guide (excluded from version control).

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
GET    /accounts/admin/users/                                  # List users
POST   /accounts/admin/users/create/                           # Create user
PATCH  /accounts/admin/users/{id}/update/                      # Update user
DELETE /accounts/admin/users/{id}/delete/                      # Delete user
GET    /accounts/admin/dashboard/                              # Dashboard stats
GET    /accounts/admin/farmer-applications/                    # List farmer applications
POST   /accounts/admin/farmer-applications/{id}/approve/       # Approve application
POST   /accounts/admin/farmer-applications/{id}/reject/        # Reject application
```

#### Farmer Application (Public)
```
POST   /accounts/farmer-applications/apply/   # Submit farmer application
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
