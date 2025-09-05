/**
 * DEPRECATED: This file is deprecated and should not be used.
 * All staff data is now managed through the database using Prisma.
 * Use the /api/staff endpoints instead.
 */

import fs from 'fs';
import path from 'path';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  locations: string[];
  status: string;
  avatar: string;
  color: string;
  homeService: boolean;
  specialties?: string[];
  employeeNumber?: string;
  dateOfBirth?: string;
  qidNumber?: string;
  passportNumber?: string;
  qidValidity?: string;
  passportValidity?: string;
  medicalValidity?: string;
  profileImage?: string;
  profileImageType?: string;
  isEditing?: boolean;
}

const STAFF_FILE_PATH = path.join(process.cwd(), 'data', 'staff.json');

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.dirname(STAFF_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// DEPRECATED: Default staff data removed - all staff data now comes from database
const DEFAULT_STAFF_DATA: StaffMember[] = [];


export class FileStaffStorage {
  static getStaff(): StaffMember[] {
    console.warn('FileStaffStorage.getStaff is deprecated. Use database API instead.');
    return [];
  }
  
  static saveStaff(staff: StaffMember[]): void {
    console.warn('FileStaffStorage.saveStaff is deprecated. Use database API instead.');
  }

  static addStaff(staffData: Omit<StaffMember, 'id'>): StaffMember {
    console.warn('FileStaffStorage.addStaff is deprecated. Use database API instead.');
    throw new Error('FileStaffStorage is deprecated. Use database API instead.');
  }

  static updateStaff(staffId: string, updates: Partial<StaffMember>): StaffMember | null {
    console.warn('FileStaffStorage.updateStaff is deprecated. Use database API instead.');
    return null;
  }

  static deleteStaff(staffId: string): boolean {
    console.warn('FileStaffStorage.deleteStaff is deprecated. Use database API instead.');
    return false;
  }

  static initializeWithDefaultData(): void {
    console.warn('FileStaffStorage.initializeWithDefaultData is deprecated. Use database API instead.');
  }
}
