"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { addMonths, format, getDay, getDaysInMonth, isSameDay, isToday, startOfMonth, subMonths } from "date-fns"

interface SimpleCalendarProps {
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  disabledDates?: (date: Date) => boolean
}

export function SimpleCalendar({
  selectedDate,
  onDateSelect,
  disabledDates
}: SimpleCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  
  const handlePrevMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1))
  }
  
  const handleNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1))
  }
  
  const handleDateClick = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date)
    }
  }
  
  // Generate calendar days
  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth)
    const startDay = getDay(monthStart) // 0 for Sunday, 1 for Monday, etc.
    const daysInMonth = getDaysInMonth(currentMonth)
    
    const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
    
    // Create calendar rows
    const rows = []
    let days = []
    
    // Add day headers
    const dayHeaders = dayNames.map(day => (
      <th key={day} className="text-center p-1 text-xs font-semibold text-gray-600">
        {day}
      </th>
    ))
    rows.push(<tr key="header">{dayHeaders}</tr>)
    
    // Add blank cells for days before the first of the month
    for (let i = 0; i < startDay; i++) {
      days.push(
        <td key={`empty-${i}`} className="p-0 text-center h-10 w-10"></td>
      )
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      const isDisabled = disabledDates ? disabledDates(date) : false
      const isSelected = selectedDate ? isSameDay(date, selectedDate) : false
      const isTodayDate = isToday(date)
      
      days.push(
        <td key={day} className="p-0 text-center">
          <button
            type="button"
            onClick={() => !isDisabled && handleDateClick(date)}
            disabled={isDisabled}
            className={`
              h-10 w-10 rounded-full mx-auto flex items-center justify-center text-sm
              ${isSelected 
                ? 'bg-pink-600 text-white hover:bg-pink-700' 
                : isTodayDate 
                  ? 'border border-pink-600 font-bold' 
                  : 'hover:bg-gray-100'
              }
              ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {day}
          </button>
        </td>
      )
      
      // Start a new row after Saturday (index 6)
      if ((startDay + day) % 7 === 0 || day === daysInMonth) {
        // If it's the last day and doesn't end on Saturday, add empty cells
        if (day === daysInMonth && (startDay + day) % 7 !== 0) {
          const remainingCells = 7 - ((startDay + day) % 7)
          for (let i = 0; i < remainingCells; i++) {
            days.push(
              <td key={`empty-end-${i}`} className="p-0 text-center h-10 w-10"></td>
            )
          }
        }
        
        rows.push(<tr key={day}>{days}</tr>)
        days = []
      }
    }
    
    return rows
  }
  
  return (
    <div className="p-4 bg-white rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h2 className="text-base font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <table className="w-full border-collapse">
        <tbody>
          {renderCalendar()}
        </tbody>
      </table>
    </div>
  )
}
