// Test script for client appointments functionality
// Run this in the browser console to test the appointments system

async function testClientAppointments() {
  console.log("=== Testing Client Appointments Functionality ===");
  
  // Step 1: Check if we're on the client portal
  const currentUrl = window.location.href;
  console.log("Current URL:", currentUrl);
  
  // Step 2: Check authentication status
  const clientAuthToken = localStorage.getItem("client_auth_token");
  const clientEmail = localStorage.getItem("client_email");
  const clientId = localStorage.getItem("client_id");
  
  console.log("Authentication status:", {
    hasToken: !!clientAuthToken,
    clientEmail,
    clientId
  });
  
  // Step 3: If not authenticated, simulate login as Emily Davis
  if (!clientAuthToken) {
    console.log("Not authenticated. Simulating login as Emily Davis...");
    localStorage.setItem("client_auth_token", "sample_token");
    localStorage.setItem("client_email", "emily.davis@example.com");
    localStorage.setItem("client_id", "ed1");
    
    // Dispatch auth change event
    window.dispatchEvent(new CustomEvent('client-auth-changed', { 
      detail: { isLoggedIn: true } 
    }));
    
    console.log("Simulated login complete. Please refresh the page or navigate to appointments.");
    return;
  }
  
  // Step 4: Test appointment service
  try {
    // Import appointment service
    const appointmentService = await import('./lib/appointment-service.js');
    
    // Initialize service
    appointmentService.initializeAppointmentService();
    
    // Get all appointments
    const allAppointments = appointmentService.getAllAppointments();
    console.log("Total appointments in system:", allAppointments.length);
    
    // Filter for current client
    const currentClientId = clientId || clientEmail || "ed1";
    const clientAppointments = allAppointments.filter(appointment => {
      return appointment.clientId === currentClientId ||
             appointment.clientEmail === currentClientId ||
             appointment.clientId === "ed1"; // Fallback for demo
    });
    
    console.log("Appointments for client", currentClientId + ":", clientAppointments.length);
    console.log("Client appointments:", clientAppointments);
    
    // Categorize appointments
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const upcoming = clientAppointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return (apt.status === "confirmed" || apt.status === "pending") &&
             aptDate > now && !isSameDay(aptDate, today);
    });
    
    const todayApts = clientAppointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return isSameDay(aptDate, today) && apt.status !== "cancelled";
    });
    
    const past = clientAppointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate < today;
    });
    
    console.log("Categorized appointments:", {
      upcoming: upcoming.length,
      today: todayApts.length,
      past: past.length
    });
    
    console.log("Upcoming appointments:", upcoming);
    console.log("Today's appointments:", todayApts);
    console.log("Past appointments:", past);
    
  } catch (error) {
    console.error("Error testing appointment service:", error);
  }
  
  // Step 5: Navigate to appointments page if not already there
  if (!currentUrl.includes('/client-portal/appointments')) {
    console.log("Navigating to appointments page...");
    window.location.href = '/client-portal/appointments';
  }
}

// Helper function to check if two dates are the same day
function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

// Auto-run the test
testClientAppointments();
