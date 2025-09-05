// DEPRECATED: This file is no longer needed as we use database-only data
// All data is now persisted in the database through Prisma
// No localStorage or mock data is used

export function resetAllData() {
  console.warn('⚠️ resetAllData is deprecated - all data is now database-persisted')
  console.log('ℹ️ Use database reset commands instead: npm run db:reset')
}

export function resetStaffData() {
  console.warn('⚠️ resetStaffData is deprecated - staff data is now database-persisted')
}

export function resetProductData() {
  console.warn('⚠️ resetProductData is deprecated - product data is now database-persisted')
}

export function getDataStatus() {
  console.warn('⚠️ getDataStatus is deprecated - use database queries instead')
  return null
}

// Deprecated functions - no longer available globally
if (typeof window !== 'undefined') {
  console.log('ℹ️ Data reset functions are deprecated - use database operations instead')
}
