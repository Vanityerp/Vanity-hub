"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
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
  Star
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useClients } from "@/lib/client-provider"
import { useCurrency } from "@/lib/currency-provider"
import { useGlobalCurrencyChange } from "@/components/global-currency-enforcer"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { SettingsStorage, type GeneralSettings } from "@/lib/settings-storage"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ClientPortalLogo } from "@/components/ui/logo"

export function ClientPortalHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const { clients } = useClients()
  const { currencyCode, formatCurrency } = useCurrency()
  const [client, setClient] = useState<any>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(0)
  const [businessSettings, setBusinessSettings] = useState<GeneralSettings | null>(null)

  // Load business settings
  useEffect(() => {
    const settings = SettingsStorage.getGeneralSettings()
    setBusinessSettings(settings)
  }, [])

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
    } else {
      // If client not found, create a mock client for demo purposes
      setClient({
        id: "client123",
        name: "Jane Smith",
        email: clientEmail,
        avatar: "JS"
      })
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
    { href: "/client-portal/orders", label: "Orders", icon: <CreditCard className="h-5 w-5" /> },
    { href: "/client-portal/favorites", label: "Favorites", icon: <Heart className="h-5 w-5" /> },
    { href: "/client-portal/loyalty", label: "Loyalty", icon: <Gift className="h-5 w-5" /> },
    { href: "/client-portal/reviews", label: "Reviews", icon: <Star className="h-5 w-5" /> },
    { href: "/client-portal/notifications", label: "Notifications", icon: <Bell className="h-5 w-5" /> },
    { href: "/client-portal/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
  ]

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ClientPortalLogo href="/client-portal" className="hidden sm:flex" />
          <ClientPortalLogo href="/client-portal" showName={false} className="sm:hidden" />
        </div>

        <div className="hidden md:flex items-center gap-6">
          {navItems.slice(0, 4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                pathname === item.href ? "text-pink-600" : "text-gray-600 hover:text-pink-600"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {client ? (
            <>
              {/* Notifications Button with Dropdown */}
              <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-pink-50 hover:text-pink-600 transition-colors"
                  >
                    <Bell className="h-5 w-5" />
                    {notificationCount > 0 && (
                      <Badge
                        className={`absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-pink-500 text-white ${
                          hasNewNotification ? 'animate-pulse' : ''
                        }`}
                      >
                        {notificationCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Notifications</span>
                    <div className="flex items-center gap-3">
                      <button
                        className="text-xs text-gray-500 hover:text-pink-600 hover:underline"
                        onClick={markAllNotificationsAsRead}
                      >
                        Mark all as read
                      </button>
                      <Link
                        href="/client-portal/notifications"
                        className="text-xs text-pink-600 hover:underline"
                        onClick={() => setShowNotifications(false)}
                      >
                        View All
                      </Link>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-96 overflow-auto">
                    <DropdownMenuItem className="cursor-pointer p-4">
                      <div className="flex justify-between w-full">
                        <div className="flex-1">
                          <div className="font-medium">Appointment Reminder</div>
                          <div className="text-sm text-muted-foreground">
                            You have a Haircut & Style tomorrow at 2:00 PM
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">10 minutes ago</div>
                        </div>
                        <button
                          className="text-xs text-gray-500 hover:text-pink-600 ml-2 self-start"
                          onClick={(e) => {
                            e.stopPropagation();
                            markNotificationAsRead('1');
                          }}
                        >
                          Mark read
                        </button>
                      </div>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Avatar with Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 bg-pink-100 text-pink-800 cursor-pointer hover:ring-2 hover:ring-pink-200 transition-all">
                    <AvatarFallback>{client?.avatar || client?.name?.split(" ").map((n: string) => n[0]).join("") || "C"}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{client?.name || "Client"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{client?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/client-portal/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button size="sm" className="bg-pink-600 hover:bg-pink-700" asChild>
              <Link href="/client-portal#auth-section">
                Sign In
              </Link>
            </Button>
          )}

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between py-4 border-b">
                  <div className="flex items-center gap-3">
                    {client && (
                      <>
                        <Avatar className="h-10 w-10 bg-pink-100 text-pink-800">
                          <AvatarFallback>{client?.avatar || client?.name?.split(" ").map((n: string) => n[0]).join("") || "C"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{client?.name || "Client"}</p>
                          <p className="text-sm text-gray-500">{client?.email}</p>
                        </div>
                      </>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
