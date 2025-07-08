'use client';

import { OptimizedServicesList } from '@/components/dashboard/optimized-services-list';
import { OptimizedClientsList } from '@/components/dashboard/optimized-clients-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PerformanceMonitor } from '@/components/performance-monitor';

/**
 * Optimized Dashboard Page
 *
 * This page demonstrates the use of Next.js 15 optimized data fetching
 * in a dashboard context.
 */
export default function OptimizedDashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href="/dashboard">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Optimized Dashboard</h1>
        <Link href="/NEXT_JS_15_ENHANCEMENTS.md" target="_blank">
          <Button variant="outline" size="sm" className="ml-auto flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            Documentation
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Next.js 15 Features
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <ul className="list-disc list-inside space-y-1">
                <li>Improved client-side router caching</li>
                <li>Enhanced data fetching with tags</li>
                <li>Currency-aware revalidation</li>
                <li>Optimized package imports</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Performance Benefits
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <ul className="list-disc list-inside space-y-1">
                <li>Faster page loads</li>
                <li>Reduced server load</li>
                <li>Better user experience</li>
                <li>Improved code quality</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Implementation Details
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <ul className="list-disc list-inside space-y-1">
                <li>React's cache for data caching</li>
                <li>Tag-based revalidation</li>
                <li>Currency-aware hooks</li>
                <li>Optimized components</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="services" className="w-full">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>
        <TabsContent value="services" className="p-4 border rounded-md mt-2">
          <OptimizedServicesList />
        </TabsContent>
        <TabsContent value="clients" className="p-4 border rounded-md mt-2">
          <OptimizedClientsList />
        </TabsContent>
        <TabsContent value="performance" className="p-4 border rounded-md mt-2">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground mb-4">
                This performance monitor demonstrates how Next.js 15 optimizations can improve your application's performance metrics.
                The data shown is simulated for demonstration purposes.
              </p>
            </div>
            <PerformanceMonitor />
            <Card>
              <CardHeader>
                <CardTitle>Performance Improvements</CardTitle>
                <CardDescription>
                  Key metrics improved by Next.js 15
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong>Faster Initial Load:</strong> Optimized package imports reduce bundle size
                  </li>
                  <li>
                    <strong>Improved LCP:</strong> Better caching strategies for faster content display
                  </li>
                  <li>
                    <strong>Reduced CLS:</strong> More stable layouts with improved rendering
                  </li>
                  <li>
                    <strong>Better FID:</strong> More responsive interactions with optimized client-side code
                  </li>
                  <li>
                    <strong>Optimized TTFB:</strong> Faster server response times with improved data fetching
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="about" className="p-4 border rounded-md mt-2">
          <Card>
            <CardHeader>
              <CardTitle>About Next.js 15 Optimizations</CardTitle>
              <CardDescription>
                Learn how these optimizations improve your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                The optimizations implemented in this dashboard leverage Next.js 15's improved caching and data fetching capabilities to provide a faster, more responsive user experience.
              </p>
              <p className="mb-4">
                Key features include:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>
                  <strong>React's cache:</strong> Efficiently caches data to reduce redundant fetches
                </li>
                <li>
                  <strong>Tag-based revalidation:</strong> Intelligently invalidates cache when data changes
                </li>
                <li>
                  <strong>Currency-aware revalidation:</strong> Automatically refreshes data when currency changes
                </li>
                <li>
                  <strong>Optimized package imports:</strong> Reduces bundle size for faster page loads
                </li>
              </ul>
              <p>
                These optimizations work together to create a more responsive and efficient application, improving both user experience and server performance.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
