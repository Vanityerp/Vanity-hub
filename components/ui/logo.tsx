"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { SettingsStorage } from "@/lib/settings-storage"

interface LogoProps {
  /** Size variant for the logo */
  size?: "sm" | "md" | "lg"
  /** Whether to show the company name alongside the logo */
  showName?: boolean
  /** Whether to make the logo clickable (as a link) */
  href?: string
  /** Additional CSS classes */
  className?: string
  /** Whether to use inverted colors (for dark backgrounds) */
  inverted?: boolean
  /** Override the default company name */
  companyNameOverride?: string
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8", 
  lg: "h-12 w-12"
}

const textSizeClasses = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl"
}

export function Logo({
  size = "md",
  showName,
  href,
  className = "",
  inverted = false,
  companyNameOverride
}: LogoProps) {
  // Get branding settings with fallback
  const settings = SettingsStorage.getGeneralSettings()
  const branding = settings.branding || {
    companyLogo: null,
    companyName: "Vanity Hub",
    primaryBrandColor: "#8b5cf6",
    logoAltText: "Company Logo",
    showCompanyNameWithLogo: true
  }

  // Determine if we should show the company name
  const shouldShowName = showName !== undefined
    ? showName
    : branding.showCompanyNameWithLogo

  // Get the company name to display
  const companyName = companyNameOverride || branding.companyName || "Vanity Hub"

  // Create the logo image element
  const logoImage = branding.companyLogo ? (
    <Image
      src={branding.companyLogo}
      alt={branding.logoAltText || "Company Logo"}
      width={size === "sm" ? 24 : size === "md" ? 32 : 48}
      height={size === "sm" ? 24 : size === "md" ? 32 : 48}
      className={`${sizeClasses[size]} object-contain ${inverted ? "invert" : ""}`}
    />
  ) : (
    // Fallback to default logo design
    <div className={`${sizeClasses[size]} relative`}>
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          background: `linear-gradient(135deg, ${branding.primaryBrandColor || "#8b5cf6"}, #9333ea)`
        }}
      />
      <div className={`absolute inset-[2px] bg-white dark:bg-black rounded-md flex items-center justify-center ${inverted ? "bg-black dark:bg-white" : ""}`}>
        <span
          className={`font-bold ${size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-lg"}`}
          style={{ color: branding.primaryBrandColor || "#8b5cf6" }}
        >
          {companyName.charAt(0).toUpperCase()}
        </span>
      </div>
    </div>
  )

  // Create the content (logo + optional name)
  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      {logoImage}
      {shouldShowName && (
        <span 
          className={`${textSizeClasses[size]} font-bold`}
          style={{ color: inverted ? "white" : undefined }}
        >
          {companyName}
        </span>
      )}
    </div>
  )

  // If href is provided, wrap in a Link
  if (href) {
    return (
      <Link href={href} className="flex items-center">
        {content}
      </Link>
    )
  }

  return content
}

// Convenience components for common use cases
export function DashboardLogo({ href = "/dashboard", ...props }: Omit<LogoProps, "href"> & { href?: string }) {
  return <Logo href={href} showName={true} {...props} />
}

export function ClientPortalLogo({ href = "/client-portal", ...props }: Omit<LogoProps, "href"> & { href?: string }) {
  return <Logo href={href} showName={true} {...props} />
}

export function LoginLogo({ href = "/", ...props }: Omit<LogoProps, "href"> & { href?: string }) {
  return <Logo href={href} showName={true} {...props} />
}

export function FooterLogo(props: Omit<LogoProps, "href">) {
  return <Logo showName={true} {...props} />
}
