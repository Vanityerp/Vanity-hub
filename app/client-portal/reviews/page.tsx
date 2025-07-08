"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ClientPortalLayout } from "@/components/client-portal/client-portal-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Star, Search, Filter, ChevronRight, Edit, Trash2 } from "lucide-react"
import { useClients } from "@/lib/client-provider"
import Link from "next/link"
import { EnhancedReviewForm, ReviewFormData } from "@/components/client-portal/enhanced-review-form"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Mock review data
const initialProductReviews = [
  {
    id: "pr1",
    productId: "p1",
    productName: "Hydrating Shampoo",
    rating: 5,
    comment: "This shampoo is amazing! My hair feels so soft and hydrated after using it.",
    date: "2025-03-15T10:30:00",
    status: "published"
  },
  {
    id: "pr2",
    productId: "p4",
    productName: "Styling Mousse",
    rating: 4,
    comment: "Good hold without making my hair stiff. Would recommend!",
    date: "2025-02-20T14:45:00",
    status: "published"
  }
]

const initialServiceReviews = [
  {
    id: "sr1",
    serviceId: "s1",
    serviceName: "Haircut & Style",
    staffId: "1",
    staffName: "Emma Johnson",
    rating: 5,
    comment: "Emma did an amazing job with my haircut! She really understood what I wanted.",
    date: "2025-03-10T11:15:00",
    status: "published"
  }
]

export default function ReviewsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { clients, getClient } = useClients()
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isEditReviewOpen, setIsEditReviewOpen] = useState(false)
  const [editingReview, setEditingReview] = useState<any>(null)

  // Review state
  const [productReviews, setProductReviews] = useState(initialProductReviews)
  const [serviceReviews, setServiceReviews] = useState(initialServiceReviews)

  useEffect(() => {
    const clientEmail = localStorage.getItem("client_email")
    const clientAuthToken = localStorage.getItem("client_auth_token")

    if (!clientEmail || !clientAuthToken) {
      toast({
        title: "Authentication required",
        description: "Please log in to view your reviews",
        variant: "destructive",
      })
      router.push("/client-portal")
      return
    }

    const foundClient = getClient(clientEmail)

    if (foundClient) {
      setClient(foundClient)
    } else {
      // If client not found, create a mock client for demo purposes
      setClient({
        id: "client123",
        name: "Jane Smith",
        email: clientEmail,
        avatar: "JS"
      })
    }

    // In a real app, we would fetch the client's reviews from an API
    // For now, we'll use our mock data

    setLoading(false)
  }, [clients, getClient, router, toast])

  // Filter reviews based on search query and active tab
  const filteredProductReviews = productReviews.filter(review =>
    review.productName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredServiceReviews = serviceReviews.filter(review =>
    review.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.staffName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle deleting a review
  const deleteReview = (id: string, type: 'product' | 'service') => {
    if (type === 'product') {
      setProductReviews(prev => prev.filter(review => review.id !== id))
    } else {
      setServiceReviews(prev => prev.filter(review => review.id !== id))
    }

    toast({
      title: "Review deleted",
      description: "Your review has been successfully deleted.",
    })
  }

  // Handle editing a review
  const editReview = (id: string, type: 'product' | 'service') => {
    const review = type === 'product'
      ? productReviews.find(r => r.id === id)
      : serviceReviews.find(r => r.id === id)

    if (review) {
      setEditingReview({ ...review, itemType: type })
      setIsEditReviewOpen(true)
    }
  }

  // Handle saving edited review
  const handleSaveReview = async (reviewData: ReviewFormData) => {
    try {
      // Call API to update the review
      const response = await fetch('/api/client-portal/reviews', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: reviewData.id,
          rating: reviewData.rating,
          title: reviewData.title,
          comment: reviewData.comment,
          isAnonymous: reviewData.isAnonymous,
          wouldRecommend: reviewData.wouldRecommend,
          tags: reviewData.tags,
          images: reviewData.images
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update review')
      }

      // Update local state
      if (editingReview.itemType === 'product') {
        setProductReviews(prev => prev.map(r =>
          r.id === reviewData.id
            ? { ...r, ...reviewData, date: new Date().toISOString() }
            : r
        ))
      } else {
        setServiceReviews(prev => prev.map(r =>
          r.id === reviewData.id
            ? { ...r, ...reviewData, date: new Date().toISOString() }
            : r
        ))
      }

      toast({
        title: "Review updated",
        description: "Your review has been updated successfully.",
      })

      setEditingReview(null)
    } catch (error) {
      console.error('Error updating review:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update review. Please try again.",
      })
      throw error // Re-throw to prevent dialog from closing
    }
  }

  if (loading) {
    return (
      <ClientPortalLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
      </ClientPortalLayout>
    )
  }

  return (
    <ClientPortalLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">My Reviews</h1>
            <p className="text-gray-600">Manage your product and service reviews</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search reviews..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="all">All Reviews</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-8">
            {filteredProductReviews.length === 0 && filteredServiceReviews.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium mb-2">No Reviews Found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery ? "No reviews match your search criteria." : "You haven't written any reviews yet."}
                </p>
                <Button className="bg-pink-600 hover:bg-pink-700" asChild>
                  <Link href="/client-portal/shop">
                    Browse Products
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                {filteredProductReviews.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Product Reviews</h2>
                    <div className="space-y-4">
                      {filteredProductReviews.map((review) => (
                        <ReviewCard
                          key={review.id}
                          review={review}
                          type="product"
                          onDelete={() => deleteReview(review.id, 'product')}
                          onEdit={() => editReview(review.id, 'product')}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {filteredServiceReviews.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Service Reviews</h2>
                    <div className="space-y-4">
                      {filteredServiceReviews.map((review) => (
                        <ReviewCard
                          key={review.id}
                          review={review}
                          type="service"
                          onDelete={() => deleteReview(review.id, 'service')}
                          onEdit={() => editReview(review.id, 'service')}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="products">
            {filteredProductReviews.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium mb-2">No Product Reviews Found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery ? "No product reviews match your search criteria." : "You haven't written any product reviews yet."}
                </p>
                <Button className="bg-pink-600 hover:bg-pink-700" asChild>
                  <Link href="/client-portal/shop">
                    Browse Products
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProductReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    type="product"
                    onDelete={() => deleteReview(review.id, 'product')}
                    onEdit={() => editReview(review.id, 'product')}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="services">
            {filteredServiceReviews.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium mb-2">No Service Reviews Found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery ? "No service reviews match your search criteria." : "You haven't written any service reviews yet."}
                </p>
                <Button className="bg-pink-600 hover:bg-pink-700" asChild>
                  <Link href="/client-portal/appointments">
                    View Appointments
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredServiceReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    type="service"
                    onDelete={() => deleteReview(review.id, 'service')}
                    onEdit={() => editReview(review.id, 'service')}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Enhanced Review Form Dialog */}
      <EnhancedReviewForm
        open={isEditReviewOpen}
        onOpenChange={setIsEditReviewOpen}
        review={editingReview}
        onSubmit={handleSaveReview}
        onCancel={() => {
          setIsEditReviewOpen(false)
          setEditingReview(null)
        }}
      />
    </ClientPortalLayout>
  )
}

interface ReviewCardProps {
  review: any
  type: 'product' | 'service'
  onDelete: () => void
  onEdit: () => void
}

function ReviewCard({ review, type, onDelete, onEdit }: ReviewCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < review.rating ? "fill-amber-400" : "fill-gray-200"}`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {new Date(review.date).toLocaleDateString()}
              </span>
            </div>

            <h3 className="font-medium">
              {type === 'product' ? review.productName : review.serviceName}
              {type === 'service' && (
                <span className="text-gray-500 ml-2">by {review.staffName}</span>
              )}
            </h3>

            <p className="text-gray-600">{review.comment}</p>
          </div>

          <div className="flex md:flex-col gap-2 self-end md:self-start">
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit
            </Button>
            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600" onClick={onDelete}>
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
