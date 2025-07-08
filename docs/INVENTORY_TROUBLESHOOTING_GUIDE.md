# Inventory Management System - Troubleshooting Guide

## Quick Diagnostic Checklist

When experiencing inventory issues, run through this checklist first:

1. **✅ Check System Status**
   - Is the application running?
   - Are all APIs responding?
   - Is the database accessible?

2. **✅ Verify Data Integrity**
   - Are product IDs valid?
   - Do locations exist?
   - Are stock levels reasonable?

3. **✅ Review Recent Changes**
   - Any recent deployments?
   - Configuration changes?
   - Database migrations?

## Common Issues and Solutions

### 🔴 Critical Issues

#### Issue: Online Store Not Deducting Inventory
**Symptoms:**
- Customers can purchase products
- Orders are created successfully
- Inventory levels don't decrease

**Diagnosis:**
```bash
# Check if the fix is deployed
curl -X POST http://localhost:3000/api/inventory/adjust \
  -H "Content-Type: application/json" \
  -d '{"productId":"test","locationId":"online","adjustmentType":"remove","quantity":1,"reason":"test"}'
```

**Solutions:**
1. **Verify checkout process is using inventory API:**
   - Check `app/client-portal/shop/checkout/page.tsx`
   - Ensure it calls `/api/inventory/adjust` not `updateProduct()`

2. **Check online location ID:**
   ```javascript
   // Verify correct location ID is being used
   const response = await fetch('/api/locations');
   const data = await response.json();
   console.log('Online location:', data.locations.find(l => l.name.includes('online')));
   ```

3. **Test the fix:**
   ```bash
   node scripts/test-checkout-integration.js
   ```

#### Issue: Negative Stock Levels
**Symptoms:**
- Stock levels showing negative numbers
- System allows overselling

**Diagnosis:**
```bash
# Check environment configuration
echo $ALLOW_NEGATIVE_STOCK
```

**Solutions:**
1. **Disable negative stock:**
   ```bash
   # Set in .env file
   ALLOW_NEGATIVE_STOCK=false
   ```

2. **Fix existing negative stock:**
   ```javascript
   // Run inventory reconciliation
   node scripts/fix-negative-stock.js
   ```

3. **Prevent future occurrences:**
   - Ensure all sales go through inventory API
   - Implement pre-purchase stock validation

### 🟡 Warning Issues

#### Issue: Slow Inventory Updates
**Symptoms:**
- Inventory changes take time to reflect
- Dashboard shows stale data

**Diagnosis:**
```bash
# Test API response time
time curl http://localhost:3000/api/inventory
```

**Solutions:**
1. **Check database performance:**
   ```sql
   -- Check for slow queries
   EXPLAIN ANALYZE SELECT * FROM product_locations WHERE locationId = 'online';
   ```

2. **Optimize queries:**
   - Add database indexes if needed
   - Review query patterns

3. **Clear cache if applicable:**
   ```bash
   # Clear application cache
   npm run cache:clear
   ```

#### Issue: Transfer Not Completing
**Symptoms:**
- Transfer shows as pending
- Stock not moved between locations

**Diagnosis:**
```bash
# Test transfer system
node scripts/test-transfer-system.js
```

**Solutions:**
1. **Check transfer workflow:**
   - Verify both source and destination operations complete
   - Check for database transaction issues

2. **Manual transfer completion:**
   ```javascript
   // Complete transfer manually via API
   await fetch('/api/inventory/adjust', {
     method: 'POST',
     body: JSON.stringify({
       productId: 'product_id',
       locationId: 'source_location',
       adjustmentType: 'remove',
       quantity: 5,
       reason: 'Manual transfer completion'
     })
   });
   ```

### 🟢 Minor Issues

#### Issue: Audit Trail Missing Entries
**Symptoms:**
- Some inventory changes not logged
- Audit trail incomplete

**Diagnosis:**
```sql
-- Check audit table
SELECT COUNT(*) FROM inventory_audits WHERE DATE(timestamp) = CURRENT_DATE;
```

**Solutions:**
1. **Verify audit table exists:**
   ```bash
   npx prisma db push
   ```

2. **Check API implementation:**
   - Ensure all inventory changes call audit creation
   - Verify database permissions

#### Issue: Dashboard Tabs Not Filtering
**Symptoms:**
- All products show in every tab
- Filtering not working

**Diagnosis:**
```bash
# Test dashboard functionality
node scripts/audit-inventory-dashboard.js
```

**Solutions:**
1. **Check product data:**
   ```javascript
   // Verify product flags
   const products = await fetch('/api/products').then(r => r.json());
   console.log('Retail products:', products.products.filter(p => p.isRetail).length);
   ```

2. **Fix product categorization:**
   - Update product `isRetail` flags
   - Verify category assignments

## Diagnostic Scripts

### Run Comprehensive System Check
```bash
# Run all diagnostic tests
node scripts/comprehensive-inventory-test-suite.js
```

### Check Specific Components
```bash
# Test individual components
node scripts/audit-inventory-dashboard.js
node scripts/test-transfer-system.js
node scripts/test-cost-tracking.js
node scripts/test-production-readiness.js
```

### Database Health Check
```sql
-- Check data consistency
SELECT 
  p.name,
  COUNT(pl.id) as location_count,
  SUM(pl.stock) as total_stock
FROM products p
LEFT JOIN product_locations pl ON p.id = pl.productId
GROUP BY p.id, p.name
HAVING location_count = 0 OR total_stock < 0;
```

## Performance Optimization

### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_locations_product_id ON product_locations(productId);
CREATE INDEX IF NOT EXISTS idx_product_locations_location_id ON product_locations(locationId);
CREATE INDEX IF NOT EXISTS idx_inventory_audits_product_id ON inventory_audits(productId);
CREATE INDEX IF NOT EXISTS idx_inventory_audits_timestamp ON inventory_audits(timestamp);
```

### API Optimization
```javascript
// Implement caching for frequently accessed data
const cache = new Map();

async function getCachedInventory(locationId) {
  const cacheKey = `inventory_${locationId}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const data = await fetchInventoryFromDB(locationId);
  cache.set(cacheKey, data);
  setTimeout(() => cache.delete(cacheKey), 60000); // 1 minute cache
  
  return data;
}
```

## Monitoring and Alerts

### Set Up Monitoring
```javascript
// Monitor API response times
const startTime = Date.now();
const response = await fetch('/api/inventory');
const responseTime = Date.now() - startTime;

if (responseTime > 1000) {
  console.warn(`Slow API response: ${responseTime}ms`);
}
```

### Error Tracking
```javascript
// Track inventory errors
try {
  await adjustInventory(productId, locationId, quantity);
} catch (error) {
  console.error('Inventory adjustment failed:', {
    productId,
    locationId,
    quantity,
    error: error.message,
    timestamp: new Date().toISOString()
  });
  
  // Send to monitoring service
  sendToMonitoring('inventory_error', error);
}
```

## Emergency Procedures

### System Down
1. **Check application status**
2. **Verify database connectivity**
3. **Review recent deployments**
4. **Rollback if necessary**

### Data Corruption
1. **Stop all inventory operations**
2. **Backup current state**
3. **Restore from last known good backup**
4. **Verify data integrity**
5. **Resume operations**

### Performance Issues
1. **Identify bottlenecks**
2. **Scale resources if needed**
3. **Optimize queries**
4. **Implement caching**

## Contact Information

### Escalation Levels

**Level 1 - General Issues:**
- Check this troubleshooting guide
- Run diagnostic scripts
- Review recent changes

**Level 2 - Technical Issues:**
- Contact: tech-support@vanityerp.com
- Include: Error messages, steps to reproduce, system logs

**Level 3 - Critical Issues:**
- Contact: emergency@vanityerp.com
- Include: Impact assessment, business urgency, attempted solutions

**Level 4 - Emergency:**
- Phone: [Emergency Number]
- Available: 24/7 for critical system failures

## Prevention Best Practices

### Regular Maintenance
- **Daily:** Monitor system health and error rates
- **Weekly:** Review audit trails and data consistency
- **Monthly:** Performance optimization and capacity planning
- **Quarterly:** Full system audit and disaster recovery testing

### Code Quality
- Always test inventory changes in staging first
- Use atomic transactions for multi-step operations
- Implement comprehensive error handling
- Maintain audit trails for all changes

### Data Integrity
- Regular database backups
- Periodic data validation
- Monitor for anomalies
- Implement data consistency checks

---

**Last Updated:** December 2024  
**Version:** 1.0  
**Status:** ✅ Production Ready
