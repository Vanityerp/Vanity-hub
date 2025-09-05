"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CurrencyDisplay } from "@/components/ui/currency-display"
// DEPRECATED: Mock data removed - now using real API data
import { Scissors, Palette, Hand, Sparkles, Heart, Brush, Flame, Flower2 } from "lucide-react"
import { ClientPortalLayout } from "@/components/client-portal/client-portal-layout"

export default function BookAppointmentTestPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Get service categories
  // TODO: Replace with real API call to fetch categories and services
  const serviceCategories: string[] = []

  // Filter services by category
  const filteredServices: any[] = []

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        <p className="ml-4 text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <ClientPortalLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h1 className="text-2xl font-bold mb-6">Book an Appointment - Test Page</h1>

            <h2 className="text-xl font-bold mb-4">Select a Service Category</h2>

            {/* Horizontal Category Selection */}
            <div className="flex flex-col gap-2 mb-8">
              <div className="flex overflow-x-auto pb-3 -mx-2 px-2 hide-scrollbar">
                <div className="flex space-x-4 min-w-full py-3">
                  {serviceCategories.slice(0,6).map((category) => {
                    const isSelected = selectedCategory === category;
                    return (
                      <div
                        key={category}
                        className={`flex-shrink-0 flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-all ${isSelected ? "border-pink-600 bg-pink-50" : "border-gray-200 hover:border-pink-200"}`}
                        onClick={(e) => { e.preventDefault(); setSelectedCategory(category); }}
                        style={{ minWidth: '85px' }}
                      >
                        <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 mb-2">
                          {category === "Hair" && <Scissors className="h-5 w-5" />}
                          {category === "Color" && <Palette className="h-5 w-5" />}
                          {category === "Nails" && <Hand className="h-5 w-5" />}
                          {category === "Skin" && <Sparkles className="h-5 w-5" />}
                          {category === "Massage" && <Heart className="h-5 w-5" />}
                          {category === "Henna" && <Flower2 className="h-5 w-5" />}
                          {!["Hair","Color","Nails","Skin","Massage","Henna"].includes(category) && <Sparkles className="h-5 w-5" />}
                        </div>
                        <p className="font-medium text-center text-sm">{category}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex overflow-x-auto pb-3 -mx-2 px-2 hide-scrollbar">
                <div className="flex space-x-4 min-w-full py-3">
                  {serviceCategories.slice(6).map((category) => {
                    const isSelected = selectedCategory === category;
                    return (
                      <div
                        key={category}
                        className={`flex-shrink-0 flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-all ${isSelected ? "border-pink-600 bg-pink-50" : "border-gray-200 hover:border-pink-200"}`}
                        onClick={(e) => { e.preventDefault(); setSelectedCategory(category); }}
                        style={{ minWidth: '85px' }}
                      >
                        <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 mb-2">
                          {category === "Weyba Tis" && <Sparkles className="h-5 w-5" />}
                          {category === "Makeup" && <Brush className="h-5 w-5" />}
                          {category === "Waxing" && <Flame className="h-5 w-5" />}
                          {category === "Extensions" && <Scissors className="h-5 w-5" />}
                          {category === "Bridal" && <Heart className="h-5 w-5" />}
                          {!["Weyba Tis","Makeup","Waxing","Extensions","Bridal"].includes(category) && <Sparkles className="h-5 w-5" />}
                        </div>
                        <p className="font-medium text-center text-sm">{category}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Display Services for Selected Category */}
            {selectedCategory && (
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-medium mb-4">{selectedCategory} Services</h3>
                <div className="grid gap-4">
                  {filteredServices.map((service) => {
                    const isServiceSelected = selectedService === service.id;

                    return (
                      <div
                        key={service.id}
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all
                          ${isServiceSelected
                            ? "border-pink-600 bg-pink-50"
                            : "border-gray-200 hover:border-pink-200"}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedService(service.id);
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-gray-500">{service.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium"><CurrencyDisplay amount={service.price} /></p>
                          <p className="text-sm text-gray-500">{service.duration} min</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            onClick={() => window.location.href = "/client-portal/appointments/book"}
            className="bg-pink-600 hover:bg-pink-700"
          >
            Go to Full Booking Page
          </Button>
        </div>
        </div>
      </div>
    </ClientPortalLayout>
  )
}
