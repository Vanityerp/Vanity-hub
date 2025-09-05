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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { CalendarIcon, Check, Eye, MoreHorizontal, Plus } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useStaff } from "@/lib/use-staff-data"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"

// Mock onboarding tasks
const mockOnboardingTasks = [
  { id: "OT-001", name: "Complete employment paperwork", category: "Administrative", required: true },
  { id: "OT-002", name: "Set up payroll and benefits", category: "Administrative", required: true },
  { id: "OT-003", name: "Provide employee handbook", category: "Administrative", required: true },
  { id: "OT-004", name: "Assign locker/storage space", category: "Facilities", required: true },
  { id: "OT-005", name: "Tour of facility", category: "Orientation", required: true },
  { id: "OT-006", name: "Introduction to team members", category: "Orientation", required: true },
  { id: "OT-007", name: "Review salon policies and procedures", category: "Training", required: true },
  { id: "OT-008", name: "Training on booking system", category: "Training", required: true },
  { id: "OT-009", name: "Training on POS system", category: "Training", required: true },
  { id: "OT-010", name: "Set up email and system accounts", category: "IT", required: true },
  { id: "OT-011", name: "Order business cards", category: "Administrative", required: false },
  { id: "OT-012", name: "Add to staff directory and website", category: "Marketing", required: true },
]

// Mock offboarding tasks
const mockOffboardingTasks = [
  { id: "OF-001", name: "Exit interview", category: "Administrative", required: true },
  { id: "OF-002", name: "Return salon equipment and keys", category: "Administrative", required: true },
  { id: "OF-003", name: "Disable system access", category: "IT", required: true },
  { id: "OF-004", name: "Process final paycheck", category: "Administrative", required: true },
  { id: "OF-005", name: "Provide benefits information", category: "Administrative", required: true },
  { id: "OF-006", name: "Remove from staff directory and website", category: "Marketing", required: true },
  { id: "OF-007", name: "Collect feedback", category: "Administrative", required: true },
  { id: "OF-008", name: "Notify clients of departure", category: "Client Relations", required: true },
]

// Mock onboarding/offboarding processes
const mockProcesses = [
  {
    id: "OP-001",
    staffId: "7",
    staffName: "Olivia Wilson",
    type: "Onboarding",
    startDate: "2025-03-15",
    targetCompletionDate: "2025-03-22",
    status: "In Progress",
    progress: 75,
    tasks: [
      { taskId: "OT-001", completed: true, completedDate: "2025-03-15", notes: "All paperwork completed and filed" },
      { taskId: "OT-002", completed: true, completedDate: "2025-03-15", notes: "Set up in payroll system" },
      { taskId: "OT-003", completed: true, completedDate: "2025-03-15", notes: "Handbook provided and acknowledged" },
      { taskId: "OT-004", completed: true, completedDate: "2025-03-15", notes: "Assigned locker #12" },
      { taskId: "OT-005", completed: true, completedDate: "2025-03-15", notes: "Completed facility tour" },
      { taskId: "OT-006", completed: true, completedDate: "2025-03-15", notes: "Introduced to all team members" },
      { taskId: "OT-007", completed: true, completedDate: "2025-03-16", notes: "Reviewed all policies" },
      { taskId: "OT-008", completed: true, completedDate: "2025-03-16", notes: "Completed booking system training" },
      { taskId: "OT-009", completed: true, completedDate: "2025-03-16", notes: "Completed POS training" },
      { taskId: "OT-010", completed: false, completedDate: null, notes: "" },
      { taskId: "OT-011", completed: false, completedDate: null, notes: "" },
      { taskId: "OT-012", completed: false, completedDate: null, notes: "" },
    ]
  },
  {
    id: "OP-002",
    staffId: "5",
    staffName: "Jessica Lee",
    type: "Offboarding",
    startDate: "2025-04-01",
    targetCompletionDate: "2025-04-15",
    status: "Scheduled",
    progress: 0,
    tasks: [
      { taskId: "OF-001", completed: false, completedDate: null, notes: "" },
      { taskId: "OF-002", completed: false, completedDate: null, notes: "" },
      { taskId: "OF-003", completed: false, completedDate: null, notes: "" },
      { taskId: "OF-004", completed: false, completedDate: null, notes: "" },
      { taskId: "OF-005", completed: false, completedDate: null, notes: "" },
      { taskId: "OF-006", completed: false, completedDate: null, notes: "" },
      { taskId: "OF-007", completed: false, completedDate: null, notes: "" },
      { taskId: "OF-008", completed: false, completedDate: null, notes: "" },
    ]
  },
  {
    id: "OP-003",
    staffId: "9",
    staffName: "Ava Thompson",
    type: "Onboarding",
    startDate: "2025-02-01",
    targetCompletionDate: "2025-02-08",
    status: "Completed",
    progress: 100,
    completionDate: "2025-02-07",
    tasks: mockOnboardingTasks.map(task => ({
      taskId: task.id,
      completed: true,
      completedDate: "2025-02-07",
      notes: "Completed successfully"
    }))
  }
]

export function OnboardingOffboarding() {
  const { toast } = useToast()
  const { staff: realStaff } = useStaff()
  const [processes, setProcesses] = useState(mockProcesses)
  const [onboardingTasks, setOnboardingTasks] = useState(mockOnboardingTasks)
  const [offboardingTasks, setOffboardingTasks] = useState(mockOffboardingTasks)
  const [isNewProcessDialogOpen, setIsNewProcessDialogOpen] = useState(false)
  const [isViewProcessDialogOpen, setIsViewProcessDialogOpen] = useState(false)
  const [selectedProcess, setSelectedProcess] = useState<any>(null)
  const [newProcess, setNewProcess] = useState({
    staffId: "",
    type: "Onboarding",
    startDate: new Date(),
    targetCompletionDate: new Date(new Date().setDate(new Date().getDate() + 7)),
  })

  const handleCreateProcess = () => {
    const staff = realStaff.find(s => s.id === newProcess.staffId)
    if (!staff) return

    // Check if staff already has an active process
    const existingProcess = processes.find(
      p => p.staffId === newProcess.staffId && p.status !== "Completed"
    )

    if (existingProcess) {
      toast({
        title: "Process creation failed",
        description: `${staff.name} already has an active ${existingProcess.type} process.`,
        variant: "destructive",
      })
      return
    }

    const startDateStr = format(newProcess.startDate, "yyyy-MM-dd")
    const targetCompletionDateStr = format(newProcess.targetCompletionDate, "yyyy-MM-dd")
    
    // Select tasks based on process type
    const tasks = newProcess.type === "Onboarding" 
      ? onboardingTasks.map(task => ({
          taskId: task.id,
          completed: false,
          completedDate: null,
          notes: ""
        }))
      : offboardingTasks.map(task => ({
          taskId: task.id,
          completed: false,
          completedDate: null,
          notes: ""
        }))

    const newProcessEntry = {
      id: `OP-${processes.length + 1}`.padStart(6, '0'),
      staffId: newProcess.staffId,
      staffName: staff.name,
      type: newProcess.type,
      startDate: startDateStr,
      targetCompletionDate: targetCompletionDateStr,
      status: "Scheduled",
      progress: 0,
      tasks
    }

    setProcesses([...processes, newProcessEntry])
    setIsNewProcessDialogOpen(false)
    
    toast({
      title: "Process created",
      description: `${newProcess.type} process for ${staff.name} has been created.`,
    })
  }

  const handleViewProcess = (process: any) => {
    setSelectedProcess(process)
    setIsViewProcessDialogOpen(true)
  }

  const handleUpdateTaskStatus = (processId: string, taskId: string, completed: boolean, notes: string) => {
    setProcesses(
      processes.map(process => {
        if (process.id === processId) {
          const updatedTasks = process.tasks.map(task => {
            if (task.taskId === taskId) {
              return {
                ...task,
                completed,
                completedDate: completed ? format(new Date(), "yyyy-MM-dd") : null,
                notes: notes || task.notes
              }
            }
            return task
          })
          
          // Calculate new progress
          const completedTasksCount = updatedTasks.filter(t => t.completed).length
          const progress = Math.round((completedTasksCount / updatedTasks.length) * 100)
          
          // Update status if all tasks are completed
          const status = progress === 100 ? "Completed" : process.status === "Scheduled" ? "In Progress" : process.status
          
          return {
            ...process,
            tasks: updatedTasks,
            progress,
            status,
            ...(progress === 100 ? { completionDate: format(new Date(), "yyyy-MM-dd") } : {})
          }
        }
        return process
      })
    )
    
    toast({
      title: "Task updated",
      description: `Task has been ${completed ? "completed" : "marked as incomplete"}.`,
    })
  }

  // Get tasks by ID
  const getTaskById = (taskId: string) => {
    return [...onboardingTasks, ...offboardingTasks].find(task => task.id === taskId)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Onboarding & Offboarding</h3>
        <Button onClick={() => setIsNewProcessDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Process
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Processes</CardTitle>
          <CardDescription>
            Manage onboarding and offboarding processes for staff members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Process Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Target Completion</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processes.map((process) => (
                  <TableRow key={process.id}>
                    <TableCell className="font-medium">{process.staffName}</TableCell>
                    <TableCell>{process.type}</TableCell>
                    <TableCell>{format(new Date(process.startDate), "MMM d, yyyy")}</TableCell>
                    <TableCell>{format(new Date(process.targetCompletionDate), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={process.progress} className="h-2 w-[60px]" />
                        <span className="text-xs">{process.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          process.status === "Completed" ? "success" : 
                          process.status === "In Progress" ? "secondary" : 
                          "outline"
                        }
                      >
                        {process.status}
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
                          <DropdownMenuItem onClick={() => handleViewProcess(process)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View details
                          </DropdownMenuItem>
                          {process.status !== "Completed" && (
                            <DropdownMenuItem onClick={() => handleViewProcess(process)}>
                              Update tasks
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

      {/* New Process Dialog */}
      <Dialog open={isNewProcessDialogOpen} onOpenChange={setIsNewProcessDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Process</DialogTitle>
            <DialogDescription>
              Start an onboarding or offboarding process for a staff member.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="staff">Staff Member</Label>
              <Select 
                value={newProcess.staffId} 
                onValueChange={(value) => setNewProcess({...newProcess, staffId: value})}
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
              <Label htmlFor="type">Process Type</Label>
              <Select 
                value={newProcess.type} 
                onValueChange={(value) => setNewProcess({...newProcess, type: value as "Onboarding" | "Offboarding"})}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select process type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Onboarding">Onboarding</SelectItem>
                  <SelectItem value="Offboarding">Offboarding</SelectItem>
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
                        !newProcess.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newProcess.startDate ? format(newProcess.startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newProcess.startDate}
                      onSelect={(date) => date && setNewProcess({...newProcess, startDate: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="targetCompletionDate">Target Completion</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="targetCompletionDate"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newProcess.targetCompletionDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newProcess.targetCompletionDate ? format(newProcess.targetCompletionDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newProcess.targetCompletionDate}
                      onSelect={(date) => date && setNewProcess({...newProcess, targetCompletionDate: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewProcessDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProcess}>Create Process</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Process Dialog */}
      {selectedProcess && (
        <Dialog open={isViewProcessDialogOpen} onOpenChange={setIsViewProcessDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedProcess.type} Process</DialogTitle>
              <DialogDescription>
                {selectedProcess.type} process for {selectedProcess.staffName} - {selectedProcess.progress}% complete
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Start Date</Label>
                  <p>{format(new Date(selectedProcess.startDate), "MMM d, yyyy")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Target Completion</Label>
                  <p>{format(new Date(selectedProcess.targetCompletionDate), "MMM d, yyyy")}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p>
                    <Badge 
                      variant={
                        selectedProcess.status === "Completed" ? "success" : 
                        selectedProcess.status === "In Progress" ? "secondary" : 
                        "outline"
                      }
                    >
                      {selectedProcess.status}
                    </Badge>
                  </p>
                </div>
                {selectedProcess.status === "Completed" && (
                  <div>
                    <Label className="text-muted-foreground">Completion Date</Label>
                    <p>{format(new Date(selectedProcess.completionDate), "MMM d, yyyy")}</p>
                  </div>
                )}
              </div>
              
              <div>
                <Label className="text-muted-foreground mb-2 block">Tasks</Label>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {selectedProcess.tasks.map((task: any) => {
                    const taskDetails = getTaskById(task.taskId)
                    return (
                      <div key={task.taskId} className="flex items-start gap-2 pb-2 border-b">
                        <Checkbox 
                          id={`task-${task.taskId}`}
                          checked={task.completed}
                          onCheckedChange={(checked) => {
                            if (selectedProcess.status !== "Completed") {
                              handleUpdateTaskStatus(
                                selectedProcess.id, 
                                task.taskId, 
                                checked as boolean, 
                                task.notes
                              )
                            }
                          }}
                          disabled={selectedProcess.status === "Completed"}
                        />
                        <div className="grid gap-1.5 w-full">
                          <div className="flex items-center justify-between">
                            <Label 
                              htmlFor={`task-${task.taskId}`}
                              className={cn(
                                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                                task.completed && "line-through"
                              )}
                            >
                              {taskDetails?.name}
                            </Label>
                            {taskDetails?.required && (
                              <Badge variant="outline" className="text-xs">Required</Badge>
                            )}
                          </div>
                          {task.completed && (
                            <p className="text-xs text-muted-foreground">
                              Completed on {format(new Date(task.completedDate), "MMM d, yyyy")}
                            </p>
                          )}
                          {selectedProcess.status !== "Completed" && (
                            <Input
                              id={`notes-${task.taskId}`}
                              placeholder="Add notes..."
                              value={task.notes}
                              onChange={(e) => {
                                const updatedProcesses = processes.map(process => {
                                  if (process.id === selectedProcess.id) {
                                    const updatedTasks = process.tasks.map(t => {
                                      if (t.taskId === task.taskId) {
                                        return { ...t, notes: e.target.value }
                                      }
                                      return t
                                    })
                                    return { ...process, tasks: updatedTasks }
                                  }
                                  return process
                                })
                                setProcesses(updatedProcesses)
                                setSelectedProcess({
                                  ...selectedProcess,
                                  tasks: selectedProcess.tasks.map((t: any) => 
                                    t.taskId === task.taskId ? { ...t, notes: e.target.value } : t
                                  )
                                })
                              }}
                              className="h-8 mt-1"
                            />
                          )}
                          {selectedProcess.status === "Completed" && task.notes && (
                            <p className="text-xs">{task.notes}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsViewProcessDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
