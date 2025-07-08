"use client"
import React, { useState, useMemo } from "react"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GeneralSettings } from "@/components/settings/general-settings"
import { BrandingSettings } from "@/components/settings/branding-settings"
import { LocationSettings } from "@/components/settings/location-settings"
import { UserSettings } from "@/components/settings/user-settings"
import { IntegrationSettings } from "@/components/settings/integration-settings"
import { EnhancedNotificationSettings } from "@/components/settings/enhanced-notification-settings"
import { StaffCredentialSettings } from "@/components/settings/staff-credential-settings"
import {
  Search,
  Settings as SettingsIcon,
  Users,
  MapPin,
  Palette,
  Plug,
  Bell,
  ShoppingCart,
  Image,
  Bookmark,
  Shield,
  Database,
  Globe,
  Smartphone,
  KeyRound
} from "lucide-react"
import { CurrencyDetectorTest } from "@/components/settings/currency-detector-test"
import { LoyaltySettings } from "@/components/settings/loyalty-settings"
import { CheckoutSettings } from "@/components/settings/checkout-settings"
import { CarouselSettings } from "@/components/settings/carousel-settings"

import { AccessDenied } from "@/components/access-denied"

interface SettingTab {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  keywords: string[]
  requiresPermission?: string
}

const settingTabs: SettingTab[] = [
  {
    id: "general",
    label: "General",
    description: "Basic salon settings and preferences",
    icon: SettingsIcon,
    keywords: ["general", "basic", "salon", "preferences", "settings"]
  },
  {
    id: "branding",
    label: "Branding",
    description: "Logo, colors, and brand customization",
    icon: Palette,
    keywords: ["branding", "logo", "colors", "theme", "customization", "brand"]
  },
  {
    id: "locations",
    label: "Locations",
    description: "Manage salon locations and addresses",
    icon: MapPin,
    keywords: ["locations", "addresses", "branches", "salon", "places"]
  },
  {
    id: "users",
    label: "Users & Permissions",
    description: "Staff accounts and permissions",
    icon: Users,
    keywords: ["users", "staff", "accounts", "permissions", "roles", "team"]
  },
  {
    id: "credentials",
    label: "Staff Credentials",
    description: "Manage staff login credentials and access",
    icon: KeyRound,
    keywords: ["credentials", "login", "password", "authentication", "staff", "access", "security"]
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "Third-party services and APIs",
    icon: Plug,
    keywords: ["integrations", "api", "third-party", "services", "connections"]
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Email, SMS, and push notification settings",
    icon: Bell,
    keywords: ["notifications", "email", "sms", "push", "alerts", "messages"]
  },
  {
    id: "checkout",
    label: "Checkout",
    description: "Payment and checkout configuration",
    icon: ShoppingCart,
    keywords: ["checkout", "payment", "billing", "pos", "transactions"]
  },
  {
    id: "carousel",
    label: "Carousel Management",
    description: "Homepage carousel and banner settings",
    icon: Image,
    keywords: ["carousel", "banner", "homepage", "images", "slideshow"]
  },
  {
    id: "loyalty",
    label: "Loyalty Program",
    description: "Customer loyalty and rewards settings",
    icon: Bookmark,
    keywords: ["loyalty", "rewards", "points", "program", "customers"],
    requiresPermission: "super_admin"
  }
]

export default function SettingsPage() {
  const { hasPermission, user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("general")

  // Filter tabs based on search query and permissions
  const filteredTabs = React.useMemo(() => {
    let tabs = settingTabs.filter(tab => {
      if (tab.requiresPermission === "super_admin" && user?.role !== "super_admin") {
        return false
      }
      return true
    })

    if (!searchQuery) return tabs

    const query = searchQuery.toLowerCase()
    return tabs.filter(tab =>
      tab.label.toLowerCase().includes(query) ||
      tab.description.toLowerCase().includes(query) ||
      tab.keywords.some(keyword => keyword.includes(query))
    )
  }, [searchQuery, user?.role])

  // Check if user has permission to view settings page
  if (!hasPermission("view_settings")) {
    return (
      <AccessDenied
        description="You don't have permission to view the settings page."
        backButtonHref="/dashboard"
      />
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your salon's configuration and preferences
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Settings Grid for Search Results */}
      {searchQuery && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">
            Search Results ({filteredTabs.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTabs.map(tab => {
              const Icon = tab.icon
              return (
                <Card
                  key={tab.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setActiveTab(tab.id)
                    setSearchQuery("")
                  }}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{tab.label}</CardTitle>
                        <CardDescription className="text-sm">
                          {tab.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
          {filteredTabs.length === 0 && (
            <div className="text-center py-8">
              <SettingsIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">No settings found</h3>
              <p className="text-muted-foreground">Try a different search term</p>
            </div>
          )}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Enhanced Tab Navigation */}
        <TabsList className="h-auto p-1 bg-muted/50 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1">
          {settingTabs
            .filter(tab => {
              if (tab.requiresPermission === "super_admin" && user?.role !== "super_admin") {
                return false
              }
              return true
            })
            .map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              const isVisible = !searchQuery || filteredTabs.some(t => t.id === tab.id)

              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={`flex flex-col items-center gap-2 p-3 h-auto data-[state=active]:bg-background ${
                    !isVisible ? 'opacity-50' : ''
                  }`}
                  disabled={!isVisible}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium text-center leading-tight">{tab.label}</span>
                  {isActive && <Badge variant="secondary" className="text-xs px-1">Active</Badge>}
                </TabsTrigger>
              )
            })}
        </TabsList>

        <TabsContent value="general">
          <div className="space-y-6">
            <GeneralSettings />
            {process.env.NODE_ENV === 'development' && <CurrencyDetectorTest />}
          </div>
        </TabsContent>

        <TabsContent value="branding">
          <BrandingSettings />
        </TabsContent>

        <TabsContent value="locations">
          {console.log("⚙️ Settings: Rendering Locations tab")}
          <LocationSettings />
        </TabsContent>

        <TabsContent value="users">
          <UserSettings />
        </TabsContent>

        <TabsContent value="credentials">
          <StaffCredentialSettings />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationSettings />
        </TabsContent>

        <TabsContent value="notifications">
          <EnhancedNotificationSettings />
        </TabsContent>

        <TabsContent value="checkout">
          <CheckoutSettings />
        </TabsContent>

        <TabsContent value="carousel">
          <CarouselSettings />
        </TabsContent>

        {user?.role === "super_admin" && (
          <TabsContent value="loyalty">
            <LoyaltySettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

