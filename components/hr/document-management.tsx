"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Eye, FileText, MoreHorizontal, Plus, Upload } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useStaff } from "@/lib/staff-provider"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { StaffDocumentsTab } from "@/components/hr/staff-documents-tab"
import { DocumentStorage, DocumentType } from "@/lib/document-storage"

// Mock document templates
const mockDocumentTemplates = [
  {
    id: "DT-001",
    name: "Employment Contract",
    category: "Legal",
    description: "Standard employment contract for salon staff.",
    lastUpdated: "2025-01-15",
    version: "2.1",
    required: true,
  },
  {
    id: "DT-002",
    name: "Employee Handbook",
    category: "Policies",
    description: "Comprehensive guide to salon policies and procedures.",
    lastUpdated: "2025-02-10",
    version: "3.0",
    required: true,
  },
  {
    id: "DT-003",
    name: "Non-Disclosure Agreement",
    category: "Legal",
    description: "Confidentiality agreement for protecting salon trade secrets.",
    lastUpdated: "2024-11-05",
    version: "1.2",
    required: true,
  },
  {
    id: "DT-004",
    name: "Commission Structure",
    category: "Compensation",
    description: "Details of commission rates and bonus structures.",
    lastUpdated: "2025-03-01",
    version: "2.3",
    required: true,
  },
  {
    id: "DT-005",
    name: "Performance Review Form",
    category: "HR",
    description: "Standard form for conducting staff performance reviews.",
    lastUpdated: "2025-01-20",
    version: "1.5",
    required: false,
  },
]

// Mock staff documents - UPDATED TO USE REAL STAFF DATA
const mockStaffDocuments = [
  {
    id: "SD-001",
    staffId: "staff-real-1",
    staffName: "Mekdes Abebe",
    documentId: "DT-001",
    documentName: "Employment Contract",
    dateUploaded: "2024-05-15",
    status: "Active",
    expiryDate: "2026-05-15",
    fileName: "mekdes_abebe_contract_2024.pdf",
    fileSize: "1.2 MB",
  },
  {
    id: "SD-002",
    staffId: "staff-real-1",
    staffName: "Mekdes Abebe",
    documentId: "DT-003",
    documentName: "Non-Disclosure Agreement",
    dateUploaded: "2024-05-15",
    status: "Active",
    expiryDate: "2026-05-15",
    fileName: "mekdes_abebe_nda_2024.pdf",
    fileSize: "0.8 MB",
  },
  {
    id: "SD-003",
    staffId: "staff-real-2",
    staffName: "Woyni Tade",
    documentId: "DT-001",
    documentName: "Employment Contract",
    dateUploaded: "2024-06-01",
    status: "Active",
    expiryDate: "2026-06-01",
    fileName: "woyni_tade_contract_2024.pdf",
    fileSize: "1.2 MB",
  },
  {
    id: "SD-004",
    staffId: "staff-real-3",
    staffName: "Maria Santos",
    documentId: "DT-001",
    documentName: "Employment Contract",
    dateUploaded: "2024-04-10",
    status: "Active",
    expiryDate: "2026-04-10",
    fileName: "maria_santos_contract_2024.pdf",
    fileSize: "1.2 MB",
  },
  {
    id: "SD-005",
    staffId: "staff-real-3",
    staffName: "Maria Santos",
    documentId: "DT-004",
    documentName: "Commission Structure",
    dateUploaded: "2024-04-10",
    status: "Active",
    expiryDate: "2025-04-10",
    fileName: "maria_santos_commission_2024.pdf",
    fileSize: "0.5 MB",
  },
]

export function DocumentManagement() {
  const { toast } = useToast()
  const { staff: realStaff } = useStaff()
  const [documentTemplates, setDocumentTemplates] = useState(mockDocumentTemplates)
  const [staffDocuments, setStaffDocuments] = useState(mockStaffDocuments)
  const [isNewDocumentDialogOpen, setIsNewDocumentDialogOpen] = useState(false)
  const [isUploadDocumentDialogOpen, setIsUploadDocumentDialogOpen] = useState(false)
  const [isViewDocumentDialogOpen, setIsViewDocumentDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [newDocument, setNewDocument] = useState({
    name: "",
    category: "Legal",
    description: "",
    required: true,
  })
  const [uploadDocument, setUploadDocument] = useState({
    staffId: "",
    documentId: "",
    expiryDate: "",
    fileName: "",
  })

  const handleCreateDocument = () => {
    const newDocumentTemplate = {
      id: `DT-${documentTemplates.length + 1}`.padStart(6, '0'),
      name: newDocument.name,
      category: newDocument.category,
      description: newDocument.description,
      lastUpdated: format(new Date(), "yyyy-MM-dd"),
      version: "1.0",
      required: newDocument.required,
    }

    setDocumentTemplates([...documentTemplates, newDocumentTemplate])
    setIsNewDocumentDialogOpen(false)

    toast({
      title: "Document template created",
      description: `${newDocument.name} has been added to document templates.`,
    })
  }

  const handleUploadDocument = () => {
    const staff = realStaff.find(s => s.id === uploadDocument.staffId)
    const document = documentTemplates.find(d => d.id === uploadDocument.documentId)

    if (!staff || !document) return

    // Check if staff already has this document
    const existingDocument = staffDocuments.find(
      d => d.staffId === uploadDocument.staffId && d.documentId === uploadDocument.documentId && d.status === "Active"
    )

    if (existingDocument) {
      toast({
        title: "Upload failed",
        description: `${staff.name} already has an active ${document.name} document.`,
        variant: "destructive",
      })
      return
    }

    const newStaffDocument = {
      id: `SD-${staffDocuments.length + 1}`.padStart(6, '0'),
      staffId: uploadDocument.staffId,
      staffName: staff.name,
      documentId: uploadDocument.documentId,
      documentName: document.name,
      dateUploaded: format(new Date(), "yyyy-MM-dd"),
      status: "Active",
      expiryDate: uploadDocument.expiryDate || format(new Date(new Date().setFullYear(new Date().getFullYear() + 2)), "yyyy-MM-dd"),
      fileName: uploadDocument.fileName || `${staff.name.toLowerCase().replace(' ', '_')}_${document.name.toLowerCase().replace(' ', '_')}_${new Date().getFullYear()}.pdf`,
      fileSize: "1.0 MB",
    }

    setStaffDocuments([...staffDocuments, newStaffDocument])
    setIsUploadDocumentDialogOpen(false)

    toast({
      title: "Document uploaded",
      description: `${document.name} has been uploaded for ${staff.name}.`,
    })
  }

  const handleViewDocument = (document: any) => {
    setSelectedDocument(document)
    setIsViewDocumentDialogOpen(true)
  }

  // Calculate document compliance
  const getStaffDocumentCompliance = () => {
    const requiredDocuments = documentTemplates.filter(d => d.required).map(d => d.id)
    const staffCompliance: Record<string, { required: number, uploaded: number }> = {}

    // Initialize staff compliance records
    realStaff.forEach(staff => {
      staffCompliance[staff.id] = { required: requiredDocuments.length, uploaded: 0 }
    })

    // Count uploaded documents
    staffDocuments
      .filter(doc => doc.status === "Active")
      .forEach(doc => {
        if (requiredDocuments.includes(doc.documentId) && staffCompliance[doc.staffId]) {
          staffCompliance[doc.staffId].uploaded += 1
        }
      })

    return staffCompliance
  }

  const staffCompliance = getStaffDocumentCompliance()

  // Initialize document types in DocumentStorage
  useEffect(() => {
    // Check if document types already exist
    const existingTypes = DocumentStorage.getDocumentTypes();
    if (existingTypes.length === 0) {
      // Convert mock document templates to DocumentType format
      const documentTypes: DocumentType[] = mockDocumentTemplates.map(template => ({
        id: template.id.toLowerCase(),
        name: template.name,
        description: template.description,
        required: template.required,
        defaultExpiryDays: 730, // Default 2 years
      }));

      // Save to storage
      DocumentStorage.saveDocumentTypes(documentTypes);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Document Management</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsNewDocumentDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
          <Button onClick={() => setIsUploadDocumentDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </div>

      <Tabs defaultValue="staff-documents" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="staff-documents">Staff Documents</TabsTrigger>
          <TabsTrigger value="templates">Document Templates</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="staff-documents">
          <StaffDocumentsTab />
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Document Templates</CardTitle>
              <CardDescription>
                Manage document templates used across the organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documentTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>{template.category}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{template.description}</TableCell>
                        <TableCell>{format(new Date(template.lastUpdated), "MMM d, yyyy")}</TableCell>
                        <TableCell>v{template.version}</TableCell>
                        <TableCell>
                          <Badge variant={template.required ? "default" : "outline"}>
                            {template.required ? "Required" : "Optional"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View template
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem>Edit template</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Document Compliance</CardTitle>
              <CardDescription>
                Track staff document compliance and requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff</TableHead>
                      <TableHead>Required Documents</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Missing</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {realStaff.map((staff) => {
                      const compliance = staffCompliance[staff.id] || { required: 0, uploaded: 0 }
                      const missingDocs = compliance.required - compliance.uploaded
                      const isCompliant = missingDocs === 0

                      return (
                        <TableRow key={staff.id}>
                          <TableCell className="font-medium">{staff.name}</TableCell>
                          <TableCell>{compliance.required}</TableCell>
                          <TableCell>{compliance.uploaded}</TableCell>
                          <TableCell>{missingDocs}</TableCell>
                          <TableCell>
                            <Badge
                              variant={isCompliant ? "success" : "destructive"}
                            >
                              {isCompliant ? "Compliant" : "Non-Compliant"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsUploadDocumentDialogOpen(true)}
                              disabled={isCompliant}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Missing
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Document Template Dialog */}
      <Dialog open={isNewDocumentDialogOpen} onOpenChange={setIsNewDocumentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Document Template</DialogTitle>
            <DialogDescription>
              Add a new document template to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Document Name</Label>
              <Input
                id="name"
                value={newDocument.name}
                onChange={(e) => setNewDocument({...newDocument, name: e.target.value})}
                placeholder="Enter document name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={newDocument.category}
                onValueChange={(value) => setNewDocument({...newDocument, category: value})}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Legal">Legal</SelectItem>
                  <SelectItem value="Policies">Policies</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Compensation">Compensation</SelectItem>
                  <SelectItem value="Training">Training</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newDocument.description}
                onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
                placeholder="Enter document description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="required">Required</Label>
              <Select
                value={newDocument.required ? "true" : "false"}
                onValueChange={(value) => setNewDocument({...newDocument, required: value === "true"})}
              >
                <SelectTrigger id="required">
                  <SelectValue placeholder="Is this document required?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Required</SelectItem>
                  <SelectItem value="false">Optional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewDocumentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDocument}>Create Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={isUploadDocumentDialogOpen} onOpenChange={setIsUploadDocumentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload Staff Document</DialogTitle>
            <DialogDescription>
              Upload a document for a staff member.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
              <Label htmlFor="document">Document Type</Label>
              <Select
                value={uploadDocument.documentId}
                onValueChange={(value) => setUploadDocument({...uploadDocument, documentId: value})}
              >
                <SelectTrigger id="document">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTemplates.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.name} {doc.required && "(Required)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={uploadDocument.expiryDate}
                onChange={(e) => setUploadDocument({...uploadDocument, expiryDate: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="file">Document File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  className="flex-1"
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Document Details</DialogTitle>
              <DialogDescription>
                {selectedDocument.documentName} for {selectedDocument.staffName}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-center justify-center p-6 border rounded-md bg-muted/50">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 font-medium">{selectedDocument.fileName}</p>
                  <p className="text-sm text-muted-foreground">{selectedDocument.fileSize}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Staff</Label>
                  <p className="font-medium">{selectedDocument.staffName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Document Type</Label>
                  <p className="font-medium">{selectedDocument.documentName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Upload Date</Label>
                  <p>{format(new Date(selectedDocument.dateUploaded), "MMM d, yyyy")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Expiry Date</Label>
                  <p>{format(new Date(selectedDocument.expiryDate), "MMM d, yyyy")}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Status</Label>
                <p>
                  <Badge
                    variant={
                      selectedDocument.status === "Active" ? "success" :
                      selectedDocument.status === "Expired" ? "destructive" :
                      "outline"
                    }
                  >
                    {selectedDocument.status}
                  </Badge>
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDocumentDialogOpen(false)}>
                Close
              </Button>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
