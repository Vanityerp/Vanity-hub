'use server';

import { DATA_CACHE_TAGS } from '@/lib/next-cache';
import { cache } from 'react';

/**
 * Enhanced data fetching utilities for Next.js 15
 *
 * This module provides optimized data fetching functions that leverage
 * Next.js 15's improved caching and revalidation features.
 */

/**
 * Fetch clients with optimized caching
 *
 * @param locationId Optional location ID to filter clients
 * @returns Array of clients
 */
export const fetchClients = cache(async (locationId?: number) => {
  const url = locationId
    ? `/api/clients?locationId=${locationId}`
    : '/api/clients';

  const response = await fetch(url, {
    next: {
      tags: [DATA_CACHE_TAGS.CLIENTS],
      revalidate: 60 * 5 // 5 minutes
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch clients: ${response.statusText}`);
  }

  const data = await response.json();
  return data.clients;
});

/**
 * Fetch services with optimized caching
 *
 * @param locationId Optional location ID to filter services
 * @returns Array of services
 */
export const fetchServices = cache(async (locationId?: number) => {
  const url = locationId
    ? `/api/services?locationId=${locationId}`
    : '/api/services';

  const response = await fetch(url, {
    next: {
      tags: [DATA_CACHE_TAGS.SERVICES],
      revalidate: 60 * 10 // 10 minutes
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch services: ${response.statusText}`);
  }

  const data = await response.json();
  return data.services;
});

/**
 * Fetch appointments with optimized caching
 *
 * @param params Query parameters for appointments
 * @returns Array of appointments
 */
export const fetchAppointments = cache(async (params: {
  locationId?: number;
  staffId?: string;
  clientId?: string;
  date?: string;
}) => {
  // Build query string from params
  const queryParams = new URLSearchParams();

  if (params.locationId) {
    queryParams.append('locationId', params.locationId.toString());
  }

  if (params.staffId) {
    queryParams.append('staffId', params.staffId);
  }

  if (params.clientId) {
    queryParams.append('clientId', params.clientId);
  }

  if (params.date) {
    queryParams.append('date', params.date);
  }

  const queryString = queryParams.toString();
  const url = `/api/appointments${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    next: {
      tags: [DATA_CACHE_TAGS.APPOINTMENTS],
      // Dynamic data should have shorter revalidation time
      revalidate: 60 // 1 minute
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch appointments: ${response.statusText}`);
  }

  const data = await response.json();
  return data.appointments;
});

/**
 * Fetch inventory with optimized caching
 *
 * @param locationId Location ID to get inventory for
 * @returns Inventory data
 */
export const fetchInventory = cache(async (locationId: number) => {
  const response = await fetch(`/api/inventory?locationId=${locationId}`, {
    next: {
      tags: [DATA_CACHE_TAGS.INVENTORY],
      revalidate: 60 * 30 // 30 minutes
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch inventory: ${response.statusText}`);
  }

  const data = await response.json();
  return data.inventory;
});
