// Create realistic beauty salon service categories
const fetch = require('node-fetch');

async function createServiceCategories() {
  try {
    console.log('🏗️ Creating Realistic Beauty Salon Service Categories...');
    console.log('='.repeat(60));
    
    // Define realistic beauty salon categories
    const categories = [
      {
        name: "Hair Services",
        description: "Professional hair cutting, styling, coloring, and treatment services for all hair types"
      },
      {
        name: "Nail Services", 
        description: "Complete nail care including manicures, pedicures, nail art, and nail treatments"
      },
      {
        name: "Facial Treatments",
        description: "Skincare and facial treatments for all skin types including deep cleansing, anti-aging, and specialized treatments"
      },
      {
        name: "Massage Therapy",
        description: "Relaxing and therapeutic massage services for wellness and stress relief"
      },
      {
        name: "Waxing Services",
        description: "Professional hair removal services using high-quality wax for smooth, long-lasting results"
      },
      {
        name: "Eyebrow & Lash Services",
        description: "Eyebrow shaping, tinting, lash extensions, and lash treatments for enhanced natural beauty"
      },
      {
        name: "Makeup Services",
        description: "Professional makeup application for special occasions, events, and everyday looks"
      },
      {
        name: "Body Treatments",
        description: "Luxurious body treatments including scrubs, wraps, and moisturizing treatments"
      },
      {
        name: "Bridal Packages",
        description: "Complete bridal beauty packages for your special day including hair, makeup, and skincare"
      },
      {
        name: "Men's Grooming",
        description: "Specialized grooming services designed specifically for men including haircuts, beard care, and skincare"
      }
    ];
    
    console.log(`\n📂 Creating ${categories.length} service categories...\n`);
    
    let createdCount = 0;
    const createdCategories = [];
    
    for (const category of categories) {
      try {
        const response = await fetch('http://localhost:3000/api/service-categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(category)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`   ✅ Created: ${category.name}`);
          console.log(`      ID: ${result.category.id}`);
          console.log(`      Description: ${category.description}`);
          console.log('');
          
          createdCategories.push(result.category);
          createdCount++;
        } else {
          const errorData = await response.json();
          console.log(`   ❌ Failed to create ${category.name}: ${errorData.error || response.statusText}`);
        }
      } catch (error) {
        console.log(`   ❌ Error creating ${category.name}:`, error.message);
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Verify creation
    console.log('\n🔍 Verifying category creation...');
    const categoriesResponse = await fetch('http://localhost:3000/api/service-categories');
    const categoriesData = await categoriesResponse.json();
    
    console.log(`\n📊 Category Creation Results:`);
    console.log(`   Categories created: ${createdCount}/${categories.length}`);
    console.log(`   Total categories in system: ${categoriesData.categories.length}`);
    
    if (createdCount === categories.length) {
      console.log('\n✅ SUCCESS: All service categories created successfully!');
      
      console.log('\n📂 Created Categories:');
      categoriesData.categories.forEach((category, index) => {
        console.log(`   ${index + 1}. ${category.name} (${category.id})`);
        console.log(`      ${category.description}`);
        console.log('');
      });
      
      // Save category data for service creation
      require('fs').writeFileSync('created-categories.json', JSON.stringify(createdCategories, null, 2));
      console.log('💾 Category data saved to created-categories.json');
      
    } else {
      console.log('\n⚠️ WARNING: Some categories may not have been created successfully');
    }
    
    console.log('\n🎯 Next Step: Populate each category with realistic services');
    
  } catch (error) {
    console.error('❌ Category creation failed:', error);
  }
}

createServiceCategories();
