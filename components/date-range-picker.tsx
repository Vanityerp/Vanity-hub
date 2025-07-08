"use client"

import * as React from "react"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { formatAppDate, formatDateRange } from "@/lib/date-utils"
import { CalendarIcon, ChevronDown } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DatePickerWithRangeProps {
  className?: string
  dateRange?: DateRange
  singleDate?: Date
  mode?: "single" | "range"
  onDateRangeChange?: (dateRange: DateRange | undefined) => void
  onSingleDateChange?: (date: Date | undefined) => void
  onModeChange?: (mode: "single" | "range") => void
}

export function DatePickerWithRange({
  className,
  dateRange,
  singleDate,
  mode = "range",
  onDateRangeChange,
  onSingleDateChange,
  onModeChange
}: DatePickerWithRangeProps) {
  const [selectedMode, setSelectedMode] = React.useState<"single" | "range">(mode)
  const [date, setDate] = React.useState<DateRange | undefined>(dateRange)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(singleDate)
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    setDate(dateRange)
  }, [dateRange])

  React.useEffect(() => {
    setSelectedDate(singleDate)
  }, [singleDate])

  React.useEffect(() => {
    setSelectedMode(mode)
  }, [mode])

  const handleDateRangeChange = (newDate: DateRange | undefined) => {
    setDate(newDate)
    if (onDateRangeChange) {
      onDateRangeChange(newDate)
    }
  }

  const handleSingleDateChange = (newDate: Date | undefined) => {
    setSelectedDate(newDate)
    if (onSingleDateChange) {
      onSingleDateChange(newDate)
    }
  }

  const handleModeChange = (newMode: "single" | "range") => {
    setSelectedMode(newMode)
    if (onModeChange) {
      onModeChange(newMode)
    }
  }

  const applyPreset = (preset: string) => {
    const today = new Date()
    let newDateRange: DateRange | undefined

    switch (preset) {
      case "today":
        newDateRange = {
          from: startOfDay(today),
          to: endOfDay(today)
        }
        break
      case "yesterday":
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        newDateRange = {
          from: startOfDay(yesterday),
          to: endOfDay(yesterday)
        }
        break
      case "thisWeek":
        newDateRange = {
          from: startOfWeek(today, { weekStartsOn: 1 }),
          to: endOfWeek(today, { weekStartsOn: 1 })
        }
        break
      case "lastWeek":
        const lastWeekStart = new Date(today)
        lastWeekStart.setDate(lastWeekStart.getDate() - 7)
        newDateRange = {
          from: startOfWeek(lastWeekStart, { weekStartsOn: 1 }),
          to: endOfWeek(lastWeekStart, { weekStartsOn: 1 })
        }
        break
      case "thisMonth":
        newDateRange = {
          from: startOfMonth(today),
          to: endOfMonth(today)
        }
        break
      case "lastMonth":
        const lastMonth = new Date(today)
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        newDateRange = {
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth)
        }
        break
      default:
        newDateRange = undefined
    }

    if (newDateRange) {
      setDate(newDateRange)
      if (onDateRangeChange) {
        onDateRangeChange(newDateRange)
      }

      // If we're in single mode, also update the single date to the start date
      if (selectedMode === "single") {
        setSelectedDate(newDateRange.from)
        if (onSingleDateChange) {
          onSingleDateChange(newDateRange.from)
        }
      }
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn("w-[300px] justify-start text-left font-normal",
              (!date && !selectedDate) && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedMode === "range" ? (
              date?.from ? (
                formatDateRange(date.from, date.to)
              ) : (
                <span>Pick a date range</span>
              )
            ) : (
              selectedDate ? (
                formatAppDate(selectedDate)
              ) : (
                <span>Pick a date</span>
              )
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-2 border-b">
            <Tabs defaultValue={selectedMode} onValueChange={(value) => handleModeChange(value as "single" | "range")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single">Single Date</TabsTrigger>
                <TabsTrigger value="range">Date Range</TabsTrigger>
              </TabsList>
              <TabsContent value="single" className="pt-2">
                <Calendar
                  initialFocus
                  mode="single"
                  defaultMonth={selectedDate}
                  selected={selectedDate}
                  onSelect={handleSingleDateChange}
                  numberOfMonths={1}
                />
              </TabsContent>
              <TabsContent value="range" className="pt-2">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={2}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="p-2 border-t">
            <div className="text-sm font-medium mb-2">Quick Select</div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => applyPreset("today")}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => applyPreset("yesterday")}>
                Yesterday
              </Button>
              <Button variant="outline" size="sm" onClick={() => applyPreset("thisWeek")}>
                This Week
              </Button>
              <Button variant="outline" size="sm" onClick={() => applyPreset("lastWeek")}>
                Last Week
              </Button>
              <Button variant="outline" size="sm" onClick={() => applyPreset("thisMonth")}>
                This Month
              </Button>
              <Button variant="outline" size="sm" onClick={() => applyPreset("lastMonth")}>
                Last Month
              </Button>
            </div>
          </div>

          <div className="flex justify-end p-2 border-t">
            <Button size="sm" onClick={() => setIsOpen(false)}>
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}