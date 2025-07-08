"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookingForm } from "@/components/booking/booking-form"
import { ServicesList } from "@/components/booking/services-list"
import { LocationSelector } from "@/components/booking/location-selector"
import { Logo, FooterLogo } from "@/components/ui/logo"

export default function BookingPage() {
  const [selectedLocation, setSelectedLocation] = useState("downtown")

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Logo href="/" showName={true} />
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#" className="text-sm font-medium hover:underline">
              Services
            </Link>
            <Link href="#" className="text-sm font-medium hover:underline">
              Stylists
            </Link>
            <Link href="#" className="text-sm font-medium hover:underline">
              Locations
            </Link>
            <Link href="#" className="text-sm font-medium hover:underline">
              Gallery
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/client-login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/booking">
              <Button size="sm">Book Now</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-8 md:py-12">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Book Your Appointment</h1>
            <p className="mt-2 text-muted-foreground">Schedule your next salon service in just a few clicks.</p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Select Location</CardTitle>
              <CardDescription>Choose the salon location for your appointment</CardDescription>
            </CardHeader>
            <CardContent>
              <LocationSelector value={selectedLocation} onValueChange={setSelectedLocation} />
            </CardContent>
          </Card>

          <Tabs defaultValue="services" className="w-full">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="services" className="flex-1">
                1. Select Service
              </TabsTrigger>
              <TabsTrigger value="stylist" className="flex-1">
                2. Choose Stylist
              </TabsTrigger>
              <TabsTrigger value="datetime" className="flex-1">
                3. Date & Time
              </TabsTrigger>
              <TabsTrigger value="details" className="flex-1">
                4. Your Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="services">
              <ServicesList location={selectedLocation} />
            </TabsContent>

            <TabsContent value="stylist">
              <Card>
                <CardHeader>
                  <CardTitle>Choose Your Stylist</CardTitle>
                  <CardDescription>Select a stylist for your appointment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Stylist selection will go here */}
                    <p className="text-muted-foreground col-span-full">Please select a service first</p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">Back</Button>
                  <Button>Continue</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="datetime">
              <Card>
                <CardHeader>
                  <CardTitle>Select Date & Time</CardTitle>
                  <CardDescription>Choose when you'd like to book your appointment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    {/* Date and time selection will go here */}
                    <p className="text-muted-foreground">Please select a stylist first</p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">Back</Button>
                  <Button>Continue</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="details">
              <BookingForm />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <footer className="border-t bg-background">
        <div className="container flex flex-col gap-6 py-8 md:py-12 px-4 md:px-6">
          <div className="flex flex-col gap-4 sm:flex-row justify-between items-center">
            <div className="flex items-center gap-2">
              <FooterLogo />
              <p className="text-sm text-muted-foreground">© 2025. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

console.log("Categories:", categories);
console.log("Services:", services);
console.log("Selected Location:", selectedLocation);

