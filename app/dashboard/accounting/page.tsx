"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import { useLocations } from "@/lib/location-provider"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { FinancialOverview } from "@/components/accounting/financial-overview"
import { Transactions } from "@/components/accounting/transactions"
import { Expenses } from "@/components/accounting/expenses"
import { StaffCosts } from "@/components/accounting/staff-costs"
import { Reports } from "@/components/accounting/reports"
import { DailySales } from "@/components/accounting/daily-sales"
import { NewTransactionDialog } from "@/components/accounting/new-transaction-dialog"
import { NewExpenseDialog } from "@/components/accounting/new-expense-dialog"
import { DuplicateCleanup } from "@/components/accounting/duplicate-cleanup"
import { LocationButtons } from "@/components/location-buttons"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ExportOptionsDialog, type ExportSection, type ExportOptions } from "@/components/reports/export-options-dialog"
import { BulkExportDialog, type BulkExportOptions, type ReportType } from "@/components/reports/bulk-export-dialog"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Search, FileDown, Printer, CalendarIcon, ChevronDown, FileSpreadsheet, FileText, Loader2, Package } from "lucide-react"
import { subDays } from "date-fns"
import type { DateRange } from "react-day-picker"
import {
  exportReportToPDF,
  exportReportToCSV,
  exportReportToExcel,
  prepareTableDataForExport,
  type ReportData
} from "@/lib/pdf-export"
import {
  aggregateFinancialSummary,
  aggregateDailySalesData,
  aggregateTransactionSummary,
  aggregateStaffCostsData,
  aggregateExpenseData
} from "@/lib/accounting-data-aggregator"

// Accounting-specific report types
const ACCOUNTING_REPORT_TYPES: ReportType[] = [
  { id: 'financial_summary', name: 'Financial Summary', description: 'Revenue, expenses, and profit analysis' },
  { id: 'transactions', name: 'Transaction Reports', description: 'Detailed transaction records' },
  { id: 'daily_sales', name: 'Daily Sales', description: 'Daily sales performance and trends' },
  { id: 'expenses', name: 'Expense Reports', description: 'Business expenses and cost analysis' },
  { id: 'staff_costs', name: 'Staff Costs', description: 'Payroll and staff-related expenses' },
  { id: 'tax_reports', name: 'Tax Reports', description: 'Tax calculations and compliance reports' }
]
import { ReportPrintService, type PrintSection } from "@/lib/report-print-service"
import { useTransactions } from "@/lib/transaction-provider"
import { useStaff } from "@/lib/use-staff-data"


export default function AccountingPage() {
  const { user, currentLocation, hasPermission } = useAuth()
  const { getLocationName, getActiveLocations } = useLocations()
  const { transactions, filterTransactions } = useTransactions()
  const { staff } = useStaff()
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [singleDate, setSingleDate] = useState<Date | undefined>(new Date())
  const [dateMode, setDateMode] = useState<"single" | "range">("range")
  // Remove local selectedLocation state - use global currentLocation from useAuth instead
  const [selectedSource, setSelectedSource] = useState<string>("all")

  // Export/Print state
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isBulkExportDialogOpen, setIsBulkExportDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)

  // Debug current location
  console.log('🏢 ACCOUNTING PAGE: Current location:', currentLocation)

  // Get the active tab from URL params or default to "overview"
  const searchParams = useSearchParams()
  const activeTab = searchParams?.get("tab") || "overview"

  // Debug user permissions
  console.log("🔐 ACCOUNTING PAGE DEBUG:")
  console.log("User:", user)
  console.log("User role:", user?.role)
  console.log("Has view_accounting permission:", hasPermission("view_accounting"))
  console.log("Has all permission:", hasPermission("all"))

  // Get available export sections
  const getAvailableExportSections = (): ExportSection[] => {
    const filteredTransactions = filterTransactions(transactions, dateRange, selectedSource, currentLocation)
    const financialSummary = aggregateFinancialSummary(filteredTransactions, [], dateRange, currentLocation)
    const dailySalesData = aggregateDailySalesData(filteredTransactions, dateRange, currentLocation)
    const transactionSummary = aggregateTransactionSummary(filteredTransactions, dateRange, currentLocation)
    const staffCostsData = aggregateStaffCostsData(staff || [], filteredTransactions, dateRange, currentLocation)
    const expenseData = aggregateExpenseData(dateRange, currentLocation)

    return [
      {
        id: 'financial-overview',
        name: 'Financial Overview',
        description: 'Revenue, expenses, and profit summary',
        enabled: true,
        dataCount: 1
      },
      {
        id: 'daily-sales',
        name: 'Daily Sales',
        description: 'Daily sales breakdown and cash movement',
        enabled: true,
        dataCount: dailySalesData.length
      },
      {
        id: 'transactions',
        name: 'Transaction Details',
        description: 'Detailed transaction records',
        enabled: true,
        dataCount: filteredTransactions.length
      },
      {
        id: 'staff-costs',
        name: 'Staff Costs',
        description: 'Staff salary and cost analysis',
        enabled: true,
        dataCount: staffCostsData.length
      },
      {
        id: 'expenses',
        name: 'Expenses',
        description: 'Business expense records',
        enabled: true,
        dataCount: expenseData.length
      }
    ]
  }

  // Handle export functionality
  const handleExport = async (options: ExportOptions) => {
    setIsExporting(true)
    try {
      const filteredTransactions = filterTransactions(transactions, options.dateRange || dateRange, selectedSource, options.location || currentLocation)
      const reportSections: ReportData[] = []

      // Prepare data for selected sections
      for (const sectionId of options.sections) {
        switch (sectionId) {
          case 'financial-overview':
            const financialSummary = aggregateFinancialSummary(filteredTransactions, [], options.dateRange, options.location)
            reportSections.push(prepareTableDataForExport([financialSummary], 'Financial Overview', financialSummary))
            break
          case 'daily-sales':
            const dailySalesData = aggregateDailySalesData(filteredTransactions, options.dateRange, options.location)
            reportSections.push(prepareTableDataForExport(dailySalesData, 'Daily Sales'))
            break
          case 'transactions':
            reportSections.push(prepareTableDataForExport(filteredTransactions, 'Transaction Details'))
            break
          case 'staff-costs':
            const staffCostsData = aggregateStaffCostsData(staff || [], filteredTransactions, options.dateRange, options.location)
            reportSections.push(prepareTableDataForExport(staffCostsData, 'Staff Costs'))
            break
          case 'expenses':
            const expenseData = aggregateExpenseData(options.dateRange, options.location)
            reportSections.push(prepareTableDataForExport(expenseData, 'Expenses'))
            break
        }
      }

      // Export based on format
      if (reportSections.length > 0) {
        const mainReport: ReportData = {
          title: 'Accounting Report',
          dateRange: options.dateRange || dateRange,
          location: getLocationName(options.location || currentLocation),
          data: reportSections.flatMap(section => section.data),
          summary: options.includeSummary ? aggregateFinancialSummary(filteredTransactions, [], options.dateRange, options.location) : undefined
        }

        switch (options.format) {
          case 'csv':
            await exportReportToCSV(mainReport, options)
            break
          case 'excel':
            await exportReportToExcel(mainReport, options)
            break
          case 'pdf':
            await exportReportToPDF(mainReport, options)
            break
        }

        toast({
          title: "Export Successful",
          description: `Accounting report exported as ${options.format.toUpperCase()} file.`,
        })
      }
    } catch (error) {
      console.error('Export error:', error)
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export report. Please try again.",
      })
    } finally {
      setIsExporting(false)
      setIsExportDialogOpen(false)
    }
  }

  // Quick export functions
  const handleQuickExportCSV = async () => {
    const filteredTransactions = filterTransactions(transactions, dateRange, selectedSource, currentLocation)
    const financialSummary = aggregateFinancialSummary(filteredTransactions, [], dateRange, currentLocation)

    try {
      await exportReportToCSV(prepareTableDataForExport([financialSummary], 'Financial Summary', financialSummary))
      toast({
        title: "CSV Export Successful",
        description: "Financial data exported to CSV file.",
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
    const filteredTransactions = filterTransactions(transactions, dateRange, selectedSource, currentLocation)
    const financialSummary = aggregateFinancialSummary(filteredTransactions, [], dateRange, currentLocation)

    try {
      await exportReportToExcel(prepareTableDataForExport([financialSummary], 'Financial Summary', financialSummary), {
        format: 'excel',
        includeSummary: true
      })
      toast({
        title: "Excel Export Successful",
        description: "Financial data exported to Excel file.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export Excel. Please try again.",
      })
    }
  }

  // Handle print functionality
  const handlePrint = async () => {
    setIsPrinting(true)
    try {
      const filteredTransactions = filterTransactions(transactions, dateRange, selectedSource, currentLocation)
      const printService = ReportPrintService.getInstance()

      const printSections: PrintSection[] = [
        {
          id: 'financial-overview',
          title: 'Financial Overview',
          content: JSON.stringify(aggregateFinancialSummary(filteredTransactions, [], dateRange, currentLocation)),
          type: 'summary'
        },
        {
          id: 'daily-sales',
          title: 'Daily Sales',
          content: generateTableHTML(aggregateDailySalesData(filteredTransactions, dateRange, currentLocation)),
          type: 'table',
          pageBreakBefore: true
        }
      ]

      await printService.printReport({
        title: 'Accounting Report',
        dateRange,
        location: getLocationName(currentLocation),
        sections: printSections
      })

      toast({
        title: "Print Initiated",
        description: "Report has been sent to printer.",
      })
    } catch (error) {
      console.error('Print error:', error)
      toast({
        variant: "destructive",
        title: "Print Failed",
        description: "Failed to print report. Please try again.",
      })
    } finally {
      setIsPrinting(false)
    }
  }

  // Helper function to generate table HTML
  const generateTableHTML = (data: any[]): string => {
    if (!data || data.length === 0) return '<p>No data available</p>'

    const headers = Object.keys(data[0])
    const headerRow = headers.map(h => `<th>${h}</th>`).join('')
    const dataRows = data.map(row =>
      `<tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>`
    ).join('')

    return `<table><thead><tr>${headerRow}</tr></thead><tbody>${dataRows}</tbody></table>`
  }

  // Check if user has permission to access accounting
  if (!hasPermission("view_accounting")) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <p className="text-muted-foreground">You don't have permission to view the accounting page.</p>
            <p className="text-xs text-gray-500 mt-2">
              Debug: Role = {user?.role}, Has view_accounting = {hasPermission("view_accounting").toString()}
            </p>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Accounting</h2>
          <p className="text-muted-foreground">Manage your salon's finances, expenses, and reports.</p>
        </div>
        <div className="flex items-center gap-2">
          <DatePickerWithRange
            dateRange={dateRange}
            singleDate={singleDate}
            mode={dateMode}
            onDateRangeChange={setDateRange}
            onSingleDateChange={setSingleDate}
            onModeChange={setDateMode}
          />
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

          {/* Enhanced Print Button */}
          <Button variant="outline" onClick={handlePrint} disabled={isPrinting}>
            {isPrinting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="daily-sales">Daily Sales</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="staff-costs">Staff Costs</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <FinancialOverview dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="daily-sales">
          <DailySales
            dateRange={dateRange}
            singleDate={singleDate}
            dateMode={dateMode}
            selectedLocation={currentLocation}
          />
        </TabsContent>

        <TabsContent value="transactions">
          <div className="space-y-4">
            {/* Duplicate Cleanup Section */}
            <DuplicateCleanup />

            {/* Transaction Management */}
            <div className="space-y-4">
              {/* Search and Filters Row */}
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4 items-center">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 w-[200px] md:w-[300px]"
                    />
                  </div>

                  {/* Location Buttons */}
                  <LocationButtons />

                  {/* Source Filter */}
                  <Select value={selectedSource} onValueChange={setSelectedSource}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="CLIENT_PORTAL">🛒 Client Portal</SelectItem>
                      <SelectItem value="POS">🏪 Point of Sale</SelectItem>
                      <SelectItem value="CALENDAR">📅 Appointments</SelectItem>
                      <SelectItem value="MANUAL">✏️ Manual Entry</SelectItem>
                      <SelectItem value="INVENTORY">📦 Inventory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    title="Refresh transactions"
                  >
                    Refresh
                  </Button>
                  <Button onClick={() => setIsTransactionDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Transaction
                  </Button>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <Transactions
              search={search}
              dateRange={dateRange}
              singleDate={singleDate}
              dateMode={dateMode}
              selectedLocation={currentLocation}
              selectedSource={selectedSource}
            />
          </div>
        </TabsContent>

        <TabsContent value="expenses">
          <div className="mb-4 flex justify-between items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-[200px] md:w-[300px]"
              />
            </div>
            <Button onClick={() => setIsExpenseDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Expense
            </Button>
          </div>
          <Expenses search={search} dateRange={dateRange} selectedLocation={currentLocation} />
        </TabsContent>

        <TabsContent value="staff-costs">
          <StaffCosts dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="reports">
          <Reports dateRange={dateRange} />
        </TabsContent>
      </Tabs>

      <NewTransactionDialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen} />
      <NewExpenseDialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen} />

      {/* Export Options Dialog */}
      <ExportOptionsDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        onExport={handleExport}
        availableSections={getAvailableExportSections()}
        defaultDateRange={dateRange}
        currentLocation={currentLocation}
        isLoading={isExporting}
      />

      {/* Bulk Export Dialog */}
      <BulkExportDialog
        open={isBulkExportDialogOpen}
        onOpenChange={setIsBulkExportDialogOpen}
        onExport={async () => {}} // TODO: Implement bulk export for accounting
        reportTypes={ACCOUNTING_REPORT_TYPES}
        isLoading={isExporting}
      />
    </div>
  )
}

