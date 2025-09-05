"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, MoreHorizontal, Plus, Edit, Trash2, UserX } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useStaff } from "@/lib/staff-provider"
import { useToast } from "@/components/ui/use-toast"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { useCurrency } from "@/lib/currency-provider"

// Mock benefits data
const mockBenefitPlans = [
  {
    id: "BP-001",
    name: "Premium Health Plan",
    type: "Health Insurance",
    provider: "Blue Cross",
    coverage: "Comprehensive",
    monthlyCost: 350,
    employerContribution: 80,
    eligibility: "Full-time",
    enrollmentPeriod: "Jan 1 - Jan 31",
  },
  {
    id: "BP-002",
    name: "Standard Health Plan",
    type: "Health Insurance",
    provider: "Blue Cross",
    coverage: "Standard",
    monthlyCost: 250,
    employerContribution: 70,
    eligibility: "Full-time",
    enrollmentPeriod: "Jan 1 - Jan 31",
  },
  {
    id: "BP-003",
    name: "Basic Health Plan",
    type: "Health Insurance",
    provider: "Blue Cross",
    coverage: "Basic",
    monthlyCost: 150,
    employerContribution: 60,
    eligibility: "Part-time (20+ hrs)",
    enrollmentPeriod: "Jan 1 - Jan 31",
  },
  {
    id: "BP-004",
    name: "Dental Plus",
    type: "Dental Insurance",
    provider: "Delta Dental",
    coverage: "Comprehensive",
    monthlyCost: 75,
    employerContribution: 50,
    eligibility: "Full-time",
    enrollmentPeriod: "Jan 1 - Jan 31",
  },
  {
    id: "BP-005",
    name: "Vision Care",
    type: "Vision Insurance",
    provider: "VSP",
    coverage: "Standard",
    monthlyCost: 45,
    employerContribution: 50,
    eligibility: "Full-time",
    enrollmentPeriod: "Jan 1 - Jan 31",
  },
  {
    id: "BP-006",
    name: "401(k) Retirement",
    type: "Retirement",
    provider: "Fidelity",
    coverage: "Matching up to 4%",
    monthlyCost: 0,
    employerContribution: 100,
    eligibility: "Full-time (after 90 days)",
    enrollmentPeriod: "Anytime",
  },
]

// Mock staff enrollments - UPDATED TO USE REAL STAFF DATA
const mockEnrollments = [
  {
    id: "EN-001",
    staffId: "staff-real-1",
    staffName: "Mekdes Abebe",
    benefitPlanId: "BP-001",
    benefitPlanName: "Premium Health Plan",
    startDate: "2025-01-01",
    status: "Active",
    dependents: 2,
    monthlyCost: 350,
    employeeContribution: 70,
    employerContribution: 280,
  },
  {
    id: "EN-002",
    staffId: "staff-real-1",
    staffName: "Mekdes Abebe",
    benefitPlanId: "BP-004",
    benefitPlanName: "Dental Plus",
    startDate: "2025-01-01",
    status: "Active",
    dependents: 2,
    monthlyCost: 75,
    employeeContribution: 37.5,
    employerContribution: 37.5,
  },
  {
    id: "EN-003",
    staffId: "staff-real-2",
    staffName: "Woyni Tade",
    benefitPlanId: "BP-002",
    benefitPlanName: "Standard Health Plan",
    startDate: "2025-01-01",
    status: "Active",
    dependents: 0,
    monthlyCost: 250,
    employeeContribution: 75,
    employerContribution: 175,
  },
  {
    id: "EN-004",
    staffId: "staff-real-3",
    staffName: "Maria Santos",
    benefitPlanId: "BP-003",
    benefitPlanName: "Basic Health Plan",
    startDate: "2025-01-01",
    status: "Active",
    dependents: 1,
    monthlyCost: 150,
    employeeContribution: 60,
    employerContribution: 90,
  },
  {
    id: "EN-005",
    staffId: "staff-real-4",
    staffName: "Fatima Al-Zahra",
    benefitPlanId: "BP-001",
    benefitPlanName: "Premium Health Plan",
    startDate: "2025-01-01",
    status: "Active",
    dependents: 3,
    monthlyCost: 350,
    employeeContribution: 70,
    employerContribution: 280,
  },
]

export function BenefitsManagement() {
  const { toast } = useToast()
  const { formatCurrency } = useCurrency()
  const { staff: realStaff } = useStaff()
  const [benefitPlans, setBenefitPlans] = useState(mockBenefitPlans)
  const [enrollments, setEnrollments] = useState(mockEnrollments)
  const [isNewEnrollmentDialogOpen, setIsNewEnrollmentDialogOpen] = useState(false)
  const [isViewEnrollmentDialogOpen, setIsViewEnrollmentDialogOpen] = useState(false)
  const [isEditEnrollmentDialogOpen, setIsEditEnrollmentDialogOpen] = useState(false)
  const [isEditPlanDialogOpen, setIsEditPlanDialogOpen] = useState(false)
  const [isNewPlanDialogOpen, setIsNewPlanDialogOpen] = useState(false)
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [newEnrollment, setNewEnrollment] = useState({
    staffId: "",
    benefitPlanId: "",
    dependents: 0,
  })
  const [editEnrollment, setEditEnrollment] = useState({
    id: "",
    staffId: "",
    benefitPlanId: "",
    dependents: 0,
    status: "Active",
  })
  const [editPlan, setEditPlan] = useState({
    id: "",
    name: "",
    type: "",
    provider: "",
    coverage: "",
    monthlyCost: 0,
    employerContribution: 0,
    eligibility: "",
    enrollmentPeriod: "",
  })
  const [newPlan, setNewPlan] = useState({
    name: "",
    type: "",
    provider: "",
    coverage: "",
    monthlyCost: 0,
    employerContribution: 0,
    eligibility: "",
    enrollmentPeriod: "",
  })

  const handleCreateEnrollment = () => {
    const staff = realStaff.find(s => s.id === newEnrollment.staffId)
    const plan = benefitPlans.find(p => p.id === newEnrollment.benefitPlanId)

    if (!staff || !plan) return

    // Check if staff is already enrolled in this plan
    const existingEnrollment = enrollments.find(
      e => e.staffId === newEnrollment.staffId && e.benefitPlanId === newEnrollment.benefitPlanId
    )

    if (existingEnrollment) {
      toast({
        title: "Enrollment failed",
        description: `${staff.name} is already enrolled in ${plan.name}.`,
        variant: "destructive",
      })
      return
    }

    const employeeContribution = plan.monthlyCost * (1 - (plan.employerContribution / 100))
    const employerContribution = plan.monthlyCost * (plan.employerContribution / 100)

    const newEnrollmentEntry = {
      id: `EN-${enrollments.length + 1}`.padStart(6, '0'),
      staffId: newEnrollment.staffId,
      staffName: staff.name,
      benefitPlanId: newEnrollment.benefitPlanId,
      benefitPlanName: plan.name,
      startDate: new Date().toISOString().split('T')[0],
      status: "Active",
      dependents: newEnrollment.dependents,
      monthlyCost: plan.monthlyCost,
      employeeContribution: employeeContribution,
      employerContribution: employerContribution,
    }

    setEnrollments([...enrollments, newEnrollmentEntry])
    setIsNewEnrollmentDialogOpen(false)

    toast({
      title: "Enrollment created",
      description: `${staff.name} has been enrolled in ${plan.name}.`,
    })
  }

  const handleViewEnrollment = (enrollment: any) => {
    setSelectedEnrollment(enrollment)
    setIsViewEnrollmentDialogOpen(true)
  }

  const handleEditEnrollment = (enrollment: any) => {
    setEditEnrollment({
      id: enrollment.id,
      staffId: enrollment.staffId,
      benefitPlanId: enrollment.benefitPlanId,
      dependents: enrollment.dependents,
      status: enrollment.status,
    })
    setIsEditEnrollmentDialogOpen(true)
  }

  const handleUpdateEnrollment = () => {
    const staff = realStaff.find(s => s.id === editEnrollment.staffId)
    const plan = benefitPlans.find(p => p.id === editEnrollment.benefitPlanId)

    if (!staff || !plan) return

    const employeeContribution = plan.monthlyCost * (1 - (plan.employerContribution / 100))
    const employerContribution = plan.monthlyCost * (plan.employerContribution / 100)

    const updatedEnrollments = enrollments.map(enrollment =>
      enrollment.id === editEnrollment.id
        ? {
            ...enrollment,
            staffId: editEnrollment.staffId,
            staffName: staff.name,
            benefitPlanId: editEnrollment.benefitPlanId,
            benefitPlanName: plan.name,
            dependents: editEnrollment.dependents,
            status: editEnrollment.status,
            monthlyCost: plan.monthlyCost,
            employeeContribution: employeeContribution,
            employerContribution: employerContribution,
          }
        : enrollment
    )

    setEnrollments(updatedEnrollments)
    setIsEditEnrollmentDialogOpen(false)

    toast({
      title: "Enrollment updated",
      description: `${staff.name}'s enrollment has been updated successfully.`,
    })
  }

  const handleTerminateEnrollment = (enrollment: any) => {
    const updatedEnrollments = enrollments.map(e =>
      e.id === enrollment.id
        ? { ...e, status: "Terminated" }
        : e
    )

    setEnrollments(updatedEnrollments)

    toast({
      title: "Enrollment terminated",
      description: `${enrollment.staffName}'s enrollment in ${enrollment.benefitPlanName} has been terminated.`,
    })
  }

  const handleDeleteEnrollment = (enrollment: any) => {
    const updatedEnrollments = enrollments.filter(e => e.id !== enrollment.id)
    setEnrollments(updatedEnrollments)

    toast({
      title: "Enrollment deleted",
      description: `${enrollment.staffName}'s enrollment in ${enrollment.benefitPlanName} has been deleted.`,
    })
  }

  const handleEditPlan = (plan: any) => {
    setEditPlan({
      id: plan.id,
      name: plan.name,
      type: plan.type,
      provider: plan.provider,
      coverage: plan.coverage,
      monthlyCost: plan.monthlyCost,
      employerContribution: plan.employerContribution,
      eligibility: plan.eligibility,
      enrollmentPeriod: plan.enrollmentPeriod,
    })
    setIsEditPlanDialogOpen(true)
  }

  const handleUpdatePlan = () => {
    const updatedPlans = benefitPlans.map(plan =>
      plan.id === editPlan.id
        ? {
            ...plan,
            name: editPlan.name,
            type: editPlan.type,
            provider: editPlan.provider,
            coverage: editPlan.coverage,
            monthlyCost: editPlan.monthlyCost,
            employerContribution: editPlan.employerContribution,
            eligibility: editPlan.eligibility,
            enrollmentPeriod: editPlan.enrollmentPeriod,
          }
        : plan
    )

    setBenefitPlans(updatedPlans)
    setIsEditPlanDialogOpen(false)

    toast({
      title: "Benefit plan updated",
      description: `${editPlan.name} has been updated successfully.`,
    })
  }

  const handleCreatePlan = () => {
    const newPlanEntry = {
      id: `BP-${String(benefitPlans.length + 1).padStart(3, '0')}`,
      ...newPlan,
    }

    setBenefitPlans([...benefitPlans, newPlanEntry])
    setIsNewPlanDialogOpen(false)
    setNewPlan({
      name: "",
      type: "",
      provider: "",
      coverage: "",
      monthlyCost: 0,
      employerContribution: 0,
      eligibility: "",
      enrollmentPeriod: "",
    })

    toast({
      title: "Benefit plan created",
      description: `${newPlan.name} has been created successfully.`,
    })
  }

  const handleDeletePlan = (plan: any) => {
    // Check if any enrollments exist for this plan
    const hasEnrollments = enrollments.some(e => e.benefitPlanId === plan.id)

    if (hasEnrollments) {
      toast({
        title: "Cannot delete plan",
        description: `${plan.name} has active enrollments and cannot be deleted.`,
        variant: "destructive",
      })
      return
    }

    const updatedPlans = benefitPlans.filter(p => p.id !== plan.id)
    setBenefitPlans(updatedPlans)

    toast({
      title: "Benefit plan deleted",
      description: `${plan.name} has been deleted successfully.`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Benefits Management</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsNewPlanDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Plan
          </Button>
          <Button onClick={() => setIsNewEnrollmentDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Enrollment
          </Button>
        </div>
      </div>

      <Tabs defaultValue="enrollments" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="plans">Benefit Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="enrollments">
          <Card>
            <CardHeader>
              <CardTitle>Staff Benefit Enrollments</CardTitle>
              <CardDescription>
                View and manage staff benefit enrollments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff</TableHead>
                      <TableHead>Benefit Plan</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Dependents</TableHead>
                      <TableHead className="text-right">Monthly Cost</TableHead>
                      <TableHead className="text-right">Employee Pays</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">{enrollment.staffName}</TableCell>
                        <TableCell>{enrollment.benefitPlanName}</TableCell>
                        <TableCell>{enrollment.startDate}</TableCell>
                        <TableCell>{enrollment.dependents}</TableCell>
                        <TableCell className="text-right"><CurrencyDisplay amount={enrollment.monthlyCost} /></TableCell>
                        <TableCell className="text-right"><CurrencyDisplay amount={enrollment.employeeContribution} /></TableCell>
                        <TableCell>
                          <Badge variant={enrollment.status === "Active" ? "success" : "outline"}>
                            {enrollment.status}
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
                              <DropdownMenuItem onClick={() => handleViewEnrollment(enrollment)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditEnrollment(enrollment)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit enrollment
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleTerminateEnrollment(enrollment)}
                                disabled={enrollment.status === "Terminated"}
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Terminate enrollment
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteEnrollment(enrollment)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete enrollment
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

        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>Available Benefit Plans</CardTitle>
              <CardDescription>
                View and manage benefit plans offered to staff
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Coverage</TableHead>
                      <TableHead className="text-right">Monthly Cost</TableHead>
                      <TableHead className="text-right">Employer Contribution</TableHead>
                      <TableHead>Eligibility</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {benefitPlans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">{plan.name}</TableCell>
                        <TableCell>{plan.type}</TableCell>
                        <TableCell>{plan.provider}</TableCell>
                        <TableCell>{plan.coverage}</TableCell>
                        <TableCell className="text-right"><CurrencyDisplay amount={plan.monthlyCost} /></TableCell>
                        <TableCell className="text-right">{plan.employerContribution}%</TableCell>
                        <TableCell>{plan.eligibility}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditPlan(plan)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit plan
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeletePlan(plan)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete plan
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
      </Tabs>

      {/* New Enrollment Dialog */}
      <Dialog open={isNewEnrollmentDialogOpen} onOpenChange={setIsNewEnrollmentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Enrollment</DialogTitle>
            <DialogDescription>
              Enroll a staff member in a benefit plan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="staff">Staff Member</Label>
              <Select
                value={newEnrollment.staffId}
                onValueChange={(value) => setNewEnrollment({...newEnrollment, staffId: value})}
              >
                <SelectTrigger id="staff">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {realStaff.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan">Benefit Plan</Label>
              <Select
                value={newEnrollment.benefitPlanId}
                onValueChange={(value) => setNewEnrollment({...newEnrollment, benefitPlanId: value})}
              >
                <SelectTrigger id="plan">
                  <SelectValue placeholder="Select benefit plan" />
                </SelectTrigger>
                <SelectContent>
                  {benefitPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} ({plan.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dependents">Number of Dependents</Label>
              <Input
                id="dependents"
                type="number"
                min="0"
                value={newEnrollment.dependents}
                onChange={(e) => setNewEnrollment({...newEnrollment, dependents: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewEnrollmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEnrollment}>Create Enrollment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Enrollment Dialog */}
      {selectedEnrollment && (
        <Dialog open={isViewEnrollmentDialogOpen} onOpenChange={setIsViewEnrollmentDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Enrollment Details</DialogTitle>
              <DialogDescription>
                Enrollment #{selectedEnrollment.id}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Staff</Label>
                  <p className="font-medium">{selectedEnrollment.staffName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p>
                    <Badge variant={selectedEnrollment.status === "Active" ? "success" : "outline"}>
                      {selectedEnrollment.status}
                    </Badge>
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Benefit Plan</Label>
                <p className="font-medium">{selectedEnrollment.benefitPlanName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Start Date</Label>
                  <p>{selectedEnrollment.startDate}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Dependents</Label>
                  <p>{selectedEnrollment.dependents}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Monthly Cost</Label>
                  <p className="font-medium"><CurrencyDisplay amount={selectedEnrollment.monthlyCost} /></p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Employee Pays</Label>
                  <p className="font-medium"><CurrencyDisplay amount={selectedEnrollment.employeeContribution} /></p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Employer Contribution</Label>
                <p className="font-medium"><CurrencyDisplay amount={selectedEnrollment.employerContribution} /></p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsViewEnrollmentDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Enrollment Dialog */}
      <Dialog open={isEditEnrollmentDialogOpen} onOpenChange={setIsEditEnrollmentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Enrollment</DialogTitle>
            <DialogDescription>
              Update enrollment details for staff member.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-staff">Staff Member</Label>
              <Select
                value={editEnrollment.staffId}
                onValueChange={(value) => setEditEnrollment({...editEnrollment, staffId: value})}
              >
                <SelectTrigger id="edit-staff">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {realStaff.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-plan">Benefit Plan</Label>
              <Select
                value={editEnrollment.benefitPlanId}
                onValueChange={(value) => setEditEnrollment({...editEnrollment, benefitPlanId: value})}
              >
                <SelectTrigger id="edit-plan">
                  <SelectValue placeholder="Select benefit plan" />
                </SelectTrigger>
                <SelectContent>
                  {benefitPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} ({plan.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-dependents">Number of Dependents</Label>
              <Input
                id="edit-dependents"
                type="number"
                min="0"
                value={editEnrollment.dependents}
                onChange={(e) => setEditEnrollment({...editEnrollment, dependents: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editEnrollment.status}
                onValueChange={(value) => setEditEnrollment({...editEnrollment, status: value})}
              >
                <SelectTrigger id="edit-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Terminated">Terminated</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditEnrollmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateEnrollment}>Update Enrollment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditPlanDialogOpen} onOpenChange={setIsEditPlanDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Benefit Plan</DialogTitle>
            <DialogDescription>
              Update benefit plan details and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-plan-name">Plan Name</Label>
                <Input
                  id="edit-plan-name"
                  value={editPlan.name}
                  onChange={(e) => setEditPlan({...editPlan, name: e.target.value})}
                  placeholder="Enter plan name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-plan-type">Type</Label>
                <Select
                  value={editPlan.type}
                  onValueChange={(value) => setEditPlan({...editPlan, type: value})}
                >
                  <SelectTrigger id="edit-plan-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Health Insurance">Health Insurance</SelectItem>
                    <SelectItem value="Dental Insurance">Dental Insurance</SelectItem>
                    <SelectItem value="Vision Insurance">Vision Insurance</SelectItem>
                    <SelectItem value="Retirement">Retirement</SelectItem>
                    <SelectItem value="Life Insurance">Life Insurance</SelectItem>
                    <SelectItem value="Disability Insurance">Disability Insurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-plan-provider">Provider</Label>
                <Input
                  id="edit-plan-provider"
                  value={editPlan.provider}
                  onChange={(e) => setEditPlan({...editPlan, provider: e.target.value})}
                  placeholder="Enter provider name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-plan-coverage">Coverage</Label>
                <Input
                  id="edit-plan-coverage"
                  value={editPlan.coverage}
                  onChange={(e) => setEditPlan({...editPlan, coverage: e.target.value})}
                  placeholder="Enter coverage details"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-plan-cost">Monthly Cost</Label>
                <Input
                  id="edit-plan-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editPlan.monthlyCost}
                  onChange={(e) => setEditPlan({...editPlan, monthlyCost: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-plan-contribution">Employer Contribution (%)</Label>
                <Input
                  id="edit-plan-contribution"
                  type="number"
                  min="0"
                  max="100"
                  value={editPlan.employerContribution}
                  onChange={(e) => setEditPlan({...editPlan, employerContribution: parseInt(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-plan-eligibility">Eligibility</Label>
              <Input
                id="edit-plan-eligibility"
                value={editPlan.eligibility}
                onChange={(e) => setEditPlan({...editPlan, eligibility: e.target.value})}
                placeholder="Enter eligibility requirements"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-plan-enrollment">Enrollment Period</Label>
              <Input
                id="edit-plan-enrollment"
                value={editPlan.enrollmentPeriod}
                onChange={(e) => setEditPlan({...editPlan, enrollmentPeriod: e.target.value})}
                placeholder="Enter enrollment period"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPlanDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePlan}>Update Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Plan Dialog */}
      <Dialog open={isNewPlanDialogOpen} onOpenChange={setIsNewPlanDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Benefit Plan</DialogTitle>
            <DialogDescription>
              Add a new benefit plan for staff enrollment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="new-plan-name">Plan Name</Label>
                <Input
                  id="new-plan-name"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                  placeholder="Enter plan name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-plan-type">Type</Label>
                <Select
                  value={newPlan.type}
                  onValueChange={(value) => setNewPlan({...newPlan, type: value})}
                >
                  <SelectTrigger id="new-plan-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Health Insurance">Health Insurance</SelectItem>
                    <SelectItem value="Dental Insurance">Dental Insurance</SelectItem>
                    <SelectItem value="Vision Insurance">Vision Insurance</SelectItem>
                    <SelectItem value="Retirement">Retirement</SelectItem>
                    <SelectItem value="Life Insurance">Life Insurance</SelectItem>
                    <SelectItem value="Disability Insurance">Disability Insurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="new-plan-provider">Provider</Label>
                <Input
                  id="new-plan-provider"
                  value={newPlan.provider}
                  onChange={(e) => setNewPlan({...newPlan, provider: e.target.value})}
                  placeholder="Enter provider name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-plan-coverage">Coverage</Label>
                <Input
                  id="new-plan-coverage"
                  value={newPlan.coverage}
                  onChange={(e) => setNewPlan({...newPlan, coverage: e.target.value})}
                  placeholder="Enter coverage details"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="new-plan-cost">Monthly Cost</Label>
                <Input
                  id="new-plan-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newPlan.monthlyCost}
                  onChange={(e) => setNewPlan({...newPlan, monthlyCost: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-plan-contribution">Employer Contribution (%)</Label>
                <Input
                  id="new-plan-contribution"
                  type="number"
                  min="0"
                  max="100"
                  value={newPlan.employerContribution}
                  onChange={(e) => setNewPlan({...newPlan, employerContribution: parseInt(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-plan-eligibility">Eligibility</Label>
              <Input
                id="new-plan-eligibility"
                value={newPlan.eligibility}
                onChange={(e) => setNewPlan({...newPlan, eligibility: e.target.value})}
                placeholder="Enter eligibility requirements"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-plan-enrollment">Enrollment Period</Label>
              <Input
                id="new-plan-enrollment"
                value={newPlan.enrollmentPeriod}
                onChange={(e) => setNewPlan({...newPlan, enrollmentPeriod: e.target.value})}
                placeholder="Enter enrollment period"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewPlanDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePlan}>Create Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
