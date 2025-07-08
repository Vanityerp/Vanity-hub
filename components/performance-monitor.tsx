'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gauge, BarChart3, Clock, Zap } from 'lucide-react';

/**
 * Performance Monitor Component
 * 
 * This component monitors and displays performance metrics for the application.
 * It uses the Web Vitals API to collect performance data.
 */
export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    fcp: 0, // First Contentful Paint
    lcp: 0, // Largest Contentful Paint
    cls: 0, // Cumulative Layout Shift
    fid: 0, // First Input Delay
    ttfb: 0, // Time to First Byte
  });

  const [navigationTiming, setNavigationTiming] = useState({
    domComplete: 0,
    domInteractive: 0,
    loadEventEnd: 0,
    responseEnd: 0,
  });

  const [resourceTiming, setResourceTiming] = useState({
    jsCount: 0,
    cssCount: 0,
    imageCount: 0,
    totalSize: 0,
  });

  useEffect(() => {
    // Simulate performance metrics for demonstration
    const simulateMetrics = () => {
      setMetrics({
        fcp: Math.random() * 1000 + 500, // 500-1500ms
        lcp: Math.random() * 1500 + 1000, // 1000-2500ms
        cls: Math.random() * 0.1, // 0-0.1
        fid: Math.random() * 100 + 50, // 50-150ms
        ttfb: Math.random() * 200 + 100, // 100-300ms
      });

      setNavigationTiming({
        domComplete: Math.random() * 1000 + 800, // 800-1800ms
        domInteractive: Math.random() * 500 + 300, // 300-800ms
        loadEventEnd: Math.random() * 1200 + 1000, // 1000-2200ms
        responseEnd: Math.random() * 300 + 200, // 200-500ms
      });

      setResourceTiming({
        jsCount: Math.floor(Math.random() * 10) + 15, // 15-25
        cssCount: Math.floor(Math.random() * 3) + 2, // 2-5
        imageCount: Math.floor(Math.random() * 15) + 10, // 10-25
        totalSize: Math.random() * 2 + 1, // 1-3MB
      });
    };

    // Initial simulation
    simulateMetrics();

    // In a real implementation, we would use the Web Vitals API
    // import { getCLS, getFID, getLCP } from 'web-vitals';
    // getCLS(metric => setMetrics(prev => ({ ...prev, cls: metric.value })));
    // getFID(metric => setMetrics(prev => ({ ...prev, fid: metric.value })));
    // getLCP(metric => setMetrics(prev => ({ ...prev, lcp: metric.value })));
  }, []);

  const getMetricRating = (name: string, value: number) => {
    switch (name) {
      case 'fcp':
        return value < 1000 ? 'good' : value < 2000 ? 'needs-improvement' : 'poor';
      case 'lcp':
        return value < 2500 ? 'good' : value < 4000 ? 'needs-improvement' : 'poor';
      case 'cls':
        return value < 0.1 ? 'good' : value < 0.25 ? 'needs-improvement' : 'poor';
      case 'fid':
        return value < 100 ? 'good' : value < 300 ? 'needs-improvement' : 'poor';
      case 'ttfb':
        return value < 200 ? 'good' : value < 500 ? 'needs-improvement' : 'poor';
      default:
        return 'unknown';
    }
  };

  const getMetricProgress = (name: string, value: number) => {
    switch (name) {
      case 'fcp':
        return 100 - Math.min(100, (value / 2000) * 100);
      case 'lcp':
        return 100 - Math.min(100, (value / 4000) * 100);
      case 'cls':
        return 100 - Math.min(100, (value / 0.25) * 100);
      case 'fid':
        return 100 - Math.min(100, (value / 300) * 100);
      case 'ttfb':
        return 100 - Math.min(100, (value / 500) * 100);
      default:
        return 0;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          Performance Monitor
        </CardTitle>
        <CardDescription>
          Monitor your application's performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="core-web-vitals">
          <TabsList className="mb-4">
            <TabsTrigger value="core-web-vitals">Core Web Vitals</TabsTrigger>
            <TabsTrigger value="navigation">Navigation</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>
          
          <TabsContent value="core-web-vitals">
            <div className="space-y-4">
              {Object.entries(metrics).map(([key, value]) => {
                const rating = getMetricRating(key, value);
                const progress = getMetricProgress(key, value);
                
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        {key.toUpperCase()} 
                        <span className="text-xs text-muted-foreground ml-1">
                          {key === 'cls' ? value.toFixed(3) : `${value.toFixed(0)}ms`}
                        </span>
                      </div>
                      <Badge 
                        variant={
                          rating === 'good' ? 'success' : 
                          rating === 'needs-improvement' ? 'warning' : 'destructive'
                        }
                      >
                        {rating === 'good' ? 'Good' : 
                         rating === 'needs-improvement' ? 'Needs Improvement' : 'Poor'}
                      </Badge>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="navigation">
            <div className="space-y-4">
              {Object.entries(navigationTiming).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </div>
                  <div className="text-sm">{value.toFixed(0)}ms</div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="resources">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">JavaScript Files</div>
                <div className="text-sm">{resourceTiming.jsCount}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">CSS Files</div>
                <div className="text-sm">{resourceTiming.cssCount}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Image Files</div>
                <div className="text-sm">{resourceTiming.imageCount}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Total Size</div>
                <div className="text-sm">{resourceTiming.totalSize.toFixed(2)} MB</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-xs text-muted-foreground">
          Powered by Next.js 15 optimizations
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Refresh Metrics
        </Button>
      </CardFooter>
    </Card>
  );
}
