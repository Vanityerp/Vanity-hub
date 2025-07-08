'use client';

import { PerformanceDashboard } from '@/components/performance-dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap, BarChart3, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

/**
 * Performance Monitoring Page
 * 
 * This page displays performance metrics for the application.
 */
export default function PerformancePage() {
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Force refresh the page
  const refreshPage = () => {
    window.location.reload();
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Performance Monitoring</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Next.js 15 Optimizations
            </CardTitle>
            <CardDescription>
              Performance improvements from Next.js 15
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              <li>Improved client-side router caching with staleTimes</li>
              <li>Enhanced data fetching with React's cache</li>
              <li>Tag-based revalidation for better caching</li>
              <li>Optimized package imports for smaller bundles</li>
              <li>Currency-aware revalidation for consistent data</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Core Web Vitals
            </CardTitle>
            <CardDescription>
              Key metrics for measuring user experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>LCP</strong>: Largest Contentful Paint - loading</li>
              <li><strong>FID</strong>: First Input Delay - interactivity</li>
              <li><strong>CLS</strong>: Cumulative Layout Shift - stability</li>
              <li><strong>TTFB</strong>: Time to First Byte - server response</li>
              <li><strong>FCP</strong>: First Contentful Paint - initial render</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Testing Instructions
            </CardTitle>
            <CardDescription>
              How to test performance improvements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              <li>Compare metrics before and after optimizations</li>
              <li>Test with different network conditions</li>
              <li>Monitor resource usage and bundle sizes</li>
              <li>Check for layout shifts and visual stability</li>
              <li>Measure server response times</li>
            </ul>
            <Button 
              onClick={refreshPage} 
              className="w-full mt-4"
              variant="outline"
            >
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <PerformanceDashboard key={refreshKey} />
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Performance Improvement Recommendations</CardTitle>
            <CardDescription>
              Additional optimizations to consider
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">1. Image Optimization</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Use Next.js Image component for automatic optimization, lazy loading, and proper sizing.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">2. Code Splitting</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Use dynamic imports to split code into smaller chunks that load on demand.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">3. Preloading Critical Assets</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Use preload and prefetch for critical resources to improve loading performance.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">4. Server Components</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Use React Server Components to reduce client-side JavaScript and improve performance.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">5. Caching Strategies</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Implement appropriate caching strategies for different types of data and resources.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
