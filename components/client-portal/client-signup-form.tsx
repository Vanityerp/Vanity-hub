"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useClients } from "@/lib/client-provider"

export function ClientSignupForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { addClient, autoRegisterClient, findClientByPhoneAndName, updateClient } = useClients()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    marketingConsent: false
  })

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (!formData.agreeTerms) {
      toast({
        title: "Error",
        description: "You must agree to the terms and conditions",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // In a real app, this would be an API call to register the client
      // For now, we'll simulate a successful registration with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Use auto-registration to check for duplicates and create client
      const newClient = await autoRegisterClient({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        source: "client_portal",
        preferredLocation: "loc1"
      })

      if (newClient) {
        // Check if this is an existing client or newly created
        const existingClient = findClientByPhoneAndName(formData.phone, `${formData.firstName} ${formData.lastName}`)

        if (existingClient && existingClient.id === newClient.id) {
          // Update existing client with new email if different
          if (existingClient.email !== formData.email) {
            updateClient(existingClient.id, { email: formData.email })
          }

          // Store authentication for existing client
          localStorage.setItem("client_auth_token", "sample_token")
          localStorage.setItem("client_email", formData.email)
          localStorage.setItem("client_id", existingClient.id)

          toast({
            title: "Welcome back!",
            description: "You already have an account. You've been logged in.",
          })

          router.push("/client-portal")
          return
        }

        // Store authentication token in localStorage for new client
        localStorage.setItem("client_auth_token", "sample_token")
        localStorage.setItem("client_email", formData.email)
        localStorage.setItem("client_id", newClient.id)
      } else {
        throw new Error("Failed to create or find client")
      }

      // Dispatch custom event to notify parent components of login
      window.dispatchEvent(new CustomEvent('client-auth-changed', { detail: { isLoggedIn: true } }))

      toast({
        title: "Success",
        description: "Your account has been created successfully",
      })

      // Redirect to client portal home
      router.push("/client-portal")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            placeholder="John"
            value={formData.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            placeholder="Doe"
            value={formData.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="(555) 123-4567"
          value={formData.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => handleChange("password", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={(e) => handleChange("confirmPassword", e.target.value)}
          required
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="agree-terms"
            checked={formData.agreeTerms}
            onCheckedChange={(checked) => handleChange("agreeTerms", checked)}
            required
          />
          <Label htmlFor="agree-terms" className="text-sm leading-tight">
            I agree to the{" "}
            <Link href="/client-portal/terms" className="text-pink-600 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/client-portal/privacy" className="text-pink-600 hover:underline">
              Privacy Policy
            </Link>
          </Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="marketing-consent"
            checked={formData.marketingConsent}
            onCheckedChange={(checked) => handleChange("marketingConsent", checked)}
          />
          <Label htmlFor="marketing-consent" className="text-sm leading-tight">
            I would like to receive promotional emails about special offers, new services, and events
          </Label>
        </div>
      </div>

      <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>

      <div className="text-center text-sm text-gray-500 mt-4">
        Already have an account?{" "}
        <Link href="/client-portal#auth-section" onClick={() => document.dispatchEvent(new CustomEvent('switch-auth-tab', { detail: 'login' }))} className="text-pink-600 hover:underline">
          Sign in
        </Link>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" type="button" className="w-full">
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </Button>
        <Button variant="outline" type="button" className="w-full">
          <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
          </svg>
          Facebook
        </Button>
      </div>
    </form>
  )
}
