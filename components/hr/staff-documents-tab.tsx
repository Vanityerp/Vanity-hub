"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  AlertCircle,
  Download,
  Eye,
  FileText,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Upload
} from "lucide-react"
import { format, parseISO, differenceInDays } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { useStaff } from "@/lib/use-staff-data"
import {
  DocumentStorage,
  DocumentStatus,
  StaffDocument,
  DocumentType
} from "@/lib/document-storage"
import { NotificationService } from "@/lib/notification-service"

export function StaffDocumentsTab() {
  const { toast } = useToast()
  const { staff: realStaff } = useStaff()

  // State for documents and document types
  const [staffDocuments, setStaffDocuments] = useState<StaffDocument[]>([])
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])

  // State for dialogs
  const [isUploadDocumentDialogOpen, setIsUploadDocumentDialogOpen] = useState(false)
  const [isViewDocumentDialogOpen, setIsViewDocumentDialogOpen] = useState(false)
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)

  // State for selected document
  const [selectedDocument, setSelectedDocument] = useState<StaffDocument | null>(null)

  // State for new document upload
  const [uploadDocument, setUploadDocument] = useState({
    staffId: "",
    documentType: "",
    documentNumber: "",
    issueDate: format(new Date(), "yyyy-MM-dd"),
    expiryDate: "",
    documentFile: null as File | null,
  })

  // State for filtering
  const [filters, setFilters] = useState({
    staffId: "all",
    documentType: "all",
    status: "all",
    searchQuery: "",
  })

  // State for sorting
  const [sorting, setSorting] = useState({
    field: "expiryDate",
    direction: "asc" as "asc" | "desc",
  })

  // Load data on component mount
  useEffect(() => {
    loadData()

    // Check for document notifications on mount
    NotificationService.checkExpiringDocuments()
  }, [])

  // Load documents and document types
  const loadData = () => {
    const documents = DocumentStorage.getStaffDocuments()
    const types = DocumentStorage.getDocumentTypes()

    setStaffDocuments(documents)
    setDocumentTypes(types)
  }

  // Handle document upload
  const handleUploadDocument = () => {
    const staff = realStaff.find(s => s.id === uploadDocument.staffId)
    const documentType = documentTypes.find(d => d.id === uploadDocument.documentType)

    if (!staff || !documentType) {
      toast({
        title: "Missing information",
        description: "Please select a staff member and document type.",
        variant: "destructive",
      })
      return
    }

    if (!uploadDocument.documentNumber) {
      toast({
        title: "Missing information",
        description: "Please enter a document number.",
        variant: "destructive",
      })
      return
    }

    if (!uploadDocument.issueDate || !uploadDocument.expiryDate) {
      toast({
        title: "Missing information",
        description: "Please enter issue and expiry dates.",
        variant: "destructive",
      })
      return
    }

    // Create new document
    const newDocument = DocumentStorage.addStaffDocument({
      staffId: staff.id,
      staffName: staff.name,
      documentType: documentType.id,
      documentTypeName: documentType.name,
      documentNumber: uploadDocument.documentNumber,
      issueDate: uploadDocument.issueDate,
      expiryDate: uploadDocument.expiryDate,
      fileName: uploadDocument.documentFile?.name || "document.pdf",
      fileSize: uploadDocument.documentFile ? `${Math.round(uploadDocument.documentFile.size / 1024)} KB` : "0 KB",
      fileType: uploadDocument.documentFile?.type || "application/pdf",
    })

    // Update state
    setStaffDocuments([...staffDocuments, newDocument])

    // Reset form
    setUploadDocument({
      staffId: "",
      documentType: "",
      documentNumber: "",
      issueDate: format(new Date(), "yyyy-MM-dd"),
      expiryDate: "",
      documentFile: null,
    })

    // Close dialog
    setIsUploadDocumentDialogOpen(false)

    // Show success message
    toast({
      title: "Document uploaded",
      description: `${documentType.name} has been uploaded for ${staff.name}.`,
    })
  }

  // Handle document view
  const handleViewDocument = (document: StaffDocument) => {
    setSelectedDocument(document)
    setIsViewDocumentDialogOpen(true)
  }

  // Handle document download
  const handleDownloadDocument = (document: StaffDocument) => {
    // In a real app, this would download the actual file
    toast({
      title: "Document download",
      description: `Downloading ${document.documentTypeName} for ${document.staffName}.`,
    })
  }

  // Handle document delete
  const handleDeleteDocument = (document: StaffDocument) => {
    DocumentStorage.deleteStaffDocument(document.id)

    // Update state
    setStaffDocuments(staffDocuments.filter(d => d.id !== document.id))

    // Show success message
    toast({
      title: "Document deleted",
      description: `${document.documentTypeName} for ${document.staffName} has been deleted.`,
    })
  }

  // Apply filters to documents
  const getFilteredDocuments = () => {
    let filtered = [...staffDocuments]

    // Filter by staff
    if (filters.staffId && filters.staffId !== "all") {
      filtered = filtered.filter(doc => doc.staffId === filters.staffId)
    }

    // Filter by document type
    if (filters.documentType && filters.documentType !== "all") {
      filtered = filtered.filter(doc => doc.documentType === filters.documentType)
    }

    // Filter by status
    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter(doc => doc.status === filters.status)
    }

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(doc =>
        doc.staffName.toLowerCase().includes(query) ||
        doc.documentTypeName.toLowerCase().includes(query) ||
        doc.documentNumber.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sorting.field) {
        case "staffName":
          comparison = a.staffName.localeCompare(b.staffName)
          break
        case "documentTypeName":
          comparison = a.documentTypeName.localeCompare(b.documentTypeName)
          break
        case "documentNumber":
          comparison = a.documentNumber.localeCompare(b.documentNumber)
          break
        case "issueDate":
          comparison = new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime()
          break
        case "expiryDate":
          comparison = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
          break
        case "status":
          comparison = a.status.localeCompare(b.status)
          break
        default:
          comparison = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
      }

      return sorting.direction === "asc" ? comparison : -comparison
    })

    return filtered
  }

  // Get status badge variant based on document status
  const getStatusBadgeVariant = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.VALID:
        return "success"
      case DocumentStatus.EXPIRING_SOON:
        return "default" // Yellow
      case DocumentStatus.EXPIRED:
        return "destructive" // Red
      default:
        return "outline"
    }
  }

  // Get days remaining until expiry
  const getDaysRemaining = (expiryDate: string) => {
    const today = new Date()
    const expiry = parseISO(expiryDate)
    return differenceInDays(expiry, today)
  }

  // Filtered documents
  const filteredDocuments = getFilteredDocuments()

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({...filters, searchQuery: e.target.value})}
              className="pl-8 w-[250px]"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsFilterDialogOpen(true)}>
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
        <Button onClick={() => setIsUploadDocumentDialogOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Documents</CardTitle>
          <CardDescription>
            Track and manage official employee documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => setSorting({
                      field: "staffName",
                      direction: sorting.field === "staffName" && sorting.direction === "asc" ? "desc" : "asc"
                    })}
                  >
                    Staff
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => setSorting({
                      field: "documentTypeName",
                      direction: sorting.field === "documentTypeName" && sorting.direction === "asc" ? "desc" : "asc"
                    })}
                  >
                    Document Type
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => setSorting({
                      field: "documentNumber",
                      direction: sorting.field === "documentNumber" && sorting.direction === "asc" ? "desc" : "asc"
                    })}
                  >
                    Document Number
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => setSorting({
                      field: "issueDate",
                      direction: sorting.field === "issueDate" && sorting.direction === "asc" ? "desc" : "asc"
                    })}
                  >
                    Issue Date
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => setSorting({
                      field: "expiryDate",
                      direction: sorting.field === "expiryDate" && sorting.direction === "asc" ? "desc" : "asc"
                    })}
                  >
                    Expiry Date
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => setSorting({
                      field: "status",
                      direction: sorting.field === "status" && sorting.direction === "asc" ? "desc" : "asc"
                    })}
                  >
                    Status
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                      No documents found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((document) => {
                    const daysRemaining = getDaysRemaining(document.expiryDate)

                    return (
                      <TableRow key={document.id}>
                        <TableCell className="font-medium">{document.staffName}</TableCell>
                        <TableCell>{document.documentTypeName}</TableCell>
                        <TableCell>{document.documentNumber}</TableCell>
                        <TableCell>{format(parseISO(document.issueDate), "MMM d, yyyy")}</TableCell>
                        <TableCell>{format(parseISO(document.expiryDate), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(document.status)}>
                            {document.status}
                            {document.status === DocumentStatus.EXPIRING_SOON && daysRemaining > 0 && (
                              <span className="ml-1">({daysRemaining}d)</span>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDocument(document)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadDocument(document)}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteDocument(document)}
                                className="text-destructive"
                              >
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Upload Document Dialog */}
      <Dialog open={isUploadDocumentDialogOpen} onOpenChange={setIsUploadDocumentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Staff Document</DialogTitle>
            <DialogDescription>
              Upload an official document for a staff member.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="staff">Staff Member</Label>
                <Select
                  value={uploadDocument.staffId}
                  onValueChange={(value) => setUploadDocument({...uploadDocument, staffId: value})}
                >
                  <SelectTrigger id="staff">
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {realStaff.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="documentType">Document Type</Label>
                <Select
                  value={uploadDocument.documentType}
                  onValueChange={(value) => setUploadDocument({...uploadDocument, documentType: value})}
                >
                  <SelectTrigger id="documentType">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="documentNumber">Document Number</Label>
              <Input
                id="documentNumber"
                value={uploadDocument.documentNumber}
                onChange={(e) => setUploadDocument({...uploadDocument, documentNumber: e.target.value})}
                placeholder="Enter document number"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={uploadDocument.issueDate}
                  onChange={(e) => setUploadDocument({...uploadDocument, issueDate: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={uploadDocument.expiryDate}
                  onChange={(e) => setUploadDocument({...uploadDocument, expiryDate: e.target.value})}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="file">Document File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  className="flex-1"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setUploadDocument({...uploadDocument, documentFile: file})
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDocumentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadDocument}>Upload Document</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      {selectedDocument && (
        <Dialog open={isViewDocumentDialogOpen} onOpenChange={setIsViewDocumentDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Document Details</DialogTitle>
              <DialogDescription>
                View details for {selectedDocument.documentTypeName}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Staff</Label>
                  <p className="font-medium">{selectedDocument.staffName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Document Type</Label>
                  <p className="font-medium">{selectedDocument.documentTypeName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Document Number</Label>
                  <p>{selectedDocument.documentNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p>
                    <Badge variant={getStatusBadgeVariant(selectedDocument.status)}>
                      {selectedDocument.status}
                    </Badge>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Issue Date</Label>
                  <p>{format(parseISO(selectedDocument.issueDate), "MMM d, yyyy")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Expiry Date</Label>
                  <p>{format(parseISO(selectedDocument.expiryDate), "MMM d, yyyy")}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">File</Label>
                <p>{selectedDocument.fileName} ({selectedDocument.fileSize})</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDocumentDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={() => handleDownloadDocument(selectedDocument)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Filter Dialog */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Filter Documents</DialogTitle>
            <DialogDescription>
              Filter documents by staff, type, and status
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="filterStaff">Staff Member</Label>
              <Select
                value={filters.staffId}
                onValueChange={(value) => setFilters({...filters, staffId: value})}
              >
                <SelectTrigger id="filterStaff">
                  <SelectValue placeholder="All staff members" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All staff members</SelectItem>
                  {realStaff.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="filterDocumentType">Document Type</Label>
              <Select
                value={filters.documentType}
                onValueChange={(value) => setFilters({...filters, documentType: value})}
              >
                <SelectTrigger id="filterDocumentType">
                  <SelectValue placeholder="All document types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All document types</SelectItem>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="filterStatus">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({...filters, status: value})}
              >
                <SelectTrigger id="filterStatus">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value={DocumentStatus.VALID}>Valid</SelectItem>
                  <SelectItem value={DocumentStatus.EXPIRING_SOON}>Expiring Soon</SelectItem>
                  <SelectItem value={DocumentStatus.EXPIRED}>Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFilters({
              staffId: "all",
              documentType: "all",
              status: "all",
              searchQuery: "",
            })}>
              Reset
            </Button>
            <Button onClick={() => setIsFilterDialogOpen(false)}>Apply Filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
