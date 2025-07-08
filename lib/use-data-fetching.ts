'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useCurrency } from '@/lib/currency-provider';

/**
 * Client-side wrapper for data fetching with currency-aware revalidation
 *
 * This hook provides a way to fetch data with automatic revalidation
 * when the currency changes.
 */

interface UseFetchOptions {
  /** Whether to automatically fetch data on mount */
  autoFetch?: boolean;
  /** Whether to revalidate data when currency changes */
  revalidateOnCurrencyChange?: boolean;
  /** Dependencies that should trigger a refetch when changed */
  dependencies?: any[];
}

/**
 * Hook for fetching data with currency-aware revalidation
 *
 * @param fetchFn The function to fetch data
 * @param options Options for fetching behavior
 * @returns Object with data, loading state, error, and refetch function
 */
export function useFetch<T>(
  fetchFn: () => Promise<T>,
  options: UseFetchOptions = {}
) {
  const {
    autoFetch = true,
    revalidateOnCurrencyChange = true,
    dependencies = []
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState<Error | null>(null);
  const { currencyCode } = useCurrency();

  // Memoize dependencies to prevent infinite re-renders
  // Use JSON.stringify to create a stable dependency array
  const memoizedDependencies = useMemo(() => dependencies, [JSON.stringify(dependencies)]);

  // Memoize the fetch function to avoid unnecessary rerenders
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn]);

  // Fetch data on mount if autoFetch is true
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData, memoizedDependencies]);

  // Refetch data when currency changes if revalidateOnCurrencyChange is true
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (revalidateOnCurrencyChange) {
      // Skip the initial render
      if (isFirstRenderRef.current) {
        isFirstRenderRef.current = false;
        return;
      }

      fetchData();
    }
  }, [currencyCode, fetchData, revalidateOnCurrencyChange]);

  // Listen for currency cache revalidation events
  useEffect(() => {
    if (!revalidateOnCurrencyChange) return;

    const handleCacheRevalidated = () => {
      fetchData();
    };

    document.addEventListener('currency-cache-revalidated', handleCacheRevalidated);

    return () => {
      document.removeEventListener('currency-cache-revalidated', handleCacheRevalidated);
    };
  }, [fetchData, revalidateOnCurrencyChange]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  };
}

/**
 * Hook for fetching clients with currency-aware revalidation
 *
 * @param locationId Optional location ID to filter clients
 * @param options Options for fetching behavior
 * @returns Object with clients data, loading state, error, and refetch function
 */
export function useClients(locationId?: number, options: UseFetchOptions = {}) {
  // Memoize the fetch function to prevent it from changing on every render
  const fetchFunction = useCallback(async () => {
    const response = await fetch(
      locationId ? `/api/clients?locationId=${locationId}` : '/api/clients'
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch clients: ${response.statusText}`);
    }

    const data = await response.json();
    return data.clients;
  }, [locationId]);

  return useFetch(fetchFunction, options);
}

/**
 * Hook for fetching a single client with currency-aware revalidation
 *
 * @param clientId Client ID to fetch
 * @param options Options for fetching behavior
 * @returns Object with client data, loading state, error, and refetch function
 */
export function useClient(clientId: string, options: UseFetchOptions = {}) {
  // Memoize the fetch function to prevent it from changing on every render
  const fetchFunction = useCallback(async () => {
    if (!clientId) {
      return null;
    }

    const response = await fetch(`/api/clients/${clientId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch client: ${response.statusText}`);
    }

    const data = await response.json();
    return data.client;
  }, [clientId]);

  // Memoize options to prevent unnecessary re-renders
  const memoizedOptions = useMemo(() => ({
    ...options,
    autoFetch: !!clientId && (options.autoFetch !== false),
  }), [clientId, options]);

  return useFetch(fetchFunction, memoizedOptions);
}

/**
 * Hook for fetching appointments with currency-aware revalidation
 *
 * @param params Query parameters for appointments
 * @param options Options for fetching behavior
 * @returns Object with appointments data, loading state, error, and refetch function
 */
export function useAppointments(
  params: {
    locationId?: number;
    staffId?: string;
    clientId?: string;
    date?: string;
  } = {},
  options: UseFetchOptions = {}
) {
  // Memoize params to prevent unnecessary re-renders
  const memoizedParams = useMemo(() => params, [
    params.locationId,
    params.staffId,
    params.clientId,
    params.date
  ]);

  // Memoize the fetch function to prevent it from changing on every render
  const fetchFunction = useCallback(async () => {
    // Build query string from params
    const queryParams = new URLSearchParams();

    if (memoizedParams.locationId) {
      queryParams.append('locationId', memoizedParams.locationId.toString());
    }

    if (memoizedParams.staffId) {
      queryParams.append('staffId', memoizedParams.staffId);
    }

    if (memoizedParams.clientId) {
      queryParams.append('clientId', memoizedParams.clientId);
    }

    if (memoizedParams.date) {
      queryParams.append('date', memoizedParams.date);
    }

    const queryString = queryParams.toString();
    const url = `/api/appointments${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch appointments: ${response.statusText}`);
    }

    const data = await response.json();
    return data.appointments;
  }, [memoizedParams]);

  return useFetch(fetchFunction, options);
}

/**
 * Hook for fetching services with currency-aware revalidation
 *
 * @param locationId Optional location ID to filter services
 * @param options Options for fetching behavior
 * @returns Object with services data, loading state, error, and refetch function
 */
export function useServices(locationId?: number, options: UseFetchOptions = {}) {
  // Memoize the fetch function to prevent it from changing on every render
  const fetchFunction = useCallback(async () => {
    const response = await fetch(
      locationId ? `/api/services?locationId=${locationId}` : '/api/services'
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch services: ${response.statusText}`);
    }

    const data = await response.json();
    return data.services;
  }, [locationId]);

  return useFetch(fetchFunction, options);
}
