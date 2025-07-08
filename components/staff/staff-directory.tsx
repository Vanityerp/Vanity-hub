"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Edit, MoreHorizontal, Trash, Home, MapPin } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { StaffDetailsDialog } from "./staff-details-dialog"
import { EditStaffDialog } from "./edit-staff-dialog"
import { DeleteStaffDialog } from "./delete-staff-dialog"
import { useLocations } from "@/lib/location-provider"
import { useStaff as useRealStaff } from "@/lib/use-staff-data"

interface StaffDirectoryProps {
  search: string
  onStaffUpdated?: (updatedStaff: any) => void
  onStaffDeleted?: (staffId: string) => void
}

export function StaffDirectory({ search, onStaffUpdated, onStaffDeleted }: StaffDirectoryProps) {
  const { currentLocation, hasPermission } = useAuth()
  const { getLocationName, locations } = useLocations()
  const { staff: realStaff, refreshStaff } = useRealStaff()
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>("all")

  // Use real staff data
  const staffList = realStaff

  // Get staff by location function
  const getStaffByLocation = (locationId: string) => {
    if (locationId === 'all') {
      return realStaff
    } else if (locationId === 'home') {
      return realStaff.filter(s => s.homeService === true || s.locations.includes('home'))
    } else {
      return realStaff.filter(s => s.locations.includes(locationId))
    }
  }



  // Listen for custom events from staff details dialog and staff updates
  useEffect(() => {
    const handleEditRequest = (event: CustomEvent) => {
      const { staffId } = event.detail
      const staff = staffList.find(s => s.id === staffId)
      if (staff) {
        setSelectedStaff(staff)
        setIsEditDialogOpen(true)
      }
    }

    const handleDeleteRequest = (event: CustomEvent) => {
      const { staff } = event.detail
      const foundStaff = staffList.find(s => s.id === staff.id)
      if (foundStaff) {
        setSelectedStaff(foundStaff)
        setIsDeleteDialogOpen(true)
      }
    }

    const handleStaffUpdatedEvent = (event: CustomEvent) => {
      console.log("Staff updated event received:", event.detail)

      // Update the selected staff if it's the one that was updated
      const { staffId, updatedStaff } = event.detail
      if (selectedStaff && selectedStaff.id === staffId) {
        setSelectedStaff(updatedStaff)
      }

      // Refresh the staff data to get the latest updates with a small delay
      // to ensure the database update is complete
      setTimeout(() => {
        if (refreshStaff) {
          console.log("Refreshing staff data after update...")
          refreshStaff()
        }
      }, 200)
    }

    window.addEventListener('staff-edit-requested', handleEditRequest as EventListener)
    window.addEventListener('staff-delete-requested', handleDeleteRequest as EventListener)
    window.addEventListener('staff-updated', handleStaffUpdatedEvent as EventListener)

    return () => {
      window.removeEventListener('staff-edit-requested', handleEditRequest as EventListener)
      window.removeEventListener('staff-delete-requested', handleDeleteRequest as EventListener)
      window.removeEventListener('staff-updated', handleStaffUpdatedEvent as EventListener)
    }
  }, [staffList, selectedStaff, refreshStaff])

  // Note: Real staff data is automatically refreshed by useRealStaff hook

  // Filter staff based on location permissions and search term
  const filteredStaff = staffList.filter((staff) => {
    // Filter by current location (auth-based)
    if (currentLocation !== "all") {
      // For Home service location, only admin users can access
      if (currentLocation === "home") {
        // Staff users cannot access home service
        if (user && user.role !== "ADMIN") {
          return false;
        }

        // Check if staff has home service capability (for admin users)
        const hasHomeServiceCapability = staff.homeService === true || staff.locations.includes("home");

        if (!hasHomeServiceCapability) {
          return false;
        }
      }
      // For regular locations, check if staff is assigned to that location
      else if (!staff.locations.includes(currentLocation)) {
        return false
      }
    }

    // Filter by selected location filter (additional filter)
    if (selectedLocationFilter !== "all") {
      if (selectedLocationFilter === "home") {
        // Staff users cannot access home service filter
        if (user && user.role !== "ADMIN") {
          return false;
        }
        if (staff.homeService !== true && !staff.locations.includes("home")) {
          return false
        }
      } else if (!staff.locations.includes(selectedLocationFilter)) {
        return false
      }
    }

    // Filter by search term
    if (search && !staff.name.toLowerCase().includes(search.toLowerCase())) {
      return false
    }

    return true
  })

  const handleViewDetails = (staff: any) => {
    setSelectedStaff(staff)
    setIsDetailsDialogOpen(true)
  }

  const handleEditStaff = (staff: any) => {
    setSelectedStaff(staff)
    setIsEditDialogOpen(true)
  }

  const handleDeleteStaff = (staff: any) => {
    setSelectedStaff(staff)
    setIsDeleteDialogOpen(true)
  }

  // Handle dialog close with immediate state cleanup
  const handleDetailsDialogClose = (open: boolean) => {
    setIsDetailsDialogOpen(open)
    if (!open) {
      setSelectedStaff(null)
    }
  }

  const handleEditDialogClose = (open: boolean) => {
    setIsEditDialogOpen(open)
    if (!open) {
      setSelectedStaff(null)
    }
  }

  const handleDeleteDialogClose = (open: boolean) => {
    setIsDeleteDialogOpen(open)
    if (!open) {
      setSelectedStaff(null)
    }
  }

  const handleStaffUpdated = (updatedStaff: any) => {
    console.log("handleStaffUpdated called with:", updatedStaff)

    // Update the selected staff with the new data
    setSelectedStaff(updatedStaff)

    // Refresh the staff data to ensure we have the latest information
    // Use a timeout to ensure the database update is complete
    setTimeout(() => {
      if (refreshStaff) {
        console.log("Refreshing staff data after handleStaffUpdated...")
        refreshStaff()
      }
    }, 300)

    // Call the parent's onStaffUpdated callback if provided
    if (onStaffUpdated) {
      onStaffUpdated(updatedStaff)
    }
  }

  const handleStaffDeleted = (staffId: string) => {
    // Note: Staff deletion should be handled through the HR management system
    // Real staff data will be automatically refreshed by the useRealStaff hook

    // Call the parent's onStaffDeleted callback if provided
    if (onStaffDeleted) {
      onStaffDeleted(staffId)
    }
  }

  return (
    <Card>
      {/* Location Filter */}
      <div className="mb-4 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedLocationFilter} onValueChange={setSelectedLocationFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations
              .filter(location => location.status === "Active")
              .map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {selectedLocationFilter !== "all" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedLocationFilter("all")}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear filter
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Locations</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No staff members found.
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell className="font-medium">{staff.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {staff.role === "super_admin"
                        ? "Super Admin"
                        : staff.role === "org_admin"
                          ? "Organization Admin"
                          : staff.role === "location_manager"
                            ? "Location Manager"
                            : staff.role === "stylist"
                              ? "Stylist"
                              : staff.role === "colorist"
                                ? "Colorist"
                                : staff.role === "barber"
                                  ? "Barber"
                                  : staff.role === "nail_technician"
                                    ? "Nail Technician"
                                    : staff.role === "esthetician"
                                      ? "Esthetician"
                                      : "Receptionist"}
                    </Badge>
                    {staff.homeService && (
                      <Badge variant="outline" className="ml-1 flex items-center gap-1">
                        <Home className="h-3 w-3" />
                        <span className="text-xs">Home</span>
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{staff.email}</TableCell>
                  <TableCell>{staff.phone}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {staff.locations.map((loc) => (
                        <Badge key={loc} variant="secondary" className="text-xs">
                          {getLocationName(loc)}
                        </Badge>
                      ))}
                      {staff.locations.includes("all") && (
                        <Badge variant="secondary" className="text-xs">
                          All Locations
                        </Badge>
                      )}
                      {staff.homeService && !staff.locations.includes("home") && (
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <Home className="h-3 w-3" />
                          Home Service
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={staff.status === "Active" ? "success" : "secondary"}>{staff.status}</Badge>
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
                        <DropdownMenuItem onClick={() => handleViewDetails(staff)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View details
                        </DropdownMenuItem>
                        {hasPermission("edit_staff") && (
                          <DropdownMenuItem onClick={() => handleEditStaff(staff)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit staff
                          </DropdownMenuItem>
                        )}
                        {hasPermission("delete_staff") && (
                          <DropdownMenuItem onClick={() => handleDeleteStaff(staff)} className="text-red-600">
                            <Trash className="mr-2 h-4 w-4" />
                            Delete staff
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Staff Details Dialog - Only render when we have a selected staff */}
      {selectedStaff && (
        <StaffDetailsDialog
          staff={selectedStaff}
          open={isDetailsDialogOpen}
          onOpenChange={handleDetailsDialogClose}
          onStaffUpdated={handleStaffUpdated}
          onStaffDeleted={handleStaffDeleted}
        />
      )}

      {/* Edit Staff Dialog - Only render when we have a selected staff */}
      {selectedStaff && (
        <EditStaffDialog
          staffId={selectedStaff.id}
          open={isEditDialogOpen}
          onOpenChange={handleEditDialogClose}
          onStaffUpdated={handleStaffUpdated}
        />
      )}

      {/* Delete Staff Dialog - Only render when we have a selected staff */}
      {selectedStaff && (
        <DeleteStaffDialog
          staff={{ id: selectedStaff.id, name: selectedStaff.name }}
          open={isDeleteDialogOpen}
          onOpenChange={handleDeleteDialogClose}
          onStaffDeleted={handleStaffDeleted}
        />
      )}
    </Card>
  )
}
