/**
 * Routes principali dell'API
 * ibooky - Sistema di Booking Multi-Tenant
 */

import express from 'express';
import tenantRoutes from './tenantRoutes.js';
import clientRoutes from './clientRoutes.js';
import appointmentsRoutes from './appointmentsRoutes.js';
import reservationsRoutes from './reservationsRoutes.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ibooky API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
router.use('/tenants', tenantRoutes);
router.use('/clients', clientRoutes);
router.use('/appointments', appointmentsRoutes);
router.use('/reservations', reservationsRoutes);

export default router;
