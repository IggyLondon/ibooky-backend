/**
 * Configurazione Swagger per la documentazione API
 * ibooky - Sistema di Booking Multi-Tenant
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ibooky API',
      version: '1.0.0',
      description: 'API REST per il sistema di booking multi-tenant ibooky',
      contact: {
        name: 'ibooky Support',
        email: 'support@ibooky.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Server di sviluppo'
      },
      {
        url: 'https://api.ibooky.com/v1',
        description: 'Server di produzione'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Tenant: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            slug: { type: 'string' },
            business_name: { type: 'string' },
            business_type: { type: 'string', enum: ['appointments', 'reservations'] },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            status: { type: 'string', enum: ['active', 'suspended', 'trial', 'cancelled'] },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Service: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            duration_minutes: { type: 'integer' },
            price: { type: 'number', format: 'decimal' },
            buffer_before_minutes: { type: 'integer' },
            buffer_after_minutes: { type: 'integer' },
            color: { type: 'string' },
            is_active: { type: 'boolean' }
          }
        },
        Provider: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            color: { type: 'string' },
            is_active: { type: 'boolean' }
          }
        },
        Client: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            phone: { type: 'string' },
            is_active: { type: 'boolean' }
          }
        },
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            client_id: { type: 'string', format: 'uuid' },
            service_id: { type: 'string', format: 'uuid' },
            provider_id: { type: 'string', format: 'uuid' },
            booking_datetime: { type: 'string', format: 'date-time' },
            duration_minutes: { type: 'integer' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'] },
            price: { type: 'number', format: 'decimal' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Tenants',
        description: 'Gestione tenant e autenticazione'
      },
      {
        name: 'Clients',
        description: 'Gestione clienti'
      },
      {
        name: 'Appointments - Services',
        description: 'Gestione servizi per appuntamenti'
      },
      {
        name: 'Appointments - Providers',
        description: 'Gestione operatori/fornitori'
      },
      {
        name: 'Appointments - Bookings',
        description: 'Gestione prenotazioni/appuntamenti'
      },
      {
        name: 'Reservations',
        description: 'Modulo prenotazioni (Placeholder - FASE 2)'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/modules/**/*.js']
};

export const swaggerSpec = swaggerJsdoc(options);
