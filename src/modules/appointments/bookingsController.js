/**
 * Controller per la gestione delle Prenotazioni/Appuntamenti
 * Modulo: Appuntamenti
 * ibooky - Sistema di Booking Multi-Tenant
 */

import supabase from '../../config/database.js';

/**
 * Ottieni tutte le prenotazioni del tenant
 * GET /api/v1/appointments/bookings
 */
export const getBookings = async (req, res) => {
  try {
    const { status, provider_id, client_id, from_date, to_date } = req.query;

    let query = supabase
      .from('bookings')
      .select(`
        *,
        clients(id, first_name, last_name, email, phone),
        services(id, name, duration_minutes, price, color),
        providers(id, first_name, last_name, color)
      `)
      .eq('tenant_id', req.tenantId)
      .order('booking_datetime', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    if (provider_id) {
      query = query.eq('provider_id', provider_id);
    }

    if (client_id) {
      query = query.eq('client_id', client_id);
    }

    if (from_date) {
      query = query.gte('booking_datetime', from_date);
    }

    if (to_date) {
      query = query.lte('booking_datetime', to_date);
    }

    const { data: bookings, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Errore recupero prenotazioni:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero delle prenotazioni'
    });
  }
};

/**
 * Ottieni una singola prenotazione
 * GET /api/v1/appointments/bookings/:id
 */
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        clients(id, first_name, last_name, email, phone),
        services(id, name, duration_minutes, price, color),
        providers(id, first_name, last_name, color),
        booking_addons(
          *,
          service_addons(name, price)
        )
      `)
      .eq('id', id)
      .eq('tenant_id', req.tenantId)
      .single();

    if (error) throw error;

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Prenotazione non trovata'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Errore recupero prenotazione:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero della prenotazione'
    });
  }
};

/**
 * Crea una nuova prenotazione
 * POST /api/v1/appointments/bookings
 */
export const createBooking = async (req, res) => {
  try {
    const {
      client_id,
      service_id,
      provider_id,
      booking_datetime,
      notes,
      client_notes,
      addon_ids
    } = req.body;

    // Recupera il servizio per ottenere durata e prezzo
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('duration_minutes, price, requires_approval')
      .eq('id', service_id)
      .eq('tenant_id', req.tenantId)
      .single();

    if (serviceError || !service) {
      return res.status(404).json({
        success: false,
        error: 'Servizio non trovato'
      });
    }

    // Verifica disponibilità (implementazione semplificata)
    const { data: conflictingBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('tenant_id', req.tenantId)
      .eq('provider_id', provider_id)
      .gte('booking_datetime', booking_datetime)
      .lt('booking_datetime', new Date(new Date(booking_datetime).getTime() + service.duration_minutes * 60000).toISOString())
      .in('status', ['pending', 'confirmed']);

    if (conflictingBookings && conflictingBookings.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Slot non disponibile: esiste già una prenotazione in questo orario'
      });
    }

    // Determina lo status iniziale
    const initialStatus = service.requires_approval ? 'pending' : 'confirmed';

    // Crea la prenotazione
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        tenant_id: req.tenantId,
        client_id,
        service_id,
        provider_id,
        booking_datetime,
        duration_minutes: service.duration_minutes,
        status: initialStatus,
        price: service.price,
        notes,
        client_notes,
        created_by: req.user.id,
        confirmed_at: initialStatus === 'confirmed' ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Aggiungi gli addon se presenti
    if (addon_ids && addon_ids.length > 0) {
      const { data: addons } = await supabase
        .from('service_addons')
        .select('id, price')
        .in('id', addon_ids);

      if (addons && addons.length > 0) {
        const bookingAddons = addons.map(addon => ({
          booking_id: booking.id,
          addon_id: addon.id,
          price: addon.price
        }));

        await supabase.from('booking_addons').insert(bookingAddons);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Prenotazione creata con successo',
      data: booking
    });
  } catch (error) {
    console.error('Errore creazione prenotazione:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante la creazione della prenotazione'
    });
  }
};

/**
 * Aggiorna una prenotazione
 * PUT /api/v1/appointments/bookings/:id
 */
export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      booking_datetime,
      provider_id,
      status,
      notes,
      internal_notes
    } = req.body;

    const allowedFields = [
      'booking_datetime',
      'provider_id',
      'status',
      'notes',
      'internal_notes'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Se lo status cambia in confirmed, imposta confirmed_at
    if (status === 'confirmed') {
      updates.confirmed_at = new Date().toISOString();
    }

    // Se lo status cambia in cancelled, imposta cancelled_at
    if (status === 'cancelled') {
      updates.cancelled_at = new Date().toISOString();
    }

    // Se lo status cambia in completed, imposta completed_at
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', req.tenantId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Prenotazione aggiornata con successo',
      data: booking
    });
  } catch (error) {
    console.error('Errore aggiornamento prenotazione:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'aggiornamento della prenotazione'
    });
  }
};

/**
 * Cancella una prenotazione
 * DELETE /api/v1/appointments/bookings/:id
 */
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    const { data: booking, error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason,
        cancelled_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', req.tenantId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Prenotazione cancellata con successo',
      data: booking
    });
  } catch (error) {
    console.error('Errore cancellazione prenotazione:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante la cancellazione della prenotazione'
    });
  }
};

/**
 * Ottieni gli slot disponibili per un servizio
 * GET /api/v1/appointments/bookings/available-slots
 */
export const getAvailableSlots = async (req, res) => {
  try {
    const { service_id, provider_id, date } = req.query;

    if (!service_id || !date) {
      return res.status(400).json({
        success: false,
        error: 'service_id e date sono obbligatori'
      });
    }

    // Recupera il servizio
    const { data: service } = await supabase
      .from('services')
      .select('duration_minutes, buffer_before_minutes, buffer_after_minutes')
      .eq('id', service_id)
      .eq('tenant_id', req.tenantId)
      .single();

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Servizio non trovato'
      });
    }

    // Recupera le disponibilità
    const dayOfWeek = new Date(date).getDay();
    
    let availabilityQuery = supabase
      .from('availabilities')
      .select('*')
      .eq('tenant_id', req.tenantId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true);

    if (provider_id) {
      availabilityQuery = availabilityQuery.eq('provider_id', provider_id);
    } else {
      availabilityQuery = availabilityQuery.is('provider_id', null);
    }

    const { data: availabilities } = await availabilityQuery;

    if (!availabilities || availabilities.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Recupera le prenotazioni esistenti per quella data
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    let bookingsQuery = supabase
      .from('bookings')
      .select('booking_datetime, duration_minutes')
      .eq('tenant_id', req.tenantId)
      .gte('booking_datetime', startOfDay.toISOString())
      .lte('booking_datetime', endOfDay.toISOString())
      .in('status', ['pending', 'confirmed']);

    if (provider_id) {
      bookingsQuery = bookingsQuery.eq('provider_id', provider_id);
    }

    const { data: existingBookings } = await bookingsQuery;

    // Genera gli slot disponibili (implementazione semplificata)
    const slots = [];
    const interval = 15; // intervallo di 15 minuti

    availabilities.forEach(availability => {
      const [startHour, startMinute] = availability.start_time.split(':').map(Number);
      const [endHour, endMinute] = availability.end_time.split(':').map(Number);

      let currentTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;

      while (currentTime + service.duration_minutes <= endTime) {
        const slotHour = Math.floor(currentTime / 60);
        const slotMinute = currentTime % 60;
        const slotTime = `${String(slotHour).padStart(2, '0')}:${String(slotMinute).padStart(2, '0')}`;
        
        const slotDatetime = new Date(date);
        slotDatetime.setHours(slotHour, slotMinute, 0, 0);

        // Verifica se lo slot è libero
        const isAvailable = !existingBookings?.some(booking => {
          const bookingStart = new Date(booking.booking_datetime);
          const bookingEnd = new Date(bookingStart.getTime() + booking.duration_minutes * 60000);
          return slotDatetime >= bookingStart && slotDatetime < bookingEnd;
        });

        if (isAvailable) {
          slots.push({
            time: slotTime,
            datetime: slotDatetime.toISOString()
          });
        }

        currentTime += interval;
      }
    });

    res.json({
      success: true,
      data: slots
    });
  } catch (error) {
    console.error('Errore recupero slot disponibili:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante il recupero degli slot disponibili'
    });
  }
};

export default {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  cancelBooking,
  getAvailableSlots
};
