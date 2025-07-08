import { NextResponse } from "next/server"
import { productsRepository } from "@/lib/db"
import { PaymentMethod } from "@/lib/transaction-types"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.productId || !data.locationId || !data.quantity || !data.retailPrice) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const productId = Number.parseInt(data.productId)
    const locationId = Number.parseInt(data.locationId)
    const quantity = Number.parseInt(data.quantity)
    const retailPrice = Number.parseFloat(data.retailPrice)
    const costPrice = Number.parseFloat(data.costPrice) || 0
    const paymentMethod = data.paymentMethod as PaymentMethod || PaymentMethod.CREDIT_CARD

    // Get product details
    const { query } = await import("@/lib/db")
    
    const productResult = await query(
      `SELECT name, cost_price FROM products WHERE id = $1`,
      [productId]
    )

    if (productResult.rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const product = productResult.rows[0]
    const actualCostPrice = costPrice || product.cost_price || 0
    const productName = product.name

    // Check inventory availability
    const inventoryResult = await query(
      `SELECT quantity FROM inventory WHERE product_id = $1 AND location_id = $2`,
      [productId, locationId]
    )

    if (inventoryResult.rows.length === 0 || inventoryResult.rows[0].quantity < quantity) {
      return NextResponse.json({ error: "Insufficient inventory" }, { status: 400 })
    }

    // Update inventory
    const updatedInventory = await productsRepository.updateInventory(productId, locationId, -quantity)

    // Calculate financial metrics
    const totalCost = actualCostPrice * quantity
    const totalRevenue = retailPrice * quantity
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0

    // Record inventory transaction
    const inventoryTransactionResult = await query(
      `INSERT INTO inventory_transactions 
        (product_id, location_id, quantity, transaction_type, notes, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [productId, locationId, -quantity, "sale", `Product sale - ${quantity}x ${productName}`, data.userId || null]
    )

    const inventoryTransactionId = inventoryTransactionResult.rows[0].id

    // Create sales record
    const salesResult = await query(
      `INSERT INTO sales 
        (client_id, staff_id, location_id, subtotal, tax_amount, total_amount, payment_method, payment_status, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        data.clientId || null,
        data.staffId || null,
        locationId,
        totalRevenue,
        0, // Tax calculation would go here
        totalRevenue,
        paymentMethod,
        'paid',
        `Product sale: ${quantity}x ${productName}`
      ]
    )

    const saleId = salesResult.rows[0].id

    // Create sale items
    await query(
      `INSERT INTO sale_items 
        (sale_id, product_id, item_type, quantity, unit_price, total_price) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [saleId, productId, 'product', quantity, retailPrice, totalRevenue]
    )

    // Create financial transactions
    const transactions = []

    // 1. Revenue transaction
    const revenueTransactionResult = await query(
      `INSERT INTO financial_transactions 
        (date, type, category, description, amount, payment_method, status, location_id, source, 
         client_id, staff_id, product_id, quantity, cost_price, retail_price, profit_margin, 
         inventory_transaction_id, reference_type, reference_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) 
       RETURNING id`,
      [
        new Date(),
        'inventory_sale',
        'Product Sales',
        `Sale of ${quantity}x ${productName}`,
        totalRevenue,
        paymentMethod,
        'completed',
        locationId,
        'pos',
        data.clientId || null,
        data.staffId || null,
        productId,
        quantity,
        actualCostPrice,
        retailPrice,
        profitMargin,
        inventoryTransactionId,
        'sale',
        saleId
      ]
    )

    transactions.push({
      id: revenueTransactionResult.rows[0].id,
      type: 'revenue',
      amount: totalRevenue
    })

    // 2. COGS transaction
    const cogsTransactionResult = await query(
      `INSERT INTO financial_transactions 
        (date, type, category, description, amount, payment_method, status, location_id, source, 
         product_id, quantity, cost_price, retail_price, profit_margin, 
         inventory_transaction_id, reference_type, reference_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) 
       RETURNING id`,
      [
        new Date(),
        'cogs',
        'Cost of Goods Sold',
        `COGS for ${quantity}x ${productName}`,
        totalCost,
        'other',
        'completed',
        locationId,
        'system',
        productId,
        quantity,
        actualCostPrice,
        retailPrice,
        profitMargin,
        inventoryTransactionId,
        'sale',
        saleId
      ]
    )

    transactions.push({
      id: cogsTransactionResult.rows[0].id,
      type: 'cogs',
      amount: totalCost
    })

    return NextResponse.json({
      success: true,
      sale: {
        id: saleId,
        productId,
        productName,
        quantity,
        retailPrice,
        costPrice: actualCostPrice,
        totalRevenue,
        totalCost,
        profitMargin,
        inventoryTransactionId
      },
      inventory: updatedInventory,
      transactions
    })
  } catch (error) {
    console.error("Error processing product sale:", error)
    return NextResponse.json({ error: "Failed to process product sale" }, { status: 500 })
  }
}

// Get product sales analytics
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const locationId = searchParams.get("locationId")

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 })
    }

    const { query } = await import("@/lib/db")

    // Get product sales data
    let salesQuery = `
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.category_id,
        SUM(si.quantity) as total_quantity,
        SUM(si.total_price) as total_revenue,
        AVG(si.unit_price) as avg_price,
        COUNT(DISTINCT s.id) as transaction_count
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN products p ON si.product_id = p.id
      WHERE s.created_at >= $1 AND s.created_at <= $2
        AND si.item_type = 'product'
    `

    const params = [startDate, endDate]

    if (locationId) {
      salesQuery += ` AND s.location_id = $3`
      params.push(locationId)
    }

    salesQuery += `
      GROUP BY p.id, p.name, p.category_id
      ORDER BY total_revenue DESC
    `

    const salesResult = await query(salesQuery, params)

    // Get inventory analytics
    let analyticsQuery = `
      SELECT 
        SUM(CASE WHEN ft.type = 'inventory_sale' THEN ft.amount ELSE 0 END) as total_product_revenue,
        SUM(CASE WHEN ft.type = 'cogs' THEN ft.amount ELSE 0 END) as total_cogs,
        COUNT(CASE WHEN ft.type = 'inventory_sale' THEN 1 END) as total_sales_count
      FROM financial_transactions ft
      WHERE ft.date >= $1 AND ft.date <= $2
        AND ft.type IN ('inventory_sale', 'cogs')
    `

    if (locationId) {
      analyticsQuery += ` AND ft.location_id = $3`
    }

    const analyticsResult = await query(analyticsQuery, params)
    const analytics = analyticsResult.rows[0]

    const totalProfit = (analytics.total_product_revenue || 0) - (analytics.total_cogs || 0)
    const profitMargin = analytics.total_product_revenue > 0 
      ? (totalProfit / analytics.total_product_revenue) * 100 
      : 0

    return NextResponse.json({
      productSales: salesResult.rows,
      analytics: {
        totalRevenue: analytics.total_product_revenue || 0,
        totalCOGS: analytics.total_cogs || 0,
        totalProfit,
        profitMargin,
        salesCount: analytics.total_sales_count || 0
      }
    })
  } catch (error) {
    console.error("Error fetching product sales analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
