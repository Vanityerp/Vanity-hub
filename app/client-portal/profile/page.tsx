"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StaffAvatar } from "@/components/ui/staff-avatar"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { ClientPortalLayout } from "@/components/client-portal/client-portal-layout"
import { useToast } from "@/components/ui/use-toast"
import { useClients } from "@/lib/client-provider"
import { useLocations } from "@/lib/location-provider"
import {
  User,
  Lock,
  Bell,
  CreditCard,
  MapPin,
  Calendar,
  Save,
  Pencil,
  Check
} from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { clients, getClient, updateClient } = useClients()
  const { locations: locationsList, getLocationName } = useLocations()
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("personal")
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    birthday: "",
    preferredLocation: "loc1",
    emailNotifications: true,
    smsNotifications: true,
    appointmentReminders: true,
    marketingEmails: false,
    specialOffers: true
  })

  // Check if client is authenticated
  useEffect(() => {
    const token = localStorage.getItem("client_auth_token")
    const clientEmail = localStorage.getItem("client_email")
    const clientId = localStorage.getItem("client_id")

    if (!token || !clientEmail) {
      toast({
        title: "Authentication required",
        description: "Please sign in to access your profile",
        variant: "destructive",
      })
      router.push("/client-portal")
      return
    }

    // Find client by email or ID
    let foundClient
    if (clientId) {
      foundClient = getClient(clientId)
    } else {
      foundClient = clients.find(c => c.email === clientEmail)
    }

    if (foundClient) {
      setClient(foundClient)

      // Initialize form data
      const nameParts = foundClient.name.split(" ")
      setFormData({
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: foundClient.email || "",
        phone: foundClient.phone || "",
        address: foundClient.address || "",
        city: foundClient.city || "",
        state: foundClient.state || "",
        zip: foundClient.zip || "",
        birthday: foundClient.birthday || "",
        preferredLocation: foundClient.preferredLocation || "loc1",
        emailNotifications: true,
        smsNotifications: true,
        appointmentReminders: true,
        marketingEmails: false,
        specialOffers: true
      })
    } else {
      // If client not found, create a mock client for demo purposes
      const mockClient = {
        id: "client123",
        name: "Jane Smith",
        email: clientEmail,
        phone: "(555) 123-4567",
        preferredLocation: "loc1",
        avatar: "JS",
        memberSince: "January 2025"
      }

      setClient(mockClient)

      // Initialize form data with mock data
      setFormData({
        firstName: "Jane",
        lastName: "Smith",
        email: clientEmail || "",
        phone: "(555) 123-4567",
        address: "123 Main St",
        city: "New York",
        state: "NY",
        zip: "10001",
        birthday: "1990-01-15",
        preferredLocation: "loc1",
        emailNotifications: true,
        smsNotifications: true,
        appointmentReminders: true,
        marketingEmails: false,
        specialOffers: true
      })
    }

    setLoading(false)
  }, [clients, getClient, router, toast])

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      // In a real app, this would be an API call to update the client
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update client in context
      if (client.id) {
        updateClient(client.id, {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          birthday: formData.birthday,
          preferredLocation: formData.preferredLocation
        })
      }

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      })

      setIsEditing(false)
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
    )
  }

  return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">My Profile</h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button
                className="bg-pink-600 hover:bg-pink-700"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center mb-6">
                  <Avatar className="h-24 w-24 mb-4 bg-pink-100 text-pink-800">
                    <AvatarFallback>{client?.avatar || client?.name?.split(" ").map((n: string) => n[0]).join("") || "C"}</AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-bold">{client?.name}</h2>
                  <p className="text-gray-500">Member since {client?.memberSince || "January 2025"}</p>
                </div>

                <nav className="space-y-1">
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${activeTab === "personal" ? "bg-pink-50 text-pink-600" : ""}`}
                    onClick={() => setActiveTab("personal")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Personal Information
                  </Button>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${activeTab === "password" ? "bg-pink-50 text-pink-600" : ""}`}
                    onClick={() => setActiveTab("password")}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Password & Security
                  </Button>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${activeTab === "notifications" ? "bg-pink-50 text-pink-600" : ""}`}
                    onClick={() => setActiveTab("notifications")}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </Button>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${activeTab === "payment" ? "bg-pink-50 text-pink-600" : ""}`}
                    onClick={() => setActiveTab("payment")}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Payment Methods
                  </Button>
                </nav>
              </CardContent>
            </Card>

            <div className="mt-6 space-y-4">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/client-portal/appointments">
                  <Calendar className="mr-2 h-4 w-4" />
                  My Appointments
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/client-portal/orders">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Order History
                </Link>
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === "personal" && "Personal Information"}
                  {activeTab === "password" && "Password & Security"}
                  {activeTab === "notifications" && "Notification Preferences"}
                  {activeTab === "payment" && "Payment Methods"}
                </CardTitle>
                <CardDescription>
                  {activeTab === "personal" && "Manage your personal details and preferences"}
                  {activeTab === "password" && "Update your password and security settings"}
                  {activeTab === "notifications" && "Control how we communicate with you"}
                  {activeTab === "payment" && "Manage your saved payment methods"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Personal Information */}
                {activeTab === "personal" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => handleChange("firstName", e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => handleChange("lastName", e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleChange("phone", e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleChange("address", e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleChange("city", e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => handleChange("state", e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip">ZIP Code</Label>
                        <Input
                          id="zip"
                          value={formData.zip}
                          onChange={(e) => handleChange("zip", e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="birthday">Birthday</Label>
                        <Input
                          id="birthday"
                          type="date"
                          value={formData.birthday}
                          onChange={(e) => handleChange("birthday", e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="preferredLocation">Preferred Location</Label>
                        <select
                          id="preferredLocation"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={formData.preferredLocation}
                          onChange={(e) => handleChange("preferredLocation", e.target.value)}
                          disabled={!isEditing}
                        >
                          {/* Filter out online store and home service from client profile preferences */}
                          {locationsList
                            .filter(location =>
                              location.status === "Active" &&
                              location.id !== "online" &&
                              location.id !== "home" &&
                              !location.name.toLowerCase().includes("online store") &&
                              !location.name.toLowerCase().includes("home service")
                            )
                            .map(location => (
                              <option key={location.id} value={location.id}>
                                {location.name}
                              </option>
                            ))
                          }
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Password & Security */}
                {activeTab === "password" && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input id="currentPassword" type="password" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input id="newPassword" type="password" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input id="confirmPassword" type="password" />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-500">
                        Add an extra layer of security to your account by enabling two-factor authentication.
                      </p>
                      <Button variant="outline">
                        Enable Two-Factor Authentication
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-medium">Login History</h3>
                      <p className="text-sm text-gray-500">
                        Recent login activity on your account.
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between p-3 bg-gray-50 rounded-md">
                          <div>
                            <p className="font-medium">Chrome on Windows</p>
                            <p className="text-sm text-gray-500">New York, USA</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">Today, 10:30 AM</p>
                            <p className="text-xs text-green-600">Current session</p>
                          </div>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50 rounded-md">
                          <div>
                            <p className="font-medium">Safari on iPhone</p>
                            <p className="text-sm text-gray-500">New York, USA</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">Yesterday, 3:15 PM</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button className="bg-pink-600 hover:bg-pink-700">
                      Update Password
                    </Button>
                  </div>
                )}

                {/* Notifications */}
                {activeTab === "notifications" && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-medium">Email Notifications</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="email-notifications">Email Notifications</Label>
                            <p className="text-sm text-gray-500">
                              Receive emails for important updates
                            </p>
                          </div>
                          <Switch
                            id="email-notifications"
                            checked={formData.emailNotifications}
                            onCheckedChange={(checked) => handleChange("emailNotifications", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="appointment-reminders">Appointment Reminders</Label>
                            <p className="text-sm text-gray-500">
                              Receive reminders about upcoming appointments
                            </p>
                          </div>
                          <Switch
                            id="appointment-reminders"
                            checked={formData.appointmentReminders}
                            onCheckedChange={(checked) => handleChange("appointmentReminders", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="marketing-emails">Marketing Emails</Label>
                            <p className="text-sm text-gray-500">
                              Receive emails about new products and services
                            </p>
                          </div>
                          <Switch
                            id="marketing-emails"
                            checked={formData.marketingEmails}
                            onCheckedChange={(checked) => handleChange("marketingEmails", checked)}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-medium">SMS Notifications</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="sms-notifications">SMS Notifications</Label>
                            <p className="text-sm text-gray-500">
                              Receive text messages for important updates
                            </p>
                          </div>
                          <Switch
                            id="sms-notifications"
                            checked={formData.smsNotifications}
                            onCheckedChange={(checked) => handleChange("smsNotifications", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="special-offers">Special Offers</Label>
                            <p className="text-sm text-gray-500">
                              Receive text messages about special offers and promotions
                            </p>
                          </div>
                          <Switch
                            id="special-offers"
                            checked={formData.specialOffers}
                            onCheckedChange={(checked) => handleChange("specialOffers", checked)}
                          />
                        </div>
                      </div>
                    </div>

                    <Button className="bg-pink-600 hover:bg-pink-700">
                      Save Preferences
                    </Button>
                  </div>
                )}

                {/* Payment Methods */}
                {activeTab === "payment" && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">Saved Payment Methods</h3>
                        <Button variant="outline" size="sm">
                          Add New Card
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-6 bg-gray-200 rounded"></div>
                            <div>
                              <p className="font-medium">•••• •••• •••• 4242</p>
                              <p className="text-sm text-gray-500">Expires 12/25</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Default
                            </Badge>
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              Remove
                            </Button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-6 bg-gray-200 rounded"></div>
                            <div>
                              <p className="font-medium">•••• •••• •••• 5678</p>
                              <p className="text-sm text-gray-500">Expires 08/26</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              Set as Default
                            </Button>
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-medium">Billing Address</h3>
                      <div className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium">Default Billing Address</p>
                            <p className="text-sm text-gray-500">Used for all transactions</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </div>
                        <div className="text-sm">
                          <p>{formData.firstName} {formData.lastName}</p>
                          <p>{formData.address}</p>
                          <p>{formData.city}, {formData.state} {formData.zip}</p>
                          <p>United States</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  )
}
