"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { 
  Star, 
  Send, 
  MessageSquare, 
  Lightbulb, 
  Bug, 
  Heart,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Filter,
  Search
} from "lucide-react"

interface FeedbackItem {
  id: string
  type: "general" | "feature" | "bug" | "improvement"
  title: string
  description: string
  rating?: number
  status: "submitted" | "under-review" | "in-progress" | "completed" | "rejected"
  category: string
  submittedAt: string
  votes: number
  userVoted?: boolean
}

interface FeedbackStats {
  totalSubmissions: number
  averageRating: number
  responseRate: number
  implementedFeatures: number
}

const feedbackData: FeedbackItem[] = [
  {
    id: "1",
    type: "feature",
    title: "Dark mode support",
    description: "Would love to have a dark mode option for better usability during evening hours.",
    status: "in-progress",
    category: "UI/UX",
    submittedAt: "2024-01-15",
    votes: 23,
    userVoted: true
  },
  {
    id: "2",
    type: "bug",
    title: "Calendar sync issues",
    description: "Appointments sometimes don't sync properly with external calendars.",
    status: "under-review",
    category: "Appointments",
    submittedAt: "2024-01-18",
    votes: 8
  },
  {
    id: "3",
    type: "improvement",
    title: "Faster report generation",
    description: "Reports take too long to generate, especially for large date ranges.",
    status: "completed",
    category: "Reports",
    submittedAt: "2024-01-10",
    votes: 15
  }
]

const stats: FeedbackStats = {
  totalSubmissions: 127,
  averageRating: 4.2,
  responseRate: 89,
  implementedFeatures: 34
}

export default function FeedbackPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("submit")
  const [feedbackForm, setFeedbackForm] = useState({
    type: "",
    category: "",
    title: "",
    description: "",
    rating: 0
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  const categories = [
    "UI/UX", "Appointments", "Clients", "Inventory", "Reports", 
    "Payments", "Staff Management", "Settings", "Mobile App", "Other"
  ]

  const handleSubmitFeedback = async () => {
    if (!feedbackForm.type || !feedbackForm.title || !feedbackForm.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! We'll review it and get back to you.",
      })
      
      setFeedbackForm({
        type: "",
        category: "",
        title: "",
        description: "",
        rating: 0
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleRating = (rating: number) => {
    setFeedbackForm(prev => ({ ...prev, rating }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800"
      case "under-review": return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
      case "in-progress": return "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800"
      case "completed": return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800"
      case "rejected": return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800"
      default: return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "feature": return <Lightbulb className="h-4 w-4" />
      case "bug": return <Bug className="h-4 w-4" />
      case "improvement": return <TrendingUp className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  const filteredFeedback = feedbackData.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || item.type === filterType
    const matchesStatus = filterStatus === "all" || item.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Feedback & Suggestions</h1>
        <p className="text-muted-foreground">
          Help us improve VanityHub by sharing your thoughts and ideas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
                <p className="text-sm text-muted-foreground">Total Submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats.averageRating}</p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.responseRate}%</p>
                <p className="text-sm text-muted-foreground">Response Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.implementedFeatures}</p>
                <p className="text-sm text-muted-foreground">Features Implemented</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="submit">Submit Feedback</TabsTrigger>
          <TabsTrigger value="browse">Browse Feedback</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Submit Feedback Tab */}
        <TabsContent value="submit" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feedback Form */}
            <Card>
              <CardHeader>
                <CardTitle>Share Your Feedback</CardTitle>
                <CardDescription>Help us improve by sharing your thoughts and suggestions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Feedback Type *</Label>
                    <Select
                      value={feedbackForm.type}
                      onValueChange={(value) => setFeedbackForm(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Feedback</SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                        <SelectItem value="bug">Bug Report</SelectItem>
                        <SelectItem value="improvement">Improvement Suggestion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={feedbackForm.category}
                      onValueChange={(value) => setFeedbackForm(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Brief summary of your feedback"
                    value={feedbackForm.title}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed information about your feedback..."
                    value={feedbackForm.description}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, description: e.target.value }))}
                    className="min-h-[120px]"
                  />
                </div>

                {feedbackForm.type === "general" && (
                  <div className="space-y-2">
                    <Label>Overall Rating</Label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRating(star)}
                          className="p-1"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= feedbackForm.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                      {feedbackForm.rating > 0 && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          {feedbackForm.rating} out of 5 stars
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <Button onClick={handleSubmitFeedback} className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Submit Feedback
                </Button>
              </CardContent>
            </Card>

            {/* Feedback Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Feedback Guidelines</CardTitle>
                <CardDescription>Tips for providing effective feedback</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Lightbulb className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Feature Requests</h4>
                      <p className="text-sm text-muted-foreground">
                        Describe the problem you're trying to solve and how the feature would help
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-red-100 p-2 rounded-full">
                      <Bug className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Bug Reports</h4>
                      <p className="text-sm text-muted-foreground">
                        Include steps to reproduce, expected vs actual behavior, and browser/device info
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Improvements</h4>
                      <p className="text-sm text-muted-foreground">
                        Suggest specific changes to existing features with clear benefits
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <Heart className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">General Feedback</h4>
                      <p className="text-sm text-muted-foreground">
                        Share your overall experience and what you love or find challenging
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Response Timeline</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Bug Reports</span>
                      <span>1-2 business days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Feature Requests</span>
                      <span>3-5 business days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>General Feedback</span>
                      <span>5-7 business days</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Browse Feedback Tab */}
        <TabsContent value="browse" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Community Feedback</CardTitle>
              <CardDescription>Browse and vote on feedback from the community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search feedback..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="bug">Bug Report</SelectItem>
                    <SelectItem value="improvement">Improvement</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under-review">Under Review</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Feedback List */}
              <div className="space-y-4">
                {filteredFeedback.map(item => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="bg-muted p-2 rounded-full">
                          {getTypeIcon(item.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{item.category}</Badge>
                            <Badge className={getStatusColor(item.status)}>
                              {item.status.replace('-', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Submitted {item.submittedAt}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={item.userVoted ? "default" : "outline"}
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          {item.votes}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredFeedback.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No feedback found</h3>
                    <p className="text-muted-foreground">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feedback Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Feedback Trends</CardTitle>
                <CardDescription>Overview of feedback submissions over time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Feature Requests</span>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bug Reports</span>
                    <span className="text-sm font-medium">25%</span>
                  </div>
                  <Progress value={25} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Improvements</span>
                    <span className="text-sm font-medium">20%</span>
                  </div>
                  <Progress value={20} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">General Feedback</span>
                    <span className="text-sm font-medium">10%</span>
                  </div>
                  <Progress value={10} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Top Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Categories</CardTitle>
                <CardDescription>Most discussed areas of the application</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">UI/UX</p>
                      <p className="text-sm text-muted-foreground">32 submissions</p>
                    </div>
                    <Badge variant="secondary">Hot</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Appointments</p>
                      <p className="text-sm text-muted-foreground">28 submissions</p>
                    </div>
                    <Badge variant="outline">Trending</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Reports</p>
                      <p className="text-sm text-muted-foreground">19 submissions</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Mobile App</p>
                      <p className="text-sm text-muted-foreground">15 submissions</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Implementation Status */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Implementation Progress</CardTitle>
                <CardDescription>Track how feedback is being addressed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">42</div>
                    <div className="text-sm text-muted-foreground">Submitted</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">28</div>
                    <div className="text-sm text-muted-foreground">Under Review</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">19</div>
                    <div className="text-sm text-muted-foreground">In Progress</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">34</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">4</div>
                    <div className="text-sm text-muted-foreground">Rejected</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
