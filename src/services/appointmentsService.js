/**
 * Service Layer - Appointments
 * Business logic for appointment booking system
 */

import { query, queryOne, execute, transaction } from '../config/database.js';

// ============================================================================
// SERVICES
// ============================================================================

export function getAllServices(tenantId) {
  return query(
    'SELECT * FROM services WHERE tenant_id = ? AND is_active = 1 ORDER BY sort_order, name',
    [tenantId]
  );
}

export function getServiceById(serviceId, tenantId) {
  return queryOne(
    'SELECT * FROM services WHERE id = ? AND tenant_id = ?',
    [serviceId, tenantId]
  );
}

export function createService(tenantId, serviceData) {
  const {
    name, description, duration_minutes, price, currency,
    buffer_before_minutes, buffer_after_minutes, category,
    image_url, max_capacity, requires_approval, online_booking_enabled
  } = serviceData;

  const result = execute(
    `INSERT INTO services (
      tenant_id, name, description, duration_minutes, price, currency,
      buffer_before_minutes, buffer_after_minutes, category, image_url,
      max_capacity, requires_approval, online_booking_enabled
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tenantId, name, description, duration_minutes, price, currency || 'EUR',
      buffer_before_minutes || 0, buffer_after_minutes || 0, category, image_url,
      max_capacity || 1, requires_approval || 0, online_booking_enabled !== false ? 1 : 0
    ]
  );

  return getServiceById(result.lastInsertRowid, tenantId);
}

export function updateService(serviceId, tenantId, updates) {
  const allowedFields = [
    'name', 'description', 'duration_minutes', 'price', 'currency',
    'buffer_before_minutes', 'buffer_after_minutes', 'category', 'image_url',
    'is_active', 'max_capacity', 'requires_approval', 'online_booking_enabled', 'sort_order'
  ];

  const setClauses = [];
  const values = [];

  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      setClauses.push(`${key} = ?`);
      values.push(updates[key]);
    }
  });

  if (setClauses.length === 0) {
    throw new Error('No valid fields to update');
  }

  setClauses.push('updated_at = CURRENT_TIMESTAMP');
  values.push(serviceId, tenantId);

  execute(
    `UPDATE services SET ${setClauses.join(', ')} WHERE id = ? AND tenant_id = ?`,
    values
  );

  return getServiceById(serviceId, tenantId);
}

export function deleteService(serviceId, tenantId) {
  return execute(
    'UPDATE services SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?',
    [serviceId, tenantId]
  );
}

// ============================================================================
// PROVIDERS
// ============================================================================

export function getAllProviders(tenantId) {
  return query(
    'SELECT * FROM providers WHERE tenant_id = ? AND is_active = 1 ORDER BY sort_order, first_name',
    [tenantId]
  );
}

export function getProviderById(providerId, tenantId) {
  return queryOne(
    'SELECT * FROM providers WHERE id = ? AND tenant_id = ?',
    [providerId, tenantId]
  );
}

export function createProvider(tenantId, providerData) {
  const {
    user_id, first_name, last_name, email, phone,
    title, bio, image_url, color
  } = providerData;

  const result = execute(
    `INSERT INTO providers (
      tenant_id, user_id, first_name, last_name, email, phone,
      title, bio, image_url, color
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tenantId, user_id, first_name, last_name, email, phone,
      title, bio, image_url, color || '#3B82F6'
    ]
  );

  return getProviderById(result.lastInsertRowid, tenantId);
}

export function updateProvider(providerId, tenantId, updates) {
  const allowedFields = [
    'first_name', 'last_name', 'email', 'phone', 'title',
    'bio', 'image_url', 'color', 'is_active', 'sort_order'
  ];

  const setClauses = [];
  const values = [];

  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      setClauses.push(`${key} = ?`);
      values.push(updates[key]);
    }
  });

  if (setClauses.length === 0) {
    throw new Error('No valid fields to update');
  }

  setClauses.push('updated_at = CURRENT_TIMESTAMP');
  values.push(providerId, tenantId);

  execute(
    `UPDATE providers SET ${setClauses.join(', ')} WHERE id = ? AND tenant_id = ?`,
    values
  );

  return getProviderById(providerId, tenantId);
}

export function deleteProvider(providerId, tenantId) {
  return execute(
    'UPDATE providers SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?',
    [providerId, tenantId]
  );
}

// Provider Services
export function getProviderServices(providerId) {
  return query(
    `SELECT ps.*, s.name, s.description, s.duration_minutes, s.price
     FROM provider_services ps
     JOIN services s ON ps.service_id = s.id
     WHERE ps.provider_id = ?`,
    [providerId]
  );
}

export function assignServiceToProvider(providerId, serviceId, customPrice = null, customDuration = null) {
  return execute(
    `INSERT OR IGNORE INTO provider_services (provider_id, service_id, custom_price, custom_duration_minutes)
     VALUES (?, ?, ?, ?)`,
    [providerId, serviceId, customPrice, customDuration]
  );
}

export function removeServiceFromProvider(providerId, serviceId) {
  return execute(
    'DELETE FROM provider_services WHERE provider_id = ? AND service_id = ?',
    [providerId, serviceId]
  );
}

// Provider Availability
export function getProviderAvailability(providerId) {
  return query(
    'SELECT * FROM provider_availability WHERE provider_id = ? ORDER BY day_of_week, start_time',
    [providerId]
  );
}

export function setProviderAvailability(providerId, availabilityData) {
  return transaction(() => {
    // Delete existing availability
    execute('DELETE FROM provider_availability WHERE provider_id = ?', [providerId]);

    // Insert new availability
    availabilityData.forEach(slot => {
      execute(
        `INSERT INTO provider_availability (provider_id, day_of_week, start_time, end_time, is_available)
         VALUES (?, ?, ?, ?, ?)`,
        [providerId, slot.day_of_week, slot.start_time, slot.end_time, slot.is_available !== false ? 1 : 0]
      );
    });

    return getProviderAvailability(providerId);
  });
}

// ============================================================================
// BOOKINGS
// ============================================================================

export function getAllBookings(tenantId, filters = {}) {
  let sql = `
    SELECT b.*, c.first_name, c.last_name, c.email, c.phone,
           p.first_name as provider_first_name, p.last_name as provider_last_name
    FROM bookings b
    JOIN clients c ON b.client_id = c.id
    JOIN providers p ON b.provider_id = p.id
    WHERE b.tenant_id = ?
  `;
  const params = [tenantId];

  if (filters.status) {
    sql += ' AND b.status = ?';
    params.push(filters.status);
  }

  if (filters.provider_id) {
    sql += ' AND b.provider_id = ?';
    params.push(filters.provider_id);
  }

  if (filters.date_from) {
    sql += ' AND b.booking_date >= ?';
    params.push(filters.date_from);
  }

  if (filters.date_to) {
    sql += ' AND b.booking_date <= ?';
    params.push(filters.date_to);
  }

  sql += ' ORDER BY b.booking_date DESC, b.start_time DESC';

  return query(sql, params);
}

export function getBookingById(bookingId, tenantId) {
  const booking = queryOne(
    `SELECT b.*, c.first_name, c.last_name, c.email, c.phone,
            p.first_name as provider_first_name, p.last_name as provider_last_name
     FROM bookings b
     JOIN clients c ON b.client_id = c.id
     JOIN providers p ON b.provider_id = p.id
     WHERE b.id = ? AND b.tenant_id = ?`,
    [bookingId, tenantId]
  );

  if (booking) {
    booking.services = query(
      'SELECT * FROM booking_services WHERE booking_id = ?',
      [bookingId]
    );
  }

  return booking;
}

export function createBooking(tenantId, bookingData) {
  const {
    client_id, provider_id, booking_date, start_time, end_time,
    services, notes, status
  } = bookingData;

  return transaction(() => {
    // Calculate total price
    const totalPrice = services.reduce((sum, s) => sum + (s.price || 0), 0);

    // Create booking
    const result = execute(
      `INSERT INTO bookings (
        tenant_id, client_id, provider_id, booking_date, start_time, end_time,
        status, total_price, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId, client_id, provider_id, booking_date, start_time, end_time,
        status || 'pending', totalPrice, notes
      ]
    );

    const bookingId = result.lastInsertRowid;

    // Add services
    services.forEach(service => {
      execute(
        `INSERT INTO booking_services (booking_id, service_id, service_name, duration_minutes, price)
         VALUES (?, ?, ?, ?, ?)`,
        [bookingId, service.service_id, service.service_name, service.duration_minutes, service.price]
      );
    });

    return getBookingById(bookingId, tenantId);
  });
}

export function updateBooking(bookingId, tenantId, updates) {
  const allowedFields = [
    'booking_date', 'start_time', 'end_time', 'status',
    'notes', 'payment_status', 'payment_method', 'cancellation_reason'
  ];

  const setClauses = [];
  const values = [];

  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      setClauses.push(`${key} = ?`);
      values.push(updates[key]);
    }
  });

  if (setClauses.length === 0) {
    throw new Error('No valid fields to update');
  }

  // Add status timestamps
  if (updates.status === 'confirmed' && !updates.confirmed_at) {
    setClauses.push('confirmed_at = CURRENT_TIMESTAMP');
  } else if (updates.status === 'cancelled' && !updates.cancelled_at) {
    setClauses.push('cancelled_at = CURRENT_TIMESTAMP');
  } else if (updates.status === 'completed' && !updates.completed_at) {
    setClauses.push('completed_at = CURRENT_TIMESTAMP');
  }

  setClauses.push('updated_at = CURRENT_TIMESTAMP');
  values.push(bookingId, tenantId);

  execute(
    `UPDATE bookings SET ${setClauses.join(', ')} WHERE id = ? AND tenant_id = ?`,
    values
  );

  return getBookingById(bookingId, tenantId);
}

export function deleteBooking(bookingId, tenantId) {
  return execute(
    `UPDATE bookings SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND tenant_id = ?`,
    [bookingId, tenantId]
  );
}

export default {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getAllProviders,
  getProviderById,
  createProvider,
  updateProvider,
  deleteProvider,
  getProviderServices,
  assignServiceToProvider,
  removeServiceFromProvider,
  getProviderAvailability,
  setProviderAvailability,
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking
};
