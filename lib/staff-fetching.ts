'use server';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { StaffStorage, StaffMember } from '@/lib/staff-storage';
import { DATA_CACHE_TAGS } from '@/lib/next-cache';
import { createCachedFunction } from '@/lib/next-cache';

/**
 * Enhanced staff data fetching utilities for Next.js 15
 *
 * This module provides optimized data fetching functions that leverage
 * Next.js 15's improved caching and revalidation features.
 */

/**
 * Fetch all staff members with optimized caching
 * 
 * @returns Array of staff members
 */
export const fetchStaff = createCachedFunction(
  async (): Promise<StaffMember[]> => {
    // In a real application, this would be an API call
    // For this demo, we're using the StaffStorage directly
    const staff = StaffStorage.getStaff();
    return staff;
  },
  {
    tags: [DATA_CACHE_TAGS.STAFF, DATA_CACHE_TAGS.STAFF_DIRECTORY],
    revalidate: 60 * 5 // 5 minutes
  }
);

/**
 * Fetch a staff member by ID with optimized caching
 * 
 * @param staffId The ID of the staff member to fetch
 * @returns The staff member or undefined if not found
 */
export const fetchStaffById = createCachedFunction(
  async (staffId: string): Promise<StaffMember | undefined> => {
    // In a real application, this would be an API call
    // For this demo, we're using the StaffStorage directly
    const staff = StaffStorage.getStaffById(staffId);
    return staff;
  },
  {
    tags: [DATA_CACHE_TAGS.STAFF, DATA_CACHE_TAGS.STAFF_DIRECTORY],
    revalidate: 60 * 5 // 5 minutes
  }
);

/**
 * Fetch staff members by location with optimized caching
 * 
 * @param locationId The location ID to filter by
 * @returns Array of staff members for the specified location
 */
export const fetchStaffByLocation = createCachedFunction(
  async (locationId: string): Promise<StaffMember[]> => {
    // In a real application, this would be an API call
    // For this demo, we're using the StaffStorage directly
    const allStaff = StaffStorage.getStaff();
    
    if (locationId === "all") {
      return allStaff;
    } else if (locationId === "home") {
      return allStaff.filter(s => s.homeService === true || s.locations.includes("home"));
    } else {
      return allStaff.filter(s => s.locations.includes(locationId));
    }
  },
  {
    tags: [DATA_CACHE_TAGS.STAFF, DATA_CACHE_TAGS.STAFF_DIRECTORY],
    revalidate: 60 * 5 // 5 minutes
  }
);

/**
 * Fetch staff members with home service capability with optimized caching
 * 
 * @returns Array of staff members with home service capability
 */
export const fetchStaffWithHomeService = createCachedFunction(
  async (): Promise<StaffMember[]> => {
    // In a real application, this would be an API call
    // For this demo, we're using the StaffStorage directly
    const allStaff = StaffStorage.getStaff();
    return allStaff.filter(s => s.homeService === true || s.locations.includes("home"));
  },
  {
    tags: [DATA_CACHE_TAGS.STAFF, DATA_CACHE_TAGS.STAFF_DIRECTORY],
    revalidate: 60 * 5 // 5 minutes
  }
);
