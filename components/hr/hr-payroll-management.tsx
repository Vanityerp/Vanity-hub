"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { useStaff } from "@/lib/staff-provider"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { useCurrency } from "@/lib/currency-provider"
import {
  Download,
  Eye,
  MoreHorizontal,
  Plus,
  FileText,
  DollarSign,
  CheckCircle2,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  Mail,
  Edit,
  Save,
  Calculator,
  TrendingUp,
  Users,
  Clock,
  Banknote,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

// Salary structure based on roles
const SALARY_STRUCTURE = {
  stylist: { base: 3500, hourlyRate: 25, overtimeMultiplier: 1.5 },
  colorist: { base: 3800, hourlyRate: 27, overtimeMultiplier: 1.5 },
  barber: { base: 3200, hourlyRate: 22, overtimeMultiplier: 1.5 },
  nail_technician: { base: 2800, hourlyRate: 20, overtimeMultiplier: 1.5 },
  esthetician: { base: 3000, hourlyRate: 21, overtimeMultiplier: 1.5 },
  receptionist: { base: 2500, hourlyRate: 18, overtimeMultiplier: 1.5 },
  manager: { base: 5000, hourlyRate: 35, overtimeMultiplier: 1.5 }
}

// Benefits and deductions structure
const BENEFITS_DEDUCTIONS = {
  socialSecurity: 0.075, // 7.5%
  healthInsurance: 150, // Fixed amount
  pensionContribution: 0.05, // 5%
  transportAllowance: 300, // Fixed amount
  mealAllowance: 200, // Fixed amount
  performanceBonus: 0.1 // 10% of base for top performers
}

interface PayrollRecord {
  id: string
  staffId: string
  staffName: string
  role: string
  baseSalary: number
  regularHours: number
  overtimeHours: number
  hourlyRate: number
  commissions: number
  bonuses: number
  allowances: number
  grossPay: number
  socialSecurity: number
  healthInsurance: number
  pensionContribution: number
  totalDeductions: number
  netPay: number
  status: "Draft" | "Approved" | "Paid" | "Cancelled"
  payPeriod: string
  payDate?: Date
  notes?: string
}

export function HRPayrollManagement() {
  const { toast } = useToast()
  const { formatCurrency } = useCurrency()
  const { staff: realStaff } = useStaff()
  const [activeTab, setActiveTab] = useState("current-payroll")
  const [currentPayPeriod, setCurrentPayPeriod] = useState(new Date())
  const [selectedStaff, setSelectedStaff] = useState<PayrollRecord | null>(null)
  
  // Dialog states
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isProcessPayrollDialogOpen, setIsProcessPayrollDialogOpen] = useState(false)
  const [isBulkProcessDialogOpen, setIsBulkProcessDialogOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isGeneratePayslipDialogOpen, setIsGeneratePayslipDialogOpen] = useState(false)
  const [isEmailPayslipDialogOpen, setIsEmailPayslipDialogOpen] = useState(false)
  const [isChangeStatusDialogOpen, setIsChangeStatusDialogOpen] = useState(false)

  // Form states
  const [editingRecord, setEditingRecord] = useState<Partial<PayrollRecord>>({})
  const [bulkProcessSettings, setBulkProcessSettings] = useState({
    payDate: new Date(),
    sendNotifications: true,
    includePayslips: true
  })
  const [emailSettings, setEmailSettings] = useState({
    subject: "",
    message: "",
    includePayslip: true
  })

  // Payroll data state
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([])

  // Generate payroll data for current staff
  useEffect(() => {
    const payPeriodStr = format(currentPayPeriod, "yyyy-MM")

    const newPayrollData = realStaff.map((staff) => {
      const salaryInfo = SALARY_STRUCTURE[staff.role as keyof typeof SALARY_STRUCTURE] || SALARY_STRUCTURE.stylist

      // Generate realistic hours and performance data
      const seed = parseInt(staff.id.replace(/\D/g, '')) || 1
      const regularHours = Math.min(160, Math.max(120, 140 + (seed * 7) % 40)) // 120-160 hours per month
      const overtimeHours = Math.max(0, (seed * 3) % 20) // 0-20 overtime hours
      const commissions = Math.floor(200 + (seed * 50) % 800) // 200-1000 commissions
      const bonuses = (seed % 3 === 0) ? salaryInfo.base * BENEFITS_DEDUCTIONS.performanceBonus : 0

      // Calculate pay components
      const baseSalary = salaryInfo.base
      const regularPay = regularHours * salaryInfo.hourlyRate
      const overtimePay = overtimeHours * salaryInfo.hourlyRate * salaryInfo.overtimeMultiplier
      const allowances = BENEFITS_DEDUCTIONS.transportAllowance + BENEFITS_DEDUCTIONS.mealAllowance
      const grossPay = baseSalary + regularPay + overtimePay + commissions + bonuses + allowances

      // Calculate deductions
      const socialSecurity = grossPay * BENEFITS_DEDUCTIONS.socialSecurity
      const healthInsurance = BENEFITS_DEDUCTIONS.healthInsurance
      const pensionContribution = grossPay * BENEFITS_DEDUCTIONS.pensionContribution
      const totalDeductions = socialSecurity + healthInsurance + pensionContribution
      const netPay = grossPay - totalDeductions

      return {
        id: `PR-${payPeriodStr}-${staff.id}`,
        staffId: staff.id,
        staffName: staff.name,
        role: staff.role,
        baseSalary,
        regularHours,
        overtimeHours,
        hourlyRate: salaryInfo.hourlyRate,
        commissions,
        bonuses,
        allowances,
        grossPay: Number(grossPay.toFixed(2)),
        socialSecurity: Number(socialSecurity.toFixed(2)),
        healthInsurance,
        pensionContribution: Number(pensionContribution.toFixed(2)),
        totalDeductions: Number(totalDeductions.toFixed(2)),
        netPay: Number(netPay.toFixed(2)),
        status: (seed % 4 === 0) ? "Paid" : (seed % 3 === 0) ? "Approved" : "Draft" as const,
        payPeriod: payPeriodStr,
        payDate: (seed % 4 === 0) ? new Date() : undefined,
        notes: (seed % 5 === 0) ? "Performance bonus included" : undefined
      }
    })

    setPayrollData(newPayrollData)
  }, [realStaff, currentPayPeriod])

  // Calculate summary statistics
  const payrollSummary = useMemo(() => {
    const totalStaff = payrollData.length
    const totalGrossPay = payrollData.reduce((sum, record) => sum + record.grossPay, 0)
    const totalNetPay = payrollData.reduce((sum, record) => sum + record.netPay, 0)
    const totalDeductions = payrollData.reduce((sum, record) => sum + record.totalDeductions, 0)
    const paidCount = payrollData.filter(record => record.status === "Paid").length
    const pendingCount = payrollData.filter(record => record.status !== "Paid").length
    
    return {
      totalStaff,
      totalGrossPay: Number(totalGrossPay.toFixed(2)),
      totalNetPay: Number(totalNetPay.toFixed(2)),
      totalDeductions: Number(totalDeductions.toFixed(2)),
      paidCount,
      pendingCount,
      averageGrossPay: Number((totalGrossPay / totalStaff).toFixed(2)),
      averageNetPay: Number((totalNetPay / totalStaff).toFixed(2))
    }
  }, [payrollData])

  const handleViewDetails = (record: PayrollRecord) => {
    setSelectedStaff(record)
    setIsDetailsDialogOpen(true)
  }

  const handleEditRecord = (record: PayrollRecord) => {
    setEditingRecord(record)
    setIsEditDialogOpen(true)
  }

  const handleProcessSingle = (record: PayrollRecord) => {
    setSelectedStaff(record)
    setIsProcessPayrollDialogOpen(true)
  }

  const handleBulkProcess = () => {
    setIsBulkProcessDialogOpen(true)
  }

  const handleExport = () => {
    setIsExportDialogOpen(true)
  }

  const navigatePayPeriod = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentPayPeriod(subMonths(currentPayPeriod, 1))
    } else {
      setCurrentPayPeriod(addMonths(currentPayPeriod, 1))
    }
  }

  const processSinglePayroll = () => {
    if (!selectedStaff) return

    // Update the status to Paid and set pay date
    const updatedPayrollData = payrollData.map(record => {
      if (record.id === selectedStaff.id) {
        return {
          ...record,
          status: "Paid" as const,
          payDate: new Date()
        }
      }
      return record
    })

    setPayrollData(updatedPayrollData)

    toast({
      title: "Payroll processed",
      description: `Payment for ${selectedStaff.staffName} has been processed successfully.`,
    })
    setIsProcessPayrollDialogOpen(false)
  }

  const handleGeneratePayslip = (record: PayrollRecord) => {
    setSelectedStaff(record)
    setIsGeneratePayslipDialogOpen(true)
  }

  const handleEmailPayslip = (record: PayrollRecord) => {
    setSelectedStaff(record)
    setEmailSettings({
      subject: `Payslip for ${format(currentPayPeriod, "MMMM yyyy")} - ${record.staffName}`,
      message: `Dear ${record.staffName},\n\nPlease find attached your payslip for ${format(currentPayPeriod, "MMMM yyyy")}.\n\nBest regards,\nHR Department`,
      includePayslip: true
    })
    setIsEmailPayslipDialogOpen(true)
  }

  const saveEditedPayroll = () => {
    if (!editingRecord.id) return

    // Update the payroll data with edited values
    const updatedPayrollData = payrollData.map(record => {
      if (record.id === editingRecord.id) {
        // Recalculate totals if financial values changed
        const regularPay = (editingRecord.regularHours || record.regularHours) * (editingRecord.hourlyRate || record.hourlyRate)
        const overtimePay = (editingRecord.overtimeHours || record.overtimeHours) * (editingRecord.hourlyRate || record.hourlyRate) * 1.5
        const grossPay = record.baseSalary + regularPay + overtimePay + (editingRecord.commissions || record.commissions) + (editingRecord.bonuses || record.bonuses) + (editingRecord.allowances || record.allowances)
        const socialSecurity = grossPay * BENEFITS_DEDUCTIONS.socialSecurity
        const pensionContribution = grossPay * BENEFITS_DEDUCTIONS.pensionContribution
        const totalDeductions = socialSecurity + record.healthInsurance + pensionContribution
        const netPay = grossPay - totalDeductions

        return {
          ...record,
          ...editingRecord,
          grossPay: Number(grossPay.toFixed(2)),
          socialSecurity: Number(socialSecurity.toFixed(2)),
          pensionContribution: Number(pensionContribution.toFixed(2)),
          totalDeductions: Number(totalDeductions.toFixed(2)),
          netPay: Number(netPay.toFixed(2))
        }
      }
      return record
    })

    setPayrollData(updatedPayrollData)

    toast({
      title: "Payroll updated",
      description: `Payroll for ${editingRecord.staffName} has been updated successfully.`,
    })
    setIsEditDialogOpen(false)
    setEditingRecord({})
  }

  const generatePayslip = () => {
    if (!selectedStaff) return

    // In a real app, this would generate and download a PDF
    toast({
      title: "Payslip generated",
      description: `Payslip for ${selectedStaff.staffName} has been generated and downloaded.`,
    })
    setIsGeneratePayslipDialogOpen(false)
  }

  const sendEmailPayslip = () => {
    if (!selectedStaff) return

    // In a real app, this would send the email
    toast({
      title: "Email sent",
      description: `Payslip has been emailed to ${selectedStaff.staffName}.`,
    })
    setIsEmailPayslipDialogOpen(false)
  }

  const handleChangeStatus = (record: PayrollRecord) => {
    setSelectedStaff(record)
    setIsChangeStatusDialogOpen(true)
  }

  const updatePayrollStatus = (newStatus: PayrollRecord["status"]) => {
    if (!selectedStaff) return

    const updatedPayrollData = payrollData.map(record => {
      if (record.id === selectedStaff.id) {
        const updatedRecord = {
          ...record,
          status: newStatus,
          payDate: newStatus === "Paid" ? new Date() : record.payDate
        }
        setSelectedStaff(updatedRecord) // Update selected staff for dialog
        return updatedRecord
      }
      return record
    })

    setPayrollData(updatedPayrollData)

    toast({
      title: "Status updated",
      description: `${selectedStaff.staffName}'s payroll status changed to ${newStatus}.`,
    })
    setIsChangeStatusDialogOpen(false)
  }

  const getNextStatus = (currentStatus: PayrollRecord["status"]): PayrollRecord["status"] | null => {
    switch (currentStatus) {
      case "Draft":
        return "Approved"
      case "Approved":
        return "Paid"
      case "Paid":
        return null // Cannot change from Paid
      case "Cancelled":
        return "Draft"
      default:
        return null
    }
  }

  const getStatusColor = (status: PayrollRecord["status"]) => {
    switch (status) {
      case "Draft":
        return "outline"
      case "Approved":
        return "default"
      case "Paid":
        return "success"
      case "Cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  const processBulkPayroll = () => {
    const pendingRecords = payrollData.filter(record => record.status !== "Paid")

    // Update all pending records to Paid status
    const updatedPayrollData = payrollData.map(record => {
      if (record.status !== "Paid") {
        return {
          ...record,
          status: "Paid" as const,
          payDate: bulkProcessSettings.payDate
        }
      }
      return record
    })

    setPayrollData(updatedPayrollData)

    toast({
      title: "Bulk payroll processed",
      description: `Processed payroll for ${pendingRecords.length} staff members.`,
    })
    setIsBulkProcessDialogOpen(false)
  }

  const exportPayroll = () => {
    toast({
      title: "Export completed",
      description: `Payroll data for ${format(currentPayPeriod, "MMMM yyyy")} has been exported.`,
    })
    setIsExportDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Payroll Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage staff payroll, salaries, and compensation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleBulkProcess}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Process Payroll
          </Button>
        </div>
      </div>

      {/* Pay Period Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigatePayPeriod('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <h4 className="font-medium">{format(currentPayPeriod, "MMMM yyyy")}</h4>
                <p className="text-sm text-muted-foreground">Pay Period</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigatePayPeriod('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mx-auto mb-1">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-sm font-medium">{payrollSummary.totalStaff}</p>
                <p className="text-xs text-muted-foreground">Total Staff</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mx-auto mb-1">
                  <Banknote className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-sm font-medium">
                  <CurrencyDisplay amount={payrollSummary.totalGrossPay} />
                </p>
                <p className="text-xs text-muted-foreground">Gross Pay</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full mx-auto mb-1">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </div>
                <p className="text-sm font-medium">
                  <CurrencyDisplay amount={payrollSummary.totalNetPay} />
                </p>
                <p className="text-xs text-muted-foreground">Net Pay</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full mx-auto mb-1">
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                </div>
                <p className="text-sm font-medium">{payrollSummary.paidCount}/{payrollSummary.totalStaff}</p>
                <p className="text-xs text-muted-foreground">Processed</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="current-payroll">Current Payroll</TabsTrigger>
          <TabsTrigger value="payroll-history">Payroll History</TabsTrigger>
          <TabsTrigger value="salary-structure">Salary Structure</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="current-payroll">
          <Card>
            <CardHeader>
              <CardTitle>Staff Payroll - {format(currentPayPeriod, "MMMM yyyy")}</CardTitle>
              <CardDescription>
                Review and process payroll for all staff members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Base Salary</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead className="text-right">Overtime</TableHead>
                      <TableHead className="text-right">Commissions</TableHead>
                      <TableHead className="text-right">Gross Pay</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">Net Pay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollData.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.staffName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {record.role.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <CurrencyDisplay amount={record.baseSalary} />
                        </TableCell>
                        <TableCell className="text-right">
                          {record.regularHours}h
                        </TableCell>
                        <TableCell className="text-right">
                          {record.overtimeHours}h
                        </TableCell>
                        <TableCell className="text-right">
                          <CurrencyDisplay amount={record.commissions} />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <CurrencyDisplay amount={record.grossPay} />
                        </TableCell>
                        <TableCell className="text-right">
                          <CurrencyDisplay amount={record.totalDeductions} />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <CurrencyDisplay amount={record.netPay} />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0"
                            onClick={() => handleChangeStatus(record)}
                          >
                            <Badge variant={getStatusColor(record.status)} className="cursor-pointer hover:opacity-80">
                              {record.status}
                            </Badge>
                          </Button>
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
                              <DropdownMenuItem onClick={() => handleEditRecord(record)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit payroll
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleProcessSingle(record)}
                                disabled={record.status === "Paid"}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Process payment
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeStatus(record)}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Change status
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleGeneratePayslip(record)}>
                                <FileText className="mr-2 h-4 w-4" />
                                Generate payslip
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEmailPayslip(record)}>
                                <Mail className="mr-2 h-4 w-4" />
                                Email payslip
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
          </Card>
        </TabsContent>

        <TabsContent value="payroll-history">
          <Card>
            <CardHeader>
              <CardTitle>Payroll History</CardTitle>
              <CardDescription>
                View historical payroll data and processed payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Payroll History</h3>
                <p className="text-muted-foreground">
                  Historical payroll data will be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary-structure">
          <Card>
            <CardHeader>
              <CardTitle>Salary Structure</CardTitle>
              <CardDescription>
                Manage salary structures and compensation policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Base Salary</TableHead>
                      <TableHead className="text-right">Hourly Rate</TableHead>
                      <TableHead className="text-right">Overtime Rate</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(SALARY_STRUCTURE).map(([role, structure]) => (
                      <TableRow key={role}>
                        <TableCell className="font-medium capitalize">
                          {role.replace('_', ' ')}
                        </TableCell>
                        <TableCell className="text-right">
                          <CurrencyDisplay amount={structure.base} />
                        </TableCell>
                        <TableCell className="text-right">
                          <CurrencyDisplay amount={structure.hourlyRate} />
                        </TableCell>
                        <TableCell className="text-right">
                          <CurrencyDisplay amount={structure.hourlyRate * structure.overtimeMultiplier} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Reports</CardTitle>
              <CardDescription>
                Generate and view payroll reports and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Monthly Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Staff:</span>
                      <span className="font-medium">{payrollSummary.totalStaff}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Gross Pay:</span>
                      <span className="font-medium">
                        <CurrencyDisplay amount={payrollSummary.totalGrossPay} />
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Deductions:</span>
                      <span className="font-medium">
                        <CurrencyDisplay amount={payrollSummary.totalDeductions} />
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Net Pay:</span>
                      <span className="font-medium">
                        <CurrencyDisplay amount={payrollSummary.totalNetPay} />
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Average Compensation</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Average Gross Pay:</span>
                      <span className="font-medium">
                        <CurrencyDisplay amount={payrollSummary.averageGrossPay} />
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Net Pay:</span>
                      <span className="font-medium">
                        <CurrencyDisplay amount={payrollSummary.averageNetPay} />
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processed Payments:</span>
                      <span className="font-medium">
                        {payrollSummary.paidCount} / {payrollSummary.totalStaff}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payroll Details Dialog */}
      {selectedStaff && (
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Payroll Details</DialogTitle>
              <DialogDescription>
                Detailed payroll breakdown for {selectedStaff.staffName}
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
                  <p className="capitalize">{selectedStaff.role.replace('_', ' ')}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Earnings</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base Salary:</span>
                    <span className="font-medium">
                      <CurrencyDisplay amount={selectedStaff.baseSalary} />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Regular Hours ({selectedStaff.regularHours}h):</span>
                    <span className="font-medium">
                      <CurrencyDisplay amount={selectedStaff.regularHours * selectedStaff.hourlyRate} />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overtime Hours ({selectedStaff.overtimeHours}h):</span>
                    <span className="font-medium">
                      <CurrencyDisplay amount={selectedStaff.overtimeHours * selectedStaff.hourlyRate * 1.5} />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commissions:</span>
                    <span className="font-medium">
                      <CurrencyDisplay amount={selectedStaff.commissions} />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bonuses:</span>
                    <span className="font-medium">
                      <CurrencyDisplay amount={selectedStaff.bonuses} />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Allowances:</span>
                    <span className="font-medium">
                      <CurrencyDisplay amount={selectedStaff.allowances} />
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Deductions</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Social Security (7.5%):</span>
                    <span className="font-medium">
                      <CurrencyDisplay amount={selectedStaff.socialSecurity} />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Health Insurance:</span>
                    <span className="font-medium">
                      <CurrencyDisplay amount={selectedStaff.healthInsurance} />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pension Contribution (5%):</span>
                    <span className="font-medium">
                      <CurrencyDisplay amount={selectedStaff.pensionContribution} />
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Gross Pay:</span>
                  <span className="text-lg font-medium">
                    <CurrencyDisplay amount={selectedStaff.grossPay} />
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Deductions:</span>
                  <span className="text-lg font-medium text-red-600">
                    -<CurrencyDisplay amount={selectedStaff.totalDeductions} />
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-medium">Net Pay:</span>
                  <span className="text-xl font-bold text-green-600">
                    <CurrencyDisplay amount={selectedStaff.netPay} />
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setIsDetailsDialogOpen(false)
                handleEditRecord(selectedStaff)
              }}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Payroll
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Process Single Payment Dialog */}
      {selectedStaff && (
        <Dialog open={isProcessPayrollDialogOpen} onOpenChange={setIsProcessPayrollDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Process Payment</DialogTitle>
              <DialogDescription>
                Process payment for {selectedStaff.staffName}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Staff</Label>
                  <p className="font-medium">{selectedStaff.staffName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Net Amount</Label>
                  <p className="font-medium">
                    <CurrencyDisplay amount={selectedStaff.netPay} />
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="payDate">Payment Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !bulkProcessSettings.payDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {bulkProcessSettings.payDate ? format(bulkProcessSettings.payDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={bulkProcessSettings.payDate}
                      onSelect={(date) => date && setBulkProcessSettings({...bulkProcessSettings, payDate: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendNotification"
                  checked={bulkProcessSettings.sendNotifications}
                  onCheckedChange={(checked) =>
                    setBulkProcessSettings({...bulkProcessSettings, sendNotifications: checked as boolean})
                  }
                />
                <Label htmlFor="sendNotification">Send payment notification</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsProcessPayrollDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={processSinglePayroll}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Process Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Payroll Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Payroll</DialogTitle>
            <DialogDescription>
              {editingRecord.staffName && `Edit payroll details for ${editingRecord.staffName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="regularHours">Regular Hours</Label>
                <Input
                  id="regularHours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={editingRecord.regularHours || 0}
                  onChange={(e) => setEditingRecord({...editingRecord, regularHours: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="overtimeHours">Overtime Hours</Label>
                <Input
                  id="overtimeHours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={editingRecord.overtimeHours || 0}
                  onChange={(e) => setEditingRecord({...editingRecord, overtimeHours: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingRecord.hourlyRate || 0}
                  onChange={(e) => setEditingRecord({...editingRecord, hourlyRate: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commissions">Commissions</Label>
                <Input
                  id="commissions"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingRecord.commissions || 0}
                  onChange={(e) => setEditingRecord({...editingRecord, commissions: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bonuses">Bonuses</Label>
                <Input
                  id="bonuses"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingRecord.bonuses || 0}
                  onChange={(e) => setEditingRecord({...editingRecord, bonuses: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allowances">Allowances</Label>
                <Input
                  id="allowances"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingRecord.allowances || 0}
                  onChange={(e) => setEditingRecord({...editingRecord, allowances: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editingRecord.status || "Draft"}
                  onValueChange={(value) => setEditingRecord({...editingRecord, status: value as PayrollRecord["status"]})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payDate">Pay Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editingRecord.payDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editingRecord.payDate ? format(editingRecord.payDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editingRecord.payDate}
                      onSelect={(date) => setEditingRecord({...editingRecord, payDate: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this payroll..."
                value={editingRecord.notes || ""}
                onChange={(e) => setEditingRecord({...editingRecord, notes: e.target.value})}
              />
            </div>

            {/* Calculated totals preview */}
            {editingRecord.regularHours && editingRecord.hourlyRate && (
              <div className="border-t pt-4 space-y-2">
                <h4 className="font-medium">Calculated Totals</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Regular Pay:</span>
                    <span><CurrencyDisplay amount={(editingRecord.regularHours || 0) * (editingRecord.hourlyRate || 0)} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overtime Pay:</span>
                    <span><CurrencyDisplay amount={(editingRecord.overtimeHours || 0) * (editingRecord.hourlyRate || 0) * 1.5} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gross Pay:</span>
                    <span><CurrencyDisplay amount={
                      (editingRecord.regularHours || 0) * (editingRecord.hourlyRate || 0) +
                      (editingRecord.overtimeHours || 0) * (editingRecord.hourlyRate || 0) * 1.5 +
                      (editingRecord.commissions || 0) +
                      (editingRecord.bonuses || 0) +
                      (editingRecord.allowances || 0)
                    } /></span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEditedPayroll}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Process Dialog */}
      <Dialog open={isBulkProcessDialogOpen} onOpenChange={setIsBulkProcessDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Bulk Process Payroll</DialogTitle>
            <DialogDescription>
              Process payroll for all pending staff members
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Staff to Process</Label>
              <p className="text-sm text-muted-foreground">
                {payrollData.filter(r => r.status !== "Paid").length} staff members with pending payroll
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bulkPayDate">Payment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !bulkProcessSettings.payDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {bulkProcessSettings.payDate ? format(bulkProcessSettings.payDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={bulkProcessSettings.payDate}
                    onSelect={(date) => date && setBulkProcessSettings({...bulkProcessSettings, payDate: date})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bulkSendNotifications"
                  checked={bulkProcessSettings.sendNotifications}
                  onCheckedChange={(checked) =>
                    setBulkProcessSettings({...bulkProcessSettings, sendNotifications: checked as boolean})
                  }
                />
                <Label htmlFor="bulkSendNotifications">Send payment notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includePayslips"
                  checked={bulkProcessSettings.includePayslips}
                  onCheckedChange={(checked) =>
                    setBulkProcessSettings({...bulkProcessSettings, includePayslips: checked as boolean})
                  }
                />
                <Label htmlFor="includePayslips">Include payslips in notifications</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkProcessDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={processBulkPayroll}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Process All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Payslip Dialog */}
      {selectedStaff && (
        <Dialog open={isGeneratePayslipDialogOpen} onOpenChange={setIsGeneratePayslipDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate Payslip</DialogTitle>
              <DialogDescription>
                Payslip for {selectedStaff.staffName} - {format(currentPayPeriod, "MMMM yyyy")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Payslip Header */}
              <div className="text-center border-b pb-4">
                <h3 className="text-lg font-bold">Vanity Salon</h3>
                <p className="text-sm text-muted-foreground">Employee Payslip</p>
                <p className="text-sm text-muted-foreground">Pay Period: {format(currentPayPeriod, "MMMM yyyy")}</p>
              </div>

              {/* Employee Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Employee Information</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Name:</span>
                      <span>{selectedStaff.staffName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Employee ID:</span>
                      <span>{selectedStaff.staffId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Position:</span>
                      <span className="capitalize">{selectedStaff.role.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Pay Period Details</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Pay Period:</span>
                      <span>{selectedStaff.payPeriod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pay Date:</span>
                      <span>{selectedStaff.payDate ? format(selectedStaff.payDate, "PPP") : "Pending"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant={selectedStaff.status === "Paid" ? "success" : "outline"}>
                        {selectedStaff.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Earnings */}
              <div>
                <h4 className="font-medium mb-2">Earnings</h4>
                <div className="space-y-2 text-sm border rounded-md p-3">
                  <div className="flex justify-between">
                    <span>Base Salary:</span>
                    <span><CurrencyDisplay amount={selectedStaff.baseSalary} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Regular Hours ({selectedStaff.regularHours}h @ <CurrencyDisplay amount={selectedStaff.hourlyRate} />/hr):</span>
                    <span><CurrencyDisplay amount={selectedStaff.regularHours * selectedStaff.hourlyRate} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overtime Hours ({selectedStaff.overtimeHours}h @ <CurrencyDisplay amount={selectedStaff.hourlyRate * 1.5} />/hr):</span>
                    <span><CurrencyDisplay amount={selectedStaff.overtimeHours * selectedStaff.hourlyRate * 1.5} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commissions:</span>
                    <span><CurrencyDisplay amount={selectedStaff.commissions} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bonuses:</span>
                    <span><CurrencyDisplay amount={selectedStaff.bonuses} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Allowances:</span>
                    <span><CurrencyDisplay amount={selectedStaff.allowances} /></span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Gross Pay:</span>
                    <span><CurrencyDisplay amount={selectedStaff.grossPay} /></span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="font-medium mb-2">Deductions</h4>
                <div className="space-y-2 text-sm border rounded-md p-3">
                  <div className="flex justify-between">
                    <span>Social Security (7.5%):</span>
                    <span><CurrencyDisplay amount={selectedStaff.socialSecurity} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Health Insurance:</span>
                    <span><CurrencyDisplay amount={selectedStaff.healthInsurance} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pension Contribution (5%):</span>
                    <span><CurrencyDisplay amount={selectedStaff.pensionContribution} /></span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Total Deductions:</span>
                    <span><CurrencyDisplay amount={selectedStaff.totalDeductions} /></span>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Net Pay:</span>
                  <span><CurrencyDisplay amount={selectedStaff.netPay} /></span>
                </div>
              </div>

              {selectedStaff.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground border rounded-md p-3">{selectedStaff.notes}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsGeneratePayslipDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={generatePayslip}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={() => {
                setIsGeneratePayslipDialogOpen(false)
                handleEmailPayslip(selectedStaff)
              }}>
                <Mail className="mr-2 h-4 w-4" />
                Email Payslip
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Email Payslip Dialog */}
      {selectedStaff && (
        <Dialog open={isEmailPayslipDialogOpen} onOpenChange={setIsEmailPayslipDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Email Payslip</DialogTitle>
              <DialogDescription>
                Send payslip to {selectedStaff.staffName}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="emailSubject">Subject</Label>
                <Input
                  id="emailSubject"
                  value={emailSettings.subject}
                  onChange={(e) => setEmailSettings({...emailSettings, subject: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailMessage">Message</Label>
                <Textarea
                  id="emailMessage"
                  rows={6}
                  value={emailSettings.message}
                  onChange={(e) => setEmailSettings({...emailSettings, message: e.target.value})}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includePayslip"
                  checked={emailSettings.includePayslip}
                  onCheckedChange={(checked) => setEmailSettings({...emailSettings, includePayslip: checked as boolean})}
                />
                <Label htmlFor="includePayslip">Include payslip as PDF attachment</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEmailPayslipDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={sendEmailPayslip}>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Change Status Dialog */}
      {selectedStaff && (
        <Dialog open={isChangeStatusDialogOpen} onOpenChange={setIsChangeStatusDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Change Payroll Status</DialogTitle>
              <DialogDescription>
                Update the status for {selectedStaff.staffName}'s payroll
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Current Status</Label>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(selectedStaff.status)}>
                    {selectedStaff.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {selectedStaff.payDate && `Paid on ${format(selectedStaff.payDate, "PPP")}`}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Change to:</Label>
                <div className="grid gap-2">
                  {selectedStaff.status !== "Draft" && (
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => updatePayrollStatus("Draft")}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Draft
                      <span className="ml-auto text-xs text-muted-foreground">
                        Mark as draft for editing
                      </span>
                    </Button>
                  )}

                  {selectedStaff.status !== "Approved" && selectedStaff.status !== "Paid" && (
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => updatePayrollStatus("Approved")}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approved
                      <span className="ml-auto text-xs text-muted-foreground">
                        Ready for payment
                      </span>
                    </Button>
                  )}

                  {selectedStaff.status !== "Paid" && (
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => updatePayrollStatus("Paid")}
                    >
                      <Banknote className="mr-2 h-4 w-4" />
                      Paid
                      <span className="ml-auto text-xs text-muted-foreground">
                        Payment completed
                      </span>
                    </Button>
                  )}

                  {selectedStaff.status !== "Cancelled" && (
                    <Button
                      variant="outline"
                      className="justify-start text-destructive hover:text-destructive"
                      onClick={() => updatePayrollStatus("Cancelled")}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancelled
                      <span className="ml-auto text-xs text-muted-foreground">
                        Cancel this payroll
                      </span>
                    </Button>
                  )}
                </div>
              </div>

              {selectedStaff.status === "Paid" && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> This payroll has already been paid. Changing the status will not affect the actual payment.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsChangeStatusDialogOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
