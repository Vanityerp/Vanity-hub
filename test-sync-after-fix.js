/**
 * Test script to verify client portal sync is working after TypeScript fixes
 */

console.log('🧪 TEST: Verifying client portal sync after TypeScript fixes...');

// Function to test the sync service
function testSyncService() {
  try {
    console.log('🔄 Testing sync service availability...');
    
    // Check if the transaction provider is available
    if (typeof window !== 'undefined' && window.useTransactions) {
      console.log('✅ Transaction provider is available');
      
      try {
        const { syncClientPortalAppointments } = window.useTransactions();
        
        if (typeof syncClientPortalAppointments === 'function') {
          console.log('✅ syncClientPortalAppointments function is available');
          
          // Test the sync
          console.log('🔄 Running sync test...');
          const syncedCount = syncClientPortalAppointments();
          
          console.log(`✅ Sync test completed! Synced ${syncedCount} appointments`);
          
          if (syncedCount > 0) {
            console.log('🎉 SUCCESS: Client portal appointments were synced to transactions!');
          } else {
            console.log('ℹ️ INFO: No appointments needed syncing (this is normal if all are already synced)');
          }
          
          return true;
          
        } else {
          console.error('❌ syncClientPortalAppointments function not found');
          return false;
        }
        
      } catch (syncError) {
        console.error('💥 Error during sync test:', syncError);
        return false;
      }
      
    } else {
      console.log('⚠️ Transaction provider not available. Try running this after the page loads.');
      return false;
    }
    
  } catch (error) {
    console.error('💥 Error in sync service test:', error);
    return false;
  }
}

// Function to check for client portal appointments
function checkClientPortalAppointments() {
  try {
    console.log('📋 Checking for client portal appointments...');
    
    const appointments = JSON.parse(localStorage.getItem('vanity_appointments') || '[]');
    
    const clientPortalAppointments = appointments.filter(appointment => {
      return appointment.source === 'client_portal' || 
             appointment.bookedVia === 'client_portal' ||
             appointment.metadata?.source === 'client_portal' ||
             appointment.metadata?.isClientPortalBooking === true;
    });
    
    console.log(`📊 Found ${clientPortalAppointments.length} client portal appointments`);
    
    const completedAppointments = clientPortalAppointments.filter(a => a.status === 'completed');
    console.log(`📊 Found ${completedAppointments.length} completed client portal appointments`);
    
    const unsyncedAppointments = completedAppointments.filter(a => a.metadata?.transactionSynced !== true);
    console.log(`📊 Found ${unsyncedAppointments.length} unsynced completed appointments`);
    
    if (unsyncedAppointments.length > 0) {
      console.log('🎯 Appointments ready for sync:', unsyncedAppointments.map(a => ({
        id: a.id,
        clientName: a.clientName,
        service: a.service,
        price: a.price
      })));
    }
    
    return {
      total: clientPortalAppointments.length,
      completed: completedAppointments.length,
      unsynced: unsyncedAppointments.length
    };
    
  } catch (error) {
    console.error('💥 Error checking appointments:', error);
    return null;
  }
}

// Function to check for synced transactions
function checkSyncedTransactions() {
  try {
    console.log('💳 Checking for synced transactions...');
    
    const transactions = JSON.parse(localStorage.getItem('vanity_transactions') || '[]');
    
    const clientPortalTransactions = transactions.filter(tx => 
      tx.source === 'CLIENT_PORTAL' || 
      tx.metadata?.syncedFromClientPortal === true
    );
    
    console.log(`📊 Found ${clientPortalTransactions.length} client portal transactions`);
    
    if (clientPortalTransactions.length > 0) {
      console.log('💰 Recent client portal transactions:', clientPortalTransactions.slice(-3).map(tx => ({
        id: tx.id,
        amount: tx.amount,
        clientName: tx.clientName,
        description: tx.description,
        date: tx.date
      })));
    }
    
    return clientPortalTransactions.length;
    
  } catch (error) {
    console.error('💥 Error checking transactions:', error);
    return 0;
  }
}

// Main test function
function runCompleteTest() {
  console.log('🚀 Running complete sync verification test...');
  
  // Step 1: Check appointments
  const appointmentStats = checkClientPortalAppointments();
  
  // Step 2: Check existing transactions
  const transactionCount = checkSyncedTransactions();
  
  // Step 3: Test sync service
  const syncSuccess = testSyncService();
  
  // Step 4: Check transactions again
  const newTransactionCount = checkSyncedTransactions();
  
  console.log(`\n📊 TEST RESULTS:
  - Client portal appointments: ${appointmentStats?.total || 0}
  - Completed appointments: ${appointmentStats?.completed || 0}
  - Unsynced appointments: ${appointmentStats?.unsynced || 0}
  - Transactions before sync: ${transactionCount}
  - Transactions after sync: ${newTransactionCount}
  - Sync service working: ${syncSuccess ? '✅' : '❌'}
  - New transactions created: ${newTransactionCount - transactionCount}
  `);
  
  if (syncSuccess && newTransactionCount > transactionCount) {
    console.log('🎉 SUCCESS: Client portal sync is working correctly!');
  } else if (syncSuccess && appointmentStats?.unsynced === 0) {
    console.log('✅ SUCCESS: Sync service is working (no appointments needed syncing)');
  } else {
    console.log('⚠️ Check the results above for any issues');
  }
}

// Export functions for manual testing
if (typeof window !== 'undefined') {
  window.testSyncService = testSyncService;
  window.checkClientPortalAppointments = checkClientPortalAppointments;
  window.checkSyncedTransactions = checkSyncedTransactions;
  window.runCompleteTest = runCompleteTest;
}

console.log('🔧 Available test functions:');
console.log('- testSyncService()');
console.log('- checkClientPortalAppointments()');
console.log('- checkSyncedTransactions()');
console.log('- runCompleteTest()');

// Auto-run the complete test
setTimeout(() => {
  runCompleteTest();
}, 1000); // Wait 1 second for everything to load