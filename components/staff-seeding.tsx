'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Database, Users, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

interface SeedingStatus {
  currentStaffCount: number;
  currentUserCount: number;
  mockStaffCount: number;
  seedingNeeded: boolean;
  seedingRecommended: boolean;
}

interface SeedingResult {
  success: boolean;
  seededCount: number;
  seededStaff: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    originalId: string;
  }>;
  errors: Array<{
    staff: string;
    error: string;
  }>;
  message: string;
}

export function StaffSeeding() {
  const [seedingStatus, setSeedingStatus] = useState<SeedingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [seedingResult, setSeedingResult] = useState<SeedingResult | null>(null);
  const { toast } = useToast();

  // Check seeding status on component mount
  useEffect(() => {
    checkSeedingStatus();
  }, []);

  const checkSeedingStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/seed-staff');
      if (response.ok) {
        const status = await response.json();
        setSeedingStatus(status);
      }
    } catch (error) {
      console.error('Error checking seeding status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to check seeding status'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const seedStaff = async () => {
    setIsSeeding(true);
    setSeedingResult(null);

    try {
      const response = await fetch('/api/seed-staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        setSeedingResult(result);

        // Clear localStorage if requested
        if (result.clearLocalStorage) {
          localStorage.removeItem('vanity_staff');
          localStorage.removeItem('staff_data');
          console.log('Cleared localStorage staff data after seeding');
        }

        // Refresh seeding status
        await checkSeedingStatus();

        toast({
          title: 'Seeding Complete',
          description: result.message
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Seeding failed');
      }
    } catch (error) {
      console.error('Error during seeding:', error);
      toast({
        variant: 'destructive',
        title: 'Seeding Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const clearStaff = async () => {
    if (!confirm('Are you sure you want to clear all staff data? This cannot be undone.')) {
      return;
    }

    setIsClearing(true);

    try {
      const response = await fetch('/api/seed-staff', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        // Refresh seeding status
        await checkSeedingStatus();
        setSeedingResult(null);
        
        toast({
          title: 'Data Cleared',
          description: result.message
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Clear failed');
      }
    } catch (error) {
      console.error('Error clearing data:', error);
      toast({
        variant: 'destructive',
        title: 'Clear Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsClearing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Staff Database Setup
          </CardTitle>
          <CardDescription>
            Checking database status...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!seedingStatus) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Staff Database Setup
        </CardTitle>
        <CardDescription>
          Initialize your database with real staff data from mock data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Current Database</h4>
            <p className="text-2xl font-bold">{seedingStatus.currentStaffCount}</p>
            <p className="text-xs text-muted-foreground">Staff members</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Available Mock Data</h4>
            <p className="text-2xl font-bold">{seedingStatus.mockStaffCount}</p>
            <p className="text-xs text-muted-foreground">Staff members</p>
          </div>
        </div>

        {/* Status Alerts */}
        {seedingStatus.seedingNeeded && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your database is empty. Seed it with {seedingStatus.mockStaffCount} staff members to get started.
            </AlertDescription>
          </Alert>
        )}

        {!seedingStatus.seedingNeeded && seedingStatus.seedingRecommended && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have {seedingStatus.currentStaffCount} staff members. You can add {seedingStatus.mockStaffCount - seedingStatus.currentStaffCount} more from mock data.
            </AlertDescription>
          </Alert>
        )}

        {!seedingStatus.seedingNeeded && !seedingStatus.seedingRecommended && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your database is fully populated with staff data. All changes will persist across sessions.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={seedStaff} 
            disabled={isSeeding || isClearing}
            className="flex-1"
          >
            <Users className="mr-2 h-4 w-4" />
            {isSeeding ? 'Seeding...' : `Seed ${seedingStatus.mockStaffCount} Staff Members`}
          </Button>
          
          {seedingStatus.currentStaffCount > 0 && (
            <Button 
              onClick={clearStaff} 
              disabled={isSeeding || isClearing}
              variant="destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isClearing ? 'Clearing...' : 'Clear All'}
            </Button>
          )}
        </div>

        {/* Seeding Results */}
        {seedingResult && (
          <div className="space-y-2">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Successfully seeded {seedingResult.seededCount} staff members to the database.
              </AlertDescription>
            </Alert>
            
            {seedingResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {seedingResult.errors.length} errors occurred during seeding:
                  <ul className="mt-2 list-disc list-inside">
                    {seedingResult.errors.map((error, index) => (
                      <li key={index} className="text-xs">
                        {error.staff}: {error.error}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
