"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { useCarouselData } from "@/lib/carousel-storage"
import {
  Calendar,
  Scissors,
  ShoppingBag,
  Gift,
  Star,
  Package,
  User,
  Heart,
  Phone,
  Mail,
  MapPin,
  Clock
} from "lucide-react"

// Icon mapping for dynamic icons
const iconMap = {
  Calendar,
  Scissors,
  ShoppingBag,
  Gift,
  Star,
  Package,
  User,
  Heart,
  Phone,
  Mail,
  MapPin,
  Clock
}

export function DynamicQuickActions() {
  const { quickActions } = useCarouselData()

  // Filter active quick actions and sort by order
  const activeQuickActions = quickActions
    .filter(action => action.isActive)
    .sort((a, b) => a.order - b.order)

  // If no quick actions are loaded, show default ones
  const defaultQuickActions = [
    {
      id: "book-appointment",
      title: "Book Appointment",
      description: "Schedule your next visit",
      icon: "Calendar",
      href: "/client-portal/appointments/book",
      isActive: true,
      order: 1
    },
    {
      id: "our-services",
      title: "Our Services",
      description: "Explore our services",
      icon: "Scissors",
      href: "/client-portal/services",
      isActive: true,
      order: 2
    },
    {
      id: "shop-products",
      title: "Shop Products",
      description: "Browse our products",
      icon: "ShoppingBag",
      href: "/client-portal/shop",
      isActive: true,
      order: 3
    },
    {
      id: "loyalty-program",
      title: "Loyalty Program",
      description: "View your points & rewards",
      icon: "Gift",
      href: "/client-portal/loyalty",
      isActive: true,
      order: 4
    },
    {
      id: "my-reviews",
      title: "My Reviews",
      description: "Share your feedback",
      icon: "Star",
      href: "/client-portal/reviews",
      isActive: true,
      order: 5
    },
    {
      id: "my-orders",
      title: "My Orders",
      description: "Track your purchases",
      icon: "Package",
      href: "/client-portal/orders",
      isActive: true,
      order: 6
    }
  ]

  const actionsToDisplay = activeQuickActions.length > 0 ? activeQuickActions : defaultQuickActions

  return (
    <>
      <style jsx>{`
        .quick-action-icon svg,
        .quick-action-icon [data-lucide] {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          width: 1.5rem !important;
          height: 1.5rem !important;
        }
      `}</style>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {actionsToDisplay.map((action) => {
        // Force Calendar icon for Book Appointment
        let IconComponent = Calendar // Default to Calendar

        if (action.icon && iconMap[action.icon as keyof typeof iconMap]) {
          IconComponent = iconMap[action.icon as keyof typeof iconMap]
        }

        // Always use Calendar for Book Appointment
        if (action.id === "book-appointment" || action.title === "Book Appointment") {
          IconComponent = Calendar
        }

        return (
          <Link key={action.id} href={action.href}>
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group hover:-translate-y-1 border-0 shadow-sm">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center text-pink-600 mb-3 group-hover:from-pink-200 group-hover:to-pink-100 transition-all duration-300 group-hover:scale-110 quick-action-icon">
                  {/* Force render Calendar icon for Book Appointment */}
                  {action.id === "book-appointment" || action.title === "Book Appointment" ? (
                    <svg className="h-6 w-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <IconComponent className="h-6 w-6 text-pink-600" />
                  )}
                </div>
                <h3 className="font-medium group-hover:text-pink-600 transition-colors text-sm">
                  {action.title}
                </h3>
                <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">
                  {action.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        )
        })}
      </div>
    </>
  )
}
