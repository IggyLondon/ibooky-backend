/**
 * Middleware per la gestione degli errori
 * ibooky - Sistema di Booking Multi-Tenant
 */

/**
 * Handler globale degli errori
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Errore:', err);

  // Errori di validazione
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Errore di validazione',
      details: err.details || err.message
    });
  }

  // Errori di autenticazione
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Non autorizzato'
    });
  }

  // Errori del database
  if (err.code && err.code.startsWith('23')) { // PostgreSQL error codes
    return res.status(400).json({
      success: false,
      error: 'Errore del database',
      details: err.message
    });
  }

  // Errore generico
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Errore interno del server',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Handler per route non trovate
 */
export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route non trovata: ${req.method} ${req.originalUrl}`
  });
};

export default { errorHandler, notFound };
