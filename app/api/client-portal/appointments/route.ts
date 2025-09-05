import { NextRequest, NextResponse } from "next/server";
import { appointments, createAppointment, Appointment } from "@/lib/appointments-data";
import { parseISO, isBefore, isAfter, addMinutes } from "date-fns";
import { addAppointment, getAllAppointments } from "@/lib/appointment-service";
import { getUserFromHeaders, filterAppointmentsByLocationAccess } from "@/lib/auth-server";

// Get all appointments or filter by client
export async function GET(request: NextRequest) {
  try {
    // Get user information from headers (set by middleware)
    const currentUser = getUserFromHeaders(request);

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const staffId = searchParams.get("staffId");
    const location = searchParams.get("location");
    const date = searchParams.get("date");

    // Get all appointments from the appointment service
    // This combines localStorage, mockAppointments, and appointments arrays
    let filteredAppointments = getAllAppointments();
    console.log("API: Retrieved all appointments", filteredAppointments.length);

    // Apply location-based access control
    if (currentUser && currentUser.locations.length > 0) {
      filteredAppointments = filterAppointmentsByLocationAccess(filteredAppointments, currentUser.locations);
      console.log(`🔒 Filtered appointments by user location access: ${filteredAppointments.length} appointments visible to user`);
    }

    if (clientId) {
      filteredAppointments = filteredAppointments.filter(
        appointment => appointment.clientId === clientId
      );
    }

    if (staffId) {
      filteredAppointments = filteredAppointments.filter(
        appointment => appointment.staffId === staffId
      );
    }

    if (location) {
      filteredAppointments = filteredAppointments.filter(
        appointment => appointment.location === location
      );
    }

    if (date) {
      const targetDate = parseISO(date);
      filteredAppointments = filteredAppointments.filter(appointment => {
        const appointmentDate = parseISO(appointment.date);
        return (
          appointmentDate.getFullYear() === targetDate.getFullYear() &&
          appointmentDate.getMonth() === targetDate.getMonth() &&
          appointmentDate.getDate() === targetDate.getDate()
        );
      });
    }

    return NextResponse.json({ appointments: filteredAppointments });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}

// Book a new appointment
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.clientId || !data.staffId || !data.service || !data.date || !data.duration || !data.location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate appointment date is in the future
    const appointmentDate = parseISO(data.date);
    if (isBefore(appointmentDate, new Date())) {
      return NextResponse.json({ error: "Appointment date must be in the future" }, { status: 400 });
    }

    // Check for scheduling conflicts
    const appointmentEnd = addMinutes(appointmentDate, data.duration);
    const conflictingAppointments = appointments.filter(appointment => {
      // Only check appointments for the same staff and location
      if (appointment.staffId !== data.staffId || appointment.location !== data.location) {
        return false;
      }

      // IMPORTANT: Skip completed appointments - they don't block staff availability
      if (appointment.status === "completed") {
        return false;
      }

      // IMPORTANT: Skip cancelled and no-show appointments - they don't block staff availability
      if (appointment.status === "cancelled" || appointment.status === "no-show") {
        return false;
      }

      const existingStart = parseISO(appointment.date);
      const existingEnd = addMinutes(existingStart, appointment.duration);

      // Check if the new appointment overlaps with an existing one
      return (
        (isAfter(appointmentDate, existingStart) && isBefore(appointmentDate, existingEnd)) ||
        (isAfter(appointmentEnd, existingStart) && isBefore(appointmentEnd, existingEnd)) ||
        (isBefore(appointmentDate, existingStart) && isAfter(appointmentEnd, existingEnd)) ||
        (appointmentDate.getTime() === existingStart.getTime())
      );
    });

    if (conflictingAppointments.length > 0) {
      return NextResponse.json({
        error: "This time slot is already booked",
        conflicts: conflictingAppointments
      }, { status: 409 });
    }

    // Generate a simple booking reference number
    const generateBookingReference = () => {
      // Format: VH-XXXXXX where XXXXXX is a 6-digit number based on timestamp
      return `VH-${Date.now().toString().slice(-6)}`;
    };

    // Create the new appointment with all required properties for calendar view
    const newAppointment = {
      id: `a${Date.now()}`,
      bookingReference: generateBookingReference(), // Add booking reference number
      clientId: data.clientId,
      clientName: data.clientName,
      staffId: data.staffId,
      staffName: data.staffName,
      service: data.service,
      serviceId: data.serviceId,
      date: data.date,
      duration: data.duration,
      location: data.location,
      price: data.price,
      notes: data.notes,
      status: data.status || "pending",
      statusHistory: data.statusHistory || [
        {
          status: "pending",
          timestamp: new Date().toISOString(),
          updatedBy: "Client Portal"
        }
      ],
      type: data.type || "appointment",
      additionalServices: data.additionalServices || [],
      products: data.products || [],
      // Mark this appointment as coming from client portal
      source: 'client_portal',
      bookedVia: 'client_portal',
      metadata: {
        source: 'client_portal',
        bookedVia: 'client_portal',
        isClientPortalBooking: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // In a real app, we would save this to a database
    // For now, we'll add it to our mock data and use the appointment service

    // Add to the appointments array for backward compatibility
    appointments.push(newAppointment);

    // Use the appointment service to add the appointment to all storage locations
    // Note: The appointment service can't directly update localStorage on the server side,
    // but it will update the in-memory arrays that will be used by the client
    try {
      // Add the appointment using the appointment service
      addAppointment(newAppointment);
      console.log("API: Created new appointment via appointment service", newAppointment.id);
    } catch (error) {
      console.error("Error in appointment creation:", error);
    }

    return NextResponse.json({
      success: true,
      appointment: newAppointment
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    return NextResponse.json({ error: "Failed to book appointment" }, { status: 500 });
  }
}
