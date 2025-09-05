"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

import "react-day-picker/dist/style.css"

export type CustomCalendarProps = React.ComponentProps<typeof DayPicker> & {
  onDateSelect?: (date: Date | undefined) => void
}

function CustomCalendar({
  className,
  classNames,
  showOutsideDays = true,
  onDateSelect,
  ...props
}: CustomCalendarProps) {
  const handleSelect = (date: Date | undefined) => {
    console.log("Date selected in custom calendar:", date);

    // Call the onDateSelect prop if provided
    if (onDateSelect) {
      onDateSelect(date);
    }

    // Call the onSelect prop from props if provided
    if (props.onSelect && typeof props.onSelect === 'function') {
      props.onSelect(date);
    }

    // Force a re-render to ensure the UI updates
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd");
      console.log("Formatted selected date:", formattedDate);
    }
  };

  return (
    <div className="calendar-wrapper">
      <style jsx global>{`
        .calendar-wrapper .rdp {
          --rdp-cell-size: 42px;
          --rdp-accent-color: #db2777;
          --rdp-background-color: #fce7f3;
          margin: 0;
          width: 100%;
        }

        .calendar-wrapper .rdp-months {
          display: flex;
          justify-content: center;
        }

        .calendar-wrapper .rdp-month {
          background-color: #fff;
          border-radius: 12px;
          width: 100%;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          padding: 8px;
        }

        .calendar-wrapper .rdp-caption {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 1rem;
          position: relative;
          margin-bottom: 0.75rem;
          background: linear-gradient(to right, #fdf2f8, #fce7f3);
          border-radius: 8px;
          z-index: 10;
        }

        .calendar-wrapper .rdp-caption_label {
          font-size: 1.125rem;
          font-weight: 700;
          color: #be185d;
          letter-spacing: -0.025em;
          position: relative;
          z-index: 5;
        }

        .calendar-wrapper .rdp-nav {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          position: relative;
          z-index: 15;
        }

        .calendar-wrapper .rdp-nav_button {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: white;
          color: #db2777;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #fce7f3;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
          position: relative;
          z-index: 20;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          outline: none;
        }

        .calendar-wrapper .rdp-nav_button:hover {
          background-color: #fdf2f8;
          transform: scale(1.05);
        }

        .calendar-wrapper .rdp-nav_button:focus-visible {
          outline: 2px solid #db2777;
          outline-offset: 2px;
        }

        .calendar-wrapper .rdp-head_cell {
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          color: #6b7280;
          padding: 0.75rem 0;
          text-align: center;
        }

        .calendar-wrapper .rdp-table {
          width: 100%;
          border-collapse: collapse;
        }

        .calendar-wrapper .rdp-tbody {
          border-top: 1px solid #f3f4f6;
        }

        .calendar-wrapper .rdp-cell {
          text-align: center;
          padding: 2px;
          position: relative;
        }

        .calendar-wrapper .rdp-day {
          position: relative;
          font-size: 0.875rem;
          color: #374151;
          cursor: pointer;
          border: none;
          background: transparent;
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent;
          outline: none;
        }

        .calendar-wrapper .rdp-day-content {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          margin: 0 auto;
          border-radius: 9999px;
        }

        .calendar-wrapper .rdp-day:hover:not(.rdp-day_disabled) .rdp-day-content {
          background-color: #fdf2f8;
          transform: scale(1.1);
          font-weight: 500;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }

        .calendar-wrapper .rdp-day_selected .rdp-day-content {
          background: linear-gradient(to right, #db2777, #be185d);
          color: white;
          font-weight: 600;
          box-shadow: 0 4px 6px -1px rgba(219, 39, 119, 0.3), 0 2px 4px -1px rgba(219, 39, 119, 0.2);
        }

        .calendar-wrapper .rdp-day_selected:hover .rdp-day-content {
          background: linear-gradient(to right, #be185d, #9d174d);
          transform: scale(1.05);
        }

        .calendar-wrapper .rdp-day_today .rdp-day-content {
          font-weight: bold;
          border: 2px solid #db2777;
          color: #db2777;
        }

        .calendar-wrapper .rdp-day_today:not(.rdp-day_selected) .rdp-day-content::after {
          content: '';
          position: absolute;
          bottom: 6px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background-color: #db2777;
        }

        .calendar-wrapper .rdp-day_disabled {
          opacity: 0.4;
          cursor: not-allowed !important;
          text-decoration: line-through;
          pointer-events: none;
        }

        .calendar-wrapper .rdp-day_disabled .rdp-day-content {
          background-color: #f3f4f6;
        }

        .calendar-wrapper .rdp-day:focus-visible .rdp-day-content {
          outline: 2px solid #db2777;
          outline-offset: 2px;
        }

        .calendar-wrapper .rdp-day_outside {
          opacity: 0.4;
        }
      `}</style>
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-3", className)}
        modifiersClassNames={{
          selected: "rdp-day_selected",
          today: "rdp-day_today",
          disabled: "rdp-day_disabled",
          outside: "rdp-day_outside",
        }}
        components={{
          IconLeft: ({ ...props }) => (
            <div
              className="flex items-center justify-center"
              onClick={props.onClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  props.onClick && props.onClick();
                }
              }}
              tabIndex={0}
              role="button"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </div>
          ),
          IconRight: ({ ...props }) => (
            <div
              className="flex items-center justify-center"
              onClick={props.onClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  props.onClick && props.onClick();
                }
              }}
              tabIndex={0}
              role="button"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </div>
          ),
          // Use a custom component for the day button to avoid nesting buttons
          Day: (props) => (
            <td
              onClick={props.onClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  props.onClick && props.onClick();
                }
              }}
              onMouseEnter={props.onMouseEnter}
              onMouseLeave={props.onMouseLeave}
              className={`rdp-cell rdp-day ${props.selected ? 'rdp-day_selected' : ''} ${props.disabled ? 'rdp-day_disabled' : ''} ${props.today ? 'rdp-day_today' : ''} ${props.outside ? 'rdp-day_outside' : ''}`}
              style={{ cursor: props.disabled ? 'not-allowed' : 'pointer' }}
              role="button"
              tabIndex={0}
              aria-label={props['aria-label']}
              aria-disabled={props.disabled}
            >
              <div className="rdp-day-content">{props.children}</div>
            </td>
          )
        }}
        onSelect={handleSelect}
        defaultMonth={new Date()}
        initialFocus={true}
        numberOfMonths={1}
        {...props}
      />
    </div>
  )
}
CustomCalendar.displayName = "CustomCalendar"

export { CustomCalendar }
