/**
 * Fix script for Client Portal Sync Error
 * This script helps resolve the sync error by cleaning up problematic data
 */

console.log('🔧 FIX: Starting client portal sync error resolution...');

// Function to clean up problematic appointments
function cleanupProblematicAppointments() {
  try {
    console.log('🧹 Cleaning up problematic appointments...');
    
    const appointments = JSON.parse(localStorage.getItem('vanity_appointments') || '[]');
    console.log(`📊 Total appointments before cleanup: ${appointments.length}`);
    
    // Find and fix appointments with missing required fields
    let fixedCount = 0;
    const cleanedAppointments = appointments.map(appointment => {
      // Check if this is a client portal appointment
      const isClientPortal = appointment.source === 'client_portal' || 
                            appointment.bookedVia === 'client_portal' ||
                            appointment.metadata?.source === 'client_portal' ||
                            appointment.metadata?.isClientPortalBooking === true;
      
      if (isClientPortal) {
        let needsFix = false;
        const fixed = { ...appointment };
        
        // Fix missing clientName
        if (!fixed.clientName && fixed.clientId) {
          fixed.clientName = `Client ${fixed.clientId}`;
          needsFix = true;
        }
        
        // Fix missing service
        if (!fixed.service && fixed.serviceId) {
          fixed.service = 'Service';
          needsFix = true;
        }
        
        // Fix missing or invalid price
        if (!fixed.price || fixed.price <= 0) {
          fixed.price = 50; // Default price
          needsFix = true;
        }
        
        // Fix missing status
        if (!fixed.status) {
          fixed.status = 'pending';
          needsFix = true;
        }
        
        // Ensure proper metadata
        if (!fixed.metadata) {
          fixed.metadata = {};
          needsFix = true;
        }
        
        if (!fixed.metadata.isClientPortalBooking) {
          fixed.metadata.isClientPortalBooking = true;
          needsFix = true;
        }
        
        if (needsFix) {
          console.log(`🔧 Fixed appointment ${appointment.id}`);
          fixedCount++;
        }
        
        return fixed;
      }
      
      return appointment;
    });
    
    // Save cleaned appointments
    localStorage.setItem('vanity_appointments', JSON.stringify(cleanedAppointments));
    
    console.log(`✅ Cleanup completed. Fixed ${fixedCount} appointments.`);
    return fixedCount;
    
  } catch (error) {
    console.error('💥 Error during cleanup:', error);
    return 0;
  }
}

// Function to reset sync status for all appointments
function resetSyncStatus() {
  try {
    console.log('🔄 Resetting sync status for all appointments...');
    
    const appointments = JSON.parse(localStorage.getItem('vanity_appointments') || '[]');
    
    const resetAppointments = appointments.map(appointment => {
      if (appointment.metadata?.transactionSynced) {
        return {
          ...appointment,
          metadata: {
            ...appointment.metadata,
            transactionSynced: false
          }
        };
      }
      return appointment;
    });
    
    localStorage.setItem('vanity_appointments', JSON.stringify(resetAppointments));
    
    console.log('✅ Sync status reset for all appointments');
    
  } catch (error) {
    console.error('💥 Error resetting sync status:', error);
  }
}

// Function to remove duplicate transactions
function removeDuplicateTransactions() {
  try {
    console.log('🧹 Removing duplicate transactions...');
    
    const transactions = JSON.parse(localStorage.getItem('vanity_transactions') || '[]');
    console.log(`📊 Total transactions before cleanup: ${transactions.length}`);
    
    // Remove duplicates based on appointment reference
    const seen = new Set();
    const uniqueTransactions = transactions.filter(tx => {
      if (tx.reference?.type === 'appointment' && tx.reference?.id) {
        const key = `${tx.reference.id}-${tx.type}-${tx.amount}`;
        if (seen.has(key)) {
          console.log(`🗑️ Removing duplicate transaction ${tx.id} for appointment ${tx.reference.id}`);
          return false;
        }
        seen.add(key);
      }
      return true;
    });
    
    localStorage.setItem('vanity_transactions', JSON.stringify(uniqueTransactions));
    
    const removedCount = transactions.length - uniqueTransactions.length;
    console.log(`✅ Removed ${removedCount} duplicate transactions`);
    
    return removedCount;
    
  } catch (error) {
    console.error('💥 Error removing duplicates:', error);
    return 0;
  }
}

// Function to manually sync a specific appointment
function manualSyncAppointment(appointmentId) {
  try {
    console.log(`🔄 Manually syncing appointment ${appointmentId}...`);
    
    const appointments = JSON.parse(localStorage.getItem('vanity_appointments') || '[]');
    const appointment = appointments.find(a => a.id === appointmentId);
    
    if (!appointment) {
      console.error(`❌ Appointment ${appointmentId} not found`);
      return false;
    }
    
    console.log('📋 Appointment data:', appointment);
    
    // Check if it's a client portal appointment
    const isClientPortal = appointment.source === 'client_portal' || 
                          appointment.bookedVia === 'client_portal' ||
                          appointment.metadata?.source === 'client_portal' ||
                          appointment.metadata?.isClientPortalBooking === true;
    
    if (!isClientPortal) {
      console.error(`❌ Appointment ${appointmentId} is not a client portal appointment`);
      return false;
    }
    
    if (appointment.status !== 'completed') {
      console.error(`❌ Appointment ${appointmentId} is not completed (status: ${appointment.status})`);
      return false;
    }
    
    // Try to use the sync service if available
    if (typeof window !== 'undefined' && window.useTransactions) {
      try {
        const { syncClientPortalAppointments } = window.useTransactions();
        const syncedCount = syncClientPortalAppointments();
        console.log(`✅ Manual sync completed. Synced ${syncedCount} appointments.`);
        return true;
      } catch (syncError) {
        console.error('💥 Error during manual sync:', syncError);
        return false;
      }
    } else {
      console.log('⚠️ Sync service not available. Try refreshing the page.');
      return false;
    }
    
  } catch (error) {
    console.error('💥 Error in manual sync:', error);
    return false;
  }
}

// Main fix function
function runFix() {
  console.log('🚀 Running complete fix for client portal sync...');
  
  // Step 1: Clean up problematic appointments
  const fixedAppointments = cleanupProblematicAppointments();
  
  // Step 2: Remove duplicate transactions
  const removedDuplicates = removeDuplicateTransactions();
  
  // Step 3: Reset sync status (optional)
  // resetSyncStatus();
  
  console.log(`\n📊 Fix Summary:
  - Fixed appointments: ${fixedAppointments}
  - Removed duplicate transactions: ${removedDuplicates}
  
  🔄 Next steps:
  1. Refresh the page
  2. Go to accounting page to check if appointments appear
  3. If issues persist, run: manualSyncAppointment('appointment-id')
  `);
}

// Export functions for manual use
if (typeof window !== 'undefined') {
  window.cleanupProblematicAppointments = cleanupProblematicAppointments;
  window.resetSyncStatus = resetSyncStatus;
  window.removeDuplicateTransactions = removeDuplicateTransactions;
  window.manualSyncAppointment = manualSyncAppointment;
  window.runClientPortalSyncFix = runFix;
}

console.log('🔧 Available fix functions:');
console.log('- cleanupProblematicAppointments()');
console.log('- resetSyncStatus()');
console.log('- removeDuplicateTransactions()');
console.log('- manualSyncAppointment(appointmentId)');
console.log('- runClientPortalSyncFix()');

// Auto-run the fix
runFix();