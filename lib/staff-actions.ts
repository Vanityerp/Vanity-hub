'use server';

import { revalidateTag } from 'next/cache';
import { DATA_CACHE_TAGS } from './next-cache';
import { revalidateCacheTags } from './cache-actions';
import { StaffMember, StaffStorage } from './staff-storage';

/**
 * Server action to add a new staff member
 * 
 * @param staff The staff member to add (without ID)
 * @returns The added staff member
 */
export async function addStaffMember(staff: Omit<StaffMember, 'id'>): Promise<StaffMember> {
  // Add the staff member
  const newStaff = StaffStorage.addStaff(staff);
  
  // Revalidate cache
  await revalidateStaffCache();
  
  return newStaff;
}

/**
 * Server action to update a staff member
 * 
 * @param staff The staff member to update
 * @returns The updated staff member or null if not found
 */
export async function updateStaffMember(staff: StaffMember): Promise<StaffMember | null> {
  // Update the staff member
  const updatedStaff = StaffStorage.updateStaff(staff);
  
  // Revalidate cache
  await revalidateStaffCache();
  
  return updatedStaff;
}

/**
 * Server action to delete a staff member
 * 
 * @param staffId The ID of the staff member to delete
 * @returns Whether the deletion was successful
 */
export async function deleteStaffMember(staffId: string): Promise<boolean> {
  // Delete the staff member
  const result = StaffStorage.deleteStaff(staffId);
  
  // Revalidate cache
  await revalidateStaffCache();
  
  return result;
}

/**
 * Server action to revalidate staff cache
 * 
 * @returns Whether the revalidation was successful
 */
export async function revalidateStaffCache(): Promise<{ success: boolean }> {
  // Staff-related cache tags
  const staffTags = [
    DATA_CACHE_TAGS.STAFF,
    DATA_CACHE_TAGS.STAFF_DIRECTORY,
    DATA_CACHE_TAGS.STAFF_SCHEDULE,
    DATA_CACHE_TAGS.STAFF_PERFORMANCE,
  ];
  
  // Paths that are likely to be affected by staff changes
  const staffPaths = [
    '/dashboard/accounting',
    '/dashboard/hr',
  ];
  
  // Revalidate tags and paths
  const result = await revalidateCacheTags(staffTags, staffPaths);
  
  return { success: result.success };
}
