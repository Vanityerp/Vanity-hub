"use client"

import React, { useState, useEffect } from 'react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar, ShoppingBag, Scissors, Star, User, UserPlus } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientLoginForm } from "@/components/client-portal/client-login-form"
import { ClientSignupForm } from "@/components/client-portal/client-signup-form"

export default function ClientPortalPage() {
  const [activeTab, setActiveTab] = useState<string>("login")
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)

  // Check authentication status
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem("client_auth_token")
      setIsLoggedIn(!!token)
    }

    // Check on mount
    checkAuthStatus()

    // Listen for storage changes (in case user logs in/out in another tab)
    window.addEventListener('storage', checkAuthStatus)

    // Listen for custom auth events (when user logs in/out in same tab)
    const handleAuthChange = (event: CustomEvent) => {
      setIsLoggedIn(event.detail.isLoggedIn)
    }
    window.addEventListener('client-auth-changed', handleAuthChange as EventListener)

    return () => {
      window.removeEventListener('storage', checkAuthStatus)
      window.removeEventListener('client-auth-changed', handleAuthChange as EventListener)
    }
  }, [])

  // Listen for custom event to switch tabs
  React.useEffect(() => {
    const handleSwitchTab = (event: CustomEvent) => {
      if (event.detail === 'login' || event.detail === 'signup') {
        setActiveTab(event.detail)
        // Scroll to auth section
        const authSection = document.getElementById('auth-section')
        if (authSection) {
          authSection.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }

    // Add event listener
    document.addEventListener('switch-auth-tab', handleSwitchTab as EventListener)

    // Clean up
    return () => {
      document.removeEventListener('switch-auth-tab', handleSwitchTab as EventListener)
    }
  }, [])

  return (
    <div className="bg-gradient-to-b from-pink-50 to-white">
      {/* Hero Section */}
      <section className="py-16 md:py-24 container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Your Beauty Journey <span className="text-pink-600">Starts Here</span>
          </h1>
          <p className="text-lg text-gray-600 mt-4">
            Book appointments, manage your beauty schedule, and shop your favorite products all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button size="lg" className="bg-pink-600 hover:bg-pink-700" asChild>
              <Link href="/client-portal/appointments/book">
                <Calendar className="mr-2 h-5 w-5" />
                Book Appointment
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/client-portal/services">
                Explore Services
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Authentication Section - Only show if not logged in */}
      {!isLoggedIn && (
        <section id="auth-section" className="py-16 container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card className="border shadow-lg">
              <CardHeader>
                <CardTitle className="text-center text-2xl">
                  {activeTab === "login" ? "Sign In to Your Account" : "Create an Account"}
                </CardTitle>
                <CardDescription className="text-center">
                  {activeTab === "login"
                    ? "Access your appointments, orders, and more"
                    : "Join Vanity Hub to book appointments and enjoy exclusive benefits"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="login">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>
                  <TabsContent value="login">
                    <ClientLoginForm />
                  </TabsContent>
                  <TabsContent value="signup">
                    <ClientSignupForm />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Welcome Back Section - Only show if logged in */}
      {isLoggedIn && (
        <section className="py-16 container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="border shadow-lg bg-gradient-to-r from-pink-50 to-purple-50">
              <CardContent className="pt-8 pb-8">
                <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 mx-auto mb-4">
                  <User className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Welcome Back!</h2>
                <p className="text-gray-600 mb-6">
                  You're signed in and ready to manage your beauty journey.
                </p>
                <div className="flex justify-center">
                  <Button size="lg" className="bg-pink-600 hover:bg-pink-700" asChild>
                    <Link href="/client-portal/dashboard">
                      <User className="mr-2 h-5 w-5" />
                      Go to Dashboard
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 mb-4">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Easy Scheduling</h3>
                <p className="text-gray-600 mb-4">
                  Book appointments anytime, anywhere. Choose your preferred stylist, service, and time slot.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 mb-4">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Shop Products</h3>
                <p className="text-gray-600 mb-4">
                  Browse and purchase your favorite beauty products with exclusive client discounts.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 mb-4">
                  <Scissors className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Premium Services</h3>
                <p className="text-gray-600 mb-4">
                  Experience top-quality beauty services from our professional stylists.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
