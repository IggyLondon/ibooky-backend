/**
 * Routes per la gestione dei Clienti
 * ibooky - Sistema di Booking Multi-Tenant
 */

import express from 'express';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
} from '../controllers/clientsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Tutte le routes richiedono autenticazione
router.use(authenticate);

router.get('/', getAllClients);
router.get('/:id', getClientById);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', authorize('admin'), deleteClient);
// TODO: Implement getClientBookings and clearClientHistory
// router.get('/:id/bookings', getClientBookings);
// router.delete('/:id/bookings/history', authorize('admin'), clearClientHistory);

export default router;
