"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  ShoppingBag,
  User,
  CreditCard,
  Heart,
  LogOut,
  Menu,
  X,
  Home,
  Gift,
  Bell,
  Settings,
  Trash2,
  Star,
  Package
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useClients } from "@/lib/client-provider"
import { useCurrency } from "@/lib/currency-provider"
import { useGlobalCurrencyChange } from "@/components/global-currency-enforcer"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ClientPortalLayoutProps {
  children: React.ReactNode
}

export function ClientPortalLayout({ children }: ClientPortalLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const { clients } = useClients()
  const { currencyCode, formatCurrency } = useCurrency()
  const [client, setClient] = useState<any>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(0)

  // Listen for currency changes to ensure consistent currency display
  useGlobalCurrencyChange((newCurrencyCode) => {
    console.log(`Currency changed in client portal: ${newCurrencyCode}`)
    // Force a re-render when currency changes
    setForceUpdate(prev => prev + 1)
  })

  // State for notifications, favorites, and cart
  const [notificationCount, setNotificationCount] = useState(3)
  const [favoriteCount, setFavoriteCount] = useState(2)
  const [cartItemCount, setCartItemCount] = useState(3)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showFavorites, setShowFavorites] = useState(false)
  const [showCartPreview, setShowCartPreview] = useState(false)
  const [hasNewNotification, setHasNewNotification] = useState(true)

  // Simulate a new notification coming in
  useEffect(() => {
    const timer = setTimeout(() => {
      if (notificationCount > 0) {
        setHasNewNotification(true)
        // Reset the animation after 3 seconds
        const resetTimer = setTimeout(() => {
          setHasNewNotification(false)
        }, 3000)
        return () => clearTimeout(resetTimer)
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [notificationCount])

  // Check if client is authenticated
  useEffect(() => {
    const token = localStorage.getItem("client_auth_token")
    const clientEmail = localStorage.getItem("client_email")
    const clientId = localStorage.getItem("client_id")

    if (!token || !clientEmail) {
      // Only redirect if we're on a protected page
      if (pathname !== "/client-portal") {
        toast({
          title: "Authentication required",
          description: "Please sign in to access your dashboard",
          variant: "destructive",
        })
        router.push("/client-portal")
      }
      return
    }

    // Find client by email or ID
    let foundClient
    if (clientId) {
      foundClient = clients.find(c => c.id === clientId)
    } else {
      foundClient = clients.find(c => c.email === clientEmail)
    }

    if (foundClient) {
      setClient(foundClient)
      // Ensure client ID is stored in localStorage
      if (!localStorage.getItem("client_id")) {
        localStorage.setItem("client_id", foundClient.id)
      }
    } else {
      // If client not found, create a mock client for demo purposes
      const mockClientId = "client123"
      setClient({
        id: mockClientId,
        name: "Jane Smith",
        email: clientEmail,
        avatar: "JS"
      })
      // Store the mock client ID in localStorage for consistency
      localStorage.setItem("client_id", mockClientId)
    }
  }, [clients, pathname, router, toast])

  const handleLogout = () => {
    localStorage.removeItem("client_auth_token")
    localStorage.removeItem("client_email")
    localStorage.removeItem("client_id")

    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    })

    router.push("/client-portal")
  }

  // Methods to handle cart and favorites
  const addToCart = (item: any) => {
    setCartItemCount(prev => prev + 1)
    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart.`,
    })
  }

  const addToFavorites = (item: any) => {
    setFavoriteCount(prev => prev + 1)
    toast({
      title: "Added to favorites",
      description: `${item.name} has been added to your favorites.`,
    })
  }

  const removeFromFavorites = (item: any) => {
    setFavoriteCount(prev => Math.max(0, prev - 1))
    toast({
      title: "Removed from favorites",
      description: `${item.name} has been removed from your favorites.`,
    })
  }

  const clearAllFavorites = () => {
    setFavoriteCount(0)
    toast({
      title: "Favorites cleared",
      description: "All items have been removed from your favorites.",
    })
  }

  const markNotificationAsRead = (id: string) => {
    setNotificationCount(prev => Math.max(0, prev - 1))
    toast({
      title: "Notification marked as read",
      description: "The notification has been marked as read.",
    })
  }

  const markAllNotificationsAsRead = () => {
    setNotificationCount(0)
    setHasNewNotification(false)
    toast({
      title: "All notifications marked as read",
      description: "All notifications have been marked as read.",
    })
    setShowNotifications(false)
  }

  const navItems = [
    { href: "/client-portal/dashboard", label: "Dashboard", icon: <Home className="h-5 w-5" /> },
    { href: "/client-portal/appointments", label: "Appointments", icon: <Calendar className="h-5 w-5" /> },
    { href: "/client-portal/shop", label: "Shop", icon: <ShoppingBag className="h-5 w-5" /> },
    { href: "/client-portal/profile", label: "My Profile", icon: <User className="h-5 w-5" /> },
    { href: "/client-portal/orders", label: "My Orders", icon: <CreditCard className="h-5 w-5" /> },
    { href: "/client-portal/track-order", label: "Track Order", icon: <Package className="h-5 w-5" /> },
    { href: "/client-portal/favorites", label: "Favorites", icon: <Heart className="h-5 w-5" /> },
    { href: "/client-portal/loyalty", label: "Loyalty", icon: <Gift className="h-5 w-5" /> },
    { href: "/client-portal/reviews", label: "Reviews", icon: <Star className="h-5 w-5" /> },
    { href: "/client-portal/notifications", label: "Notifications", icon: <Bell className="h-5 w-5" /> },
    { href: "/client-portal/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  )
}
