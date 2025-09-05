"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { HRManagement } from "@/components/accounting/hr-management"
import { AccessDenied } from "@/components/access-denied"

export default function HRPage() {
  const { hasPermission } = useAuth()
  const [search, setSearch] = useState("")

  // Check if user has permission to view HR page
  if (!hasPermission("view_hr")) {
    return (
      <AccessDenied
        description="You don't have permission to view the HR management page."
        backButtonHref="/dashboard"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">HR Management</h2>
          <p className="text-muted-foreground">Manage your staff documents, benefits, and more.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-[200px] md:w-[300px]"
          />
        </div>
      </div>

      <HRManagement search={search} />
    </div>
  )
}
