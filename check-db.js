const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
console.log('📁 Database path:', dbPath);

try {
  const db = new Database(dbPath);
  console.log('✅ SQLite database connected successfully');

  // Check what tables exist
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('📋 Tables in database:', tables.map(t => t.name));

  // Check if specific tables exist and their structure
  const expectedTables = ['services', 'locations', 'staff_members', 'products'];

  for (const tableName of expectedTables) {
    try {
      const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all();
      if (tableInfo.length > 0) {
        console.log(`✅ Table ${tableName} exists with columns:`, tableInfo.map(col => col.name));

        // Count records
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
        console.log(`📊 ${tableName} has ${count.count} records`);

        // Show sample data
        if (count.count > 0) {
          const sample = db.prepare(`SELECT * FROM ${tableName} LIMIT 3`).all();
          console.log(`📋 Sample ${tableName} data:`, sample);
        }
      } else {
        console.log(`❌ Table ${tableName} does not exist`);
      }
    } catch (error) {
      console.log(`❌ Error checking table ${tableName}:`, error.message);
    }
  }

  db.close();
} catch (error) {
  console.error('❌ Failed to connect to SQLite database:', error);
}
