// Debug script for in-person sales revenue calculation discrepancy
console.log('🔍 DEBUGGING IN-PERSON SALES REVENUE CALCULATION');

function debugInPersonSales() {
  try {
    // 1. Get all appointments and transactions
    const appointmentsData = localStorage.getItem('vanity_appointments');
    const transactionsData = localStorage.getItem('vanity_transactions');
    
    const appointments = appointmentsData ? JSON.parse(appointmentsData) : [];
    const transactions = transactionsData ? JSON.parse(transactionsData) : [];
    
    console.log('📊 DATA OVERVIEW:');
    console.log('- Total appointments:', appointments.length);
    console.log('- Total transactions:', transactions.length);
    
    // 2. Analyze completed appointments
    const completedAppointments = appointments.filter(apt => apt.status === 'completed');
    console.log('\n📊 COMPLETED APPOINTMENTS ANALYSIS:');
    console.log('- Completed appointments:', completedAppointments.length);
    
    let totalCompletedRevenue = 0;
    const appointmentDetails = [];
    
    completedAppointments.forEach((apt, index) => {
      // Calculate appointment revenue
      let appointmentRevenue = 0;
      
      // Main service price
      if (typeof apt.price === 'number' && apt.price > 0) {
        appointmentRevenue += apt.price;
      }
      
      // Additional services
      if (apt.additionalServices && Array.isArray(apt.additionalServices)) {
        apt.additionalServices.forEach(service => {
          if (typeof service.price === 'number' && service.price > 0) {
            appointmentRevenue += service.price;
          }
        });
      }
      
      // Products
      if (apt.products && Array.isArray(apt.products)) {
        apt.products.forEach(product => {
          if (typeof product.price === 'number' && product.price > 0) {
            const quantity = product.quantity || 1;
            appointmentRevenue += product.price * quantity;
          }
        });
      }
      
      totalCompletedRevenue += appointmentRevenue;
      
      // Find corresponding transactions
      const correspondingTransactions = transactions.filter(tx => 
        tx.reference?.type === 'appointment' && 
        tx.reference?.id === apt.id &&
        tx.status === 'completed'
      );
      
      const transactionTotal = correspondingTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      
      appointmentDetails.push({
        index: index + 1,
        id: apt.id,
        clientName: apt.clientName,
        service: apt.service,
        status: apt.status,
        calculatedRevenue: appointmentRevenue,
        hasTransactions: correspondingTransactions.length > 0,
        transactionCount: correspondingTransactions.length,
        transactionTotal: transactionTotal,
        discrepancy: appointmentRevenue - transactionTotal
      });
      
      console.log(`${index + 1}. ${apt.clientName} - ${apt.service}:`);
      console.log(`   Revenue: ${appointmentRevenue}, Transactions: ${correspondingTransactions.length}, Total: ${transactionTotal}`);
    });
    
    // 3. Analyze in-person transactions
    console.log('\n📊 IN-PERSON TRANSACTIONS ANALYSIS:');
    const inPersonTransactions = transactions.filter(tx => 
      tx.source === 'pos' || tx.source === 'calendar'
    );
    
    const inPersonServiceTransactions = inPersonTransactions.filter(tx => tx.type === 'service_sale');
    const inPersonProductTransactions = inPersonTransactions.filter(tx => tx.type === 'product_sale');
    
    const inPersonServices = inPersonServiceTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const inPersonProducts = inPersonProductTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const inPersonTotal = inPersonServices + inPersonProducts;
    
    console.log('- In-person transactions:', inPersonTransactions.length);
    console.log('- Service transactions:', inPersonServiceTransactions.length, 'Total:', inPersonServices);
    console.log('- Product transactions:', inPersonProductTransactions.length, 'Total:', inPersonProducts);
    console.log('- In-person total:', inPersonTotal);
    
    // 4. Revenue reconciliation
    console.log('\n📊 REVENUE RECONCILIATION:');
    console.log('- Completed appointment revenue (calculated):', totalCompletedRevenue);
    console.log('- In-person sales from transactions:', inPersonTotal);
    console.log('- Difference:', Math.abs(totalCompletedRevenue - inPersonTotal));
    console.log('- Match:', totalCompletedRevenue === inPersonTotal ? '✅ CORRECT' : '❌ DISCREPANCY');
    
    // 5. Identify missing transactions
    const missingTransactions = appointmentDetails.filter(apt => 
      apt.calculatedRevenue > 0 && apt.transactionCount === 0
    );
    
    if (missingTransactions.length > 0) {
      console.log('\n🔧 MISSING TRANSACTIONS:');
      console.log('- Appointments without transactions:', missingTransactions.length);
      console.log('- Missing revenue:', missingTransactions.reduce((sum, apt) => sum + apt.calculatedRevenue, 0));
      
      missingTransactions.forEach(apt => {
        console.log(`  • ${apt.clientName} - ${apt.service}: ${apt.calculatedRevenue} QAR`);
      });
    }
    
    // 6. Identify discrepancies
    const discrepancies = appointmentDetails.filter(apt => 
      apt.hasTransactions && apt.discrepancy !== 0
    );
    
    if (discrepancies.length > 0) {
      console.log('\n⚠️ REVENUE DISCREPANCIES:');
      discrepancies.forEach(apt => {
        console.log(`  • ${apt.clientName}: Expected ${apt.calculatedRevenue}, Got ${apt.transactionTotal}, Diff: ${apt.discrepancy}`);
      });
    }
    
    // 7. Summary and recommendations
    console.log('\n📋 SUMMARY:');
    console.log(`- Total completed appointments: ${completedAppointments.length}`);
    console.log(`- Appointments with transactions: ${appointmentDetails.filter(apt => apt.hasTransactions).length}`);
    console.log(`- Missing transactions: ${missingTransactions.length}`);
    console.log(`- Revenue discrepancies: ${discrepancies.length}`);
    
    if (missingTransactions.length > 0 || discrepancies.length > 0) {
      console.log('\n🔧 RECOMMENDATIONS:');
      console.log('1. Go to the appointments page and mark missing appointments as completed');
      console.log('2. Use the debug transactions page to create missing transactions');
      console.log('3. Check the transaction creation logic in appointment completion');
    }
    
    return {
      totalCompletedRevenue,
      inPersonTotal,
      difference: Math.abs(totalCompletedRevenue - inPersonTotal),
      missingTransactions: missingTransactions.length,
      discrepancies: discrepancies.length,
      isAccurate: totalCompletedRevenue === inPersonTotal
    };
    
  } catch (error) {
    console.error('❌ Error during in-person sales debug:', error);
    return null;
  }
}

// Run the debug analysis
const result = debugInPersonSales();

if (result) {
  console.log('\n🎯 FINAL RESULT:', result.isAccurate ? 'IN-PERSON SALES CALCULATION IS ACCURATE' : 'IN-PERSON SALES CALCULATION NEEDS FIXING');
} else {
  console.log('❌ Debug analysis failed');
}

console.log('\n📊 To fix discrepancies, refresh the dashboard and check the console for detailed analysis from the stats cards component.');
