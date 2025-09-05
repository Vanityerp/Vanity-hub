# Inventory Adjustment Console Error Debug

## Current Issue
User reports console error when trying to adjust stock in the Retail & Shop Product Inventory section:
```
❌ API Error: {}
components\inventory\stock-adjustment-dialog.tsx (99:17) @ handleSubmit
```

## Problem Analysis
The error shows an empty object `{}` being returned from the API, which suggests:
1. The API endpoint is returning a malformed response
2. There's a runtime error in the API that's not being caught properly
3. The request is not reaching the API endpoint correctly

## Debugging Steps Implemented

### 1. Enhanced API Logging
**File:** `app/api/inventory/adjust/route.ts`

**Added comprehensive logging:**
- ✅ Request parsing validation
- ✅ Field validation with detailed error messages
- ✅ Database operation logging
- ✅ Step-by-step execution tracking
- ✅ Enhanced error handling with stack traces

### 2. Improved Frontend Error Handling
**File:** `components/inventory/stock-adjustment-dialog.tsx`

**Enhanced debugging:**
- ✅ Log request data before sending
- ✅ Log response status and headers
- ✅ Handle malformed JSON responses
- ✅ Extract raw response text for debugging
- ✅ Better error message extraction

### 3. Created Debug Tools

#### API Debug Console
**File:** `app/test/api-debug/page.tsx`

**Comprehensive testing suite:**
- ✅ API endpoint availability check
- ✅ Database connection verification
- ✅ Sample data retrieval
- ✅ Minimal payload testing
- ✅ Real product adjustment testing

#### Database Test Endpoint
**File:** `app/api/test-db/route.ts`

**Database verification:**
- ✅ Connection testing
- ✅ Product/location counts
- ✅ Sample data retrieval
- ✅ Relationship verification

#### Inventory Test Endpoint
**File:** `app/api/test-inventory-adjust/route.ts`

**End-to-end testing:**
- ✅ Test data generation
- ✅ API call simulation
- ✅ Response validation

## How to Debug

### Step 1: Run API Debug Console
1. Navigate to `/test/api-debug`
2. Click "Run All Tests"
3. Check which tests pass/fail
4. Review detailed error messages

### Step 2: Check Browser Console
1. Open browser developer tools
2. Go to Console tab
3. Try stock adjustment in main app
4. Look for detailed log messages

### Step 3: Check Network Tab
1. Open Network tab in developer tools
2. Try stock adjustment
3. Check if request reaches `/api/inventory/adjust`
4. Examine request/response details

## Common Issues & Solutions

### Issue 1: Empty Error Object `{}`
**Cause:** API returning malformed JSON or throwing unhandled exception

**Solution:**
- Enhanced error handling in API
- Raw response text logging
- Better JSON parsing with fallbacks

### Issue 2: Missing Required Fields
**Cause:** Frontend sending incomplete data

**Debug:**
```typescript
// Check what data is being sent
console.log("🔍 Request data:", adjustmentData)
```

**Solution:**
- Validate all required fields before API call
- Provide detailed field validation errors

### Issue 3: Database Connection Issues
**Cause:** Prisma client not properly initialized

**Debug:**
- Use `/api/test-db` endpoint
- Check database file exists
- Verify Prisma schema is up to date

### Issue 4: Invalid Product/Location IDs
**Cause:** Using non-existent IDs or wrong ID format

**Debug:**
```typescript
// Log the IDs being used
console.log("🔍 Product ID:", productId)
console.log("🔍 Location ID:", locationId)
```

**Solution:**
- Validate IDs exist in database
- Use proper UUID format
- Handle missing relationships gracefully

## Testing Workflow

### 1. Basic API Test
```bash
# Test if API endpoint exists
curl http://localhost:3000/api/inventory/adjust
```

### 2. Database Test
```bash
# Test database connection
curl http://localhost:3000/api/test-db
```

### 3. Full Integration Test
1. Use debug console at `/test/api-debug`
2. Run all tests
3. Check for failures
4. Review detailed logs

### 4. Manual Test
1. Go to Retail & Shop → Product Inventory
2. Try adjusting stock on a product
3. Check browser console for logs
4. Verify the exact error message

## Expected Log Output

### Successful Request
```
🔄 Starting inventory adjustment API call...
📝 Request data received: {productId: "...", locationId: "loc1", ...}
🔍 Looking for product: clm1234567890abcdef
✅ Product found: Hydrating Shampoo
🔍 Looking for location: loc1
✅ Location found: D-ring road
📝 Creating new product-location record...
✅ Created product-location record: clm9876543210fedcba
📊 Stock calculation: {currentStock: 0, adjustmentQuantity: 1, newStock: 1}
💾 Updating stock level...
✅ Stock adjustment successful!
```

### Failed Request
```
🔄 Starting inventory adjustment API call...
❌ Failed to parse request JSON: SyntaxError: Unexpected token...
```

## Files Modified

### API Layer
- `app/api/inventory/adjust/route.ts` - Enhanced logging and error handling
- `app/api/test-db/route.ts` - Database testing endpoint
- `app/api/test-inventory-adjust/route.ts` - Inventory testing endpoint

### Frontend
- `components/inventory/stock-adjustment-dialog.tsx` - Enhanced debugging

### Testing Tools
- `app/test/api-debug/page.tsx` - Comprehensive API testing
- `app/test/debug-stock-adjustment/page.tsx` - Stock adjustment specific testing

## Next Steps

1. **Run the debug console** to identify the exact failure point
2. **Check browser console** for detailed error logs
3. **Verify database state** using the test endpoints
4. **Test with minimal data** to isolate the issue
5. **Check network requests** to ensure API is being called correctly

## Resolution Strategy

Based on the debug results, the issue will likely be one of:

1. **API Route Issue**: Fix endpoint configuration or imports
2. **Database Issue**: Ensure Prisma is properly configured
3. **Data Validation Issue**: Fix field validation or data transformation
4. **Frontend Issue**: Fix how data is being sent to the API

The enhanced logging and debug tools will pinpoint the exact cause and provide the information needed for a targeted fix.

## Quick Fix Commands

If the issue is identified, here are common fixes:

```bash
# Reset database if needed
npx prisma db push --force-reset

# Regenerate Prisma client
npx prisma generate

# Check database schema
npx prisma studio
```

The debug tools will provide the specific error details needed to implement the correct solution.
