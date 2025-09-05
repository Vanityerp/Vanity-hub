"use client"

import React, { useState, useEffect, Suspense, memo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Import recharts components dynamically to reduce initial bundle size
import dynamic from 'next/dynamic'

const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => mod.ResponsiveContainer),
  { ssr: false }
)

const LineChart = dynamic(
  () => import('recharts').then(mod => mod.LineChart),
  { ssr: false }
)

const BarChart = dynamic(
  () => import('recharts').then(mod => mod.BarChart),
  { ssr: false }
)

const AreaChart = dynamic(
  () => import('recharts').then(mod => mod.AreaChart),
  { ssr: false }
)

const PieChart = dynamic(
  () => import('recharts').then(mod => mod.PieChart),
  { ssr: false }
)

// Dynamically import other recharts components
const CartesianGrid = dynamic(
  () => import('recharts').then(mod => mod.CartesianGrid),
  { ssr: false }
)

const XAxis = dynamic(
  () => import('recharts').then(mod => mod.XAxis),
  { ssr: false }
)

const YAxis = dynamic(
  () => import('recharts').then(mod => mod.YAxis),
  { ssr: false }
)

const Tooltip = dynamic(
  () => import('recharts').then(mod => mod.Tooltip),
  { ssr: false }
)

const Legend = dynamic(
  () => import('recharts').then(mod => mod.Legend),
  { ssr: false }
)

const Line = dynamic(
  () => import('recharts').then(mod => mod.Line),
  { ssr: false }
)

const Bar = dynamic(
  () => import('recharts').then(mod => mod.Bar),
  { ssr: false }
)

const Area = dynamic(
  () => import('recharts').then(mod => mod.Area),
  { ssr: false }
)

const Pie = dynamic(
  () => import('recharts').then(mod => mod.Pie),
  { ssr: false }
)

// Loading component
const ChartLoading = memo(({ height }: { height: number | string }) => (
  <div style={{ height, width: '100%' }} className="flex items-center justify-center">
    <Skeleton className="h-full w-full" />
  </div>
))
ChartLoading.displayName = 'ChartLoading'

interface LazyChartProps {
  type: 'line' | 'bar' | 'area' | 'pie'
  data: any[]
  height?: number | string
  width?: number | string
  children: React.ReactNode
  className?: string
}

export const LazyChart = memo(({
  type,
  data,
  height = 300,
  width = '100%',
  children,
  className = ''
}: LazyChartProps) => {
  const [isClient, setIsClient] = useState(false)

  // Only render the chart on the client side
  useEffect(() => {
    // Use requestIdleCallback for non-critical initialization
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        setIsClient(true)
      })
    } else {
      // Fallback to setTimeout for browsers that don't support requestIdleCallback
      setTimeout(() => setIsClient(true), 0)
    }
  }, [])

  // Render loading state if not on client
  if (!isClient) {
    return <ChartLoading height={height} />
  }

  // Render the actual chart
  return (
    <Suspense fallback={<ChartLoading height={height} />}>
      <ResponsiveContainer width={width} height={height} className={className}>
        {type === 'line' && <LineChart data={data}>{children}</LineChart>}
        {type === 'bar' && <BarChart data={data}>{children}</BarChart>}
        {type === 'area' && <AreaChart data={data}>{children}</AreaChart>}
        {type === 'pie' && <PieChart data={data}>{children}</PieChart>}
      </ResponsiveContainer>
    </Suspense>
  )
})

// Export chart components for use with LazyChart
export {
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  Bar,
  Area,
  Pie
}

// Add display name for better debugging
LazyChart.displayName = 'LazyChart'
