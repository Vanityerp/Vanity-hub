"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-provider"
import { chatService } from "@/lib/chat-service"
import { HelpCircle, AlertTriangle, Info, Settings, Users, Calendar } from "lucide-react"

interface HelpRequestDialogProps {
  children: React.ReactNode;
  channelId: string;
}

export function HelpRequestDialog({ children, channelId }: HelpRequestDialogProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<string>('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')

  const helpCategories = [
    {
      id: 'procedures',
      name: 'Procedures & Policies',
      description: 'Questions about salon procedures, policies, or protocols',
      icon: Info,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'technical',
      name: 'Technical Issues',
      description: 'Problems with software, equipment, or systems',
      icon: Settings,
      color: 'bg-purple-100 text-purple-800'
    },
    {
      id: 'scheduling',
      name: 'Scheduling & Appointments',
      description: 'Help with appointment booking, scheduling conflicts, or calendar issues',
      icon: Calendar,
      color: 'bg-green-100 text-green-800'
    },
    {
      id: 'client_service',
      name: 'Client Service',
      description: 'Questions about client interactions, service protocols, or customer care',
      icon: Users,
      color: 'bg-orange-100 text-orange-800'
    },
    {
      id: 'emergency',
      name: 'Emergency/Urgent',
      description: 'Urgent issues requiring immediate attention',
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-800'
    },
    {
      id: 'other',
      name: 'Other',
      description: 'General questions or issues not covered by other categories',
      icon: HelpCircle,
      color: 'bg-gray-100 text-gray-800'
    }
  ]

  const selectedCategory = helpCategories.find(cat => cat.id === category)

  const handleSubmitRequest = () => {
    if (!category || !subject || !description || !user) return

    const categoryInfo = helpCategories.find(cat => cat.id === category)
    
    const helpMessage = `**Help Request**

**Category:** ${categoryInfo?.name || category}
**Subject:** ${subject}
**Priority:** ${priority.toUpperCase()}

**Description:**
${description}

**Requested by:** ${user.name} (${user.role})
**Location:** ${user.locations[0] !== 'all' ? user.locations[0] : 'Multiple locations'}`

    chatService.sendMessage(
      channelId,
      helpMessage,
      'help_request',
      {
        requestType: category,
        priority
      }
    )

    // Reset form
    setCategory('')
    setPriority('medium')
    setSubject('')
    setDescription('')
    setOpen(false)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Request Help
          </DialogTitle>
          <DialogDescription>
            Get assistance with procedures, technical issues, or any questions you have
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-auto">
          {/* Category Selection */}
          <div className="space-y-3">
            <Label>What do you need help with?</Label>
            <div className="grid grid-cols-1 gap-2">
              {helpCategories.map((cat) => {
                const IconComponent = cat.icon
                return (
                  <div
                    key={cat.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      category === cat.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setCategory(cat.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-md ${cat.color}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{cat.name}</div>
                        <div className="text-sm text-muted-foreground">{cat.description}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {selectedCategory && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-2">
                <Badge className={selectedCategory.color}>
                  {React.createElement(selectedCategory.icon, { className: "h-3 w-3 mr-1" })}
                  {selectedCategory.name}
                </Badge>
              </div>

              {/* Priority Selection */}
              <div className="space-y-2">
                <Label>Priority Level</Label>
                <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Low - Can wait
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        Medium - Normal priority
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        High - Important
                      </div>
                    </SelectItem>
                    <SelectItem value="urgent">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        Urgent - Immediate attention needed
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  placeholder="Brief summary of your question or issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Please provide detailed information about your question or issue. Include any relevant context, steps you've already tried, or specific information that might help us assist you better."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Help Tips */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <div className="font-medium mb-1">Tips for getting help faster:</div>
                    <ul className="text-xs space-y-1 list-disc list-inside">
                      <li>Be specific about the issue you're experiencing</li>
                      <li>Include any error messages you've seen</li>
                      <li>Mention what you were trying to do when the issue occurred</li>
                      <li>Let us know if this is affecting client service</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitRequest}
            disabled={!category || !subject || !description}
          >
            Submit Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
