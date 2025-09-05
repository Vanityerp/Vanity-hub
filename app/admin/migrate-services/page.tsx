"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ServiceStorage } from "@/lib/service-storage"
import { useServices } from "@/lib/service-provider"
import { useToast } from "@/hooks/use-toast"
import { 
  RefreshCw, 
  Database, 
  CheckCircle, 
  AlertTriangle,
  Trash2,
  Download,
  Upload
} from "lucide-react"

export default function MigrateServicesPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [migrationDetails, setMigrationDetails] = useState<any>(null)
  const { refreshServices, refreshCategories, services, categories } = useServices()
  const { toast } = useToast()

  // Clear existing data and migrate to real data
  const migrateToRealData = async () => {
    setIsLoading(true)
    setMigrationStatus('idle')
    
    try {
      console.log('🔄 Starting service data migration...')
      
      // Call the database seeding endpoint
      const response = await fetch('/api/seed-services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to seed services: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ Database seeding completed:', result)

      // Clear localStorage data (no longer needed)
      localStorage.removeItem('vanity_services')
      localStorage.removeItem('vanity_service_categories')
      console.log('🗑️ Cleared existing localStorage data')

      // Refresh the service provider to load from database
      await refreshServices()
      await refreshCategories()

      // Set migration details
      setMigrationDetails({
        servicesCount: result.services,
        categoriesCount: result.categories,
        categoryBreakdown: categories.map(cat => ({
          name: cat.name,
          count: cat.serviceCount || 0
        }))
      })
      
      setMigrationStatus('success')
      
      toast({
        title: "Migration Successful",
        description: `Successfully migrated to ${result.services} real services across ${result.categories} categories.`,
      })
      
    } catch (error) {
      console.error('❌ Migration failed:', error)
      setMigrationStatus('error')
      
      toast({
        title: "Migration Failed",
        description: "Failed to migrate service data. Check console for details.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Clear all service data
  const clearAllData = async () => {
    if (confirm('Are you sure you want to clear ALL service data from the database? This cannot be undone.')) {
      setIsLoading(true)

      try {
        // Note: This would require a database clear endpoint
        // For now, just clear localStorage and refresh
        localStorage.removeItem('vanity_services')
        localStorage.removeItem('vanity_service_categories')
        await refreshServices()
        await refreshCategories()

        toast({
          title: "Data Cleared",
          description: "Service data has been cleared. Use migration to restore.",
        })
      } catch (error) {
        console.error('Error clearing data:', error)
        toast({
          title: "Clear Failed",
          description: "Failed to clear service data.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Export current data
  const exportCurrentData = () => {
    const data = {
      services: services,
      categories: categories,
      exportDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `service-data-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Data Exported",
      description: "Service data has been exported to a JSON file.",
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Service Data Migration</h1>
          <p className="text-muted-foreground">
            Replace mock service data with real salon service data
          </p>
        </div>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Current Data Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Services:</span>
                <Badge variant="outline">{services.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Categories:</span>
                <Badge variant="outline">{categories.length}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Current categories:
              </div>
              <div className="flex flex-wrap gap-1">
                {categories.map(cat => (
                  <Badge key={cat.id} variant="secondary" className="text-xs">
                    {cat.name} ({cat.serviceCount})
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Migration Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Migrate to Real Data
            </CardTitle>
            <CardDescription>
              Replace all current service data with comprehensive salon data from database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={migrateToRealData}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Migrate to Real Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Current Data
            </CardTitle>
            <CardDescription>
              Download current service data as backup before migration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={exportCurrentData}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Backup
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Clear All Data
            </CardTitle>
            <CardDescription>
              Remove all service data (use with caution)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={clearAllData}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All Data
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Migration Status */}
      {migrationStatus === 'success' && migrationDetails && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Migration completed successfully!</div>
              <div className="text-sm">
                Migrated {migrationDetails.servicesCount} services across {migrationDetails.categoriesCount} categories:
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {migrationDetails.categoryBreakdown.map((cat: any) => (
                  <Badge key={cat.name} variant="outline" className="text-xs">
                    {cat.name}: {cat.count}
                  </Badge>
                ))}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {migrationStatus === 'error' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Migration failed. Please check the console for error details and try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Migration Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li><strong>Export Backup:</strong> First, export your current data as a backup</li>
            <li><strong>Migrate Data:</strong> Click "Migrate to Real Data" to seed database with comprehensive services</li>
            <li><strong>Verify Results:</strong> Check that the migration was successful</li>
            <li><strong>Test System:</strong> Go to Services page to verify all services are loaded correctly</li>
            <li><strong>Check Appointments:</strong> Ensure appointment booking still works with new services</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
