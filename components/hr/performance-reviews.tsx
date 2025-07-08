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
import { Slider } from "@/components/ui/slider"

// Performance review data using real staff IDs
const mockPerformanceReviews = [
  {
    id: "PR-001",
    staffId: "staff-real-1",
    staffName: "Mekdes Abebe",
    reviewerId: "staff-real-7",
    reviewerName: "Aster Bekele",
    reviewDate: "2025-03-15",
    reviewType: "Annual",
    status: "Completed",
    overallRating: 4.5,
    ratings: {
      technicalSkills: 5,
      customerService: 4.5,
      teamwork: 4,
      reliability: 4.5,
      productivity: 4.5,
    },
    strengths: "Excellent technical skills and customer service. Clients consistently request her by name.",
    areasForImprovement: "Could improve on team collaboration and knowledge sharing with junior staff.",
    goals: "1. Attend advanced color technique workshop\n2. Mentor one junior stylist\n3. Increase retail sales by 10%",
    comments: "Mekdes has been a valuable team member and continues to grow professionally.",
  },
  {
    id: "PR-002",
    staffId: "staff-real-2",
    staffName: "Woyni Tade",
    reviewerId: "staff-real-7",
    reviewerName: "Aster Bekele",
    reviewDate: "2025-03-10",
    reviewType: "Annual",
    status: "Completed",
    overallRating: 4.2,
    ratings: {
      technicalSkills: 5,
      customerService: 4,
      teamwork: 4.5,
      reliability: 4,
      productivity: 3.5,
    },
    strengths: "Outstanding styling technique and attention to detail. Great team player.",
    areasForImprovement: "Time management could be improved to increase productivity.",
    goals: "1. Improve time management\n2. Increase client retention rate\n3. Develop social media content for salon",
    comments: "Woyni is a talented stylist with great potential for growth.",
  },
  {
    id: "PR-003",
    staffId: "staff-real-3",
    staffName: "Maria Santos",
    reviewerId: "staff-real-7",
    reviewerName: "Aster Bekele",
    reviewDate: "2025-03-05",
    reviewType: "Annual",
    status: "Completed",
    overallRating: 4.8,
    ratings: {
      technicalSkills: 5,
      customerService: 5,
      teamwork: 4.5,
      reliability: 5,
      productivity: 4.5,
    },
    strengths: "Exceptional nail art skills and customer service. Highly reliable and punctual.",
    areasForImprovement: "Could take more initiative in team projects and salon events.",
    goals: "1. Learn new nail art techniques\n2. Increase service upgrades\n3. Participate in nail competition",
    comments: "Maria is one of our top performers and a valuable asset to the team.",
  },
  {
    id: "PR-004",
    staffId: "staff-real-4",
    staffName: "Fatima Al-Zahra",
    reviewerId: "staff-real-7",
    reviewerName: "Aster Bekele",
    reviewDate: "2025-04-01",
    reviewType: "Quarterly",
    status: "Scheduled",
    overallRating: 0,
    ratings: {
      technicalSkills: 0,
      customerService: 0,
      teamwork: 0,
      reliability: 0,
      productivity: 0,
    },
    strengths: "",
    areasForImprovement: "",
    goals: "",
    comments: "",
  },
  {
    id: "PR-005",
    staffId: "staff-real-5",
    staffName: "Jane Mussa",
    reviewerId: "staff-real-7",
    reviewerName: "Aster Bekele",
    reviewDate: "2025-04-05",
    reviewType: "Quarterly",
    status: "Scheduled",
    overallRating: 0,
    ratings: {
      technicalSkills: 0,
      customerService: 0,
      teamwork: 0,
      reliability: 0,
      productivity: 0,
    },
    strengths: "",
    areasForImprovement: "",
    goals: "",
    comments: "",
  },
]

export function PerformanceReviews() {
  const { toast } = useToast()
  const { staff } = useStaff()
  const [performanceReviews, setPerformanceReviews] = useState(mockPerformanceReviews)
  const [isNewReviewDialogOpen, setIsNewReviewDialogOpen] = useState(false)
  const [isViewReviewDialogOpen, setIsViewReviewDialogOpen] = useState(false)
  const [isEditReviewDialogOpen, setIsEditReviewDialogOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<any>(null)
  const [newReview, setNewReview] = useState({
    staffId: "",
    reviewerId: "",
    reviewDate: new Date(),
    reviewType: "Quarterly",
    ratings: {
      technicalSkills: 0,
      customerService: 0,
      teamwork: 0,
      reliability: 0,
      productivity: 0,
    },
    strengths: "",
    areasForImprovement: "",
    goals: "",
    comments: "",
  })

  const handleCreateReview = () => {
    const selectedStaff = staff.find(s => s.id === newReview.staffId)
    const reviewer = staff.find(s => s.id === newReview.reviewerId)

    if (!selectedStaff || !reviewer) return

    // Calculate overall rating
    const ratings = newReview.ratings
    const overallRating = (
      ratings.technicalSkills + 
      ratings.customerService + 
      ratings.teamwork + 
      ratings.reliability + 
      ratings.productivity
    ) / 5

    const reviewDateStr = format(newReview.reviewDate, "yyyy-MM-dd")
    
    const newPerformanceReview = {
      id: `PR-${performanceReviews.length + 1}`.padStart(6, '0'),
      staffId: newReview.staffId,
      staffName: selectedStaff.name,
      reviewerId: newReview.reviewerId,
      reviewerName: reviewer.name,
      reviewDate: reviewDateStr,
      reviewType: newReview.reviewType,
      status: new Date(reviewDateStr) <= new Date() ? "Completed" : "Scheduled",
      overallRating: parseFloat(overallRating.toFixed(1)),
      ratings: newReview.ratings,
      strengths: newReview.strengths,
      areasForImprovement: newReview.areasForImprovement,
      goals: newReview.goals,
      comments: newReview.comments,
    }

    setPerformanceReviews([...performanceReviews, newPerformanceReview])
    setIsNewReviewDialogOpen(false)
    
    toast({
      title: "Performance review created",
      description: `Review for ${selectedStaff.name} has been ${newPerformanceReview.status === "Completed" ? "completed" : "scheduled"}.`,
    })
  }

  const handleViewReview = (review: any) => {
    setSelectedReview(review)
    setIsViewReviewDialogOpen(true)
  }

  const handleEditReview = (review: any) => {
    setSelectedReview(review)
    setIsEditReviewDialogOpen(true)
  }

  const handleUpdateReview = () => {
    if (!selectedReview) return

    setPerformanceReviews(
      performanceReviews.map(review => 
        review.id === selectedReview.id ? selectedReview : review
      )
    )
    
    setIsEditReviewDialogOpen(false)
    
    toast({
      title: "Review updated",
      description: `Performance review for ${selectedReview.staffName} has been updated.`,
    })
  }

  const getRatingColor = (rating: number) => {
    if (rating === 0) return "bg-gray-100 text-gray-800"
    if (rating < 3) return "bg-red-100 text-red-800"
    if (rating < 4) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Performance Reviews</h3>
        <Button onClick={() => setIsNewReviewDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Review
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Performance Reviews</CardTitle>
          <CardDescription>
            View and manage performance evaluations for your staff
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Overall Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performanceReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">{review.staffName}</TableCell>
                    <TableCell>{review.reviewerName}</TableCell>
                    <TableCell>{format(new Date(review.reviewDate), "MMM d, yyyy")}</TableCell>
                    <TableCell>{review.reviewType}</TableCell>
                    <TableCell>
                      {review.status === "Completed" ? (
                        <Badge className={getRatingColor(review.overallRating)}>
                          {review.overallRating.toFixed(1)}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          review.status === "Completed" ? "success" : 
                          review.status === "In Progress" ? "secondary" : 
                          "outline"
                        }
                      >
                        {review.status}
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
                          <DropdownMenuItem onClick={() => handleViewReview(review)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View details
                          </DropdownMenuItem>
                          {review.status !== "Completed" && (
                            <DropdownMenuItem onClick={() => handleEditReview(review)}>
                              Complete review
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

      {/* New Review Dialog */}
      <Dialog open={isNewReviewDialogOpen} onOpenChange={setIsNewReviewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Performance Review</DialogTitle>
            <DialogDescription>
              Schedule or complete a new performance review for a staff member.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="staff">Staff Member</Label>
                <Select 
                  value={newReview.staffId} 
                  onValueChange={(value) => setNewReview({...newReview, staffId: value})}
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
                <Label htmlFor="reviewer">Reviewer</Label>
                <Select 
                  value={newReview.reviewerId} 
                  onValueChange={(value) => setNewReview({...newReview, reviewerId: value})}
                >
                  <SelectTrigger id="reviewer">
                    <SelectValue placeholder="Select reviewer" />
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="reviewDate">Review Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="reviewDate"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newReview.reviewDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newReview.reviewDate ? format(newReview.reviewDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newReview.reviewDate}
                      onSelect={(date) => date && setNewReview({...newReview, reviewDate: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reviewType">Review Type</Label>
                <Select 
                  value={newReview.reviewType} 
                  onValueChange={(value) => setNewReview({...newReview, reviewType: value})}
                >
                  <SelectTrigger id="reviewType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Annual">Annual</SelectItem>
                    <SelectItem value="Probation">Probation</SelectItem>
                    <SelectItem value="Performance Improvement">Performance Improvement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Performance Ratings</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="technicalSkills">Technical Skills</Label>
                  <span className="text-sm">{newReview.ratings.technicalSkills.toFixed(1)}</span>
                </div>
                <Slider
                  id="technicalSkills"
                  min={0}
                  max={5}
                  step={0.5}
                  value={[newReview.ratings.technicalSkills]}
                  onValueChange={(value) => setNewReview({
                    ...newReview, 
                    ratings: {...newReview.ratings, technicalSkills: value[0]}
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="customerService">Customer Service</Label>
                  <span className="text-sm">{newReview.ratings.customerService.toFixed(1)}</span>
                </div>
                <Slider
                  id="customerService"
                  min={0}
                  max={5}
                  step={0.5}
                  value={[newReview.ratings.customerService]}
                  onValueChange={(value) => setNewReview({
                    ...newReview, 
                    ratings: {...newReview.ratings, customerService: value[0]}
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="teamwork">Teamwork</Label>
                  <span className="text-sm">{newReview.ratings.teamwork.toFixed(1)}</span>
                </div>
                <Slider
                  id="teamwork"
                  min={0}
                  max={5}
                  step={0.5}
                  value={[newReview.ratings.teamwork]}
                  onValueChange={(value) => setNewReview({
                    ...newReview, 
                    ratings: {...newReview.ratings, teamwork: value[0]}
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="reliability">Reliability</Label>
                  <span className="text-sm">{newReview.ratings.reliability.toFixed(1)}</span>
                </div>
                <Slider
                  id="reliability"
                  min={0}
                  max={5}
                  step={0.5}
                  value={[newReview.ratings.reliability]}
                  onValueChange={(value) => setNewReview({
                    ...newReview, 
                    ratings: {...newReview.ratings, reliability: value[0]}
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="productivity">Productivity</Label>
                  <span className="text-sm">{newReview.ratings.productivity.toFixed(1)}</span>
                </div>
                <Slider
                  id="productivity"
                  min={0}
                  max={5}
                  step={0.5}
                  value={[newReview.ratings.productivity]}
                  onValueChange={(value) => setNewReview({
                    ...newReview, 
                    ratings: {...newReview.ratings, productivity: value[0]}
                  })}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="strengths">Strengths</Label>
              <Textarea
                id="strengths"
                value={newReview.strengths}
                onChange={(e) => setNewReview({...newReview, strengths: e.target.value})}
                placeholder="List key strengths and accomplishments..."
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="areasForImprovement">Areas for Improvement</Label>
              <Textarea
                id="areasForImprovement"
                value={newReview.areasForImprovement}
                onChange={(e) => setNewReview({...newReview, areasForImprovement: e.target.value})}
                placeholder="List areas that need improvement..."
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="goals">Goals for Next Period</Label>
              <Textarea
                id="goals"
                value={newReview.goals}
                onChange={(e) => setNewReview({...newReview, goals: e.target.value})}
                placeholder="List specific goals for the next review period..."
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="comments">Additional Comments</Label>
              <Textarea
                id="comments"
                value={newReview.comments}
                onChange={(e) => setNewReview({...newReview, comments: e.target.value})}
                placeholder="Any additional comments or notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateReview}>Create Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Review Dialog */}
      {selectedReview && (
        <Dialog open={isViewReviewDialogOpen} onOpenChange={setIsViewReviewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Performance Review Details</DialogTitle>
              <DialogDescription>
                {selectedReview.reviewType} review for {selectedReview.staffName} on {format(new Date(selectedReview.reviewDate), "MMMM d, yyyy")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Staff</Label>
                  <p className="font-medium">{selectedReview.staffName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Reviewer</Label>
                  <p className="font-medium">{selectedReview.reviewerName}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Review Date</Label>
                  <p>{format(new Date(selectedReview.reviewDate), "MMMM d, yyyy")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p>
                    <Badge 
                      variant={
                        selectedReview.status === "Completed" ? "success" : 
                        selectedReview.status === "In Progress" ? "secondary" : 
                        "outline"
                      }
                    >
                      {selectedReview.status}
                    </Badge>
                  </p>
                </div>
              </div>
              
              {selectedReview.status === "Completed" && (
                <>
                  <div>
                    <Label className="text-muted-foreground">Overall Rating</Label>
                    <p className="font-medium">
                      <Badge className={getRatingColor(selectedReview.overallRating)}>
                        {selectedReview.overallRating.toFixed(1)}
                      </Badge>
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Performance Ratings</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex justify-between">
                        <span>Technical Skills:</span>
                        <Badge className={getRatingColor(selectedReview.ratings.technicalSkills)}>
                          {selectedReview.ratings.technicalSkills.toFixed(1)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Customer Service:</span>
                        <Badge className={getRatingColor(selectedReview.ratings.customerService)}>
                          {selectedReview.ratings.customerService.toFixed(1)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Teamwork:</span>
                        <Badge className={getRatingColor(selectedReview.ratings.teamwork)}>
                          {selectedReview.ratings.teamwork.toFixed(1)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Reliability:</span>
                        <Badge className={getRatingColor(selectedReview.ratings.reliability)}>
                          {selectedReview.ratings.reliability.toFixed(1)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Productivity:</span>
                        <Badge className={getRatingColor(selectedReview.ratings.productivity)}>
                          {selectedReview.ratings.productivity.toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground">Strengths</Label>
                    <p>{selectedReview.strengths || "None specified"}</p>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground">Areas for Improvement</Label>
                    <p>{selectedReview.areasForImprovement || "None specified"}</p>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground">Goals for Next Period</Label>
                    <p className="whitespace-pre-line">{selectedReview.goals || "None specified"}</p>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground">Additional Comments</Label>
                    <p>{selectedReview.comments || "None"}</p>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              {selectedReview.status !== "Completed" && (
                <Button onClick={() => {
                  setIsViewReviewDialogOpen(false)
                  handleEditReview(selectedReview)
                }}>
                  Complete Review
                </Button>
              )}
              <Button onClick={() => setIsViewReviewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
