import { NextResponse } from "next/server"
import { clientsRepository } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = Number.parseInt(params.id)
    
    if (isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 })
    }
    
    const client = await clientsRepository.findById(clientId)
    
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }
    
    // Get client locations
    const { query } = await import("@/lib/db")
    
    const locationsResult = await query(
      `SELECT l.* FROM locations l
       JOIN client_locations cl ON l.id = cl.location_id
       WHERE cl.client_id = $1`,
      [clientId]
    )
    
    // Get client preferences
    const preferencesResult = await query(
      `SELECT preferences FROM client_preferences WHERE client_id = $1`,
      [clientId]
    )
    
    const clientData = {
      ...client,
      locations: locationsResult.rows,
      preferences: preferencesResult.rows.length > 0 ? preferencesResult.rows[0].preferences : null
    }
    
    return NextResponse.json({ client: clientData })
  } catch (error) {
    console.error("Error fetching client:", error)
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = Number.parseInt(params.id)
    
    if (isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 })
    }
    
    const data = await request.json()
    
    // Check if client exists
    const existingClient = await clientsRepository.findById(clientId)
    
    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }
    
    // Update client basic info
    const { query } = await import("@/lib/db")
    
    await query(
      `UPDATE clients 
       SET name = $1, 
           email = $2, 
           phone = $3, 
           address = $4, 
           notes = $5, 
           preferred_location_id = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7`,
      [
        data.name || existingClient.name,
        data.email || existingClient.email,
        data.phone || existingClient.phone,
        data.address || existingClient.address,
        data.notes || existingClient.notes,
        data.preferredLocationId || existingClient.preferred_location_id,
        clientId
      ]
    )
    
    // Update client locations if provided
    if (data.locations && Array.isArray(data.locations)) {
      // Remove existing locations
      await query(
        `DELETE FROM client_locations WHERE client_id = $1`,
        [clientId]
      )
      
      // Add new locations
      for (const locationId of data.locations) {
        await query(
          `INSERT INTO client_locations (client_id, location_id) 
           VALUES ($1, $2)`,
          [clientId, Number.parseInt(locationId)]
        )
      }
    }
    
    // Update client preferences if provided
    if (data.preferences) {
      // Check if preferences exist
      const preferencesResult = await query(
        `SELECT id FROM client_preferences WHERE client_id = $1`,
        [clientId]
      )
      
      if (preferencesResult.rows.length > 0) {
        // Update existing preferences
        await query(
          `UPDATE client_preferences 
           SET preferences = $1, 
               updated_at = CURRENT_TIMESTAMP
           WHERE client_id = $2`,
          [JSON.stringify(data.preferences), clientId]
        )
      } else {
        // Insert new preferences
        await query(
          `INSERT INTO client_preferences (client_id, preferences) 
           VALUES ($1, $2)`,
          [clientId, JSON.stringify(data.preferences)]
        )
      }
    }
    
    // Get updated client data
    const updatedClient = await clientsRepository.findById(clientId)
    
    return NextResponse.json({ client: updatedClient })
  } catch (error) {
    console.error("Error updating client:", error)
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = Number.parseInt(params.id)
    
    if (isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 })
    }
    
    // Check if client exists
    const existingClient = await clientsRepository.findById(clientId)
    
    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }
    
    const { query } = await import("@/lib/db")
    
    // Delete client preferences
    await query(
      `DELETE FROM client_preferences WHERE client_id = $1`,
      [clientId]
    )
    
    // Delete client locations
    await query(
      `DELETE FROM client_locations WHERE client_id = $1`,
      [clientId]
    )
    
    // Delete client appointments
    await query(
      `DELETE FROM appointments WHERE client_id = $1`,
      [clientId]
    )
    
    // Delete client
    await query(
      `DELETE FROM clients WHERE id = $1`,
      [clientId]
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting client:", error)
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 })
  }
}
