"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useStaffCredentials } from "@/hooks/use-staff-credentials"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  KeyRound, 
  MoreHorizontal, 
  Plus, 
  RefreshCw, 
  Shield, 
  Users, 
  Eye, 
  EyeOff,
  MapPin,
  TestTube,
  Loader2
} from "lucide-react"

interface StaffMember {
  id: string
  name: string
  employeeNumber?: string
  jobRole?: string
  status: string
  hasCredentials: boolean
  user?: {
    id: string
    email: string
    role: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }
  locations: {
    id: string
    name: string
    city: string
    isActive: boolean
  }[]
}

interface Location {
  id: string
  name: string
  city: string
}

export function StaffCredentialSettings() {
  const { toast } = useToast()
  const {
    staff,
    locations,
    loading,
    fetchStaffCredentials,
    fetchLocations,
    createCredentials,
    resetPassword,
    updateLocations,
    toggleActive,
    generateTestCredentials
  } = useStaffCredentials()

  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [generatedCredentials, setGeneratedCredentials] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch staff and locations data
  useEffect(() => {
    fetchStaffCredentials()
    fetchLocations()
  }, [fetchStaffCredentials, fetchLocations])

  const handleCreateCredentials = async () => {
    if (!selectedStaff || selectedLocations.length === 0) {
      toast({
        title: "Error",
        description: "Please select a staff member and at least one location",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      const credentials = await createCredentials(selectedStaff.id, selectedLocations)
      setGeneratedCredentials(credentials)
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGenerateTestCredentials = async () => {
    try {
      setIsSubmitting(true)
      await generateTestCredentials()
      setIsTestDialogOpen(false)
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async (staffMember: StaffMember) => {
    try {
      const tempPassword = await resetPassword(staffMember.id)
      setGeneratedCredentials({
        username: staffMember.user?.email,
        temporaryPassword: tempPassword
      })
      setShowPassword(false)
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const handleUpdateLocations = async () => {
    if (!selectedStaff || selectedLocations.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one location",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      await updateLocations(selectedStaff.id, selectedLocations)
      setIsLocationDialogOpen(false)
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (staffMember: StaffMember) => {
    try {
      await toggleActive(staffMember.id)
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const filteredStaff = staff.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.employeeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.jobRole?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const staffWithoutCredentials = staff.filter(member => !member.hasCredentials)

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Staff Credential Management
              </CardTitle>
              <CardDescription>
                Create and manage login credentials for staff members with location-based access control
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsTestDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                Check Test Credentials
              </Button>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                disabled={staffWithoutCredentials.length === 0}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Credentials
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search staff members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => {
              fetchStaffCredentials()
              fetchLocations()
            }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Staff</p>
                    <p className="text-2xl font-bold">{staff.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">With Credentials</p>
                    <p className="text-2xl font-bold">{staff.filter(s => s.hasCredentials).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Without Credentials</p>
                    <p className="text-2xl font-bold">{staffWithoutCredentials.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>
            View and manage login credentials for all staff members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Employee #</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Locations</TableHead>
                <TableHead>Credentials</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.employeeNumber || '-'}</TableCell>
                  <TableCell>{member.jobRole || '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {member.locations.map((location) => (
                        <Badge key={location.id} variant="outline" className="text-xs">
                          {location.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.hasCredentials ? (
                      <div className="space-y-1">
                        <Badge variant="default">
                          <Shield className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {member.user?.email}
                        </p>
                      </div>
                    ) : (
                      <Badge variant="secondary">
                        <KeyRound className="h-3 w-3 mr-1" />
                        None
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={member.status === 'ACTIVE' ? 'default' : 'secondary'}
                    >
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {member.hasCredentials ? (
                          <>
                            <DropdownMenuItem onClick={() => handleResetPassword(member)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedStaff(member)
                                setSelectedLocations(member.locations.map(l => l.id))
                                setIsLocationDialogOpen(true)
                              }}
                            >
                              <MapPin className="h-4 w-4 mr-2" />
                              Update Locations
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(member)}>
                              <Shield className="h-4 w-4 mr-2" />
                              {member.user?.isActive ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedStaff(member)
                              setSelectedLocations(member.locations.map(l => l.id))
                              setIsCreateDialogOpen(true)
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Credentials
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Credentials Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Login Credentials</DialogTitle>
            <DialogDescription>
              Generate login credentials for the selected staff member
            </DialogDescription>
          </DialogHeader>

          {selectedStaff && (
            <div className="space-y-4">
              <div>
                <Label>Staff Member</Label>
                <p className="text-sm font-medium">{selectedStaff.name}</p>
                <p className="text-xs text-muted-foreground">
                  Employee #{selectedStaff.employeeNumber} • {selectedStaff.jobRole}
                </p>
              </div>

              <div>
                <Label>Location Access</Label>
                <div className="space-y-2 mt-2">
                  {locations.map((location) => (
                    <div key={location.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={location.id}
                        checked={selectedLocations.includes(location.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedLocations([...selectedLocations, location.id])
                          } else {
                            setSelectedLocations(selectedLocations.filter(id => id !== location.id))
                          }
                        }}
                      />
                      <Label htmlFor={location.id} className="text-sm">
                        {location.name} - {location.city}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {generatedCredentials && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <h4 className="font-medium text-sm">Generated Credentials</h4>
                  <div className="space-y-1">
                    <p className="text-xs">
                      <span className="font-medium">Email:</span> {generatedCredentials.username}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs">
                        <span className="font-medium">Password:</span>
                        {showPassword ? generatedCredentials.temporaryPassword : '••••••••'}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateCredentials}
              disabled={isSubmitting || selectedLocations.length === 0}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Credentials Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check Test Credentials</DialogTitle>
            <DialogDescription>
              This will check the credential status for staff members across all locations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This will show the current credential status for staff members at each location.
                In a production system, this would create credentials for staff members who don't have them.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Available Locations:</p>
              <div className="grid grid-cols-2 gap-2">
                {locations.map((location) => (
                  <div key={location.id} className="flex items-center gap-2 text-sm">
                    <MapPin className="h-3 w-3" />
                    {location.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerateTestCredentials}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Check Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Locations Dialog */}
      <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Location Access</DialogTitle>
            <DialogDescription>
              Modify location assignments for the selected staff member
            </DialogDescription>
          </DialogHeader>

          {selectedStaff && (
            <div className="space-y-4">
              <div>
                <Label>Staff Member</Label>
                <p className="text-sm font-medium">{selectedStaff.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedStaff.user?.email}
                </p>
              </div>

              <div>
                <Label>Location Access</Label>
                <div className="space-y-2 mt-2">
                  {locations.map((location) => (
                    <div key={location.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`update-${location.id}`}
                        checked={selectedLocations.includes(location.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedLocations([...selectedLocations, location.id])
                          } else {
                            setSelectedLocations(selectedLocations.filter(id => id !== location.id))
                          }
                        }}
                      />
                      <Label htmlFor={`update-${location.id}`} className="text-sm">
                        {location.name} - {location.city}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLocationDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateLocations}
              disabled={isSubmitting || selectedLocations.length === 0}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Locations
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
