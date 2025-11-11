/**
 * Routes per il modulo Prenotazioni (Placeholder)
 * ibooky - Sistema di Booking Multi-Tenant
 * 
 * NOTA: Questo modulo sarà implementato nella FASE 2
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Middleware di autenticazione
router.use(authenticate);

// Placeholder response
const notImplemented = (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Funzionalità non ancora implementata',
    message: 'Il modulo Prenotazioni (Ristoranti/B&B) sarà disponibile nella FASE 2'
  });
};

// ========== RESOURCES ==========
router.get('/resources', notImplemented);
router.post('/resources', notImplemented);
router.get('/resources/:id', notImplemented);
router.put('/resources/:id', notImplemented);
router.delete('/resources/:id', notImplemented);

// ========== TIME SLOTS ==========
router.get('/time-slots', notImplemented);
router.post('/time-slots', notImplemented);

// ========== RESERVATIONS ==========
router.get('/reservations', notImplemented);
router.post('/reservations', notImplemented);
router.get('/reservations/:id', notImplemented);
router.put('/reservations/:id', notImplemented);
router.delete('/reservations/:id', notImplemented);

export default router;
