-- ============================================================================
-- DEMO SEED DATA
-- ============================================================================
-- Purpose: Create demo tenant, user, clients, services, providers, and bookings
-- Usage: For development and testing only
-- ============================================================================

-- Demo Tenant
INSERT OR IGNORE INTO tenants (
  id, slug, business_name, business_type, email, phone,
  city, country, timezone, currency, description, is_active
) VALUES (
  1,
  'demo-salon',
  'Bella Vista Beauty Salon',
  'appointments',
  'info@bellavista.it',
  '+39 02 1234567',
  'Milano',
  'IT',
  'Europe/Rome',
  'EUR',
  'Premier beauty salon in Milan offering haircuts, styling, and spa services',
  1
);

-- Demo Admin User
INSERT OR IGNORE INTO users (
  id, tenant_id, email, password_hash, first_name, last_name, role, phone, is_active
) VALUES (
  1,
  1,
  'admin@bellavista.it',
  '$2a$10$rKZLvVZQZ9xQZ9xQZ9xQZO', -- Password: "demo123" (hashed with bcrypt)
  'Maria',
  'Rossi',
  'admin',
  '+39 333 1234567',
  1
);

-- Demo Clients
INSERT OR IGNORE INTO clients (
  id, tenant_id, first_name, last_name, email, phone,
  city, country, marketing_consent, is_active
) VALUES
  (1, 1, 'Giulia', 'Bianchi', 'giulia.bianchi@email.it', '+39 333 1111111', 'Milano', 'IT', 1, 1),
  (2, 1, 'Marco', 'Verdi', 'marco.verdi@email.it', '+39 333 2222222', 'Milano', 'IT', 1, 1),
  (3, 1, 'Sofia', 'Romano', 'sofia.romano@email.it', '+39 333 3333333', 'Milano', 'IT', 0, 1),
  (4, 1, 'Luca', 'Ferrari', 'luca.ferrari@email.it', '+39 333 4444444', 'Milano', 'IT', 1, 1);

-- Demo Services
INSERT OR IGNORE INTO services (
  id, tenant_id, name, description, duration_minutes, price,
  category, buffer_after_minutes, is_active, online_booking_enabled
) VALUES
  (1, 1, 'Taglio Donna', 'Taglio e styling professionale per donna', 45, 35.00, 'Hair', 15, 1, 1),
  (2, 1, 'Taglio Uomo', 'Taglio e styling professionale per uomo', 30, 25.00, 'Hair', 10, 1, 1),
  (3, 1, 'Colore Completo', 'Colorazione completa con prodotti premium', 120, 80.00, 'Hair', 15, 1, 1),
  (4, 1, 'Piega', 'Piega professionale con styling', 30, 20.00, 'Hair', 10, 1, 1),
  (5, 1, 'Manicure', 'Manicure completa con smalto', 45, 30.00, 'Nails', 10, 1, 1),
  (6, 1, 'Pedicure', 'Pedicure completa con smalto', 60, 40.00, 'Nails', 10, 1, 1),
  (7, 1, 'Massaggio Rilassante', 'Massaggio rilassante 60 minuti', 60, 60.00, 'Spa', 15, 1, 1);

-- Demo Providers
INSERT OR IGNORE INTO providers (
  id, tenant_id, user_id, first_name, last_name, email, phone,
  title, bio, color, is_active
) VALUES
  (1, 1, NULL, 'Elena', 'Martini', 'elena@bellavista.it', '+39 333 5555555',
   'Senior Hair Stylist', 'Specializzata in tagli e colorazioni con 15 anni di esperienza',
   '#FF6B9D', 1),
  (2, 1, NULL, 'Alessandro', 'Costa', 'alessandro@bellavista.it', '+39 333 6666666',
   'Barber & Stylist', 'Esperto in tagli maschili e barba',
   '#4A90E2', 1),
  (3, 1, NULL, 'Francesca', 'Lombardi', 'francesca@bellavista.it', '+39 333 7777777',
   'Nail Technician', 'Specializzata in nail art e trattamenti unghie',
   '#9B59B6', 1);

-- Link Providers to Services
INSERT OR IGNORE INTO provider_services (provider_id, service_id) VALUES
  -- Elena: Hair services
  (1, 1), (1, 3), (1, 4),
  -- Alessandro: Men's hair
  (2, 2), (2, 4),
  -- Francesca: Nails
  (3, 5), (3, 6);

-- Provider Availability (Monday to Saturday, 9:00-18:00)
INSERT OR IGNORE INTO provider_availability (provider_id, day_of_week, start_time, end_time, is_available) VALUES
  -- Elena (Mon-Sat)
  (1, 1, '09:00', '18:00', 1),
  (1, 2, '09:00', '18:00', 1),
  (1, 3, '09:00', '18:00', 1),
  (1, 4, '09:00', '18:00', 1),
  (1, 5, '09:00', '18:00', 1),
  (1, 6, '09:00', '17:00', 1),
  -- Alessandro (Mon-Sat)
  (2, 1, '09:00', '18:00', 1),
  (2, 2, '09:00', '18:00', 1),
  (2, 3, '09:00', '18:00', 1),
  (2, 4, '09:00', '18:00', 1),
  (2, 5, '09:00', '18:00', 1),
  (2, 6, '09:00', '17:00', 1),
  -- Francesca (Tue-Sat)
  (3, 2, '10:00', '18:00', 1),
  (3, 3, '10:00', '18:00', 1),
  (3, 4, '10:00', '18:00', 1),
  (3, 5, '10:00', '18:00', 1),
  (3, 6, '10:00', '17:00', 1);

-- Demo Bookings (upcoming appointments)
INSERT OR IGNORE INTO bookings (
  id, tenant_id, client_id, provider_id, booking_date, start_time, end_time,
  status, total_price, payment_status, notes
) VALUES
  (1, 1, 1, 1, date('now', '+1 day'), '10:00', '10:45', 'confirmed', 35.00, 'unpaid', 'Cliente abituale'),
  (2, 1, 2, 2, date('now', '+1 day'), '14:00', '14:30', 'confirmed', 25.00, 'paid', NULL),
  (3, 1, 3, 3, date('now', '+2 days'), '11:00', '11:45', 'pending', 30.00, 'unpaid', 'Prima volta'),
  (4, 1, 4, 1, date('now', '+3 days'), '15:00', '17:00', 'confirmed', 80.00, 'unpaid', 'Colore completo');

-- Link Bookings to Services
INSERT OR IGNORE INTO booking_services (booking_id, service_id, service_name, duration_minutes, price) VALUES
  (1, 1, 'Taglio Donna', 45, 35.00),
  (2, 2, 'Taglio Uomo', 30, 25.00),
  (3, 5, 'Manicure', 45, 30.00),
  (4, 3, 'Colore Completo', 120, 80.00);
