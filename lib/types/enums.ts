// TypeScript enums for VanityERP system
// These provide type safety for status fields since SQLite doesn't support native enums

export enum StaffStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE", 
  ON_LEAVE = "ON_LEAVE"
}

export enum AppointmentStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  IN_PROGRESS = "IN_PROGRESS", 
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW"
}

export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED"
}

// Type guards for runtime validation
export function isValidStaffStatus(status: string): status is StaffStatus {
  return Object.values(StaffStatus).includes(status as StaffStatus)
}

export function isValidAppointmentStatus(status: string): status is AppointmentStatus {
  return Object.values(AppointmentStatus).includes(status as AppointmentStatus)
}

export function isValidTransactionStatus(status: string): status is TransactionStatus {
  return Object.values(TransactionStatus).includes(status as TransactionStatus)
}

// Default values
export const DEFAULT_STAFF_STATUS = StaffStatus.ACTIVE
export const DEFAULT_APPOINTMENT_STATUS = AppointmentStatus.PENDING
export const DEFAULT_TRANSACTION_STATUS = TransactionStatus.PENDING
