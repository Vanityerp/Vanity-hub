// Debug and Fix Role Editing Issue
console.log('🔧 Debugging role editing issue...');

// Function to check current user data
function checkCurrentUserData() {
  console.log('📊 Checking current user data...');
  
  // Check localStorage for user data
  const storedUsers = localStorage.getItem('vanity_users');
  if (storedUsers) {
    const users = JSON.parse(storedUsers);
    console.log('👥 Users in localStorage:', users);
    
    const tsedey = users.find(user => user.name.toLowerCase().includes('tsedey'));
    if (tsedey) {
      console.log('👤 Tsedey user data:', tsedey);
      console.log('🎭 Current role:', tsedey.role);
    }
  }
  
  // Check if UnifiedStaffService is available
  if (typeof window !== 'undefined' && window.UnifiedStaffService) {
    console.log('🔧 UnifiedStaffService available');
    const users = window.UnifiedStaffService.getUsers();
    console.log('👥 Users from service:', users);
  }
}

// Function to manually update user role
function manuallyUpdateUserRole(userName, newRole) {
  console.log(`🔄 Manually updating ${userName} role to ${newRole}...`);
  
  try {
    // Update in localStorage
    const storedUsers = localStorage.getItem('vanity_users');
    if (storedUsers) {
      const users = JSON.parse(storedUsers);
      const userIndex = users.findIndex(user => 
        user.name.toLowerCase().includes(userName.toLowerCase())
      );
      
      if (userIndex !== -1) {
        const oldRole = users[userIndex].role;
        users[userIndex].role = newRole;
        users[userIndex].updatedAt = new Date().toISOString();
        
        localStorage.setItem('vanity_users', JSON.stringify(users));
        
        console.log(`✅ Updated ${userName} role from ${oldRole} to ${newRole}`);
        console.log('🔄 Refreshing page to reflect changes...');
        
        // Trigger a page refresh to show changes
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
        return true;
      } else {
        console.log(`❌ User ${userName} not found`);
        return false;
      }
    }
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    return false;
  }
}

// Function to test role update API
async function testRoleUpdateAPI(userId, newRole) {
  console.log(`🧪 Testing role update API for user ${userId}...`);
  
  try {
    const response = await fetch(`/api/staff/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: newRole,
        updatedAt: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ API update successful:', result);
      return true;
    } else {
      const error = await response.text();
      console.log('❌ API update failed:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ API request failed:', error);
    return false;
  }
}

// Function to force UI refresh
function forceUIRefresh() {
  console.log('🔄 Forcing UI refresh...');
  
  // Trigger React state updates by dispatching events
  const event = new CustomEvent('userDataChanged', {
    detail: { timestamp: Date.now() }
  });
  window.dispatchEvent(event);
  
  // Also try to trigger a re-render by updating localStorage timestamp
  localStorage.setItem('lastUserUpdate', Date.now().toString());
}

// Main debugging function
function debugRoleEditingIssue() {
  console.log('=== DEBUGGING ROLE EDITING ISSUE ===');
  
  // Step 1: Check current data
  checkCurrentUserData();
  
  // Step 2: Check if the issue is with saving or displaying
  console.log('🔍 Checking if issue is with saving or displaying...');
  
  // Step 3: Provide manual fix options
  console.log(`
📝 MANUAL FIX OPTIONS:

1. Update Tsedey's role manually:
   window.manuallyUpdateUserRole('Tsedey', 'org_admin')

2. Test API update:
   window.testRoleUpdateAPI('tsedey-user-id', 'org_admin')

3. Force UI refresh:
   window.forceUIRefresh()

4. Check current data:
   window.checkCurrentUserData()
  `);
}

// Export functions for manual use
window.debugRoleEditingIssue = debugRoleEditingIssue;
window.checkCurrentUserData = checkCurrentUserData;
window.manuallyUpdateUserRole = manuallyUpdateUserRole;
window.testRoleUpdateAPI = testRoleUpdateAPI;
window.forceUIRefresh = forceUIRefresh;

// Auto-run debugging
debugRoleEditingIssue();

// Also provide a quick fix for Tsedey specifically
window.fixTsedeyRole = function() {
  console.log('🔧 Quick fix for Tsedey role...');
  return manuallyUpdateUserRole('Tsedey', 'org_admin');
};

console.log(`
=== ROLE EDITING DEBUG LOADED ===

Quick fix for Tsedey:
window.fixTsedeyRole()

Other available functions:
- window.checkCurrentUserData()
- window.manuallyUpdateUserRole(name, role)
- window.forceUIRefresh()

The debugging tools are ready to help identify the issue!
`);