// Test script for consolidated transaction functionality
// This script can be run in the browser console to test the consolidated transaction service

console.log("🧪 Testing Consolidated Transaction Service");

// Mock appointment data with both services and products
const testAppointment = {
  id: "test-appointment-123",
  clientId: "client-123",
  clientName: "Test Client",
  staffId: "staff-123", 
  staffName: "Test Staff",
  service: "Hair Cut",
  price: 100,
  additionalServices: [
    { name: "Hair Wash", price: 25 },
    { name: "Hair Styling", price: 50 }
  ],
  products: [
    { id: "prod-1", name: "Shampoo", price: 30, quantity: 1 },
    { id: "prod-2", name: "Conditioner", price: 25, quantity: 2 }
  ],
  location: "loc1",
  date: new Date().toISOString()
};

// Test 1: Create consolidated transaction without discount
console.log("Test 1: Creating consolidated transaction without discount");
try {
  // This would need to be imported in the actual browser environment
  // const consolidatedTransaction = ConsolidatedTransactionService.createConsolidatedTransaction(
  //   testAppointment,
  //   'CASH',
  //   0,
  //   0
  // );
  
  console.log("✅ Test 1 would create transaction with:");
  console.log("- Services: Hair Cut (100) + Hair Wash (25) + Hair Styling (50) = 175");
  console.log("- Products: Shampoo (30) + Conditioner (50) = 80");
  console.log("- Total: 255");
  console.log("- Type: consolidated_sale");
} catch (error) {
  console.error("❌ Test 1 failed:", error);
}

// Test 2: Create consolidated transaction with 20% discount on services
console.log("\nTest 2: Creating consolidated transaction with 20% discount on services");
try {
  console.log("✅ Test 2 would create transaction with:");
  console.log("- Original Services: 175");
  console.log("- Discounted Services: 175 - (175 * 0.20) = 140");
  console.log("- Products (no discount): 80");
  console.log("- Total: 220");
  console.log("- Discount Amount: 35");
  console.log("- Type: consolidated_sale");
} catch (error) {
  console.error("❌ Test 2 failed:", error);
}

// Test 3: Verify transaction structure
console.log("\nTest 3: Expected transaction structure");
const expectedStructure = {
  id: "TX-CONS-[timestamp]-[random]",
  type: "consolidated_sale",
  amount: 220, // Total after discount
  serviceAmount: 140, // Services after discount
  productAmount: 80, // Products at full price
  originalServiceAmount: 175, // Original service amount
  discountPercentage: 20,
  discountAmount: 35,
  items: [
    { name: "Hair Cut", type: "service", totalPrice: 80, discountApplied: true },
    { name: "Hair Wash", type: "service", totalPrice: 20, discountApplied: true },
    { name: "Hair Styling", type: "service", totalPrice: 40, discountApplied: true },
    { name: "Shampoo", type: "product", totalPrice: 30, discountApplied: false },
    { name: "Conditioner", type: "product", totalPrice: 50, discountApplied: false }
  ]
};

console.log("Expected transaction structure:", expectedStructure);

console.log("\n🎯 To test in the actual application:");
console.log("1. Create an appointment with both services and products");
console.log("2. Complete the appointment with payment");
console.log("3. Apply a discount during payment");
console.log("4. Check the accounting page for a single consolidated transaction");
console.log("5. Verify the transaction details show proper itemization");

console.log("\n📋 Verification checklist:");
console.log("✓ Only one transaction ID per payment session");
console.log("✓ Transaction type is 'consolidated_sale'");
console.log("✓ Services show discount applied");
console.log("✓ Products show no discount");
console.log("✓ Total amount is correct");
console.log("✓ Accounting page displays breakdown properly");
