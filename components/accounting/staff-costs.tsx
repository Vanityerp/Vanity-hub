"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useStaff } from "@/lib/staff-provider"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { useCurrency } from "@/lib/currency-provider"
import {
  Download,
  Eye,
  MoreHorizontal,
  Plus,
  Edit,
  Save,
  FileDown,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Loader2,
  Printer
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ExportOptionsDialog, type ExportSection, type ExportOptions } from "@/components/reports/export-options-dialog"
import {
  exportReportToPDF,
  exportReportToCSV,
  exportReportToExcel,
  prepareTableDataForExport,
  type ReportData
} from "@/lib/pdf-export"
import { aggregateStaffCostsData } from "@/lib/accounting-data-aggregator"
import { ReportPrintService, type PrintSection } from "@/lib/report-print-service"

// Mock additional costs data structure
const mockAdditionalCosts = {
  visa: {
    stylist: 2400,
    colorist: 2400,
    barber: 2400,
    nail_technician: 2400,
    esthetician: 2400,
    receptionist: 2400,
    manager: 2400
  },
  manpower: {
    stylist: 1800,
    colorist: 1800,
    barber: 1800,
    nail_technician: 1800,
    esthetician: 1800,
    receptionist: 1800,
    manager: 1800
  },
  medical: {
    stylist: 600,
    colorist: 600,
    barber: 600,
    nail_technician: 600,
    esthetician: 600,
    receptionist: 600,
    manager: 600
  },
  idCost: {
    stylist: 300,
    colorist: 300,
    barber: 300,
    nail_technician: 300,
    esthetician: 300,
    receptionist: 300,
    manager: 300
  },
  accommodation: {
    stylist: 3600,
    colorist: 3600,
    barber: 3600,
    nail_technician: 3600,
    esthetician: 3600,
    receptionist: 3600,
    manager: 3600
  },
  transportation: {
    stylist: 1200,
    colorist: 1200,
    barber: 1200,
    nail_technician: 1200,
    esthetician: 1200,
    receptionist: 1200,
    manager: 1200
  },
  other: {
    stylist: 500,
    colorist: 500,
    barber: 500,
    nail_technician: 500,
    esthetician: 500,
    receptionist: 500,
    manager: 500
  }
}

interface StaffCostRecord {
  id: string
  staffId: string
  staffName: string
  role: string
  grossPay: number
  visaCost: number
  manpowerCost: number
  medicalCost: number
  idCost: number
  accommodationCost: number
  transportationCost: number
  otherCosts: number
  totalAdditionalCosts: number
  totalCostToCompany: number
  status: "Active" | "Inactive"
}

interface StaffCostsProps {
  dateRange?: any
}

export function StaffCosts({ dateRange }: StaffCostsProps) {
  const { toast } = useToast()
  const { formatCurrency } = useCurrency()
  const { staff: realStaff } = useStaff()
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffCostRecord | null>(null)
  const [isAddCostDialogOpen, setIsAddCostDialogOpen] = useState(false)
  const [isEditCostDialogOpen, setIsEditCostDialogOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)

  // Initialize cost to company data state
  const [costToCompanyData, setCostToCompanyData] = useState<StaffCostRecord[]>([])

  useEffect(() => {
    // Generate initial cost to company data
    const newCostData = realStaff.map(staff => {
      const role = staff.role as keyof typeof mockAdditionalCosts.visa
      const seed = parseInt(staff.id.replace(/\D/g, '')) || 1

      // Calculate basic gross pay (simplified for accounting view)
      const baseGrossPay = 3500 + (seed * 100) % 2000 // 3500-5500 range

      // Calculate monthly costs (annual costs divided by 12)
      const visaCost = mockAdditionalCosts.visa[role] / 12
      const manpowerCost = mockAdditionalCosts.manpower[role] / 12
      const medicalCost = mockAdditionalCosts.medical[role] / 12
      const idCost = mockAdditionalCosts.idCost[role] / 12
      const accommodationCost = mockAdditionalCosts.accommodation[role] / 12
      const transportationCost = mockAdditionalCosts.transportation[role] / 12
      const otherCosts = mockAdditionalCosts.other[role] / 12

      const totalAdditionalCosts = visaCost + manpowerCost + medicalCost + idCost + accommodationCost + transportationCost + otherCosts
      const totalCostToCompany = baseGrossPay + totalAdditionalCosts

      return {
        id: `CTC-${staff.id}`,
        staffId: staff.id,
        staffName: staff.name,
        role: staff.role,
        grossPay: Number(baseGrossPay.toFixed(2)),
        visaCost: Number(visaCost.toFixed(2)),
        manpowerCost: Number(manpowerCost.toFixed(2)),
        medicalCost: Number(medicalCost.toFixed(2)),
        idCost: Number(idCost.toFixed(2)),
        accommodationCost: Number(accommodationCost.toFixed(2)),
        transportationCost: Number(transportationCost.toFixed(2)),
        otherCosts: Number(otherCosts.toFixed(2)),
        totalAdditionalCosts: Number(totalAdditionalCosts.toFixed(2)),
        totalCostToCompany: Number(totalCostToCompany.toFixed(2)),
        status: "Active" as const
      }
    })
    
    setCostToCompanyData(newCostData)
  }, [realStaff])

  const handleViewDetails = (record: StaffCostRecord) => {
    setSelectedStaff(record)
    setIsDetailsDialogOpen(true)
  }

  const handleEditCost = (record: StaffCostRecord) => {
    setSelectedStaff(record)
    setIsEditCostDialogOpen(true)
  }

  // Get available export sections
  const getAvailableExportSections = (): ExportSection[] => {
    return [
      {
        id: 'staff-costs',
        name: 'Staff Cost Details',
        description: 'Complete staff cost breakdown and calculations',
        enabled: true,
        dataCount: costToCompanyData.length
      },
      {
        id: 'summary',
        name: 'Cost Summary',
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
          case 'staff-costs':
            reportSections.push(...costToCompanyData)
            break
          case 'summary':
            const summary = {
              totalMonthlyCosts,
              totalAnnualCosts,
              averageCostPerEmployee,
              totalStaff: costToCompanyData.length,
              activeStaff: costToCompanyData.filter(s => s.status === 'Active').length
            }
            reportSections.push(summary)
            break
        }
      }

      const reportData = prepareTableDataForExport(
        reportSections,
        'Staff Costs Report',
        options.includeSummary ? {
          totalMonthlyCosts,
          totalAnnualCosts,
          averageCostPerEmployee
        } : undefined
      )

      reportData.dateRange = options.dateRange || dateRange

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
        description: `Staff costs report exported as ${options.format.toUpperCase()} file.`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export staff costs. Please try again.",
      })
    } finally {
      setIsExporting(false)
      setIsExportDialogOpen(false)
    }
  }

  // Quick export functions
  const handleQuickExportCSV = async () => {
    try {
      const reportData = prepareTableDataForExport(costToCompanyData, 'Staff Costs Export')
      await exportReportToCSV(reportData)
      toast({
        title: "CSV Export Successful",
        description: "Staff costs exported to CSV file.",
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
      const reportData = prepareTableDataForExport(costToCompanyData, 'Staff Costs Export')
      await exportReportToExcel(reportData, { format: 'excel', includeSummary: true })
      toast({
        title: "Excel Export Successful",
        description: "Staff costs exported to Excel file.",
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
      const printService = ReportPrintService.getInstance()

      const printSections: PrintSection[] = [
        {
          id: 'summary',
          title: 'Staff Costs Summary',
          content: JSON.stringify({
            totalMonthlyCosts,
            totalAnnualCosts,
            averageCostPerEmployee,
            totalStaff: costToCompanyData.length
          }),
          type: 'summary'
        },
        {
          id: 'staff-costs',
          title: 'Staff Cost Details',
          content: generateTableHTML(costToCompanyData),
          type: 'table',
          pageBreakBefore: true
        }
      ]

      await printService.printReport({
        title: 'Staff Costs Report',
        dateRange,
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

  // Calculate summary statistics
  const totalMonthlyCosts = costToCompanyData.reduce((sum, record) => sum + record.totalCostToCompany, 0)
  const totalAnnualCosts = totalMonthlyCosts * 12
  const averageCostPerEmployee = costToCompanyData.length > 0 ? totalMonthlyCosts / costToCompanyData.length : 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Staff Costs & Cost to Company</CardTitle>
          <CardDescription>
            Manage additional staff costs and total cost to company calculations
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsAddCostDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Cost
          </Button>

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

          {/* Enhanced Print Button */}
          <Button variant="outline" onClick={handlePrint} disabled={isPrinting}>
            {isPrinting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                <CurrencyDisplay amount={totalMonthlyCosts} />
              </div>
              <p className="text-xs text-muted-foreground">Total Monthly Costs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                <CurrencyDisplay amount={totalAnnualCosts} />
              </div>
              <p className="text-xs text-muted-foreground">Total Annual Costs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                <CurrencyDisplay amount={averageCostPerEmployee} />
              </div>
              <p className="text-xs text-muted-foreground">Average Cost per Employee</p>
            </CardContent>
          </Card>
        </div>

        {/* Cost to Company Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Gross Pay</TableHead>
                <TableHead className="text-right">Visa</TableHead>
                <TableHead className="text-right">Manpower</TableHead>
                <TableHead className="text-right">Medical</TableHead>
                <TableHead className="text-right">ID Costs</TableHead>
                <TableHead className="text-right">Accommodation</TableHead>
                <TableHead className="text-right">Transportation</TableHead>
                <TableHead className="text-right">Other</TableHead>
                <TableHead className="text-right">Total CTC</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costToCompanyData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.staffName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {record.role.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={record.grossPay} />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={record.visaCost} />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={record.manpowerCost} />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={record.medicalCost} />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={record.idCost} />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={record.accommodationCost} />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={record.transportationCost} />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={record.otherCosts} />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <CurrencyDisplay amount={record.totalCostToCompany} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={record.status === "Active" ? "success" : "outline"}>
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(record)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditCost(record)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit costs
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* View Details Dialog */}
      {selectedStaff && (
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Staff Cost Details</DialogTitle>
              <DialogDescription>
                Detailed cost breakdown for {selectedStaff.staffName}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Staff Name</Label>
                  <p className="font-medium">{selectedStaff.staffName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Role</Label>
                  <p className="font-medium capitalize">{selectedStaff.role.replace('_', ' ')}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Monthly Cost Breakdown</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Gross Pay:</span>
                    <span><CurrencyDisplay amount={selectedStaff.grossPay} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Visa Costs:</span>
                    <span><CurrencyDisplay amount={selectedStaff.visaCost} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Manpower Costs:</span>
                    <span><CurrencyDisplay amount={selectedStaff.manpowerCost} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medical Costs:</span>
                    <span><CurrencyDisplay amount={selectedStaff.medicalCost} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span>ID Costs:</span>
                    <span><CurrencyDisplay amount={selectedStaff.idCost} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accommodation:</span>
                    <span><CurrencyDisplay amount={selectedStaff.accommodationCost} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transportation:</span>
                    <span><CurrencyDisplay amount={selectedStaff.transportationCost} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Costs:</span>
                    <span><CurrencyDisplay amount={selectedStaff.otherCosts} /></span>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center font-medium">
                    <span>Total Additional Costs:</span>
                    <span><CurrencyDisplay amount={selectedStaff.totalAdditionalCosts} /></span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold mt-2">
                    <span>Total Cost to Company (Monthly):</span>
                    <span><CurrencyDisplay amount={selectedStaff.totalCostToCompany} /></span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>Annual Cost to Company:</span>
                    <span><CurrencyDisplay amount={selectedStaff.totalCostToCompany * 12} /></span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setIsDetailsDialogOpen(false)
                handleEditCost(selectedStaff)
              }}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Costs
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Cost Dialog */}
      {selectedStaff && (
        <Dialog open={isEditCostDialogOpen} onOpenChange={setIsEditCostDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Staff Cost Details</DialogTitle>
              <DialogDescription>
                Edit all cost details for {selectedStaff.staffName}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault()

              // Update the cost data
              const updatedCostData = costToCompanyData.map(record => {
                if (record.id === selectedStaff.id) {
                  // Recalculate totals
                  const totalAdditionalCosts = record.visaCost + record.manpowerCost + record.medicalCost +
                    record.idCost + record.accommodationCost + record.transportationCost + record.otherCosts
                  const totalCostToCompany = record.grossPay + totalAdditionalCosts

                  return {
                    ...record,
                    totalAdditionalCosts: Number(totalAdditionalCosts.toFixed(2)),
                    totalCostToCompany: Number(totalCostToCompany.toFixed(2))
                  }
                }
                return record
              })

              setCostToCompanyData(updatedCostData)

              toast({
                title: "Costs updated",
                description: `Cost details for ${selectedStaff.staffName} have been updated successfully.`,
              })
              setIsEditCostDialogOpen(false)
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grossPay">Gross Pay</Label>
                    <Input
                      id="grossPay"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={selectedStaff.grossPay?.toString() || "0"}
                      onChange={(e) => {
                        const updatedData = costToCompanyData.map(record =>
                          record.id === selectedStaff.id
                            ? { ...record, grossPay: parseFloat(e.target.value) || 0 }
                            : record
                        )
                        setCostToCompanyData(updatedData)
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visaCost">Visa Costs (Monthly)</Label>
                    <Input
                      id="visaCost"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={selectedStaff.visaCost?.toString() || "0"}
                      onChange={(e) => {
                        const updatedData = costToCompanyData.map(record =>
                          record.id === selectedStaff.id
                            ? { ...record, visaCost: parseFloat(e.target.value) || 0 }
                            : record
                        )
                        setCostToCompanyData(updatedData)
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manpowerCost">Manpower Costs</Label>
                    <Input
                      id="manpowerCost"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={selectedStaff.manpowerCost?.toString() || "0"}
                      onChange={(e) => {
                        const updatedData = costToCompanyData.map(record =>
                          record.id === selectedStaff.id
                            ? { ...record, manpowerCost: parseFloat(e.target.value) || 0 }
                            : record
                        )
                        setCostToCompanyData(updatedData)
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicalCost">Medical Costs</Label>
                    <Input
                      id="medicalCost"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={selectedStaff.medicalCost?.toString() || "0"}
                      onChange={(e) => {
                        const updatedData = costToCompanyData.map(record =>
                          record.id === selectedStaff.id
                            ? { ...record, medicalCost: parseFloat(e.target.value) || 0 }
                            : record
                        )
                        setCostToCompanyData(updatedData)
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="idCost">ID Costs</Label>
                    <Input
                      id="idCost"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={selectedStaff.idCost?.toString() || "0"}
                      onChange={(e) => {
                        const updatedData = costToCompanyData.map(record =>
                          record.id === selectedStaff.id
                            ? { ...record, idCost: parseFloat(e.target.value) || 0 }
                            : record
                        )
                        setCostToCompanyData(updatedData)
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accommodationCost">Accommodation</Label>
                    <Input
                      id="accommodationCost"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={selectedStaff.accommodationCost?.toString() || "0"}
                      onChange={(e) => {
                        const updatedData = costToCompanyData.map(record =>
                          record.id === selectedStaff.id
                            ? { ...record, accommodationCost: parseFloat(e.target.value) || 0 }
                            : record
                        )
                        setCostToCompanyData(updatedData)
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transportationCost">Transportation</Label>
                    <Input
                      id="transportationCost"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={selectedStaff.transportationCost?.toString() || "0"}
                      onChange={(e) => {
                        const updatedData = costToCompanyData.map(record =>
                          record.id === selectedStaff.id
                            ? { ...record, transportationCost: parseFloat(e.target.value) || 0 }
                            : record
                        )
                        setCostToCompanyData(updatedData)
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otherCosts">Other Costs</Label>
                    <Input
                      id="otherCosts"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={selectedStaff.otherCosts?.toString() || "0"}
                      onChange={(e) => {
                        const updatedData = costToCompanyData.map(record =>
                          record.id === selectedStaff.id
                            ? { ...record, otherCosts: parseFloat(e.target.value) || 0 }
                            : record
                        )
                        setCostToCompanyData(updatedData)
                      }}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditCostDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Export Options Dialog */}
      <ExportOptionsDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        onExport={handleExport}
        availableSections={getAvailableExportSections()}
        defaultDateRange={dateRange}
        currentLocation="all"
        isLoading={isExporting}
      />
    </Card>
  )
}
