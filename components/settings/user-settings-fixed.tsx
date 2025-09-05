"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useStaff } from "@/lib/staff-provider"
import { Edit, Loader2, MoreHorizontal, Plus, Shield, UserPlus, MapPin, Building2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StaffAvatar } from "@/components/ui/staff-avatar"
import { useToast } from "@/components/ui/use-toast"
import { useUnifiedStaff } from "@/lib/unified-staff-provider"
import { useLocations } from "@/lib/location-provider"
import { PERMISSIONS, PERMISSION_CATEGORIES } from "@/lib/permissions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

// Types
interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  locations: string[]
}

interface Role {
  id: string
  name: string
  permissions: string[]
}

interface Location {
  id: string
  name: string
}

// Edit User Form Component
interface EditUserFormProps {
  user: User
  roles: Role[]
  locations: Location[]
  onSave: (user: User) => void
  onCancel: () => void
  isSubmitting?: boolean
}

function EditUserForm({ user, roles, locations, onSave, onCancel, isSubmitting }: EditUserFormProps) {
  const [editedUser, setEditedUser] = useState<User>(user)
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(editedUser)
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={editedUser.name}
            onChange={(e) => setEditedUser(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={editedUser.email}
            onChange={(e) => setEditedUser(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="role">Role *</Label>
          <Select
            value={editedUser.role}
            onValueChange={(value) => setEditedUser(prev => ({ ...prev, role: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">Super Admin</SelectItem>
              <SelectItem value="MANAGER">Organization Admin</SelectItem>
              <SelectItem value="STAFF">Location Manager</SelectItem>
              <SelectItem value="receptionist">Staff</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={editedUser.status}
            onValueChange={(value) => setEditedUser(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label>Location Access</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {locations.map((location) => (
            <div key={location.id} className="flex items-center space-x-2">
              <Checkbox
                id={location.id}
                checked={editedUser.locations.includes(location.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setEditedUser(prev => ({
                      ...prev,
                      locations: [...prev.locations, location.id]
                    }))
                  } else {
                    setEditedUser(prev => ({
                      ...prev,
                      locations: prev.locations.filter(id => id !== location.id)
                    }))
                  }
                }}
              />
              <Label htmlFor={location.id}>{location.name}</Label>
            </div>
          ))}
        </div>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Changes
        </Button>
      </DialogFooter>
    </form>
  )
}

export default function UserSettings() {
  const { toast } = useToast()
  const { staff, isLoading } = useUnifiedStaff()
  const { locations } = useLocations()
  
  // State
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Load initial data
  useEffect(() => {
    loadUsers()
    loadRoles()
  }, [staff])
  
  const loadUsers = () => {
    if (staff && staff.length > 0) {
      const mappedUsers: User[] = staff.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role || 'STAFF',
        status: member.isActive ? 'Active' : 'Inactive',
        locations: member.locations?.map(loc => loc.id) || []
      }))
      setUsers(mappedUsers)
    }
  }
  
  const loadRoles = () => {
    const defaultRoles: Role[] = [
      { id: 'ADMIN', name: 'Super Admin', permissions: Object.values(PERMISSIONS) },
      { id: 'MANAGER', name: 'Organization Admin', permissions: ['view_dashboard', 'manage_appointments', 'view_reports'] },
      { id: 'STAFF', name: 'Location Manager', permissions: ['view_dashboard', 'manage_appointments'] },
      { id: 'receptionist', name: 'Staff', permissions: ['view_dashboard', 'manage_appointments', 'view_pos'] }
    ]
    setRoles(defaultRoles)
  }
  
  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsEditUserDialogOpen(true)
  }
  
  const handleSaveUser = async (updatedUser: User) => {
    setIsSubmitting(true)
    
    try {
      // Update user via API
      const response = await fetch(`/api/staff/${updatedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          isActive: updatedUser.status === 'Active',
          locations: updatedUser.locations
        })
      })
      
      if (response.ok) {
        // Update local state
        setUsers(prev => prev.map(user => 
          user.id === updatedUser.id ? updatedUser : user
        ))
        
        toast({
          title: "Success",
          description: "User updated successfully"
        })
        
        setIsEditUserDialogOpen(false)
        setSelectedUser(null)
      } else {
        throw new Error('Failed to update user')
      }
      
    } catch (error) {
      console.error('Error updating user:', error)
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800'
      case 'MANAGER': return 'bg-blue-100 text-blue-800'
      case 'STAFF': return 'bg-green-100 text-green-800'
      case 'receptionist': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Locations</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <StaffAvatar name={user.name} size="sm" />
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.locations.slice(0, 2).map(locationId => {
                        const location = locations.find(loc => loc.id === locationId)
                        return location ? (
                          <Badge key={locationId} variant="outline" className="text-xs">
                            {location.name}
                          </Badge>
                        ) : null
                      })}
                      {user.locations.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{user.locations.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information, role, and location assignments
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <EditUserForm
              user={selectedUser}
              roles={roles}
              locations={locations}
              onSave={handleSaveUser}
              onCancel={() => {
                setIsEditUserDialogOpen(false)
                setSelectedUser(null)
              }}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}