"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Star, Upload, X, Image as ImageIcon } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface EnhancedReviewFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  review?: any
  onSubmit: (data: ReviewFormData) => Promise<void>
  onCancel: () => void
}

export interface ReviewFormData {
  id?: string
  rating: number
  comment: string
  title: string
  itemId: string
  itemType: 'product' | 'service'
  staffId?: string
  images?: string[]
  isAnonymous: boolean
  wouldRecommend: boolean
  tags: string[]
}

export function EnhancedReviewForm({
  open,
  onOpenChange,
  review,
  onSubmit,
  onCancel
}: EnhancedReviewFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [newTag, setNewTag] = useState("")
  
  const [formData, setFormData] = useState({
    title: "",
    comment: "",
    isAnonymous: false,
    wouldRecommend: true,
    images: [] as string[],
    tags: [] as string[]
  })

  // Reset form when dialog opens/closes or review changes
  useEffect(() => {
    if (open) {
      if (review) {
        // Edit mode
        setFormData({
          title: review.title || "",
          comment: review.comment || "",
          isAnonymous: review.isAnonymous || false,
          wouldRecommend: review.wouldRecommend !== false,
          images: review.images || [],
          tags: review.tags || []
        })
        setRating(review.rating || 0)
      } else {
        // Create mode
        setFormData({
          title: "",
          comment: "",
          isAnonymous: false,
          wouldRecommend: true,
          images: [],
          tags: []
        })
        setRating(0)
      }
      setNewTag("")
    }
  }, [open, review])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (rating === 0) {
      toast({
        variant: "destructive",
        title: "Rating required",
        description: "Please select a rating before submitting your review.",
      })
      return
    }
    
    if (formData.comment.trim().length < 10) {
      toast({
        variant: "destructive",
        title: "Comment too short",
        description: "Please provide a more detailed comment (at least 10 characters).",
      })
      return
    }

    if (formData.title.trim().length < 3) {
      toast({
        variant: "destructive",
        title: "Title required",
        description: "Please provide a title for your review (at least 3 characters).",
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const reviewData: ReviewFormData = {
        id: review?.id,
        rating,
        title: formData.title.trim(),
        comment: formData.comment.trim(),
        itemId: review?.itemId || "",
        itemType: review?.itemType || "service",
        staffId: review?.staffId,
        images: formData.images,
        isAnonymous: formData.isAnonymous,
        wouldRecommend: formData.wouldRecommend,
        tags: formData.tags
      }

      await onSubmit(reviewData)
      onOpenChange(false)
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim()) && formData.tags.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  const addImage = () => {
    // In a real app, this would open a file picker
    const mockImageUrl = `https://images.unsplash.com/photo-${Date.now()}?w=400&h=300&fit=crop`
    if (formData.images.length < 3) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, mockImageUrl]
      }))
      toast({
        title: "Image added",
        description: "Image has been added to your review.",
      })
    }
  }

  const removeImage = (imageToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== imageToRemove)
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{review ? "Edit Your Review" : "Write a Review"}</DialogTitle>
            <DialogDescription>
              {review ? "Update your review details below." : "Share your experience to help others make better choices."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Rating */}
            <div className="space-y-2">
              <Label>Rating *</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="p-1"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        star <= (hoverRating || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {rating > 0 && (
                    <>
                      {rating} star{rating !== 1 ? 's' : ''}
                      {rating === 5 && " - Excellent!"}
                      {rating === 4 && " - Very Good"}
                      {rating === 3 && " - Good"}
                      {rating === 2 && " - Fair"}
                      {rating === 1 && " - Poor"}
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Review Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Summarize your experience..."
                maxLength={100}
                required
              />
              <p className="text-xs text-gray-500">
                {formData.title.length}/100 characters
              </p>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="comment">Your Review *</Label>
              <Textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => handleInputChange("comment", e.target.value)}
                placeholder="Share your detailed experience..."
                rows={5}
                maxLength={1000}
                className="resize-none"
                required
              />
              <p className="text-xs text-gray-500">
                {formData.comment.length}/1000 characters (minimum 10)
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags (Optional)</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyPress={handleKeyPress}
                    maxLength={20}
                  />
                  <Button type="button" onClick={addTag} size="sm" disabled={formData.tags.length >= 5}>
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Add up to 5 tags to help categorize your review
                </p>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label>Photos (Optional)</Label>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addImage}
                  disabled={formData.images.length >= 3}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Add Photo ({formData.images.length}/3)
                </Button>
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(image)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Additional Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Would you recommend this?</Label>
                  <p className="text-xs text-gray-500">Help others by sharing your recommendation</p>
                </div>
                <Switch
                  checked={formData.wouldRecommend}
                  onCheckedChange={(checked) => handleInputChange("wouldRecommend", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Post anonymously</Label>
                  <p className="text-xs text-gray-500">Your name won't be shown with this review</p>
                </div>
                <Switch
                  checked={formData.isAnonymous}
                  onCheckedChange={(checked) => handleInputChange("isAnonymous", checked)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-pink-600 hover:bg-pink-700">
              {isSubmitting ? "Saving..." : review ? "Update Review" : "Submit Review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
