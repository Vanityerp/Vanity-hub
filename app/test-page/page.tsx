"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function TestPage() {
  const [message, setMessage] = useState("Loading...")

  useEffect(() => {
    // Simple test to verify the page can render
    setMessage("Test page loaded successfully!")
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-pink-600 mb-4">Test Page</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex flex-col gap-4">
          <Button 
            onClick={() => window.location.href = "/"}
            className="bg-pink-600 hover:bg-pink-700"
          >
            Go to Home Page
          </Button>
          <Button 
            onClick={() => window.location.href = "/dashboard"}
            variant="outline"
          >
            Go to Dashboard
          </Button>
          <Button 
            onClick={() => window.location.href = "/client-portal"}
            variant="outline"
          >
            Go to Client Portal
          </Button>
        </div>
      </div>
    </div>
  )
}
