'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export default function TestPersistencePage() {
  const [staffData, setStaffData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'stylist',
    locations: ['loc1'],
    status: 'Active',
    homeService: false
  });
  const { toast } = useToast();

  // Fetch staff data
  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/staff');
      if (response.ok) {
        const data = await response.json();
        setStaffData(data.staff || []);
      } else {
        throw new Error('Failed to fetch staff');
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch staff data'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add new staff member
  const addStaff = async () => {
    if (!newStaff.name || !newStaff.email) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Name and email are required'
      });
      return;
    }

    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStaff),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Success',
          description: 'Staff member added successfully'
        });
        setNewStaff({
          name: '',
          email: '',
          phone: '',
          role: 'stylist',
          locations: ['loc1'],
          status: 'Active',
          homeService: false
        });
        fetchStaff(); // Refresh the list
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add staff');
      }
    } catch (error) {
      console.error('Error adding staff:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add staff'
      });
    }
  };

  // Seed locations
  const seedLocations = async () => {
    try {
      const response = await fetch('/api/seed-locations', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Success',
          description: data.message
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to seed locations');
      }
    } catch (error) {
      console.error('Error seeding locations:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to seed locations'
      });
    }
  };

  // Seed staff from mock data
  const seedStaff = async () => {
    try {
      const response = await fetch('/api/seed-staff', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();

        // Clear localStorage if requested
        if (data.clearLocalStorage) {
          localStorage.removeItem('vanity_staff');
          localStorage.removeItem('staff_data');
          console.log('Cleared localStorage staff data after seeding');
        }

        toast({
          title: 'Success',
          description: data.message
        });
        fetchStaff(); // Refresh the staff list
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to seed staff');
      }
    } catch (error) {
      console.error('Error seeding staff:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to seed staff'
      });
    }
  };

  // Clear all staff data
  const clearStaff = async () => {
    if (!confirm('Are you sure you want to clear all staff data? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/seed-staff', {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Success',
          description: data.message
        });
        fetchStaff(); // Refresh the staff list
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clear staff');
      }
    } catch (error) {
      console.error('Error clearing staff:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to clear staff'
      });
    }
  };

  // Debug database state
  const debugDatabase = async () => {
    try {
      const response = await fetch('/api/debug-staff');
      if (response.ok) {
        const data = await response.json();
        console.log('Database Debug Info:', data);
        toast({
          title: 'Debug Info',
          description: `Found ${data.summary.staffCount} staff, ${data.summary.userCount} users. Check console for details.`
        });
      } else {
        throw new Error('Failed to fetch debug info');
      }
    } catch (error) {
      console.error('Error fetching debug info:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch debug info'
      });
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Persistence Test</h1>
        <p className="text-muted-foreground">
          Test the staff management API endpoints and database persistence
        </p>
      </div>

      {/* Setup */}
      <Card>
        <CardHeader>
          <CardTitle>Database Setup</CardTitle>
          <CardDescription>Initialize the database with default data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={seedLocations}>
              Seed Default Locations
            </Button>
            <Button onClick={seedStaff} variant="outline">
              Seed Staff from Mock Data
            </Button>
          </div>
          <div className="flex gap-4">
            <Button onClick={clearStaff} variant="destructive">
              Clear All Staff Data
            </Button>
            <Button onClick={debugDatabase} variant="secondary">
              Debug Database
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Staff */}
      <Card>
        <CardHeader>
          <CardTitle>Add Staff Member</CardTitle>
          <CardDescription>Test adding a new staff member to the database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newStaff.name}
                onChange={(e) => setNewStaff(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter staff name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newStaff.email}
                onChange={(e) => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={newStaff.phone}
              onChange={(e) => setNewStaff(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter phone number"
            />
          </div>
          <Button onClick={addStaff}>
            Add Staff Member
          </Button>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members ({staffData.length})</CardTitle>
          <CardDescription>
            Current staff members in the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button onClick={fetchStaff} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Refresh Staff List'}
            </Button>
            
            {staffData.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No staff members found. Add some staff members to test persistence.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                {staffData.map((staff: any) => (
                  <div key={staff.id} className="p-3 border rounded-lg">
                    <div className="font-medium">{staff.name}</div>
                    <div className="text-sm text-muted-foreground">{staff.email}</div>
                    <div className="text-sm text-muted-foreground">Role: {staff.role}</div>
                    <div className="text-sm text-muted-foreground">Status: {staff.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>First, click "Seed Default Locations" to set up the database</li>
            <li>Add a few staff members using the form above</li>
            <li>Refresh the page to verify data persists</li>
            <li>Go to the HR Management page to see the staff in the main interface</li>
            <li>Try editing staff members and verify changes persist after refresh</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
