import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("🧪 Testing inventory adjustment API...")
    
    // Get a sample product and location
    const product = await prisma.product.findFirst({
      where: { isActive: true }
    })
    
    const location = await prisma.location.findFirst({
      where: { isActive: true }
    })
    
    if (!product || !location) {
      return NextResponse.json({
        success: false,
        error: "No products or locations found for testing"
      })
    }
    
    console.log("📦 Test product:", product.name, product.id)
    console.log("📍 Test location:", location.name, location.id)
    
    // Check if product-location relationship exists
    let productLocation = await prisma.productLocation.findUnique({
      where: {
        productId_locationId: {
          productId: product.id,
          locationId: location.id
        }
      }
    })
    
    if (!productLocation) {
      console.log("📝 Creating test product-location relationship...")
      productLocation = await prisma.productLocation.create({
        data: {
          productId: product.id,
          locationId: location.id,
          stock: 10,
          isActive: true
        }
      })
    }
    
    console.log("🔗 Product-location relationship:", productLocation)
    
    return NextResponse.json({
      success: true,
      testData: {
        product: {
          id: product.id,
          name: product.name,
          category: product.category
        },
        location: {
          id: location.id,
          name: location.name
        },
        productLocation: {
          id: productLocation.id,
          stock: productLocation.stock
        }
      },
      testPayload: {
        productId: product.id,
        locationId: location.id,
        adjustmentType: "add",
        quantity: 1,
        reason: "purchase",
        notes: "API test"
      }
    })
    
  } catch (error) {
    console.error("❌ Test failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    console.log("🧪 Testing POST to inventory adjustment...")
    
    // Get test data first
    const testResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/test-inventory-adjust`)
    const testData = await testResponse.json()
    
    if (!testData.success) {
      throw new Error("Failed to get test data")
    }
    
    const payload = testData.testPayload
    console.log("📤 Test payload:", payload)
    
    // Make the actual API call
    const adjustResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/inventory/adjust`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
    
    console.log("📡 Adjust response status:", adjustResponse.status)
    
    const responseText = await adjustResponse.text()
    console.log("📡 Adjust response text:", responseText)
    
    let adjustResult
    try {
      adjustResult = JSON.parse(responseText)
    } catch (parseError) {
      adjustResult = { error: "Failed to parse response", rawResponse: responseText }
    }
    
    return NextResponse.json({
      success: adjustResponse.ok,
      testPayload: payload,
      adjustResponse: {
        status: adjustResponse.status,
        ok: adjustResponse.ok,
        data: adjustResult
      }
    })
    
  } catch (error) {
    console.error("❌ POST test failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
