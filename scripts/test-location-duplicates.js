#!/usr/bin/env node

/**
 * Test script to verify that location duplicates have been resolved
 */

const fetch = require('node-fetch');

async function testLocationDuplicates() {
  console.log('🧪 Testing location duplicates...\n');
  
  try {
    // Fetch locations from API
    const response = await fetch('http://localhost:3000/api/locations');
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    const locations = data.locations || [];
    
    console.log(`📊 Total locations returned by API: ${locations.length}`);
    console.log('📍 Location details:');
    
    locations.forEach((location, index) => {
      console.log(`  ${index + 1}. ${location.name} (ID: ${location.id})`);
    });
    
    // Check for duplicates by name
    const locationNames = locations.map(loc => loc.name.toLowerCase().trim());
    const uniqueNames = [...new Set(locationNames)];
    
    console.log(`\n🔍 Unique location names: ${uniqueNames.length}`);
    console.log(`🔍 Total location entries: ${locations.length}`);
    
    if (uniqueNames.length === locations.length) {
      console.log('✅ SUCCESS: No duplicate locations found!');
      console.log('✅ All locations have unique names.');
    } else {
      console.log('❌ FAILURE: Duplicate locations detected!');
      
      // Find duplicates
      const duplicates = locationNames.filter((name, index) => 
        locationNames.indexOf(name) !== index
      );
      
      console.log('❌ Duplicate location names:', [...new Set(duplicates)]);
    }
    
    // Expected locations
    const expectedLocations = [
      'D-ring road',
      'Home service', 
      'Medinat Khalifa',
      'Muaither',
      'Online store'
    ];
    
    console.log('\n🎯 Expected locations:');
    expectedLocations.forEach((name, index) => {
      const found = locations.find(loc => 
        loc.name.toLowerCase().trim() === name.toLowerCase().trim()
      );
      if (found) {
        console.log(`  ✅ ${name} (ID: ${found.id})`);
      } else {
        console.log(`  ❌ ${name} - NOT FOUND`);
      }
    });
    
    if (locations.length === 5 && uniqueNames.length === 5) {
      console.log('\n🎉 PERFECT: Exactly 5 unique locations as expected!');
      return true;
    } else {
      console.log(`\n⚠️  WARNING: Expected 5 unique locations, got ${uniqueNames.length}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error testing location duplicates:', error.message);
    return false;
  }
}

// Run the test
testLocationDuplicates()
  .then((success) => {
    if (success) {
      console.log('\n✅ Location duplicate test PASSED!');
      process.exit(0);
    } else {
      console.log('\n❌ Location duplicate test FAILED!');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });
