"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Info, X } from "lucide-react"

export function LocationUpdateNotification() {
  const [showNotification, setShowNotification] = useState(false)
  const [hasUpdated, setHasUpdated] = useState(false)

  // Check if we need to show the notification
  useEffect(() => {
    // Check if we've already shown and dismissed this notification
    const notificationDismissed = localStorage.getItem('location_update_notification_dismissed')
    
    if (notificationDismissed !== 'true') {
      // Check if there are services with loc4 in localStorage
      try {
        const servicesJson = localStorage.getItem('vanity_services')
        if (servicesJson) {
          const services = JSON.parse(servicesJson)
          
          if (Array.isArray(services)) {
            // Check if any service has loc4 in its locations
            const hasLoc4 = services.some(service => 
              service && 
              Array.isArray(service.locations) && 
              service.locations.includes('loc4')
            )
            
            setShowNotification(hasLoc4)
          }
        }
      } catch (error) {
        console.error('Error checking for loc4 in services:', error)
      }
    }
  }, [])

  // Function to update services
  const updateServices = () => {
    try {
      // Get services from localStorage
      const servicesJson = localStorage.getItem('vanity_services')
      
      if (servicesJson) {
        let services = JSON.parse(servicesJson)
        
        if (Array.isArray(services)) {
          // Update services with loc4
          const updatedServices = services.map(service => {
            if (service && Array.isArray(service.locations)) {
              service.locations = service.locations.map(loc => 
                loc === 'loc4' ? 'home' : loc
              )
            }
            return service
          })
          
          // Save updated services back to localStorage
          localStorage.setItem('vanity_services', JSON.stringify(updatedServices))
          
          setHasUpdated(true)
          
          // Hide notification after 3 seconds
          setTimeout(() => {
            setShowNotification(false)
            localStorage.setItem('location_update_notification_dismissed', 'true')
          }, 3000)
        }
      }
    } catch (error) {
      console.error('Error updating services:', error)
    }
  }

  // Dismiss notification
  const dismissNotification = () => {
    setShowNotification(false)
    localStorage.setItem('location_update_notification_dismissed', 'true')
  }

  if (!showNotification) {
    return null
  }

  return (
    <Alert className="mb-4 border-amber-500 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
      <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-800 dark:text-amber-300">
        {hasUpdated ? "Location Update Complete" : "Location Update Required"}
      </AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-400">
        {hasUpdated 
          ? "Services have been updated to use valid locations. Please refresh the page to see the changes."
          : "Some services are using an unknown location. Click the button below to update them to use Home Service instead."}
      </AlertDescription>
      <div className="mt-2 flex justify-end gap-2">
        {!hasUpdated && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={updateServices}
            className="border-amber-500 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900"
          >
            Update Services
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={dismissNotification}
          className="text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  )
}
