"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStaff } from "@/lib/use-staff-data"
import { TimeOffManagement } from "@/components/hr/time-off-management"
import { BenefitsManagement } from "@/components/hr/benefits-management"
import { PerformanceReviews } from "@/components/hr/performance-reviews"
import { TrainingManagement } from "@/components/hr/training-management"
import { DocumentManagement } from "@/components/hr/document-management"
import { DocumentExpiryCounter } from "@/components/hr/document-expiry-counter"
import { OnboardingOffboarding } from "@/components/hr/onboarding-offboarding"
import { HRPayrollManagement } from "@/components/hr/hr-payroll-management"
import { StaffDirectory } from "@/components/staff/staff-directory"
import { HRStaffManagement } from "@/components/hr/hr-staff-management"
import { CompanyDocuments } from "@/components/hr/company-documents"
import { StaffSeeding } from "@/components/staff-seeding"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ExportOptionsDialog, type ExportSection, type ExportOptions } from "@/components/reports/export-options-dialog"
import { BulkExportDialog, type BulkExportOptions, type ReportType } from "@/components/reports/bulk-export-dialog"
import { useToast } from "@/components/ui/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { ExternalLink, FileDown, ChevronDown, FileSpreadsheet, FileText, Loader2, Package, Printer } from "lucide-react"
import { useCurrency } from "@/lib/currency-provider"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { NotificationService } from "@/lib/notification-service"
import {
  exportReportToPDF,
  exportReportToCSV,
  exportReportToExcel,
  prepareTableDataForExport,
  type ReportData
} from "@/lib/pdf-export"
import {
  aggregateStaffDocuments,
  aggregatePerformanceReviews,
  aggregateTrainingRecords,
  aggregateStaffBenefits,
  aggregateHRSummary
} from "@/lib/hr-data-aggregator"
import { ReportPrintService, type PrintSection } from "@/lib/report-print-service"

interface HRManagementProps {
  search: string
}

// HR-specific report types
const HR_REPORT_TYPES: ReportType[] = [
  { id: 'staff_documents', name: 'Staff Documents', description: 'Document status and expiry tracking' },
  { id: 'performance_reviews', name: 'Performance Reviews', description: 'Staff performance evaluations' },
  { id: 'training_records', name: 'Training Records', description: 'Training completion and certifications' },
  { id: 'staff_benefits', name: 'Staff Benefits', description: 'Employee benefits and allowances' },
  { id: 'payroll_summary', name: 'Payroll Summary', description: 'Salary and compensation reports' },
  { id: 'attendance', name: 'Attendance Reports', description: 'Staff attendance and time tracking' }
]

export function HRManagement({ search }: HRManagementProps) {
  const { staff } = useStaff()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabParam || "overview")
  const { formatCurrency } = useCurrency()

  // Export/Print state
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isBulkExportDialogOpen, setIsBulkExportDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)

  // Check for document notifications on component mount
  useEffect(() => {
    // Check for expiring documents and create notifications
    NotificationService.checkExpiringDocuments()
  }, [])

  // Listen for currency changes to ensure consistent currency display
  useEffect(() => {
    const handleCurrencyChange = () => {
      // Force a re-render when currency changes
      setActiveTab(prev => prev)
    }

    document.addEventListener('currency-changed', handleCurrencyChange)
    return () => {
      document.removeEventListener('currency-changed', handleCurrencyChange)
    }
  }, [])

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)

    // Check if we're already on the HR page
    const isHRPage = window.location.pathname.includes('/dashboard/hr')

    if (isHRPage) {
      // Just update the tab parameter
      router.push(`/dashboard/hr?tab=${value}`, { scroll: false })
    } else {
      // We're on a different page (like accounting), so we need to preserve the current URL
      // and just update the component state
      console.log(`Tab changed to ${value} but not navigating since we're not on the HR page`)
    }
  }

  const handleStaffUpdated = (updatedStaff: any) => {
    console.log("Staff updated from HR Management:", updatedStaff)
  }

  const handleStaffDeleted = (staffId: string) => {
    console.log("Staff deleted from HR Management:", staffId)
  }

  const navigateToStaffPage = () => {
    router.push("/dashboard/staff")
  }

  // Get available export sections
  const getAvailableExportSections = (): ExportSection[] => {
    const documents = aggregateStaffDocuments(staff || [])
    const reviews = aggregatePerformanceReviews(staff || [])
    const trainings = aggregateTrainingRecords(staff || [])
    const benefits = aggregateStaffBenefits(staff || [])

    return [
      {
        id: 'hr-overview',
        name: 'HR Overview',
        description: 'Summary of HR metrics and statistics',
        enabled: true,
        dataCount: 1
      },
      {
        id: 'staff-documents',
        name: 'Staff Documents',
        description: 'Document records and expiry tracking',
        enabled: true,
        dataCount: documents.length
      },
      {
        id: 'performance-reviews',
        name: 'Performance Reviews',
        description: 'Staff performance review records',
        enabled: true,
        dataCount: reviews.length
      },
      {
        id: 'training-records',
        name: 'Training Records',
        description: 'Staff training and certification records',
        enabled: true,
        dataCount: trainings.length
      },
      {
        id: 'staff-benefits',
        name: 'Staff Benefits',
        description: 'Employee benefits and allowances',
        enabled: true,
        dataCount: benefits.length
      },
      {
        id: 'staff-directory',
        name: 'Staff Directory',
        description: 'Complete staff information and contacts',
        enabled: true,
        dataCount: staff?.length || 0
      }
    ]
  }

  // Handle export functionality
  const handleExport = async (options: ExportOptions) => {
    setIsExporting(true)
    try {
      const reportSections: any[] = []

      for (const sectionId of options.sections) {
        switch (sectionId) {
          case 'hr-overview':
            const documents = aggregateStaffDocuments(staff || [])
            const reviews = aggregatePerformanceReviews(staff || [])
            const trainings = aggregateTrainingRecords(staff || [])
            const benefits = aggregateStaffBenefits(staff || [])
            const hrSummary = aggregateHRSummary(staff || [], documents, reviews, trainings, benefits)
            reportSections.push(hrSummary)
            break
          case 'staff-documents':
            const staffDocuments = aggregateStaffDocuments(staff || [], options.dateRange)
            reportSections.push(...staffDocuments)
            break
          case 'performance-reviews':
            const performanceReviews = aggregatePerformanceReviews(staff || [], options.dateRange)
            reportSections.push(...performanceReviews)
            break
          case 'training-records':
            const trainingRecords = aggregateTrainingRecords(staff || [], options.dateRange)
            reportSections.push(...trainingRecords)
            break
          case 'staff-benefits':
            const staffBenefits = aggregateStaffBenefits(staff || [], options.dateRange)
            reportSections.push(...staffBenefits)
            break
          case 'staff-directory':
            reportSections.push(...(staff || []))
            break
        }
      }

      const reportData = prepareTableDataForExport(
        reportSections,
        'HR Management Report',
        options.includeSummary ? aggregateHRSummary(staff || [], [], [], [], []) : undefined
      )

      reportData.dateRange = options.dateRange

      switch (options.format) {
        case 'csv':
          await exportReportToCSV(reportData, options)
          break
        case 'excel':
          await exportReportToExcel(reportData, options)
          break
        case 'pdf':
          await exportReportToPDF(reportData, options)
          break
      }

      toast({
        title: "Export Successful",
        description: `HR report exported as ${options.format.toUpperCase()} file.`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export HR data. Please try again.",
      })
    } finally {
      setIsExporting(false)
      setIsExportDialogOpen(false)
    }
  }

  // Quick export functions
  const handleQuickExportCSV = async () => {
    try {
      const hrSummary = aggregateHRSummary(staff || [], [], [], [], [])
      const reportData = prepareTableDataForExport([hrSummary], 'HR Summary')
      await exportReportToCSV(reportData)
      toast({
        title: "CSV Export Successful",
        description: "HR data exported to CSV file.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export CSV. Please try again.",
      })
    }
  }

  const handleQuickExportExcel = async () => {
    try {
      const hrSummary = aggregateHRSummary(staff || [], [], [], [], [])
      const reportData = prepareTableDataForExport([hrSummary], 'HR Summary')
      await exportReportToExcel(reportData, { format: 'excel', includeSummary: true })
      toast({
        title: "Excel Export Successful",
        description: "HR data exported to Excel file.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export Excel. Please try again.",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Human Resources Management</h3>
        <div className="flex items-center gap-2">
          {/* Enhanced Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="mr-2 h-4 w-4" />
                )}
                Export
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleQuickExportCSV}>
                <FileDown className="mr-2 h-4 w-4" />
                Quick CSV Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleQuickExportExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Quick Excel Export
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsExportDialogOpen(true)}>
                <FileText className="mr-2 h-4 w-4" />
                Advanced Export...
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsBulkExportDialogOpen(true)}>
                <Package className="mr-2 h-4 w-4" />
                Bulk Export & Automation...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" onClick={navigateToStaffPage}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Go to Staff Management
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="staff">Staff Management</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="time-off">Time Off</TabsTrigger>
          <TabsTrigger value="benefits">Benefits</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="documents">Staff Documents</TabsTrigger>
          <TabsTrigger value="company-documents">Company Documents</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Time Off Requests</CardTitle>
                <CardDescription>Pending approval</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">
                  +2 from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Staff Utilization</CardTitle>
                <CardDescription>Average across all staff</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87%</div>
                <p className="text-xs text-muted-foreground">
                  +5% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Training Completion</CardTitle>
                <CardDescription>Required trainings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">92%</div>
                <p className="text-xs text-muted-foreground">
                  +3% from last month
                </p>
              </CardContent>
            </Card>
            <DocumentExpiryCounter />
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Staff Directory</CardTitle>
                <CardDescription>
                  View and manage your staff members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StaffDirectory
                  search={search}
                  onStaffUpdated={handleStaffUpdated}
                  onStaffDeleted={handleStaffDeleted}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="staff">
          <div className="space-y-6">
            <StaffSeeding />
            <HRStaffManagement search={search} />
          </div>
        </TabsContent>

        <TabsContent value="payroll">
          <HRPayrollManagement />
        </TabsContent>

        <TabsContent value="time-off">
          <TimeOffManagement />
        </TabsContent>

        <TabsContent value="benefits">
          <BenefitsManagement />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceReviews />
        </TabsContent>

        <TabsContent value="training">
          <TrainingManagement />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentManagement />
        </TabsContent>

        <TabsContent value="company-documents">
          <CompanyDocuments />
        </TabsContent>

        <TabsContent value="onboarding">
          <OnboardingOffboarding />
        </TabsContent>
      </Tabs>

      {/* Export Options Dialog */}
      <ExportOptionsDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        onExport={handleExport}
        availableSections={getAvailableExportSections()}
        defaultDateRange={undefined}
        currentLocation="all"
        isLoading={isExporting}
      />

      {/* Bulk Export Dialog */}
      <BulkExportDialog
        open={isBulkExportDialogOpen}
        onOpenChange={setIsBulkExportDialogOpen}
        onExport={async () => {}} // TODO: Implement bulk export for HR
        reportTypes={HR_REPORT_TYPES}
        isLoading={isExporting}
      />
    </div>
  )
}
