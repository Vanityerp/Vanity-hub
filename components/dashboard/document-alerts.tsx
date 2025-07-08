"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, User, AlertTriangle, AlertCircle, Calendar, ExternalLink } from 'lucide-react'
import { format, parseISO, differenceInDays } from "date-fns"
import { useAuth } from "@/lib/auth-provider"
import { useStaff } from "@/lib/staff-provider"
import { CompanyDocumentStorage, CompanyDocument, CompanyDocumentStatus } from "@/lib/company-document-storage"
import { DocumentStorage, DocumentStatus, type StaffDocument } from "@/lib/document-storage"
import { getDocumentValidityStatus } from "@/lib/staff-storage"

interface DocumentAlertsProps {
  className?: string
}

export function DocumentAlerts({ className }: DocumentAlertsProps) {
  const { hasPermission } = useAuth()
  const { activeStaff } = useStaff()
  const router = useRouter()

  // Company document states
  const [expiredDocuments, setExpiredDocuments] = useState<CompanyDocument[]>([])
  const [expiringSoonDocuments, setExpiringSoonDocuments] = useState<CompanyDocument[]>([])

  // Staff document states
  const [expiredStaffDocuments, setExpiredStaffDocuments] = useState<StaffDocument[]>([])
  const [expiringSoonStaffDocuments, setExpiringSoonStaffDocuments] = useState<StaffDocument[]>([])

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDocumentAlerts()

    // Refresh alerts every minute
    const interval = setInterval(loadDocumentAlerts, 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // Helper function to convert staff validity dates to document-like objects
  const getStaffValidityDocuments = () => {
    const staffValidityDocs: StaffDocument[] = []

    activeStaff.forEach(staff => {
      // Check QID validity
      if (staff.qidValidity) {
        const qidStatus = getDocumentValidityStatus(staff.qidValidity)
        if (qidStatus === 'expired' || qidStatus === 'expiring') {
          staffValidityDocs.push({
            id: `qid-${staff.id}`,
            staffId: staff.id,
            staffName: staff.name,
            documentType: 'qid',
            documentTypeName: 'QID',
            documentNumber: staff.qidNumber || 'N/A',
            issueDate: '',
            expiryDate: convertValidityDateToISO(staff.qidValidity),
            status: qidStatus === 'expired' ? DocumentStatus.EXPIRED : DocumentStatus.EXPIRING_SOON,
            uploadedAt: '',
            updatedAt: ''
          })
        }
      }

      // Check Passport validity
      if (staff.passportValidity) {
        const passportStatus = getDocumentValidityStatus(staff.passportValidity)
        if (passportStatus === 'expired' || passportStatus === 'expiring') {
          staffValidityDocs.push({
            id: `passport-${staff.id}`,
            staffId: staff.id,
            staffName: staff.name,
            documentType: 'passport',
            documentTypeName: 'Passport',
            documentNumber: staff.passportNumber || 'N/A',
            issueDate: '',
            expiryDate: convertValidityDateToISO(staff.passportValidity),
            status: passportStatus === 'expired' ? DocumentStatus.EXPIRED : DocumentStatus.EXPIRING_SOON,
            uploadedAt: '',
            updatedAt: ''
          })
        }
      }

      // Check Medical validity
      if (staff.medicalValidity) {
        const medicalStatus = getDocumentValidityStatus(staff.medicalValidity)
        if (medicalStatus === 'expired' || medicalStatus === 'expiring') {
          staffValidityDocs.push({
            id: `medical-${staff.id}`,
            staffId: staff.id,
            staffName: staff.name,
            documentType: 'medical',
            documentTypeName: 'Medical Certificate',
            documentNumber: 'N/A',
            issueDate: '',
            expiryDate: convertValidityDateToISO(staff.medicalValidity),
            status: medicalStatus === 'expired' ? DocumentStatus.EXPIRED : DocumentStatus.EXPIRING_SOON,
            uploadedAt: '',
            updatedAt: ''
          })
        }
      }
    })

    return staffValidityDocs
  }

  // Helper function to convert DD-MM-YY format to ISO date string
  const convertValidityDateToISO = (validityDate: string): string => {
    try {
      const [day, month, year] = validityDate.split('-').map(Number)
      const fullYear = year < 50 ? 2000 + year : 1900 + year
      return format(new Date(fullYear, month - 1, day), 'yyyy-MM-dd')
    } catch (error) {
      return format(new Date(), 'yyyy-MM-dd')
    }
  }

  const loadDocumentAlerts = () => {
    try {
      // Update document statuses first
      CompanyDocumentStorage.updateDocumentStatuses()
      DocumentStorage.updateDocumentStatuses()

      // Get company documents
      const expired = CompanyDocumentStorage.getDocumentsByStatus(CompanyDocumentStatus.EXPIRED)
      const expiringSoon = CompanyDocumentStorage.getDocumentsByStatus(CompanyDocumentStatus.EXPIRING_SOON)

      // Get staff documents from DocumentStorage
      const uploadedStaffExpired = DocumentStorage.getDocumentsByStatus(DocumentStatus.EXPIRED)
      const uploadedStaffExpiringSoon = DocumentStorage.getDocumentsByStatus(DocumentStatus.EXPIRING_SOON)

      // Get staff validity documents (QID, Passport, Medical)
      const staffValidityDocs = getStaffValidityDocuments()
      const validityExpired = staffValidityDocs.filter(doc => doc.status === DocumentStatus.EXPIRED)
      const validityExpiringSoon = staffValidityDocs.filter(doc => doc.status === DocumentStatus.EXPIRING_SOON)

      // Combine uploaded documents with validity documents
      const allStaffExpired = [...uploadedStaffExpired, ...validityExpired]
      const allStaffExpiringSoon = [...uploadedStaffExpiringSoon, ...validityExpiringSoon]

      setExpiredDocuments(expired)
      setExpiringSoonDocuments(expiringSoon)
      setExpiredStaffDocuments(allStaffExpired)
      setExpiringSoonStaffDocuments(allStaffExpiringSoon)
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading document alerts:', error)
      setIsLoading(false)
    }
  }

  const handleManageDocuments = () => {
    router.push('/dashboard/hr?tab=company-documents')
  }

  const totalAlerts = expiredDocuments.length + expiringSoonDocuments.length +
                     expiredStaffDocuments.length + expiringSoonStaffDocuments.length

  // Early return for permission check
  if (!hasPermission("view_company_documents") && !hasPermission("all")) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Document Alerts
          </CardTitle>
          <CardDescription>Access denied - insufficient permissions</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Early return for loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Document Alerts
          </CardTitle>
          <CardDescription>Loading document alerts...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={`${className} dashboard-card`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="truncate">Document Alerts</span>
              {totalAlerts > 0 && (
                <Badge variant="destructive" className="ml-2 flex-shrink-0">
                  {totalAlerts}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="truncate">
              {totalAlerts === 0
                ? "All documents are up to date"
                : `${expiredDocuments.length + expiredStaffDocuments.length} expired, ${expiringSoonDocuments.length + expiringSoonStaffDocuments.length} expiring soon`
              }
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleManageDocuments} className="flex-shrink-0">
            <ExternalLink className="w-4 h-4 mr-2" />
            Manage
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {totalAlerts === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <p className="text-lg font-medium text-green-600">All Documents Current</p>
            <p className="text-sm">No expired or expiring documents found</p>
          </div>
        ) : (
          <Tabs defaultValue="company" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="company" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Company
                {(expiredDocuments.length + expiringSoonDocuments.length) > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs">
                    {expiredDocuments.length + expiringSoonDocuments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="staff" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Staff
                {(expiredStaffDocuments.length + expiringSoonStaffDocuments.length) > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs">
                    {expiredStaffDocuments.length + expiringSoonStaffDocuments.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="company" className="space-y-4 mt-4">
              {(expiredDocuments.length === 0 && expiringSoonDocuments.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium text-green-600">All Company Documents Current</p>
                  <p className="text-sm">No expired or expiring company documents found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Company document alerts will be displayed here when available.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="staff" className="space-y-4 mt-4">
              {(expiredStaffDocuments.length === 0 && expiringSoonStaffDocuments.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium text-green-600">All Staff Documents Current</p>
                  <p className="text-sm">No expired or expiring staff documents found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Staff document alerts will be displayed here when available.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

// Hook to get document alert counts for tab display
export function useDocumentAlertCounts() {
  const [counts, setCounts] = useState({ expired: 0, expiringSoon: 0, staffExpired: 0, staffExpiringSoon: 0 })
  const { hasPermission } = useAuth()
  const { activeStaff } = useStaff()

  // Helper function to get staff validity documents for counts
  const getStaffValidityDocumentsForCounts = () => {
    const staffValidityDocs: StaffDocument[] = []

    activeStaff.forEach(staff => {
      // Check QID validity
      if (staff.qidValidity) {
        const qidStatus = getDocumentValidityStatus(staff.qidValidity)
        if (qidStatus === 'expired' || qidStatus === 'expiring') {
          staffValidityDocs.push({
            id: `qid-${staff.id}`,
            staffId: staff.id,
            staffName: staff.name,
            documentType: 'qid',
            documentTypeName: 'QID',
            documentNumber: staff.qidNumber || 'N/A',
            issueDate: '',
            expiryDate: convertValidityDateToISOForCounts(staff.qidValidity),
            status: qidStatus === 'expired' ? DocumentStatus.EXPIRED : DocumentStatus.EXPIRING_SOON,
            uploadedAt: '',
            updatedAt: ''
          })
        }
      }

      // Check Passport validity
      if (staff.passportValidity) {
        const passportStatus = getDocumentValidityStatus(staff.passportValidity)
        if (passportStatus === 'expired' || passportStatus === 'expiring') {
          staffValidityDocs.push({
            id: `passport-${staff.id}`,
            staffId: staff.id,
            staffName: staff.name,
            documentType: 'passport',
            documentTypeName: 'Passport',
            documentNumber: staff.passportNumber || 'N/A',
            issueDate: '',
            expiryDate: convertValidityDateToISOForCounts(staff.passportValidity),
            status: passportStatus === 'expired' ? DocumentStatus.EXPIRED : DocumentStatus.EXPIRING_SOON,
            uploadedAt: '',
            updatedAt: ''
          })
        }
      }

      // Check Medical validity
      if (staff.medicalValidity) {
        const medicalStatus = getDocumentValidityStatus(staff.medicalValidity)
        if (medicalStatus === 'expired' || medicalStatus === 'expiring') {
          staffValidityDocs.push({
            id: `medical-${staff.id}`,
            staffId: staff.id,
            staffName: staff.name,
            documentType: 'medical',
            documentTypeName: 'Medical Certificate',
            documentNumber: 'N/A',
            issueDate: '',
            expiryDate: convertValidityDateToISOForCounts(staff.medicalValidity),
            status: medicalStatus === 'expired' ? DocumentStatus.EXPIRED : DocumentStatus.EXPIRING_SOON,
            uploadedAt: '',
            updatedAt: ''
          })
        }
      }
    })

    return staffValidityDocs
  }

  // Helper function to convert DD-MM-YY format to ISO date string for counts
  const convertValidityDateToISOForCounts = (validityDate: string): string => {
    try {
      const [day, month, year] = validityDate.split('-').map(Number)
      const fullYear = year < 50 ? 2000 + year : 1900 + year
      return format(new Date(fullYear, month - 1, day), 'yyyy-MM-dd')
    } catch (error) {
      return format(new Date(), 'yyyy-MM-dd')
    }
  }

  useEffect(() => {
    if (!hasPermission("view_company_documents") && !hasPermission("all")) {
      return
    }

    const updateCounts = () => {
      try {
        // Update both company and staff document statuses
        CompanyDocumentStorage.updateDocumentStatuses()
        DocumentStorage.updateDocumentStatuses()

        // Get company document counts
        const companySummary = CompanyDocumentStorage.getExpirySummary()

        // Get staff document counts from DocumentStorage
        const uploadedStaffExpired = DocumentStorage.getDocumentsByStatus(DocumentStatus.EXPIRED)
        const uploadedStaffExpiringSoon = DocumentStorage.getDocumentsByStatus(DocumentStatus.EXPIRING_SOON)

        // Get staff validity documents (QID, Passport, Medical)
        const staffValidityDocs = getStaffValidityDocumentsForCounts()
        const validityExpired = staffValidityDocs.filter(doc => doc.status === DocumentStatus.EXPIRED)
        const validityExpiringSoon = staffValidityDocs.filter(doc => doc.status === DocumentStatus.EXPIRING_SOON)

        // Combine uploaded documents with validity documents
        const totalStaffExpired = uploadedStaffExpired.length + validityExpired.length
        const totalStaffExpiringSoon = uploadedStaffExpiringSoon.length + validityExpiringSoon.length

        setCounts({
          expired: companySummary.expired,
          expiringSoon: companySummary.expiringSoon,
          staffExpired: totalStaffExpired,
          staffExpiringSoon: totalStaffExpiringSoon
        })
      } catch (error) {
        console.error('Error updating document alert counts:', error)
      }
    }

    updateCounts()

    // Update counts every minute
    const interval = setInterval(updateCounts, 60 * 1000)

    return () => clearInterval(interval)
  }, [hasPermission])

  return counts
}
