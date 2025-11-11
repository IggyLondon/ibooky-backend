/**
 * Service Layer - Clients
 * Business logic for client management
 */

import { query, queryOne, execute } from '../config/database.js';

/**
 * Get all clients for a tenant
 */
export async function getAllClients(tenantId, filters = {}) {
  let sql = 'SELECT * FROM clients WHERE tenant_id = ? AND is_active = 1';
  const params = [tenantId];

  // Add search filter
  if (filters.search) {
    sql += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  // Add sorting
  const sortBy = filters.sortBy || 'created_at';
  const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
  sql += ` ORDER BY ${sortBy} ${sortOrder}`;

  // Add pagination
  if (filters.limit) {
    sql += ' LIMIT ? OFFSET ?';
    params.push(filters.limit, filters.offset || 0);
  }

  return await query(sql, params);
}

/**
 * Get client by ID
 */
export async function getClientById(clientId, tenantId) {
  return await queryOne(
    'SELECT * FROM clients WHERE id = ? AND tenant_id = ?',
    [clientId, tenantId]
  );
}

/**
 * Create new client
 */
export async function createClient(tenantId, clientData) {
  const {
    first_name,
    last_name,
    email,
    phone,
    date_of_birth,
    gender,
    address,
    city,
    postal_code,
    country,
    notes,
    marketing_consent,
    sms_consent,
    email_consent
  } = clientData;

  const result = await execute(
    `INSERT INTO clients (
      tenant_id, first_name, last_name, email, phone,
      date_of_birth, gender, address, city, postal_code, country,
      notes, marketing_consent, sms_consent, email_consent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tenantId, first_name, last_name, email, phone,
      date_of_birth, gender, address, city, postal_code, country || 'IT',
      notes, marketing_consent || 0, sms_consent || 0, email_consent || 0
    ]
  );

  return await getClientById(result.lastInsertRowid, tenantId);
}

/**
 * Update client
 */
export async function updateClient(clientId, tenantId, updates) {
  const allowedFields = [
    'first_name', 'last_name', 'email', 'phone', 'date_of_birth',
    'gender', 'address', 'city', 'postal_code', 'country', 'notes',
    'marketing_consent', 'sms_consent', 'email_consent', 'tags'
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
  values.push(clientId, tenantId);

  await execute(
    `UPDATE clients SET ${setClauses.join(', ')} WHERE id = ? AND tenant_id = ?`,
    values
  );

  return await getClientById(clientId, tenantId);
}

/**
 * Delete client (soft delete)
 */
export async function deleteClient(clientId, tenantId) {
  return await execute(
    'UPDATE clients SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?',
    [clientId, tenantId]
  );
}

/**
 * Get client statistics
 */
export async function getClientStats(clientId, tenantId) {
  return await queryOne(
    `SELECT 
      c.*,
      COUNT(b.id) as total_bookings,
      SUM(b.total_price) as total_spent,
      MAX(b.booking_date) as last_booking_date
     FROM clients c
     LEFT JOIN bookings b ON c.id = b.client_id AND b.status != 'cancelled'
     WHERE c.id = ? AND c.tenant_id = ?
     GROUP BY c.id`,
    [clientId, tenantId]
  );
}

export default {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientStats
};
