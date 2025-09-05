#!/usr/bin/env node

/**
 * Test script to verify the unified branding system implementation
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Unified Branding System Implementation...\n');

// Test 1: Check if Logo component exists
function testLogoComponent() {
  console.log('1. Testing Logo Component...');
  const logoPath = path.join(__dirname, '../components/ui/logo.tsx');
  
  if (fs.existsSync(logoPath)) {
    const logoContent = fs.readFileSync(logoPath, 'utf8');
    
    // Check for key features
    const hasSettingsImport = logoContent.includes('SettingsStorage');
    const hasLogoProps = logoContent.includes('interface LogoProps');
    const hasSizeVariants = logoContent.includes('size?: "sm" | "md" | "lg"');
    const hasConvenienceComponents = logoContent.includes('DashboardLogo');
    const hasFallbackLogic = logoContent.includes('branding.companyLogo ?');
    
    console.log(`  ✅ Logo component exists`);
    console.log(`  ${hasSettingsImport ? '✅' : '❌'} Imports SettingsStorage`);
    console.log(`  ${hasLogoProps ? '✅' : '❌'} Has LogoProps interface`);
    console.log(`  ${hasSizeVariants ? '✅' : '❌'} Has size variants`);
    console.log(`  ${hasConvenienceComponents ? '✅' : '❌'} Has convenience components`);
    console.log(`  ${hasFallbackLogic ? '✅' : '❌'} Has fallback logic`);
    
    return hasSettingsImport && hasLogoProps && hasSizeVariants && hasConvenienceComponents && hasFallbackLogic;
  } else {
    console.log('  ❌ Logo component not found');
    return false;
  }
}

// Test 2: Check if BrandingSettings component exists
function testBrandingSettingsComponent() {
  console.log('\n2. Testing BrandingSettings Component...');
  const brandingPath = path.join(__dirname, '../components/settings/branding-settings.tsx');
  
  if (fs.existsSync(brandingPath)) {
    const brandingContent = fs.readFileSync(brandingPath, 'utf8');
    
    // Check for key features
    const hasFileUpload = brandingContent.includes('handleFileUpload');
    const hasColorPicker = brandingContent.includes('type="color"');
    const hasPreview = brandingContent.includes('Preview');
    const hasValidation = brandingContent.includes('allowedTypes');
    const hasLogoPreview = brandingContent.includes('<Logo');
    
    console.log(`  ✅ BrandingSettings component exists`);
    console.log(`  ${hasFileUpload ? '✅' : '❌'} Has file upload functionality`);
    console.log(`  ${hasColorPicker ? '✅' : '❌'} Has color picker`);
    console.log(`  ${hasPreview ? '✅' : '❌'} Has preview section`);
    console.log(`  ${hasValidation ? '✅' : '❌'} Has file validation`);
    console.log(`  ${hasLogoPreview ? '✅' : '❌'} Has logo preview`);
    
    return hasFileUpload && hasColorPicker && hasPreview && hasValidation && hasLogoPreview;
  } else {
    console.log('  ❌ BrandingSettings component not found');
    return false;
  }
}

// Test 3: Check if settings storage has branding interface
function testSettingsStorage() {
  console.log('\n3. Testing Settings Storage...');
  const settingsPath = path.join(__dirname, '../lib/settings-storage.ts');
  
  if (fs.existsSync(settingsPath)) {
    const settingsContent = fs.readFileSync(settingsPath, 'utf8');
    
    // Check for key features
    const hasBrandingInterface = settingsContent.includes('interface BrandingSettings');
    const hasBrandingInGeneral = settingsContent.includes('branding: BrandingSettings');
    const hasBrandingDefaults = settingsContent.includes('companyLogo: null');
    const hasCompanyName = settingsContent.includes('companyName:');
    const hasPrimaryColor = settingsContent.includes('primaryBrandColor:');
    
    console.log(`  ✅ Settings storage exists`);
    console.log(`  ${hasBrandingInterface ? '✅' : '❌'} Has BrandingSettings interface`);
    console.log(`  ${hasBrandingInGeneral ? '✅' : '❌'} Branding added to GeneralSettings`);
    console.log(`  ${hasBrandingDefaults ? '✅' : '❌'} Has branding defaults`);
    console.log(`  ${hasCompanyName ? '✅' : '❌'} Has company name field`);
    console.log(`  ${hasPrimaryColor ? '✅' : '❌'} Has primary color field`);
    
    return hasBrandingInterface && hasBrandingInGeneral && hasBrandingDefaults && hasCompanyName && hasPrimaryColor;
  } else {
    console.log('  ❌ Settings storage not found');
    return false;
  }
}

// Test 4: Check if settings page includes branding tab
function testSettingsPage() {
  console.log('\n4. Testing Settings Page Integration...');
  const settingsPagePath = path.join(__dirname, '../app/dashboard/settings/page.tsx');
  
  if (fs.existsSync(settingsPagePath)) {
    const settingsPageContent = fs.readFileSync(settingsPagePath, 'utf8');
    
    // Check for key features
    const hasBrandingImport = settingsPageContent.includes('BrandingSettings');
    const hasBrandingTab = settingsPageContent.includes('value="branding"');
    const hasBrandingTabContent = settingsPageContent.includes('<BrandingSettings />');
    
    console.log(`  ✅ Settings page exists`);
    console.log(`  ${hasBrandingImport ? '✅' : '❌'} Imports BrandingSettings`);
    console.log(`  ${hasBrandingTab ? '✅' : '❌'} Has branding tab`);
    console.log(`  ${hasBrandingTabContent ? '✅' : '❌'} Has branding tab content`);
    
    return hasBrandingImport && hasBrandingTab && hasBrandingTabContent;
  } else {
    console.log('  ❌ Settings page not found');
    return false;
  }
}

// Test 5: Check if hardcoded logos have been replaced
function testLogoReplacements() {
  console.log('\n5. Testing Logo Replacements...');
  
  const filesToCheck = [
    '../app/dashboard/layout.tsx',
    '../app/login/page.tsx',
    '../app/booking/page.tsx',
    '../components/client-portal/client-portal-header.tsx',
    '../app/client-portal/layout.tsx'
  ];
  
  let replacementCount = 0;
  let totalFiles = 0;
  
  filesToCheck.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      totalFiles++;
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check if file uses new Logo components
      const usesLogoComponent = content.includes('Logo') && 
                               (content.includes('DashboardLogo') || 
                                content.includes('ClientPortalLogo') || 
                                content.includes('LoginLogo') || 
                                content.includes('FooterLogo') ||
                                content.includes('<Logo'));
      
      // Check if old hardcoded logos are removed
      const hasOldLogo = content.includes('https://hebbkx1anhila5yf.public.blob.vercel-storage.com') ||
                        (content.includes('SalonHub') && !content.includes('Logo'));
      
      const fileName = path.basename(filePath);
      if (usesLogoComponent && !hasOldLogo) {
        console.log(`  ✅ ${fileName} - Updated to use Logo component`);
        replacementCount++;
      } else if (usesLogoComponent && hasOldLogo) {
        console.log(`  ⚠️  ${fileName} - Partially updated (still has old logo)`);
      } else {
        console.log(`  ❌ ${fileName} - Not updated`);
      }
    }
  });
  
  console.log(`  📊 ${replacementCount}/${totalFiles} files successfully updated`);
  return replacementCount === totalFiles;
}

// Run all tests
async function runAllTests() {
  const results = [
    testLogoComponent(),
    testBrandingSettingsComponent(),
    testSettingsStorage(),
    testSettingsPage(),
    testLogoReplacements()
  ];
  
  const passedTests = results.filter(result => result).length;
  const totalTests = results.length;
  
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Unified branding system is properly implemented.');
    console.log('\n📋 Implementation Summary:');
    console.log('  ✅ Centralized Logo component created');
    console.log('  ✅ Branding settings interface added');
    console.log('  ✅ Settings page updated with branding tab');
    console.log('  ✅ All hardcoded logos replaced');
    console.log('  ✅ Fallback logic implemented');
    console.log('\n🚀 Next Steps:');
    console.log('  1. Test the branding settings in the browser');
    console.log('  2. Upload a custom logo to verify functionality');
    console.log('  3. Test logo consistency across all pages');
    console.log('  4. Verify responsive design on different screen sizes');
    
    return true;
  } else {
    console.log('\n❌ Some tests failed. Please review the implementation.');
    return false;
  }
}

// Execute tests
runAllTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
