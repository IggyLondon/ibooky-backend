/**
 * Routes per il modulo Appuntamenti
 * ibooky - Sistema di Booking Multi-Tenant
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';

// Controllers
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getServiceCategories,
  createServiceCategory
} from '../modules/appointments/servicesController.js';

import {
  getProviders,
  getProviderById,
  createProvider,
  updateProvider,
  deleteProvider,
  getProviderAvailability,
  setProviderAvailability
} from '../modules/appointments/providersController.js';

import {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  cancelBooking,
  getAvailableSlots
} from '../modules/appointments/bookingsController.js';

const router = express.Router();

// Tutte le routes richiedono autenticazione
router.use(authenticate);

// ========== SERVICES ==========
router.get('/services', getServices);
router.get('/services/:id', getServiceById);
router.post('/services', authorize('admin'), createService);
router.put('/services/:id', authorize('admin'), updateService);
router.delete('/services/:id', authorize('admin'), deleteService);

// Service Categories
router.get('/service-categories', getServiceCategories);
router.post('/service-categories', authorize('admin'), createServiceCategory);

// ========== PROVIDERS ==========
router.get('/providers', getProviders);
router.get('/providers/:id', getProviderById);
router.post('/providers', authorize('admin'), createProvider);
router.put('/providers/:id', authorize('admin'), updateProvider);
router.delete('/providers/:id', authorize('admin'), deleteProvider);

// Provider Availability
router.get('/providers/:id/availability', getProviderAvailability);
router.post('/providers/:id/availability', authorize('admin'), setProviderAvailability);

// ========== BOOKINGS ==========
router.get('/bookings', getBookings);
router.get('/bookings/available-slots', getAvailableSlots);
router.get('/bookings/:id', getBookingById);
router.post('/bookings', createBooking);
router.put('/bookings/:id', updateBooking);
router.delete('/bookings/:id', cancelBooking);

export default router;
