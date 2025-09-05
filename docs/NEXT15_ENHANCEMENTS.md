# Next.js 15 Enhancements

This document outlines the enhancements made to the Vanity Hub application to take advantage of Next.js 15 features and improve performance.

## 1. Next.js Configuration Updates

The `next.config.mjs` file has been updated with the following enhancements:

### New Next.js 15 Features

```javascript
experimental: {
  // Next.js 15 features
  staleTimes: {
    dynamic: 0, // Dynamic routes are always fresh
    static: 180, // Static routes are cached for 3 minutes
  },
  dynamicIO: true, // Optimized data fetching in App Router

  // ...other settings
}
```

- **staleTimes**: Configures client-side router caching for improved performance
  - `dynamic: 0`: Dynamic routes are always fresh
  - `static: 180`: Static routes are cached for 3 minutes

- **Note on dynamicIO**: This feature requires the canary version of Next.js
  - Would improve data fetching performance in App Router
  - Would reduce server-side rendering time
  - Would optimize data transfer between server and client
  - Currently not enabled as it requires Next.js canary

### Enhanced Package Optimizations

```javascript
// Enhanced package optimizations
optimizePackageImports: [
  'recharts',
  '@radix-ui/react-icons',
  'lucide-react',
  '@radix-ui/react-dialog',
  '@radix-ui/react-dropdown-menu',
  '@radix-ui/react-popover',
  'date-fns',
  'sonner'
],
```

- Expanded the list of packages to optimize for better performance

### Server Component Optimization

```javascript
// Server component optimization
serverExternalPackages: ['bcryptjs', 'pg'],
```

- Added `serverExternalPackages` to optimize server components that use these packages

## 2. Enhanced Caching System

A new caching system has been implemented to take advantage of Next.js 15's improved caching features:

### Cache Utilities

#### Next Cache Utility (`lib/next-cache.ts`)
- Defines cache tags for different data types
- Uses Next.js's `unstable_cache` function for server components
- Falls back to React's `cache` function for client components
- Provides improved tag-based revalidation
- Includes error handling and logging

#### Cache Actions (`lib/cache-actions.ts`)
- `revalidateCacheTags`: Enhanced server action to revalidate cache entries by tags and paths
- `revalidateCurrencyCache`: Server action to revalidate all currency-related cache entries
- `revalidateDataCache`: Server action to revalidate specific data cache entries
- Improved error handling and logging
- Custom event dispatching for client-side notification

### Data Fetching Utilities (`lib/data-fetching.ts`)

Server-side data fetching functions with optimized caching:

- `fetchClients`: Fetch clients with optimized caching
- `fetchServices`: Fetch services with optimized caching
- `fetchAppointments`: Fetch appointments with optimized caching
- `fetchInventory`: Fetch inventory with optimized caching

### Client-Side Data Fetching Hooks (`lib/use-data-fetching.ts`)

Client-side hooks for data fetching with currency-aware revalidation:

- `useFetch`: Generic hook for fetching data with currency-aware revalidation
- `useClients`: Hook for fetching clients with currency-aware revalidation
- `useServices`: Hook for fetching services with currency-aware revalidation

## 3. Currency Implementation Improvements

The currency implementation has been enhanced to use Next.js 15's improved cache tagging system:

### Currency Provider Updates (`lib/currency-provider.tsx`)

- Added cache revalidation when currency changes
- Added custom event dispatch for components to listen for currency changes

### Global Currency Enforcer Updates (`components/global-currency-enforcer.tsx`)

- Added listener for currency cache revalidation events
- Improved DOM processing when currency changes

## 4. ESLint Configuration Update

A new ESLint configuration has been created using the flat config format:

### ESLint Flat Config (`eslint.config.mjs`)

- Uses the new ESLint flat config format
- Implements core-web-vitals rules for better performance
- Adds TypeScript-specific rules
- Configures React and Next.js specific rules

### Package.json Script Updates

```json
"scripts": {
  "lint": "eslint --config eslint.config.mjs .",
  "lint:fix": "eslint --config eslint.config.mjs --fix .",
  "lint:next": "next lint"
}
```

## 5. Usage Examples

### Using the Enhanced Data Fetching

#### Server Components

```tsx
import { fetchClients } from '@/lib/data-fetching';

export default async function ClientsPage() {
  const clients = await fetchClients();

  return (
    <div>
      <h1>Clients</h1>
      <ul>
        {clients.map(client => (
          <li key={client.id}>{client.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

#### Client Components

```tsx
'use client';

import { useClients } from '@/lib/use-data-fetching';

export default function ClientsList() {
  const { data: clients, isLoading, error, refetch } = useClients();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      <ul>
        {clients?.map(client => (
          <li key={client.id}>{client.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Using the Currency Selector Component

```tsx
'use client';

import { CurrencySelector } from '@/components/currency-selector';

export default function Header() {
  return (
    <header className="flex justify-between items-center p-4 border-b">
      <h1 className="text-xl font-bold">Vanity Hub</h1>
      <CurrencySelector popularOnly showSymbol showBadge />
    </header>
  );
}
```

### Using the Enhanced Services List Component

```tsx
'use client';

import { EnhancedServicesList } from '@/components/enhanced-services-list';

export default function ServicesPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Our Services</h1>
      <EnhancedServicesList />
    </div>
  );
}
```

### Implementing Cache Revalidation in API Routes

```tsx
// app/api/services/route.ts
import { NextResponse } from "next/server";
import { revalidateDataCache } from "@/lib/cache-actions";
import { DATA_CACHE_TAGS } from "@/lib/next-cache";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Process the data and update the database
    // ...

    // Revalidate the services cache using the server action
    await revalidateDataCache([DATA_CACHE_TAGS.SERVICES]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
}
```

## 5. Performance Monitoring

An enhanced performance monitoring system has been implemented to track Core Web Vitals and other performance metrics:

### Performance Monitoring Utilities (`lib/performance-monitoring.ts`)

- Collects Core Web Vitals metrics (LCP, FID, CLS)
- Tracks additional metrics (TTFB, FCP, INP)
- Monitors navigation timing metrics
- Tracks resource usage (JS, CSS, images)
- Periodic refresh of resource metrics
- Improved error handling
- Optional analytics integration

### Performance Dashboard (`components/performance-dashboard.tsx`)

- Real-time display of performance metrics
- Visual indicators for metric ratings (good, needs improvement, poor)
- Separate tabs for Core Web Vitals, Navigation, and Resources
- Recommendations for performance improvements

## 6. Benefits

These enhancements provide the following benefits:

1. **Improved Performance**: Better caching and optimized data fetching
2. **Reduced Server Load**: More efficient use of server resources
3. **Better User Experience**: Faster page loads and smoother navigation
4. **Improved Code Quality**: Better linting and type checking
5. **Enhanced Currency Handling**: More consistent currency display across the application
