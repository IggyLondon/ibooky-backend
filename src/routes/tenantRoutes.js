/**
 * Routes per la gestione dei Tenant
 * ibooky - Sistema di Booking Multi-Tenant
 */

import express from 'express';
import {
  registerTenant,
  login,
  getCurrentTenant,
  updateTenant
} from '../controllers/tenantController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Pubbliche (senza autenticazione)
router.post('/register', registerTenant);
router.post('/login', login);

// Protette (con autenticazione)
router.get('/me', authenticate, getCurrentTenant);
router.put('/me', authenticate, updateTenant);

export default router;
