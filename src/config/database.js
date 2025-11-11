import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database file location
const DB_PATH = process.env.DATABASE_PATH || join(__dirname, '../../data/ibooky.db');

// Ensure data directory exists
const dataDir = dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize SQL.js
let SQL = null;
let db = null;

/**
 * Initialize SQL.js library
 */
async function initSQL() {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return SQL;
}

/**
 * Get database instance (singleton pattern)
 * @returns {Database} SQLite database instance
 */
export async function getDatabase() {
  if (!db) {
    await initSQL();
    
    // Load existing database or create new one
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
      console.log(`✅ Database loaded: ${DB_PATH}`);
    } else {
      db = new SQL.Database();
      console.log(`✅ Database created: ${DB_PATH}`);
    }
    
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
  }
  
  return db;
}

/**
 * Save database to disk
 */
export async function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

/**
 * Initialize database schema from SQL files
 */
export async function initializeSchema() {
  const database = await getDatabase();
  const schemaDir = join(__dirname, '../database/schema');
  
  // Order matters: core → clients → appointments → reservations
  const schemaFiles = [
    'core.sql',
    'clients.sql',
    'appointments.sql',
    'reservations.sql'
  ];
  
  console.log('📦 Initializing database schema...');
  
  schemaFiles.forEach(file => {
    const filePath = join(schemaDir, file);
    if (fs.existsSync(filePath)) {
      const sql = fs.readFileSync(filePath, 'utf8');
      database.exec(sql);
      console.log(`  ✓ ${file} executed`);
    }
  });
  
  // Save to disk
  await saveDatabase();
  
  console.log('✅ Database schema initialized');
}

/**
 * Run database seeds
 */
export async function runSeeds() {
  const database = await getDatabase();
  const seedsDir = join(__dirname, '../database/seeds');
  
  // Check if seeds should run (only in development or if explicitly requested)
  if (process.env.NODE_ENV === 'production' && !process.env.RUN_SEEDS) {
    console.log('⏭️  Skipping seeds in production');
    return;
  }
  
  console.log('🌱 Running database seeds...');
  
  const seedFiles = fs.readdirSync(seedsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  seedFiles.forEach(file => {
    const filePath = join(seedsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    try {
      database.exec(sql);
      console.log(`  ✓ ${file} executed`);
    } catch (error) {
      console.error(`  ✗ ${file} failed:`, error.message);
    }
  });
  
  // Save to disk
  await saveDatabase();
  
  console.log('✅ Database seeds completed');
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  if (db) {
    await saveDatabase();
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

/**
 * Execute a query with parameters
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Array} Query result
 */
export async function query(sql, params = []) {
  const database = await getDatabase();
  const stmt = database.prepare(sql);
  stmt.bind(params);
  
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  
  return results;
}

/**
 * Execute a single row query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Object|null} Single row or null
 */
export async function queryOne(sql, params = []) {
  const results = await query(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Execute an insert/update/delete query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Object} Result with lastInsertRowid and changes
 */
export async function execute(sql, params = []) {
  const database = await getDatabase();
  database.run(sql, params);
  
  // Get last insert ID and changes
  const lastId = database.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] || 0;
  const changes = database.getRowsModified();
  
  // Save to disk after write operations
  await saveDatabase();
  
  return {
    lastInsertRowid: lastId,
    changes
  };
}

/**
 * Execute multiple queries in a transaction
 * @param {Function} callback - Function containing database operations
 * @returns {*} Result of the transaction
 */
export async function transaction(callback) {
  const database = await getDatabase();
  
  try {
    database.run('BEGIN TRANSACTION');
    const result = await callback();
    database.run('COMMIT');
    await saveDatabase();
    return result;
  } catch (error) {
    database.run('ROLLBACK');
    throw error;
  }
}

export default {
  getDatabase,
  initializeSchema,
  runSeeds,
  closeDatabase,
  saveDatabase,
  query,
  queryOne,
  execute,
  transaction
};
