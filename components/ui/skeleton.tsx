import { cn } from "@/lib/utils"
import { memo } from "react"

/**
 * Performance optimized Skeleton component
 * - Uses memo to prevent unnecessary re-renders
 * - Adds a data attribute to help with performance profiling
 * - Provides a reduced-motion option for better accessibility and performance
 */
const Skeleton = memo(({
  className,
  reducedMotion = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  reducedMotion?: boolean
}) => {
  return (
    <div
      className={cn(
        reducedMotion ? "bg-muted" : "animate-pulse bg-muted",
        "rounded-md",
        className
      )}
      data-component="skeleton"
      {...props}
    />
  )
})

// Add display name for better debugging
Skeleton.displayName = "Skeleton"

export { Skeleton }
