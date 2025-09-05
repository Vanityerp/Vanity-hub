import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/products/categories/[id] - Delete a product category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if category exists
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has products
    if (existingCategory._count.products > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete category with products',
          message: `This category contains ${existingCategory._count.products} product(s). Please move or delete the products first.`
        },
        { status: 400 }
      );
    }

    // Delete the category
    await prisma.productCategory.delete({
      where: { id }
    });

    console.log(`✅ Deleted product category: ${existingCategory.name}`);
    return NextResponse.json({ 
      success: true,
      message: 'Category deleted successfully' 
    });

  } catch (error) {
    console.error('❌ Error deleting product category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}

// GET /api/products/categories/[id] - Get a specific category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const category = await prisma.productCategory.findUnique({
      where: { id },
      include: {
        products: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            sku: true
          }
        },
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ category });

  } catch (error) {
    console.error('❌ Error fetching product category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// PUT /api/products/categories/[id] - Update a category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    // Check if category exists
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if name is already taken by another category
    if (name && name !== existingCategory.name) {
      const nameExists = await prisma.productCategory.findFirst({
        where: {
          name,
          id: { not: id }
        }
      });

      if (nameExists) {
        return NextResponse.json(
          { error: 'Category name already exists' },
          { status: 400 }
        );
      }
    }

    // Update the category
    const updatedCategory = await prisma.productCategory.update({
      where: { id },
      data: {
        name: name || existingCategory.name,
        description: description !== undefined ? description : existingCategory.description,
        updatedAt: new Date()
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    console.log(`✅ Updated product category: ${updatedCategory.name}`);
    return NextResponse.json({ category: updatedCategory });

  } catch (error) {
    console.error('❌ Error updating product category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}
