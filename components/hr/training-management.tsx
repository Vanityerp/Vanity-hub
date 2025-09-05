"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Eye, MoreHorizontal, Plus } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useStaff } from "@/lib/staff-provider"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

// Mock training courses
const mockTrainingCourses = [
  {
    id: "TC-001",
    name: "Advanced Color Techniques",
    category: "Technical Skills",
    description: "Learn the latest color techniques including balayage, ombre, and color correction.",
    duration: 16, // hours
    provider: "Beauty Academy Pro",
    cost: 450,
    required: ["stylist", "colorist"],
    status: "Active",
  },
  {
    id: "TC-002",
    name: "Customer Service Excellence",
    category: "Soft Skills",
    description: "Enhance your customer service skills to provide exceptional client experiences.",
    duration: 8, // hours
    provider: "Salon Business Institute",
    cost: 250,
    required: ["stylist", "colorist", "nail_technician", "esthetician", "barber"],
    status: "Active",
  },
  {
    id: "TC-003",
    name: "Salon Sanitation and Safety",
    category: "Compliance",
    description: "Learn proper sanitation procedures and safety protocols for salon environments.",
    duration: 4, // hours
    provider: "Health & Safety Training Co.",
    cost: 150,
    required: ["stylist", "colorist", "nail_technician", "esthetician", "barber"],
    status: "Active",
  },
  {
    id: "TC-004",
    name: "Advanced Nail Art Techniques",
    category: "Technical Skills",
    description: "Master advanced nail art techniques including 3D designs, gel art, and more.",
    duration: 12, // hours
    provider: "Nail Artistry Institute",
    cost: 350,
    required: ["nail_technician"],
    status: "Active",
  },
  {
    id: "TC-005",
    name: "Men's Grooming and Barbering",
    category: "Technical Skills",
    description: "Learn modern barbering techniques, beard styling, and men's grooming trends.",
    duration: 10, // hours
    provider: "Modern Barber Academy",
    cost: 300,
    required: ["barber", "stylist"],
    status: "Active",
  },
]

// Training enrollments using real staff IDs
const mockTrainingEnrollments = [
  {
    id: "TE-001",
    staffId: "staff-real-1",
    staffName: "Mekdes Abebe",
    courseId: "TC-001",
    courseName: "Advanced Color Techniques",
    startDate: "2025-05-15",
    endDate: "2025-05-16",
    status: "Scheduled",
    completionDate: null,
    score: null,
    certificate: null,
  },
  {
    id: "TE-002",
    staffId: "staff-real-2",
    staffName: "Woyni Tade",
    courseId: "TC-001",
    courseName: "Advanced Color Techniques",
    startDate: "2025-05-15",
    endDate: "2025-05-16",
    status: "Scheduled",
    completionDate: null,
    score: null,
    certificate: null,
  },
  {
    id: "TE-003",
    staffId: "staff-real-1",
    staffName: "Mekdes Abebe",
    courseId: "TC-002",
    courseName: "Customer Service Excellence",
    startDate: "2025-03-10",
    endDate: "2025-03-10",
    status: "Completed",
    completionDate: "2025-03-10",
    score: 95,
    certificate: "CSE-MA-2025",
  },
  {
    id: "TE-004",
    staffId: "staff-real-3",
    staffName: "Maria Santos",
    courseId: "TC-004",
    courseName: "Advanced Nail Art Techniques",
    startDate: "2025-06-01",
    endDate: "2025-06-03",
    status: "Scheduled",
    completionDate: null,
    score: null,
    certificate: null,
  },
  {
    id: "TE-005",
    staffId: "staff-real-7",
    staffName: "Aster Bekele",
    courseId: "TC-005",
    courseName: "Men's Grooming and Barbering",
    startDate: "2025-04-01",
    endDate: "2025-04-02",
    status: "Completed",
    completionDate: "2025-04-02",
    score: 88,
    certificate: "MGB-AB-2025",
  },
]

export function TrainingManagement() {
  const { toast } = useToast()
  const { staff } = useStaff()
  const [trainingCourses, setTrainingCourses] = useState(mockTrainingCourses)
  const [trainingEnrollments, setTrainingEnrollments] = useState(mockTrainingEnrollments)
  const [isNewEnrollmentDialogOpen, setIsNewEnrollmentDialogOpen] = useState(false)
  const [isViewEnrollmentDialogOpen, setIsViewEnrollmentDialogOpen] = useState(false)
  const [isNewCourseDialogOpen, setIsNewCourseDialogOpen] = useState(false)
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null)
  const [newEnrollment, setNewEnrollment] = useState({
    staffId: "",
    courseId: "",
    startDate: new Date(),
    endDate: new Date(),
  })
  const [newCourse, setNewCourse] = useState({
    name: "",
    category: "Technical Skills",
    description: "",
    duration: 8,
    provider: "",
    cost: 0,
    required: [] as string[],
  })

  const handleCreateEnrollment = () => {
    const selectedStaff = staff.find(s => s.id === newEnrollment.staffId)
    const course = trainingCourses.find(c => c.id === newEnrollment.courseId)

    if (!selectedStaff || !course) return

    // Check if staff is already enrolled in this course
    const existingEnrollment = trainingEnrollments.find(
      e => e.staffId === newEnrollment.staffId && e.courseId === newEnrollment.courseId && e.status !== "Completed"
    )

    if (existingEnrollment) {
      toast({
        title: "Enrollment failed",
        description: `${selectedStaff.name} is already enrolled in ${course.name}.`,
        variant: "destructive",
      })
      return
    }

    const startDateStr = format(newEnrollment.startDate, "yyyy-MM-dd")
    const endDateStr = format(newEnrollment.endDate, "yyyy-MM-dd")

    const newEnrollmentEntry = {
      id: `TE-${trainingEnrollments.length + 1}`.padStart(6, '0'),
      staffId: newEnrollment.staffId,
      staffName: selectedStaff.name,
      courseId: newEnrollment.courseId,
      courseName: course.name,
      startDate: startDateStr,
      endDate: endDateStr,
      status: "Scheduled",
      completionDate: null,
      score: null,
      certificate: null,
    }

    setTrainingEnrollments([...trainingEnrollments, newEnrollmentEntry])
    setIsNewEnrollmentDialogOpen(false)
    
    toast({
      title: "Enrollment created",
      description: `${selectedStaff.name} has been enrolled in ${course.name}.`,
    })
  }

  const handleCreateCourse = () => {
    const newCourseEntry = {
      id: `TC-${trainingCourses.length + 1}`.padStart(6, '0'),
      name: newCourse.name,
      category: newCourse.category,
      description: newCourse.description,
      duration: newCourse.duration,
      provider: newCourse.provider,
      cost: newCourse.cost,
      required: newCourse.required,
      status: "Active",
    }

    setTrainingCourses([...trainingCourses, newCourseEntry])
    setIsNewCourseDialogOpen(false)
    
    toast({
      title: "Course created",
      description: `${newCourse.name} has been added to available training courses.`,
    })
  }

  const handleViewEnrollment = (enrollment: any) => {
    setSelectedEnrollment(enrollment)
    setIsViewEnrollmentDialogOpen(true)
  }

  const handleCompleteTraining = (id: string, score: number) => {
    setTrainingEnrollments(
      trainingEnrollments.map(enrollment => {
        if (enrollment.id === id) {
          const selectedStaff = staff.find(s => s.id === enrollment.staffId)
          const course = trainingCourses.find(c => c.id === enrollment.courseId)
          const certificateId = `${course?.name.substring(0, 3).toUpperCase()}-${selectedStaff?.name.split(' ').map(n => n[0]).join('')}-2025`
          
          return {
            ...enrollment,
            status: "Completed",
            completionDate: new Date().toISOString().split('T')[0],
            score,
            certificate: certificateId,
          }
        }
        return enrollment
      })
    )
    
    setIsViewEnrollmentDialogOpen(false)
    
    toast({
      title: "Training completed",
      description: "The training has been marked as completed.",
    })
  }

  // Calculate training compliance
  const getStaffTrainingCompliance = () => {
    const staffCompliance: Record<string, { required: number, completed: number }> = {}

    // Initialize staff compliance records
    staff.forEach(staffMember => {
      staffCompliance[staffMember.id] = { required: 0, completed: 0 }
    })

    // Count required courses for each staff member
    // Note: Since we don't have role information, we'll assume all courses are required for all staff
    trainingCourses.forEach(course => {
      staff.forEach(staffMember => {
        // For now, assume all courses are required for all staff members
        staffCompliance[staffMember.id].required += 1
      })
    })
    
    // Count completed courses
    trainingEnrollments
      .filter(enrollment => enrollment.status === "Completed")
      .forEach(enrollment => {
        // Only count if the staff member exists in current staff data
        if (staffCompliance[enrollment.staffId]) {
          staffCompliance[enrollment.staffId].completed += 1
        }
      })
    
    return staffCompliance
  }

  const staffCompliance = getStaffTrainingCompliance()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Training Management</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsNewCourseDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Course
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
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="enrollments">
          <Card>
            <CardHeader>
              <CardTitle>Training Enrollments</CardTitle>
              <CardDescription>
                View and manage staff training enrollments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trainingEnrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">{enrollment.staffName}</TableCell>
                        <TableCell>{enrollment.courseName}</TableCell>
                        <TableCell>{format(new Date(enrollment.startDate), "MMM d, yyyy")}</TableCell>
                        <TableCell>{format(new Date(enrollment.endDate), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              enrollment.status === "Completed" ? "success" : 
                              enrollment.status === "In Progress" ? "secondary" : 
                              "outline"
                            }
                          >
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
                              {enrollment.status !== "Completed" && (
                                <DropdownMenuItem onClick={() => handleViewEnrollment(enrollment)}>
                                  Mark as completed
                                </DropdownMenuItem>
                              )}
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

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Available Training Courses</CardTitle>
              <CardDescription>
                View and manage training courses offered to staff
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Duration (hrs)</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead>Required For</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trainingCourses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.name}</TableCell>
                        <TableCell>{course.category}</TableCell>
                        <TableCell>{course.provider}</TableCell>
                        <TableCell>{course.duration}</TableCell>
                        <TableCell className="text-right">${course.cost.toFixed(2)}</TableCell>
                        <TableCell>
                          {course.required.map(role => (
                            <Badge key={role} variant="outline" className="mr-1">
                              {role.replace('_', ' ')}
                            </Badge>
                          ))}
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
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuItem>Edit course</DropdownMenuItem>
                              <DropdownMenuItem>Manage enrollments</DropdownMenuItem>
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

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Training Compliance</CardTitle>
              <CardDescription>
                Track staff training compliance and requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Required Courses</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Compliance</TableHead>
                      <TableHead>Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((staffMember) => {
                      const compliance = staffCompliance[staffMember.id] || { required: 0, completed: 0 }
                      const percentage = compliance.required > 0
                        ? Math.round((compliance.completed / compliance.required) * 100)
                        : 100

                      return (
                        <TableRow key={staffMember.id}>
                          <TableCell className="font-medium">{staffMember.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              Staff Member
                            </Badge>
                          </TableCell>
                          <TableCell>{compliance.required}</TableCell>
                          <TableCell>{compliance.completed}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                percentage === 100 ? "success" : 
                                percentage >= 75 ? "secondary" : 
                                percentage >= 50 ? "outline" : 
                                "destructive"
                              }
                            >
                              {percentage}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Progress value={percentage} className="h-2" />
                          </TableCell>
                        </TableRow>
                      )
                    })}
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
              Enroll a staff member in a training course.
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
                  {staff.map((staffMember) => (
                    <SelectItem key={staffMember.id} value={staffMember.id}>
                      {staffMember.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="course">Training Course</Label>
              <Select 
                value={newEnrollment.courseId} 
                onValueChange={(value) => setNewEnrollment({...newEnrollment, courseId: value})}
              >
                <SelectTrigger id="course">
                  <SelectValue placeholder="Select training course" />
                </SelectTrigger>
                <SelectContent>
                  {trainingCourses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name} ({course.duration} hrs)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="startDate"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newEnrollment.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newEnrollment.startDate ? format(newEnrollment.startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newEnrollment.startDate}
                      onSelect={(date) => date && setNewEnrollment({...newEnrollment, startDate: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="endDate"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newEnrollment.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newEnrollment.endDate ? format(newEnrollment.endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newEnrollment.endDate}
                      onSelect={(date) => date && setNewEnrollment({...newEnrollment, endDate: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
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
                Training enrollment #{selectedEnrollment.id}
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
                    <Badge 
                      variant={
                        selectedEnrollment.status === "Completed" ? "success" : 
                        selectedEnrollment.status === "In Progress" ? "secondary" : 
                        "outline"
                      }
                    >
                      {selectedEnrollment.status}
                    </Badge>
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Course</Label>
                <p className="font-medium">{selectedEnrollment.courseName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Start Date</Label>
                  <p>{format(new Date(selectedEnrollment.startDate), "MMM d, yyyy")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">End Date</Label>
                  <p>{format(new Date(selectedEnrollment.endDate), "MMM d, yyyy")}</p>
                </div>
              </div>
              
              {selectedEnrollment.status === "Completed" ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Completion Date</Label>
                      <p>{format(new Date(selectedEnrollment.completionDate), "MMM d, yyyy")}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Score</Label>
                      <p className="font-medium">{selectedEnrollment.score}%</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Certificate ID</Label>
                    <p>{selectedEnrollment.certificate}</p>
                  </div>
                </>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="score">Completion Score</Label>
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Enter score (0-100)"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              {selectedEnrollment.status !== "Completed" && (
                <Button onClick={() => handleCompleteTraining(selectedEnrollment.id, 90)}>
                  Mark as Completed
                </Button>
              )}
              <Button variant="outline" onClick={() => setIsViewEnrollmentDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
