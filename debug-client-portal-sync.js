/**
 * Debug script for Client Portal Sync Issues
 * This script helps diagnose why the sync is failing
 */

console.log('🔍 DEBUG: Starting client portal sync debugging...');

// Function to check appointment data
function debugAppointmentData() {
  try {
    console.log('📋 DEBUG: Checking appointment data...');
    
    // Get appointments from localStorage
    const appointments = JSON.parse(localStorage.getItem('vanity_appointments') || '[]');
    console.log(`📊 Total appointments: ${appointments.length}`);
    
    // Filter for client portal appointments
    const clientPortalAppointments = appointments.filter(appointment => {
      const isClientPortal = appointment.source === 'client_portal' || 
                            appointment.bookedVia === 'client_portal' ||
                            appointment.metadata?.source === 'client_portal' ||
                            appointment.metadata?.isClientPortalBooking === true;
      return isClientPortal;
    });
    
    console.log(`🎯 Client portal appointments: ${clientPortalAppointments.length}`);
    
    // Check each client portal appointment
    clientPortalAppointments.forEach((appointment, index) => {
      console.log(`\n📝 Appointment ${index + 1}:`, {
        id: appointment.id,
        clientName: appointment.clientName,
        service: appointment.service,
        price: appointment.price,
        status: appointment.status,
        source: appointment.source,
        bookedVia: appointment.bookedVia,
        hasMetadata: !!appointment.metadata,
        isClientPortalBooking: appointment.metadata?.isClientPortalBooking,
        transactionSynced: appointment.metadata?.transactionSynced
      });
      
      // Check for missing required fields
      const missingFields = [];
      if (!appointment.id) missingFields.push('id');
      if (!appointment.clientName) missingFields.push('clientName');
      if (!appointment.service) missingFields.push('service');
      if (!appointment.price || appointment.price <= 0) missingFields.push('price');
      if (!appointment.status) missingFields.push('status');
      
      if (missingFields.length > 0) {
        console.error(`❌ Missing required fields for appointment ${appointment.id}:`, missingFields);
      } else {
        console.log(`✅ Appointment ${appointment.id} has all required fields`);
      }
    });
    
    // Find completed client portal appointments that should be synced
    const completedUnsynced = clientPortalAppointments.filter(appointment => {
      return appointment.status === 'completed' && 
             appointment.metadata?.transactionSynced !== true;
    });
    
    console.log(`\n🎯 Completed unsynced appointments: ${completedUnsynced.length}`);
    
    return {
      totalAppointments: appointments.length,
      clientPortalAppointments: clientPortalAppointments.length,
      completedUnsynced: completedUnsynced.length,
      appointments: completedUnsynced
    };
    
  } catch (error) {
    console.error('💥 Error debugging appointment data:', error);
    return null;
  }
}

// Function to test transaction creation
function debugTransactionCreation(appointment) {
  try {
    console.log('\n💳 DEBUG: Testing transaction creation...');
    console.log('📋 Input appointment:', appointment);
    
    // Test if ConsolidatedTransactionService is available
    if (typeof window !== 'undefined' && window.ConsolidatedTransactionService) {
      console.log('✅ ConsolidatedTransactionService is available');
      
      try {
        const transaction = window.ConsolidatedTransactionService.createConsolidatedTransaction(
          appointment,
          'CREDIT_CARD', // PaymentMethod.CREDIT_CARD
          0, // No discount
          0  // No discount amount
        );
        
        console.log('✅ Transaction created successfully:', {
          id: transaction.id,
          amount: transaction.amount,
          clientName: transaction.clientName,
          description: transaction.description,
          status: transaction.status,
          type: transaction.type,
          source: transaction.source,
          hasItems: !!transaction.items,
          itemsLength: transaction.items?.length || 0
        });
        
        return transaction;
        
      } catch (createError) {
        console.error('❌ Error creating transaction:', createError);
        return null;
      }
      
    } else {
      console.log('⚠️ ConsolidatedTransactionService not available in window');
      return null;
    }
    
  } catch (error) {
    console.error('💥 Error in transaction creation test:', error);
    return null;
  }
}

// Function to test transaction validation
function debugTransactionValidation(transaction) {
  try {
    console.log('\n🔍 DEBUG: Testing transaction validation...');
    
    if (typeof window !== 'undefined' && window.transactionDeduplicationService) {
      console.log('✅ transactionDeduplicationService is available');
      
      const validation = window.transactionDeduplicationService.validateTransaction(transaction);
      
      console.log('📊 Validation result:', {
        isValid: validation.isValid,
        errors: validation.errors
      });
      
      if (!validation.isValid) {
        console.error('❌ Transaction validation failed:', validation.errors);
      } else {
        console.log('✅ Transaction validation passed');
      }
      
      return validation;
      
    } else {
      console.log('⚠️ transactionDeduplicationService not available in window');
      return null;
    }
    
  } catch (error) {
    console.error('💥 Error in transaction validation test:', error);
    return null;
  }
}

// Main debug function
function runFullDebug() {
  console.log('🚀 DEBUG: Running full client portal sync debug...');
  
  // Step 1: Check appointment data
  const appointmentData = debugAppointmentData();
  
  if (!appointmentData || appointmentData.completedUnsynced === 0) {
    console.log('ℹ️ No completed unsynced client portal appointments found');
    return;
  }
  
  // Step 2: Test transaction creation for first appointment
  const testAppointment = appointmentData.appointments[0];
  console.log(`\n🧪 Testing with appointment: ${testAppointment.id}`);
  
  const transaction = debugTransactionCreation(testAppointment);
  
  if (!transaction) {
    console.log('❌ Transaction creation failed, cannot continue');
    return;
  }
  
  // Step 3: Test transaction validation
  const validation = debugTransactionValidation(transaction);
  
  if (!validation || !validation.isValid) {
    console.log('❌ Transaction validation failed, this is likely the issue');
    return;
  }
  
  console.log('✅ All tests passed! The issue might be elsewhere.');
}

// Export functions for manual testing
if (typeof window !== 'undefined') {
  window.debugAppointmentData = debugAppointmentData;
  window.debugTransactionCreation = debugTransactionCreation;
  window.debugTransactionValidation = debugTransactionValidation;
  window.runFullDebug = runFullDebug;
}

// Auto-run debug
console.log('🔧 DEBUG: Functions available in console:');
console.log('- debugAppointmentData()');
console.log('- debugTransactionCreation(appointment)');
console.log('- debugTransactionValidation(transaction)');
console.log('- runFullDebug()');

// Run automatically
runFullDebug();