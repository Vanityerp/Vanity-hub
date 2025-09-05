'use client';

import { useState, useEffect, useCallback } from 'react';
import { StaffMember } from '@/lib/staff-storage';
import { useAuth } from '@/lib/auth-provider';

interface UseStaffDataOptions {
  /** Whether to automatically fetch data on mount */
  autoFetch?: boolean;
  /** Dependencies that should trigger a refetch when changed */
  dependencies?: any[];
}

interface UseStaffDataResult {
  /** All staff members */
  staff: StaffMember[];
  /** Staff members filtered by the current location */
  filteredStaff: StaffMember[];
  /** Whether the data is currently loading */
  isLoading: boolean;
  /** Any error that occurred during data fetching */
  error: Error | null;
  /** Function to manually refresh the data */
  refreshStaff: () => Promise<void>;
}

/**
 * Hook for fetching staff data with automatic revalidation
 * 
 * This hook provides a way to fetch staff data with automatic revalidation
 * when staff data changes.
 */
export function useStaff(locationFilter?: string): UseStaffDataResult {
  const { currentLocation: authLocation, user } = useAuth();
  const currentLocation = locationFilter || authLocation;
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Function to fetch staff data
  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch staff data from FileStaffStorage via API and sync to localStorage
      console.log('useStaff: Fetching staff data from API for location:', currentLocation);
      const response = await fetch('/api/staff');

      if (!response.ok) {
        throw new Error(`Failed to fetch staff: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('useStaff: Received staff data:', data.staff.length, 'members');

      // No localStorage sync - database is single source of truth

      setStaff(data.staff);

      // Filter staff by location
      if (currentLocation === 'all') {
        setFilteredStaff(data.staff);
        console.log('useStaff: Showing all staff:', data.staff.length);
      } else if (currentLocation === 'home') {
        // Only admin users can access home service staff
        if (user && user.role === 'ADMIN') {
          let homeStaff = data.staff.filter((s: StaffMember) =>
            s.homeService === true || s.locations.includes('home')
          );

          // For non-admin users, apply additional filtering for home service
          if (!user.locations.includes('all')) {
            homeStaff = homeStaff.filter((s: StaffMember) =>
              s.locations.some(loc => user.locations.includes(loc))
            );
          }
          setFilteredStaff(homeStaff);
          console.log('useStaff: Showing home service staff (admin access):', homeStaff.length);
        } else {
          // Staff users cannot access home service staff
          setFilteredStaff([]);
          console.log('useStaff: Home service access denied for non-admin user');
        }
      } else {
        const locationStaff = data.staff.filter((s: StaffMember) =>
          s.locations.includes(currentLocation)
        );
        setFilteredStaff(locationStaff);
        console.log('useStaff: Filtered for location', currentLocation + ':', locationStaff.length);
      }
    } catch (err) {
      console.error('Error fetching staff data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch staff data'));

      // Set empty arrays on error
      setStaff([]);
      setFilteredStaff([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentLocation]);

  // Fetch staff data on mount
  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Listen for staff-updated events (only once)
  useEffect(() => {
    const handleStaffUpdated = () => {
      console.log('Staff updated event received, refreshing staff data');
      fetchStaff();
    };

    // Add event listener
    if (typeof window !== 'undefined') {
      window.addEventListener('staff-updated', handleStaffUpdated);
    }

    // Clean up event listener
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('staff-updated', handleStaffUpdated);
      }
    };
  }, []); // Remove fetchStaff dependency to prevent re-adding listeners

  // Listen for data-cache-revalidated events (only once)
  useEffect(() => {
    const handleCacheRevalidated = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.tags?.includes('data:staff')) {
        console.log('Staff cache revalidated, refreshing staff data');
        fetchStaff();
      }
    };

    document.addEventListener('data-cache-revalidated', handleCacheRevalidated);

    return () => {
      document.removeEventListener('data-cache-revalidated', handleCacheRevalidated);
    };
  }, []); // Remove fetchStaff dependency to prevent re-adding listeners

  return {
    staff,
    filteredStaff,
    isLoading,
    error,
    refreshStaff: fetchStaff
  };
}
