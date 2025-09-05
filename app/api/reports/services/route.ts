import { NextResponse } from "next/server"
import { reportsRepository } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const locationId = searchParams.get("locationId")

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 })
    }

    const servicePopularity = await reportsRepository.getServicePopularity(
      new Date(startDate),
      new Date(endDate),
      locationId ? Number.parseInt(locationId) : undefined,
    )

    return NextResponse.json({ servicePopularity })
  } catch (error) {
    console.error("Error fetching service popularity report:", error)
    return NextResponse.json({ error: "Failed to fetch service popularity report" }, { status: 500 })
  }
}

