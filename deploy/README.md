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
nano .env
```

### 3. Configure environment

Create `Server/.env` with the following values:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/WellnessTracker
JWT_SECRET=a-long-random-secret-string-here
CLIENT_ORIGIN=https://your-domain.com
API_RATE_LIMIT=500
AUTH_RATE_LIMIT=50
```

> **CRITICAL:** `JWT_SECRET` is **required** in production. The server will refuse to start without it. Generate a strong random value:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | — | Must be `production` for deployed environments |
| `PORT` | No | `5000` | Server port |
| `MONGO_URI` | Yes | — | MongoDB connection string |
| `JWT_SECRET` | **Yes (prod)** | dev fallback | Secret for signing JWTs. App crashes if missing in production |
| `CLIENT_ORIGIN` | Yes | `http://localhost:3000` | Allowed CORS origins (comma-separated for multiple) |
| `API_RATE_LIMIT` | No | `500` | Max API requests per 15-minute window |
| `AUTH_RATE_LIMIT` | No | `50` | Max login/register requests per 15-minute window |

### 4. Build the frontend

```bash
cd ../Client
npm install
npm run build    # outputs to Server/public/
```

### 5. Start with PM2

```bash
cd ../deploy
pm2 start ecosystem.config.js
pm2 save
pm2 startup    # follow the printed command to enable auto-start on boot
```

### 6. Enable SSL

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

## Security Notes

The server includes several built-in security layers. No additional configuration is needed beyond setting the env vars above:

- **JWT tokens** expire after 7 days; `JWT_SECRET` is enforced in production
- **Rate limiting** is applied at three tiers:
  - `apiLimiter` — 500 req/15min for general API calls
  - `authLimiter` — 50 req/15min for login and registration
  - `mfaLimiter` — 10 req/15min for MFA OTP send and verify (prevents brute-force of 6-digit codes)
- **Search input** is regex-escaped server-side to prevent ReDoS
- **Sort fields** are validated against an alphanumeric whitelist
- **Avatar uploads** are validated by both file extension and MIME type (jpg, png, gif, webp only; 2 MB max)
- **MFA OTP comparison** uses `crypto.timingSafeEqual` to prevent timing attacks
- **MFA send-otp** returns a generic success response to prevent user ID enumeration
- **Helmet** sets secure HTTP headers; **CORS** restricts to `CLIENT_ORIGIN`

### MFA in Production

The server currently logs email/SMS OTPs to the console (suitable for development). For production, integrate a real provider in `mfaController.js`:
- **Email**: SendGrid, AWS SES, Resend, etc.
- **SMS**: Twilio, Vonage, etc.
- TOTP (Google Authenticator) works out of the box with no external provider needed.

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
