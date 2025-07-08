'use client';

import { useState } from 'react';
import { useClients } from '@/lib/use-data-fetching';
import { useCurrency } from '@/lib/currency-provider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CurrencySelector } from '@/components/currency-selector';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Search, 
  UserPlus, 
  RefreshCw, 
  Calendar, 
  Mail, 
  Phone, 
  Edit, 
  Trash2 
} from 'lucide-react';

/**
 * Optimized Clients List Component
 * 
 * This component uses the new data fetching utilities with currency-aware revalidation
 * to display clients in the dashboard.
 */
export function OptimizedClientsList({ locationId }: { locationId?: number }) {
  const { data: clients, isLoading, error, refetch } = useClients(locationId);
  const { formatCurrency } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter clients by search query
  const filteredClients = clients
    ? clients.filter(client => 
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone.includes(searchQuery)
      )
    : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Clients</h2>
        <div className="flex items-center gap-2">
          <CurrencySelector showBadge popularOnly />
          <Button size="sm" onClick={() => refetch()} variant="outline" className="flex items-center gap-1">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Add Client */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button className="flex items-center gap-1">
          <UserPlus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-md">
          Error loading clients: {error.message}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Clients table */}
      {!isLoading && clients && (
        <>
          {filteredClients.length === 0 ? (
            <div className="text-center p-8 border rounded-md">
              <p className="text-muted-foreground">No clients found matching your search criteria.</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Lifetime Value</TableHead>
                    <TableHead>Last Visit</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map(client => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={client.avatar} alt={client.name} />
                            <AvatarFallback>{client.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{client.name}</div>
                            <div className="text-xs text-muted-foreground">{client.membershipLevel || 'Regular'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{client.email}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{client.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(client.lifetimeValue || 0)}</div>
                        <div className="text-xs text-muted-foreground">{client.visits || 0} visits</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{client.lastVisit || 'Never'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <Edit className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Book Appointment
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="flex items-center gap-2 text-red-600">
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
            <div>Showing {filteredClients.length} of {clients.length} clients</div>
            <div>Using Next.js 15 optimized data fetching with currency-aware revalidation</div>
          </div>
        </>
      )}
    </div>
  );
}
