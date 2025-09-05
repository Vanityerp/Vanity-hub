async function testLocationsAPI() {
  try {
    console.log("🔄 Testing locations API...")
    
    // Test the API endpoint directly
    const response = await fetch('http://localhost:3000/api/locations')
    
    if (!response.ok) {
      console.error(`❌ API request failed: ${response.status} ${response.statusText}`)
      return
    }
    
    const data = await response.json()
    const locations = data.locations || []
    
    console.log(`✅ API returned ${locations.length} locations`)
    
    if (locations.length > 0) {
      console.log("\n📍 Locations from API:")
      locations.forEach((location: any, index: number) => {
        console.log(`  ${index + 1}. ${location.name} (${location.id})`)
        console.log(`     Address: ${location.address}, ${location.city}`)
        console.log(`     Active: ${location.isActive}`)
        console.log("")
      })
    } else {
      console.log("❌ No locations returned from API!")
      console.log("💡 This might be due to user access filtering.")
    }
    
  } catch (error) {
    console.error("❌ Error testing locations API:", error)
  }
}

testLocationsAPI()
