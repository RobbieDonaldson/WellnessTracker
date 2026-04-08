#!/bin/bash
# =============================================================================
# WellnessTracker — Ubuntu VPS Setup Script
# Run as root on a fresh Ubuntu 22.04/24.04 server
# =============================================================================

set -euo pipefail

DOMAIN="${1:-your-domain.com}"
APP_DIR="/var/www/wellness-tracker"
NODE_VERSION="22"

echo "=============================="
echo "WellnessTracker Server Setup"
echo "Domain: $DOMAIN"
echo "=============================="

# --- 1. System updates ---
echo "[1/8] Updating system..."
apt update && apt upgrade -y

# --- 2. Create deploy user ---
echo "[2/8] Creating deploy user..."
if ! id "deploy" &>/dev/null; then
  adduser --disabled-password --gecos "" deploy
  usermod -aG sudo deploy
  echo "deploy ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deploy
fi

# --- 3. Install Node.js ---
echo "[3/8] Installing Node.js ${NODE_VERSION}..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt install -y nodejs

# --- 4. Install PM2 ---
echo "[4/8] Installing PM2..."
npm install -g pm2

# --- 5. Install Nginx ---
echo "[5/8] Installing Nginx..."
apt install -y nginx
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw --force enable

# --- 6. Create app directory ---
echo "[6/8] Setting up app directory..."
mkdir -p ${APP_DIR}
chown -R deploy:deploy ${APP_DIR}

# --- 7. Configure Nginx ---
echo "[7/8] Configuring Nginx..."
cat > /etc/nginx/sites-available/wellness-tracker << NGINX_CONF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /assets/ {
        proxy_pass http://127.0.0.1:5000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    client_max_body_size 5M;
}
NGINX_CONF

ln -sf /etc/nginx/sites-available/wellness-tracker /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# --- 8. SSL with Certbot ---
echo "[8/8] Installing Certbot for SSL..."
apt install -y certbot python3-certbot-nginx
echo ""
echo "=============================="
echo "Setup complete!"
echo "=============================="
echo ""
echo "Next steps:"
echo "  1. Point your domain DNS (A record) to this server's IP"
echo "  2. Deploy the app:"
echo "     su - deploy"
echo "     cd ${APP_DIR}"
echo "     git clone <your-repo> ."
echo "     cd Server && npm install --production"
echo "     cp .env.example .env && nano .env   # set MONGO_URI, JWT_SECRET, CLIENT_ORIGIN"
echo "  3. Build frontend (or push pre-built):"
echo "     cd ../Client && npm install && npm run build"
echo "  4. Start with PM2:"
echo "     cd ../deploy"
echo "     pm2 start ecosystem.config.js"
echo "     pm2 save && pm2 startup"
echo "  5. Enable SSL:"
echo "     sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo ""
