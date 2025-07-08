// Test script to verify client portal bookings appear in the appointment calendar
// Run this in the browser console to simulate a client portal booking

async function testClientPortalBooking() {
  console.log("Starting client portal booking test...");
  
  // Step 1: Create a test appointment
  const testAppointment = {
    clientId: "test123",
    clientName: "Test Client",
    staffId: "1",
    staffName: "Emma Johnson",
    service: "Haircut & Style",
    serviceId: "1",
    date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    duration: 60,
    location: "loc1",
    price: 75,
    notes: "Test booking from client portal",
    status: "pending",
    statusHistory: [
      {
        status: "pending",
        timestamp: new Date().toISOString(),
        updatedBy: "Client Portal"
      }
    ],
    type: "appointment",
    additionalServices: [],
    products: []
  };
  
  console.log("Test appointment data:", testAppointment);
  
  // Step 2: Simulate API call to create appointment
  try {
    const response = await fetch('/api/client-portal/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testAppointment),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to book appointment");
    }
    
    const result = await response.json();
    console.log("API response:", result);
    
    if (result.success && result.appointment) {
      console.log("Appointment created successfully:", result.appointment);
      
      // Step 3: Check if appointment was added to localStorage
      const storedAppointments = localStorage.getItem("vanity_appointments");
      if (storedAppointments) {
        const appointmentsArray = JSON.parse(storedAppointments);
        const found = appointmentsArray.some(a => a.id === result.appointment.id);
        
        console.log("Appointment found in localStorage:", found);
        console.log("Total appointments in localStorage:", appointmentsArray.length);
        
        if (found) {
          console.log("TEST PASSED: Appointment was successfully added to localStorage");
        } else {
          console.error("TEST FAILED: Appointment was not added to localStorage");
        }
      } else {
        console.error("TEST FAILED: No appointments found in localStorage");
      }
    } else {
      console.error("TEST FAILED: Appointment creation failed");
    }
  } catch (error) {
    console.error("Test error:", error);
  }
}

// Run the test
testClientPortalBooking();
