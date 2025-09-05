// Test script to verify user location synchronization
// Run this in the browser console to check if user locations are synced with staff locations

console.log('=== User Location Sync Test ===');

// Get staff data from localStorage
const staffData = JSON.parse(localStorage.getItem('staff') || '[]');
console.log('Staff data:', staffData.map(s => ({ name: s.name, email: s.email, locations: s.locations })));

// Get user data from localStorage
const userData = JSON.parse(localStorage.getItem('users') || '[]');
console.log('User data:', userData.map(u => ({ name: u.name, email: u.email, locations: u.locations })));

// Check synchronization
console.log('\n=== Synchronization Check ===');
let syncIssues = 0;

staffData.forEach(staff => {
  const correspondingUser = userData.find(user => user.email.toLowerCase() === staff.email.toLowerCase());
  
  if (correspondingUser) {
    const staffLocations = staff.locations || [];
    const userLocations = correspondingUser.locations || [];
    
    // Check if locations match
    const locationsMatch = staffLocations.length === userLocations.length &&
      staffLocations.every(loc => userLocations.includes(loc)) &&
      userLocations.every(loc => staffLocations.includes(loc));
    
    if (!locationsMatch) {
      console.log(`❌ SYNC ISSUE: ${staff.name}`);
      console.log(`   Staff locations: [${staffLocations.join(', ')}]`);
      console.log(`   User locations:  [${userLocations.join(', ')}]`);
      syncIssues++;
    } else {
      console.log(`✅ SYNCED: ${staff.name} - [${staffLocations.join(', ')}]`);
    }
  } else {
    console.log(`⚠️  NO USER FOUND for staff: ${staff.name} (${staff.email})`);
  }
});

console.log(`\n=== Summary ===`);
console.log(`Total staff members: ${staffData.length}`);
console.log(`Total users: ${userData.length}`);
console.log(`Sync issues found: ${syncIssues}`);

if (syncIssues === 0) {
  console.log('🎉 All user locations are synchronized with staff locations!');
} else {
  console.log('⚠️  Some user locations need to be synchronized.');
}
