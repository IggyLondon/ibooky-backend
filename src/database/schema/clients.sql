-- ============================================================================
-- CLIENTS SCHEMA - Customer Management
-- ============================================================================
-- Tables: clients, client_notes
-- Purpose: Shared client management across all booking types
-- ============================================================================

-- Clients table - Customer information
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK(gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'IT',
  notes TEXT,
  preferences TEXT DEFAULT '{}', -- JSON field for client preferences
  marketing_consent INTEGER DEFAULT 0,
  sms_consent INTEGER DEFAULT 0,
  email_consent INTEGER DEFAULT 0,
  tags TEXT, -- Comma-separated tags
  total_bookings INTEGER DEFAULT 0,
  total_spent REAL DEFAULT 0.0,
  last_booking_date DATETIME,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Client notes table - Internal notes about clients
CREATE TABLE IF NOT EXISTS client_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  note TEXT NOT NULL,
  is_important INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_last_booking ON clients(last_booking_date);
CREATE INDEX IF NOT EXISTS idx_client_notes_client_id ON client_notes(client_id);
