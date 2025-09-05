"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useProducts } from "@/lib/product-provider"
import { ProductCategory, ProductType } from "@/lib/products-data"
import { Plus, Edit, Trash2, Package, Database, RefreshCw } from "lucide-react"

interface CategoryManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CategoryManagementDialog({ open, onOpenChange }: CategoryManagementDialogProps) {
  const { toast } = useToast()
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    getProductsByCategory,
    productTypes,
    addProductType,
    updateProductType,
    deleteProductType,
    getCategoryName,
    refreshCategories,
    refreshProductTypes
  } = useProducts()
  const [activeTab, setActiveTab] = useState("categories")
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null)
  const [editingType, setEditingType] = useState<ProductType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
    categoryId: "", // For product types
  })

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      isActive: true,
      categoryId: "",
    })
    setEditingCategory(null)
    setEditingType(null)
  }

  const handleEdit = (category: ProductCategory) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
      isActive: category.isActive,
      categoryId: "",
    })
    setActiveTab("category-form")
  }

  const handleEditType = (type: ProductType) => {
    setEditingType(type)
    setFormData({
      name: type.name,
      description: type.description || "",
      isActive: type.isActive,
      categoryId: type.category || "", // Use category name
    })
    setActiveTab("type-form")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingCategory) {
        // Update existing category
        const updatedCategory: ProductCategory = {
          ...editingCategory,
          name: formData.name,
          description: formData.description,
          isActive: formData.isActive,
          updatedAt: new Date(),
        }
        updateCategory(updatedCategory)

        toast({
          title: "Category updated",
          description: `${formData.name} has been updated successfully. Changes will be reflected across all sections.`,
        })

        console.log("Category updated:", {
          old: editingCategory.name,
          new: formData.name,
          id: editingCategory.id
        })
      } else if (editingType) {
        // Update existing product type
        const updatedType: ProductType = {
          ...editingType,
          name: formData.name,
          description: formData.description,
          isActive: formData.isActive,
          categoryId: formData.categoryId,
          updatedAt: new Date(),
        }
        updateProductType(updatedType)

        toast({
          title: "Product type updated",
          description: `${formData.name} has been updated successfully.`,
        })
      } else if (activeTab === "category-form") {
        // Create new category
        await addCategory({
          name: formData.name,
          description: formData.description,
          isActive: formData.isActive,
          productCount: 0,
        })
      } else if (activeTab === "type-form") {
        // Create new product type
        await addProductType({
          name: formData.name,
          description: formData.description,
          isActive: formData.isActive,
          category: formData.categoryId, // categoryId now contains the category name
          categoryId: formData.categoryId,
          productCount: 0,
        })
      }

      resetForm()
      setActiveTab(activeTab.includes("category") ? "categories" : "types")
    } catch (error) {
      console.error("Failed to save:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (category: ProductCategory) => {
    const productsInCategory = getProductsByCategory(category.name)

    if (productsInCategory.length > 0) {
      toast({
        variant: "destructive",
        title: "Cannot delete category",
        description: `This category contains ${productsInCategory.length} product(s). Please move or delete the products first.`,
      })
      return
    }

    if (window.confirm(`Are you sure you want to delete the category "${category.name}"?\n\nThis action cannot be undone.`)) {
      try {
        const success = await deleteCategory(category.id)
        if (success) {
          toast({
            title: "Category deleted",
            description: `${category.name} has been deleted successfully.`,
          })
          // Refresh categories to update the UI
          refreshCategories()
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to delete category. Please try again.",
          })
        }
      } catch (error) {
        console.error("Error deleting category:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete category. Please try again.",
        })
      }
    }
  }

  const handleDeleteType = async (type: ProductType) => {
    if (window.confirm(`Are you sure you want to delete the product type "${type.name}"?\n\nThis action cannot be undone.`)) {
      try {
        const success = await deleteProductType(type.id)
        if (success) {
          toast({
            title: "Product type deleted",
            description: `${type.name} has been deleted successfully.`,
          })
          // Refresh product types to update the UI
          refreshProductTypes()
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to delete product type. Please try again.",
          })
        }
      } catch (error) {
        console.error("Error deleting product type:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete product type. Please try again.",
        })
      }
    }
  }

  const handleSeedCategories = async () => {
    setIsSeeding(true)
    try {
      console.log('🌱 Seeding comprehensive beauty products...')
      const response = await fetch('/api/products/seed-comprehensive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to seed comprehensive products')
      }

      const data = await response.json()

      toast({
        title: "Comprehensive products seeded successfully",
        description: `Created ${data.created} new products, skipped ${data.skipped} existing products. Total: ${data.total} products across all beauty categories.`,
      })

      // Refresh the data
      refreshCategories()
      refreshProductTypes()
    } catch (error) {
      console.error('❌ Error seeding comprehensive products:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to seed comprehensive products",
      })
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Categories & Product Types</DialogTitle>
          <DialogDescription>
            Create, edit, and organize your product categories and types for better inventory management.
          </DialogDescription>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refreshCategories()
                refreshProductTypes()
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedCategories}
              disabled={isSeeding}
            >
              {isSeeding ? (
                <>
                  <Database className="h-4 w-4 mr-2 animate-spin" />
                  Seeding Products...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Seed Beauty Products
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="types">Product Types</TabsTrigger>
            <TabsTrigger value="category-form">
              {editingCategory ? "Edit Category" : "Add Category"}
            </TabsTrigger>
            <TabsTrigger value="type-form">
              {editingType ? "Edit Type" : "Add Type"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">All Categories ({categories.length})</h3>
              <Button
                onClick={() => {
                  resetForm()
                  setActiveTab("category-form")
                }}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>

            <div className="grid gap-3">
              {categories.map((category) => {
                const productsInCategory = getProductsByCategory(category.name)
                return (
                  <Card key={category.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{category.name}</h4>
                            {!category.isActive && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          {category.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {category.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {productsInCategory.length} products
                            </div>
                            <span>
                              Created {new Date(category.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(category)}
                            disabled={productsInCategory.length > 0}
                            className={productsInCategory.length > 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-destructive/10 hover:text-destructive"}
                            title={productsInCategory.length > 0 ? `Cannot delete: ${productsInCategory.length} products in this category` : "Delete category"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {categories.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No categories found</p>
                <p className="text-sm">Create your first category to get started</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="types" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">All Product Types ({productTypes.length})</h3>
              <Button
                onClick={() => {
                  resetForm()
                  setActiveTab("type-form")
                }}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product Type
              </Button>
            </div>

            <div className="grid gap-3">
              {productTypes.map((type) => (
                <Card key={type.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{type.name}</h4>
                          {!type.isActive && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                          {type.category && (
                            <Badge variant="outline" className="text-xs">
                              {type.category}
                            </Badge>
                          )}
                        </div>
                        {type.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {type.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {type.productCount} products
                          </div>
                          <span>
                            Created {new Date(type.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditType(type)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteType(type)}
                          className="hover:bg-destructive/10 hover:text-destructive"
                          title="Delete product type"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {productTypes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No product types found</p>
                <p className="text-sm">Create your first product type to get started</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="category-form" className="space-y-4 mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Category Name *</Label>
                <Input
                  id="categoryName"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  placeholder="Enter category name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryDescription">Description</Label>
                <Textarea
                  id="categoryDescription"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                  placeholder="Describe this category (optional)"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleChange("isActive", checked)}
                />
                <Label htmlFor="isActive">Active (visible in product forms)</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm()
                    setActiveTab("categories")
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting
                    ? "Saving..."
                    : editingCategory
                    ? "Update Category"
                    : "Create Category"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="type-form" className="space-y-4 mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="typeName">Product Type Name *</Label>
                <Input
                  id="typeName"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  placeholder="Enter product type name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="typeCategory">Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => handleChange("categoryId", value)}
                >
                  <SelectTrigger id="typeCategory">
                    <SelectValue placeholder="Select a category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter(cat => cat.isActive)
                      .map((category, index) => (
                        <SelectItem key={`category-${category.id}-${category.name}-${index}`} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="typeDescription">Description</Label>
                <Textarea
                  id="typeDescription"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                  placeholder="Describe this product type (optional)"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActiveType"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleChange("isActive", checked)}
                />
                <Label htmlFor="isActiveType">Active (visible in product forms)</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm()
                    setActiveTab("types")
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting
                    ? "Saving..."
                    : editingType
                    ? "Update Product Type"
                    : "Create Product Type"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
