'use client';

import { useState } from 'react';
import { useServices } from '@/lib/use-data-fetching';
import { useCurrency } from '@/lib/currency-provider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

/**
 * Enhanced Services List Component
 * 
 * This component demonstrates the use of the new data fetching utilities
 * with currency-aware revalidation.
 */
export function EnhancedServicesList({ locationId }: { locationId?: number }) {
  const { data: services, isLoading, error, refetch } = useServices(locationId);
  const { formatCurrency, currencyCode } = useCurrency();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get unique categories
  const categories = services 
    ? [...new Set(services.map(service => service.category))]
    : [];

  // Filter services by category
  const filteredServices = services
    ? selectedCategory 
      ? services.filter(service => service.category === selectedCategory)
      : services
    : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Services</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{currencyCode}</Badge>
          <Button size="sm" onClick={() => refetch()}>Refresh</Button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button 
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          All
        </Button>
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-md">
          Error loading services: {error.message}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-5/6" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-1/4" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Services grid */}
      {!isLoading && services && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.length === 0 ? (
            <p className="col-span-full text-center text-gray-500">No services found</p>
          ) : (
            filteredServices.map(service => (
              <Card key={service.id}>
                <CardHeader>
                  <CardTitle>{service.name}</CardTitle>
                  <CardDescription>{service.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">{service.description}</p>
                  <div className="mt-2">
                    <Badge variant="outline">{service.duration} min</Badge>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <span className="font-bold">{formatCurrency(service.price)}</span>
                  <Button size="sm">Book Now</Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Currency revalidation notice */}
      <div className="mt-8 p-4 border border-blue-100 bg-blue-50 rounded-md">
        <h3 className="font-semibold text-blue-800">Currency-Aware Revalidation</h3>
        <p className="text-sm text-blue-600 mt-1">
          This component automatically revalidates data when the currency changes.
          Try changing the currency to see it in action.
        </p>
        <p className="text-xs text-blue-500 mt-2">
          Current currency: {currencyCode}
        </p>
      </div>
    </div>
  );
}
