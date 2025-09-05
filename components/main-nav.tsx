"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface MainNavProps extends React.HTMLAttributes<HTMLElement> {
  items?: {
    href: string
    title: string
  }[]
}

export function MainNav({ className, items, ...props }: MainNavProps) {
  const pathname = usePathname()

  const defaultItems = [
    {
      href: "/dashboard",
      title: "Dashboard",
    },
    {
      href: "/dashboard/appointments",
      title: "Appointments",
    },
    {
      href: "/dashboard/clients",
      title: "Clients",
    },
    {
      href: "/dashboard/services",
      title: "Services",
    },
    {
      href: "/dashboard/staff",
      title: "Staff",
    },
    {
      href: "/dashboard/inventory",
      title: "Inventory",
    },
    {
      href: "/dashboard/orders",
      title: "Orders",
    },
    {
      href: "/dashboard/pos",
      title: "Point of Sale",
    },
    {
      href: "/dashboard/accounting",
      title: "Accounting",
    },
    {
      href: "/dashboard/hr",
      title: "HR",
    },
    {
      href: "/dashboard/reports",
      title: "Reports",
    },
    {
      href: "/dashboard/settings",
      title: "Settings",
    },
    {
      href: "/client-portal",
      title: "Client Portal",
    },
  ]

  const navItems = items || defaultItems

  return (
    <div className={cn("overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border nav-scroll-container", className)} {...props}>
      <nav className="flex items-center space-x-4 lg:space-x-6 min-w-max">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap py-3 px-1",
              item.href === "/client-portal" && "text-pink-600 hover:text-pink-700",
              pathname === item.href || pathname.startsWith(`${item.href}/`) ? "text-primary" : "text-muted-foreground",
              item.href === "/client-portal" && pathname !== "/client-portal" && !pathname.startsWith("/client-portal/") && "text-pink-600",
            )}
          >
            {item.title}
          </Link>
        ))}
      </nav>
    </div>
  )
}

