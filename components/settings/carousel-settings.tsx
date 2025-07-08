"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Eye, GripVertical, Upload, Save, RotateCcw, Download } from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import Image from "next/image"
import { carouselStorage, useCarouselData } from "@/lib/carousel-storage"

interface CarouselItem {
  id: string
  title: string
  subtitle: string
  description: string
  image: string
  price?: number
  originalPrice?: number
  type: "service" | "product" | "stylist" | "promotion"
  badge?: "sale" | "new" | "featured" | "hot"
  ctaText: string
  ctaLink: string
  gradient: string
  isActive: boolean
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: string
  href: string
  isActive: boolean
}

interface FeaturedSection {
  id: string
  title: string
  type: "services" | "products" | "stylists"
  items: Array<{
    id: string
    name: string
    image: string
    price?: number
    rating?: number
    isActive: boolean
  }>
  isActive: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

interface SpecialOffer {
  id: string
  title: string
  description: string
  type: "promotion" | "loyalty" | "seasonal"
  discountType: "percentage" | "fixed" | "bogo"
  discountValue: number
  validFrom: Date
  validTo: Date
  isActive: boolean
  conditions?: {
    minAmount?: number
    applicableServices?: string[]
    applicableProducts?: string[]
    maxUses?: number
    currentUses?: number
  }
  createdAt: Date
  updatedAt: Date
}

const defaultCarouselItems: CarouselItem[] = [
  {
    id: "featured-1",
    title: "Summer Glow Special",
    subtitle: "Beat the Heat in Style",
    description: "Get ready for summer with our refreshing treatments! Book any styling service and receive 25% off your next visit. Perfect for vacation prep!",
    image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=1200&h=600&fit=crop&crop=center&auto=format&q=80",
    price: 135,
    originalPrice: 180,
    type: "service",
    badge: "sale",
    ctaText: "Book Summer Style",
    ctaLink: "/client-portal/appointments/book?serviceId=6",
    gradient: "bg-gradient-to-r from-orange-900/80 via-pink-900/60 to-transparent",
    isActive: true
  },
  {
    id: "featured-2",
    title: "Premium Hair Care",
    subtitle: "Professional Products",
    description: "Discover our exclusive line of premium hair care products. Get 15% off your first purchase!",
    image: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=1200&h=600&fit=crop&crop=center&auto=format&q=80",
    price: 45,
    originalPrice: 55,
    type: "product",
    badge: "new",
    ctaText: "Shop Products",
    ctaLink: "/client-portal/shop",
    gradient: "bg-gradient-to-r from-blue-900/80 via-purple-900/60 to-transparent",
    isActive: true
  },
  {
    id: "featured-3",
    title: "Meet Sarah",
    subtitle: "Master Colorist",
    description: "Book with our award-winning colorist Sarah. Specializing in balayage and color corrections.",
    image: "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=1200&h=600&fit=crop&crop=center&auto=format&q=80",
    type: "stylist",
    badge: "featured",
    ctaText: "Book with Sarah",
    ctaLink: "/client-portal/appointments/book?stylistId=2",
    gradient: "bg-gradient-to-r from-green-900/80 via-teal-900/60 to-transparent",
    isActive: true
  }
]

const gradientOptions = [
  { value: "bg-gradient-to-r from-purple-900/80 via-pink-900/60 to-transparent", label: "Purple to Pink" },
  { value: "bg-gradient-to-r from-orange-900/80 via-pink-900/60 to-transparent", label: "Orange to Pink" },
  { value: "bg-gradient-to-r from-blue-900/80 via-purple-900/60 to-transparent", label: "Blue to Purple" },
  { value: "bg-gradient-to-r from-green-900/80 via-teal-900/60 to-transparent", label: "Green to Teal" },
  { value: "bg-gradient-to-r from-red-900/80 via-orange-900/60 to-transparent", label: "Red to Orange" },
  { value: "bg-gradient-to-r from-indigo-900/80 via-blue-900/60 to-transparent", label: "Indigo to Blue" }
]

export function CarouselSettings() {
  const { toast } = useToast()
  const { carouselItems: storedItems, refresh } = useCarouselData()
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([])
  const [editingItem, setEditingItem] = useState<CarouselItem | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [activeTab, setActiveTab] = useState("carousel")

  // Sync with stored data
  useEffect(() => {
    setCarouselItems(storedItems)
  }, [storedItems])

  const handleSaveItem = (item: CarouselItem) => {
    if (editingItem) {
      carouselStorage.updateCarouselItem(item.id, item)
      toast({
        title: "Carousel item updated",
        description: "The carousel item has been successfully updated.",
      })
    } else {
      carouselStorage.addCarouselItem(item)
      toast({
        title: "Carousel item added",
        description: "A new carousel item has been added.",
      })
    }
    setEditingItem(null)
    setIsDialogOpen(false)
  }

  const handleDeleteItem = (id: string) => {
    carouselStorage.deleteCarouselItem(id)
    toast({
      title: "Carousel item deleted",
      description: "The carousel item has been removed.",
    })
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(carouselItems)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    carouselStorage.saveCarouselItems(items)
    toast({
      title: "Items reordered",
      description: "Carousel items have been reordered successfully.",
    })
  }

  const toggleItemActive = (id: string) => {
    const item = carouselItems.find(i => i.id === id)
    if (item) {
      carouselStorage.updateCarouselItem(id, { isActive: !item.isActive })
    }
  }

  const handleExportData = () => {
    const data = carouselStorage.exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `carousel-settings-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({
      title: "Data exported",
      description: "Carousel settings have been exported successfully.",
    })
  }

  const handleResetToDefaults = () => {
    carouselStorage.resetToDefaults()
    toast({
      title: "Settings reset",
      description: "Carousel settings have been reset to defaults.",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Carousel Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage featured content, promotions, and carousel items for the client portal
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {previewMode ? "Edit Mode" : "Preview"}
          </Button>
          <Button
            variant="outline"
            onClick={handleExportData}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={handleResetToDefaults}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            onClick={() => {
              setEditingItem(null)
              setIsDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="carousel">Featured Carousel</TabsTrigger>
          <TabsTrigger value="quickactions">Quick Actions</TabsTrigger>
          <TabsTrigger value="sections">Featured Sections</TabsTrigger>
          <TabsTrigger value="offers">Special Offers</TabsTrigger>
        </TabsList>

        <TabsContent value="carousel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Featured Content Carousel</CardTitle>
              <CardDescription>
                Manage the main carousel items displayed on the client portal dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewMode ? (
                <div className="space-y-4">
                  <h4 className="font-medium">Preview Mode</h4>
                  <div className="grid gap-4">
                    {carouselItems.filter(item => item.isActive).map((item) => (
                      <div key={item.id} className="relative rounded-lg overflow-hidden h-48">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                        <div className={`absolute inset-0 ${item.gradient}`} />
                        <div className="absolute inset-0 p-6 text-white">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              {item.badge && (
                                <Badge className="mb-2 bg-red-500">
                                  {item.badge.toUpperCase()}
                                </Badge>
                              )}
                              <h3 className="text-2xl font-bold">{item.title}</h3>
                              <p className="text-lg opacity-90">{item.subtitle}</p>
                            </div>
                            {item.price && (
                              <div className="text-right">
                                <div className="text-2xl font-bold">QAR {item.price}</div>
                                {item.originalPrice && (
                                  <div className="text-sm line-through opacity-75">
                                    QAR {item.originalPrice}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <p className="mb-4 opacity-90">{item.description}</p>
                          <Button className="bg-pink-600 hover:bg-pink-700">
                            {item.ctaText}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="carousel-items">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                        {carouselItems.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="flex items-center gap-4 p-4 border rounded-lg bg-card"
                              >
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                  <div className="relative h-16 w-24 rounded overflow-hidden">
                                    <Image
                                      src={item.image}
                                      alt={item.title}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{item.title}</h4>
                                    <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge variant={item.isActive ? "default" : "secondary"}>
                                      {item.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                    {item.badge && (
                                      <Badge variant="outline">{item.badge}</Badge>
                                    )}
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleItemActive(item.id)}
                                    >
                                      {item.isActive ? "Deactivate" : "Activate"}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setEditingItem(item)
                                        setIsDialogOpen(true)
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteItem(item.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quickactions">
          <QuickActionsManager />
        </TabsContent>

        <TabsContent value="sections">
          <FeaturedSectionsManager />
        </TabsContent>

        <TabsContent value="offers">
          <SpecialOffersManager />
        </TabsContent>
      </Tabs>

      {/* Edit/Add Item Dialog */}
      <CarouselItemDialog
        item={editingItem}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveItem}
        gradientOptions={gradientOptions}
      />
    </div>
  )
}

interface CarouselItemDialogProps {
  item: CarouselItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (item: CarouselItem) => void
  gradientOptions: Array<{ value: string; label: string }>
}

function CarouselItemDialog({ item, open, onOpenChange, onSave, gradientOptions }: CarouselItemDialogProps) {
  const [formData, setFormData] = useState<Partial<CarouselItem>>({
    title: "",
    subtitle: "",
    description: "",
    image: "",
    type: "service",
    badge: undefined,
    ctaText: "",
    ctaLink: "",
    gradient: gradientOptions[0].value,
    isActive: true
  })

  useEffect(() => {
    if (item) {
      setFormData({
        ...item,
        badge: item.badge || undefined
      })
    } else {
      setFormData({
        title: "",
        subtitle: "",
        description: "",
        image: "",
        type: "service",
        badge: undefined,
        ctaText: "",
        ctaLink: "",
        gradient: gradientOptions[0].value,
        isActive: true
      })
    }
  }, [item, gradientOptions])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.title && formData.subtitle && formData.description && formData.image && formData.ctaText && formData.ctaLink) {
      onSave(formData as CarouselItem)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Carousel Item" : "Add Carousel Item"}</DialogTitle>
          <DialogDescription>
            Configure the carousel item details and appearance
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={formData.subtitle || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Enter subtitle"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter description"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image URL</Label>
            <Input
              id="image"
              value={formData.image || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
              placeholder="Enter image URL"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as CarouselItem['type'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="stylist">Stylist</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="badge">Badge (Optional)</Label>
              <Select
                value={formData.badge || "none"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, badge: value === "none" ? undefined : value as CarouselItem['badge'] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select badge" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Badge</SelectItem>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (Optional)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="Enter price"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="originalPrice">Original Price (Optional)</Label>
              <Input
                id="originalPrice"
                type="number"
                value={formData.originalPrice || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="Enter original price"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ctaText">CTA Button Text</Label>
              <Input
                id="ctaText"
                value={formData.ctaText || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, ctaText: e.target.value }))}
                placeholder="Enter button text"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaLink">CTA Link</Label>
              <Input
                id="ctaLink"
                value={formData.ctaLink || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, ctaLink: e.target.value }))}
                placeholder="Enter link URL"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gradient">Background Gradient</Label>
            <Select
              value={formData.gradient}
              onValueChange={(value) => setFormData(prev => ({ ...prev, gradient: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {gradientOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              {item ? "Update" : "Add"} Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Quick Actions Manager Component
function QuickActionsManager() {
  const { toast } = useToast()
  const [quickActions, setQuickActions] = useState<QuickAction[]>([
    {
      id: "book-appointment",
      title: "Book Appointment",
      description: "Schedule your next visit",
      icon: "Calendar",
      href: "/client-portal/appointments/book",
      isActive: true
    },
    {
      id: "our-services",
      title: "Our Services",
      description: "Explore our services",
      icon: "Scissors",
      href: "/client-portal/services",
      isActive: true
    },
    {
      id: "shop-products",
      title: "Shop Products",
      description: "Browse our products",
      icon: "ShoppingBag",
      href: "/client-portal/shop",
      isActive: true
    },
    {
      id: "loyalty-program",
      title: "Loyalty Program",
      description: "View your points & rewards",
      icon: "Gift",
      href: "/client-portal/loyalty",
      isActive: true
    },
    {
      id: "my-reviews",
      title: "My Reviews",
      description: "Share your feedback",
      icon: "Star",
      href: "/client-portal/reviews",
      isActive: true
    },
    {
      id: "my-orders",
      title: "My Orders",
      description: "Track your purchases",
      icon: "Package",
      href: "/client-portal/orders",
      isActive: true
    }
  ])

  const [editingAction, setEditingAction] = useState<QuickAction | null>(null)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)

  const toggleActionActive = (id: string) => {
    setQuickActions(prev => prev.map(action =>
      action.id === id ? { ...action, isActive: !action.isActive } : action
    ))
    toast({
      title: "Quick action updated",
      description: "The quick action status has been updated.",
    })
  }

  const handleSaveAction = (action: QuickAction) => {
    if (editingAction) {
      setQuickActions(prev => prev.map(a => a.id === action.id ? action : a))
      toast({
        title: "Quick action updated",
        description: "The quick action has been successfully updated.",
      })
    } else {
      const newAction = { ...action, id: `action-${Date.now()}` }
      setQuickActions(prev => [...prev, newAction])
      toast({
        title: "Quick action added",
        description: "A new quick action has been added.",
      })
    }
    setEditingAction(null)
    setIsActionDialogOpen(false)
  }

  const handleDeleteAction = (id: string) => {
    setQuickActions(prev => prev.filter(action => action.id !== id))
    toast({
      title: "Quick action deleted",
      description: "The quick action has been removed.",
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Manage the quick action buttons displayed on the client portal dashboard
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditingAction(null)
              setIsActionDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Action
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {quickActions.map((action) => (
            <div key={action.id} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div>
                  <h4 className="font-medium">{action.title}</h4>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={action.isActive ? "default" : "secondary"}>
                    {action.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline">{action.icon}</Badge>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActionActive(action.id)}
                  >
                    {action.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingAction(action)
                      setIsActionDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAction(action.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Quick Action Dialog */}
      <QuickActionDialog
        action={editingAction}
        open={isActionDialogOpen}
        onOpenChange={setIsActionDialogOpen}
        onSave={handleSaveAction}
      />
    </Card>
  )
}

// Featured Sections Manager Component
function FeaturedSectionsManager() {
  const { toast } = useToast()
  const { featuredSections } = useCarouselData()
  const [sections, setSections] = useState<FeaturedSection[]>([])
  const [editingSection, setEditingSection] = useState<FeaturedSection | null>(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false)
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [selectedSectionId, setSelectedSectionId] = useState<string>("")

  // Sync with stored data
  useEffect(() => {
    setSections(featuredSections)
  }, [featuredSections])

  const handleSaveSection = (section: FeaturedSection) => {
    if (editingSection) {
      carouselStorage.updateFeaturedSection(section.id, section)
      toast({
        title: "Section updated",
        description: "The featured section has been successfully updated.",
      })
    } else {
      carouselStorage.addFeaturedSection(section)
      toast({
        title: "Section added",
        description: "A new featured section has been added.",
      })
    }
    setEditingSection(null)
    setIsSectionDialogOpen(false)
  }

  const handleDeleteSection = (id: string) => {
    carouselStorage.deleteFeaturedSection(id)
    toast({
      title: "Section deleted",
      description: "The featured section has been removed.",
    })
  }

  const toggleSectionActive = (id: string) => {
    const section = sections.find(s => s.id === id)
    if (section) {
      carouselStorage.updateFeaturedSection(id, { isActive: !section.isActive })
    }
  }

  const handleSaveItem = (item: any) => {
    if (editingItem) {
      carouselStorage.updateFeaturedSectionItem(selectedSectionId, item.id, item)
      toast({
        title: "Item updated",
        description: "The featured item has been successfully updated.",
      })
    } else {
      carouselStorage.addFeaturedSectionItem(selectedSectionId, item)
      toast({
        title: "Item added",
        description: "A new featured item has been added.",
      })
    }
    setEditingItem(null)
    setIsItemDialogOpen(false)
    setSelectedSectionId("")
  }

  const handleDeleteItem = (sectionId: string, itemId: string) => {
    carouselStorage.deleteFeaturedSectionItem(sectionId, itemId)
    toast({
      title: "Item deleted",
      description: "The featured item has been removed.",
    })
  }

  const toggleItemActive = (sectionId: string, itemId: string) => {
    const section = sections.find(s => s.id === sectionId)
    const item = section?.items.find(i => i.id === itemId)
    if (item) {
      carouselStorage.updateFeaturedSectionItem(sectionId, itemId, { isActive: !item.isActive })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Featured Sections</CardTitle>
            <CardDescription>
              Manage featured services, products, and stylists sections displayed on the dashboard
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditingSection(null)
              setIsSectionDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium">{section.title}</h4>
                  <Badge variant={section.isActive ? "default" : "secondary"}>
                    {section.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline">{section.type}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSectionActive(section.id)}
                  >
                    {section.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingSection(section)
                      setIsSectionDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSection(section.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {section.items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3 relative group">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleItemActive(section.id, item.id)}
                      >
                        {item.isActive ? "✓" : "✗"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          setEditingItem(item)
                          setSelectedSectionId(section.id)
                          setIsItemDialogOpen(true)
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleDeleteItem(section.id, item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="relative h-24 w-full mb-2 rounded overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <h5 className="font-medium text-sm">{item.name}</h5>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm font-medium">QAR {item.price}</span>
                      {item.rating && (
                        <span className="text-sm text-muted-foreground">★ {item.rating}</span>
                      )}
                    </div>
                    {!item.isActive && (
                      <Badge variant="secondary" className="mt-1 text-xs">Inactive</Badge>
                    )}
                  </div>
                ))}
                <Button
                  variant="dashed"
                  className="h-32 border-2 border-dashed border-gray-300 hover:border-gray-400 flex flex-col items-center justify-center"
                  onClick={() => {
                    setEditingItem(null)
                    setSelectedSectionId(section.id)
                    setIsItemDialogOpen(true)
                  }}
                >
                  <Plus className="h-6 w-6 mb-2" />
                  Add Item
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Section Dialog */}
      <FeaturedSectionDialog
        section={editingSection}
        open={isSectionDialogOpen}
        onOpenChange={setIsSectionDialogOpen}
        onSave={handleSaveSection}
      />

      {/* Item Dialog */}
      <FeaturedItemDialog
        item={editingItem}
        sectionId={selectedSectionId}
        open={isItemDialogOpen}
        onOpenChange={setIsItemDialogOpen}
        onSave={handleSaveItem}
      />
    </Card>
  )
}

// Special Offers Manager Component
function SpecialOffersManager() {
  const { toast } = useToast()
  const { specialOffers } = useCarouselData()
  const [offers, setOffers] = useState<SpecialOffer[]>([])
  const [editingOffer, setEditingOffer] = useState<SpecialOffer | null>(null)
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false)

  // Sync with stored data
  useEffect(() => {
    setOffers(specialOffers)
  }, [specialOffers])

  const handleSaveOffer = (offer: SpecialOffer) => {
    if (editingOffer) {
      carouselStorage.updateSpecialOffer(offer.id, offer)
      toast({
        title: "Offer updated",
        description: "The special offer has been successfully updated.",
      })
    } else {
      carouselStorage.addSpecialOffer(offer)
      toast({
        title: "Offer added",
        description: "A new special offer has been added.",
      })
    }
    setEditingOffer(null)
    setIsOfferDialogOpen(false)
  }

  const handleDeleteOffer = (id: string) => {
    carouselStorage.deleteSpecialOffer(id)
    toast({
      title: "Offer deleted",
      description: "The special offer has been removed.",
    })
  }

  const toggleOfferActive = (id: string) => {
    const offer = offers.find(o => o.id === id)
    if (offer) {
      carouselStorage.updateSpecialOffer(id, { isActive: !offer.isActive })
    }
  }

  const getOffersByType = (type: SpecialOffer['type']) => {
    return offers.filter(offer => offer.type === type)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString()
  }

  const isOfferExpired = (offer: SpecialOffer) => {
    return new Date(offer.validTo) < new Date()
  }

  const renderOfferCard = (offer: SpecialOffer) => (
    <div key={offer.id} className="border rounded-lg p-4 relative">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h5 className="font-medium">{offer.title}</h5>
          <p className="text-sm text-muted-foreground mt-1">{offer.description}</p>
        </div>
        <div className="flex gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleOfferActive(offer.id)}
          >
            {offer.isActive ? "Deactivate" : "Activate"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingOffer(offer)
              setIsOfferDialogOpen(true)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteOffer(offer.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Badge variant={offer.isActive ? "default" : "secondary"}>
          {offer.isActive ? "Active" : "Inactive"}
        </Badge>
        <Badge variant="outline">{offer.type}</Badge>
        <Badge variant="outline">{offer.discountType}</Badge>
        {isOfferExpired(offer) && (
          <Badge variant="destructive">Expired</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Discount:</span>
          <span className="ml-2 font-medium">
            {offer.discountType === 'percentage' ? `${offer.discountValue}%` :
             offer.discountType === 'fixed' ? `QAR ${offer.discountValue}` :
             'Buy One Get One'}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Valid:</span>
          <span className="ml-2 font-medium">
            {formatDate(offer.validFrom)} - {formatDate(offer.validTo)}
          </span>
        </div>
        {offer.conditions?.minAmount && (
          <div>
            <span className="text-muted-foreground">Min Amount:</span>
            <span className="ml-2 font-medium">QAR {offer.conditions.minAmount}</span>
          </div>
        )}
        {offer.conditions?.maxUses && (
          <div>
            <span className="text-muted-foreground">Uses:</span>
            <span className="ml-2 font-medium">
              {offer.conditions.currentUses || 0} / {offer.conditions.maxUses}
            </span>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Special Offers</CardTitle>
            <CardDescription>
              Manage special offers, promotions, and loyalty program rewards
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditingOffer(null)
              setIsOfferDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Offer
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Promotions */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Promotions</h4>
              <Badge variant="outline">{getOffersByType('promotion').length} offers</Badge>
            </div>
            <div className="space-y-4">
              {getOffersByType('promotion').length > 0 ? (
                getOffersByType('promotion').map(renderOfferCard)
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <p className="text-muted-foreground mb-4">No promotions yet</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingOffer(null)
                      setIsOfferDialogOpen(true)
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Promotion
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Loyalty Rewards */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Loyalty Rewards</h4>
              <Badge variant="outline">{getOffersByType('loyalty').length} rewards</Badge>
            </div>
            <div className="space-y-4">
              {getOffersByType('loyalty').length > 0 ? (
                getOffersByType('loyalty').map(renderOfferCard)
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <p className="text-muted-foreground mb-4">No loyalty rewards yet</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingOffer(null)
                      setIsOfferDialogOpen(true)
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Reward
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Seasonal Campaigns */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Seasonal Campaigns</h4>
              <Badge variant="outline">{getOffersByType('seasonal').length} campaigns</Badge>
            </div>
            <div className="space-y-4">
              {getOffersByType('seasonal').length > 0 ? (
                getOffersByType('seasonal').map(renderOfferCard)
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <p className="text-muted-foreground mb-4">No seasonal campaigns yet</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingOffer(null)
                      setIsOfferDialogOpen(true)
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Campaign
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Special Offer Dialog */}
      <SpecialOfferDialog
        offer={editingOffer}
        open={isOfferDialogOpen}
        onOpenChange={setIsOfferDialogOpen}
        onSave={handleSaveOffer}
      />
    </Card>
  )
}

// Quick Action Dialog Component
interface QuickActionDialogProps {
  action: QuickAction | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (action: QuickAction) => void
}

function QuickActionDialog({ action, open, onOpenChange, onSave }: QuickActionDialogProps) {
  const [formData, setFormData] = useState<Partial<QuickAction>>({
    title: "",
    description: "",
    icon: "Calendar",
    href: "",
    isActive: true
  })

  useEffect(() => {
    if (action) {
      setFormData(action)
    } else {
      setFormData({
        title: "",
        description: "",
        icon: "Calendar",
        href: "",
        isActive: true
      })
    }
  }, [action])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.title && formData.description && formData.icon && formData.href) {
      onSave(formData as QuickAction)
    }
  }

  const iconOptions = [
    "Calendar", "Scissors", "ShoppingBag", "Gift", "Star", "Package",
    "User", "Heart", "Phone", "Mail", "MapPin", "Clock"
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{action ? "Edit Quick Action" : "Add Quick Action"}</DialogTitle>
          <DialogDescription>
            Configure the quick action button details
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="action-title">Title</Label>
            <Input
              id="action-title"
              value={formData.title || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="action-description">Description</Label>
            <Input
              id="action-description"
              value={formData.description || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter description"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="action-icon">Icon</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      {icon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="action-href">Link</Label>
              <Input
                id="action-href"
                value={formData.href || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, href: e.target.value }))}
                placeholder="Enter link URL"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              {action ? "Update" : "Add"} Action
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Featured Section Dialog Component
interface FeaturedSectionDialogProps {
  section: FeaturedSection | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (section: FeaturedSection) => void
}

function FeaturedSectionDialog({ section, open, onOpenChange, onSave }: FeaturedSectionDialogProps) {
  const [formData, setFormData] = useState<Partial<FeaturedSection>>({
    title: "",
    type: "services",
    items: [],
    isActive: true
  })

  useEffect(() => {
    if (section) {
      setFormData(section)
    } else {
      setFormData({
        title: "",
        type: "services",
        items: [],
        isActive: true
      })
    }
  }, [section])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.title && formData.type) {
      onSave(formData as FeaturedSection)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{section ? "Edit Featured Section" : "Add Featured Section"}</DialogTitle>
          <DialogDescription>
            Configure the featured section details
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="section-title">Title</Label>
            <Input
              id="section-title"
              value={formData.title || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter section title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="section-type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as FeaturedSection['type'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="services">Services</SelectItem>
                <SelectItem value="products">Products</SelectItem>
                <SelectItem value="stylists">Stylists</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              {section ? "Update" : "Add"} Section
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Featured Item Dialog Component
interface FeaturedItemDialogProps {
  item: any | null
  sectionId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (item: any) => void
}

function FeaturedItemDialog({ item, sectionId, open, onOpenChange, onSave }: FeaturedItemDialogProps) {
  const [formData, setFormData] = useState<any>({
    name: "",
    image: "",
    price: 0,
    rating: 0,
    isActive: true
  })

  useEffect(() => {
    if (item) {
      setFormData(item)
    } else {
      setFormData({
        name: "",
        image: "",
        price: 0,
        rating: 0,
        isActive: true
      })
    }
  }, [item])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.image && formData.price) {
      onSave(formData)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Edit Featured Item" : "Add Featured Item"}</DialogTitle>
          <DialogDescription>
            Configure the featured item details
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-name">Name</Label>
            <Input
              id="item-name"
              value={formData.name || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter item name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-image">Image URL</Label>
            <Input
              id="item-image"
              value={formData.image || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
              placeholder="Enter image URL"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item-price">Price (QAR)</Label>
              <Input
                id="item-price"
                type="number"
                value={formData.price || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-rating">Rating (1-5)</Label>
              <Input
                id="item-rating"
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={formData.rating || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) || 0 }))}
                placeholder="4.5"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              {item ? "Update" : "Add"} Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Special Offer Dialog Component
interface SpecialOfferDialogProps {
  offer: SpecialOffer | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (offer: SpecialOffer) => void
}

function SpecialOfferDialog({ offer, open, onOpenChange, onSave }: SpecialOfferDialogProps) {
  const [formData, setFormData] = useState<Partial<SpecialOffer>>({
    title: "",
    description: "",
    type: "promotion",
    discountType: "percentage",
    discountValue: 0,
    validFrom: new Date(),
    validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isActive: true,
    conditions: {}
  })

  useEffect(() => {
    if (offer) {
      setFormData({
        ...offer,
        validFrom: new Date(offer.validFrom),
        validTo: new Date(offer.validTo)
      })
    } else {
      setFormData({
        title: "",
        description: "",
        type: "promotion",
        discountType: "percentage",
        discountValue: 0,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        conditions: {}
      })
    }
  }, [offer])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.title && formData.description && formData.discountValue && formData.validFrom && formData.validTo) {
      onSave(formData as SpecialOffer)
    }
  }

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{offer ? "Edit Special Offer" : "Add Special Offer"}</DialogTitle>
          <DialogDescription>
            Configure the special offer details and conditions
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="offer-title">Title</Label>
              <Input
                id="offer-title"
                value={formData.title || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter offer title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="offer-type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as SpecialOffer['type'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="promotion">Promotion</SelectItem>
                  <SelectItem value="loyalty">Loyalty Reward</SelectItem>
                  <SelectItem value="seasonal">Seasonal Campaign</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-description">Description</Label>
            <Input
              id="offer-description"
              value={formData.description || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter offer description"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount-type">Discount Type</Label>
              <Select
                value={formData.discountType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, discountType: value as SpecialOffer['discountType'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="bogo">Buy One Get One</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount-value">
                {formData.discountType === 'percentage' ? 'Percentage (%)' :
                 formData.discountType === 'fixed' ? 'Amount (QAR)' : 'BOGO Value'}
              </Label>
              <Input
                id="discount-value"
                type="number"
                value={formData.discountValue || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                placeholder={formData.discountType === 'percentage' ? '25' : '50'}
                disabled={formData.discountType === 'bogo'}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valid-from">Valid From</Label>
              <Input
                id="valid-from"
                type="date"
                value={formData.validFrom ? formatDateForInput(formData.validFrom) : ""}
                onChange={(e) => setFormData(prev => ({ ...prev, validFrom: new Date(e.target.value) }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid-to">Valid To</Label>
              <Input
                id="valid-to"
                type="date"
                value={formData.validTo ? formatDateForInput(formData.validTo) : ""}
                onChange={(e) => setFormData(prev => ({ ...prev, validTo: new Date(e.target.value) }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-amount">Minimum Amount (QAR) - Optional</Label>
              <Input
                id="min-amount"
                type="number"
                value={formData.conditions?.minAmount || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  conditions: {
                    ...prev.conditions,
                    minAmount: parseFloat(e.target.value) || undefined
                  }
                }))}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-uses">Maximum Uses - Optional</Label>
              <Input
                id="max-uses"
                type="number"
                value={formData.conditions?.maxUses || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  conditions: {
                    ...prev.conditions,
                    maxUses: parseInt(e.target.value) || undefined
                  }
                }))}
                placeholder="100"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              {offer ? "Update" : "Add"} Offer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
