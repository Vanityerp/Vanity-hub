import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id

    // Get client appointments from Prisma
    const appointments = await prisma.appointment.findMany({
      where: {
        clientId: clientId
      },
      include: {
        staff: true,
        location: true,
        services: {
          include: {
            service: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Get client purchases/orders from the order management system
    // For now, we'll use mock data but this should connect to your order system
    const mockPurchases = [
      {
        id: `p1-${clientId}`,
        date: "2025-03-15T14:30:00",
        type: "purchase",
        description: "Shampoo & Conditioner Set",
        amount: 45.99,
        paymentMethod: "Credit Card",
        transactionId: "TX-001",
        items: [
          { name: "Premium Shampoo", quantity: 1, price: 22.99 },
          { name: "Deep Conditioner", quantity: 1, price: 23.00 }
        ]
      },
      {
        id: `p2-${clientId}`,
        date: "2025-02-28T16:45:00",
        type: "purchase",
        description: "Hair Styling Products",
        amount: 67.50,
        paymentMethod: "Debit Card",
        transactionId: "TX-002",
        items: [
          { name: "Hair Serum", quantity: 1, price: 35.00 },
          { name: "Styling Gel", quantity: 2, price: 16.25 }
        ]
      }
    ]

    // Transform appointments to timeline format
    const appointmentEvents = appointments.map(appointment => ({
      id: appointment.id,
      date: appointment.date.toISOString(),
      type: "appointment",
      title: appointment.services.map(s => s.service.name).join(", ") || "Service",
      description: `with ${appointment.staff.name}`,
      status: appointment.status.toLowerCase(),
      amount: Number(appointment.totalPrice),
      location: appointment.location.name,
      bookingReference: appointment.bookingReference,
      duration: appointment.duration,
      notes: appointment.notes,
      icon: "Scissors",
      color: getAppointmentStatusColor(appointment.status)
    }))

    // Transform purchases to timeline format
    const purchaseEvents = mockPurchases.map(purchase => ({
      id: purchase.id,
      date: purchase.date,
      type: "purchase",
      title: "Product Purchase",
      description: purchase.description,
      amount: purchase.amount,
      paymentMethod: purchase.paymentMethod,
      transactionId: purchase.transactionId,
      items: purchase.items,
      icon: "ShoppingBag",
      color: "bg-green-100 text-green-800"
    }))

    // Add some communication events (mock for now)
    const communicationEvents = [
      {
        id: `c1-${clientId}`,
        date: "2025-03-10T09:15:00",
        type: "communication",
        title: "SMS Reminder",
        description: "Appointment reminder sent",
        status: "delivered",
        icon: "MessageSquare",
        color: "bg-blue-100 text-blue-800"
      },
      {
        id: `c2-${clientId}`,
        date: "2025-02-25T11:30:00",
        type: "communication",
        title: "Email Newsletter",
        description: "Monthly beauty tips newsletter",
        status: "opened",
        icon: "Mail",
        color: "bg-blue-100 text-blue-800"
      }
    ]

    // Add some notes (mock for now)
    const noteEvents = [
      {
        id: `n1-${clientId}`,
        date: "2025-02-20T11:00:00",
        type: "note",
        title: "Stylist Note",
        description: "Client prefers cooler tones for highlights",
        addedBy: "Sarah Johnson",
        icon: "AlertCircle",
        color: "bg-purple-100 text-purple-800"
      }
    ]

    // Combine all events and sort by date
    const allEvents = [
      ...appointmentEvents,
      ...purchaseEvents,
      ...communicationEvents,
      ...noteEvents
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      appointments: appointmentEvents,
      purchases: purchaseEvents,
      communications: communicationEvents,
      notes: noteEvents,
      timeline: allEvents,
      summary: {
        totalAppointments: appointmentEvents.length,
        totalPurchases: purchaseEvents.length,
        totalSpent: [...appointmentEvents, ...purchaseEvents].reduce((sum, event) => sum + (event.amount || 0), 0),
        lastVisit: appointmentEvents.length > 0 ? appointmentEvents[0].date : null,
        lastPurchase: purchaseEvents.length > 0 ? purchaseEvents[0].date : null
      }
    })

  } catch (error) {
    console.error("Error fetching client history:", error)
    return NextResponse.json({ error: "Failed to fetch client history" }, { status: 500 })
  }
}

// Helper function to get appointment status color
function getAppointmentStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "confirmed":
      return "bg-blue-100 text-blue-800"
    case "completed":
      return "bg-green-100 text-green-800"
    case "cancelled":
      return "bg-red-100 text-red-800"
    case "checked_in":
      return "bg-purple-100 text-purple-800"
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}
