"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { ImageIcon, Loader2, ZoomIn } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Button } from "@/components/ui/button"

interface EnhancedImageProps {
  src: string | string[]
  alt: string
  className?: string
  aspectRatio?: "square" | "portrait" | "landscape" | "auto"
  fallbackSrc?: string
  showZoom?: boolean
  priority?: boolean
  sizes?: string
  objectFit?: "cover" | "contain" | "fill"
  loadingClassName?: string
  errorClassName?: string
  onLoad?: () => void
  onError?: () => void
  onClick?: () => void
}

export function EnhancedImage({
  src,
  alt,
  className,
  aspectRatio = "auto",
  fallbackSrc = "/placeholder.jpg",
  showZoom = false,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
  objectFit = "cover",
  loadingClassName,
  errorClassName,
  onLoad,
  onError,
  onClick
}: EnhancedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState<string>("")
  const [isZoomOpen, setIsZoomOpen] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Helper function to validate if a string is a valid URL or data URI
  const isValidImageSrc = (src: string): boolean => {
    if (!src || typeof src !== 'string' || src.trim() === '') return false

    // Check for data URI (base64 images)
    if (src.startsWith('data:image/')) return true

    // Check for valid URL
    try {
      new URL(src)
      return true
    } catch {
      // Check for relative paths
      return src.startsWith('/') || src.startsWith('./') || src.startsWith('../')
    }
  }

  // Get the primary image source with validation
  const primarySrc = Array.isArray(src) ? src[0] : src
  const allImages = Array.isArray(src) ? src.filter(Boolean) : [src].filter(Boolean)

  // Validate and set the source - only use valid URLs/paths
  const validSrc = primarySrc && isValidImageSrc(primarySrc) ? primarySrc : fallbackSrc

  useEffect(() => {
    // Only set currentSrc if we have a valid source
    if (validSrc && isValidImageSrc(validSrc)) {
      setCurrentSrc(validSrc)
      setIsLoading(true)
      setHasError(false)
    } else {
      // If no valid source, show error state immediately
      setCurrentSrc("")
      setIsLoading(false)
      setHasError(true)
    }
  }, [validSrc])

  const handleImageLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleImageError = () => {
    setIsLoading(false)

    // Try fallback if we haven't already and retry count is low and fallback is valid
    if (currentSrc !== fallbackSrc && retryCount < 2 && isValidImageSrc(fallbackSrc)) {
      setCurrentSrc(fallbackSrc)
      setHasError(false)
      setIsLoading(true)
      setRetryCount(prev => prev + 1)
    } else {
      setHasError(true)
      onError?.()
    }
  }

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "square":
        return "aspect-square"
      case "portrait":
        return "aspect-[3/4]"
      case "landscape":
        return "aspect-[4/3]"
      default:
        return ""
    }
  }

  const imageContent = (
    <div
      className={cn(
        "relative overflow-hidden bg-gray-100 group",
        getAspectRatioClass(),
        className
      )}
      onClick={onClick}
    >
      {/* Loading State */}
      {isLoading && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center bg-gray-50",
          loadingClassName
        )}>
          <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
        </div>
      )}

      {/* Error State */}
      {hasError && !isLoading && (
        <div className={cn(
          "absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100",
          errorClassName
        )}>
          <div className="bg-white/80 rounded-full p-3 mb-3 shadow-sm">
            <ImageIcon className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-xs font-medium text-gray-500">Image not available</p>
        </div>
      )}

      {/* Image */}
      {!hasError && currentSrc && isValidImageSrc(currentSrc) && (
        <Image
          src={currentSrc}
          alt={alt}
          fill
          className={cn(
            "transition-all duration-300",
            objectFit === "cover" ? "object-cover" :
            objectFit === "contain" ? "object-contain" : "object-fill",
            isLoading ? "opacity-0" : "opacity-100",
            showZoom && "group-hover:scale-105 cursor-pointer"
          )}
          sizes={sizes}
          priority={priority}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}

      {/* Zoom Overlay */}
      {showZoom && !hasError && !isLoading && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
            <ZoomIn className="h-5 w-5 text-white" />
          </div>
        </div>
      )}
    </div>
  )

  if (showZoom && !hasError) {
    return (
      <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <DialogTrigger asChild>
          {imageContent}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <VisuallyHidden>
            <DialogTitle>{alt} - Image Viewer</DialogTitle>
          </VisuallyHidden>
          <ImageZoomModal
            images={allImages}
            alt={alt}
            fallbackSrc={fallbackSrc}
            onClose={() => setIsZoomOpen(false)}
          />
        </DialogContent>
      </Dialog>
    )
  }

  return imageContent
}

// Image Zoom Modal Component
interface ImageZoomModalProps {
  images: string[]
  alt: string
  fallbackSrc: string
  onClose: () => void
}

function ImageZoomModal({ images, alt, fallbackSrc, onClose }: ImageZoomModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  // Filter out empty images and get current image with validation
  const validImages = images.filter(img => img && img.trim() !== "")
  const currentImage = validImages[currentIndex] || fallbackSrc

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  const handleImageError = () => {
    setImageLoading(false)
    setImageError(true)
  }

  const nextImage = () => {
    if (validImages.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % validImages.length)
      setImageLoading(true)
      setImageError(false)
    }
  }

  const prevImage = () => {
    if (validImages.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length)
      setImageLoading(true)
      setImageError(false)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevImage()
      if (e.key === "ArrowRight") nextImage()
      if (e.key === "Escape") onClose()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="relative w-full h-full min-h-[60vh] bg-black rounded-lg overflow-hidden">
      {/* Loading State */}
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
        </div>
      )}

      {/* Error State */}
      {imageError && !imageLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-black">
          <ImageIcon className="h-16 w-16 mb-4 text-gray-500" />
          <p className="text-sm font-medium">Image not available</p>
        </div>
      )}

      {/* Main Image */}
      {!imageError && currentImage && currentImage.trim() !== "" && (
        <div className="relative w-full h-full">
          <Image
            src={currentImage}
            alt={`${alt} - Image ${currentIndex + 1}`}
            fill
            className={cn(
              "object-contain transition-opacity duration-300",
              imageLoading ? "opacity-0" : "opacity-100"
            )}
            sizes="100vw"
            priority
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </div>
      )}

      {/* Navigation Arrows */}
      {validImages.length > 1 && !imageError && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
            onClick={prevImage}
            aria-label="Previous image"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
            onClick={nextImage}
            aria-label="Next image"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </>
      )}

      {/* Image Counter */}
      {validImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {validImages.length}
        </div>
      )}

      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
        onClick={onClose}
        aria-label="Close modal"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </Button>
    </div>
  )
}
