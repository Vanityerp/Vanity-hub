"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, X, Camera } from "lucide-react"
import { validateAndProcessImage } from "@/lib/staff-storage"

interface ProfileImageUploadProps {
  currentImage?: string
  fallbackInitials: string
  onImageChange: (imageData: string | null, imageType?: string) => void
  onError?: (error: string) => void
  size?: "sm" | "md" | "lg"
  className?: string
  disabled?: boolean
}

export function ProfileImageUpload({
  currentImage,
  fallbackInitials,
  onImageChange,
  onError,
  size = "md",
  className = "",
  disabled = false
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(currentImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-16 w-16", 
    lg: "h-24 w-24"
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const result = await validateAndProcessImage(file)
      
      if (!result.isValid) {
        if (onError) {
          onError(result.error || "Invalid image file")
        }
        return
      }

      setPreviewImage(result.imageData!)
      onImageChange(result.imageData!, result.imageType)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload image"
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveImage = () => {
    setPreviewImage(null)
    onImageChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUploadClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="relative">
        <Avatar className={`${sizeClasses[size]} border-2 border-gray-200`}>
          <AvatarImage 
            src={previewImage || undefined} 
            alt="Profile picture"
            className="object-cover"
          />
          <AvatarFallback className="bg-gray-100 text-gray-600 font-medium">
            {fallbackInitials}
          </AvatarFallback>
        </Avatar>
        
        {/* Upload overlay button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-white border-2 border-gray-200 hover:bg-gray-50"
          onClick={handleUploadClick}
          disabled={disabled || isUploading}
        >
          {isUploading ? (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          ) : (
            <Camera className="h-3 w-3" />
          )}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            disabled={disabled || isUploading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload Photo"}
          </Button>
          
          {previewImage && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveImage}
              disabled={disabled || isUploading}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
              Remove
            </Button>
          )}
        </div>
        
        <p className="text-xs text-gray-500">
          JPEG, PNG, or WebP. Max 5MB.
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
    </div>
  )
}
