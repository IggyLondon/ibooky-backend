-- ============================================================================
-- RESERVATIONS SCHEMA - Table/Resource Bookings (Quandoo style)
-- ============================================================================
-- Tables: venues, tables, table_reservations
-- Purpose: Restaurant/venue table reservation system (PHASE 2)
-- ============================================================================
-- Status: PLACEHOLDER - To be implemented in Phase 2
-- ============================================================================

-- Venues table - Physical locations (restaurants, rooms, etc.)
CREATE TABLE IF NOT EXISTS venues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'IT',
  phone TEXT,
  email TEXT,
  capacity INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Tables/Resources - Bookable resources (tables, rooms, courts, etc.)
CREATE TABLE IF NOT EXISTS tables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venue_id INTEGER NOT NULL,
  table_number TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  min_capacity INTEGER DEFAULT 1,
  location TEXT, -- e.g., "Indoor", "Outdoor", "Patio"
  features TEXT, -- JSON: ["window_view", "wheelchair_accessible"]
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
);

-- Table Reservations - Actual bookings
CREATE TABLE IF NOT EXISTS table_reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  client_id INTEGER NOT NULL,
  venue_id INTEGER NOT NULL,
  table_id INTEGER,
  reservation_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  party_size INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show')) DEFAULT 'pending',
  special_requests TEXT,
  occasion TEXT, -- e.g., "birthday", "anniversary"
  deposit_amount REAL DEFAULT 0.0,
  deposit_status TEXT CHECK(deposit_status IN ('none', 'pending', 'paid', 'refunded')) DEFAULT 'none',
  cancellation_reason TEXT,
  cancelled_at DATETIME,
  confirmed_at DATETIME,
  seated_at DATETIME,
  completed_at DATETIME,
  reminder_sent INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
  FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_venues_tenant_id ON venues(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tables_venue_id ON tables(venue_id);
CREATE INDEX IF NOT EXISTS idx_table_reservations_tenant_id ON table_reservations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_table_reservations_client_id ON table_reservations(client_id);
CREATE INDEX IF NOT EXISTS idx_table_reservations_venue_id ON table_reservations(venue_id);
CREATE INDEX IF NOT EXISTS idx_table_reservations_date ON table_reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_table_reservations_status ON table_reservations(status);
