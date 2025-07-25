// Test script to verify appointment synchronization between client portal and appointment calendar
// Run this in the browser console to test the appointment service

async function testAppointmentSyncV2() {
  console.log("Starting appointment synchronization test v2...");
  
  // Step 1: Import the appointment service
  const appointmentService = await import('./lib/appointment-service.js');
  console.log("Appointment service imported:", appointmentService);
  
  // Step 2: Initialize the appointment service
  appointmentService.initializeAppointmentService();
  console.log("Appointment service initialized");
  
  // Step 3: Get all appointments
  const allAppointments = appointmentService.getAllAppointments();
  console.log("All appointments:", allAppointments.length);
  
  // Step 4: Create a test appointment
  const testAppointment = {
    id: `test-${Date.now()}`,
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
  
  console.log("Test appointment created:", testAppointment);
  
  // Step 5: Add the test appointment directly via the API
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
      console.log("Appointment created successfully via API:", result.appointment);
      
      // Step 6: Wait a moment for any async operations to complete
      console.log("Waiting 2 seconds for async operations...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 7: Check if appointment was added to all storage locations
      const updatedAppointments = appointmentService.getAllAppointments();
      const foundInService = updatedAppointments.some(a => a.id === result.appointment.id);
      console.log("Appointment found in service:", foundInService);
      
      // Step 8: Check localStorage
      try {
        const storedAppointments = JSON.parse(localStorage.getItem("vanity_appointments"));
        const foundInStorage = storedAppointments.some(a => a.id === result.appointment.id);
        console.log("Appointments in localStorage:", storedAppointments.length);
        console.log("Test appointment found in localStorage:", foundInStorage);
        
        if (foundInStorage) {
          console.log("TEST PASSED: Appointment was successfully added to localStorage");
        } else {
          console.error("TEST FAILED: Appointment was not added to localStorage");
        }
      } catch (error) {
        console.error("Error checking localStorage:", error);
      }
      
      // Step 9: Check if appointment is in the mockAppointments array
      const { mockAppointments } = await import('./lib/mock-data.js');
      const foundInMockData = mockAppointments.some(a => a.id === result.appointment.id);
      console.log("Test appointment found in mockAppointments:", foundInMockData);
      
      if (foundInMockData) {
        console.log("TEST PASSED: Appointment was successfully added to mockAppointments");
      } else {
        console.error("TEST FAILED: Appointment was not added to mockAppointments");
      }
      
      // Step 10: Final test result
      if (foundInService && foundInStorage && foundInMockData) {
        console.log("ALL TESTS PASSED: Appointment was successfully synchronized across all storage locations");
      } else {
        console.error("SOME TESTS FAILED: Appointment was not properly synchronized");
      }
    } else {
      console.error("TEST FAILED: Appointment creation failed");
    }
  } catch (error) {
    console.error("Test error:", error);
  }
}

// Run the test
testAppointmentSyncV2();
