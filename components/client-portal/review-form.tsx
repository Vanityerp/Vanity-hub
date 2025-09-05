"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Star } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ReviewFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId: string
  itemName: string
  itemType: 'product' | 'service' | 'staff'
  staffId?: string
  staffName?: string
  onSubmit: (data: ReviewFormData) => void
  existingReview?: ReviewFormData
}

export interface ReviewFormData {
  id?: string
  rating: number
  comment: string
  itemId: string
  itemType: 'product' | 'service' | 'staff'
  staffId?: string
}

export function ReviewForm({
  open,
  onOpenChange,
  itemId,
  itemName,
  itemType,
  staffId,
  staffName,
  onSubmit,
  existingReview
}: ReviewFormProps) {
  const { toast } = useToast()
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState(existingReview?.comment || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting your review.",
        variant: "destructive",
      })
      return
    }
    
    if (comment.trim().length < 10) {
      toast({
        title: "Comment too short",
        description: "Please provide a more detailed comment (at least 10 characters).",
        variant: "destructive",
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // In a real app, this would be an API call to submit the review
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onSubmit({
        id: existingReview?.id,
        rating,
        comment,
        itemId,
        itemType,
        staffId
      })
      
      toast({
        title: existingReview ? "Review updated" : "Review submitted",
        description: existingReview 
          ? "Your review has been successfully updated." 
          : "Thank you for sharing your feedback!",
      })
      
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Failed to submit your review. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const getDialogTitle = () => {
    if (existingReview) {
      return `Edit Your Review`
    }
    
    switch (itemType) {
      case 'product':
        return `Review ${itemName}`
      case 'service':
        return `Review Your ${itemName}`
      case 'staff':
        return `Review ${itemName}`
      default:
        return "Write a Review"
    }
  }
  
  const getDialogDescription = () => {
    switch (itemType) {
      case 'product':
        return "Share your experience with this product"
      case 'service':
        return `Tell us about your ${itemName} experience${staffName ? ` with ${staffName}` : ''}`
      case 'staff':
        return `Share your experience with ${itemName}`
      default:
        return "Your feedback helps others make better choices"
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogDescription>{getDialogDescription()}</DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Your Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="focus:outline-none"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    <Star
                      className={`h-8 w-8 ${
                        (hoverRating ? star <= hoverRating : star <= rating)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-gray-200 text-gray-200"
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="comment" className="text-sm font-medium">
                Your Review
              </label>
              <Textarea
                id="comment"
                placeholder="Share your experience..."
                rows={5}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Your review will be visible to other clients and may be used for marketing purposes.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-pink-600 hover:bg-pink-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  {existingReview ? "Updating..." : "Submitting..."}
                </>
              ) : (
                existingReview ? "Update Review" : "Submit Review"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
