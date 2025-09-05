import { NextRequest, NextResponse } from "next/server";
import { getAllAppointments } from "@/lib/appointment-service";
import { getUserFromHeaders, filterAppointmentsByLocationAccess } from "@/lib/auth-server";

/**
 * GET /api/appointments
 * 
 * Get all appointments with location-based access control
 */
export async function GET(request: NextRequest) {
  try {
    // Get user information from headers (set by middleware)
    const currentUser = getUserFromHeaders(request);
    
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");
    const staffId = searchParams.get("staffId");
    const clientId = searchParams.get("clientId");
    const date = searchParams.get("date");

    // Get all appointments from the appointment service
    let filteredAppointments = getAllAppointments();
    console.log("API: Retrieved all appointments", filteredAppointments.length);

    // Apply location-based access control FIRST
    if (currentUser && currentUser.locations.length > 0) {
      filteredAppointments = filterAppointmentsByLocationAccess(filteredAppointments, currentUser.locations);
      console.log(`🔒 Filtered appointments by user location access: ${filteredAppointments.length} appointments visible to user`);
    }

    // Apply additional filters
    if (locationId) {
      filteredAppointments = filteredAppointments.filter(
        appointment => appointment.location === locationId
      );
    }

    if (staffId) {
      filteredAppointments = filteredAppointments.filter(
        appointment => appointment.staffId === staffId
      );
    }

    if (clientId) {
      filteredAppointments = filteredAppointments.filter(
        appointment => appointment.clientId === clientId
      );
    }

    if (date) {
      const targetDate = new Date(date).toDateString();
      filteredAppointments = filteredAppointments.filter(
        appointment => new Date(appointment.date).toDateString() === targetDate
      );
    }

    console.log(`API: Final filtered appointments: ${filteredAppointments.length}`);
    
    return NextResponse.json({ 
      appointments: filteredAppointments,
      total: filteredAppointments.length
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}
