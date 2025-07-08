# Setup Guide: Batch Tracking for Inventory Alerts

## Issue Resolution
If you're seeing the error "Failed to fetch expiring batches", it means the ProductBatch database table hasn't been created yet. This is expected for the first-time setup.

## Quick Setup Steps

### 1. Apply Database Schema Changes
Run this command to create the ProductBatch table:

```bash
npx prisma db push
```

**Alternative (if you prefer migrations):**
```bash
npx prisma migrate dev --name add-product-batch-tracking
```

### 2. Create Sample Batch Data (Optional)
To test the expiry alerts system with sample data:

```bash
npx tsx scripts/migrate-batch-tracking.ts
```

### 3. Verify Setup
1. Refresh the dashboard
2. Check that the "Failed to fetch expiring batches" error is gone
3. The Expiring tab should now show real batch data (if any exists)

## What Each Step Does

### Database Schema Update
- Creates the `ProductBatch` table with fields for batch tracking
- Adds relationships between products, locations, and batches
- Enables expiry date tracking per batch

### Sample Data Creation
- Creates test batches with various expiry dates
- Some batches will be expiring soon (for testing alerts)
- Some batches will have safe expiry dates
- Provides realistic data for testing all features

## Expected Behavior After Setup

### Before Setup
- ✅ Stock alerts work (using existing product data)
- ❌ Expiry alerts show empty (no batch data)
- ❌ Console error: "Failed to fetch expiring batches"

### After Setup
- ✅ Stock alerts work (using existing product data)
- ✅ Expiry alerts work (using batch data)
- ✅ No console errors
- ✅ All dispose, discount, and reorder features work

## Troubleshooting

### If `npx prisma db push` fails:
1. Check your database connection in `.env`
2. Ensure the database server is running
3. Try: `npx prisma generate` first, then `npx prisma db push`

### If sample data script fails:
1. Ensure you have products and locations in your database
2. The script will skip creation if no products/locations exist
3. You can manually create batches through the API if needed

### If you still see errors:
1. Check the browser console for specific error messages
2. Verify the API endpoint `/api/inventory/batches` returns data
3. Ensure your database has the `product_batches` table

## Manual Verification

### Check if table exists:
```sql
-- In your database console
SELECT COUNT(*) FROM product_batches;
```

### Test API endpoint:
```bash
# Should return batch data or empty array
curl http://localhost:3000/api/inventory/batches?expiringSoon=true
```

## Production Deployment

For production deployment:
1. Run `npx prisma migrate deploy` instead of `npx prisma db push`
2. Don't run the sample data script in production
3. Set up real batch data through your inventory management process

## Need Help?

If you continue to experience issues:
1. Check that all dependencies are installed: `npm install`
2. Restart your development server: `npm run dev`
3. Clear browser cache and refresh the page
4. Check the terminal for any additional error messages
