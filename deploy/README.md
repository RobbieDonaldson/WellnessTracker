# WellnessTracker — Deployment Guide

## Architecture

```
Browser → Cloudflare (DNS + CDN) → Nginx (port 80/443) → Express (port 5000)
                                                            ├─ /api/*     → API routes
                                                            └─ /*         → React SPA (public/index.html)
```

## Prerequisites

- Ubuntu 22.04+ VPS (Hetzner CX22 ~€4/mo recommended)
- Domain name pointed to VPS IP (A record)
- MongoDB Atlas free cluster (or local MongoDB)

## Quick Start

### 1. Provision the server

```bash
# SSH into your VPS as root
ssh root@your-server-ip

# Download and run setup script
bash setup-server.sh your-domain.com
```

This installs Node.js 22, PM2, Nginx, Certbot, creates a `deploy` user, and configures the reverse proxy.

### 2. Deploy the app

```bash
su - deploy
cd /var/www/wellness-tracker
git clone https://github.com/your-repo/WellnessTracker.git .

# Install server dependencies
cd Server
npm install --production

# Configure environment
cp .env.example .env
nano .env
```

Set these values in `.env`:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/WellnessTracker
JWT_SECRET=a-long-random-secret-string-here
CLIENT_ORIGIN=https://your-domain.com
```

### 3. Build the frontend

```bash
cd ../Client
npm install
npm run build    # outputs to Server/public/
```

### 4. Start with PM2

```bash
cd ../deploy
pm2 start ecosystem.config.js
pm2 save
pm2 startup    # follow the printed command to enable auto-start on boot
```

### 5. Enable SSL

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot auto-renews via systemd timer.

## Updating

```bash
cd /var/www/wellness-tracker
git pull
cd Client && npm install && npm run build
cd ../Server && npm install --production
pm2 reload wellness-tracker
```

## Useful Commands

| Command | Description |
|---------|-------------|
| `pm2 status` | Check app status |
| `pm2 logs wellness-tracker` | View logs |
| `pm2 reload wellness-tracker` | Zero-downtime restart |
| `pm2 monit` | Live monitoring dashboard |
| `sudo nginx -t` | Test Nginx config |
| `sudo systemctl reload nginx` | Reload Nginx |
| `sudo certbot renew --dry-run` | Test SSL renewal |

## MongoDB Atlas Setup

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free M0 cluster
3. Create a database user
4. Add your VPS IP to the Network Access allowlist
5. Copy the connection string to `.env` as `MONGO_URI`

## Monitoring (optional)

- **UptimeRobot** — free, monitor `https://your-domain.com/api/health`
- **Sentry** — free tier for error tracking
- **PM2 Plus** — free tier for 1 server monitoring
