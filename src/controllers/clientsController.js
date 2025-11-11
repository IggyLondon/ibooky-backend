/**
 * Controller per la gestione dei Clienti
 * ibooky - Sistema di Booking Multi-Tenant
 */

import * as clientsService from '../services/clientsService.js';

/**
 * Ottieni tutti i clienti
 * GET /api/v1/clients
 */
export const getAllClients = async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      limit: req.query.limit ? parseInt(req.query.limit) : null,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };

    const clients = clientsService.getAllClients(req.tenantId, filters);

    res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    console.error('Errore recupero clienti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero dei clienti'
    });
  }
};

/**
 * Ottieni un cliente specifico
 * GET /api/v1/clients/:id
 */
export const getClientById = async (req, res) => {
  try {
    const client = clientsService.getClientById(req.params.id, req.tenantId);

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente non trovato'
      });
    }

    // Get client statistics
    const stats = clientsService.getClientStats(req.params.id, req.tenantId);

    res.json({
      success: true,
      data: { ...client, ...stats }
    });
  } catch (error) {
    console.error('Errore recupero cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero del cliente'
    });
  }
};

/**
 * Crea un nuovo cliente
 * POST /api/v1/clients
 */
export const createClient = async (req, res) => {
  try {
    const client = clientsService.createClient(req.tenantId, req.body);

    res.status(201).json({
      success: true,
      message: 'Cliente creato con successo',
      data: client
    });
  } catch (error) {
    console.error('Errore creazione cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante la creazione del cliente'
    });
  }
};

/**
 * Aggiorna un cliente
 * PUT /api/v1/clients/:id
 */
export const updateClient = async (req, res) => {
  try {
    const client = clientsService.updateClient(req.params.id, req.tenantId, req.body);

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente non trovato'
      });
    }

    res.json({
      success: true,
      message: 'Cliente aggiornato con successo',
      data: client
    });
  } catch (error) {
    console.error('Errore aggiornamento cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'aggiornamento del cliente'
    });
  }
};

/**
 * Elimina un cliente
 * DELETE /api/v1/clients/:id
 */
export const deleteClient = async (req, res) => {
  try {
    clientsService.deleteClient(req.params.id, req.tenantId);

    res.json({
      success: true,
      message: 'Cliente eliminato con successo'
    });
  } catch (error) {
    console.error('Errore eliminazione cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'eliminazione del cliente'
    });
  }
};

export default {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
};
