// Test script for location ordering functionality
// Run this in the browser console to verify the location sequence

async function testLocationOrdering() {
  console.log("=== Testing Location Ordering ===");
  
  // Step 1: Check if we're on the appointments page
  const currentUrl = window.location.href;
  console.log("Current URL:", currentUrl);
  
  if (!currentUrl.includes('/dashboard/appointments')) {
    console.log("❌ Not on the appointments page. Please navigate to /dashboard/appointments first.");
    return;
  }
  
  // Step 2: Look for location buttons
  const locationButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
    const text = btn.textContent.toLowerCase();
    return text.includes('all') || 
           text.includes('muaither') || 
           text.includes('medinat') || 
           text.includes('d-ring') || 
           text.includes('home') || 
           text.includes('online');
  });
  
  if (locationButtons.length === 0) {
    console.log("❌ No location buttons found. Looking for alternative selectors...");
    
    // Try to find location selector dropdown
    const locationSelector = document.querySelector('[data-testid="location-selector"]') ||
                            Array.from(document.querySelectorAll('*')).find(el => 
                              el.textContent.includes('All Locations') || 
                              el.textContent.includes('Select location')
                            );
    
    if (locationSelector) {
      console.log("✅ Found location selector dropdown");
      console.log("📝 Please manually check the dropdown order by clicking on it");
      return;
    } else {
      console.log("❌ No location selector found");
      return;
    }
  }
  
  console.log(`✅ Found ${locationButtons.length} location buttons`);
  
  // Step 3: Extract button text and check order
  const buttonTexts = locationButtons.map(btn => btn.textContent.trim());
  console.log("📍 Current location button order:", buttonTexts);
  
  // Step 4: Define expected order
  const expectedOrder = [
    "All",
    "Muaither", 
    "Medinat Khalifa",
    "D-ring road", 
    "Home service",
    "Online store"
  ];
  
  console.log("📍 Expected location order:", expectedOrder);
  
  // Step 5: Check if the order matches (case-insensitive and flexible matching)
  let orderMatches = true;
  const orderComparison = [];
  
  for (let i = 0; i < Math.min(buttonTexts.length, expectedOrder.length); i++) {
    const actual = buttonTexts[i].toLowerCase();
    const expected = expectedOrder[i].toLowerCase();
    
    // Flexible matching - check if the expected text is contained in actual or vice versa
    const matches = actual.includes(expected) || expected.includes(actual) || 
                   (expected.includes('medinat') && actual.includes('medinat')) ||
                   (expected.includes('d-ring') && actual.includes('d-ring'));
    
    orderComparison.push({
      position: i + 1,
      actual: buttonTexts[i],
      expected: expectedOrder[i],
      matches: matches
    });
    
    if (!matches) {
      orderMatches = false;
    }
  }
  
  // Step 6: Display results
  console.log("\n=== Order Comparison ===");
  orderComparison.forEach(item => {
    const status = item.matches ? "✅" : "❌";
    console.log(`${status} Position ${item.position}: "${item.actual}" (expected: "${item.expected}")`);
  });
  
  if (orderMatches && buttonTexts.length === expectedOrder.length) {
    console.log("\n🎉 SUCCESS: Location order matches the expected sequence!");
    console.log("✅ Muaither → Medinat Khalifa → D-ring road → Home service → Online store");
  } else if (orderMatches) {
    console.log("\n⚠️ PARTIAL SUCCESS: Order is correct but some locations might be missing");
  } else {
    console.log("\n❌ MISMATCH: Location order does not match the expected sequence");
    console.log("📝 Please check the implementation in components/location-buttons.tsx");
  }
  
  // Step 7: Test clicking functionality
  console.log("\n=== Testing Click Functionality ===");
  
  if (locationButtons.length > 1) {
    try {
      // Test clicking the second button (should be Muaither)
      const secondButton = locationButtons[1];
      console.log(`🔄 Testing click on: "${secondButton.textContent}"`);
      
      secondButton.click();
      
      // Wait a moment and check if the button state changed
      setTimeout(() => {
        const isActive = secondButton.classList.contains('bg-black') || 
                        secondButton.classList.contains('bg-primary') ||
                        secondButton.getAttribute('data-state') === 'active';
        
        if (isActive) {
          console.log("✅ Button click functionality working - button shows active state");
        } else {
          console.log("⚠️ Button clicked but active state not clearly visible");
        }
      }, 200);
      
    } catch (error) {
      console.log("❌ Error testing button click:", error.message);
    }
  }
  
  console.log("\n=== Test Complete ===");
}

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
  console.log('🧪 Running Location Ordering test...');
  testLocationOrdering();
} else {
  console.log('This script should be run in a browser environment');
}

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testLocationOrdering };
}
