import { NextResponse } from "next/server"
import { initializeDatabase } from "@/lib/db"

// Simple hash function (temporary replacement for bcrypt)
const hashPassword = async (password: string) => {
  // In a real app, this would use bcrypt.hash
  // This is just a temporary workaround for the build
  return `hashed_${password}` // Simple prefix to simulate hashing
}

export async function GET() {
  try {
    // Initialize database schema
    await initializeDatabase()

    // Create default admin user
    const hashedPassword = await hashPassword("admin123")

    // Insert default data
    await seedDatabase(hashedPassword)

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
    })
  } catch (error) {
    console.error("Failed to initialize database:", error)
    return NextResponse.json({ success: false, error: "Failed to initialize database" }, { status: 500 })
  }
}

async function seedDatabase(adminPasswordHash: string) {
  const { query } = await import("@/lib/db")

  // Create locations
  const locationsResult = await query(`
    INSERT INTO locations (name, address, city, state, zip, phone, email)
    VALUES
      ('Downtown', '123 Main St', 'New York', 'NY', '10001', '(212) 555-1234', 'downtown@vanity.com'),
      ('Westside', '456 Ocean Ave', 'Los Angeles', 'CA', '90001', '(310) 555-5678', 'westside@vanity.com'),
      ('Northside', '789 Lake Rd', 'Chicago', 'IL', '60001', '(312) 555-9012', 'northside@vanity.com')
    RETURNING id
  `)

  const locationIds = locationsResult.rows.map((row) => row.id)

  // Create users
  const usersResult = await query(
    `
    INSERT INTO users (name, email, password_hash, role)
    VALUES
      ('Admin User', 'admin@vanity.com', $1, 'super_admin'),
      ('Manager Downtown', 'manager1@vanity.com', $1, 'location_manager'),
      ('Manager Westside', 'manager2@vanity.com', $1, 'location_manager'),
      ('Manager Northside', 'manager3@vanity.com', $1, 'location_manager'),
      ('Stylist One', 'stylist1@vanity.com', $1, 'staff'),
      ('Stylist Two', 'stylist2@vanity.com', $1, 'staff'),
      ('Stylist Three', 'stylist3@vanity.com', $1, 'staff'),
      ('Receptionist', 'receptionist@vanity.com', $1, 'receptionist')
    RETURNING id
  `,
    [adminPasswordHash],
  )

  const userIds = usersResult.rows.map((row) => row.id)

  // Assign users to locations
  await query(
    `
    INSERT INTO user_locations (user_id, location_id)
    VALUES
      ($1, $4), -- Admin to all locations
      ($1, $5),
      ($1, $6),
      ($2, $4), -- Manager 1 to Downtown
      ($3, $5), -- Manager 2 to Westside
      ($4, $6), -- Manager 3 to Northside
      ($5, $4), -- Stylist 1 to Downtown
      ($6, $5), -- Stylist 2 to Westside
      ($7, $6), -- Stylist 3 to Northside
      ($8, $4), -- Receptionist to Downtown
      ($8, $5)  -- Receptionist to Westside
  `,
    [userIds[0], userIds[1], userIds[2], locationIds[0], locationIds[1], locationIds[2]],
  )

  // Create service categories
  const categoriesResult = await query(`
    INSERT INTO service_categories (name, description)
    VALUES
      ('Hair', 'Haircuts, styling, and treatments'),
      ('Color', 'Hair coloring services'),
      ('Nails', 'Manicure and pedicure services'),
      ('Skin', 'Facial and skin treatments'),
      ('Massage', 'Massage therapy services')
    RETURNING id
  `)

  const categoryIds = categoriesResult.rows.map((row) => row.id)

  // Create services
  const servicesResult = await query(
    `
    INSERT INTO services (name, description, duration, price, category_id)
    VALUES
      ('Haircut & Style', 'Professional haircut and styling', 60, 75, $1),
      ('Color & Highlights', 'Full color or highlights', 120, 150, $2),
      ('Men''s Haircut', 'Haircut for men', 45, 55, $1),
      ('Manicure & Pedicure', 'Full manicure and pedicure treatment', 90, 95, $3),
      ('Beard Trim', 'Professional beard trimming', 30, 35, $1),
      ('Facial Treatment', 'Rejuvenating facial treatment', 60, 85, $4)
    RETURNING id
  `,
    [categoryIds[0], categoryIds[1], categoryIds[2], categoryIds[3]],
  )

  const serviceIds = servicesResult.rows.map((row) => row.id)

  // Assign services to locations
  await query(
    `
    INSERT INTO service_locations (service_id, location_id)
    VALUES
      ($1, $7), -- Haircut & Style to all locations
      ($1, $8),
      ($1, $9),
      ($2, $7), -- Color & Highlights to all locations
      ($2, $8),
      ($2, $9),
      ($3, $7), -- Men's Haircut to all locations
      ($3, $8),
      ($3, $9),
      ($4, $8), -- Manicure & Pedicure to Westside only
      ($5, $7), -- Beard Trim to Downtown and Northside
      ($5, $9),
      ($6, $8), -- Facial Treatment to Westside and Northside
      ($6, $9)
  `,
    [
      serviceIds[0],
      serviceIds[1],
      serviceIds[2],
      serviceIds[3],
      serviceIds[4],
      serviceIds[5],
      locationIds[0],
      locationIds[1],
      locationIds[2],
    ],
  )

  // Create inventory categories
  const invCategoriesResult = await query(`
    INSERT INTO inventory_categories (name, description)
    VALUES
      ('Hair Care', 'Shampoo, conditioner, and treatments'),
      ('Styling', 'Styling products and tools'),
      ('Color', 'Hair color products'),
      ('Skin Care', 'Facial and skin care products'),
      ('Nail Care', 'Nail polish and treatments')
    RETURNING id
  `)

  const invCategoryIds = invCategoriesResult.rows.map((row) => row.id)

  // Create products
  const productsResult = await query(
    `
    INSERT INTO products (name, description, sku, barcode, category_id, retail_price, cost_price, is_retail)
    VALUES
      ('Shampoo - Professional', 'Professional grade shampoo', 'SH-001', '123456789', $1, 24.99, 12.50, true),
      ('Conditioner - Professional', 'Professional grade conditioner', 'CO-001', '234567890', $1, 22.99, 11.25, true),
      ('Hair Color - Blonde', 'Professional hair color', 'HC-001', '345678901', $3, NULL, 15.75, false),
      ('Hair Color - Brown', 'Professional hair color', 'HC-002', '456789012', $3, NULL, 15.75, false),
      ('Styling Gel', 'Strong hold styling gel', 'SG-001', '567890123', $2, 18.99, 9.50, true),
      ('Hair Spray', 'Flexible hold hair spray', 'HS-001', '678901234', $2, 16.99, 8.25, true)
    RETURNING id
  `,
    [invCategoryIds[0], invCategoryIds[1], invCategoryIds[2]],
  )

  const productIds = productsResult.rows.map((row) => row.id)

  // Set up inventory for each location
  for (const locationId of locationIds) {
    for (const productId of productIds) {
      const quantity = Math.floor(Math.random() * 30) + 10
      const minStock = Math.floor(Math.random() * 5) + 5
      const maxStock = minStock + Math.floor(Math.random() * 20) + 10

      await query(
        `
        INSERT INTO inventory (product_id, location_id, quantity, min_stock_level, max_stock_level)
        VALUES ($1, $2, $3, $4, $5)
      `,
        [productId, locationId, quantity, minStock, maxStock],
      )
    }
  }

  // Initialize default chat channels
  const channelsResult = await query(`
    INSERT INTO chat_channels (name, description, type, created_by)
    VALUES
      ('General', 'General workplace communication', 'general', $1),
      ('Help Desk', 'Ask questions about procedures and policies', 'help_desk', $1),
      ('Product Requests', 'Request inventory items and check availability', 'product_requests', $1)
    RETURNING id
  `, [userIds[0]]) // Admin user creates default channels

  // Initialize user presence for all users
  for (const userId of userIds) {
    await query(`
      INSERT INTO user_presence (user_id, status, current_location_id)
      VALUES ($1, 'offline', $2)
    `, [userId, locationIds[0]])
  }

  // Create clients
  const clientsResult = await query(
    `
    INSERT INTO clients (name, email, phone, address, notes, preferred_location_id)
    VALUES
      ('Jane Smith', 'jane.smith@example.com', '(555) 123-4567', '123 Client St, New York, NY', 'Prefers afternoon appointments', $1),
      ('John Doe', 'john.doe@example.com', '(555) 234-5678', '456 Customer Ave, Los Angeles, CA', 'Allergic to certain products', $2),
      ('Robert Brown', 'robert.brown@example.com', '(555) 345-6789', '789 Patron Rd, Chicago, IL', 'Prefers stylist #3', $3),
      ('Emily Wilson', 'emily.wilson@example.com', '(555) 456-7890', '101 Guest Blvd, New York, NY', 'VIP client', $1),
      ('Michael Johnson', 'michael.johnson@example.com', '(555) 567-8901', '202 Visitor Ln, Los Angeles, CA', 'New client', $2)
    RETURNING id
  `,
    [locationIds[0], locationIds[1], locationIds[2]],
  )

  const clientIds = clientsResult.rows.map((row) => row.id)

  // Assign clients to locations
  await query(
    `
    INSERT INTO client_locations (client_id, location_id)
    VALUES
      ($1, $6), -- Jane to Downtown
      ($2, $7), -- John to Westside
      ($3, $8), -- Robert to Northside
      ($4, $6), -- Emily to Downtown
      ($5, $7)  -- Michael to Westside
  `,
    [
      clientIds[0],
      clientIds[1],
      clientIds[2],
      clientIds[3],
      clientIds[4],
      locationIds[0],
      locationIds[1],
      locationIds[2],
    ],
  )

  // Create some appointments
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  await query(
    `
    INSERT INTO appointments (client_id, staff_id, service_id, location_id, start_time, end_time, status, notes)
    VALUES
      ($1, $6, $11, $16, $21, $22, 'confirmed', 'First time with this stylist'),
      ($2, $7, $12, $17, $23, $24, 'confirmed', 'Regular client'),
      ($3, $8, $13, $18, $25, $26, 'confirmed', 'Requested specific products'),
      ($4, $6, $14, $16, $27, $28, 'confirmed', 'VIP treatment'),
      ($5, $7, $15, $17, $29, $30, 'confirmed', 'New client consultation')
  `,
    [
      clientIds[0],
      clientIds[1],
      clientIds[2],
      clientIds[3],
      clientIds[4], // client_ids
      userIds[4],
      userIds[5],
      userIds[6],
      userIds[4],
      userIds[5], // staff_ids
      serviceIds[0],
      serviceIds[1],
      serviceIds[2],
      serviceIds[3],
      serviceIds[4], // service_ids
      locationIds[0],
      locationIds[1],
      locationIds[2],
      locationIds[0],
      locationIds[1], // location_ids
      new Date(today.setHours(10, 0, 0, 0)),
      new Date(today.setHours(11, 0, 0, 0)), // appointment 1 times
      new Date(today.setHours(13, 0, 0, 0)),
      new Date(today.setHours(15, 0, 0, 0)), // appointment 2 times
      new Date(today.setHours(14, 0, 0, 0)),
      new Date(today.setHours(14, 45, 0, 0)), // appointment 3 times
      new Date(tomorrow.setHours(11, 0, 0, 0)),
      new Date(tomorrow.setHours(12, 30, 0, 0)), // appointment 4 times
      new Date(tomorrow.setHours(15, 0, 0, 0)),
      new Date(tomorrow.setHours(16, 0, 0, 0)), // appointment 5 times
    ],
  )
}

