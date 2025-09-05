"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useStaff } from "@/lib/staff-provider"
import { Edit, Loader2, MoreHorizontal, Plus, Shield, Trash, UserPlus, MapPin, Building2 } from "lucide-react"
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
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { SettingsStorage, User, Role, Location } from "@/lib/settings-storage"

// Edit User Form Component
interface EditUserFormProps {
  user: User
  roles: Role[]
  locations: Location[]
  onSave: (user: User) => void
  onCancel: () => void
  isSubmitting: boolean
}

function EditUserForm({ user, roles, locations, onSave, onCancel, isSubmitting }: EditUserFormProps) {
  const [formData, setFormData] = useState<User>({ ...user })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }

    if (!formData.role) {
      newErrors.role = "Role is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('📝 EditUserForm: Form submitted with data:', formData)
    console.log('🎭 EditUserForm: Role being saved:', formData.role)
    
    if (validateForm()) {
      console.log('✅ EditUserForm: Form validation passed, calling onSave...')
      onSave(formData)
    } else {
      console.log('❌ EditUserForm: Form validation failed:', errors)
    }
  }

  const handleLocationToggle = (locationId: string) => {
    const updatedLocations = formData.locations.includes(locationId)
      ? formData.locations.filter(id => id !== locationId)
      : [...formData.locations, locationId]

    setFormData({ ...formData, locations: updatedLocations })
  }

  const colorOptions = [
    { value: "bg-blue-500", label: "Blue", color: "bg-blue-500" },
    { value: "bg-green-500", label: "Green", color: "bg-green-500" },
    { value: "bg-purple-500", label: "Purple", color: "bg-purple-500" },
    { value: "bg-red-500", label: "Red", color: "bg-red-500" },
    { value: "bg-yellow-500", label: "Yellow", color: "bg-yellow-500" },
    { value: "bg-pink-500", label: "Pink", color: "bg-pink-500" },
    { value: "bg-indigo-500", label: "Indigo", color: "bg-indigo-500" },
    { value: "bg-gray-500", label: "Gray", color: "bg-gray-500" },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Select
            value={formData.role}
            onValueChange={(value) => setFormData({ ...formData, role: value })}
          >
            <SelectTrigger className={errors.role ? "border-red-500" : ""}>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Avatar Color</Label>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFormData({ ...formData, color: option.value })}
              className={`w-8 h-8 rounded-full ${option.color} border-2 ${
                formData.color === option.value ? "border-gray-900" : "border-gray-300"
              }`}
              title={option.label}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Location Access</Label>
        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
          {locations.map((location) => (
            <div key={location.id} className="flex items-center space-x-2">
              <Checkbox
                id={`location-${location.id}`}
                checked={formData.locations.includes(location.id)}
                onCheckedChange={() => handleLocationToggle(location.id)}
              />
              <Label htmlFor={`location-${location.id}`} className="text-sm">
                {location.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </DialogFooter>
    </form>
  )
}

// Edit Role Form Component
interface EditRoleFormProps {
  role: Role
  onSave: (role: Role) => void
  onCancel: () => void
  isSubmitting: boolean
}

function EditRoleForm({ role, onSave, onCancel, isSubmitting }: EditRoleFormProps) {
  const [formData, setFormData] = useState<Role>({ ...role })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Role name is required"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSave(formData)
    }
  }

  const handlePermissionToggle = (permission: string) => {
    const updatedPermissions = formData.permissions.includes(permission)
      ? formData.permissions.filter(p => p !== permission)
      : [...formData.permissions, permission]

    setFormData({ ...formData, permissions: updatedPermissions })
  }

  const permissionCategories = [
    {
      name: "Dashboard",
      permissions: [PERMISSIONS.VIEW_DASHBOARD]
    },
    {
      name: "Appointments",
      permissions: [
        PERMISSIONS.VIEW_APPOINTMENTS,
        PERMISSIONS.CREATE_APPOINTMENT,
        PERMISSIONS.EDIT_APPOINTMENT,
        PERMISSIONS.DELETE_APPOINTMENT,
        PERMISSIONS.VIEW_OWN_APPOINTMENTS,
        PERMISSIONS.EDIT_OWN_APPOINTMENTS
      ]
    },
    {
      name: "Clients",
      permissions: [
        PERMISSIONS.VIEW_CLIENTS,
        PERMISSIONS.CREATE_CLIENT,
        PERMISSIONS.EDIT_CLIENT,
        PERMISSIONS.DELETE_CLIENT,
        PERMISSIONS.VIEW_OWN_CLIENTS
      ]
    },
    {
      name: "Services",
      permissions: [
        PERMISSIONS.VIEW_SERVICES,
        PERMISSIONS.CREATE_SERVICE,
        PERMISSIONS.EDIT_SERVICE,
        PERMISSIONS.DELETE_SERVICE
      ]
    },
    {
      name: "Staff",
      permissions: [
        PERMISSIONS.VIEW_STAFF,
        PERMISSIONS.CREATE_STAFF,
        PERMISSIONS.EDIT_STAFF,
        PERMISSIONS.DELETE_STAFF,
        PERMISSIONS.VIEW_STAFF_SCHEDULE,
        PERMISSIONS.EDIT_STAFF_SCHEDULE,
        PERMISSIONS.VIEW_OWN_SCHEDULE,
        PERMISSIONS.EDIT_OWN_SCHEDULE
      ]
    },
    {
      name: "Inventory",
      permissions: [
        PERMISSIONS.VIEW_INVENTORY,
        PERMISSIONS.CREATE_INVENTORY,
        PERMISSIONS.EDIT_INVENTORY,
        PERMISSIONS.DELETE_INVENTORY
      ]
    },
    {
      name: "Point of Sale",
      permissions: [
        PERMISSIONS.VIEW_POS,
        PERMISSIONS.CREATE_SALE,
        PERMISSIONS.EDIT_SALE,
        PERMISSIONS.DELETE_SALE,
        PERMISSIONS.APPLY_DISCOUNT,
        PERMISSIONS.ISSUE_REFUND
      ]
    },
    {
      name: "Accounting",
      permissions: [
        PERMISSIONS.VIEW_ACCOUNTING,
        PERMISSIONS.MANAGE_ACCOUNTING
      ]
    },
    {
      name: "HR",
      permissions: [
        PERMISSIONS.VIEW_HR,
        PERMISSIONS.MANAGE_HR
      ]
    },
    {
      name: "Reports",
      permissions: [
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.EXPORT_REPORTS
      ]
    },
    {
      name: "Settings",
      permissions: [
        PERMISSIONS.VIEW_SETTINGS,
        PERMISSIONS.EDIT_SETTINGS,
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.MANAGE_ROLES,
        PERMISSIONS.MANAGE_LOCATIONS
      ]
    },
    {
      name: "Client Portal",
      permissions: [
        PERMISSIONS.VIEW_CLIENT_PORTAL,
        PERMISSIONS.MANAGE_CLIENT_PORTAL
      ]
    },
    {
      name: "Chat",
      permissions: [
        PERMISSIONS.VIEW_CHAT,
        PERMISSIONS.SEND_MESSAGES,
        PERMISSIONS.CREATE_CHANNELS,
        PERMISSIONS.MANAGE_CHANNELS,
        PERMISSIONS.MODERATE_CHAT
      ]
    }
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="roleName">Role Name *</Label>
          <Input
            id="roleName"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="roleDescription">Description *</Label>
          <Input
            id="roleDescription"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={errors.description ? "border-red-500" : ""}
          />
          {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Permissions</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFormData({ ...formData, permissions: [PERMISSIONS.ALL] })}
            >
              Select All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFormData({ ...formData, permissions: [] })}
            >
              Clear All
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto border rounded-lg p-4">
          {permissionCategories.map((category) => (
            <div key={category.name} className="space-y-2">
              <h4 className="font-medium text-sm text-gray-900">{category.name}</h4>
              <div className="space-y-1">
                {category.permissions.map((permission) => (
                  <div key={permission} className="flex items-center space-x-2">
                    <Checkbox
                      id={`permission-${permission}`}
                      checked={formData.permissions.includes(permission) || formData.permissions.includes(PERMISSIONS.ALL)}
                      onCheckedChange={() => handlePermissionToggle(permission)}
                      disabled={formData.permissions.includes(PERMISSIONS.ALL)}
                    />
                    <Label htmlFor={`permission-${permission}`} className="text-xs">
                      {permission.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </DialogFooter>
    </form>
  )
}

// Add User Form Component
interface AddUserFormProps {
  roles: Role[]
  locations: Location[]
  onSave: (user: Omit<User, 'id'>) => void
  onCancel: () => void
  isSubmitting: boolean
}

function AddUserForm({ roles, locations, onSave, onCancel, isSubmitting }: AddUserFormProps) {
  const [formData, setFormData] = useState<Omit<User, 'id'>>({
    name: "",
    email: "",
    role: "staff",
    locations: [],
    status: "Active",
    avatar: "",
    color: "bg-blue-500",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }

    if (!formData.role) {
      newErrors.role = "Role is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      // Generate avatar initials
      const avatar = formData.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

      onSave({ ...formData, avatar })
    }
  }

  const handleLocationToggle = (locationId: string) => {
    const updatedLocations = formData.locations.includes(locationId)
      ? formData.locations.filter(id => id !== locationId)
      : [...formData.locations, locationId]

    setFormData({ ...formData, locations: updatedLocations })
  }

  const colorOptions = [
    { value: "bg-blue-500", label: "Blue", color: "bg-blue-500" },
    { value: "bg-green-500", label: "Green", color: "bg-green-500" },
    { value: "bg-purple-500", label: "Purple", color: "bg-purple-500" },
    { value: "bg-red-500", label: "Red", color: "bg-red-500" },
    { value: "bg-yellow-500", label: "Yellow", color: "bg-yellow-500" },
    { value: "bg-pink-500", label: "Pink", color: "bg-pink-500" },
    { value: "bg-indigo-500", label: "Indigo", color: "bg-indigo-500" },
    { value: "bg-gray-500", label: "Gray", color: "bg-gray-500" },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Select
            value={formData.role}
            onValueChange={(value) => setFormData({ ...formData, role: value })}
          >
            <SelectTrigger className={errors.role ? "border-red-500" : ""}>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Avatar Color</Label>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFormData({ ...formData, color: option.value })}
              className={`w-8 h-8 rounded-full ${option.color} border-2 ${
                formData.color === option.value ? "border-gray-900" : "border-gray-300"
              }`}
              title={option.label}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Location Access</Label>
        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
          {locations.map((location) => (
            <div key={location.id} className="flex items-center space-x-2">
              <Checkbox
                id={`location-${location.id}`}
                checked={formData.locations.includes(location.id)}
                onCheckedChange={() => handleLocationToggle(location.id)}
              />
              <Label htmlFor={`location-${location.id}`} className="text-sm">
                {location.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add User
        </Button>
      </DialogFooter>
    </form>
  )
}

// Add Role Form Component
interface AddRoleFormProps {
  onSave: (role: Omit<Role, 'id' | 'userCount'>) => void
  onCancel: () => void
  isSubmitting: boolean
}

function AddRoleForm({ onSave, onCancel, isSubmitting }: AddRoleFormProps) {
  const [formData, setFormData] = useState<Omit<Role, 'id' | 'userCount'>>({
    name: "",
    description: "",
    permissions: [],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Role name is required"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSave(formData)
    }
  }

  const handlePermissionToggle = (permission: string) => {
    const updatedPermissions = formData.permissions.includes(permission)
      ? formData.permissions.filter(p => p !== permission)
      : [...formData.permissions, permission]

    setFormData({ ...formData, permissions: updatedPermissions })
  }

  const permissionCategories = [
    {
      name: "Dashboard",
      permissions: [PERMISSIONS.VIEW_DASHBOARD]
    },
    {
      name: "Appointments",
      permissions: [
        PERMISSIONS.VIEW_APPOINTMENTS,
        PERMISSIONS.CREATE_APPOINTMENT,
        PERMISSIONS.EDIT_APPOINTMENT,
        PERMISSIONS.DELETE_APPOINTMENT,
        PERMISSIONS.VIEW_OWN_APPOINTMENTS,
        PERMISSIONS.EDIT_OWN_APPOINTMENTS
      ]
    },
    {
      name: "Clients",
      permissions: [
        PERMISSIONS.VIEW_CLIENTS,
        PERMISSIONS.CREATE_CLIENT,
        PERMISSIONS.EDIT_CLIENT,
        PERMISSIONS.DELETE_CLIENT,
        PERMISSIONS.VIEW_OWN_CLIENTS
      ]
    },
    {
      name: "Services",
      permissions: [
        PERMISSIONS.VIEW_SERVICES,
        PERMISSIONS.CREATE_SERVICE,
        PERMISSIONS.EDIT_SERVICE,
        PERMISSIONS.DELETE_SERVICE
      ]
    },
    {
      name: "Staff",
      permissions: [
        PERMISSIONS.VIEW_STAFF,
        PERMISSIONS.CREATE_STAFF,
        PERMISSIONS.EDIT_STAFF,
        PERMISSIONS.DELETE_STAFF,
        PERMISSIONS.VIEW_STAFF_SCHEDULE,
        PERMISSIONS.EDIT_STAFF_SCHEDULE,
        PERMISSIONS.VIEW_OWN_SCHEDULE,
        PERMISSIONS.EDIT_OWN_SCHEDULE
      ]
    },
    {
      name: "Inventory",
      permissions: [
        PERMISSIONS.VIEW_INVENTORY,
        PERMISSIONS.CREATE_INVENTORY,
        PERMISSIONS.EDIT_INVENTORY,
        PERMISSIONS.DELETE_INVENTORY
      ]
    },
    {
      name: "Point of Sale",
      permissions: [
        PERMISSIONS.VIEW_POS,
        PERMISSIONS.CREATE_SALE,
        PERMISSIONS.EDIT_SALE,
        PERMISSIONS.DELETE_SALE,
        PERMISSIONS.APPLY_DISCOUNT,
        PERMISSIONS.ISSUE_REFUND
      ]
    },
    {
      name: "Accounting",
      permissions: [
        PERMISSIONS.VIEW_ACCOUNTING,
        PERMISSIONS.MANAGE_ACCOUNTING
      ]
    },
    {
      name: "HR",
      permissions: [
        PERMISSIONS.VIEW_HR,
        PERMISSIONS.MANAGE_HR
      ]
    },
    {
      name: "Reports",
      permissions: [
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.EXPORT_REPORTS
      ]
    },
    {
      name: "Settings",
      permissions: [
        PERMISSIONS.VIEW_SETTINGS,
        PERMISSIONS.EDIT_SETTINGS,
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.MANAGE_ROLES,
        PERMISSIONS.MANAGE_LOCATIONS
      ]
    },
    {
      name: "Client Portal",
      permissions: [
        PERMISSIONS.VIEW_CLIENT_PORTAL,
        PERMISSIONS.MANAGE_CLIENT_PORTAL
      ]
    },
    {
      name: "Chat",
      permissions: [
        PERMISSIONS.VIEW_CHAT,
        PERMISSIONS.SEND_MESSAGES,
        PERMISSIONS.CREATE_CHANNELS,
        PERMISSIONS.MANAGE_CHANNELS,
        PERMISSIONS.MODERATE_CHAT
      ]
    }
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="roleName">Role Name *</Label>
          <Input
            id="roleName"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="roleDescription">Description *</Label>
          <Input
            id="roleDescription"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={errors.description ? "border-red-500" : ""}
          />
          {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Permissions</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFormData({ ...formData, permissions: [PERMISSIONS.ALL] })}
            >
              Select All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFormData({ ...formData, permissions: [] })}
            >
              Clear All
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto border rounded-lg p-4">
          {permissionCategories.map((category) => (
            <div key={category.name} className="space-y-2">
              <h4 className="font-medium text-sm text-gray-900">{category.name}</h4>
              <div className="space-y-1">
                {category.permissions.map((permission) => (
                  <div key={permission} className="flex items-center space-x-2">
                    <Checkbox
                      id={`permission-${permission}`}
                      checked={formData.permissions.includes(permission) || formData.permissions.includes(PERMISSIONS.ALL)}
                      onCheckedChange={() => handlePermissionToggle(permission)}
                      disabled={formData.permissions.includes(PERMISSIONS.ALL)}
                    />
                    <Label htmlFor={`permission-${permission}`} className="text-xs">
                      {permission.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Role
        </Button>
      </DialogFooter>
    </form>
  )
}

export function UserSettings() {
  const { toast } = useToast()
  const { users, updateUser, deleteUser, refreshData, syncUserLocations } = useUnifiedStaff()
  const { locations, isLoading: locationsLoading } = useLocations()
  const [searchTerm, setSearchTerm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localUsers, setLocalUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false)
  const [isDeleteRoleDialogOpen, setIsDeleteRoleDialogOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null)

  // Helper function to get location name by ID
  const getLocationName = (locationId: string): string => {
    const location = locations.find(loc => loc.id === locationId)
    return location ? location.name : "Unknown Location"
  }

  // Helper function to get location details for display
  const getLocationDetails = (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId)
    return location ? {
      name: location.name,
      address: location.address,
      status: location.status
    } : null
  }

  // New user form state
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: "",
    email: "",
    role: "staff",
    locations: [],
    status: "Active",
    avatar: "",
    color: "bg-blue-500",
  })

  // New role form state
  const [newRole, setNewRole] = useState<Partial<Role>>({
    name: "",
    description: "",
    permissions: [],
  })

  // Handler functions
  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId)
    setIsDeleteUserDialogOpen(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    try {
      setIsSubmitting(true)
      await deleteUser(userToDelete)
      setIsDeleteUserDialogOpen(false)
      setUserToDelete(null)
      toast({
        title: "Success",
        description: "User deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveUser = async (updatedUser: User) => {
    try {
      setIsSubmitting(true)
      
      console.log('🔄 Updating user:', updatedUser.name, 'with role:', updatedUser.role)
      
      // Call updateUser with just the user object (not id and user separately)
      const result = updateUser(updatedUser)
      
      if (result.user) {
        console.log('✅ User updated successfully:', result.user.name, 'role:', result.user.role)
        
        setIsEditUserDialogOpen(false)
        setSelectedUser(null)
        
        // Force a refresh to ensure UI updates
        await refreshData()
        
        toast({
          title: "Success",
          description: `User ${updatedUser.name} updated successfully. Role changed to ${updatedUser.role}.`,
        })
      } else {
        throw new Error('Update failed - no user returned')
      }
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveRole = async (updatedRole: Role) => {
    try {
      setIsSubmitting(true)
      const updatedRoles = roles.map(role =>
        role.id === updatedRole.id ? updatedRole : role
      )
      setRoles(updatedRoles)
      SettingsStorage.saveRoles(updatedRoles)
      setIsEditRoleDialogOpen(false)
      setSelectedRole(null)
      toast({
        title: "Success",
        description: "Role updated successfully",
      })
    } catch (error) {
      console.error("Error updating role:", error)
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddUser = async (newUserData: Omit<User, 'id'>) => {
    try {
      setIsSubmitting(true)
      const newUser: User = {
        ...newUserData,
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        lastLogin: undefined
      }

      // Add to local state
      const updatedUsers = [...localUsers, newUser]
      setLocalUsers(updatedUsers)

      // Save to storage
      SettingsStorage.saveUsers(updatedUsers)

      setIsAddUserDialogOpen(false)
      toast({
        title: "Success",
        description: "User added successfully",
      })
    } catch (error) {
      console.error("Error adding user:", error)
      toast({
        title: "Error",
        description: "Failed to add user",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddRole = async (newRoleData: Omit<Role, 'id' | 'userCount'>) => {
    try {
      setIsSubmitting(true)
      const newRole: Role = {
        ...newRoleData,
        id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userCount: 0
      }

      const updatedRoles = [...roles, newRole]
      setRoles(updatedRoles)
      SettingsStorage.saveRoles(updatedRoles)

      setIsAddRoleDialogOpen(false)
      toast({
        title: "Success",
        description: "Role added successfully",
      })
    } catch (error) {
      console.error("Error adding role:", error)
      toast({
        title: "Error",
        description: "Failed to add role",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Load data from storage - run only once on mount
  useEffect(() => {
    // Sync user locations with staff locations first (both API and local)
    const syncLocations = async () => {
      try {
        // Call API endpoint for server-side sync
        await fetch('/api/sync-user-locations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        // Also sync locally
        syncUserLocations()
      } catch (error) {
        console.error('Error syncing user locations:', error)
        // Fallback to local sync only
        syncUserLocations()
      }
    }

    // Only run sync on initial mount
    syncLocations()

    // Don't call refreshData here as it might cause infinite loops
    // refreshData()

    // Load roles
    const storedRoles = SettingsStorage.getRoles()
    if (storedRoles.length === 0) {
      // Initialize with default roles if empty
      const initialRoles = [
        {
          id: "super_admin",
          name: "Super Admin",
          description: "Full access to all settings and features across all locations",
          userCount: 1,
          permissions: ["all"],
        },
        {
          id: "org_admin",
          name: "Organization Admin",
          description: "Access to organization-wide settings and features",
          userCount: 2,
          permissions: [
            "manage_locations",
            "manage_staff",
            "manage_services",
            "manage_clients",
            "manage_inventory",
            "manage_reports",
          ],
        },
        {
          id: "location_manager",
          name: "Location Manager",
          description: "Access to settings and features for assigned locations",
          userCount: 3,
          permissions: ["manage_staff", "manage_services", "manage_clients", "manage_inventory", "view_reports"],
        },
        {
          id: "staff",
          name: "Staff",
          description: "Access to appointments, clients, and services",
          userCount: 15,
          permissions: ["view_appointments", "manage_own_appointments", "view_clients", "view_services"],
        },
        {
          id: "receptionist",
          name: "Receptionist",
          description: "Access to appointments, clients, and point of sale",
          userCount: 5,
          permissions: ["view_appointments", "manage_appointments", "view_clients", "manage_clients", "use_pos"],
        },
      ]
      setRoles(initialRoles)
      SettingsStorage.saveRoles(initialRoles)
    } else {
      setRoles(storedRoles)
    }
  }, []) // Empty dependency array - run only once on mount

  // Update user counts in roles when users change
  useEffect(() => {
    if (roles.length > 0) {
      const rolesWithCounts = roles.map(role => {
        const count = users.filter(user => user.role === role.id).length;
        return { ...role, userCount: count };
      });

      // Only update if counts have actually changed
      const hasChanged = rolesWithCounts.some((role, index) =>
        role.userCount !== roles[index]?.userCount
      );

      if (hasChanged) {
        setRoles(rolesWithCounts);
        SettingsStorage.saveRoles(rolesWithCounts);
      }
    }
  }, [users.length, roles.length]) // Only depend on array lengths to avoid infinite loops

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Update local users when unified users change - memoized to prevent infinite loops
  useEffect(() => {
    setLocalUsers(users)
  }, [users.length]) // Only depend on users array length to prevent infinite loops

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Users & Permissions</h3>
          <p className="text-sm text-muted-foreground">
            Manage user accounts, roles, and permissions for your organization
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsAddRoleDialogOpen(true)}>
            <Shield className="mr-2 h-4 w-4" />
            Add Role
          </Button>
          <Button onClick={() => setIsAddUserDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts and their access permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Locations</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Shield className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">No users found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className={user.color}>
                                  {user.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {roles.find(r => r.id === user.role)?.name || user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.locations.map((locationId) => {
                                const location = locations.find(l => l.id === locationId)
                                return (
                                  <Badge key={locationId} variant="outline" className="text-xs">
                                    <MapPin className="mr-1 h-3 w-3" />
                                    {location?.name || locationId}
                                  </Badge>
                                )
                              })}
                              {user.locations.length === 0 && (
                                <span className="text-sm text-muted-foreground">No locations</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.status === "Active" ? "default" : "secondary"}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {user.lastLogin || "Never"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedUser(user)
                                  setIsEditUserDialogOpen(true)
                                }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-destructive"
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>
                Define roles and their associated permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {roles.map((role) => (
                  <Card key={role.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium">{role.name}</h4>
                          <p className="text-sm text-muted-foreground">{role.description}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Shield className="h-4 w-4" />
                            {role.userCount} users
                            <span>•</span>
                            {role.permissions.length} permissions
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRole(role)
                              setIsEditRoleDialogOpen(true)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="max-w-2xl">
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
              onCancel={() => setIsEditUserDialogOpen(false)}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role information and permissions
            </DialogDescription>
          </DialogHeader>

          {selectedRole && (
            <EditRoleForm
              role={selectedRole}
              onSave={handleSaveRole}
              onCancel={() => setIsEditRoleDialogOpen(false)}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with role and location assignments
            </DialogDescription>
          </DialogHeader>

          <AddUserForm
            roles={roles}
            locations={locations}
            onSave={handleAddUser}
            onCancel={() => setIsAddUserDialogOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Add Role Dialog */}
      <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
            <DialogDescription>
              Create a new role with specific permissions
            </DialogDescription>
          </DialogHeader>

          <AddRoleForm
            onSave={handleAddRole}
            onCancel={() => setIsAddRoleDialogOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={isDeleteUserDialogOpen} onOpenChange={setIsDeleteUserDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
              The user will lose access to the system immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}