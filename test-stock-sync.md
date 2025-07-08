# Stock Level Synchronization Test Plan

## Test Objective
Verify that the stock level synchronization between the professional products table and edit dialog works correctly with location-specific filtering.

## Test Scenarios

### Scenario 1: All Locations View
1. Navigate to Inventory Management page
2. Ensure location filter is set to "All Locations"
3. Go to "Professional Use" tab
4. Observe stock status in the table (should show total stock across all locations)
5. Click "Edit" on any professional product
6. Verify that the "Current Stock Level" in the dialog shows the same total stock as the table
7. Verify the description says "Total stock across all locations"

### Scenario 2: Specific Location Filter
1. Change location filter to a specific location (e.g., "D-Ring Road")
2. Observe how stock status in the table changes (should show location-specific stock)
3. Click "Edit" on the same professional product
4. Verify that the "Current Stock Level" in the dialog now shows location-specific stock
5. Verify the description says "Stock for current location filter"
6. Verify additional text appears: "Showing location-specific stock to match table view"

### Scenario 3: Location Stock Management
1. In edit mode with a specific location filter active
2. Verify that the location-specific stock fields show actual stock data from the database
3. Modify stock levels for different locations
4. Save the product
5. Verify that the table updates to reflect the new stock levels
6. Switch between location filters to verify location-specific stock is maintained

## Expected Results

### Stock Display Consistency
- ✅ Table stock status matches dialog current stock level
- ✅ Location filtering affects both table and dialog consistently
- ✅ Dialog shows appropriate context messages based on location filter

### Location-Specific Stock Tracking
- ✅ Each location maintains separate stock levels
- ✅ Stock modifications are saved per location
- ✅ Location filtering shows only relevant stock data

### UI/UX Improvements
- ✅ Clear indication when location-specific view is active
- ✅ Contextual help text explains stock display logic
- ✅ Consistent behavior between table and dialog

## Implementation Details

### Key Changes Made
1. **Enhanced NewProfessionalProductDialog Props**
   - Added `currentLocation` prop to pass location context
   - Added `getProductStock` prop to use consistent stock calculation

2. **Improved Stock Display Logic**
   - Dialog now uses the same `getProductStock` function as the table
   - Location-specific stock shown when location filter is active
   - Contextual messages explain what stock is being displayed

3. **Better Location Stock Initialization**
   - Edit mode now properly loads actual location-specific stock data
   - Fallback logic for products without location data
   - Preserves existing stock levels during edits

4. **Enhanced Product Interface**
   - Added `ProductLocation` interface to product-provider
   - Added `locations` property to Product interface
   - Ensures type safety for location-specific stock data

### Technical Implementation
- Stock calculation uses database location data when available
- Consistent `getProductStock` function used in both table and dialog
- Location context passed from inventory page to dialog
- Proper handling of "all locations" vs specific location scenarios
