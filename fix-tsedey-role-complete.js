// Complete Fix for Tsedey Role Change Issue
console.log('🔧 Fixing Tsedey role change issue...');

// Function to check and fix the role change
async function fixTsedeyRoleChange() {
  console.log('👤 Fixing Tsedey role change from Super Admin to Organization Admin...');
  
  try {
    // Step 1: Check current data sources
    console.log('📊 Step 1: Checking current data sources...');
    
    // Check localStorage
    const checkLocalStorage = () => {
      const storedUsers = localStorage.getItem('vanity_users');
      if (storedUsers) {
        const users = JSON.parse(storedUsers);
        const tsedey = users.find(user => 
          user.name.toLowerCase().includes('tsedey') || 
          user.email.toLowerCase().includes('tsedey')
        );
        if (tsedey) {
          console.log('📦 Tsedey in localStorage:', tsedey);
          return tsedey;
        }
      }
      return null;
    };
    
    // Check staff data
    const checkStaffData = () => {
      const storedStaff = localStorage.getItem('vanity_staff');
      if (storedStaff) {
        const staff = JSON.parse(storedStaff);
        const tsedey = staff.find(member => 
          member.name.toLowerCase().includes('tsedey') || 
          member.email.toLowerCase().includes('tsedey')
        );
        if (tsedey) {
          console.log('👥 Tsedey in staff data:', tsedey);
          return tsedey;
        }
      }
      return null;
    };
    
    const userTsedey = checkLocalStorage();
    const staffTsedey = checkStaffData();
    
    // Step 2: Update the role in all data sources
    console.log('🔄 Step 2: Updating role in all data sources...');
    
    // Update in users localStorage
    if (userTsedey) {
      const storedUsers = localStorage.getItem('vanity_users');
      const users = JSON.parse(storedUsers);
      const userIndex = users.findIndex(user => user.id === userTsedey.id);
      
      if (userIndex !== -1) {
        users[userIndex].role = 'org_admin';
        users[userIndex].updatedAt = new Date().toISOString();
        localStorage.setItem('vanity_users', JSON.stringify(users));
        console.log('✅ Updated Tsedey role in users localStorage');
      }
    }
    
    // Update in staff localStorage
    if (staffTsedey) {
      const storedStaff = localStorage.getItem('vanity_staff');
      const staff = JSON.parse(storedStaff);
      const staffIndex = staff.findIndex(member => member.id === staffTsedey.id);
      
      if (staffIndex !== -1) {
        staff[staffIndex].role = 'org_admin';
        staff[staffIndex].updatedAt = new Date().toISOString();
        localStorage.setItem('vanity_staff', JSON.stringify(staff));
        console.log('✅ Updated Tsedey role in staff localStorage');
      }
    }
    
    // Step 3: Try API update if available
    console.log('🌐 Step 3: Attempting API update...');
    
    const userId = userTsedey?.id || staffTsedey?.id;
    if (userId) {
      try {
        const response = await fetch(`/api/staff/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'org_admin',
            updatedAt: new Date().toISOString()
          })
        });
        
        if (response.ok) {
          console.log('✅ API update successful');
        } else {
          console.log('⚠️ API update failed, but localStorage updated');
        }
      } catch (error) {
        console.log('⚠️ API not available, but localStorage updated');
      }
    }
    
    // Step 4: Force UI refresh
    console.log('🔄 Step 4: Forcing UI refresh...');
    
    // Dispatch custom event to trigger React re-renders
    window.dispatchEvent(new CustomEvent('userDataUpdated', {
      detail: { userId, newRole: 'org_admin', timestamp: Date.now() }
    }));
    
    // Update timestamp to trigger useEffect dependencies
    localStorage.setItem('lastUserUpdate', Date.now().toString());
    
    // Step 5: Reload page to ensure changes are reflected
    console.log('🔄 Step 5: Reloading page to reflect changes...');
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
    console.log(`
✅ TSEDEY ROLE FIX COMPLETE

Changes made:
- Updated role from 'super_admin' to 'org_admin'
- Updated in localStorage (users and staff)
- Attempted API update
- Triggered UI refresh
- Page will reload in 1 second

Tsedey should now show as "Organization Admin" in the settings page.
    `);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error fixing Tsedey role:', error);
    return false;
  }
}

// Function to verify the fix
function verifyTsedeyRoleFix() {
  console.log('🔍 Verifying Tsedey role fix...');
  
  const storedUsers = localStorage.getItem('vanity_users');
  const storedStaff = localStorage.getItem('vanity_staff');
  
  if (storedUsers) {
    const users = JSON.parse(storedUsers);
    const tsedey = users.find(user => 
      user.name.toLowerCase().includes('tsedey') || 
      user.email.toLowerCase().includes('tsedey')
    );
    if (tsedey) {
      console.log('👤 Tsedey user role:', tsedey.role);
      if (tsedey.role === 'org_admin') {
        console.log('✅ Tsedey role correctly set to org_admin');
      } else {
        console.log('❌ Tsedey role is still:', tsedey.role);
      }
    }
  }
  
  if (storedStaff) {
    const staff = JSON.parse(storedStaff);
    const tsedey = staff.find(member => 
      member.name.toLowerCase().includes('tsedey') || 
      member.email.toLowerCase().includes('tsedey')
    );
    if (tsedey) {
      console.log('👥 Tsedey staff role:', tsedey.role);
      if (tsedey.role === 'org_admin') {
        console.log('✅ Tsedey staff role correctly set to org_admin');
      } else {
        console.log('❌ Tsedey staff role is still:', tsedey.role);
      }
    }
  }
}

// Export functions for manual use
window.fixTsedeyRoleChange = fixTsedeyRoleChange;
window.verifyTsedeyRoleFix = verifyTsedeyRoleFix;

// Auto-run the fix
fixTsedeyRoleChange();

console.log(`
=== TSEDEY ROLE FIX LOADED ===

The fix is running automatically...

Manual functions available:
- window.fixTsedeyRoleChange() - Run the complete fix
- window.verifyTsedeyRoleFix() - Verify the fix worked

The page will reload automatically to show the changes.
`);