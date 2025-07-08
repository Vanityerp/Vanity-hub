// Populate hair services with realistic data
const fetch = require('node-fetch');

async function populateHairServices() {
  try {
    console.log('💇‍♀️ Populating Hair Services...');
    console.log('='.repeat(50));
    
    // Define realistic hair services with Qatar pricing
    const hairServices = [
      {
        name: "Women's Haircut & Blow Dry",
        description: "Professional haircut with styling and blow dry. Includes consultation to achieve your desired look.",
        duration: 60,
        price: 120,
        category: "Hair Services",
        showPrices: true,
        locations: ["loc1", "loc2", "loc3", "home"]
      },
      {
        name: "Men's Haircut",
        description: "Classic men's haircut with styling. Quick and professional service for the modern gentleman.",
        duration: 30,
        price: 60,
        category: "Hair Services", 
        showPrices: true,
        locations: ["loc1", "loc2", "loc3"]
      },
      {
        name: "Hair Wash & Blow Dry",
        description: "Refreshing hair wash with professional blow dry and styling for a polished look.",
        duration: 45,
        price: 80,
        category: "Hair Services",
        showPrices: true,
        locations: ["loc1", "loc2", "loc3", "home"]
      },
      {
        name: "Hair Coloring - Full Head",
        description: "Complete hair coloring service with premium products. Includes color consultation and aftercare advice.",
        duration: 180,
        price: 350,
        category: "Hair Services",
        showPrices: true,
        locations: ["loc1", "loc2", "loc3"]
      },
      {
        name: "Hair Highlights",
        description: "Professional highlighting service to add dimension and brightness to your hair.",
        duration: 150,
        price: 280,
        category: "Hair Services",
        showPrices: true,
        locations: ["loc1", "loc2", "loc3"]
      },
      {
        name: "Hair Balayage",
        description: "Hand-painted highlights for a natural, sun-kissed look. Perfect for low-maintenance color.",
        duration: 180,
        price: 400,
        category: "Hair Services",
        showPrices: true,
        locations: ["loc1", "loc2", "loc3"]
      },
      {
        name: "Hair Treatment - Deep Conditioning",
        description: "Intensive deep conditioning treatment to restore moisture and shine to damaged hair.",
        duration: 60,
        price: 150,
        category: "Hair Services",
        showPrices: true,
        locations: ["loc1", "loc2", "loc3", "home"]
      },
      {
        name: "Keratin Hair Treatment",
        description: "Professional keratin treatment to smooth frizz and add shine. Results last 3-4 months.",
        duration: 240,
        price: 600,
        category: "Hair Services",
        showPrices: true,
        locations: ["loc1", "loc2", "loc3"]
      },
      {
        name: "Hair Styling - Special Occasion",
        description: "Elegant hair styling for weddings, parties, and special events. Includes trial run if needed.",
        duration: 90,
        price: 200,
        category: "Hair Services",
        showPrices: true,
        locations: ["loc1", "loc2", "loc3", "home"]
      },
      {
        name: "Hair Extensions Application",
        description: "Professional application of hair extensions for length and volume. Extensions sold separately.",
        duration: 120,
        price: 300,
        category: "Hair Services",
        showPrices: true,
        locations: ["loc1", "loc2", "loc3"]
      },
      {
        name: "Scalp Treatment",
        description: "Therapeutic scalp treatment to promote healthy hair growth and relieve scalp conditions.",
        duration: 45,
        price: 120,
        category: "Hair Services",
        showPrices: true,
        locations: ["loc1", "loc2", "loc3"]
      },
      {
        name: "Hair Perm",
        description: "Professional perming service to add curl and volume to your hair. Includes styling.",
        duration: 180,
        price: 250,
        category: "Hair Services",
        showPrices: true,
        locations: ["loc1", "loc2", "loc3"]
      },
      {
        name: "Hair Straightening - Chemical",
        description: "Long-lasting chemical straightening treatment for smooth, manageable hair.",
        duration: 240,
        price: 500,
        category: "Hair Services",
        showPrices: true,
        locations: ["loc1", "loc2", "loc3"]
      },
      {
        name: "Bridal Hair Trial",
        description: "Complete hair trial for your wedding day. Includes consultation and style planning.",
        duration: 90,
        price: 180,
        category: "Hair Services",
        showPrices: true,
        locations: ["loc1", "loc2", "loc3", "home"]
      },
      {
        name: "Hair Consultation",
        description: "Professional hair consultation to discuss styling options, color choices, and hair care.",
        duration: 30,
        price: 50,
        category: "Hair Services",
        showPrices: true,
        locations: ["loc1", "loc2", "loc3", "home"]
      }
    ];
    
    console.log(`\n💇‍♀️ Creating ${hairServices.length} hair services...\n`);
    
    let createdCount = 0;
    
    for (const service of hairServices) {
      try {
        const response = await fetch('http://localhost:3000/api/services', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(service)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`   ✅ ${service.name}`);
          console.log(`      Price: ${service.price} QAR | Duration: ${service.duration} min`);
          createdCount++;
        } else {
          const errorData = await response.json();
          console.log(`   ❌ Failed: ${service.name} - ${errorData.error || response.statusText}`);
        }
      } catch (error) {
        console.log(`   ❌ Error creating ${service.name}:`, error.message);
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 Hair Services Creation Results:`);
    console.log(`   Services created: ${createdCount}/${hairServices.length}`);
    
    if (createdCount === hairServices.length) {
      console.log('\n✅ SUCCESS: All hair services created successfully!');
    } else {
      console.log('\n⚠️ WARNING: Some hair services may not have been created');
    }
    
    console.log('\n🎯 Next: Create nail services');
    
  } catch (error) {
    console.error('❌ Hair services creation failed:', error);
  }
}

populateHairServices();
