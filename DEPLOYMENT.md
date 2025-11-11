# iBooky Backend - Deployment Guide for Render

Complete guide to deploy the iBooky backend API on Render (EU region).

---

## 🚀 Quick Deploy

### Prerequisites
- Render account (free tier works)
- GitHub repository with this code

### Deployment Steps

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_REPO_URL
   git push -u origin main
   ```

2. **Create New Web Service on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository containing this code

3. **Configure Service**
   - **Name**: `ibooky-api` (or your preferred name)
   - **Region**: `Frankfurt (EU Central)` or `Amsterdam (EU West)`
   - **Branch**: `main`
   - **Root Directory**: Leave empty (or specify if backend is in subdirectory)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Plan**: `Free` (or upgrade as needed)

4. **Environment Variables**
   Add these in the Render dashboard (Environment tab):
   
   ```
   NODE_ENV=production
   PORT=3000
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=https://your-frontend-domain.com
   DATABASE_PATH=/opt/render/project/data/ibooky.db
   ```

   **Important**: Change `JWT_SECRET` to a secure random string!

5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy
   - First deployment takes 2-3 minutes

---

## 📦 Database Initialization

The database is automatically initialized on first startup. The schema and demo data are created automatically.

To re-initialize the database:
```bash
npm run init-db
```

---

## 🌍 Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |
| `JWT_SECRET` | Secret for JWT tokens | `your-secret-key` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_EXPIRES_IN` | JWT token expiration | `7d` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `*` |
| `DATABASE_PATH` | SQLite database file path | `./data/ibooky.db` |
| `RUN_SEEDS` | Run seeds in production | `false` |

---

## 🗄️ Database

### SQLite File Location

On Render, the database is stored at:
```
/opt/render/project/data/ibooky.db
```

**Important**: Render's free tier uses **ephemeral storage**. The database will be reset on each deployment or service restart.

### Persistent Storage (Paid Plans)

For production use, upgrade to a paid plan and use Render's persistent disks:

1. Go to your service settings
2. Add a "Disk" in the "Disks" tab
3. Mount path: `/opt/render/project/data`
4. Size: 1GB minimum

### Backup Strategy

For critical data:
1. Use Render Cron Jobs to backup database periodically
2. Upload backups to S3 or similar storage
3. Or migrate to PostgreSQL using Render's PostgreSQL service

---

## 🔧 Post-Deployment

### 1. Test API

```bash
curl https://your-app.onrender.com/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2025-11-10T14:00:00.000Z"
}
```

### 2. Register First Tenant

```bash
curl -X POST https://your-app.onrender.com/api/v1/tenants/register \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "demo-salon",
    "business_name": "My Salon",
    "business_type": "appointments",
    "email": "info@mysalon.com",
    "phone": "+39 123456789",
    "admin_first_name": "John",
    "admin_last_name": "Doe",
    "admin_email": "admin@mysalon.com",
    "admin_password": "SecurePassword123!"
  }'
```

### 3. Login

```bash
curl -X POST https://your-app.onrender.com/api/v1/tenants/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mysalon.com",
    "password": "SecurePassword123!"
  }'
```

Save the returned `token` for authenticated requests.

### 4. View API Documentation

Visit: `https://your-app.onrender.com/api-docs`

---

## 🔐 Security Checklist

Before going live:

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Set `CORS_ORIGIN` to your actual frontend domain
- [ ] Enable HTTPS (automatic on Render)
- [ ] Review and update default passwords
- [ ] Enable rate limiting (add middleware)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for database

---

## 📊 Monitoring

### Render Dashboard
- View logs in real-time
- Monitor CPU/Memory usage
- Check deployment history
- Set up health checks

### Health Check Endpoint
Configure Render health check:
- **Path**: `/api/v1/health`
- **Expected Status**: `200`

---

## 🐛 Troubleshooting

### Database Not Found
- Check `DATABASE_PATH` environment variable
- Ensure `/opt/render/project/data` directory exists
- Run `npm run init-db` to recreate database

### CORS Errors
- Update `CORS_ORIGIN` environment variable
- Add your frontend domain (no trailing slash)
- Multiple origins: `https://app1.com,https://app2.com`

### JWT Errors
- Verify `JWT_SECRET` is set
- Check token expiration (`JWT_EXPIRES_IN`)
- Ensure frontend sends token in `Authorization: Bearer TOKEN` header

### Server Won't Start
- Check Render logs for errors
- Verify all required environment variables are set
- Ensure build command completed successfully

---

## 📈 Scaling

### Free Tier Limitations
- 512MB RAM
- Shared CPU
- Sleeps after 15 minutes of inactivity
- Ephemeral storage (database resets on restart)

### Recommended Upgrades
- **Starter Plan** ($7/month): Always on, 512MB RAM, persistent disk
- **Standard Plan** ($25/month): 2GB RAM, better performance
- **PostgreSQL Database**: For production data persistence

---

## 🔄 Updates & Maintenance

### Deploy Updates
1. Push changes to GitHub
2. Render automatically rebuilds and deploys
3. Or manually trigger deploy from Render dashboard

### Database Migrations
For schema changes:
1. Update schema files in `src/database/schema/`
2. Create migration script if needed
3. Run migration after deployment
4. Backup database before major changes

---

## 📞 Support

- **Render Documentation**: https://render.com/docs
- **Render Community**: https://community.render.com
- **iBooky Issues**: [Your GitHub Issues Page]

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Render service created
- [ ] Environment variables configured
- [ ] `JWT_SECRET` changed from default
- [ ] `CORS_ORIGIN` set to frontend domain
- [ ] Service deployed successfully
- [ ] Health check passing
- [ ] API documentation accessible
- [ ] First tenant registered
- [ ] Login working
- [ ] Frontend connected to API

---

**Your API is now live! 🎉**

Base URL: `https://your-app.onrender.com/api/v1`
