// Simple Login Fix Script
console.log('🔧 Fixing login issue...');

async function createDemoUser() {
  try {
    console.log('👤 Creating demo user...');
    
    // Try to create user via register API
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@vanityhub.com',
        password: 'admin123',
        firstName: 'Demo',
        lastName: 'Admin'
      })
    });
    
    if (response.ok) {
      console.log('✅ Demo user created successfully');
      return true;
    } else {
      const error = await response.text();
      console.log('⚠️ Response:', error);
      
      // If user already exists, that's fine
      if (error.includes('already registered')) {
        console.log('✅ Demo user already exists');
        return true;
      }
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error creating demo user:', error);
    return false;
  }
}

// Run the fix
createDemoUser().then(success => {
  if (success) {
    console.log(`
=== LOGIN FIX COMPLETE ===

✅ Demo credentials are ready:
   Email: admin@vanityhub.com
   Password: admin123

Try logging in now!

If login still fails:
1. Check if the database is running
2. Verify NextAuth configuration
3. Check browser console for errors
    `);
  } else {
    console.log(`
❌ LOGIN FIX FAILED

Please check:
1. Database connection
2. API endpoints are working
3. Network connectivity

You may need to manually create a user in the database.
    `);
  }
});

// Export for manual use
window.createDemoUser = createDemoUser;