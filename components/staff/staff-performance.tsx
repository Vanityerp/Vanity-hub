"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useStaff } from "@/lib/use-staff-data"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { useState, useEffect, useMemo } from "react"
import { subDays, format, isWithinInterval, parseISO } from "date-fns"
import type { DateRange } from "react-day-picker"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { useCurrency } from "@/lib/currency-provider"
import { useLocations } from "@/lib/location-provider"
import { useAuth } from "@/lib/auth-provider"
import { Filter, SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react"

// Staff role types
type StaffRole = "stylist" | "colorist" | "nail_technician" | "esthetician" | "barber" | "all"

// Performance metric types
type PerformanceMetric = "revenue" | "appointments" | "utilization" | "all"

export function StaffPerformance() {
  const { formatCurrency, setCurrency } = useCurrency()
  const { locations, getLocationName } = useLocations()
  const { currentLocation } = useAuth()
  const { staff: realStaff } = useStaff()

  // Filter states
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [staffMember, setStaffMember] = useState<string>("all")
  const [staffRole, setStaffRole] = useState<StaffRole>("all")
  const [metric, setMetric] = useState<PerformanceMetric>("all")
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [localLocation, setLocalLocation] = useState<string>(currentLocation || "all")

  // Ensure QAR is set as the currency (only once)
  useEffect(() => {
    setCurrency("QAR")
  }, [setCurrency])

  // Get unique staff roles
  const staffRoles = useMemo(() => {
    const roles = new Set<string>()
    realStaff.forEach(staff => roles.add(staff.role))
    return Array.from(roles)
  }, [realStaff])

  // Filter staff based on selected filters
  const filteredStaff = useMemo(() => {
    return realStaff.filter(staff => {
      // Filter by staff member
      if (staffMember !== "all" && staff.id !== staffMember) {
        return false
      }

      // Filter by role
      if (staffRole !== "all" && staff.role !== staffRole) {
        return false
      }

      // Filter by location
      if (localLocation !== "all") {
        if (localLocation === "home" && !staff.homeService && !staff.locations.includes("home")) {
          return false
        } else if (localLocation !== "home" && !staff.locations.includes(localLocation)) {
          return false
        }
      }

      // Filter by search term
      if (searchTerm && !staff.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      return true
    })
  }, [realStaff, staffMember, staffRole, localLocation, searchTerm])

  // Generate performance data based on filters
  const performanceData = useMemo(() => {
    // Base data
    const baseData = [
      { name: "Week 1", appointments: 24, revenue: 1800, services: 32, utilization: 75 },
      { name: "Week 2", appointments: 28, revenue: 2100, services: 36, utilization: 82 },
      { name: "Week 3", appointments: 32, revenue: 2400, services: 42, utilization: 88 },
      { name: "Week 4", appointments: 30, revenue: 2250, services: 38, utilization: 85 },
    ]

    // If no staff is selected or filtered out, return base data
    if (filteredStaff.length === 0) {
      return baseData
    }

    // Adjust data based on number of filtered staff
    const multiplier = realStaff.length > 0 ? filteredStaff.length / realStaff.length : 1
    return baseData.map(week => ({
      ...week,
      appointments: Math.round(week.appointments * multiplier),
      revenue: Math.round(week.revenue * multiplier),
      services: Math.round(week.services * multiplier),
      utilization: Math.min(100, Math.round(week.utilization * (0.8 + (multiplier * 0.2))))
    }))
  }, [filteredStaff])

  // Generate service breakdown based on filters
  const serviceBreakdown = useMemo(() => {
    // Base data
    const baseData = [
      { name: "Haircut & Style", count: 45, revenue: 3375 },
      { name: "Color & Highlights", count: 22, revenue: 3300 },
      { name: "Blowout", count: 18, revenue: 1170 },
      { name: "Men's Haircut", count: 15, revenue: 825 },
      { name: "Deep Conditioning", count: 12, revenue: 540 },
      { name: "Other Services", count: 22, revenue: 1340 },
    ]

    // If no staff is selected or filtered out, return base data
    if (filteredStaff.length === 0) {
      return baseData
    }

    // Adjust data based on number of filtered staff and their roles
    const multiplier = realStaff.length > 0 ? filteredStaff.length / realStaff.length : 1

    // Role-specific adjustments
    const hasStylists = filteredStaff.some(staff => staff.role === "stylist")
    const hasColorists = filteredStaff.some(staff => staff.role === "colorist")
    const hasNailTechs = filteredStaff.some(staff => staff.role === "nail_technician")

    return baseData.map(service => {
      let roleMultiplier = 1

      // Adjust based on service type and staff roles
      if (service.name.includes("Color") && !hasColorists) roleMultiplier = 0.2
      if ((service.name.includes("Haircut") || service.name.includes("Style")) && !hasStylists) roleMultiplier = 0.3

      return {
        ...service,
        count: Math.round(service.count * multiplier * roleMultiplier),
        revenue: Math.round(service.revenue * multiplier * roleMultiplier)
      }
    })
  }, [filteredStaff])

  // Generate client retention data based on filters
  const clientRetention = useMemo(() => {
    // Base data for all staff
    const baseData = [
      { name: "New Clients", value: 35 },
      { name: "Returning Clients", value: 65 },
    ]

    // If no staff is selected or filtered out, return base data
    if (filteredStaff.length === 0) {
      return baseData
    }

    // Adjust based on staff experience (using ID as a proxy for seniority)
    const seniorStaffPercentage = filteredStaff.filter(staff => parseInt(staff.id) <= 5).length / filteredStaff.length

    // Senior staff tend to have more returning clients
    const returningPercentage = Math.min(85, Math.round(60 + (seniorStaffPercentage * 25)))
    const newPercentage = 100 - returningPercentage

    return [
      { name: "New Clients", value: newPercentage },
      { name: "Returning Clients", value: returningPercentage },
    ]
  }, [filteredStaff])

  // Generate stable staff performance metrics (avoid random generation in render)
  const staffPerformanceMetrics = useMemo(() => {
    const metrics = new Map()
    filteredStaff.forEach((staff, index) => {
      // Use staff ID as seed for consistent random values
      const seed = parseInt(staff.id) || index + 1
      const revenue = Math.floor(1500 + (seed * 123) % 2000)
      const appointments = Math.floor(20 + (seed * 456) % 30)
      const utilization = Math.floor(70 + (seed * 789) % 25)

      metrics.set(staff.id, { revenue, appointments, utilization })
    })
    return metrics
  }, [filteredStaff])

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalAppointments = performanceData.reduce((sum, week) => sum + week.appointments, 0)
    const totalRevenue = performanceData.reduce((sum, week) => sum + week.revenue, 0)
    const totalServices = performanceData.reduce((sum, week) => sum + week.services, 0)
    const avgUtilization = Math.round(
      performanceData.reduce((sum, week) => sum + week.utilization, 0) / performanceData.length
    )

    return {
      appointments: totalAppointments,
      revenue: totalRevenue,
      services: totalServices,
      utilization: avgUtilization
    }
  }, [performanceData])

  // Reset all filters
  const resetFilters = () => {
    setStaffMember("all")
    setStaffRole("all")
    setLocalLocation("all")
    setMetric("all")
    setSearchTerm("")
    setDateRange({
      from: subDays(new Date(), 30),
      to: new Date(),
    })
  }

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (staffMember !== "all") count++
    if (staffRole !== "all") count++
    if (localLocation !== "all") count++
    if (metric !== "all") count++
    if (searchTerm) count++
    return count
  }, [staffMember, staffRole, localLocation, metric, searchTerm])

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
        <div>
          <CardTitle>Staff Performance</CardTitle>
          <CardDescription>Track performance metrics for your staff</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">{activeFilterCount}</Badge>
            )}
            {showFilters ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
          </Button>
          <DatePickerWithRange dateRange={dateRange} onDateRangeChange={setDateRange} />
        </div>
      </CardHeader>
      <CardContent>
        {showFilters && (
          <div className="mb-6 p-4 border rounded-md bg-muted/40">
            <div className="flex flex-wrap justify-between items-center mb-4">
              <h3 className="text-sm font-medium">Filter Options</h3>
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 text-xs">
                Reset Filters
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-xs font-medium">Staff Member</label>
                <Select value={staffMember} onValueChange={setStaffMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    {realStaff.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">Role</label>
                <Select value={staffRole} onValueChange={(value) => setStaffRole(value as StaffRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {staffRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">Location</label>
                <Select value={localLocation} onValueChange={setLocalLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                    {/* Add Home Service option only if not already in locations */}
                    {!locations.some(loc => loc.id === "home") && (
                      <SelectItem value="home" key="home">Home Service</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">Performance Metric</label>
                <Select value={metric} onValueChange={(value) => setMetric(value as PerformanceMetric)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Metrics</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="appointments">Appointments</SelectItem>
                    <SelectItem value="utilization">Utilization</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2 lg:col-span-4">
                <label className="text-xs font-medium">Search Staff</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSearchTerm("")}
                      className="h-10 w-10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {filteredStaff.length > 0 ? (
              <div className="mt-4 text-sm text-muted-foreground">
                Showing performance data for {filteredStaff.length} staff member{filteredStaff.length !== 1 ? 's' : ''}
              </div>
            ) : (
              <div className="mt-4 text-sm text-destructive">
                No staff members match the selected filters. Please adjust your criteria.
              </div>
            )}
          </div>
        )}

        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="staff">Staff Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summaryMetrics.appointments}</div>
                  <p className="text-xs text-muted-foreground">
                    {filteredStaff.length < realStaff.length ? `${filteredStaff.length} staff selected` : '+8% from last month'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold"><CurrencyDisplay amount={summaryMetrics.revenue} /></div>
                  <p className="text-xs text-muted-foreground">
                    {filteredStaff.length < realStaff.length ? `${filteredStaff.length} staff selected` : '+12% from last month'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Services Provided</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summaryMetrics.services}</div>
                  <p className="text-xs text-muted-foreground">
                    {filteredStaff.length < realStaff.length ? `${filteredStaff.length} staff selected` : '+5% from last month'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summaryMetrics.utilization}%</div>
                  <p className="text-xs text-muted-foreground">
                    {filteredStaff.length < realStaff.length ? `${filteredStaff.length} staff selected` : 'Based on scheduled hours'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium">Performance Trends</CardTitle>
                  <div className="text-xs text-muted-foreground">
                    {dateRange?.from && dateRange?.to ?
                      `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}` :
                      "Last 30 days"
                    }
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceData}>
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip formatter={(value, name) => {
                          if (name.includes('Revenue')) return formatCurrency(value as number)
                          return value
                        }} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="appointments" fill="#8884d8" name="Appointments" />
                        <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name={`Revenue (${formatCurrency(0).charAt(0)})`} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="services">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Service Breakdown</CardTitle>
                {filteredStaff.length < realStaff.length && (
                  <Badge variant="outline">
                    {filteredStaff.length} staff selected
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serviceBreakdown}>
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip formatter={(value, name) => {
                        if (name.includes('Revenue')) return formatCurrency(value as number)
                        return value
                      }} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="count" fill="#8884d8" name="Number of Services" />
                      <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name={`Revenue (${formatCurrency(0).charAt(0)})`} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium">Client Retention</CardTitle>
                  {filteredStaff.length < realStaff.length && (
                    <Badge variant="outline">
                      {filteredStaff.length} staff selected
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={clientRetention}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          <Cell key="cell-0" fill="#8884d8" />
                          <Cell key="cell-1" fill="#82ca9d" />
                        </Pie>
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Client Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredStaff.length === 1 ? (
                      <>
                        <div className="border rounded-md p-3">
                          <p className="text-sm">
                            "{filteredStaff[0].name} is amazing! Always professional and delivers excellent results."
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">- Client Review, {format(new Date(), "MMMM d, yyyy")}</p>
                        </div>
                        <div className="border rounded-md p-3">
                          <p className="text-sm">
                            "I always request {filteredStaff[0].name} for my appointments. Consistently great service!"
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">- Loyal Client, {format(subDays(new Date(), 5), "MMMM d, yyyy")}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="border rounded-md p-3">
                          <p className="text-sm">
                            "Sarah is amazing! She always knows exactly what I want and makes me feel so comfortable."
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">- Jennifer K., March 28, 2025</p>
                        </div>
                        <div className="border rounded-md p-3">
                          <p className="text-sm">
                            "Michael is a true professional. His attention to detail is incredible."
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">- David R., March 25, 2025</p>
                        </div>
                        <div className="border rounded-md p-3">
                          <p className="text-sm">"I always leave feeling like a new person. Best stylist in town!"</p>
                          <p className="text-xs text-muted-foreground mt-2">- Amanda T., March 20, 2025</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="staff">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Staff Performance Comparison</CardTitle>
                <CardDescription>
                  {filteredStaff.length > 0
                    ? `Comparing ${filteredStaff.length} staff members`
                    : "No staff members match the current filters"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredStaff.length > 0 ? (
                  <div className="space-y-6">
                    {filteredStaff.map((staff) => {
                      // Get stable performance metrics for this staff member
                      const metrics = staffPerformanceMetrics.get(staff.id) || { revenue: 1500, appointments: 20, utilization: 70 }
                      const { revenue, appointments, utilization } = metrics

                      return (
                        <div key={staff.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${staff.color}`}>
                                <span className="text-xs font-medium">{staff.avatar}</span>
                              </div>
                              <div>
                                <p className="font-medium">{staff.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">{staff.role.replace('_', ' ')}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {metric === "all" || metric === "revenue" ? (
                                <p className="font-medium"><CurrencyDisplay amount={revenue} /></p>
                              ) : metric === "appointments" ? (
                                <p className="font-medium">{appointments} appts</p>
                              ) : (
                                <p className="font-medium">{utilization}% util</p>
                              )}
                            </div>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{
                                width: `${metric === "all" || metric === "revenue"
                                  ? (revenue / 3500) * 100
                                  : metric === "appointments"
                                    ? (appointments / 50) * 100
                                    : utilization}%`
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No staff members match the current filters. Please adjust your criteria.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

