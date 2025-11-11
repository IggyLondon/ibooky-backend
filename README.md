# iBooky Backend API

**Multi-tenant booking system backend** - Standalone REST API built with Node.js, Express, and SQLite.

Perfect for deployment on **Render Free Tier** (EU region).

---

## 🚀 Features

- ✅ **Multi-tenant architecture** - Multiple businesses on one backend
- ✅ **SQLite database** - Zero configuration, perfect for Render Free Tier
- ✅ **RESTful API** - Clean, documented endpoints
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Modular design** - Easy to extend with new features
- ✅ **Swagger documentation** - Interactive API docs at `/api-docs`
- ✅ **No frontend included** - Pure backend, connect any frontend

---

## 📦 What's Included

### Core Modules
- **Tenants** - Multi-tenant management (register, login, settings)
- **Users** - User management with roles (admin, staff, user)
- **Clients** - Customer database with notes and history

### Appointments Module
- **Services** - Service catalog with pricing and duration
- **Providers** - Staff/provider management with availability
- **Bookings** - Appointment scheduling and management
- **Availability** - Provider working hours and time slots

### Reservations Module (Placeholder)
- **Tables** - Restaurant table management
- **Reservations** - Table booking system
- *(Ready for future implementation)*

---

## 🛠️ Tech Stack

- **Runtime**: Node.js 22.x
- **Framework**: Express 5.x
- **Database**: SQLite (sql.js - pure JavaScript)
- **Authentication**: JWT (jsonwebtoken)
- **Documentation**: Swagger UI
- **Package Manager**: pnpm

---

## 🏃 Quick Start

### Prerequisites
- Node.js 18+ (22.x recommended)
- pnpm (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install

# Initialize database (creates schema and demo data)
pnpm run init-db

# Start development server
pnpm run dev
```

The API will be available at `http://localhost:3000`

### API Documentation

Visit `http://localhost:3000/api-docs` for interactive Swagger documentation.

---

## 📁 Project Structure

```
ibooky-backend/
├── src/
│   ├── server.js                 # Main server entry point
│   ├── config/
│   │   ├── database.js           # SQLite configuration
│   │   └── swagger.js            # API documentation config
│   ├── database/
│   │   ├── schema/               # SQL schema files (modular)
│   │   │   ├── core.sql          # Tenants & Users
│   │   │   ├── clients.sql       # Client management
│   │   │   ├── appointments.sql  # Appointments module
│   │   │   └── reservations.sql  # Reservations module
│   │   └── seeds/                # Demo data
│   │       └── 001_demo_data.sql
│   ├── controllers/              # Request handlers
│   ├── services/                 # Business logic
│   ├── routes/                   # API routes
│   ├── middleware/               # Auth, validation, errors
│   └── scripts/
│       └── init-db.js            # Database initialization
├── data/
│   └── ibooky.db                 # SQLite database file
├── package.json
├── .env.example                  # Environment variables template
├── README.md                     # This file
└── DEPLOYMENT.md                 # Render deployment guide
```

---

## 🔧 Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Required Variables

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-super-secret-key-change-this
```

### Optional Variables

```env
CORS_ORIGIN=*
DATABASE_PATH=./data/ibooky.db
JWT_EXPIRES_IN=7d
RUN_SEEDS=false
```

See `.env.example` for full documentation.

---

## 🗄️ Database

### Schema Modules

The database is organized in modular SQL files:

1. **core.sql** - Tenants and Users tables
2. **clients.sql** - Client management
3. **appointments.sql** - Services, Providers, Bookings, Availability
4. **reservations.sql** - Tables and Reservations (placeholder)

### Initialize Database

```bash
pnpm run init-db
```

This will:
- Create all tables
- Set up foreign keys and indexes
- Load demo data (if `RUN_SEEDS=true`)

### Demo Data

Demo tenant included:
- **Slug**: `demo-salon`
- **Admin Email**: `admin@demo.com`
- **Password**: `Demo123!`

---

## 🌐 API Endpoints

### Health Check
```
GET /api/v1/health
```

### Authentication
```
POST /api/v1/tenants/register  # Register new tenant
POST /api/v1/tenants/login     # Login
GET  /api/v1/tenants/me        # Get current tenant
PUT  /api/v1/tenants/me        # Update tenant settings
```

### Clients
```
GET    /api/v1/clients         # List all clients
GET    /api/v1/clients/:id     # Get client details
POST   /api/v1/clients         # Create client
PUT    /api/v1/clients/:id     # Update client
DELETE /api/v1/clients/:id     # Delete client (soft delete)
```

### Appointments
```
GET    /api/v1/appointments/services    # List services
POST   /api/v1/appointments/services    # Create service
GET    /api/v1/appointments/providers   # List providers
POST   /api/v1/appointments/providers   # Create provider
GET    /api/v1/appointments/bookings    # List bookings
POST   /api/v1/appointments/bookings    # Create booking
```

**Full API documentation**: `http://localhost:3000/api-docs`

---

## 🚀 Deployment

### Render (Recommended)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete Render deployment guide.

**Quick steps:**
1. Push code to GitHub
2. Create new Web Service on Render
3. Configure environment variables
4. Deploy!

**Region**: Frankfurt (EU Central) or Amsterdam (EU West)

### Other Platforms

Works on any Node.js hosting:
- Railway
- Fly.io
- Heroku
- DigitalOcean App Platform
- AWS Elastic Beanstalk

**Requirements:**
- Node.js 18+
- Persistent storage for SQLite database (or use PostgreSQL)

---

## 🔐 Security

### Production Checklist

- [ ] Change `JWT_SECRET` to a secure random string
- [ ] Set `CORS_ORIGIN` to your actual frontend domain(s)
- [ ] Enable HTTPS (automatic on Render)
- [ ] Review default passwords and demo data
- [ ] Set `RUN_SEEDS=false` in production
- [ ] Implement rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure database backups

---

## 🧪 Testing

### Manual Testing

Use the Swagger UI at `/api-docs` or tools like:
- Postman
- Insomnia
- curl
- HTTPie

### Example: Register Tenant

```bash
curl -X POST http://localhost:3000/api/v1/tenants/register \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "my-salon",
    "business_name": "My Salon",
    "business_type": "appointments",
    "email": "info@mysalon.com",
    "phone": "+39 123456789",
    "admin_first_name": "John",
    "admin_last_name": "Doe",
    "admin_email": "admin@mysalon.com",
    "admin_password": "SecurePass123!"
  }'
```

---

## 📈 Scaling & Performance

### SQLite Limitations

- **Good for**: Up to 100k requests/day, single-server deployments
- **Not ideal for**: High-concurrency writes, distributed systems

### Migration to PostgreSQL

For production scale, consider migrating to PostgreSQL:
1. Use Render PostgreSQL service
2. Update `src/config/database.js` to use `pg` driver
3. Adjust SQL queries for PostgreSQL syntax

---

## 🛠️ Development

### Available Scripts

```bash
pnpm start      # Start production server
pnpm run dev    # Start development server (auto-reload)
pnpm run init-db # Initialize database
pnpm run build  # No build step needed (pure Node.js)
```

### Adding New Features

1. **Add database tables**: Create SQL file in `src/database/schema/`
2. **Create service**: Add business logic in `src/services/`
3. **Create controller**: Add request handlers in `src/controllers/`
4. **Add routes**: Register endpoints in `src/routes/`
5. **Update Swagger**: Document in controller JSDoc comments

---

## 📝 License

ISC

---

## 🤝 Contributing

This is a standalone backend designed to work with any frontend. Feel free to:
- Report issues
- Suggest features
- Submit pull requests

---

## 📞 Support

- **Documentation**: See `/api-docs` endpoint
- **Deployment Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Issues**: [GitHub Issues](#)

---

## ✨ What's Next?

### Planned Features
- [ ] Email notifications (SMTP integration)
- [ ] SMS notifications (Twilio integration)
- [ ] Payment processing (Stripe)
- [ ] Calendar sync (Google Calendar, iCal)
- [ ] Webhooks for integrations
- [ ] Advanced reporting and analytics
- [ ] Multi-language support

---

**Built with ❤️ for multi-tenant booking systems**

Perfect for:
- Hair salons & barbershops
- Beauty centers & spas
- Medical clinics
- Fitness studios
- Consulting services
- Restaurants (reservations module)
- Any appointment-based business
