async function testLogin() {
  try {
    console.log('🔍 Testing login API...')
    
    // Test the custom auth endpoint first
    const testAuthResponse = await fetch('http://localhost:3001/api/test-auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@vanityhub.com',
        password: 'admin123'
      })
    })
    
    const testAuthResult = await testAuthResponse.json()
    console.log('🧪 Test auth result:', testAuthResult)
    
    // Test NextAuth CSRF
    const csrfResponse = await fetch('http://localhost:3001/api/auth/csrf')
    const csrfData = await csrfResponse.json()
    console.log('🔐 CSRF token:', csrfData)
    
    // Test NextAuth providers
    const providersResponse = await fetch('http://localhost:3001/api/auth/providers')
    const providersData = await providersResponse.json()
    console.log('🔌 Providers:', providersData)
    
    // Test NextAuth session
    const sessionResponse = await fetch('http://localhost:3001/api/auth/session')
    const sessionData = await sessionResponse.json()
    console.log('👤 Current session:', sessionData)
    
    // Test NextAuth signin
    const signinResponse = await fetch('http://localhost:3001/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'admin@vanityhub.com',
        password: 'admin123',
        csrfToken: csrfData.csrfToken,
        callbackUrl: 'http://localhost:3001/dashboard',
        json: 'true'
      })
    })
    
    console.log('🔑 Signin response status:', signinResponse.status)
    console.log('🔑 Signin response headers:', Object.fromEntries(signinResponse.headers.entries()))
    
    const signinResult = await signinResponse.text()
    console.log('🔑 Signin result:', signinResult)
    
  } catch (error) {
    console.error('❌ Error testing login:', error)
  }
}

testLogin()
