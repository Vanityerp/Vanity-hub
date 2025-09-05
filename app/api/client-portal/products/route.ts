import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get all retail products for client portal
export async function GET(request: Request) {
  try {
    console.log('🛒 Client Portal API: Starting product fetch...')

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const locationId = searchParams.get("locationId");

    console.log('🔍 Search params:', { category, type, search, locationId })

    // Build where clause for retail products only
    const where: any = {
      isRetail: true,
      isActive: true
    };

    if (category) {
      where.category = {
        contains: category
      };
    }

    if (type) {
      where.type = {
        contains: type
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { category: { contains: search } }
      ];
    }

    console.log('📦 Where clause:', where)

    // Fetch products with location information
    const products = await prisma.product.findMany({
      where,
      include: {
        locations: locationId ? {
          where: { locationId }
        } : true
      },
      orderBy: { name: 'asc' }
    });

    console.log(`📊 Found ${products.length} products in database`);

    // Convert to client format - include all products to match inventory view
    const clientProducts = products
      .map(product => {
        // Get total stock or location-specific stock
        const stock = locationId
          ? product.locations.find(loc => loc.locationId === locationId)?.stock || 0
          : product.locations.reduce((total, loc) => total + loc.stock, 0);

        // Include location breakdown for better integration with inventory management
        const locations = product.locations.map(loc => ({
          locationId: loc.locationId,
          locationName: loc.location?.name || 'Unknown Location',
          stock: loc.stock,
          price: loc.price,
          isActive: loc.isActive
        }));

        return {
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: parseFloat(product.price.toString()),
          salePrice: product.salePrice ? parseFloat(product.salePrice.toString()) : undefined,
          category: product.category,
          type: product.type,
          image: product.image || '/placeholder.jpg',
          images: product.image ? [product.image] : ['/placeholder.jpg'],
          stock,
          minStock: 5,
          locations, // Include location breakdown for inventory integration
          isNew: product.isNew,
          isBestSeller: product.isBestSeller,
          isSale: product.isSale,
          features: (() => {
            try {
              return product.features ? JSON.parse(product.features) : []
            } catch (e) {
              console.warn('Failed to parse features for product', product.id, e)
              return []
            }
          })(),
          ingredients: (() => {
            try {
              return product.ingredients ? JSON.parse(product.ingredients) : []
            } catch (e) {
              console.warn('Failed to parse ingredients for product', product.id, e)
              return []
            }
          })(),
          howToUse: (() => {
            try {
              return product.howToUse ? JSON.parse(product.howToUse) : []
            } catch (e) {
              console.warn('Failed to parse howToUse for product', product.id, e)
              return []
            }
          })(),
          relatedProducts: [],
          rating: product.rating || 0,
          reviewCount: product.reviewCount,
          sku: product.sku || '',
          barcode: product.barcode || '',
          isRetail: product.isRetail,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt
        };
      });

    console.log(`✅ Client Portal API: Found ${clientProducts.length} retail products`);
    return NextResponse.json({ products: clientProducts });
  } catch (error) {
    console.error("❌ Error fetching client portal products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// Process a product purchase
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }

    // Process each item in the cart
    const processedItems = [];
    let updatedProducts = [...beautyProducts];

    for (const item of data.items) {
      const { id, quantity } = item;

      // Find the product
      const productIndex = updatedProducts.findIndex(p => p.id === id);
      if (productIndex === -1) {
        return NextResponse.json({ error: `Product not found: ${id}` }, { status: 400 });
      }

      const product = updatedProducts[productIndex];

      // Check stock
      if (product.stock < quantity) {
        return NextResponse.json({
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        }, { status: 400 });
      }

      // Update stock
      updatedProducts[productIndex] = {
        ...product,
        stock: product.stock - quantity
      };

      // Add to processed items
      processedItems.push({
        id: product.id,
        name: product.name,
        price: product.isSale && product.salePrice ? product.salePrice : product.price,
        quantity,
        total: (product.isSale && product.salePrice ? product.salePrice : product.price) * quantity
      });
    }

    // Get checkout settings for dynamic calculations
    const checkoutSettings = SettingsStorage.getCheckoutSettings();

    // Calculate totals using dynamic settings
    const subtotal = processedItems.reduce((sum, item) => sum + item.total, 0);

    // Apply promo discount if provided
    let promoDiscount = 0;
    if (data.appliedPromo) {
      promoDiscount = data.appliedPromo.type === 'percentage'
        ? subtotal * (data.appliedPromo.discount / 100)
        : data.appliedPromo.discount;
    }

    const discountedSubtotal = Math.max(0, subtotal - promoDiscount);

    // Calculate tax using dynamic rate
    const tax = discountedSubtotal * (checkoutSettings.taxRate / 100);

    // Calculate shipping using dynamic settings
    let shipping = 0;
    if (checkoutSettings.shippingType === 'flat') {
      shipping = checkoutSettings.shippingAmount;
    } else if (checkoutSettings.shippingType === 'percentage') {
      shipping = discountedSubtotal * (checkoutSettings.shippingAmount / 100);
    }

    // Apply free shipping threshold
    if (discountedSubtotal >= checkoutSettings.freeShippingThreshold) {
      shipping = 0;
    }

    const total = discountedSubtotal + tax + shipping;

    // Determine order status based on payment method and settings
    let orderStatus = "completed";
    if (data.paymentMethod === "cod") {
      orderStatus = checkoutSettings.orderProcessing.codConfirmationRequired ? "pending_confirmation" : "confirmed";
    }

    // In a real app, we would save this order to a database
    const order = {
      id: `order-${Date.now()}`,
      clientId: data.clientId,
      items: processedItems,
      subtotal,
      discountedSubtotal,
      promoDiscount,
      appliedPromo: data.appliedPromo,
      tax,
      shipping,
      total,
      paymentMethod: data.paymentMethod || "card",
      shippingAddress: data.shippingAddress,
      status: orderStatus,
      createdAt: new Date().toISOString(),
      notes: data.paymentMethod === "cod" ? "Cash on Delivery order" : undefined
    };

    // Update the global products array with new stock levels
    // In a real app, this would be a database update
    // beautyProducts = updatedProducts;

    return NextResponse.json({
      success: true,
      order
    });
  } catch (error) {
    console.error("Error processing purchase:", error);
    return NextResponse.json({ error: "Failed to process purchase" }, { status: 500 });
  }
}
