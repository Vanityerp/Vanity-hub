'use client';

import { useState } from 'react';
import { EnhancedServicesList } from '@/components/enhanced-services-list';
import { useCurrency } from '@/lib/currency-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { currencies, getAllCurrencies } from '@/lib/currency-data';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * Enhanced Demo Page
 *
 * This page demonstrates the Next.js 15 enhancements, particularly:
 * - Currency-aware data fetching
 * - Cache revalidation
 * - Improved performance
 */
export default function EnhancedDemoPage() {
  const { currencyCode, setCurrency } = useCurrency();
  const [locationId, setLocationId] = useState<number | undefined>(undefined);

  // Get all available currencies with error handling
  let allCurrencies: Currency[] = [];
  try {
    allCurrencies = getAllCurrencies();
  } catch (error) {
    console.error('Error getting currencies:', error);
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Next.js 15 Enhancements Demo</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Currency Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Change the currency to see automatic data revalidation in action.
            </p>
            <Select
              value={currencyCode}
              onValueChange={(value) => setCurrency(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {allCurrencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name} ({currency.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Filter services by location to test data fetching with parameters.
            </p>
            <Select
              value={locationId?.toString() || ""}
              onValueChange={(value) => setLocationId(value ? parseInt(value) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All locations</SelectItem>
                <SelectItem value="1">D-Ring Road</SelectItem>
                <SelectItem value="2">Al Sadd</SelectItem>
                <SelectItem value="3">The Pearl</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next.js 15 Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Improved client-side router caching</li>
              <li>Enhanced data fetching with tags</li>
              <li>Currency-aware revalidation</li>
              <li>Optimized package imports</li>
              <li>Better performance</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <EnhancedServicesList locationId={locationId} />
    </div>
  );
}
