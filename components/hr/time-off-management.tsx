"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Check, Eye, MoreHorizontal, Plus, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useStaff } from "@/lib/use-staff-data"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

// Mock time off data
const mockTimeOffRequests = [
  {
    id: "TO-001",
    staffId: "1",
    staffName: "Emma Johnson",
    type: "Vacation",
    startDate: "2025-05-10",
    endDate: "2025-05-17",
    totalDays: 8,
    status: "Pending",
    notes: "Annual family vacation",
    submittedDate: "2025-04-01",
  },
  {
    id: "TO-002",
    staffId: "3",
    staffName: "Sophia Rodriguez",
    type: "Sick Leave",
    startDate: "2025-04-15",
    endDate: "2025-04-16",
    totalDays: 2,
    status: "Approved",
    notes: "Doctor's appointment",
    submittedDate: "2025-04-10",
  },
  {
    id: "TO-003",
    staffId: "2",
    staffName: "Michael Chen",
    type: "Personal",
    startDate: "2025-04-20",
    endDate: "2025-04-20",
    totalDays: 1,
    status: "Approved",
    notes: "Family event",
    submittedDate: "2025-04-05",
  },
  {
    id: "TO-004",
    staffId: "5",
    staffName: "Jessica Lee",
    type: "Vacation",
    startDate: "2025-06-01",
    endDate: "2025-06-07",
    totalDays: 7,
    status: "Pending",
    notes: "Summer vacation",
    submittedDate: "2025-04-02",
  },
  {
    id: "TO-005",
    staffId: "4",
    staffName: "David Kim",
    type: "Sick Leave",
    startDate: "2025-04-08",
    endDate: "2025-04-09",
    totalDays: 2,
    status: "Completed",
    notes: "Flu",
    submittedDate: "2025-04-07",
  },
]

export function TimeOffManagement() {
  const { toast } = useToast()
  const { staff: realStaff } = useStaff()
  const [timeOffRequests, setTimeOffRequests] = useState(mockTimeOffRequests)
  const [isNewRequestDialogOpen, setIsNewRequestDialogOpen] = useState(false)
  const [isViewRequestDialogOpen, setIsViewRequestDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [newRequest, setNewRequest] = useState({
    staffId: "",
    type: "Vacation",
    startDate: new Date(),
    endDate: new Date(),
    notes: "",
  })

  const handleCreateRequest = () => {
    const staff = realStaff.find(s => s.id === newRequest.staffId)
    if (!staff) return

    const startDateStr = format(newRequest.startDate, "yyyy-MM-dd")
    const endDateStr = format(newRequest.endDate, "yyyy-MM-dd")
    
    // Calculate days between dates
    const diffTime = Math.abs(newRequest.endDate.getTime() - newRequest.startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    const newTimeOffRequest = {
      id: `TO-${timeOffRequests.length + 1}`.padStart(6, '0'),
      staffId: newRequest.staffId,
      staffName: staff.name,
      type: newRequest.type,
      startDate: startDateStr,
      endDate: endDateStr,
      totalDays: diffDays,
      status: "Pending",
      notes: newRequest.notes,
      submittedDate: format(new Date(), "yyyy-MM-dd"),
    }

    setTimeOffRequests([...timeOffRequests, newTimeOffRequest])
    setIsNewRequestDialogOpen(false)
    
    toast({
      title: "Time off request created",
      description: `Request for ${staff.name} has been submitted for approval.`,
    })
  }

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request)
    setIsViewRequestDialogOpen(true)
  }

  const handleApproveRequest = (id: string) => {
    setTimeOffRequests(
      timeOffRequests.map(request => 
        request.id === id ? { ...request, status: "Approved" } : request
      )
    )
    
    setIsViewRequestDialogOpen(false)
    
    toast({
      title: "Request approved",
      description: "The time off request has been approved.",
    })
  }

  const handleDenyRequest = (id: string) => {
    setTimeOffRequests(
      timeOffRequests.map(request => 
        request.id === id ? { ...request, status: "Denied" } : request
      )
    )
    
    setIsViewRequestDialogOpen(false)
    
    toast({
      title: "Request denied",
      description: "The time off request has been denied.",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Time Off Management</h3>
        <Button onClick={() => setIsNewRequestDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Time Off Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Total Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeOffRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.staffName}</TableCell>
                    <TableCell>{request.type}</TableCell>
                    <TableCell>{format(new Date(request.startDate), "MMM d, yyyy")}</TableCell>
                    <TableCell>{format(new Date(request.endDate), "MMM d, yyyy")}</TableCell>
                    <TableCell>{request.totalDays}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          request.status === "Approved" ? "success" : 
                          request.status === "Denied" ? "destructive" : 
                          request.status === "Completed" ? "outline" : 
                          "secondary"
                        }
                      >
                        {request.status}
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
                          <DropdownMenuItem onClick={() => handleViewRequest(request)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View details
                          </DropdownMenuItem>
                          {request.status === "Pending" && (
                            <>
                              <DropdownMenuItem onClick={() => handleApproveRequest(request.id)}>
                                <Check className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDenyRequest(request.id)}>
                                <X className="mr-2 h-4 w-4" />
                                Deny
                              </DropdownMenuItem>
                            </>
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

      {/* New Request Dialog */}
      <Dialog open={isNewRequestDialogOpen} onOpenChange={setIsNewRequestDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Time Off Request</DialogTitle>
            <DialogDescription>
              Submit a new time off request for staff member.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="staff">Staff Member</Label>
              <Select 
                value={newRequest.staffId} 
                onValueChange={(value) => setNewRequest({...newRequest, staffId: value})}
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
              <Label htmlFor="type">Time Off Type</Label>
              <Select 
                value={newRequest.type} 
                onValueChange={(value) => setNewRequest({...newRequest, type: value})}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vacation">Vacation</SelectItem>
                  <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Bereavement">Bereavement</SelectItem>
                  <SelectItem value="Jury Duty">Jury Duty</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
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
                        !newRequest.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newRequest.startDate ? format(newRequest.startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newRequest.startDate}
                      onSelect={(date) => date && setNewRequest({...newRequest, startDate: date})}
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
                        !newRequest.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newRequest.endDate ? format(newRequest.endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newRequest.endDate}
                      onSelect={(date) => date && setNewRequest({...newRequest, endDate: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newRequest.notes}
                onChange={(e) => setNewRequest({...newRequest, notes: e.target.value})}
                placeholder="Add any additional notes here..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewRequestDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRequest}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Request Dialog */}
      {selectedRequest && (
        <Dialog open={isViewRequestDialogOpen} onOpenChange={setIsViewRequestDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Time Off Request Details</DialogTitle>
              <DialogDescription>
                Request #{selectedRequest.id} submitted on {format(new Date(selectedRequest.submittedDate), "MMM d, yyyy")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Staff</Label>
                  <p className="font-medium">{selectedRequest.staffName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="font-medium">{selectedRequest.type}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Start Date</Label>
                  <p className="font-medium">{format(new Date(selectedRequest.startDate), "MMM d, yyyy")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">End Date</Label>
                  <p className="font-medium">{format(new Date(selectedRequest.endDate), "MMM d, yyyy")}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Total Days</Label>
                <p className="font-medium">{selectedRequest.totalDays}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <p>
                  <Badge 
                    variant={
                      selectedRequest.status === "Approved" ? "success" : 
                      selectedRequest.status === "Denied" ? "destructive" : 
                      selectedRequest.status === "Completed" ? "outline" : 
                      "secondary"
                    }
                  >
                    {selectedRequest.status}
                  </Badge>
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Notes</Label>
                <p>{selectedRequest.notes || "No notes provided"}</p>
              </div>
            </div>
            <DialogFooter>
              {selectedRequest.status === "Pending" && (
                <>
                  <Button variant="outline" onClick={() => handleDenyRequest(selectedRequest.id)}>
                    <X className="mr-2 h-4 w-4" />
                    Deny
                  </Button>
                  <Button onClick={() => handleApproveRequest(selectedRequest.id)}>
                    <Check className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </>
              )}
              {selectedRequest.status !== "Pending" && (
                <Button onClick={() => setIsViewRequestDialogOpen(false)}>
                  Close
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
