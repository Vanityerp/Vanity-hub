'use client';

import { useEffect, useState } from 'react';

/**
 * Performance Metrics Interface
 */
export interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift

  // Additional Metrics
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte

  // Navigation Timing
  domComplete: number | null;
  domInteractive: number | null;
  loadEventEnd: number | null;

  // Resource Timing
  jsCount: number;
  cssCount: number;
  imageCount: number;
  totalResourceSize: number;
}

/**
 * Get Core Web Vitals Rating
 *
 * @param name Metric name
 * @param value Metric value
 * @returns Rating (good, needs-improvement, poor)
 */
export function getMetricRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  switch (name) {
    case 'lcp':
      return value < 2500 ? 'good' : value < 4000 ? 'needs-improvement' : 'poor';
    case 'fid':
      return value < 100 ? 'good' : value < 300 ? 'needs-improvement' : 'poor';
    case 'cls':
      return value < 0.1 ? 'good' : value < 0.25 ? 'needs-improvement' : 'poor';
    case 'fcp':
      return value < 1800 ? 'good' : value < 3000 ? 'needs-improvement' : 'poor';
    case 'ttfb':
      return value < 800 ? 'good' : value < 1800 ? 'needs-improvement' : 'poor';
    default:
      return 'needs-improvement';
  }
}

/**
 * Get Metric Progress Percentage
 *
 * @param name Metric name
 * @param value Metric value
 * @returns Progress percentage (0-100)
 */
export function getMetricProgress(name: string, value: number): number {
  switch (name) {
    case 'lcp':
      return 100 - Math.min(100, (value / 4000) * 100);
    case 'fid':
      return 100 - Math.min(100, (value / 300) * 100);
    case 'cls':
      return 100 - Math.min(100, (value / 0.25) * 100);
    case 'fcp':
      return 100 - Math.min(100, (value / 3000) * 100);
    case 'ttfb':
      return 100 - Math.min(100, (value / 1800) * 100);
    default:
      return 50;
  }
}

/**
 * Get Navigation Timing Metrics
 *
 * @returns Navigation timing metrics
 */
function getNavigationTiming(): {
  domComplete: number | null;
  domInteractive: number | null;
  loadEventEnd: number | null;
  ttfb: number | null;
} {
  if (typeof window === 'undefined' || !window.performance || !window.performance.timing) {
    return {
      domComplete: null,
      domInteractive: null,
      loadEventEnd: null,
      ttfb: null,
    };
  }

  const timing = window.performance.timing;
  const navigationStart = timing.navigationStart;

  return {
    domComplete: timing.domComplete - navigationStart,
    domInteractive: timing.domInteractive - navigationStart,
    loadEventEnd: timing.loadEventEnd - navigationStart,
    ttfb: timing.responseStart - navigationStart,
  };
}

/**
 * Get Resource Timing Metrics
 *
 * @returns Resource timing metrics
 */
function getResourceTiming(): {
  jsCount: number;
  cssCount: number;
  imageCount: number;
  totalResourceSize: number;
} {
  if (typeof window === 'undefined' || !window.performance || !window.performance.getEntriesByType) {
    return {
      jsCount: 0,
      cssCount: 0,
      imageCount: 0,
      totalResourceSize: 0,
    };
  }

  const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];

  let jsCount = 0;
  let cssCount = 0;
  let imageCount = 0;
  let totalResourceSize = 0;

  resources.forEach(resource => {
    const url = resource.name;

    if (url.endsWith('.js')) {
      jsCount++;
    } else if (url.endsWith('.css')) {
      cssCount++;
    } else if (url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.png') || url.endsWith('.gif') || url.endsWith('.webp')) {
      imageCount++;
    }

    // Some browsers support transferSize
    if ('transferSize' in resource) {
      totalResourceSize += (resource as any).transferSize || 0;
    }
  });

  return {
    jsCount,
    cssCount,
    imageCount,
    totalResourceSize: totalResourceSize / (1024 * 1024), // Convert to MB
  };
}

/**
 * Hook to collect performance metrics
 *
 * @returns Performance metrics
 */
export function usePerformanceMetrics(): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    domComplete: null,
    domInteractive: null,
    loadEventEnd: null,
    jsCount: 0,
    cssCount: 0,
    imageCount: 0,
    totalResourceSize: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Get navigation timing metrics
    const navigationTiming = getNavigationTiming();

    // Get resource timing metrics
    const resourceTiming = getResourceTiming();

    // Update metrics
    setMetrics(prev => ({
      ...prev,
      ttfb: navigationTiming.ttfb,
      domComplete: navigationTiming.domComplete,
      domInteractive: navigationTiming.domInteractive,
      loadEventEnd: navigationTiming.loadEventEnd,
      jsCount: resourceTiming.jsCount,
      cssCount: resourceTiming.cssCount,
      imageCount: resourceTiming.imageCount,
      totalResourceSize: resourceTiming.totalResourceSize,
    }));

    // Get FCP
    const entryFCP = performance.getEntriesByName('first-contentful-paint');
    if (entryFCP.length > 0) {
      setMetrics(prev => ({
        ...prev,
        fcp: entryFCP[0].startTime,
      }));
    }

    // Load web-vitals library and report metrics
    const reportWebVitals = async () => {
      try {
        // Import web-vitals with error handling
        const webVitals = await import('web-vitals');

        // Destructure the required functions
        const { onLCP, onFID, onCLS, onTTFB, onFCP, onINP } = webVitals;

        // Report LCP (Largest Contentful Paint)
        onLCP(metric => {
          setMetrics(prev => ({
            ...prev,
            lcp: metric.value,
          }));

          // Optional: Send to analytics
          console.log('LCP:', metric.value);
        });

        // Report FID (First Input Delay)
        onFID(metric => {
          setMetrics(prev => ({
            ...prev,
            fid: metric.value,
          }));

          // Optional: Send to analytics
          console.log('FID:', metric.value);
        });

        // Report CLS (Cumulative Layout Shift)
        onCLS(metric => {
          setMetrics(prev => ({
            ...prev,
            cls: metric.value,
          }));

          // Optional: Send to analytics
          console.log('CLS:', metric.value);
        });

        // Report TTFB (Time to First Byte)
        onTTFB(metric => {
          setMetrics(prev => ({
            ...prev,
            ttfb: metric.value,
          }));

          // Optional: Send to analytics
          console.log('TTFB:', metric.value);
        });

        // Report FCP (First Contentful Paint)
        onFCP(metric => {
          setMetrics(prev => ({
            ...prev,
            fcp: metric.value,
          }));

          // Optional: Send to analytics
          console.log('FCP:', metric.value);
        });

        // Report INP (Interaction to Next Paint) - new metric
        if (onINP) {
          onINP(metric => {
            console.log('INP:', metric.value);
            // This is a newer metric, so we don't have a place for it in our state yet
          });
        }
      } catch (error) {
        console.error('Error loading web-vitals:', error);
      }
    };

    // Call the async function
    reportWebVitals();

    // Set up a periodic refresh of resource metrics
    const intervalId = setInterval(() => {
      const resourceTiming = getResourceTiming();
      setMetrics(prev => ({
        ...prev,
        jsCount: resourceTiming.jsCount,
        cssCount: resourceTiming.cssCount,
        imageCount: resourceTiming.imageCount,
        totalResourceSize: resourceTiming.totalResourceSize,
      }));
    }, 10000); // Refresh every 10 seconds

    // Clean up the interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  return metrics;
}
