// Clean up all test data from the VanityERP system
const fetch = require('node-fetch');
const fs = require('fs');

async function cleanupTestData() {
  try {
    console.log('🧹 Cleaning Up Test Data from VanityERP System...');
    console.log('='.repeat(60));
    
    // Load cleanup data
    const cleanupData = JSON.parse(fs.readFileSync('cleanup-data.json', 'utf8'));
    
    console.log(`\n🗑️ Removing ${cleanupData.testServiceIds.length} test services...`);
    
    // Remove test services
    let removedServices = 0;
    for (const serviceId of cleanupData.testServiceIds) {
      try {
        const response = await fetch(`http://localhost:3000/api/services/${serviceId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          console.log(`   ✅ Removed service: ${serviceId}`);
          removedServices++;
        } else {
          console.log(`   ❌ Failed to remove service: ${serviceId} (${response.status})`);
        }
      } catch (error) {
        console.log(`   ❌ Error removing service ${serviceId}:`, error.message);
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📂 Removing ${cleanupData.testCategoryIds.length} test categories...`);
    
    // Remove test categories
    let removedCategories = 0;
    for (const categoryId of cleanupData.testCategoryIds) {
      try {
        const response = await fetch(`http://localhost:3000/api/service-categories/${categoryId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          console.log(`   ✅ Removed category: ${categoryId}`);
          removedCategories++;
        } else {
          console.log(`   ❌ Failed to remove category: ${categoryId} (${response.status})`);
        }
      } catch (error) {
        console.log(`   ❌ Error removing category ${categoryId}:`, error.message);
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Verify cleanup
    console.log('\n🔍 Verifying cleanup...');
    
    const servicesResponse = await fetch('http://localhost:3000/api/services');
    const servicesData = await servicesResponse.json();
    
    const categoriesResponse = await fetch('http://localhost:3000/api/service-categories');
    const categoriesData = await categoriesResponse.json();
    
    console.log(`\n📊 Cleanup Results:`);
    console.log(`   Services removed: ${removedServices}/${cleanupData.testServiceIds.length}`);
    console.log(`   Categories removed: ${removedCategories}/${cleanupData.testCategoryIds.length}`);
    console.log(`   Remaining services: ${servicesData.services.length}`);
    console.log(`   Remaining categories: ${categoriesData.categories.length}`);
    
    if (servicesData.services.length === 0 && categoriesData.categories.length === 0) {
      console.log('\n✅ SUCCESS: All test data has been removed!');
      console.log('   The system is now clean and ready for production data.');
    } else {
      console.log('\n⚠️ WARNING: Some data may still remain:');
      if (servicesData.services.length > 0) {
        console.log('   Remaining services:');
        servicesData.services.forEach(service => {
          console.log(`     - ${service.name} (${service.id})`);
        });
      }
      if (categoriesData.categories.length > 0) {
        console.log('   Remaining categories:');
        categoriesData.categories.forEach(category => {
          console.log(`     - ${category.name} (${category.id})`);
        });
      }
    }
    
    console.log('\n🎯 Next Step: Create realistic beauty salon service categories and data');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

cleanupTestData();
