async function createBasicStaff() {
  try {
    console.log("🔄 Creating basic staff members...")
    
    // Basic staff data
    const staffMembers = [
      {
        name: "Sarah Johnson",
        email: "sarah@vanityhub.com",
        phone: "(974) 123-4567",
        role: "stylist",
        locations: ["loc1", "loc2"], // D-ring road and Muaither
        status: "Active",
        homeService: false
      },
      {
        name: "Ahmed Al-Rashid",
        email: "ahmed@vanityhub.com", 
        phone: "(974) 234-5678",
        role: "barber",
        locations: ["loc1", "loc3"], // D-ring road and Medinat Khalifa
        status: "Active",
        homeService: false
      },
      {
        name: "Maria Santos",
        email: "maria@vanityhub.com",
        phone: "(974) 345-6789", 
        role: "nail_technician",
        locations: ["loc2", "loc3"], // Muaither and Medinat Khalifa
        status: "Active",
        homeService: true
      }
    ]
    
    for (const staff of staffMembers) {
      try {
        console.log(`📝 Creating staff member: ${staff.name}`)
        
        const response = await fetch('http://localhost:3000/api/staff', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(staff)
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log(`✅ Created staff member: ${staff.name}`)
        } else {
          const error = await response.text()
          console.error(`❌ Failed to create ${staff.name}:`, error)
        }
      } catch (error) {
        console.error(`❌ Error creating ${staff.name}:`, error)
      }
    }
    
    console.log("✅ Finished creating basic staff members")
    
  } catch (error) {
    console.error("❌ Error in createBasicStaff:", error)
  }
}

createBasicStaff()
