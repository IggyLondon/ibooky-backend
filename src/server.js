/**
 * Server principale
 * ibooky - Sistema di Booking Multi-Tenant
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import { getDatabase, initializeSchema } from './config/database.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import routes from './routes/index.js';

// Carica le variabili d'ambiente
dotenv.config();

// Inizializza Express
const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Benvenuto su ibooky API',
    version: API_VERSION,
    documentation: `/api-docs`,
    endpoints: {
      health: `/api/${API_VERSION}/health`,
      tenants: `/api/${API_VERSION}/tenants`,
      clients: `/api/${API_VERSION}/clients`,
      appointments: `/api/${API_VERSION}/appointments`,
      reservations: `/api/${API_VERSION}/reservations`
    }
  });
});

// Documentazione Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ibooky API Documentation'
}));

// API Routes
app.use(`/api/${API_VERSION}`, routes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

// Avvio del server
const startServer = async () => {
  try {
    // Initialize database
    const db = getDatabase();
    console.log('✅ SQLite database connected');
    
    // Initialize schema if needed
    try {
      initializeSchema();
    } catch (error) {
      console.log('ℹ️  Schema already initialized or error:', error.message);
    }

    // Avvia il server
    app.listen(PORT, () => {
      console.log('');
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║                                                            ║');
      console.log('║                    🚀 ibooky API Server                    ║');
      console.log('║                                                            ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log('');
      console.log(`✅ Server in esecuzione su: http://localhost:${PORT}`);
      console.log(`📚 Documentazione API: http://localhost:${PORT}/api-docs`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api/${API_VERSION}`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log('');
      console.log('Endpoints disponibili:');
      console.log(`  - GET  /api/${API_VERSION}/health`);
      console.log(`  - POST /api/${API_VERSION}/tenants/register`);
      console.log(`  - POST /api/${API_VERSION}/tenants/login`);
      console.log(`  - GET  /api/${API_VERSION}/appointments/services`);
      console.log(`  - GET  /api/${API_VERSION}/appointments/providers`);
      console.log(`  - GET  /api/${API_VERSION}/appointments/bookings`);
      console.log('');
      console.log('Premi CTRL+C per arrestare il server');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Errore durante l\'avvio del server:', error);
    process.exit(1);
  }
};

// Gestione degli errori non catturati
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Avvia il server
startServer();

export default app;
