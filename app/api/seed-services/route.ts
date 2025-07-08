import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST() {
  try {
    console.log("🌱 Seeding comprehensive service data...")

    // First, check if we already have comprehensive data
    const existingCategoriesResult = await query("SELECT COUNT(*) as count FROM service_categories")
    const categoryCount = parseInt(existingCategoriesResult.rows[0].count)

    if (categoryCount >= 10) {
      return NextResponse.json({ 
        message: "Service data already seeded",
        categories: categoryCount 
      })
    }

    // Clear existing data first
    await query("DELETE FROM service_locations")
    await query("DELETE FROM services")
    await query("DELETE FROM service_categories")

    // Create comprehensive service categories
    const categoriesResult = await query(`
      INSERT INTO service_categories (name, description)
      VALUES
        ('Hair', 'Haircuts, styling, and treatments'),
        ('Color', 'Hair coloring and highlighting services'),
        ('Nails', 'Manicure, pedicure, and nail art services'),
        ('Skin', 'Facial treatments and skincare services'),
        ('Massage And Spa', 'Relaxing massage and spa treatments'),
        ('Waxing', 'Hair removal and waxing services'),
        ('Eyebrows', 'Eyebrow shaping and treatments'),
        ('Makeup', 'Professional makeup application'),
        ('Extensions', 'Hair extensions and enhancements'),
        ('Bridal', 'Special occasion and bridal packages'),
        ('Men''s Services', 'Services specifically for men')
      RETURNING id, name
    `)

    const categories = categoriesResult.rows
    console.log("✅ Created categories:", categories.map(c => c.name))

    // Create comprehensive services
    const servicesData = [
      // Hair Services
      { name: "Women's Haircut & Style", description: "Professional haircut with styling", duration: 60, price: 85, category: "Hair" },
      { name: "Men's Haircut", description: "Classic men's haircut", duration: 45, price: 55, category: "Hair" },
      { name: "Children's Haircut (Under 12)", description: "Haircut for children under 12", duration: 30, price: 35, category: "Hair" },
      { name: "Blowout & Style", description: "Professional blowout and styling", duration: 45, price: 65, category: "Hair" },
      { name: "Deep Conditioning Treatment", description: "Intensive hair conditioning", duration: 30, price: 45, category: "Hair" },
      { name: "Keratin Treatment", description: "Smoothing keratin treatment", duration: 180, price: 250, category: "Hair" },

      // Color Services
      { name: "Full Highlights", description: "Full head highlights with foils", duration: 120, price: 150, category: "Color" },
      { name: "Partial Highlights", description: "Partial highlights around face", duration: 90, price: 120, category: "Color" },
      { name: "Root Touch-up", description: "Color root touch-up", duration: 60, price: 80, category: "Color" },
      { name: "Full Color", description: "All-over hair color", duration: 90, price: 110, category: "Color" },
      { name: "Balayage", description: "Hand-painted highlights", duration: 150, price: 180, category: "Color" },
      { name: "Color Correction", description: "Fix previous color mistakes", duration: 240, price: 300, category: "Color" },

      // Nail Services
      { name: "Classic Manicure", description: "Traditional manicure with polish", duration: 45, price: 35, category: "Nails" },
      { name: "Gel Manicure", description: "Long-lasting gel polish manicure", duration: 60, price: 50, category: "Nails" },
      { name: "Classic Pedicure", description: "Relaxing pedicure with polish", duration: 60, price: 45, category: "Nails" },
      { name: "Gel Pedicure", description: "Long-lasting gel polish pedicure", duration: 75, price: 60, category: "Nails" },
      { name: "Nail Art", description: "Custom nail art design", duration: 30, price: 25, category: "Nails" },
      { name: "French Manicure", description: "Classic French tip manicure", duration: 50, price: 40, category: "Nails" },

      // Skin Services
      { name: "European Facial", description: "Deep cleansing facial treatment", duration: 60, price: 85, category: "Skin" },
      { name: "Anti-Aging Facial", description: "Anti-aging treatment facial", duration: 75, price: 110, category: "Skin" },
      { name: "Acne Treatment Facial", description: "Specialized acne treatment", duration: 60, price: 95, category: "Skin" },
      { name: "Hydrating Facial", description: "Moisturizing facial treatment", duration: 60, price: 90, category: "Skin" },
      { name: "Chemical Peel", description: "Professional chemical peel", duration: 45, price: 120, category: "Skin" },
      { name: "Microdermabrasion", description: "Skin resurfacing treatment", duration: 60, price: 100, category: "Skin" },

      // Massage and Spa Services
      { name: "Swedish Massage", description: "Relaxing full body massage", duration: 60, price: 90, category: "Massage And Spa" },
      { name: "Deep Tissue Massage", description: "Therapeutic deep tissue massage", duration: 60, price: 100, category: "Massage And Spa" },
      { name: "Hot Stone Massage", description: "Massage with heated stones", duration: 90, price: 130, category: "Massage And Spa" },
      { name: "Aromatherapy Massage", description: "Relaxing massage with essential oils", duration: 60, price: 95, category: "Massage And Spa" },
      { name: "Couples Massage", description: "Side-by-side massage for two", duration: 60, price: 180, category: "Massage And Spa" },
      { name: "Prenatal Massage", description: "Safe massage for expecting mothers", duration: 60, price: 95, category: "Massage And Spa" },

      // Waxing Services
      { name: "Eyebrow Wax", description: "Eyebrow shaping and waxing", duration: 15, price: 25, category: "Waxing" },
      { name: "Upper Lip Wax", description: "Upper lip hair removal", duration: 10, price: 15, category: "Waxing" },
      { name: "Bikini Wax", description: "Bikini area hair removal", duration: 30, price: 45, category: "Waxing" },
      { name: "Brazilian Wax", description: "Full bikini area hair removal", duration: 45, price: 65, category: "Waxing" },
      { name: "Leg Wax (Full)", description: "Full leg hair removal", duration: 60, price: 75, category: "Waxing" },
      { name: "Underarm Wax", description: "Underarm hair removal", duration: 15, price: 25, category: "Waxing" },

      // Eyebrow Services
      { name: "Eyebrow Threading", description: "Precise eyebrow shaping", duration: 20, price: 30, category: "Eyebrows" },
      { name: "Eyebrow Tinting", description: "Eyebrow color enhancement", duration: 20, price: 25, category: "Eyebrows" },
      { name: "Eyebrow Lamination", description: "Eyebrow setting treatment", duration: 45, price: 65, category: "Eyebrows" },
      { name: "Henna Brows", description: "Natural eyebrow tinting", duration: 30, price: 40, category: "Eyebrows" },

      // Makeup Services
      { name: "Special Event Makeup", description: "Professional makeup for events", duration: 60, price: 75, category: "Makeup" },
      { name: "Bridal Makeup", description: "Wedding day makeup application", duration: 90, price: 120, category: "Makeup" },
      { name: "Makeup Lesson", description: "Learn professional makeup techniques", duration: 90, price: 100, category: "Makeup" },
      { name: "Airbrush Makeup", description: "Flawless airbrush makeup", duration: 75, price: 95, category: "Makeup" },

      // Extensions Services
      { name: "Tape-in Extensions", description: "Semi-permanent tape-in hair extensions", duration: 120, price: 200, category: "Extensions" },
      { name: "Clip-in Extensions", description: "Temporary clip-in extensions", duration: 30, price: 50, category: "Extensions" },
      { name: "Sew-in Extensions", description: "Long-lasting sewn-in extensions", duration: 180, price: 300, category: "Extensions" },
      { name: "Extension Removal", description: "Safe extension removal", duration: 60, price: 75, category: "Extensions" },

      // Bridal Services
      { name: "Bridal Hair Trial", description: "Wedding hair trial run", duration: 90, price: 85, category: "Bridal" },
      { name: "Bridal Hair & Makeup", description: "Complete bridal styling", duration: 150, price: 200, category: "Bridal" },
      { name: "Bridesmaid Hair", description: "Bridesmaid hair styling", duration: 60, price: 65, category: "Bridal" },
      { name: "Mother of Bride Hair", description: "Special occasion hair styling", duration: 60, price: 70, category: "Bridal" },

      // Men's Services
      { name: "Beard Trim", description: "Professional beard trimming", duration: 30, price: 35, category: "Men's Services" },
      { name: "Hot Towel Shave", description: "Traditional hot towel shave", duration: 45, price: 50, category: "Men's Services" },
      { name: "Men's Facial", description: "Facial treatment for men", duration: 60, price: 75, category: "Men's Services" },
      { name: "Scalp Treatment", description: "Therapeutic scalp treatment", duration: 30, price: 40, category: "Men's Services" }
    ]

    // Insert services
    for (const serviceData of servicesData) {
      const category = categories.find(c => c.name === serviceData.category)
      if (category) {
        await query(
          `INSERT INTO services (name, description, duration, price, category_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [serviceData.name, serviceData.description, serviceData.duration, serviceData.price, category.id]
        )
      }
    }

    // Get all services and locations for assignment
    const servicesResult = await query("SELECT id FROM services")
    const locationsResult = await query("SELECT id FROM locations")
    
    const serviceIds = servicesResult.rows.map(row => row.id)
    const locationIds = locationsResult.rows.map(row => row.id)

    // Assign all services to all locations
    for (const serviceId of serviceIds) {
      for (const locationId of locationIds) {
        await query(
          `INSERT INTO service_locations (service_id, location_id)
           VALUES ($1, $2)`,
          [serviceId, locationId]
        )
      }
    }

    const finalCategoriesResult = await query("SELECT COUNT(*) as count FROM service_categories")
    const finalServicesResult = await query("SELECT COUNT(*) as count FROM services")

    console.log("✅ Service seeding completed successfully!")

    return NextResponse.json({
      message: "Service data seeded successfully",
      categories: parseInt(finalCategoriesResult.rows[0].count),
      services: parseInt(finalServicesResult.rows[0].count)
    })

  } catch (error) {
    console.error("❌ Error seeding service data:", error)
    return NextResponse.json({ error: "Failed to seed service data" }, { status: 500 })
  }
}
