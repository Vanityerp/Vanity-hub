// Analyze current system data to identify test data for cleanup
const fetch = require('node-fetch');

async function analyzeCurrentData() {
  try {
    console.log('🔍 Analyzing Current VanityERP System Data...');
    console.log('='.repeat(60));
    
    // Get all services
    console.log('\n📋 Current Services:');
    const servicesResponse = await fetch('http://localhost:3000/api/services');
    const servicesData = await servicesResponse.json();
    
    console.log(`Total services: ${servicesData.services.length}`);
    
    // Identify test services
    const testKeywords = ['test', 'debug', 'final', 'form persistence', 'client portal test', 'comprehensive test', 'edit dialog test', 'hide prices'];
    const testServices = [];
    const productionServices = [];
    
    servicesData.services.forEach(service => {
      const isTestService = testKeywords.some(keyword => 
        service.name.toLowerCase().includes(keyword)
      );
      
      if (isTestService) {
        testServices.push(service);
      } else {
        productionServices.push(service);
      }
    });
    
    console.log(`\n🧪 Test Services to Remove (${testServices.length}):`);
    testServices.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name} (ID: ${service.id})`);
      console.log(`      Category: ${service.category}`);
      console.log(`      Price: ${service.price} QAR`);
      console.log(`      Duration: ${service.duration} min`);
      console.log(`      showPrices: ${service.showPrices}`);
      console.log('');
    });
    
    console.log(`\n✅ Production Services to Keep (${productionServices.length}):`);
    productionServices.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name} (ID: ${service.id})`);
      console.log(`      Category: ${service.category}`);
      console.log(`      Price: ${service.price} QAR`);
      console.log('');
    });
    
    // Get all categories
    console.log('\n📂 Current Service Categories:');
    const categoriesResponse = await fetch('http://localhost:3000/api/service-categories');
    const categoriesData = await categoriesResponse.json();
    
    console.log(`Total categories: ${categoriesData.categories.length}`);
    
    const testCategories = [];
    const productionCategories = [];
    
    categoriesData.categories.forEach(category => {
      const isTestCategory = testKeywords.some(keyword => 
        category.name.toLowerCase().includes(keyword)
      );
      
      if (isTestCategory) {
        testCategories.push(category);
      } else {
        productionCategories.push(category);
      }
    });
    
    console.log(`\n🧪 Test Categories to Remove (${testCategories.length}):`);
    testCategories.forEach((category, index) => {
      console.log(`   ${index + 1}. ${category.name} (ID: ${category.id})`);
      console.log(`      Description: ${category.description || 'No description'}`);
      console.log(`      Service Count: ${category.serviceCount || 0}`);
      console.log('');
    });
    
    console.log(`\n✅ Production Categories to Keep (${productionCategories.length}):`);
    productionCategories.forEach((category, index) => {
      console.log(`   ${index + 1}. ${category.name} (ID: ${category.id})`);
      console.log(`      Description: ${category.description || 'No description'}`);
      console.log(`      Service Count: ${category.serviceCount || 0}`);
      console.log('');
    });
    
    // Get locations for reference
    console.log('\n📍 Current Locations:');
    const locationsResponse = await fetch('http://localhost:3000/api/locations');
    const locationsData = await locationsResponse.json();
    
    locationsData.locations.forEach((location, index) => {
      console.log(`   ${index + 1}. ${location.name} (${location.id}) - ${location.isActive ? 'Active' : 'Inactive'}`);
    });
    
    // Summary
    console.log('\n📊 Cleanup Summary:');
    console.log(`   Services to remove: ${testServices.length}`);
    console.log(`   Services to keep: ${productionServices.length}`);
    console.log(`   Categories to remove: ${testCategories.length}`);
    console.log(`   Categories to keep: ${productionCategories.length}`);
    console.log(`   Total locations: ${locationsData.locations.length}`);
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Remove all test services and categories');
    console.log('2. Create realistic beauty salon service categories');
    console.log('3. Populate with authentic service data');
    console.log('4. Configure proper settings for each service');
    
    // Save IDs for cleanup script
    const cleanupData = {
      testServiceIds: testServices.map(s => s.id),
      testCategoryIds: testCategories.map(c => c.id),
      productionServices: productionServices,
      productionCategories: productionCategories,
      locations: locationsData.locations
    };
    
    require('fs').writeFileSync('cleanup-data.json', JSON.stringify(cleanupData, null, 2));
    console.log('\n💾 Cleanup data saved to cleanup-data.json');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

analyzeCurrentData();
