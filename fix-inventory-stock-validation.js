/**
 * Fix script for Inventory Stock Validation Issues
 * This script cleans up stock data to resolve validation errors
 */

console.log('🔧 FIX: Starting inventory stock validation fix...');

// Function to clean up stock data
function cleanupStockData() {
  try {
    console.log('🧹 Cleaning up inventory stock data...');
    
    // Get products from localStorage
    const products = JSON.parse(localStorage.getItem('vanity_products') || '[]');
    console.log(`📊 Found ${products.length} products to check`);
    
    let issuesFixed = 0;
    let productsUpdated = 0;
    
    const cleanedProducts = products.map(product => {
      let productUpdated = false;
      const cleanedProduct = { ...product };
      
      // Ensure locations array exists
      if (!cleanedProduct.locations) {
        cleanedProduct.locations = [];
        productUpdated = true;
        issuesFixed++;
        console.log(`✅ Added missing locations array for product: ${product.name}`);
      }
      
      // Clean up location stock data
      if (cleanedProduct.locations && Array.isArray(cleanedProduct.locations)) {
        cleanedProduct.locations = cleanedProduct.locations.map(location => {
          const cleanedLocation = { ...location };
          let locationUpdated = false;
          
          // Fix negative stock
          if (cleanedLocation.stock < 0) {
            console.log(`🔧 Fixed negative stock for ${product.name} at location ${location.locationId}: ${location.stock} → 0`);
            cleanedLocation.stock = 0;
            locationUpdated = true;
            issuesFixed++;
          }
          
          // Fix non-integer stock
          if (cleanedLocation.stock !== Math.floor(cleanedLocation.stock)) {
            const originalStock = cleanedLocation.stock;
            cleanedLocation.stock = Math.floor(cleanedLocation.stock);
            console.log(`🔧 Fixed non-integer stock for ${product.name} at location ${location.locationId}: ${originalStock} → ${cleanedLocation.stock}`);
            locationUpdated = true;
            issuesFixed++;
          }
          
          // Ensure stock is a number
          if (typeof cleanedLocation.stock !== 'number' || isNaN(cleanedLocation.stock)) {
            console.log(`🔧 Fixed invalid stock type for ${product.name} at location ${location.locationId}: ${location.stock} → 0`);
            cleanedLocation.stock = 0;
            locationUpdated = true;
            issuesFixed++;
          }
          
          if (locationUpdated) {
            productUpdated = true;
          }
          
          return cleanedLocation;
        });
      }
      
      // Clean up main product stock (fallback)
      if (cleanedProduct.stock) {
        if (cleanedProduct.stock < 0) {
          console.log(`🔧 Fixed negative main stock for ${product.name}: ${product.stock} → 0`);
          cleanedProduct.stock = 0;
          productUpdated = true;
          issuesFixed++;
        }
        
        if (cleanedProduct.stock !== Math.floor(cleanedProduct.stock)) {
          const originalStock = cleanedProduct.stock;
          cleanedProduct.stock = Math.floor(cleanedProduct.stock);
          console.log(`🔧 Fixed non-integer main stock for ${product.name}: ${originalStock} → ${cleanedProduct.stock}`);
          productUpdated = true;
          issuesFixed++;
        }
        
        if (typeof cleanedProduct.stock !== 'number' || isNaN(cleanedProduct.stock)) {
          console.log(`🔧 Fixed invalid main stock type for ${product.name}: ${product.stock} → 0`);
          cleanedProduct.stock = 0;
          productUpdated = true;
          issuesFixed++;
        }
      }
      
      if (productUpdated) {
        productsUpdated++;
      }
      
      return cleanedProduct;
    });
    
    // Save cleaned products back to localStorage
    localStorage.setItem('vanity_products', JSON.stringify(cleanedProducts));
    
    console.log(`✅ Stock data cleanup completed:
    - Products checked: ${products.length}
    - Products updated: ${productsUpdated}
    - Issues fixed: ${issuesFixed}
    `);
    
    return {
      productsChecked: products.length,
      productsUpdated,
      issuesFixed
    };
    
  } catch (error) {
    console.error('💥 Error during stock data cleanup:', error);
    return {
      productsChecked: 0,
      productsUpdated: 0,
      issuesFixed: 0,
      error: error.message
    };
  }
}

// Function to validate current stock data
function validateCurrentStockData() {
  try {
    console.log('🔍 Validating current stock data...');
    
    const products = JSON.parse(localStorage.getItem('vanity_products') || '[]');
    let issuesFound = 0;
    const issues = [];
    
    products.forEach(product => {
      if (!product.locations || !Array.isArray(product.locations)) {
        issues.push(`${product.name}: Missing or invalid locations array`);
        issuesFound++;
        return;
      }
      
      product.locations.forEach(location => {
        // Check for negative stock
        if (location.stock < 0) {
          issues.push(`${product.name} at location ${location.locationId}: Negative stock (${location.stock})`);
          issuesFound++;
        }
        
        // Check for non-integer stock
        if (location.stock !== Math.floor(location.stock)) {
          issues.push(`${product.name} at location ${location.locationId}: Non-integer stock (${location.stock})`);
          issuesFound++;
        }
        
        // Check for invalid stock type
        if (typeof location.stock !== 'number' || isNaN(location.stock)) {
          issues.push(`${product.name} at location ${location.locationId}: Invalid stock type (${typeof location.stock})`);
          issuesFound++;
        }
      });
      
      // Check main product stock if it exists
      if (product.stock !== undefined) {
        if (product.stock < 0) {
          issues.push(`${product.name}: Negative main stock (${product.stock})`);
          issuesFound++;
        }
        
        if (product.stock !== Math.floor(product.stock)) {
          issues.push(`${product.name}: Non-integer main stock (${product.stock})`);
          issuesFound++;
        }
        
        if (typeof product.stock !== 'number' || isNaN(product.stock)) {
          issues.push(`${product.name}: Invalid main stock type (${typeof product.stock})`);
          issuesFound++;
        }
      }
    });
    
    if (issuesFound === 0) {
      console.log(`✅ Stock validation passed for ${products.length} product(s)`);
    } else {
      console.error(`❌ Stock validation found ${issuesFound} issue(s):`);
      issues.forEach(issue => console.error(`  - ${issue}`));
    }
    
    return {
      productsChecked: products.length,
      issuesFound,
      issues
    };
    
  } catch (error) {
    console.error('💥 Error during stock validation:', error);
    return {
      productsChecked: 0,
      issuesFound: 0,
      issues: [],
      error: error.message
    };
  }
}

// Function to add default stock to products missing location data
function addDefaultStockToProducts() {
  try {
    console.log('📦 Adding default stock to products missing location data...');
    
    const products = JSON.parse(localStorage.getItem('vanity_products') || '[]');
    
    // Get active locations (you might need to adjust this based on your setup)
    const defaultLocations = [
      { id: 'loc1', name: 'D-Ring Road' },
      { id: 'loc2', name: 'Muaither' },
      { id: 'loc3', name: 'Medinat Khalifa' },
      { id: 'loc4', name: 'Online Store' }
    ];
    
    let productsUpdated = 0;
    
    const updatedProducts = products.map(product => {
      let productUpdated = false;
      const updatedProduct = { ...product };
      
      // Ensure locations array exists
      if (!updatedProduct.locations || !Array.isArray(updatedProduct.locations)) {
        updatedProduct.locations = [];
        productUpdated = true;
      }
      
      // Add missing locations with default stock
      defaultLocations.forEach(defaultLocation => {
        const existingLocation = updatedProduct.locations.find(loc => loc.locationId === defaultLocation.id);
        
        if (!existingLocation) {
          updatedProduct.locations.push({
            id: `${product.id}-${defaultLocation.id}`,
            productId: product.id,
            locationId: defaultLocation.id,
            stock: 0, // Default to 0 stock
            isActive: true,
            location: {
              id: defaultLocation.id,
              name: defaultLocation.name
            }
          });
          productUpdated = true;
          console.log(`📦 Added default location ${defaultLocation.name} to product ${product.name}`);
        }
      });
      
      if (productUpdated) {
        productsUpdated++;
      }
      
      return updatedProduct;
    });
    
    // Save updated products
    localStorage.setItem('vanity_products', JSON.stringify(updatedProducts));
    
    console.log(`✅ Added default stock locations to ${productsUpdated} products`);
    
    return {
      productsChecked: products.length,
      productsUpdated
    };
    
  } catch (error) {
    console.error('💥 Error adding default stock:', error);
    return {
      productsChecked: 0,
      productsUpdated: 0,
      error: error.message
    };
  }
}

// Main fix function
function runStockValidationFix() {
  console.log('🚀 Running complete stock validation fix...');
  
  // Step 1: Validate current data to see issues
  console.log('\n📊 Step 1: Validating current stock data...');
  const validationBefore = validateCurrentStockData();
  
  // Step 2: Add default locations if needed
  console.log('\n📦 Step 2: Adding default locations...');
  const defaultStockResult = addDefaultStockToProducts();
  
  // Step 3: Clean up stock data
  console.log('\n🧹 Step 3: Cleaning up stock data...');
  const cleanupResult = cleanupStockData();
  
  // Step 4: Validate after cleanup
  console.log('\n✅ Step 4: Validating after cleanup...');
  const validationAfter = validateCurrentStockData();
  
  console.log(`\n📊 STOCK VALIDATION FIX SUMMARY:
  
  Before Fix:
  - Products checked: ${validationBefore.productsChecked}
  - Issues found: ${validationBefore.issuesFound}
  
  Actions Taken:
  - Products with default locations added: ${defaultStockResult.productsUpdated}
  - Products with stock issues fixed: ${cleanupResult.productsUpdated}
  - Total issues resolved: ${cleanupResult.issuesFixed}
  
  After Fix:
  - Products checked: ${validationAfter.productsChecked}
  - Issues remaining: ${validationAfter.issuesFound}
  
  🔄 Next steps:
  1. Refresh the inventory page
  2. Check if validation errors are resolved
  3. If issues persist, check browser console for details
  `);
  
  return {
    before: validationBefore,
    cleanup: cleanupResult,
    defaultStock: defaultStockResult,
    after: validationAfter
  };
}

// Export functions for manual use
if (typeof window !== 'undefined') {
  window.cleanupStockData = cleanupStockData;
  window.validateCurrentStockData = validateCurrentStockData;
  window.addDefaultStockToProducts = addDefaultStockToProducts;
  window.runStockValidationFix = runStockValidationFix;
}

console.log('🔧 Available fix functions:');
console.log('- cleanupStockData()');
console.log('- validateCurrentStockData()');
console.log('- addDefaultStockToProducts()');
console.log('- runStockValidationFix()');

// Auto-run the fix
runStockValidationFix();