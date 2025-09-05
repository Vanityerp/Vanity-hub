import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/test-inventory-alerts - Create test data for inventory alerts
export async function POST(request: Request) {
  try {
    console.log('🧪 Creating test data for inventory alerts...')
    
    // Get existing locations
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      take: 3
    })
    
    if (locations.length === 0) {
      return NextResponse.json({ error: "No locations found. Please seed locations first." }, { status: 400 })
    }
    
    console.log(`📍 Found ${locations.length} locations for testing`)
    
    // Create test products with low stock
    const testProducts = [
      {
        name: "Test Low Stock Shampoo",
        description: "Test product for inventory alerts",
        price: 25.99,
        cost: 12.50,
        category: "Hair Care",
        type: "Shampoo",
        sku: "TEST-SHAMP-001",
        isRetail: true,
        minStock: 10
      },
      {
        name: "Test Critical Stock Moisturizer",
        description: "Test product for critical stock alerts",
        price: 45.99,
        cost: 22.50,
        category: "Skin Care", 
        type: "Moisturizer",
        sku: "TEST-MOIST-001",
        isRetail: true,
        minStock: 15
      },
      {
        name: "Test Out of Stock Nail Polish",
        description: "Test product for out of stock alerts",
        price: 18.99,
        cost: 9.50,
        category: "Nail Care",
        type: "Nail Polish",
        sku: "TEST-NAIL-001", 
        isRetail: true,
        minStock: 5
      }
    ]
    
    const createdProducts = []
    
    for (const productData of testProducts) {
      // Create the product
      const product = await prisma.product.create({
        data: productData
      })
      
      console.log(`✅ Created test product: ${product.name}`)
      
      // Create product-location relationships with low stock
      for (let i = 0; i < locations.length; i++) {
        const location = locations[i]
        let stock = 0
        
        // Set different stock levels for testing
        if (product.name.includes("Low Stock")) {
          stock = Math.floor(Math.random() * 5) + 1 // 1-5 units (below minStock of 10)
        } else if (product.name.includes("Critical Stock")) {
          stock = Math.floor(Math.random() * 3) + 1 // 1-3 units (well below minStock of 15)
        } else if (product.name.includes("Out of Stock")) {
          stock = 0 // No stock
        }
        
        await prisma.productLocation.create({
          data: {
            productId: product.id,
            locationId: location.id,
            stock: stock,
            isActive: true
          }
        })
        
        console.log(`   📦 Added ${stock} units at ${location.name}`)
      }
      
      createdProducts.push({
        id: product.id,
        name: product.name,
        category: product.category,
        minStock: productData.minStock
      })
    }
    
    console.log('✅ Test inventory alert data created successfully')
    
    return NextResponse.json({
      success: true,
      message: "Test inventory alert data created successfully",
      products: createdProducts,
      locations: locations.map(loc => ({ id: loc.id, name: loc.name }))
    })
    
  } catch (error) {
    console.error('❌ Error creating test inventory alert data:', error)
    return NextResponse.json({ 
      error: "Failed to create test data",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// GET /api/test-inventory-alerts - Check current test data
export async function GET() {
  try {
    // Get test products
    const testProducts = await prisma.product.findMany({
      where: {
        name: {
          startsWith: "Test"
        }
      },
      include: {
        locations: {
          include: {
            location: true
          }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      testProductCount: testProducts.length,
      testProducts: testProducts.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        locations: product.locations.map(loc => ({
          locationName: loc.location.name,
          stock: loc.stock
        }))
      }))
    })
    
  } catch (error) {
    console.error('❌ Error checking test data:', error)
    return NextResponse.json({ 
      error: "Failed to check test data",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// DELETE /api/test-inventory-alerts - Clean up test data
export async function DELETE() {
  try {
    console.log('🧹 Cleaning up test inventory alert data...')
    
    // Delete test products (this will cascade to product locations)
    const result = await prisma.product.deleteMany({
      where: {
        name: {
          startsWith: "Test"
        }
      }
    })
    
    console.log(`✅ Deleted ${result.count} test products`)
    
    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} test products`,
      deletedCount: result.count
    })
    
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error)
    return NextResponse.json({ 
      error: "Failed to clean up test data",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
