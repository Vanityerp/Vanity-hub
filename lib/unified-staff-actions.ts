'use server';

import { revalidateTag } from 'next/cache';
import { DATA_CACHE_TAGS } from './next-cache';
import { revalidateCacheTags } from './cache-actions';
import { StaffMember } from './staff-storage';
import { User } from './settings-storage';
import { UnifiedStaffService } from './unified-staff-service';

/**
 * Server action to initialize the unified staff service
 * 
 * @returns The result of the initialization
 */
export async function initializeUnifiedStaffService(): Promise<{ 
  success: boolean, 
  newUsersCreated: number, 
  newStaffCreated: number 
}> {
  try {
    // Initialize the service
    const result = UnifiedStaffService.initialize();
    
    // Revalidate cache
    await revalidateUnifiedStaffCache();
    
    return { 
      success: true, 
      newUsersCreated: result.newUsersCreated, 
      newStaffCreated: result.newStaffCreated 
    };
  } catch (error) {
    console.error('Failed to initialize unified staff service:', error);
    return { success: false, newUsersCreated: 0, newStaffCreated: 0 };
  }
}

/**
 * Server action to add a new staff member and corresponding user
 * 
 * @param staffData The staff member data to add (without ID)
 * @returns The added staff member and user
 */
export async function addUnifiedStaffMember(staffData: Omit<StaffMember, 'id'>): Promise<{ 
  staff: StaffMember, 
  user: User 
}> {
  // Add the staff member and user
  const result = UnifiedStaffService.addStaffMember(staffData);
  
  // Revalidate cache
  await revalidateUnifiedStaffCache();
  
  return result;
}

/**
 * Server action to update a staff member and synchronize with user data
 * 
 * @param staffData The staff member data to update
 * @returns The updated staff member and user
 */
export async function updateUnifiedStaffMember(staffData: StaffMember): Promise<{ 
  staff: StaffMember | null, 
  user: User | null 
}> {
  // Update the staff member and user
  const result = UnifiedStaffService.updateStaffMember(staffData);
  
  // Revalidate cache
  await revalidateUnifiedStaffCache();
  
  return result;
}

/**
 * Server action to update a user and synchronize with staff data
 * 
 * @param userData The user data to update
 * @returns The updated user and staff member
 */
export async function updateUnifiedUser(userData: User): Promise<{ 
  user: User, 
  staff: StaffMember | null 
}> {
  // Update the user and staff member
  const result = UnifiedStaffService.updateUser(userData);
  
  // Revalidate cache
  await revalidateUnifiedStaffCache();
  
  return result;
}

/**
 * Server action to delete a staff member and its corresponding user
 * 
 * @param staffId The ID of the staff member to delete
 * @returns Whether the deletion was successful
 */
export async function deleteUnifiedStaffMember(staffId: string): Promise<boolean> {
  // Delete the staff member and user
  const result = UnifiedStaffService.deleteStaffMember(staffId);
  
  // Revalidate cache
  await revalidateUnifiedStaffCache();
  
  return result;
}

/**
 * Server action to delete a user and its corresponding staff member
 * 
 * @param userId The ID of the user to delete
 * @returns Whether the deletion was successful
 */
export async function deleteUnifiedUser(userId: string): Promise<boolean> {
  // Delete the user and staff member
  const result = UnifiedStaffService.deleteUser(userId);
  
  // Revalidate cache
  await revalidateUnifiedStaffCache();
  
  return result;
}

/**
 * Server action to revalidate unified staff cache
 * 
 * @returns Whether the revalidation was successful
 */
export async function revalidateUnifiedStaffCache(): Promise<{ success: boolean }> {
  // Staff-related cache tags
  const staffTags = [
    DATA_CACHE_TAGS.STAFF,
    DATA_CACHE_TAGS.STAFF_DIRECTORY,
    DATA_CACHE_TAGS.STAFF_SCHEDULE,
    DATA_CACHE_TAGS.STAFF_PERFORMANCE,
    DATA_CACHE_TAGS.USERS,
    DATA_CACHE_TAGS.PERMISSIONS,
  ];
  
  // Paths that are likely to be affected by staff changes
  const staffPaths = [
    '/dashboard/accounting',
    '/dashboard/hr',
    '/dashboard/settings',
  ];
  
  // Revalidate tags and paths
  const result = await revalidateCacheTags(staffTags, staffPaths);
  
  return { success: result.success };
}
