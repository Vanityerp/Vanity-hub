import { Pool } from "pg"

// Database connection pool - always use database (no mock data)
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
  ssl: true,
})

// Helper function to execute SQL queries
export async function query(text: string, params?: any[]) {
  const start = Date.now()
  try {
    if (!pool) throw new Error("Database connection not initialized")
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log("Executed query", { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error("Error executing query", { text, error })
    throw error
  }
}

// Database schema initialization
export async function initializeDatabase() {
  // Users and authentication tables
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Locations table
  await query(`
    CREATE TABLE IF NOT EXISTS locations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      address VARCHAR(255),
      city VARCHAR(100),
      state VARCHAR(100),
      zip VARCHAR(20),
      phone VARCHAR(20),
      email VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // User-location relationship (for multi-location access)
  await query(`
    CREATE TABLE IF NOT EXISTS user_locations (
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, location_id)
    )
  `)

  // Clients table
  await query(`
    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(20),
      address VARCHAR(255),
      notes TEXT,
      preferred_location_id INTEGER REFERENCES locations(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Client-location relationship (for multi-location clients)
  await query(`
    CREATE TABLE IF NOT EXISTS client_locations (
      client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
      PRIMARY KEY (client_id, location_id)
    )
  `)

  // Client preferences table
  await query(`
    CREATE TABLE IF NOT EXISTS client_preferences (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      preferences JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Service categories
  await query(`
    CREATE TABLE IF NOT EXISTS service_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Services table
  await query(`
    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      duration INTEGER NOT NULL, -- in minutes
      price DECIMAL(10, 2) NOT NULL,
      category_id INTEGER REFERENCES service_categories(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Service-location relationship (for location-specific services)
  await query(`
    CREATE TABLE IF NOT EXISTS service_locations (
      service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
      location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
      price DECIMAL(10, 2), -- location-specific price override
      PRIMARY KEY (service_id, location_id)
    )
  `)

  // Staff-service relationship (for staff capabilities)
  await query(`
    CREATE TABLE IF NOT EXISTS staff_services (
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, service_id)
    )
  `)

  // Appointments table
  await query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES clients(id),
      staff_id INTEGER REFERENCES users(id),
      service_id INTEGER REFERENCES services(id),
      location_id INTEGER REFERENCES locations(id),
      start_time TIMESTAMP WITH TIME ZONE NOT NULL,
      end_time TIMESTAMP WITH TIME ZONE NOT NULL,
      status VARCHAR(50) NOT NULL, -- confirmed, completed, cancelled, no-show
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Inventory categories
  await query(`
    CREATE TABLE IF NOT EXISTS inventory_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Products table (for inventory)
  await query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      sku VARCHAR(50),
      barcode VARCHAR(50),
      category_id INTEGER REFERENCES inventory_categories(id),
      retail_price DECIMAL(10, 2),
      cost_price DECIMAL(10, 2),
      is_retail BOOLEAN DEFAULT true, -- retail or professional use
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Inventory table (stock levels per location)
  await query(`
    CREATE TABLE IF NOT EXISTS inventory (
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 0,
      min_stock_level INTEGER DEFAULT 0,
      max_stock_level INTEGER DEFAULT 0,
      PRIMARY KEY (product_id, location_id)
    )
  `)

  // Inventory transactions
  await query(`
    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id),
      location_id INTEGER REFERENCES locations(id),
      quantity INTEGER NOT NULL, -- positive for additions, negative for removals
      transaction_type VARCHAR(50) NOT NULL, -- purchase, sale, adjustment, transfer
      reference_id INTEGER, -- can reference a sale, purchase order, etc.
      notes TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Financial transactions table for comprehensive accounting
  await query(`
    CREATE TABLE IF NOT EXISTS financial_transactions (
      id SERIAL PRIMARY KEY,
      date TIMESTAMP WITH TIME ZONE NOT NULL,
      type VARCHAR(50) NOT NULL, -- income, expense, inventory_sale, inventory_purchase, cogs, etc.
      category VARCHAR(100) NOT NULL,
      description TEXT,
      amount DECIMAL(10, 2) NOT NULL,
      payment_method VARCHAR(50),
      status VARCHAR(50) NOT NULL DEFAULT 'completed',
      location_id INTEGER REFERENCES locations(id),
      source VARCHAR(50) NOT NULL, -- pos, calendar, manual, inventory, online, system
      client_id INTEGER REFERENCES clients(id),
      staff_id INTEGER REFERENCES users(id),
      -- Inventory-specific fields
      product_id INTEGER REFERENCES products(id),
      quantity INTEGER,
      cost_price DECIMAL(10, 2),
      retail_price DECIMAL(10, 2),
      profit_margin DECIMAL(5, 2),
      inventory_transaction_id INTEGER REFERENCES inventory_transactions(id),
      -- Reference fields
      reference_type VARCHAR(50), -- sale, appointment, purchase_order, etc.
      reference_id INTEGER,
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create indexes for better performance
  await query(`
    CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(date);
    CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(type);
    CREATE INDEX IF NOT EXISTS idx_financial_transactions_location ON financial_transactions(location_id);
    CREATE INDEX IF NOT EXISTS idx_financial_transactions_product ON financial_transactions(product_id);
    CREATE INDEX IF NOT EXISTS idx_financial_transactions_reference ON financial_transactions(reference_type, reference_id);
  `)

  // Purchase orders
  await query(`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id SERIAL PRIMARY KEY,
      supplier VARCHAR(255) NOT NULL,
      location_id INTEGER REFERENCES locations(id),
      status VARCHAR(50) NOT NULL, -- draft, ordered, received, cancelled
      order_date TIMESTAMP WITH TIME ZONE,
      expected_delivery_date TIMESTAMP WITH TIME ZONE,
      received_date TIMESTAMP WITH TIME ZONE,
      total_amount DECIMAL(10, 2),
      notes TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Purchase order items
  await query(`
    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id SERIAL PRIMARY KEY,
      purchase_order_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      quantity INTEGER NOT NULL,
      unit_cost DECIMAL(10, 2) NOT NULL,
      received_quantity INTEGER DEFAULT 0
    )
  `)

  // Sales/transactions
  await query(`
    CREATE TABLE IF NOT EXISTS sales (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES clients(id),
      staff_id INTEGER REFERENCES users(id),
      location_id INTEGER REFERENCES locations(id),
      appointment_id INTEGER REFERENCES appointments(id),
      subtotal DECIMAL(10, 2) NOT NULL,
      tax_amount DECIMAL(10, 2) NOT NULL,
      discount_amount DECIMAL(10, 2) DEFAULT 0,
      tip_amount DECIMAL(10, 2) DEFAULT 0,
      total_amount DECIMAL(10, 2) NOT NULL,
      payment_method VARCHAR(50),
      payment_status VARCHAR(50) NOT NULL, -- paid, partial, unpaid
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Sale items
  await query(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id SERIAL PRIMARY KEY,
      sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
      item_type VARCHAR(50) NOT NULL, -- service or product
      service_id INTEGER REFERENCES services(id),
      product_id INTEGER REFERENCES products(id),
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10, 2) NOT NULL,
      discount_amount DECIMAL(10, 2) DEFAULT 0,
      tax_amount DECIMAL(10, 2) NOT NULL,
      total_amount DECIMAL(10, 2) NOT NULL
    )
  `)

  // Payments
  await query(`
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
      amount DECIMAL(10, 2) NOT NULL,
      payment_method VARCHAR(50) NOT NULL,
      payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      reference_number VARCHAR(100),
      notes TEXT,
      created_by INTEGER REFERENCES users(id)
    )
  `)

  // Chat system tables
  await query(`
    CREATE TABLE IF NOT EXISTS chat_channels (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      type VARCHAR(50) NOT NULL DEFAULT 'general', -- general, help_desk, product_requests, location_specific
      location_id INTEGER REFERENCES locations(id), -- NULL for global channels
      is_private BOOLEAN DEFAULT false,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Chat channel members (for private channels and permissions)
  await query(`
    CREATE TABLE IF NOT EXISTS chat_channel_members (
      channel_id INTEGER REFERENCES chat_channels(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) DEFAULT 'member', -- admin, moderator, member
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (channel_id, user_id)
    )
  `)

  // Chat messages
  await query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id SERIAL PRIMARY KEY,
      channel_id INTEGER REFERENCES chat_channels(id) ON DELETE CASCADE,
      sender_id INTEGER REFERENCES users(id),
      message_type VARCHAR(50) DEFAULT 'text', -- text, product_request, help_request, system, file
      content TEXT NOT NULL,
      metadata JSONB, -- for storing additional data like product info, file attachments, etc.
      reply_to_id INTEGER REFERENCES chat_messages(id), -- for threaded conversations
      is_edited BOOLEAN DEFAULT false,
      edited_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Chat message reactions
  await query(`
    CREATE TABLE IF NOT EXISTS chat_message_reactions (
      id SERIAL PRIMARY KEY,
      message_id INTEGER REFERENCES chat_messages(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      reaction VARCHAR(50) NOT NULL, -- emoji or reaction type
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(message_id, user_id, reaction)
    )
  `)

  // Chat notifications
  await query(`
    CREATE TABLE IF NOT EXISTS chat_notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      message_id INTEGER REFERENCES chat_messages(id) ON DELETE CASCADE,
      channel_id INTEGER REFERENCES chat_channels(id) ON DELETE CASCADE,
      notification_type VARCHAR(50) NOT NULL, -- mention, direct_message, channel_message, system
      is_read BOOLEAN DEFAULT false,
      read_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // User presence/status
  await query(`
    CREATE TABLE IF NOT EXISTS user_presence (
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
      status VARCHAR(50) DEFAULT 'offline', -- online, away, busy, offline
      last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      current_location_id INTEGER REFERENCES locations(id),
      status_message TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create indexes for chat system performance
  await query(`
    CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_chat_notifications_user ON chat_notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_notifications_unread ON chat_notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
  `)

  console.log("Database schema initialized successfully")
}

// Export database models/repositories
export const usersRepository = {
  findByEmail: async (email: string) => {
    const result = await query("SELECT * FROM users WHERE email = $1", [email])
    return result.rows[0]
  },

  findById: async (id: number) => {
    const result = await query("SELECT * FROM users WHERE id = $1", [id])
    return result.rows[0]
  },

  create: async (user: any) => {
    const { name, email, password_hash, role } = user
    const result = await query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, password_hash, role],
    )
    return result.rows[0]
  },

  getUserLocations: async (userId: number) => {
    const result = await query(
      `
      SELECT l.* FROM locations l
      JOIN user_locations ul ON l.id = ul.location_id
      WHERE ul.user_id = $1
    `,
      [userId],
    )
    return result.rows
  },
}

export const locationsRepository = {
  findAll: async () => {
    const result = await query("SELECT * FROM locations ORDER BY name")
    return result.rows
  },

  findById: async (id: number) => {
    const result = await query("SELECT * FROM locations WHERE id = $1", [id])
    return result.rows[0]
  },

  create: async (location: any) => {
    const { name, address, city, state, zip, phone, email } = location
    const result = await query(
      "INSERT INTO locations (name, address, city, state, zip, phone, email) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [name, address, city, state, zip, phone, email],
    )
    return result.rows[0]
  },
}

export const clientsRepository = {
  findAll: async () => {
    const result = await query("SELECT * FROM clients ORDER BY name")
    return result.rows
  },

  findById: async (id: number) => {
    const result = await query("SELECT * FROM clients WHERE id = $1", [id])
    return result.rows[0]
  },

  findByLocation: async (locationId: number) => {
    const result = await query(
      `
      SELECT c.* FROM clients c
      JOIN client_locations cl ON c.id = cl.client_id
      WHERE cl.location_id = $1
      ORDER BY c.name
    `,
      [locationId],
    )
    return result.rows
  },

  create: async (client: any) => {
    const { name, email, phone, address, notes, preferred_location_id } = client
    const result = await query(
      "INSERT INTO clients (name, email, phone, address, notes, preferred_location_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, email, phone, address, notes, preferred_location_id],
    )
    return result.rows[0]
  },
}

export const servicesRepository = {
  findAll: async () => {
    const result = await query(`
      SELECT s.*, sc.name as category_name
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.id
      ORDER BY s.name
    `)
    return result.rows
  },

  findById: async (id: number) => {
    const result = await query(
      `
      SELECT s.*, sc.name as category_name
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.id
      WHERE s.id = $1
    `,
      [id],
    )
    return result.rows[0]
  },

  findByLocation: async (locationId: number) => {
    const result = await query(
      `
      SELECT s.*, sc.name as category_name, sl.price as location_price
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.id
      JOIN service_locations sl ON s.id = sl.service_id
      WHERE sl.location_id = $1
      ORDER BY s.name
    `,
      [locationId],
    )
    return result.rows
  },

  create: async (service: any) => {
    const { name, description, duration, price, category_id } = service
    const result = await query(
      "INSERT INTO services (name, description, duration, price, category_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, description, duration, price, category_id],
    )
    return result.rows[0]
  },
}

export const appointmentsRepository = {
  findAll: async () => {
    const result = await query(`
      SELECT a.*,
        c.name as client_name,
        u.name as staff_name,
        s.name as service_name,
        l.name as location_name
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN users u ON a.staff_id = u.id
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN locations l ON a.location_id = l.id
      ORDER BY a.start_time DESC
    `)
    return result.rows
  },

  findById: async (id: number) => {
    const result = await query(
      `
      SELECT a.*,
        c.name as client_name,
        u.name as staff_name,
        s.name as service_name,
        l.name as location_name
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN users u ON a.staff_id = u.id
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN locations l ON a.location_id = l.id
      WHERE a.id = $1
    `,
      [id],
    )
    return result.rows[0]
  },

  findByDateRange: async (startDate: Date, endDate: Date, locationId?: number) => {
    let query = `
      SELECT a.*,
        c.name as client_name,
        u.name as staff_name,
        s.name as service_name,
        l.name as location_name
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN users u ON a.staff_id = u.id
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN locations l ON a.location_id = l.id
      WHERE a.start_time >= $1 AND a.start_time <= $2
    `

    const params = [new Date(startDate), new Date(endDate)]

    if (locationId) {
      query += ` AND a.location_id = $3`
      params.push(new Date(locationId))
    }

    query += ` ORDER BY a.start_time ASC`

    const result = await query(query.toString(), params)
    return result.rows
  },

  create: async (appointment: any) => {
    const { client_id, staff_id, service_id, location_id, start_time, end_time, status, notes } = appointment
    const result = await query(
      `INSERT INTO appointments
        (client_id, staff_id, service_id, location_id, start_time, end_time, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [client_id, staff_id, service_id, location_id, start_time, end_time, status, notes],
    )
    return result.rows[0]
  },
}

export const productsRepository = {
  findAll: async () => {
    const result = await query(`
      SELECT p.*, ic.name as category_name
      FROM products p
      LEFT JOIN inventory_categories ic ON p.category_id = ic.id
      ORDER BY p.name
    `)
    return result.rows
  },

  findById: async (id: number) => {
    const result = await query(
      `
      SELECT p.*, ic.name as category_name
      FROM products p
      LEFT JOIN inventory_categories ic ON p.category_id = ic.id
      WHERE p.id = $1
    `,
      [id],
    )
    return result.rows[0]
  },

  getInventoryByLocation: async (locationId: number) => {
    const result = await query(
      `
      SELECT p.*, i.quantity, i.min_stock_level, i.max_stock_level, ic.name as category_name
      FROM products p
      JOIN inventory i ON p.id = i.product_id
      LEFT JOIN inventory_categories ic ON p.category_id = ic.id
      WHERE i.location_id = $1
      ORDER BY p.name
    `,
      [locationId],
    )
    return result.rows
  },

  create: async (product: any) => {
    const { name, description, sku, barcode, category_id, retail_price, cost_price, is_retail } = product
    const result = await query(
      `INSERT INTO products
        (name, description, sku, barcode, category_id, retail_price, cost_price, is_retail)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, description, sku, barcode, category_id, retail_price, cost_price, is_retail],
    )
    return result.rows[0]
  },

  updateInventory: async (productId: number, locationId: number, quantity: number) => {
    const result = await query(
      `INSERT INTO inventory (product_id, location_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (product_id, location_id)
       DO UPDATE SET quantity = inventory.quantity + $3
       RETURNING *`,
      [productId, locationId, quantity],
    )
    return result.rows[0]
  },
}

export const salesRepository = {
  findAll: async () => {
    const result = await query(`
      SELECT s.*,
        c.name as client_name,
        u.name as staff_name,
        l.name as location_name
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      LEFT JOIN users u ON s.staff_id = u.id
      LEFT JOIN locations l ON s.location_id = l.id
      ORDER BY s.created_at DESC
    `)
    return result.rows
  },

  findById: async (id: number) => {
    const result = await query(
      `
      SELECT s.*,
        c.name as client_name,
        u.name as staff_name,
        l.name as location_name
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      LEFT JOIN users u ON s.staff_id = u.id
      LEFT JOIN locations l ON s.location_id = l.id
      WHERE s.id = $1
    `,
      [id],
    )
    return result.rows[0]
  },

  getSaleItems: async (saleId: number) => {
    const result = await query(
      `
      SELECT si.*,
        s.name as service_name,
        p.name as product_name
      FROM sale_items si
      LEFT JOIN services s ON si.service_id = s.id
      LEFT JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = $1
    `,
      [saleId],
    )
    return result.rows
  },

  create: async (sale: any, items: any[]) => {
    // Start a transaction
    await query("BEGIN")

    try {
      const {
        client_id,
        staff_id,
        location_id,
        appointment_id,
        subtotal,
        tax_amount,
        discount_amount,
        tip_amount,
        total_amount,
        payment_method,
        payment_status,
        notes,
      } = sale

      // Create the sale
      const saleResult = await query(
        `INSERT INTO sales
          (client_id, staff_id, location_id, appointment_id, subtotal, tax_amount, discount_amount, tip_amount, total_amount, payment_method, payment_status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        [
          client_id,
          staff_id,
          location_id,
          appointment_id,
          subtotal,
          tax_amount,
          discount_amount,
          tip_amount,
          total_amount,
          payment_method,
          payment_status,
          notes,
        ],
      )

      const newSale = saleResult.rows[0]

      // Add sale items
      for (const item of items) {
        const { item_type, service_id, product_id, quantity, unit_price, discount_amount, tax_amount, total_amount } =
          item

        await query(
          `INSERT INTO sale_items
            (sale_id, item_type, service_id, product_id, quantity, unit_price, discount_amount, tax_amount, total_amount)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            newSale.id,
            item_type,
            service_id,
            product_id,
            quantity,
            unit_price,
            discount_amount,
            tax_amount,
            total_amount,
          ],
        )

        // Update inventory for product items
        if (item_type === "product" && product_id) {
          await productsRepository.updateInventory(product_id, location_id, -quantity)

          // Record inventory transaction
          await query(
            `INSERT INTO inventory_transactions
              (product_id, location_id, quantity, transaction_type, reference_id, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [product_id, location_id, -quantity, "sale", newSale.id, staff_id],
          )
        }
      }

      // If payment was made, record it
      if (payment_status === "paid" || payment_status === "partial") {
        const paymentAmount = payment_status === "paid" ? total_amount : sale.payment_amount || 0

        await query(
          `INSERT INTO payments
            (sale_id, amount, payment_method, reference_number, created_by)
           VALUES ($1, $2, $3, $4, $5)`,
          [newSale.id, paymentAmount, payment_method, sale.reference_number, staff_id],
        )
      }

      // Commit the transaction
      await query("COMMIT")

      return newSale
    } catch (error) {
      // Rollback in case of error
      await query("ROLLBACK")
      throw error
    }
  },
}

export const reportsRepository = {
  getSalesByDateRange: async (startDate: Date, endDate: Date, locationId?: number) => {
    let queryText = `
      SELECT
        DATE(s.created_at) as date,
        SUM(s.total_amount) as total_sales,
        COUNT(*) as transaction_count,
        AVG(s.total_amount) as average_sale,
        SUM(s.tip_amount) as total_tips
      FROM sales s
      WHERE s.created_at >= $1 AND s.created_at <= $2
    `

    const params = [new Date(startDate), new Date(endDate)]

    if (locationId) {
      queryText += ` AND s.location_id = $3`
      params.push(new Date(locationId))
    }

    queryText += ` GROUP BY DATE(s.created_at) ORDER BY date`

    const result = await query(query.toString(), params)
    return result.rows
  },

  getStaffPerformance: async (startDate: Date, endDate: Date, locationId?: number) => {
    let queryText = `
      SELECT
        u.id as staff_id,
        u.name as staff_name,
        COUNT(a.id) as appointment_count,
        SUM(s.total_amount) as total_sales,
        AVG(s.total_amount) as average_sale,
        SUM(s.tip_amount) as total_tips
      FROM users u
      LEFT JOIN appointments a ON u.id = a.staff_id AND a.start_time >= $1 AND a.start_time <= $2
      LEFT JOIN sales s ON a.id = s.appointment_id
      WHERE u.role = 'staff'
    `

    const params = [new Date(startDate), new Date(endDate)]

    if (locationId) {
      queryText += ` AND (a.location_id = $3 OR a.location_id IS NULL)`
      params.push(new Date(locationId))
    }

    queryText += ` GROUP BY u.id, u.name ORDER BY total_sales DESC NULLS LAST`

    const result = await query(query.toString(), params)
    return result.rows
  },

  getServicePopularity: async (startDate: number, endDate: number, locationId?: number) => {
    let queryText = `
      SELECT
        s.id as service_id,
        s.name as service_name,
        COUNT(a.id) as appointment_count,
        SUM(si.total_amount) as total_revenue
      FROM services s
      LEFT JOIN appointments a ON s.id = a.service_id AND a.start_time >= $1 AND a.start_time <= $2
      LEFT JOIN sales sa ON a.id = sa.appointment_id
      LEFT JOIN sale_items si ON sa.id = si.sale_id AND si.service_id = s.id
    `

    const params = [new Date(startDate), new Date(endDate)]

    if (locationId) {
      queryText += ` AND (a.location_id = $3 OR a.location_id IS NULL)`
      params.push(new Date(locationId))
    }

    queryText += ` GROUP BY s.id, s.name ORDER BY appointment_count DESC NULLS LAST`

    const result = await query(query.toString(), params)
    return result.rows
  },

  getProductSales: async (startDate: number, endDate: number, locationId?: number) => {
    let queryText = `
      SELECT
        p.id as product_id,
        p.name as product_name,
        SUM(si.quantity) as quantity_sold,
        SUM(si.total_amount) as total_revenue
      FROM products p
      JOIN sale_items si ON p.id = si.product_id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.created_at >= $1 AND s.created_at <= $2
    `

    const params = [new Date(startDate), new Date(endDate)]

    if (locationId) {
      queryText += ` AND s.location_id = $3`
      params.push(new Date(locationId))
    }

    queryText += ` GROUP BY p.id, p.name ORDER BY quantity_sold DESC`

    const result = await query(query.toString(), params)
    return result.rows
  },
}

// Correct the callable expression error by ensuring the correct usage of string methods.
// Example: String(value)

