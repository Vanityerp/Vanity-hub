"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, Mail, Package, Loader2, Download, Send } from "lucide-react"
import { format } from "date-fns"

export interface ReportType {
  id: string
  name: string
  description: string
}

export interface BulkExportOptions {
  reportTypes: string[]
  formats: string[]
  schedule?: {
    enabled: boolean
    frequency: 'daily' | 'weekly' | 'monthly'
    time: string
    dayOfWeek?: number
    dayOfMonth?: number
  }
  email?: {
    enabled: boolean
    recipients: string[]
    subject: string
    message: string
  }
  compression: boolean
  splitByLocation: boolean
}

interface BulkExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: (options: BulkExportOptions) => Promise<void>
  reportTypes?: ReportType[]
  isLoading?: boolean
}

const DEFAULT_REPORT_TYPES: ReportType[] = [
  { id: 'sales', name: 'Sales Reports', description: 'Revenue and sales analytics' },
  { id: 'appointments', name: 'Appointment Reports', description: 'Booking and scheduling data' },
  { id: 'staff', name: 'Staff Performance', description: 'Individual staff metrics' },
  { id: 'inventory', name: 'Inventory Reports', description: 'Stock levels and movements' },
  { id: 'financial', name: 'Financial Reports', description: 'Profit & loss, expenses' },
  { id: 'client', name: 'Client Reports', description: 'Customer analytics and retention' }
]

const EXPORT_FORMATS = [
  { id: 'excel', name: 'Excel (.xlsx)', icon: '📊' },
  { id: 'csv', name: 'CSV (.csv)', icon: '📄' },
  { id: 'pdf', name: 'PDF (.pdf)', icon: '📋' }
]

export function BulkExportDialog({
  open,
  onOpenChange,
  onExport,
  reportTypes = DEFAULT_REPORT_TYPES,
  isLoading = false
}: BulkExportDialogProps) {
  const [selectedReportTypes, setSelectedReportTypes] = useState<string[]>([reportTypes[0]?.id || 'sales'])
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['excel'])
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [scheduleTime, setScheduleTime] = useState('09:00')
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState(1) // Monday
  const [scheduleDayOfMonth, setScheduleDayOfMonth] = useState(1)
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [emailRecipients, setEmailRecipients] = useState('')
  const [emailSubject, setEmailSubject] = useState('Automated Report Export')
  const [emailMessage, setEmailMessage] = useState('Please find the attached reports.')
  const [compression, setCompression] = useState(true)
  const [splitByLocation, setSplitByLocation] = useState(false)

  const handleReportTypeToggle = (reportType: string, checked: boolean) => {
    if (checked) {
      setSelectedReportTypes(prev => [...prev, reportType])
    } else {
      setSelectedReportTypes(prev => prev.filter(type => type !== reportType))
    }
  }

  const handleFormatToggle = (format: string, checked: boolean) => {
    if (checked) {
      setSelectedFormats(prev => [...prev, format])
    } else {
      setSelectedFormats(prev => prev.filter(f => f !== format))
    }
  }

  const handleExport = async () => {
    const options: BulkExportOptions = {
      reportTypes: selectedReportTypes,
      formats: selectedFormats,
      schedule: scheduleEnabled ? {
        enabled: true,
        frequency: scheduleFrequency,
        time: scheduleTime,
        dayOfWeek: scheduleFrequency === 'weekly' ? scheduleDayOfWeek : undefined,
        dayOfMonth: scheduleFrequency === 'monthly' ? scheduleDayOfMonth : undefined
      } : undefined,
      email: emailEnabled ? {
        enabled: true,
        recipients: emailRecipients.split(',').map(email => email.trim()).filter(Boolean),
        subject: emailSubject,
        message: emailMessage
      } : undefined,
      compression,
      splitByLocation
    }

    await onExport(options)
  }

  const getEstimatedFileCount = () => {
    let count = selectedReportTypes.length * selectedFormats.length
    if (splitByLocation) count *= 3 // Assuming 3 locations
    return count
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Export & Automation</DialogTitle>
          <DialogDescription>
            Export multiple reports at once and set up automated delivery schedules.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Report Types */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Report Types</CardTitle>
                <CardDescription>Select which reports to include</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {reportTypes.map((reportType) => (
                  <div key={reportType.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={reportType.id}
                      checked={selectedReportTypes.includes(reportType.id)}
                      onCheckedChange={(checked) => handleReportTypeToggle(reportType.id, !!checked)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={reportType.id} className="text-sm font-medium cursor-pointer">
                        {reportType.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">{reportType.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Export Formats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Export Formats</CardTitle>
                <CardDescription>Choose output formats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {EXPORT_FORMATS.map((format) => (
                    <div key={format.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={format.id}
                        checked={selectedFormats.includes(format.id)}
                        onCheckedChange={(checked) => handleFormatToggle(format.id, !!checked)}
                      />
                      <Label htmlFor={format.id} className="text-sm cursor-pointer">
                        {format.icon} {format.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Export Options */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Export Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Compress files</Label>
                    <p className="text-xs text-muted-foreground">Create ZIP archive</p>
                  </div>
                  <Switch checked={compression} onCheckedChange={setCompression} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Split by location</Label>
                    <p className="text-xs text-muted-foreground">Separate files per location</p>
                  </div>
                  <Switch checked={splitByLocation} onCheckedChange={setSplitByLocation} />
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    Estimated files: {getEstimatedFileCount()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Scheduling */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Automated Scheduling
                </CardTitle>
                <CardDescription>Set up recurring exports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Enable scheduling</Label>
                  <Switch checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
                </div>
                
                {scheduleEnabled && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="space-y-2">
                      <Label className="text-sm">Frequency</Label>
                      <Select value={scheduleFrequency} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setScheduleFrequency(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Time</Label>
                      <Input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                      />
                    </div>

                    {scheduleFrequency === 'weekly' && (
                      <div className="space-y-2">
                        <Label className="text-sm">Day of week</Label>
                        <Select value={scheduleDayOfWeek.toString()} onValueChange={(value) => setScheduleDayOfWeek(parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Monday</SelectItem>
                            <SelectItem value="2">Tuesday</SelectItem>
                            <SelectItem value="3">Wednesday</SelectItem>
                            <SelectItem value="4">Thursday</SelectItem>
                            <SelectItem value="5">Friday</SelectItem>
                            <SelectItem value="6">Saturday</SelectItem>
                            <SelectItem value="0">Sunday</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {scheduleFrequency === 'monthly' && (
                      <div className="space-y-2">
                        <Label className="text-sm">Day of month</Label>
                        <Select value={scheduleDayOfMonth.toString()} onValueChange={(value) => setScheduleDayOfMonth(parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                              <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Email Delivery */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Delivery
                </CardTitle>
                <CardDescription>Send reports via email</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Enable email delivery</Label>
                  <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
                </div>
                
                {emailEnabled && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="space-y-2">
                      <Label className="text-sm">Recipients (comma-separated)</Label>
                      <Textarea
                        placeholder="email1@example.com, email2@example.com"
                        value={emailRecipients}
                        onChange={(e) => setEmailRecipients(e.target.value)}
                        rows={2}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Subject</Label>
                      <Input
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Message</Label>
                      <Textarea
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={selectedReportTypes.length === 0 || selectedFormats.length === 0 || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {scheduleEnabled ? (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Export
              </>
            ) : emailEnabled ? (
              <>
                <Send className="mr-2 h-4 w-4" />
                Export & Send
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
