export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'arrived'
  | 'service-started'
  | 'completed'
  | 'cancelled'
  | 'no-show'
  | 'blocked';

export interface AppointmentStatusHistory {
  status: AppointmentStatus
  timestamp: string
  updatedBy?: string
}

export interface Appointment {
  id: string
  clientId: string
  clientName: string
  date: string
  service: string
  duration: number
  staffId: string
  staffName: string
  location: string
  status: AppointmentStatus | string // Allow for custom status values like "blocked"
  statusHistory: AppointmentStatusHistory[]
  notes?: string
  price?: number
  type?: string // For special appointment types like "blocked"
  title?: string // For blocked time title
  blockType?: string // For blocked time type (break, meeting, etc.)
  bookingReference?: string // Reference number for the booking
  additionalServices?: Array<{
    id?: string
    name: string
    price?: number
    duration?: number
  }>
  products?: Array<{
    id?: string
    name: string
    price?: number
    quantity?: number
  }>
}