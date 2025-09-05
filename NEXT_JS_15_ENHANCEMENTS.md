# Next.js 15 Enhancements

This document outlines the Next.js 15 enhancements implemented in this project, including improved caching, data fetching, and performance optimizations.

## Table of Contents

1. [Overview](#overview)
2. [Configuration Updates](#configuration-updates)
3. [Data Fetching Utilities](#data-fetching-utilities)
4. [Currency-Aware Revalidation](#currency-aware-revalidation)
5. [Performance Monitoring](#performance-monitoring)
6. [Demo Pages](#demo-pages)
7. [Implementation Examples](#implementation-examples)
8. [Testing and Monitoring](#testing-and-monitoring)

## Overview

Next.js 15 introduces several performance improvements and new features that enhance the developer experience and application performance. This project implements the following key features:

- **Improved Client-Side Router Caching**: Using `staleTimes` configuration for better caching
- **Enhanced Data Fetching**: Using React's `cache` function for server-side data fetching
- **Tag-Based Revalidation**: Implementing revalidation strategies with tags
- **Currency-Aware Revalidation**: Automatically revalidating data when currency changes
- **Optimized Package Imports**: Reducing bundle size with expanded package imports

## Configuration Updates

### Next.js Config

The `next.config.js` file has been updated to include the following configurations:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... other configurations
  
  // Improved client-side router caching
  experimental: {
    // Configure stale times for different routes
    staleTimes: {
      // Default stale time for all routes (5 minutes)
      default: 5 * 60,
      // Specific stale times for different routes
      '/dashboard': 60, // 1 minute
      '/dashboard/services': 2 * 60, // 2 minutes
      '/dashboard/staff': 3 * 60, // 3 minutes
      '/dashboard/clients': 2 * 60, // 2 minutes
      '/enhanced-demo': 30, // 30 seconds
    },
    
    // Optimize package imports
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'recharts',
      'sonner',
      'react-day-picker',
      'react-hook-form',
      'zod',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
    ],
  },
};
```

## Data Fetching Utilities

### Server-Side Data Fetching

The project implements server-side data fetching using React's `cache` function:

```typescript
// lib/data-fetching.ts
import { cache } from 'react';
import { revalidateTag } from 'next/cache';

/**
 * Cached function for fetching services
 */
export const getServices = cache(async (locationId?: number) => {
  // ... implementation
});

/**
 * Revalidate services data
 */
export async function revalidateServices() {
  'use server';
  revalidateTag('services');
}
```

### Client-Side Data Fetching

Client-side data fetching hooks with currency-aware revalidation:

```typescript
// lib/use-data-fetching.ts
import { useState, useEffect } from 'react';
import { useCurrency } from '@/lib/currency-provider';

/**
 * Hook for fetching data with currency-aware revalidation
 */
export function useFetch<T>(
  fetchFn: () => Promise<T>,
  options: UseFetchOptions = {}
) {
  // ... implementation
}

/**
 * Hook for fetching services with currency-aware revalidation
 */
export function useServices(locationId?: number, options: UseFetchOptions = {}) {
  // ... implementation
}
```

## Currency-Aware Revalidation

The currency provider has been updated to use server actions for revalidation:

```typescript
// lib/currency-provider.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { revalidateServices } from '@/lib/data-fetching';

/**
 * Currency Provider Component
 */
export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  // ... implementation
  
  // Set currency and revalidate data
  const setCurrency = async (newCurrencyCode: string) => {
    // ... implementation
    
    // Revalidate services data
    await revalidateServices();
  };
  
  // ... implementation
}
```

## Performance Monitoring

The project includes a performance monitoring system that tracks Core Web Vitals and other performance metrics:

```typescript
// lib/performance-monitoring.ts
'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to collect performance metrics
 */
export function usePerformanceMetrics(): PerformanceMetrics {
  // ... implementation
}
```

## Demo Pages

The project includes several demo pages that showcase the Next.js 15 enhancements:

- **Enhanced Demo Page**: `/enhanced-demo` - Demonstrates currency-aware data fetching
- **Optimized Dashboard**: `/dashboard/optimized` - Shows optimized components with Next.js 15 features
- **Performance Dashboard**: `/performance` - Displays performance metrics and monitoring tools

## Implementation Examples

### Using the Data Fetching Utilities

```tsx
// Example component using the data fetching utilities
import { useServices } from '@/lib/use-data-fetching';
import { useCurrency } from '@/lib/currency-provider';

export function ServicesList({ locationId }: { locationId?: number }) {
  const { data: services, isLoading, error, refetch } = useServices(locationId);
  const { formatCurrency } = useCurrency();
  
  // ... component implementation
}
```

### Using the Performance Monitoring

```tsx
// Example component using the performance monitoring
import { usePerformanceMetrics } from '@/lib/performance-monitoring';

export function PerformanceDashboard() {
  const metrics = usePerformanceMetrics();
  
  // ... component implementation
}
```

## Testing and Monitoring

### Performance Testing

To test the performance improvements:

1. Visit the `/performance` page to see real-time performance metrics
2. Compare metrics before and after implementing Next.js 15 features
3. Use browser developer tools to analyze network requests and caching

### Monitoring Tools

The project includes several monitoring tools:

- **Performance Dashboard**: Displays Core Web Vitals and other performance metrics
- **Network Monitoring**: Tracks API requests and caching behavior
- **Resource Usage**: Monitors JavaScript, CSS, and image resources

## Conclusion

The Next.js 15 enhancements implemented in this project significantly improve application performance and developer experience. By leveraging improved caching, data fetching, and revalidation strategies, the application provides a faster and more responsive user experience.

For more information about Next.js 15 features, visit the [Next.js documentation](https://nextjs.org/docs).
