"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, UserPlus } from "lucide-react"
// DEPRECATED: Mock data removed - now using real API data

interface ClientSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectClient: (client: any) => void
}

export function ClientSearchDialog({ open, onOpenChange, onSelectClient }: ClientSearchDialogProps) {
  const { currentLocation } = useAuth()
  const [search, setSearch] = useState("")

  // Filter clients based on location and search term
  // TODO: Replace with real API call to fetch and filter clients
  const filteredClients: any[] = []



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Client</DialogTitle>
          <DialogDescription>Search for a client or create a new one.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="border rounded-md max-h-[300px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No clients found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => onSelectClient(client)}>
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" className="sm:mr-auto" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            New Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

