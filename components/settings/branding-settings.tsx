"use client"

import React, { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Upload, X, Eye } from "lucide-react"
import { SettingsStorage, type BrandingSettings } from "@/lib/settings-storage"
import { Logo } from "@/components/ui/logo"

export function BrandingSettings() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  // Get current settings
  const currentSettings = SettingsStorage.getGeneralSettings()
  const [formData, setFormData] = useState<BrandingSettings>(currentSettings.branding)

  const handleChange = (field: keyof BrandingSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PNG, JPG, or SVG file.",
      })
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload a file smaller than 5MB.",
      })
      return
    }

    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    // In a real app, you would upload the file to a server here
    // For now, we'll use the blob URL as a placeholder
    handleChange("companyLogo", url)

    toast({
      title: "Logo uploaded",
      description: "Your logo has been uploaded successfully. Don't forget to save your changes.",
    })
  }

  const handleRemoveLogo = () => {
    handleChange("companyLogo", null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Update the general settings with new branding
      const updatedSettings = {
        ...currentSettings,
        branding: formData
      }
      
      SettingsStorage.saveGeneralSettings(updatedSettings)

      toast({
        title: "Branding updated",
        description: "Your branding settings have been saved successfully.",
      })
    } catch (error) {
      console.error("Failed to save branding settings:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save branding settings. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Branding</CardTitle>
            <CardDescription>
              Customize your company logo and branding that appears across the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload Section */}
            <div className="space-y-4">
              <Label>Company Logo</Label>
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    {formData.companyLogo || previewUrl ? (
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <div className="relative">
                            <img
                              src={previewUrl || formData.companyLogo || ""}
                              alt="Logo preview"
                              className="h-20 w-20 object-contain rounded-lg border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                              onClick={handleRemoveLogo}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Replace Logo
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Upload your company logo</p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG, or SVG up to 5MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Choose File
                        </Button>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
                placeholder="Enter your company name"
                required
              />
            </div>

            {/* Logo Alt Text */}
            <div className="space-y-2">
              <Label htmlFor="logoAltText">Logo Alt Text</Label>
              <Input
                id="logoAltText"
                value={formData.logoAltText}
                onChange={(e) => handleChange("logoAltText", e.target.value)}
                placeholder="Descriptive text for your logo"
                required
              />
            </div>

            {/* Primary Brand Color */}
            <div className="space-y-2">
              <Label htmlFor="primaryBrandColor">Primary Brand Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryBrandColor"
                  type="color"
                  value={formData.primaryBrandColor}
                  onChange={(e) => handleChange("primaryBrandColor", e.target.value)}
                  className="w-20 h-10 p-1 border rounded"
                />
                <Input
                  value={formData.primaryBrandColor}
                  onChange={(e) => handleChange("primaryBrandColor", e.target.value)}
                  placeholder="#8b5cf6"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Show Company Name with Logo */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Company Name with Logo</Label>
                <p className="text-sm text-muted-foreground">
                  Display the company name alongside the logo
                </p>
              </div>
              <Switch
                checked={formData.showCompanyNameWithLogo}
                onCheckedChange={(checked) => handleChange("showCompanyNameWithLogo", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview
            </CardTitle>
            <CardDescription>
              See how your branding will appear across the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Dashboard Header</Label>
                <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                  <Logo size="md" showName={formData.showCompanyNameWithLogo} />
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Login Page</Label>
                <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                  <Logo size="lg" showName={formData.showCompanyNameWithLogo} />
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Small Size (Navigation)</Label>
                <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                  <Logo size="sm" showName={formData.showCompanyNameWithLogo} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Branding Settings"}
          </Button>
        </div>
      </div>
    </form>
  )
}
