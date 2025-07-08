// Test script to verify appointment synchronization between client portal and appointment calendar
// Run this in the browser console to test the appointment service

async function testAppointmentSync() {
  console.log("Starting appointment synchronization test...");
  
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
  
  // Step 5: Add the test appointment
  const addedAppointment = appointmentService.addAppointment(testAppointment);
  console.log("Appointment added:", addedAppointment);
  
  // Step 6: Verify the appointment was added
  const updatedAppointments = appointmentService.getAllAppointments();
  const found = updatedAppointments.some(a => a.id === testAppointment.id);
  console.log("Updated appointments count:", updatedAppointments.length);
  console.log("Test appointment found:", found);
  
  // Step 7: Check localStorage
  try {
    const storedAppointments = JSON.parse(localStorage.getItem("vanity_appointments"));
    const foundInStorage = storedAppointments.some(a => a.id === testAppointment.id);
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
  
  // Step 8: Simulate navigation to appointments page
  console.log("Simulating navigation to appointments page...");
  
  // Step 9: Get appointments again (simulating page load)
  const appointmentsAfterNavigation = appointmentService.getAllAppointments();
  const foundAfterNavigation = appointmentsAfterNavigation.some(a => a.id === testAppointment.id);
  console.log("Appointments after navigation:", appointmentsAfterNavigation.length);
  console.log("Test appointment found after navigation:", foundAfterNavigation);
  
  if (foundAfterNavigation) {
    console.log("TEST PASSED: Appointment persisted after navigation");
  } else {
    console.error("TEST FAILED: Appointment was lost after navigation");
  }
  
  console.log("Appointment synchronization test completed");
}

// Run the test
testAppointmentSync();
