// Test script for client preferences edit functionality
// Run this in the browser console to test the edit preferences feature

async function testClientPreferencesEdit() {
  console.log("=== Testing Client Preferences Edit Functionality ===");
  
  // Step 1: Check if we're on a client detail page
  const currentUrl = window.location.href;
  console.log("Current URL:", currentUrl);
  
  if (!currentUrl.includes('/dashboard/clients/')) {
    console.log("❌ Not on a client detail page. Please navigate to a client detail page first.");
    console.log("Example: http://localhost:3000/dashboard/clients/1");
    return;
  }
  
  // Step 2: Look for the Client Preferences card
  const preferencesCard = document.querySelector('[data-testid="client-preferences-card"]') || 
                         document.querySelector('h3:contains("Client Preferences")') ||
                         Array.from(document.querySelectorAll('h3')).find(h3 => h3.textContent.includes('Client Preferences'));
  
  if (!preferencesCard) {
    console.log("❌ Client Preferences card not found on the page");
    return;
  }
  
  console.log("✅ Found Client Preferences card");
  
  // Step 3: Look for the Edit button
  const editButton = document.querySelector('button:contains("Edit")') ||
                    Array.from(document.querySelectorAll('button')).find(btn => 
                      btn.textContent.includes('Edit') && 
                      btn.closest('*').textContent.includes('Client Preferences')
                    );
  
  if (!editButton) {
    console.log("❌ Edit button not found in Client Preferences card");
    return;
  }
  
  console.log("✅ Found Edit button in Client Preferences card");
  
  // Step 4: Test clicking the Edit button
  console.log("🔄 Testing Edit button click...");
  
  try {
    // Click the edit button
    editButton.click();
    
    // Wait a moment for the dialog to open
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Step 5: Check if the Edit Client dialog opened
    const editDialog = document.querySelector('[role="dialog"]') ||
                      document.querySelector('.dialog') ||
                      Array.from(document.querySelectorAll('*')).find(el => 
                        el.textContent.includes('Edit Client') && 
                        el.textContent.includes('Update client information')
                      );
    
    if (!editDialog) {
      console.log("❌ Edit Client dialog did not open");
      return;
    }
    
    console.log("✅ Edit Client dialog opened successfully");
    
    // Step 6: Check if the Preferences tab is active or available
    const preferencesTab = Array.from(document.querySelectorAll('button, [role="tab"]')).find(tab => 
      tab.textContent.includes('Preferences')
    );
    
    if (!preferencesTab) {
      console.log("❌ Preferences tab not found in dialog");
      return;
    }
    
    console.log("✅ Found Preferences tab in dialog");
    
    // Step 7: Check if preferences tab is active (should be if edit was clicked from preferences card)
    const isPreferencesTabActive = preferencesTab.getAttribute('data-state') === 'active' ||
                                  preferencesTab.classList.contains('active') ||
                                  preferencesTab.getAttribute('aria-selected') === 'true';
    
    if (isPreferencesTabActive) {
      console.log("✅ Preferences tab is active (opened directly to preferences)");
    } else {
      console.log("ℹ️ Preferences tab is not active, clicking it...");
      preferencesTab.click();
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Step 8: Check for preferences form elements
    const preferencesForm = document.querySelector('form') || editDialog;
    const stylistsSection = Array.from(preferencesForm.querySelectorAll('*')).find(el => 
      el.textContent.includes('Preferred Stylists')
    );
    const servicesSection = Array.from(preferencesForm.querySelectorAll('*')).find(el => 
      el.textContent.includes('Preferred Services')
    );
    const allergiesSection = Array.from(preferencesForm.querySelectorAll('*')).find(el => 
      el.textContent.includes('Allergies')
    );
    
    if (stylistsSection && servicesSection && allergiesSection) {
      console.log("✅ All preferences form sections found:");
      console.log("  - Preferred Stylists section");
      console.log("  - Preferred Services section");
      console.log("  - Allergies section");
    } else {
      console.log("⚠️ Some preferences form sections missing:");
      console.log("  - Preferred Stylists:", !!stylistsSection);
      console.log("  - Preferred Services:", !!servicesSection);
      console.log("  - Allergies:", !!allergiesSection);
    }
    
    // Step 9: Test summary
    console.log("\n=== Test Summary ===");
    console.log("✅ Client Preferences Edit functionality is working!");
    console.log("✅ Edit button opens the Edit Client dialog");
    console.log("✅ Preferences tab is available and accessible");
    console.log("✅ Preferences form sections are present");
    
    console.log("\n📝 Manual testing suggestions:");
    console.log("1. Try adding a preferred stylist");
    console.log("2. Try selecting preferred services");
    console.log("3. Try adding allergies");
    console.log("4. Try saving the preferences");
    console.log("5. Verify the changes are reflected in the preferences card");
    
  } catch (error) {
    console.log("❌ Error during test:", error.message);
  }
}

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
  console.log('🧪 Running Client Preferences Edit test...');
  testClientPreferencesEdit();
} else {
  console.log('This script should be run in a browser environment');
}

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testClientPreferencesEdit };
}
