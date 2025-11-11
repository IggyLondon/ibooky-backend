/**
 * Controller per la gestione dei Provider/Operatori
 * Modulo: Appuntamenti
 * ibooky - Sistema di Booking Multi-Tenant
 */

import supabase from '../../config/database.js';

/**
 * Ottieni tutti i provider del tenant
 * GET /api/v1/appointments/providers
 */
export const getProviders = async (req, res) => {
  try {
    const { is_active } = req.query;

    let query = supabase
      .from('providers')
      .select(`
        *,
        provider_services(
          service_id,
          services(id, name, duration_minutes, price)
        )
      `)
      .eq('tenant_id', req.tenantId)
      .order('display_order', { ascending: true });

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data: providers, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    console.error('Errore recupero provider:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero dei provider'
    });
  }
};

/**
 * Ottieni un singolo provider
 * GET /api/v1/appointments/providers/:id
 */
export const getProviderById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: provider, error } = await supabase
      .from('providers')
      .select(`
        *,
        provider_services(
          service_id,
          services(id, name, duration_minutes, price)
        ),
        availabilities(*),
        unavailabilities(*)
      `)
      .eq('id', id)
      .eq('tenant_id', req.tenantId)
      .single();

    if (error) throw error;

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider non trovato'
      });
    }

    res.json({
      success: true,
      data: provider
    });
  } catch (error) {
    console.error('Errore recupero provider:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero del provider'
    });
  }
};

/**
 * Crea un nuovo provider
 * POST /api/v1/appointments/providers
 */
export const createProvider = async (req, res) => {
  try {
    const {
      user_id,
      first_name,
      last_name,
      email,
      phone,
      color,
      avatar_url,
      bio,
      is_active,
      display_order,
      service_ids
    } = req.body;

    // Crea il provider
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .insert({
        tenant_id: req.tenantId,
        user_id,
        first_name,
        last_name,
        email,
        phone,
        color: color || '#10B981',
        avatar_url,
        bio,
        is_active: is_active !== undefined ? is_active : true,
        display_order: display_order || 0
      })
      .select()
      .single();

    if (providerError) throw providerError;

    // Associa i servizi al provider
    if (service_ids && service_ids.length > 0) {
      const providerServices = service_ids.map(service_id => ({
        tenant_id: req.tenantId,
        provider_id: provider.id,
        service_id
      }));

      const { error: servicesError } = await supabase
        .from('provider_services')
        .insert(providerServices);

      if (servicesError) throw servicesError;
    }

    res.status(201).json({
      success: true,
      message: 'Provider creato con successo',
      data: provider
    });
  } catch (error) {
    console.error('Errore creazione provider:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante la creazione del provider'
    });
  }
};

/**
 * Aggiorna un provider
 * PUT /api/v1/appointments/providers/:id
 */
export const updateProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      color,
      avatar_url,
      bio,
      is_active,
      display_order,
      service_ids
    } = req.body;

    const allowedFields = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'color',
      'avatar_url',
      'bio',
      'is_active',
      'display_order'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', req.tenantId)
      .select()
      .single();

    if (providerError) throw providerError;

    // Aggiorna i servizi associati se forniti
    if (service_ids !== undefined) {
      // Elimina le associazioni esistenti
      await supabase
        .from('provider_services')
        .delete()
        .eq('provider_id', id)
        .eq('tenant_id', req.tenantId);

      // Crea le nuove associazioni
      if (service_ids.length > 0) {
        const providerServices = service_ids.map(service_id => ({
          tenant_id: req.tenantId,
          provider_id: id,
          service_id
        }));

        const { error: servicesError } = await supabase
          .from('provider_services')
          .insert(providerServices);

        if (servicesError) throw servicesError;
      }
    }

    res.json({
      success: true,
      message: 'Provider aggiornato con successo',
      data: provider
    });
  } catch (error) {
    console.error('Errore aggiornamento provider:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'aggiornamento del provider'
    });
  }
};

/**
 * Elimina un provider
 * DELETE /api/v1/appointments/providers/:id
 */
export const deleteProvider = async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica se ci sono prenotazioni associate
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('provider_id', id)
      .eq('tenant_id', req.tenantId)
      .limit(1);

    if (bookings && bookings.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Impossibile eliminare il provider: ci sono prenotazioni associate'
      });
    }

    const { error } = await supabase
      .from('providers')
      .delete()
      .eq('id', id)
      .eq('tenant_id', req.tenantId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Provider eliminato con successo'
    });
  } catch (error) {
    console.error('Errore eliminazione provider:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'eliminazione del provider'
    });
  }
};

/**
 * Ottieni la disponibilità di un provider
 * GET /api/v1/appointments/providers/:id/availability
 */
export const getProviderAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: availabilities, error } = await supabase
      .from('availabilities')
      .select('*')
      .eq('provider_id', id)
      .eq('tenant_id', req.tenantId)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: availabilities
    });
  } catch (error) {
    console.error('Errore recupero disponibilità:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero della disponibilità'
    });
  }
};

/**
 * Imposta la disponibilità di un provider
 * POST /api/v1/appointments/providers/:id/availability
 */
export const setProviderAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { availabilities } = req.body;

    // Elimina le disponibilità esistenti
    await supabase
      .from('availabilities')
      .delete()
      .eq('provider_id', id)
      .eq('tenant_id', req.tenantId);

    // Inserisci le nuove disponibilità
    if (availabilities && availabilities.length > 0) {
      const newAvailabilities = availabilities.map(av => ({
        tenant_id: req.tenantId,
        provider_id: id,
        day_of_week: av.day_of_week,
        start_time: av.start_time,
        end_time: av.end_time,
        is_active: true
      }));

      const { error } = await supabase
        .from('availabilities')
        .insert(newAvailabilities);

      if (error) throw error;
    }

    res.json({
      success: true,
      message: 'Disponibilità aggiornata con successo'
    });
  } catch (error) {
    console.error('Errore impostazione disponibilità:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'impostazione della disponibilità'
    });
  }
};

export default {
  getProviders,
  getProviderById,
  createProvider,
  updateProvider,
  deleteProvider,
  getProviderAvailability,
  setProviderAvailability
};
