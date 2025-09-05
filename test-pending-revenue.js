// Test script to check pending revenue calculation
console.log('🧪 TESTING PENDING REVENUE CALCULATION');

// Test the appointment data and revenue calculation
function testPendingRevenue() {
  try {
    // Get appointments from localStorage
    const appointmentsData = localStorage.getItem('vanity_appointments');
    console.log('📊 Raw appointments data from localStorage:', appointmentsData);
    
    if (appointmentsData) {
      const appointments = JSON.parse(appointmentsData);
      console.log('📊 Parsed appointments:', appointments);
      
      // Filter for pending appointments (confirmed, arrived, service-started)
      const pendingStatuses = ['confirmed', 'arrived', 'service-started'];
      const pendingAppointments = appointments.filter(apt => 
        pendingStatuses.includes(apt.status)
      );
      
      console.log('📊 Pending appointments found:', pendingAppointments.length);
      
      pendingAppointments.forEach((apt, index) => {
        console.log(`📊 PENDING APPOINTMENT ${index + 1}:`, {
          id: apt.id,
          clientName: apt.clientName,
          service: apt.service,
          serviceId: apt.serviceId,
          status: apt.status,
          price: apt.price,
          priceType: typeof apt.price,
          location: apt.location,
          date: apt.date
        });
        
        // Test revenue calculation
        let revenue = 0;
        if (typeof apt.price === 'number' && apt.price > 0) {
          revenue = apt.price;
          console.log(`✅ Using appointment price: ${revenue}`);
        } else {
          console.log(`❌ No valid price found for appointment ${apt.id}`);
          
          // Try fallback based on service name
          const serviceName = apt.service?.toLowerCase() || '';
          if (serviceName.includes('color') || serviceName.includes('highlight')) {
            revenue = 150;
            console.log(`🔄 Using fallback color price: ${revenue}`);
          } else if (serviceName.includes('haircut') || serviceName.includes('cut')) {
            revenue = 75;
            console.log(`🔄 Using fallback haircut price: ${revenue}`);
          } else {
            revenue = 50;
            console.log(`🔄 Using generic fallback price: ${revenue}`);
          }
        }
        
        console.log(`💰 Revenue for ${apt.clientName}: ${revenue}`);
      });
      
      // Calculate total pending revenue
      const totalPendingRevenue = pendingAppointments.reduce((total, apt) => {
        let revenue = 0;
        if (typeof apt.price === 'number' && apt.price > 0) {
          revenue = apt.price;
        } else {
          const serviceName = apt.service?.toLowerCase() || '';
          if (serviceName.includes('color') || serviceName.includes('highlight')) {
            revenue = 150;
          } else if (serviceName.includes('haircut') || serviceName.includes('cut')) {
            revenue = 75;
          } else {
            revenue = 50;
          }
        }
        return total + revenue;
      }, 0);
      
      console.log('💰 TOTAL PENDING REVENUE:', totalPendingRevenue);
      console.log('📊 PENDING APPOINTMENT COUNT:', pendingAppointments.length);
      
    } else {
      console.log('❌ No appointments found in localStorage');
    }
    
  } catch (error) {
    console.error('❌ Error testing pending revenue:', error);
  }
}

// Run the test
testPendingRevenue();

// Also check services data
function testServicesData() {
  try {
    const servicesData = localStorage.getItem('vanity_services');
    console.log('🔧 Raw services data from localStorage:', servicesData);
    
    if (servicesData) {
      const services = JSON.parse(servicesData);
      console.log('🔧 Parsed services:', services.map(s => ({
        id: s.id,
        name: s.name,
        price: s.price
      })));
    } else {
      console.log('❌ No services found in localStorage');
    }
  } catch (error) {
    console.error('❌ Error checking services data:', error);
  }
}

testServicesData();
