# Inventory Management API Documentation

## Overview

The VanityERP Inventory Management API provides comprehensive functionality for managing product inventory across multiple locations, including stock adjustments, transfers, and audit trails.

## Base URL
```
https://your-domain.com/api
```

## Authentication
All API endpoints require proper authentication. Include authentication headers as required by your system.

## Core Endpoints

### 1. Inventory Adjustment API

**Endpoint:** `POST /api/inventory/adjust`

**Description:** Adjusts inventory levels for a specific product at a specific location with full audit trail support.

**Request Body:**
```json
{
  "productId": "string (required)",
  "locationId": "string (required)", 
  "adjustmentType": "add|remove (required)",
  "quantity": "number (required, positive integer)",
  "reason": "string (required)",
  "notes": "string (optional)"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Stock increased/decreased successfully",
  "productLocation": {
    "id": "string",
    "productId": "string",
    "locationId": "string",
    "stock": "number",
    "updatedAt": "datetime"
  },
  "previousStock": "number",
  "newStock": "number", 
  "adjustment": "number",
  "auditTrail": true
}
```

**Response (Error - 400):**
```json
{
  "error": "Insufficient stock",
  "details": "Cannot remove 5 units. Only 3 units available.",
  "currentStock": 3,
  "requestedQuantity": 5
}
```

**Validation Rules:**
- `productId`: Must be a valid product ID that exists in the database
- `locationId`: Must be a valid location ID that exists in the database
- `adjustmentType`: Must be either "add" or "remove"
- `quantity`: Must be a positive integer greater than 0
- `reason`: Required string, minimum 3 characters
- Negative stock prevention: Configurable via `ALLOW_NEGATIVE_STOCK` environment variable

### 2. Inventory Query API

**Endpoint:** `GET /api/inventory`

**Description:** Retrieves inventory levels for all products at a specific location or all locations.

**Query Parameters:**
- `locationId` (optional): Filter by specific location ID
- `productId` (optional): Filter by specific product ID

**Examples:**
```
GET /api/inventory?locationId=location123
GET /api/inventory?productId=product456
GET /api/inventory
```

**Response (Success - 200):**
```json
{
  "inventory": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "category": "string",
      "sku": "string",
      "price": "number",
      "cost": "number",
      "stock": "number",
      "isRetail": "boolean",
      "isActive": "boolean",
      "locationId": "string",
      "locationName": "string"
    }
  ]
}
```

### 3. Products API

**Endpoint:** `GET /api/products`

**Description:** Retrieves all products with their location-specific inventory data.

**Response (Success - 200):**
```json
{
  "products": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "category": "string",
      "price": "number",
      "cost": "number",
      "isRetail": "boolean",
      "isActive": "boolean",
      "locations": [
        {
          "locationId": "string",
          "stock": "number",
          "price": "number"
        }
      ]
    }
  ]
}
```

### 4. Locations API

**Endpoint:** `GET /api/locations`

**Description:** Retrieves all available locations.

**Response (Success - 200):**
```json
{
  "locations": [
    {
      "id": "string",
      "name": "string",
      "address": "string",
      "isActive": "boolean"
    }
  ]
}
```

### 5. Shop Products API

**Endpoint:** `GET /api/shop/products`

**Description:** Retrieves products available for retail sale (online store).

**Response (Success - 200):**
```json
{
  "products": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "price": "number",
      "salePrice": "number",
      "stock": "number",
      "isRetail": true,
      "isActive": true,
      "isFeatured": "boolean"
    }
  ]
}
```

## Error Handling

### Standard Error Response Format
```json
{
  "error": "Error message",
  "details": "Detailed error description",
  "code": "ERROR_CODE",
  "timestamp": "datetime"
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_PRODUCT_ID` | 400 | Product ID does not exist |
| `INVALID_LOCATION_ID` | 400 | Location ID does not exist |
| `INSUFFICIENT_STOCK` | 400 | Not enough stock for removal |
| `INVALID_QUANTITY` | 400 | Quantity must be positive integer |
| `MISSING_REQUIRED_FIELD` | 400 | Required field is missing |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Audit Trail

### Automatic Audit Trail Creation
Every inventory adjustment automatically creates an audit trail entry with:
- Product ID and Location ID
- Adjustment type and quantity
- Previous and new stock levels
- Reason and notes
- User ID (when available)
- Timestamp

### Audit Trail Data Structure
```json
{
  "id": "string",
  "productId": "string",
  "locationId": "string", 
  "adjustmentType": "add|remove",
  "quantity": "number",
  "previousStock": "number",
  "newStock": "number",
  "reason": "string",
  "notes": "string",
  "userId": "string",
  "timestamp": "datetime"
}
```

## Usage Examples

### Example 1: Add Stock
```javascript
const response = await fetch('/api/inventory/adjust', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    productId: 'prod_123',
    locationId: 'loc_456', 
    adjustmentType: 'add',
    quantity: 10,
    reason: 'New stock delivery',
    notes: 'Received from supplier ABC'
  })
});

const result = await response.json();
console.log('New stock level:', result.newStock);
```

### Example 2: Remove Stock (Sale)
```javascript
const response = await fetch('/api/inventory/adjust', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    productId: 'prod_123',
    locationId: 'online_store',
    adjustmentType: 'remove', 
    quantity: 2,
    reason: 'Online store sale - Order #12345',
    notes: 'Customer purchase'
  })
});

if (!response.ok) {
  const error = await response.json();
  console.error('Sale failed:', error.details);
} else {
  const result = await response.json();
  console.log('Sale completed, remaining stock:', result.newStock);
}
```

### Example 3: Transfer Between Locations
```javascript
// Step 1: Remove from source location
await fetch('/api/inventory/adjust', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: 'prod_123',
    locationId: 'warehouse',
    adjustmentType: 'remove',
    quantity: 5,
    reason: 'Transfer to retail store'
  })
});

// Step 2: Add to destination location  
await fetch('/api/inventory/adjust', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: 'prod_123', 
    locationId: 'retail_store',
    adjustmentType: 'add',
    quantity: 5,
    reason: 'Transfer from warehouse'
  })
});
```

## Rate Limiting

- **Standard endpoints:** 100 requests per minute per IP
- **Inventory adjustment:** 50 requests per minute per IP (to prevent abuse)
- **Bulk operations:** Contact support for higher limits

## Best Practices

### 1. Error Handling
Always check response status and handle errors appropriately:
```javascript
if (!response.ok) {
  const error = await response.json();
  // Handle specific error types
  if (error.code === 'INSUFFICIENT_STOCK') {
    // Show user-friendly message about stock availability
  }
}
```

### 2. Atomic Operations
For transfers, ensure both operations succeed or both fail:
```javascript
try {
  await removeFromSource();
  await addToDestination();
} catch (error) {
  // Rollback if needed
  await rollbackOperations();
}
```

### 3. Validation
Always validate inputs before making API calls:
```javascript
if (quantity <= 0) {
  throw new Error('Quantity must be positive');
}
if (!productId || !locationId) {
  throw new Error('Product and location are required');
}
```

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Insufficient stock" error when stock appears available
**Cause:** Stock may be reserved or there's a timing issue with concurrent operations.
**Solution:**
1. Refresh inventory data
2. Check for pending transfers
3. Verify location-specific stock levels

#### Issue: Negative stock levels appearing
**Cause:** `ALLOW_NEGATIVE_STOCK` environment variable is set to true.
**Solution:**
1. Set `ALLOW_NEGATIVE_STOCK=false` in environment
2. Run inventory reconciliation
3. Adjust stock levels to positive values

#### Issue: Audit trail entries not appearing
**Cause:** Database permissions or audit table issues.
**Solution:**
1. Check database connectivity
2. Verify `InventoryAudit` table exists
3. Check user permissions for audit table

## Support

For API support, please contact:
- **Technical Issues:** [tech-support@vanityerp.com]
- **Documentation:** [docs@vanityerp.com]
- **Emergency:** [emergency@vanityerp.com]

---

**API Version:** 1.0
**Last Updated:** December 2024
**Status:** ✅ Production Ready
