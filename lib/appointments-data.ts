// Shared appointment data model for both client portal and main app
export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  staffId: string;
  staffName: string;
  service: string;
  serviceId?: string;
  date: string; // ISO date string
  duration: number; // in minutes
  status: AppointmentStatus;
  location: string;
  notes?: string;
  price?: number;
  createdAt?: string;
  updatedAt?: string;
  // Additional properties needed for calendar view
  statusHistory?: Array<{
    status: string;
    timestamp: string;
    updatedBy?: string;
  }>;
  type?: string; // For special appointment types like "blocked"
  title?: string; // For blocked time title
  blockType?: string; // For blocked time type (break, meeting, etc.)
  additionalServices?: Array<{
    id?: string;
    name: string;
    price?: number;
    duration?: number;
    staffId?: string;
  }>;
  products?: Array<{
    id?: string;
    name: string;
    price?: number;
    quantity?: number;
  }>;
  isAdditionalService?: boolean; // Flag for additional services
}

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "checked-in"
  | "arrived"
  | "service-started"
  | "completed"
  | "cancelled"
  | "no-show"
  | "blocked";

// Function to create a new appointment with all properties needed for calendar view
export function createAppointment(appointment: Omit<Appointment, "id" | "status" | "createdAt" | "updatedAt">): any {
  return {
    ...appointment,
    id: `a${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Additional properties needed for calendar view
    statusHistory: [
      {
        status: "pending",
        timestamp: new Date().toISOString(),
        updatedBy: appointment.notes?.includes("client portal") ? "Client Portal" : "Staff"
      }
    ],
    type: "appointment", // Distinguish from blocked time
    additionalServices: [], // Initialize empty array for additional services
    products: [] // Initialize empty array for products
  };
}

// Function to update appointment status
export function updateAppointmentStatus(appointment: Appointment, newStatus: AppointmentStatus): Appointment {
  return {
    ...appointment,
    status: newStatus,
    updatedAt: new Date().toISOString()
  };
}

// DEPRECATED: All appointment data is now managed through the database
// Use API endpoints to fetch real appointment data
export const appointments: any[] = []

