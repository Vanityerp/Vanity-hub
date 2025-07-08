import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/products/types/[id] - Delete a product type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if type exists
    const existingType = await prisma.productType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    if (!existingType) {
      return NextResponse.json(
        { error: 'Product type not found' },
        { status: 404 }
      );
    }

    // Check if type has products
    if (existingType._count.products > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete product type with products',
          message: `This type is used by ${existingType._count.products} product(s). Please change the product types first.`
        },
        { status: 400 }
      );
    }

    // Delete the type
    await prisma.productType.delete({
      where: { id }
    });

    console.log(`✅ Deleted product type: ${existingType.name}`);
    return NextResponse.json({ 
      success: true,
      message: 'Product type deleted successfully' 
    });

  } catch (error) {
    console.error('❌ Error deleting product type:', error);
    return NextResponse.json(
      { error: 'Failed to delete product type' },
      { status: 500 }
    );
  }
}

// GET /api/products/types/[id] - Get a specific product type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const productType = await prisma.productType.findUnique({
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

    if (!productType) {
      return NextResponse.json(
        { error: 'Product type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ productType });

  } catch (error) {
    console.error('❌ Error fetching product type:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product type' },
      { status: 500 }
    );
  }
}

// PUT /api/products/types/[id] - Update a product type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, categoryId } = body;

    // Check if type exists
    const existingType = await prisma.productType.findUnique({
      where: { id }
    });

    if (!existingType) {
      return NextResponse.json(
        { error: 'Product type not found' },
        { status: 404 }
      );
    }

    // Check if name is already taken by another type
    if (name && name !== existingType.name) {
      const nameExists = await prisma.productType.findFirst({
        where: {
          name,
          id: { not: id }
        }
      });

      if (nameExists) {
        return NextResponse.json(
          { error: 'Product type name already exists' },
          { status: 400 }
        );
      }
    }

    // Update the type
    const updatedType = await prisma.productType.update({
      where: { id },
      data: {
        name: name || existingType.name,
        description: description !== undefined ? description : existingType.description,
        categoryId: categoryId !== undefined ? categoryId : existingType.categoryId,
        updatedAt: new Date()
      },
      include: {
        category: true,
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    console.log(`✅ Updated product type: ${updatedType.name}`);
    return NextResponse.json({ productType: updatedType });

  } catch (error) {
    console.error('❌ Error updating product type:', error);
    return NextResponse.json(
      { error: 'Failed to update product type' },
      { status: 500 }
    );
  }
}
