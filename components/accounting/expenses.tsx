"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ExportOptionsDialog, type ExportSection, type ExportOptions } from "@/components/reports/export-options-dialog"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { useToast } from "@/components/ui/use-toast"
import type { DateRange } from "react-day-picker"
import { Eye, MoreHorizontal, FileDown, ChevronDown, FileSpreadsheet, FileText, Loader2, Printer } from "lucide-react"
import { useCurrency } from "@/lib/currency-provider"
import {
  exportReportToPDF,
  exportReportToCSV,
  exportReportToExcel,
  prepareTableDataForExport,
  type ReportData
} from "@/lib/pdf-export"
import { aggregateExpenseData } from "@/lib/accounting-data-aggregator"
import { ReportPrintService, type PrintSection } from "@/lib/report-print-service"

interface ExpensesProps {
  search: string
  dateRange?: DateRange
  selectedLocation?: string
}

export function Expenses({ search, dateRange, selectedLocation = "all" }: ExpensesProps) {
  const { formatCurrency } = useCurrency()
  const { toast } = useToast()
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)

  // Mock expenses data
  const expenses = [
    {
      id: "EXP-001",
      date: "Apr 1, 2025",
      category: "Inventory",
      vendor: "Beauty Supply Co.",
      description: "Hair products restock",
      amount: 850.0,
      paymentMethod: "Credit Card",
      status: "Paid",
      location: "loc1", // Downtown Salon
    },
    {
      id: "EXP-002",
      date: "Apr 1, 2025",
      category: "Utilities",
      vendor: "City Power & Water",
      description: "Monthly utilities",
      amount: 320.0,
      paymentMethod: "Bank Transfer",
      status: "Paid",
      location: "loc2", // Westside Salon
    },
    {
      id: "EXP-003",
      date: "Mar 31, 2025",
      category: "Rent",
      vendor: "Downtown Properties",
      description: "Monthly rent - Downtown location",
      amount: 2200.0,
      paymentMethod: "Bank Transfer",
      status: "Paid",
      location: "loc3", // Northside Salon
    },
    {
      id: "EXP-004",
      date: "Mar 30, 2025",
      category: "Payroll",
      vendor: "Staff Payroll",
      description: "Bi-weekly staff payroll",
      amount: 4800.0,
      paymentMethod: "Bank Transfer",
      status: "Paid",
    },
    {
      id: "EXP-005",
      date: "Mar 28, 2025",
      category: "Marketing",
      vendor: "Social Media Ads",
      description: "Monthly social media advertising",
      amount: 250.0,
      paymentMethod: "Credit Card",
      status: "Paid",
    },
    {
      id: "EXP-006",
      date: "Mar 25, 2025",
      category: "Maintenance",
      vendor: "Clean Team Services",
      description: "Weekly cleaning service",
      amount: 180.0,
      paymentMethod: "Credit Card",
      status: "Paid",
    },
    {
      id: "EXP-007",
      date: "Mar 20, 2025",
      category: "Inventory",
      vendor: "Salon Equipment Inc.",
      description: "New hair dryers (3)",
      amount: 450.0,
      paymentMethod: "Credit Card",
      status: "Paid",
    },
    {
      id: "EXP-008",
      date: "Mar 15, 2025",
      category: "Insurance",
      vendor: "Business Shield Insurance",
      description: "Monthly business insurance",
      amount: 175.0,
      paymentMethod: "Bank Transfer",
      status: "Paid",
    },
    {
      id: "EXP-009",
      date: "Mar 15, 2025",
      category: "Payroll",
      vendor: "Staff Payroll",
      description: "Bi-weekly staff payroll",
      amount: 4750.0,
      paymentMethod: "Bank Transfer",
      status: "Paid",
    },
    {
      id: "EXP-010",
      date: "Mar 10, 2025",
      category: "Software",
      vendor: "SalonHub Software",
      description: "Monthly subscription",
      amount: 99.0,
      paymentMethod: "Credit Card",
      status: "Paid",
    },
  ]

  // Filter expenses based on search term and location
  const filteredExpenses = expenses.filter((expense) => {
    // Filter by search term
    if (
      search &&
      !expense.vendor.toLowerCase().includes(search.toLowerCase()) &&
      !expense.description.toLowerCase().includes(search.toLowerCase()) &&
      !expense.category.toLowerCase().includes(search.toLowerCase()) &&
      !expense.id.toLowerCase().includes(search.toLowerCase())
    ) {
      return false
    }

    // Filter by location
    if (selectedLocation !== "all") {
      // Special handling for home service location
      if (selectedLocation === "home") {
        if (expense.location !== "home") {
          return false
        }
      } else if (expense.location !== selectedLocation) {
        return false
      }
    }

    return true
  })

  // Get available export sections
  const getAvailableExportSections = (): ExportSection[] => {
    return [
      {
        id: 'expenses',
        name: 'Expense Details',
        description: 'Complete expense records and details',
        enabled: true,
        dataCount: filteredExpenses.length
      },
      {
        id: 'summary',
        name: 'Expense Summary',
        description: 'Summary statistics and totals',
        enabled: true,
        dataCount: 1
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
          case 'expenses':
            reportSections.push(...filteredExpenses)
            break
          case 'summary':
            const summary = {
              totalExpenses: filteredExpenses.length,
              totalAmount: filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
              averageAmount: filteredExpenses.length > 0 ?
                filteredExpenses.reduce((sum, e) => sum + e.amount, 0) / filteredExpenses.length : 0,
              topCategory: 'Inventory', // Mock
              topVendor: 'Beauty Supply Co.' // Mock
            }
            reportSections.push(summary)
            break
        }
      }

      const reportData = prepareTableDataForExport(
        reportSections,
        'Expenses Report',
        options.includeSummary ? {
          totalExpenses: filteredExpenses.length,
          totalAmount: filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
        } : undefined
      )

      reportData.dateRange = options.dateRange || dateRange
      reportData.location = selectedLocation

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
        description: `Expenses report exported as ${options.format.toUpperCase()} file.`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export expenses. Please try again.",
      })
    } finally {
      setIsExporting(false)
      setIsExportDialogOpen(false)
    }
  }

  // Quick export functions
  const handleQuickExportCSV = async () => {
    try {
      const reportData = prepareTableDataForExport(filteredExpenses, 'Expenses Export')
      await exportReportToCSV(reportData)
      toast({
        title: "CSV Export Successful",
        description: "Expenses exported to CSV file.",
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
      const reportData = prepareTableDataForExport(filteredExpenses, 'Expenses Export')
      await exportReportToExcel(reportData, { format: 'excel', includeSummary: true })
      toast({
        title: "Excel Export Successful",
        description: "Expenses exported to Excel file.",
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>
            {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''} found
          </CardDescription>
        </div>
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Expense ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  No expenses found.
                </TableCell>
              </TableRow>
            ) : (
              filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.id}</TableCell>
                  <TableCell>{expense.date}</TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>{expense.vendor}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell><CurrencyDisplay amount={expense.amount} /></TableCell>
                  <TableCell>{expense.paymentMethod}</TableCell>
                  <TableCell>
                    {expense.location === "loc1" ? "Downtown Salon" :
                     expense.location === "loc2" ? "Westside Salon" :
                     expense.location === "loc3" ? "Northside Salon" :
                     expense.location === "home" ? "Home Service" : expense.location}
                  </TableCell>
                  <TableCell>
                    <Badge variant={expense.status === "Paid" ? "success" : "outline"}>{expense.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem>Edit expense</DropdownMenuItem>
                        <DropdownMenuItem>Download receipt</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Export Options Dialog */}
      <ExportOptionsDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        onExport={handleExport}
        availableSections={getAvailableExportSections()}
        defaultDateRange={dateRange}
        currentLocation={selectedLocation}
        isLoading={isExporting}
      />
    </Card>
  )
}

