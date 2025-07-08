'use client';

import { usePerformanceMetrics, getMetricRating, getMetricProgress } from '@/lib/performance-monitoring';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gauge, BarChart3, Clock, Zap, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * Performance Dashboard Component
 * 
 * This component displays performance metrics for the application.
 */
export function PerformanceDashboard() {
  const metrics = usePerformanceMetrics();
  const [refreshCount, setRefreshCount] = useState(0);
  
  // Force refresh metrics
  const refreshMetrics = () => {
    setRefreshCount(prev => prev + 1);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          Performance Dashboard
        </CardTitle>
        <CardDescription>
          Real-time performance metrics powered by Web Vitals
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
              {/* LCP - Largest Contentful Paint */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    LCP 
                    <span className="text-xs text-muted-foreground ml-1">
                      {metrics.lcp ? `${metrics.lcp.toFixed(0)}ms` : 'Measuring...'}
                    </span>
                  </div>
                  {metrics.lcp && (
                    <Badge 
                      variant={
                        getMetricRating('lcp', metrics.lcp) === 'good' ? 'success' : 
                        getMetricRating('lcp', metrics.lcp) === 'needs-improvement' ? 'warning' : 'destructive'
                      }
                    >
                      {getMetricRating('lcp', metrics.lcp) === 'good' ? 'Good' : 
                       getMetricRating('lcp', metrics.lcp) === 'needs-improvement' ? 'Needs Improvement' : 'Poor'}
                    </Badge>
                  )}
                </div>
                <Progress value={metrics.lcp ? getMetricProgress('lcp', metrics.lcp) : 0} className="h-2" />
                <p className="text-xs text-muted-foreground">Largest Contentful Paint - measures loading performance</p>
              </div>
              
              {/* FID - First Input Delay */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    FID 
                    <span className="text-xs text-muted-foreground ml-1">
                      {metrics.fid ? `${metrics.fid.toFixed(0)}ms` : 'Measuring...'}
                    </span>
                  </div>
                  {metrics.fid && (
                    <Badge 
                      variant={
                        getMetricRating('fid', metrics.fid) === 'good' ? 'success' : 
                        getMetricRating('fid', metrics.fid) === 'needs-improvement' ? 'warning' : 'destructive'
                      }
                    >
                      {getMetricRating('fid', metrics.fid) === 'good' ? 'Good' : 
                       getMetricRating('fid', metrics.fid) === 'needs-improvement' ? 'Needs Improvement' : 'Poor'}
                    </Badge>
                  )}
                </div>
                <Progress value={metrics.fid ? getMetricProgress('fid', metrics.fid) : 0} className="h-2" />
                <p className="text-xs text-muted-foreground">First Input Delay - measures interactivity</p>
              </div>
              
              {/* CLS - Cumulative Layout Shift */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    CLS 
                    <span className="text-xs text-muted-foreground ml-1">
                      {metrics.cls ? metrics.cls.toFixed(3) : 'Measuring...'}
                    </span>
                  </div>
                  {metrics.cls && (
                    <Badge 
                      variant={
                        getMetricRating('cls', metrics.cls) === 'good' ? 'success' : 
                        getMetricRating('cls', metrics.cls) === 'needs-improvement' ? 'warning' : 'destructive'
                      }
                    >
                      {getMetricRating('cls', metrics.cls) === 'good' ? 'Good' : 
                       getMetricRating('cls', metrics.cls) === 'needs-improvement' ? 'Needs Improvement' : 'Poor'}
                    </Badge>
                  )}
                </div>
                <Progress value={metrics.cls ? getMetricProgress('cls', metrics.cls) : 0} className="h-2" />
                <p className="text-xs text-muted-foreground">Cumulative Layout Shift - measures visual stability</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="navigation">
            <div className="space-y-4">
              {/* TTFB - Time to First Byte */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    TTFB 
                    <span className="text-xs text-muted-foreground ml-1">
                      {metrics.ttfb ? `${metrics.ttfb.toFixed(0)}ms` : 'Measuring...'}
                    </span>
                  </div>
                  {metrics.ttfb && (
                    <Badge 
                      variant={
                        getMetricRating('ttfb', metrics.ttfb) === 'good' ? 'success' : 
                        getMetricRating('ttfb', metrics.ttfb) === 'needs-improvement' ? 'warning' : 'destructive'
                      }
                    >
                      {getMetricRating('ttfb', metrics.ttfb) === 'good' ? 'Good' : 
                       getMetricRating('ttfb', metrics.ttfb) === 'needs-improvement' ? 'Needs Improvement' : 'Poor'}
                    </Badge>
                  )}
                </div>
                <Progress value={metrics.ttfb ? getMetricProgress('ttfb', metrics.ttfb) : 0} className="h-2" />
                <p className="text-xs text-muted-foreground">Time to First Byte - measures server response time</p>
              </div>
              
              {/* Navigation Timing */}
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">DOM Interactive</div>
                  <div className="text-sm">{metrics.domInteractive ? `${metrics.domInteractive.toFixed(0)}ms` : 'Measuring...'}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">DOM Complete</div>
                  <div className="text-sm">{metrics.domComplete ? `${metrics.domComplete.toFixed(0)}ms` : 'Measuring...'}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Load Event End</div>
                  <div className="text-sm">{metrics.loadEventEnd ? `${metrics.loadEventEnd.toFixed(0)}ms` : 'Measuring...'}</div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="resources">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">JavaScript Files</div>
                <div className="text-sm">{metrics.jsCount}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">CSS Files</div>
                <div className="text-sm">{metrics.cssCount}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Image Files</div>
                <div className="text-sm">{metrics.imageCount}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Total Resource Size</div>
                <div className="text-sm">{metrics.totalResourceSize.toFixed(2)} MB</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-xs text-muted-foreground">
          Powered by Next.js 15 optimizations
        </div>
        <Button variant="outline" size="sm" onClick={refreshMetrics} className="flex items-center gap-1">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Metrics
        </Button>
      </CardFooter>
    </Card>
  );
}
