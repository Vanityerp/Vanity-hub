/**
 * Test script for Client Portal Appointment to Transaction Sync
 * This script tests the automatic syncing of client portal appointments to accounting transactions
 */

console.log('🧪 CLIENT PORTAL SYNC TEST: Starting test...');

// Test data - simulate a completed client portal appointment
const testClientPortalAppointment = {
  id: 'cp-test-' + Date.now(),
  bookingReference: 'VH-' + Date.now().toString().slice(-6),
  clientId: 'client-test-123',
  clientName: 'Test Client Portal User',
  staffId: 'staff-1',
  staffName: 'Sarah Johnson',
  service: 'Haircut & Style',
  serviceId: 'service-1',
  date: new Date().toISOString(),
  duration: 60,
  location: 'loc1',
  price: 75,
  notes: 'Client portal booking test',
  status: 'completed', // Important: must be completed to sync
  statusHistory: [
    {
      status: 'pending',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      updatedBy: 'Client Portal'
    },
    {
      status: 'completed',
      timestamp: new Date().toISOString(),
      updatedBy: 'Staff'
    }
  ],
  type: 'appointment',
  additionalServices: [],
  products: [],
  // Client portal specific metadata
  source: 'client_portal',
  bookedVia: 'client_portal',
  metadata: {
    source: 'client_portal',
    bookedVia: 'client_portal',
    isClientPortalBooking: true,
    // transactionSynced: false // Should be undefined initially
  },
  createdAt: new Date(Date.now() - 3600000).toISOString(),
  updatedAt: new Date().toISOString()
};

// Function to test the sync process
function testClientPortalSync() {
  try {
    console.log('📋 TEST: Creating test client portal appointment...');
    
    // Get existing appointments
    const existingAppointments = JSON.parse(localStorage.getItem('vanity_appointments') || '[]');
    
    // Add test appointment
    const updatedAppointments = [...existingAppointments, testClientPortalAppointment];
    localStorage.setItem('vanity_appointments', JSON.stringify(updatedAppointments));
    
    console.log('✅ TEST: Test appointment created:', {
      id: testClientPortalAppointment.id,
      clientName: testClientPortalAppointment.clientName,
      service: testClientPortalAppointment.service,
      status: testClientPortalAppointment.status,
      source: testClientPortalAppointment.source,
      isClientPortal: testClientPortalAppointment.metadata.isClientPortalBooking
    });
    
    // Test the sync service (if available)
    if (typeof window !== 'undefined' && window.ClientPortalTransactionSync) {
      console.log('🔄 TEST: Running sync service...');
      
      // Mock addTransaction function for testing
      const mockAddTransaction = (transaction) => {
        console.log('💰 TEST: Mock transaction created:', {
          id: transaction.id,
          amount: transaction.amount,
          source: transaction.source,
          clientName: transaction.clientName,
          description: transaction.description,
          items: transaction.items?.length || 0
        });
        
        // Add to transactions localStorage for verification
        const existingTransactions = JSON.parse(localStorage.getItem('vanity_transactions') || '[]');
        existingTransactions.push(transaction);
        localStorage.setItem('vanity_transactions', JSON.stringify(existingTransactions));
        
        return transaction;
      };
      
      const syncedCount = window.ClientPortalTransactionSync.syncClientPortalAppointments(mockAddTransaction);
      console.log(`🎉 TEST: Sync completed! ${syncedCount} appointments synced to transactions`);
      
    } else {
      console.log('⚠️ TEST: ClientPortalTransactionSync not available in this context');
      console.log('💡 TEST: This is expected in a standalone test environment');
    }
    
    // Verify the appointment was processed
    console.log('🔍 TEST: Verifying appointment data...');
    const finalAppointments = JSON.parse(localStorage.getItem('vanity_appointments') || '[]');
    const testAppointment = finalAppointments.find(a => a.id === testClientPortalAppointment.id);
    
    if (testAppointment) {
      console.log('✅ TEST: Test appointment found in storage:', {
        id: testAppointment.id,
        status: testAppointment.status,
        source: testAppointment.source,
        synced: testAppointment.metadata?.transactionSynced
      });
    } else {
      console.log('❌ TEST: Test appointment not found in storage');
    }
    
    // Check if transaction was created
    const transactions = JSON.parse(localStorage.getItem('vanity_transactions') || '[]');
    const relatedTransaction = transactions.find(tx => 
      tx.metadata?.originalAppointmentId === testClientPortalAppointment.id ||
      tx.reference?.id === testClientPortalAppointment.id
    );
    
    if (relatedTransaction) {
      console.log('✅ TEST: Related transaction found:', {
        id: relatedTransaction.id,
        amount: relatedTransaction.amount,
        source: relatedTransaction.source,
        clientName: relatedTransaction.clientName
      });
    } else {
      console.log('⚠️ TEST: No related transaction found (may need to run in app context)');
    }
    
    return {
      appointmentCreated: true,
      appointmentId: testClientPortalAppointment.id,
      transactionFound: !!relatedTransaction,
      transactionId: relatedTransaction?.id
    };
    
  } catch (error) {
    console.error('💥 TEST: Error during sync test:', error);
    return {
      appointmentCreated: false,
      error: error.message
    };
  }
}

// Function to clean up test data
function cleanupTestData() {
  try {
    console.log('🧹 TEST: Cleaning up test data...');
    
    // Remove test appointments
    const appointments = JSON.parse(localStorage.getItem('vanity_appointments') || '[]');
    const cleanedAppointments = appointments.filter(a => !a.id.startsWith('cp-test-'));
    localStorage.setItem('vanity_appointments', JSON.stringify(cleanedAppointments));
    
    // Remove test transactions
    const transactions = JSON.parse(localStorage.getItem('vanity_transactions') || '[]');
    const cleanedTransactions = transactions.filter(tx => 
      !tx.id.startsWith('TX-CONS-') || 
      !tx.metadata?.originalAppointmentId?.startsWith('cp-test-')
    );
    localStorage.setItem('vanity_transactions', JSON.stringify(cleanedTransactions));
    
    console.log('✅ TEST: Test data cleaned up');
  } catch (error) {
    console.error('💥 TEST: Error during cleanup:', error);
  }
}

// Run the test
console.log('🚀 TEST: Running client portal sync test...');
const testResult = testClientPortalSync();

console.log('📊 TEST RESULTS:', testResult);

// Instructions for manual testing
console.log(`
📋 MANUAL TESTING INSTRUCTIONS:

1. **Create a Client Portal Appointment:**
   - Go to client portal booking page
   - Complete a booking (any service/staff/time)
   - Note the booking reference number

2. **Mark Appointment as Completed:**
   - Go to dashboard appointments page
   - Find the client portal appointment
   - Change status to "Completed"

3. **Check Accounting Page:**
   - Go to dashboard/accounting
   - Select "Daily Sales" tab
   - Look for the appointment in the transactions list
   - Should show source as "Client Portal"

4. **Verify Transaction Details:**
   - Click on the transaction to view details
   - Should show all appointment information
   - Amount should match service price
   - Client name should match booking

5. **Test Sync Function:**
   - Open browser console
   - Run: useTransactions().syncClientPortalAppointments()
   - Should return number of synced appointments

🔧 TROUBLESHOOTING:
- If appointments don't appear, check browser console for errors
- Ensure appointment status is "completed"
- Try refreshing the accounting page
- Check localStorage for 'vanity_appointments' and 'vanity_transactions'
`);

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testClientPortalSync = testClientPortalSync;
  window.cleanupTestData = cleanupTestData;
}