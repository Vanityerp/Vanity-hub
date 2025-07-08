"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  CreditCard,
  Layers,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Users,
  Scissors,
  UserCog,
  ShoppingBag,
} from "lucide-react"
import { useAuth } from "@/lib/auth-provider"
import { NAVIGATION_PERMISSIONS } from "@/lib/permissions"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  disabled?: boolean
}

export function ProtectedDashboardNav() {
  const pathname = usePathname()
  const { hasAnyPermission, hasPermission } = useAuth()

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Appointments",
      href: "/dashboard/appointments",
      icon: Calendar,
    },
    {
      title: "Clients",
      href: "/dashboard/clients",
      icon: Users,
    },
    {
      title: "Staff",
      href: "/dashboard/staff",
      icon: Users,
    },
    {
      title: "Services",
      href: "/dashboard/services",
      icon: Scissors,
    },
    {
      title: "Inventory",
      href: "/dashboard/inventory",
      icon: Package,
    },
    {
      title: "Orders",
      href: "/dashboard/orders",
      icon: ShoppingBag,
    },
    {
      title: "POS",
      href: "/dashboard/pos",
      icon: ShoppingCart,
    },
    {
      title: "Accounting",
      href: "/dashboard/accounting",
      icon: CreditCard,
    },
    {
      title: "HR",
      href: "/dashboard/hr",
      icon: UserCog,
    },
    {
      title: "Reports",
      href: "/dashboard/reports",
      icon: Layers,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ]

  // Get user role
  const { user } = useAuth()

  // Filter navigation items based on user permissions
  const filteredNavItems = navItems.filter(item => {
    const requiredPermissions = NAVIGATION_PERMISSIONS[item.href as keyof typeof NAVIGATION_PERMISSIONS]

    // If no permissions are defined for this route, hide it
    if (!requiredPermissions) {
      return false
    }

    // Special case for POS - ensure it's visible for receptionists
    if (item.href === "/dashboard/pos" && user?.role === "receptionist") {
      return true
    }

    // Check if the user has any of the required permissions
    return hasAnyPermission(requiredPermissions)
  })

  return (
    <nav className="grid gap-1">
      {filteredNavItems.map((item) => (
        <Button
          key={item.href}
          variant={pathname === item.href ? "secondary" : "ghost"}
          className={cn("justify-start", pathname === item.href && "bg-secondary/50")}
          asChild
          disabled={item.disabled}
        >
          <Link href={item.href}>
            <item.icon className="mr-2 h-4 w-4" />
            {item.title}
          </Link>
        </Button>
      ))}
    </nav>
  )
}
