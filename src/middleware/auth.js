/**
 * Middleware di Autenticazione
 * ibooky - Sistema di Booking Multi-Tenant
 */

import jwt from 'jsonwebtoken';
import supabase from '../config/database.js';

/**
 * Verifica il token JWT e autentica l'utente
 */
export const authenticate = async (req, res, next) => {
  try {
    // Estrai il token dall'header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token di autenticazione mancante'
      });
    }

    const token = authHeader.substring(7); // Rimuovi "Bearer "

    // Verifica il token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Recupera l'utente dal database
    const { data: user, error } = await supabase
      .from('users')
      .select('*, tenants(*)')
      .eq('id', decoded.userId)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Utente non trovato o non attivo'
      });
    }

    // Aggiungi l'utente e il tenant alla request
    req.user = user;
    req.tenantId = user.tenant_id;
    req.tenant = user.tenants;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token non valido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token scaduto'
      });
    }

    console.error('Errore autenticazione:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
};

/**
 * Verifica che l'utente abbia un ruolo specifico
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Autenticazione richiesta'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato: permessi insufficienti'
      });
    }

    next();
  };
};

/**
 * Middleware per verificare l'accesso al tenant
 */
export const checkTenantAccess = async (req, res, next) => {
  try {
    const tenantId = req.params.tenantId || req.body.tenant_id;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID mancante'
      });
    }

    // Verifica che l'utente appartenga al tenant
    if (req.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Accesso negato: non hai permessi per questo tenant'
      });
    }

    next();
  } catch (error) {
    console.error('Errore verifica tenant:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
};

export default { authenticate, authorize, checkTenantAccess };
