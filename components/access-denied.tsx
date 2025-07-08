"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface AccessDeniedProps {
  title?: string
  description?: string
  showBackButton?: boolean
  backButtonLabel?: string
  backButtonHref?: string
}

export function AccessDenied({
  title = "Access Denied",
  description = "You don't have permission to access this page.",
  showBackButton = true,
  backButtonLabel = "Go Back",
  backButtonHref = "/dashboard",
}: AccessDeniedProps) {
  const router = useRouter()

  const handleBack = () => {
    if (backButtonHref) {
      router.push(backButtonHref)
    } else {
      router.back()
    }
  }

  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldAlert className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            If you believe you should have access to this page, please contact your administrator.
          </p>
        </CardContent>
        {showBackButton && (
          <CardFooter className="flex justify-center">
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backButtonLabel}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
