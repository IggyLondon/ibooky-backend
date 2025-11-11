/**
 * Database Initialization Script
 * Run this to initialize the database schema and seed data
 */

import { initializeSchema, runSeeds, saveDatabase } from '../config/database.js';

console.log('🚀 Starting database initialization...\n');

async function init() {
  try {
    // Initialize schema
    await initializeSchema();
  
  // Run seeds
  await runSeeds();
  
  // Save database to disk
  await saveDatabase();
  console.log('💾 Database saved to disk');
  
  console.log('\n✅ Database initialization completed successfully!');
  console.log('📊 You can now start the server with: npm start\n');
  
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error);
    process.exit(1);
  }
}

init();
