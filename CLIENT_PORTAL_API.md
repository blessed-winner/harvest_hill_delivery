# Client Portal API Documentation

## Overview
Complete REST API for the Harvest Hill client portal with Swagger/OpenAPI documentation.

## API Endpoints

### Base URL
```
http://localhost:8000/api/client/
```

### Authentication
All endpoints require JWT authentication with `role='client'`

**Headers:**
```
Authorization: Bearer <access_token>
```

---

## Dashboard Endpoints

### GET /dashboard/summary/
Get comprehensive dashboard statistics

**Response:**
```json
{
  "monthly_spend": 1240.50,
  "total_orders": 18,
  "next_delivery": "Tomorrow, 9AM",
  "savings": 142.20,
  "spend_trend": 12.0,
  "recent_orders": [...],
  "urgent_products": [...]
}
```

### GET /dashboard/volume_by_category/
Get order volume breakdown by product category

**Response:**
```json
{
  "categories": [
    {
      "label": "Fruits",
      "value": 150.5,
      "percentage": 35.2
    },
    ...
  ]
}
```

---

## Product Browsing Endpoints

### GET /products/
Browse available products with filtering

**Query Parameters:**
- `category` (optional): Filter by category (e.g., "Fruits", "Vegetables")
- `search` (optional): Search by product name
- `urgency` (optional): Filter by urgency level ("low", "medium", "high", "steady")

**Example:**
```
GET /api/client/products/?category=Fruits&urgency=high
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Organic Gala Apples",
    "category": "Fruits",
    "base_price": "1.42",
    "unit": "lb",
    "image_url": "https://res.cloudinary.com/...",
    "is_currently_needed": true,
    "urgency": "high",
    "quantity_needed": "2400"
  },
  ...
]
```

### GET /products/{id}/
Get detailed product information

**Response:**
```json
{
  "id": 1,
  "name": "Organic Gala Apples",
  "category": "Fruits",
  "base_price": "1.42",
  "unit": "lb",
  "image_url": "https://res.cloudinary.com/...",
  "is_currently_needed": true,
  "urgency": "high",
  "quantity_needed": "2400"
}
```

---

## Order Management Endpoints

### GET /orders/
List all client orders

**Query Parameters:**
- `status` (optional): Filter by status ("pending", "processing", "shipped", "delivered", "cancelled")

**Example:**
```
GET /api/client/orders/?status=pending
```

**Response:**
```json
[
  {
    "id": 1,
    "client": {...},
    "status": "pending",
    "delivery_address": "123 Main St, City, State 12345",
    "created_at": "2024-01-15T10:30:00Z",
    "items": [...]
  },
  ...
]
```

### POST /orders/
Create a new order

**Request Body:**
```json
{
  "delivery_address": "123 Main St, City, State 12345",
  "items": [
    {
      "product_id": 1,
      "quantity": 10.5
    },
    {
      "product_id": 2,
      "quantity": 5.0
    }
  ]
}
```

**Response:** 201 Created
```json
{
  "id": 123,
  "client": {...},
  "status": "pending",
  "delivery_address": "123 Main St, City, State 12345",
  "created_at": "2024-01-15T10:30:00Z",
  "items": [...]
}
```

### GET /orders/{id}/
Get specific order details

### PATCH /orders/{id}/
Update order (e.g., cancel)

**Request Body:**
```json
{
  "status": "cancelled"
}
```

---

## Profile Endpoints

### GET /api/accounts/me/
Get client profile information

**Response:**
```json
{
  "id": 1,
  "email": "client@example.com",
  "role": "client",
  "profile": {
    "company_name": "Culinary Ventures",
    "phone": "+1 (555) 234-5678",
    "business_type": "Restaurant"
  }
}
```

### PUT /api/accounts/me/
Update client profile

---

## Notification Endpoints

### GET /api/notifications/
List all notifications

### PATCH /api/notifications/{id}/
Mark notification as read

### POST /api/notifications/mark-all-read/
Mark all notifications as read

### DELETE /api/notifications/{id}/
Delete specific notification

### DELETE /api/notifications/delete-all/
Delete all notifications

---

## Error Responses

All endpoints return standard error responses:

**400 Bad Request:**
```json
{
  "error": "Invalid request parameters"
}
```

**401 Unauthorized:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**403 Forbidden:**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

**404 Not Found:**
```json
{
  "detail": "Not found."
}
```

---

## Swagger Documentation

Access interactive API documentation at:
```
http://localhost:8000/api/schema/swagger-ui/
```

The Swagger UI provides:
- Full endpoint documentation
- Request/response examples
- Interactive API testing
- Schema definitions
- Authentication testing

---

## Frontend Integration

### Import the API client:
```typescript
import { clientApi, formatCurrency } from '../lib/api';
```

### Example Usage:

**Get Dashboard Data:**
```typescript
const summary = await clientApi.dashboardSummary();
console.log(summary.monthly_spend); // 1240.50
```

**Browse Products:**
```typescript
const products = await clientApi.products.list({
  category: 'Fruits',
  urgency: 'high'
});
```

**Create Order:**
```typescript
const order = await clientApi.orders.create({
  delivery_address: "123 Main St",
  items: [
    { product_id: 1, quantity: 10.5 },
    { product_id: 2, quantity: 5.0 }
  ]
});
```

**Format Currency:**
```typescript
const formatted = formatCurrency(1240.50); // "$1,240.50"
```

---

## Implementation Status

✅ **Backend Completed:**
- Dashboard API with statistics
- Product browsing with filters
- Order management CRUD
- Swagger/OpenAPI documentation
- JWT authentication
- Role-based permissions

✅ **Frontend Completed:**
- API client with TypeScript
- Error handling
- Token refresh
- Utility functions

🔄 **Next Steps:**
- Connect Dashboard component to API
- Implement product browsing UI
- Add shopping cart functionality
- Create order placement flow

---

## Testing

### Using cURL:
```bash
# Get dashboard summary
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/client/dashboard/summary/

# Browse products
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/client/products/?category=Fruits"

# Create order
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"delivery_address":"123 Main St","items":[{"product_id":1,"quantity":10}]}' \
  http://localhost:8000/api/client/orders/
```

### Using Postman:
1. Import the Swagger schema from `/api/schema/`
2. Set Authorization header with JWT token
3. Test all endpoints interactively

---

## Security Notes

- All endpoints require authentication
- Client users can only access their own data
- JWT tokens expire and auto-refresh
- CORS configured for frontend domain
- Cloudinary URLs are secure and temporary
