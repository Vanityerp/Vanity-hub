import { NextResponse } from "next/server"
import { salesRepository } from "@/lib/db"
import { getServerSession } from "next-auth"
import { PERMISSIONS } from "@/lib/permissions"

export async function GET(request: Request) {
  try {
    const sales = await salesRepository.findAll()
    return NextResponse.json({ sales })
  } catch (error) {
    console.error("Error fetching sales:", error)
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Check user session and permissions
    const session = await getServerSession()

    // If no session or user, return unauthorized
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user role from the session
    const userRole = session.user.role

    // Get the request data first
    const data = await request.json()

    // Special case for Receptionist role - always allow creating sales
    if (userRole !== 'receptionist') {
      // For other roles, check permissions from the database
      const { query } = await import("@/lib/db")
      const roleResult = await query(
        `SELECT permissions FROM roles WHERE id = $1`,
        [userRole]
      )

      let hasPermission = false

      // Check if user has the required permission
      if (roleResult.rows.length) {
        const permissions = roleResult.rows[0].permissions
        hasPermission = permissions.includes(PERMISSIONS.CREATE_SALE) || permissions.includes(PERMISSIONS.ALL)
      }

      if (!hasPermission) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 })
      }
    }

    // Validate required fields
    if (!data.locationId || !data.staffId || !data.items || !data.items.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get checkout settings for dynamic tax rate
    const { SettingsStorage } = await import("@/lib/settings-storage")
    const checkoutSettings = SettingsStorage.getCheckoutSettings()

    // Calculate totals
    const subtotal = data.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
    const taxRate = checkoutSettings.taxRate / 100 // Convert percentage to decimal
    const taxAmount = subtotal * taxRate
    const discountAmount = data.discountAmount || 0
    const tipAmount = data.tipAmount || 0
    const totalAmount = subtotal + taxAmount - discountAmount + tipAmount

    // Create sale
    const sale = await salesRepository.create(
      {
        client_id: data.clientId || null,
        staff_id: data.staffId,
        location_id: data.locationId,
        appointment_id: data.appointmentId || null,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        tip_amount: tipAmount,
        total_amount: totalAmount,
        payment_method: data.paymentMethod,
        payment_status: data.paymentStatus,
        notes: data.notes || null,
      },
      data.items.map((item: any) => ({
        item_type: item.type,
        service_id: item.type === "service" ? item.id : null,
        product_id: item.type === "product" ? item.id : null,
        quantity: item.quantity,
        unit_price: item.price,
        discount_amount: item.discountAmount || 0,
        tax_amount: item.price * item.quantity * taxRate,
        total_amount: item.price * item.quantity * (1 + taxRate) - (item.discountAmount || 0),
      })),
    )

    return NextResponse.json({
      success: true,
      sale,
    })
  } catch (error) {
    console.error("Error creating sale:", error)
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 })
  }
}

