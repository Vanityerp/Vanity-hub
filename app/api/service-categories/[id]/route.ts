import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔄 Fetching category with ID: ${params.id}`)
    const categoryId = params.id

    // Convert ID back to category name (reverse of the ID creation logic)
    const categoryName = categoryId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

    // Get services for this category
    const services = await prisma.service.findMany({
      where: {
        category: categoryName,
        isActive: true
      }
    })

    if (services.length === 0) {
      // Check if any service has this exact category name
      const exactMatch = await prisma.service.findFirst({
        where: {
          category: {
            equals: categoryName,
            mode: 'insensitive'
          },
          isActive: true
        }
      })

      if (!exactMatch) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 })
      }
    }

    const category = {
      id: categoryId,
      name: categoryName,
      description: `${categoryName} services`,
      serviceCount: services.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    console.log(`✅ Successfully fetched category: ${categoryName} with ${services.length} services`)
    return NextResponse.json({ category, services })
  } catch (error) {
    console.error("❌ Error fetching service category:", error)
    return NextResponse.json({ error: "Failed to fetch service category" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔄 Updating category with ID: ${params.id}`)
    const categoryId = params.id
    const data = await request.json()

    if (!data.name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    // Convert ID back to category name
    const oldCategoryName = categoryId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

    // Update all services that have this category
    const updatedServices = await prisma.service.updateMany({
      where: {
        category: oldCategoryName,
        isActive: true
      },
      data: {
        category: data.name
      }
    })

    if (updatedServices.count === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    const category = {
      id: data.name.toLowerCase().replace(/\s+/g, '-'),
      name: data.name,
      description: data.description || `${data.name} services`,
      serviceCount: updatedServices.count,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    console.log(`✅ Successfully updated category: ${oldCategoryName} -> ${data.name}`)
    return NextResponse.json({ category })
  } catch (error) {
    console.error("❌ Error updating service category:", error)
    return NextResponse.json({ error: "Failed to update service category" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔄 Deleting category with ID: ${params.id}`)
    const categoryId = params.id

    // Convert ID back to category name
    const categoryName = categoryId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

    // Check if category has services
    const serviceCount = await prisma.service.count({
      where: {
        category: categoryName,
        isActive: true
      }
    })

    if (serviceCount > 0) {
      return NextResponse.json({
        error: `Cannot delete category with ${serviceCount} services. Please reassign or delete the services first.`
      }, { status: 400 })
    }

    // Since we don't have a separate categories table,
    // and there are no services with this category,
    // we can consider it "deleted"
    console.log(`✅ Successfully deleted category: ${categoryName}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Error deleting service category:", error)
    return NextResponse.json({ error: "Failed to delete service category" }, { status: 500 })
  }
}
