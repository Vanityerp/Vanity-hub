"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { useClients } from "@/lib/client-provider"
import { useLocations } from "@/lib/location-provider"
import { useCurrency } from "@/lib/currency-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, MoreHorizontal, Star, UserRound } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EnhancedClientDetailsDialog } from "./enhanced-client-details-dialog"
import { EditClientDialog } from "./edit-client-dialog"
import { CurrencyDisplay } from "@/components/ui/currency-display"

interface ClientDirectoryProps {
  search: string
}

export function ClientDirectory({ search }: ClientDirectoryProps) {
  const { currentLocation, hasPermission } = useAuth()
  const { clients, updateClient } = useClients()
  const { getLocationName } = useLocations()
  const router = useRouter()
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Ensure clients is an array before filtering
  const clientsArray = Array.isArray(clients) ? clients : [];

  // Filter clients based on location permissions and search term
  const filteredClients = clientsArray.filter((client) => {
    // Filter by location
    if (currentLocation !== "all" && !client.locations.includes(currentLocation)) {
      return false
    }

    // Filter by search term
    if (search && !client.name.toLowerCase().includes(search.toLowerCase())) {
      return false
    }

    return true
  })

  const handleViewDetails = (client: any) => {
    setSelectedClient(client)
    setIsDetailsDialogOpen(true)
  }

  const handleViewProfile = (clientId: string) => {
    router.push(`/dashboard/clients/${clientId}`)
  }

  const handleEditClient = (client: any) => {
    setSelectedClient(client)
    setIsEditDialogOpen(true)
  }

  const handleClientUpdated = (updatedClient: any) => {
    // This function will be called when a client is updated
    // No need to do anything here as the clients state is managed by the ClientProvider
  }

  return (
    <Card>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Last Visit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Preferred Location</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No clients found.
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {client.name}
                      {client.isAutoRegistered && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                          Auto-registered
                        </Badge>
                      )}
                      {client.registrationSource && client.registrationSource !== "manual" && (
                        <Badge variant="secondary" className="text-xs">
                          {client.registrationSource.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>{client.lastVisit}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        client.status === "Active" ? "success" : client.status === "Inactive" ? "secondary" : "outline"
                      }
                    >
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getLocationName(client.preferredLocation)}
                  </TableCell>
                  <TableCell>
                    {client.totalSpent ? (
                      <CurrencyDisplay amount={client.totalSpent} />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
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
                        <DropdownMenuItem onClick={() => handleViewDetails(client)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Quick View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewProfile(client.id)}>
                          <UserRound className="mr-2 h-4 w-4" />
                          Full Profile
                        </DropdownMenuItem>
                        {hasPermission("edit_client") && (
                          <DropdownMenuItem onClick={() => handleEditClient(client)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit client
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

      {/* Enhanced client details dialog */}
      {selectedClient && (
        <>
          <EnhancedClientDetailsDialog
            client={selectedClient}
            open={isDetailsDialogOpen}
            onOpenChange={setIsDetailsDialogOpen}
          />

          <EditClientDialog
            clientId={selectedClient.id}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onClientUpdated={handleClientUpdated}
          />
        </>
      )}
    </Card>
  )
}

