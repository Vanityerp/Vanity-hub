"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { EditCategoryDialog } from "@/components/services/edit-category-dialog"
import { DeleteCategoryDialog } from "@/components/services/delete-category-dialog"
import { Edit, MoreHorizontal, Trash } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ServiceCategoriesProps {
  search: string
}

import { useServices } from "@/lib/service-provider"

export function ServiceCategories({ search }: ServiceCategoriesProps) {
  // Use real categories and services from service provider
  const { categories, services } = useServices()

  const [editingCategory, setEditingCategory] = useState<(typeof categories)[0] | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<(typeof categories)[0] | null>(null)

  // Calculate service counts for each category from real service data
  const categoriesWithCounts = categories.map(category => ({
    ...category,
    serviceCount: services.filter(service =>
      service.category === category.name
    ).length
  }))

  // Filter categories based on search term
  const filteredCategories = categoriesWithCounts.filter((category) => {
    if (
      search &&
      !category.name.toLowerCase().includes(search.toLowerCase()) &&
      !category.description.toLowerCase().includes(search.toLowerCase())
    ) {
      return false
    }
    return true
  })

  return (
    <>
      <Card>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Services</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No categories found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.description}</TableCell>
                    <TableCell className="text-right">{category.serviceCount}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit category
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingCategory(category)}
                            className="text-destructive focus:text-destructive"
                            disabled={category.serviceCount > 0}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete category
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {editingCategory && (
        <EditCategoryDialog
          category={editingCategory}
          open={!!editingCategory}
          onOpenChange={(open) => !open && setEditingCategory(null)}
        />
      )}

      {deletingCategory && (
        <DeleteCategoryDialog
          category={deletingCategory}
          open={!!deletingCategory}
          onOpenChange={(open) => !open && setDeletingCategory(null)}
        />
      )}
    </>
  )
}

