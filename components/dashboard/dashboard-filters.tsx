"use client"

import { useState, useEffect } from "react"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from "date-fns"
import { formatAppDate, formatDateRange } from "@/lib/date-utils"
import { CalendarIcon, ChevronDown, Sparkles, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LocationSelector } from "@/components/location-selector"
import { useAuth } from "@/lib/auth-provider"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface DashboardFiltersProps {
  onDateRangeChange?: (dateRange: DateRange) => void
  className?: string
}

export function DashboardFilters({ onDateRangeChange, className }: DashboardFiltersProps) {
  const { currentLocation } = useAuth()
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date())
  })
  const [selectedPreset, setSelectedPreset] = useState<string>("today")
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // Apply the date range change
  useEffect(() => {
    if (onDateRangeChange) {
      onDateRangeChange(dateRange)
    }
  }, [dateRange, onDateRangeChange])

  // Handle preset selection
  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset)

    const today = new Date()
    let newRange: DateRange = { from: today, to: today }

    switch (preset) {
      case "today":
        newRange = {
          from: startOfDay(today),
          to: endOfDay(today)
        }
        break
      case "yesterday":
        const yesterday = subDays(today, 1)
        newRange = {
          from: startOfDay(yesterday),
          to: endOfDay(yesterday)
        }
        break
      case "week":
        newRange = {
          from: startOfWeek(today, { weekStartsOn: 1 }),
          to: endOfWeek(today, { weekStartsOn: 1 })
        }
        break
      case "month":
        newRange = {
          from: startOfMonth(today),
          to: endOfMonth(today)
        }
        break
      case "year":
        newRange = {
          from: startOfYear(today),
          to: endOfYear(today)
        }
        break
    }

    setDateRange(newRange)
  }

  // Handle custom date range selection
  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from) {
      setDateRange({
        from: range.from,
        to: range.to || range.from
      })

      // If a custom range is selected, clear the preset
      setSelectedPreset("custom")
    }
  }

  // Format the date range for display
  const formatDateRangeDisplay = () => {
    if (!dateRange.from) return "Select date range"

    if (selectedPreset !== "custom") {
      const presetLabels: Record<string, string> = {
        today: "Today",
        yesterday: "Yesterday",
        week: "This Week",
        month: "This Month",
        year: "This Year"
      }
      return presetLabels[selectedPreset] || "Custom Range"
    }

    return formatDateRange(dateRange.from, dateRange.to)
  }

  return (
    <div className={cn("flex flex-col sm:flex-row items-center gap-2", className)}>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Tabs
          value={selectedPreset}
          onValueChange={handlePresetChange}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="yesterday">Yesterday</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </Tabs>

        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="justify-start text-left font-normal w-full sm:w-[240px]"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>{formatDateRangeDisplay()}</span>
              <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={dateRange}
              onSelect={handleDateRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="w-full sm:w-auto sm:ml-auto flex items-center gap-2">
        <LocationSelector />
        <Link href="/dashboard/optimized">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Next.js 15</span>
            <Badge variant="secondary" className="ml-1 text-xs">New</Badge>
          </Button>
        </Link>
        <Link href="/performance">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Performance</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}
