import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for E2E tests...')
  
  try {
    // Clean up any test data or resources
    console.log('🗑️ Cleaning up test data...')
    
    // Remove authentication files
    const fs = require('fs')
    const path = require('path')
    
    const authDir = path.join(__dirname, 'auth')
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true })
      console.log('✅ Authentication files cleaned up')
    }
    
    // Clean up any temporary files
    const tempDir = path.join(__dirname, 'temp')
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
      console.log('✅ Temporary files cleaned up')
    }
    
    console.log('✅ Global teardown completed successfully')
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw error to avoid failing the test run
  }
}

export default globalTeardown
