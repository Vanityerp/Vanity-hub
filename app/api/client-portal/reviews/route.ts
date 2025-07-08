import { NextResponse } from "next/server";

// Mock reviews data
let reviews = [
  // Product reviews
  {
    id: "pr1",
    clientId: "client123",
    clientName: "Jane Smith",
    itemId: "p1",
    itemName: "Hydrating Shampoo",
    itemType: "product",
    rating: 5,
    comment: "This shampoo is amazing! My hair feels so soft and hydrated after using it.",
    date: "2025-03-15T10:30:00",
    status: "published"
  },
  {
    id: "pr2",
    clientId: "client123",
    clientName: "Jane Smith",
    itemId: "p4",
    itemName: "Styling Mousse",
    itemType: "product",
    rating: 4,
    comment: "Good hold without making my hair stiff. Would recommend!",
    date: "2025-02-20T14:45:00",
    status: "published"
  },

  // Service reviews
  {
    id: "sr1",
    clientId: "client123",
    clientName: "Jane Smith",
    itemId: "s1",
    itemName: "Haircut & Style",
    itemType: "service",
    staffId: "1",
    staffName: "Emma Johnson",
    rating: 5,
    comment: "Emma did an amazing job with my haircut! She really understood what I wanted.",
    date: "2025-03-10T11:15:00",
    status: "published"
  },

  // Staff reviews
  {
    id: "str1",
    clientId: "client123",
    clientName: "Jane Smith",
    itemId: "1",
    itemName: "Emma Johnson",
    itemType: "staff",
    rating: 5,
    comment: "Emma is always professional and does amazing work. She listens carefully to what I want.",
    date: "2025-03-05T15:20:00",
    status: "published"
  }
];

// Get all reviews or filter by client, item, or type
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const itemId = searchParams.get("itemId");
    const itemType = searchParams.get("itemType");
    const staffId = searchParams.get("staffId");

    let filteredReviews = [...reviews];

    if (clientId) {
      filteredReviews = filteredReviews.filter(
        review => review.clientId === clientId
      );
    }

    if (itemId) {
      filteredReviews = filteredReviews.filter(
        review => review.itemId === itemId
      );
    }

    if (itemType) {
      filteredReviews = filteredReviews.filter(
        review => review.itemType === itemType
      );
    }

    if (staffId) {
      filteredReviews = filteredReviews.filter(
        review => review.staffId === staffId
      );
    }

    return NextResponse.json(filteredReviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// Create a new review
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.clientId || !data.itemId || !data.itemType || !data.rating || !data.comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // Check if client has already reviewed this item
    const existingReview = reviews.find(
      review => review.clientId === data.clientId &&
                review.itemId === data.itemId &&
                review.itemType === data.itemType
    );

    if (existingReview) {
      return NextResponse.json({
        error: "You have already reviewed this item. Please edit your existing review instead."
      }, { status: 400 });
    }

    // Create the new review
    const newReview = {
      id: `r${reviews.length + 1}`,
      clientId: data.clientId,
      clientName: data.clientName,
      itemId: data.itemId,
      itemName: data.itemName,
      itemType: data.itemType,
      staffId: data.staffId,
      staffName: data.staffName,
      rating: data.rating,
      comment: data.comment,
      date: new Date().toISOString(),
      status: "published"
    };

    // In a real app, we would save this to a database
    // For now, we'll just add it to our mock data
    reviews.push(newReview);

    return NextResponse.json({
      success: true,
      review: newReview
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}

// Update an existing review
export async function PUT(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.id || !data.rating || !data.comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find the review to update
    const reviewIndex = reviews.findIndex(review => review.id === data.id);

    if (reviewIndex === -1) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Update the review with enhanced fields
    reviews[reviewIndex] = {
      ...reviews[reviewIndex],
      rating: data.rating,
      title: data.title || reviews[reviewIndex].title,
      comment: data.comment,
      isAnonymous: data.isAnonymous || false,
      wouldRecommend: data.wouldRecommend !== false,
      tags: data.tags || [],
      images: data.images || [],
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      review: reviews[reviewIndex]
    });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

// Delete a review
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 });
    }

    // Find the review to delete
    const reviewIndex = reviews.findIndex(review => review.id === id);

    if (reviewIndex === -1) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Delete the review
    reviews.splice(reviewIndex, 1);

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
