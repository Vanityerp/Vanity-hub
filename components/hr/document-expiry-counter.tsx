"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, FileWarning } from "lucide-react"
import { DocumentStorage, DocumentStatus } from "@/lib/document-storage"
import { NotificationService } from "@/lib/notification-service"
import { useRouter } from "next/navigation"

export function DocumentExpiryCounter() {
  const router = useRouter()
  const [expiringCount, setExpiringCount] = useState(0)
  const [expiredCount, setExpiredCount] = useState(0)

  // Load data on component mount
  useEffect(() => {
    loadData()

    // Set up interval to check for expiring documents
    const interval = setInterval(() => {
      loadData()
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  // Load document counts
  const loadData = () => {
    // Update document statuses first
    DocumentStorage.updateDocumentStatuses()

    // Get expiring and expired documents
    const expiringDocs = DocumentStorage.getExpiringDocuments()
    const expiredDocs = DocumentStorage.getExpiredDocuments()

    setExpiringCount(expiringDocs.length)
    setExpiredCount(expiredDocs.length)
  }

  // Navigate to documents tab
  const navigateToDocuments = () => {
    // Check if we're already on the HR page
    const isHRPage = window.location.pathname.includes('/dashboard/hr')

    if (isHRPage) {
      // Just update the tab parameter
      router.push("/dashboard/hr?tab=documents", { scroll: false })
    } else {
      // We're on a different page, navigate to the HR page with the documents tab
      router.push("/dashboard/hr?tab=documents")
    }
  }

  // Get badge variant based on count
  const getBadgeVariant = (count: number) => {
    if (count === 0) return "success"
    if (count <= 5) return "default" // Yellow
    return "destructive" // Red
  }

  // Get total count
  const totalCount = expiringCount + expiredCount

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-sm font-medium">Document Compliance</CardTitle>
            <CardDescription>Expiring documents</CardDescription>
          </div>
          <Badge variant={getBadgeVariant(totalCount)} className="ml-2">
            {totalCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <FileWarning className="h-4 w-4 text-yellow-500 mr-2" />
              <span className="text-sm">Expiring Soon</span>
            </div>
            <span className="font-medium">{expiringCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-sm">Expired</span>
            </div>
            <span className="font-medium">{expiredCount}</span>
          </div>

          {totalCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={navigateToDocuments}
            >
              View Documents
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
