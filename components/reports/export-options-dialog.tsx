"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { FileDown, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import type { DateRange } from "react-day-picker"

export interface ExportSection {
  id: string
  name: string
  description: string
  enabled: boolean
  dataCount?: number
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf'
  sections: string[]
  dateRange?: DateRange
  includeCharts: boolean
  includeSummary: boolean
  customFileName?: string
  pageOrientation?: 'portrait' | 'landscape'
  location?: string
}

interface ExportOptionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: (options: ExportOptions) => Promise<void>
  availableSections: ExportSection[]
  defaultDateRange?: DateRange
  currentLocation?: string
  isLoading?: boolean
}

export function ExportOptionsDialog({
  open,
  onOpenChange,
  onExport,
  availableSections,
  defaultDateRange,
  currentLocation,
  isLoading = false
}: ExportOptionsDialogProps) {
  const [format, setFormat] = useState<'csv' | 'excel' | 'pdf'>('excel')
  const [selectedSections, setSelectedSections] = useState<string[]>(
    availableSections.filter(s => s.enabled).map(s => s.id)
  )
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange)
  const [includeCharts, setIncludeCharts] = useState(false)
  const [includeSummary, setIncludeSummary] = useState(true)
  const [customFileName, setCustomFileName] = useState('')
  const [pageOrientation, setPageOrientation] = useState<'portrait' | 'landscape'>('portrait')

  const handleSectionToggle = (sectionId: string, checked: boolean) => {
    if (checked) {
      setSelectedSections(prev => [...prev, sectionId])
    } else {
      setSelectedSections(prev => prev.filter(id => id !== sectionId))
    }
  }

  const handleSelectAll = () => {
    setSelectedSections(availableSections.map(s => s.id))
  }

  const handleSelectNone = () => {
    setSelectedSections([])
  }

  const handleExport = async () => {
    const options: ExportOptions = {
      format,
      sections: selectedSections,
      dateRange,
      includeCharts,
      includeSummary,
      customFileName: customFileName.trim() || undefined,
      pageOrientation,
      location: currentLocation
    }

    await onExport(options)
  }

  const getFormatIcon = (formatType: string) => {
    switch (formatType) {
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4" />
      case 'pdf':
        return <FileText className="h-4 w-4" />
      default:
        return <FileDown className="h-4 w-4" />
    }
  }

  const getFormatDescription = (formatType: string) => {
    switch (formatType) {
      case 'excel':
        return 'Excel spreadsheet with multiple sheets and formatting'
      case 'pdf':
        return 'PDF document with charts and professional layout'
      case 'csv':
        return 'Comma-separated values for data analysis'
      default:
        return ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Report Data</DialogTitle>
          <DialogDescription>
            Configure your export options and select the data you want to include.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Export Format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {(['excel', 'pdf', 'csv'] as const).map((formatType) => (
                  <Button
                    key={formatType}
                    variant={format === formatType ? "default" : "outline"}
                    className="h-auto p-3 flex flex-col items-center gap-2"
                    onClick={() => setFormat(formatType)}
                  >
                    {getFormatIcon(formatType)}
                    <span className="text-xs font-medium uppercase">{formatType}</span>
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {getFormatDescription(format)}
              </p>
            </CardContent>
          </Card>

          {/* Date Range */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Date Range</CardTitle>
              <CardDescription>Select the date range for your export</CardDescription>
            </CardHeader>
            <CardContent>
              <DatePickerWithRange 
                dateRange={dateRange} 
                onDateRangeChange={setDateRange}
              />
            </CardContent>
          </Card>

          {/* Report Sections */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Report Sections</CardTitle>
              <CardDescription>Choose which sections to include in your export</CardDescription>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={handleSelectNone}>
                  Select None
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableSections.map((section) => (
                <div key={section.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={section.id}
                    checked={selectedSections.includes(section.id)}
                    onCheckedChange={(checked) => handleSectionToggle(section.id, !!checked)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={section.id} className="text-sm font-medium cursor-pointer">
                      {section.name}
                    </Label>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  </div>
                  {section.dataCount && (
                    <Badge variant="secondary" className="text-xs">
                      {section.dataCount} items
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeSummary"
                  checked={includeSummary}
                  onCheckedChange={setIncludeSummary}
                />
                <Label htmlFor="includeSummary" className="text-sm">
                  Include summary statistics
                </Label>
              </div>

              {format === 'pdf' && (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeCharts"
                      checked={includeCharts}
                      onCheckedChange={setIncludeCharts}
                    />
                    <Label htmlFor="includeCharts" className="text-sm">
                      Include charts and visualizations
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pageOrientation" className="text-sm">
                      Page Orientation
                    </Label>
                    <Select value={pageOrientation} onValueChange={(value: 'portrait' | 'landscape') => setPageOrientation(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="customFileName" className="text-sm">
                  Custom File Name (optional)
                </Label>
                <Input
                  id="customFileName"
                  placeholder="Enter custom file name..."
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={selectedSections.length === 0 || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Export {format.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
