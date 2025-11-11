/**
 * Controller per la gestione dei Servizi
 * Modulo: Appuntamenti
 * ibooky - Sistema di Booking Multi-Tenant
 */

import supabase from '../../config/database.js';

/**
 * Ottieni tutti i servizi del tenant
 * GET /api/v1/appointments/services
 */
export const getServices = async (req, res) => {
  try {
    const { category_id, is_active } = req.query;

    let query = supabase
      .from('services')
      .select(`
        *,
        service_categories(id, name),
        service_addons(*)
      `)
      .eq('tenant_id', req.tenantId)
      .order('display_order', { ascending: true });

    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data: services, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Errore recupero servizi:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero dei servizi'
    });
  }
};

/**
 * Ottieni un singolo servizio
 * GET /api/v1/appointments/services/:id
 */
export const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: service, error } = await supabase
      .from('services')
      .select(`
        *,
        service_categories(id, name),
        service_addons(*)
      `)
      .eq('id', id)
      .eq('tenant_id', req.tenantId)
      .single();

    if (error) throw error;

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Servizio non trovato'
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Errore recupero servizio:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero del servizio'
    });
  }
};

/**
 * Crea un nuovo servizio
 * POST /api/v1/appointments/services
 */
export const createService = async (req, res) => {
  try {
    const {
      category_id,
      name,
      description,
      duration_minutes,
      price,
      buffer_before_minutes,
      buffer_after_minutes,
      color,
      is_active,
      requires_approval,
      max_bookings_per_day,
      display_order,
      image_url
    } = req.body;

    const { data: service, error } = await supabase
      .from('services')
      .insert({
        tenant_id: req.tenantId,
        category_id,
        name,
        description,
        duration_minutes,
        price,
        buffer_before_minutes: buffer_before_minutes || 0,
        buffer_after_minutes: buffer_after_minutes || 0,
        color: color || '#3B82F6',
        is_active: is_active !== undefined ? is_active : true,
        requires_approval: requires_approval || false,
        max_bookings_per_day,
        display_order: display_order || 0,
        image_url
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Servizio creato con successo',
      data: service
    });
  } catch (error) {
    console.error('Errore creazione servizio:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante la creazione del servizio'
    });
  }
};

/**
 * Aggiorna un servizio
 * PUT /api/v1/appointments/services/:id
 */
export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = [
      'category_id',
      'name',
      'description',
      'duration_minutes',
      'price',
      'buffer_before_minutes',
      'buffer_after_minutes',
      'color',
      'is_active',
      'requires_approval',
      'max_bookings_per_day',
      'display_order',
      'image_url'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const { data: service, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', req.tenantId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Servizio aggiornato con successo',
      data: service
    });
  } catch (error) {
    console.error('Errore aggiornamento servizio:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'aggiornamento del servizio'
    });
  }
};

/**
 * Elimina un servizio
 * DELETE /api/v1/appointments/services/:id
 */
export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica se ci sono prenotazioni associate
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('service_id', id)
      .eq('tenant_id', req.tenantId)
      .limit(1);

    if (bookings && bookings.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Impossibile eliminare il servizio: ci sono prenotazioni associate'
      });
    }

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)
      .eq('tenant_id', req.tenantId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Servizio eliminato con successo'
    });
  } catch (error) {
    console.error('Errore eliminazione servizio:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'eliminazione del servizio'
    });
  }
};

/**
 * Ottieni tutte le categorie di servizi
 * GET /api/v1/appointments/service-categories
 */
export const getServiceCategories = async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('tenant_id', req.tenantId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Errore recupero categorie:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero delle categorie'
    });
  }
};

/**
 * Crea una categoria di servizi
 * POST /api/v1/appointments/service-categories
 */
export const createServiceCategory = async (req, res) => {
  try {
    const { name, description, display_order } = req.body;

    const { data: category, error } = await supabase
      .from('service_categories')
      .insert({
        tenant_id: req.tenantId,
        name,
        description,
        display_order: display_order || 0,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Categoria creata con successo',
      data: category
    });
  } catch (error) {
    console.error('Errore creazione categoria:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante la creazione della categoria'
    });
  }
};

export default {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getServiceCategories,
  createServiceCategory
};
