/**
 * Controller per la gestione dei Tenant
 * ibooky - Sistema di Booking Multi-Tenant
 */

import { queryOne, execute, transaction } from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * Registra un nuovo tenant
 * POST /api/v1/tenants/register
 */
export const registerTenant = async (req, res) => {
  try {
    const {
      slug,
      business_name,
      business_type,
      email,
      phone,
      admin_first_name,
      admin_last_name,
      admin_email,
      admin_password
    } = req.body;

    // Validazione business_type
    if (!['appointments', 'reservations'].includes(business_type)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo di business non valido. Scegli tra: appointments, reservations'
      });
    }

    // Verifica se lo slug è già in uso
    const existingTenant = await queryOne(
      'SELECT id FROM tenants WHERE slug = ?',
      [slug]
    );

    if (existingTenant) {
      return res.status(400).json({
        success: false,
        error: 'Questo slug è già in uso'
      });
    }

    // Hash della password admin
    const passwordHash = await bcrypt.hash(admin_password, 10);

    // Usa transaction per creare tenant e admin atomicamente
    const result = await transaction(async () => {
      // Crea il tenant
      const tenantResult = await execute(
        `INSERT INTO tenants (slug, business_name, business_type, email, phone)
         VALUES (?, ?, ?, ?, ?)`,
        [slug, business_name, business_type, email, phone]
      );

      const tenantId = tenantResult.lastInsertRowid;

      // Crea l'utente admin
      const userResult = await execute(
        `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, is_active)
         VALUES (?, ?, ?, ?, ?, 'admin', 1)`,
        [tenantId, admin_email, passwordHash, admin_first_name, admin_last_name]
      );

      const userId = userResult.lastInsertRowid;

      // Recupera i dati creati
      const tenant = await queryOne('SELECT * FROM tenants WHERE id = ?', [tenantId]);
      const user = await queryOne('SELECT * FROM users WHERE id = ?', [userId]);

      return { tenant, user };
    });

    // Genera JWT token
    const token = jwt.sign(
      { userId: result.user.id, tenantId: result.tenant.id, role: result.user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Tenant registrato con successo',
      data: {
        tenant: {
          id: result.tenant.id,
          slug: result.tenant.slug,
          business_name: result.tenant.business_name,
          business_type: result.tenant.business_type
        },
        admin: {
          id: result.user.id,
          email: result.user.email,
          first_name: result.user.first_name,
          last_name: result.user.last_name
        },
        token
      }
    });
  } catch (error) {
    console.error('Errore registrazione tenant:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante la registrazione del tenant'
    });
  }
};

/**
 * Login utente
 * POST /api/v1/tenants/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Trova l'utente con il tenant
    const user = await queryOne(
      `SELECT u.*, t.id as tenant_id, t.slug, t.business_name, t.business_type
       FROM users u
       JOIN tenants t ON u.tenant_id = t.id
       WHERE u.email = ? AND u.is_active = 1`,
      [email]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenziali non valide'
      });
    }

    // Verifica la password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Credenziali non valide'
      });
    }

    // Aggiorna last_login_at
    await execute(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Genera JWT token
    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role
        },
        tenant: {
          id: user.tenant_id,
          slug: user.slug,
          business_name: user.business_name,
          business_type: user.business_type
        },
        token
      }
    });
  } catch (error) {
    console.error('Errore login:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il login'
    });
  }
};

/**
 * Ottieni informazioni sul tenant corrente
 * GET /api/v1/tenants/me
 */
export const getCurrentTenant = async (req, res) => {
  try {
    const tenant = await queryOne(
      'SELECT * FROM tenants WHERE id = ?',
      [req.tenantId]
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant non trovato'
      });
    }

    res.json({
      success: true,
      data: tenant
    });
  } catch (error) {
    console.error('Errore recupero tenant:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero delle informazioni del tenant'
    });
  }
};

/**
 * Aggiorna informazioni del tenant
 * PUT /api/v1/tenants/me
 */
export const updateTenant = async (req, res) => {
  try {
    const allowedFields = [
      'business_name',
      'email',
      'phone',
      'address',
      'city',
      'country',
      'timezone',
      'currency',
      'logo_url',
      'website',
      'description'
    ];

    const updates = [];
    const values = [];
    
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nessun campo valido da aggiornare'
      });
    }

    // Aggiungi updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.tenantId);

    await execute(
      `UPDATE tenants SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const tenant = await queryOne(
      'SELECT * FROM tenants WHERE id = ?',
      [req.tenantId]
    );

    res.json({
      success: true,
      message: 'Tenant aggiornato con successo',
      data: tenant
    });
  } catch (error) {
    console.error('Errore aggiornamento tenant:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'aggiornamento del tenant'
    });
  }
};

export default {
  registerTenant,
  login,
  getCurrentTenant,
  updateTenant
};
