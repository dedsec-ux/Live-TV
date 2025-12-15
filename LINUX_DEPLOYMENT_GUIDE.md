# Complete Linux Server Deployment Guide
## INBV VOD Live Streaming Server - Production Setup

This guide covers **complete deployment** on a Linux server (Ubuntu/Debian/CentOS).

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [System Requirements](#system-requirements)
3. [Installation Steps](#installation-steps)
4. [Nginx with RTMP Configuration](#nginx-rtmp-configuration)
5. [Project Setup](#project-setup)
6. [File Organization](#file-organization)
7. [Service Setup (Auto-Start)](#service-setup)
8. [Firewall Configuration](#firewall-configuration)
9. [Testing](#testing)
10. [Production Optimization](#production-optimization)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### What You Need:
- ✅ Linux server (Ubuntu 20.04+ or CentOS 7+ recommended)
- ✅ Root or sudo access
- ✅ At least 4GB RAM (8GB+ for 10 channels)
- ✅ 100GB+ storage for videos
- ✅ Public IP address or domain name
- ✅ Stable internet (50+ Mbps upload for 10 channels)

### Recommended VPS Providers:
- **DigitalOcean** - $10-20/month (2-4GB RAM)
- **Linode** - $10-20/month
- **Vultr** - $10-20/month
- **Hetzner** - $5-15/month (Europe)
- **AWS EC2** - Pay as you go

---

## System Requirements

### For 10 Channels (1080p @ 5.2 Mbps each):

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| **CPU** | 4 cores | 8 cores |
| **RAM** | 4GB | 8GB |
| **Storage** | 100GB | 250GB SSD |
| **Upload** | 60 Mbps | 100+ Mbps |
| **OS** | Ubuntu 20.04 | Ubuntu 22.04 LTS |

---

## Installation Steps

### Step 1: Connect to Your Server

```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Or with a user account
ssh username@YOUR_SERVER_IP
```

### Step 2: Update System

```bash
# Update package list
sudo apt update

# Upgrade existing packages
sudo apt upgrade -y

# Install essential tools
sudo apt install -y build-essential git curl wget unzip
```

### Step 3: Install Node.js (v18 LTS)

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

### Step 4: Install FFmpeg

```bash
# Install FFmpeg
sudo apt install -y ffmpeg

# Verify installation
ffmpeg -version

# Should show something like:
# ffmpeg version 4.x.x or higher
```

### Step 5: Install Nginx with RTMP Module

#### Option A: Using Pre-compiled Package (Easier)

```bash
# Add nginx repository
sudo add-apt-repository -y ppa:ondrej/nginx

# Install nginx with RTMP module
sudo apt update
sudo apt install -y nginx libnginx-mod-rtmp

# Verify RTMP module
nginx -V 2>&1 | grep rtmp
# Should show: --add-module=/path/to/nginx-rtmp-module
```

#### Option B: Build from Source (More Control)

```bash
# Install dependencies
sudo apt install -y libpcre3 libpcre3-dev libssl-dev zlib1g-dev

# Download nginx and RTMP module
cd /tmp
wget http://nginx.org/download/nginx-1.24.0.tar.gz
wget https://github.com/arut/nginx-rtmp-module/archive/master.zip -O rtmp-module.zip

# Extract
tar -zxvf nginx-1.24.0.tar.gz
unzip rtmp-module.zip

# Build nginx with RTMP
cd nginx-1.24.0
./configure \
    --prefix=/etc/nginx \
    --sbin-path=/usr/sbin/nginx \
    --conf-path=/etc/nginx/nginx.conf \
    --error-log-path=/var/log/nginx/error.log \
    --http-log-path=/var/log/nginx/access.log \
    --pid-path=/var/run/nginx.pid \
    --lock-path=/var/run/nginx.lock \
    --with-http_ssl_module \
    --with-http_v2_module \
    --add-module=../nginx-rtmp-module-master

make -j$(nproc)
sudo make install

# Verify
nginx -V
```

---

## Nginx RTMP Configuration

### Step 6: Create Nginx Configuration

```bash
# Backup original config
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Create new configuration
sudo nano /etc/nginx/nginx.conf
```

**Paste this complete configuration:**

```nginx
user www-data;
worker_processes auto;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

# RTMP Configuration
rtmp {
    server {
        listen 1935;
        chunk_size 4096;
        
        # Live streams
        application live1 {
            live on;
            hls on;
            hls_path /var/www/html/hls/live1;
            hls_fragment 3;
            hls_playlist_length 60;
        }
        
        application live2 {
            live on;
            hls on;
            hls_path /var/www/html/hls/live2;
            hls_fragment 3;
            hls_playlist_length 60;
        }
        
        application live3 {
            live on;
            hls on;
            hls_path /var/www/html/hls/live3;
            hls_fragment 3;
            hls_playlist_length 60;
        }
        
        application live4 {
            live on;
            hls on;
            hls_path /var/www/html/hls/live4;
            hls_fragment 3;
            hls_playlist_length 60;
        }
        
        application live5 {
            live on;
            hls on;
            hls_path /var/www/html/hls/live5;
            hls_fragment 3;
            hls_playlist_length 60;
        }
        
        application live6 {
            live on;
            hls on;
            hls_path /var/www/html/hls/live6;
            hls_fragment 3;
            hls_playlist_length 60;
        }
        
        application live7 {
            live on;
            hls on;
            hls_path /var/www/html/hls/live7;
            hls_fragment 3;
            hls_playlist_length 60;
        }
        
        application live8 {
            live on;
            hls on;
            hls_path /var/www/html/hls/live8;
            hls_fragment 3;
            hls_playlist_length 60;
        }
        
        application live9 {
            live on;
            hls on;
            hls_path /var/www/html/hls/live9;
            hls_fragment 3;
            hls_playlist_length 60;
        }
        
        application live10 {
            live on;
            hls on;
            hls_path /var/www/html/hls/live10;
            hls_fragment 3;
            hls_playlist_length 60;
        }
    }
}

# HTTP Configuration
http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
    
    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    # Main HTTP Server
    server {
        listen 80;
        server_name _;  # Replace with your domain if you have one
        
        # Root directory for static files
        root /var/www/html;
        index index.html admin.html;
        
        # Admin panel access
        location / {
            try_files $uri $uri/ =404;
        }
        
        # API Proxy (to Node.js on port 3000)
        location /api/ {
            proxy_pass http://localhost:3000/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
        
        # HLS streaming
        location /hls/ {
            types {
                application/vnd.apple.mpegurl m3u8;
                video/mp2t ts;
            }
            root /var/www/html;
            add_header Cache-Control no-cache;
            add_header Access-Control-Allow-Origin *;
        }
        
        # RTMP statistics
        location /stat {
            rtmp_stat all;
            rtmp_stat_stylesheet stat.xsl;
        }
        
        location /stat.xsl {
            root /usr/share/nginx/html;
        }
    }
}
```

**Save and exit** (Ctrl+X, then Y, then Enter)

### Step 7: Create Required Directories

```bash
# Create HLS directories for all 10 channels
sudo mkdir -p /var/www/html/hls/{live1,live2,live3,live4,live5,live6,live7,live8,live9,live10}

# Set permissions
sudo chown -R www-data:www-data /var/www/html/hls
sudo chmod -R 755 /var/www/html/hls
```

### Step 8: Test and Start Nginx

```bash
# Test configuration
sudo nginx -t

# Should show:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# Start nginx
sudo systemctl start nginx

# Enable auto-start on boot
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

---

## Project Setup

### Step 9: Upload Your Project

#### Option A: Using Git (Recommended)

```bash
# Create application directory
sudo mkdir -p /opt/inbv-streaming
cd /opt/inbv-streaming

# If you have a git repository:
# sudo git clone YOUR_REPO_URL .

# Or upload manually (see Option B)
```

#### Option B: Upload via SCP/SFTP

**On your Mac (local terminal):**

```bash
# Navigate to your project folder
cd ~/Desktop/company/inbv\ VOD\ live\ server

# Upload entire project to server
scp -r * root@YOUR_SERVER_IP:/opt/inbv-streaming/

# Or use FileZilla/Cyberduck for GUI upload
```

### Step 10: Install Node.js Dependencies

```bash
# On the server
cd /opt/inbv-streaming

# Install dependencies
npm install

# Should install: express, multer, cors, body-parser
```

### Step 11: Create Required Directories

```bash
cd /opt/inbv-streaming

# Create all necessary directories
mkdir -p videos playlists pids logs lib

# Create channel-specific video directories
mkdir -p videos/{channel1,channel2,channel3,channel4,channel5,channel6,channel7,channel8,channel9,channel10}

# Set permissions
chmod -R 755 videos playlists pids logs lib
```

---

## File Organization

### Step 12: Copy HTML Files to Nginx Directory

```bash
# Copy all HTML files to nginx web root
cd /opt/inbv-streaming
sudo cp *.html /var/www/html/

# Verify files copied
ls -lh /var/www/html/*.html

# Should show:
# admin.html
# admin-v2.html
# player.html
# embed.html
# test-stream.html
# index.html
```

### Step 13: Set Proper Permissions

```bash
# Set ownership
sudo chown -R www-data:www-data /var/www/html

# Set permissions (readable by web server)
sudo chmod -R 755 /var/www/html

# Set project permissions
sudo chown -R $USER:$USER /opt/inbv-streaming
sudo chmod -R 755 /opt/inbv-streaming
```

---

## Service Setup (Auto-Start)

### Step 14: Create Systemd Service for Node.js API

```bash
# Create service file
sudo nano /etc/systemd/system/inbv-api.service
```

**Paste this configuration:**

```ini
[Unit]
Description=INBV Streaming API Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/inbv-streaming
ExecStart=/usr/bin/node /opt/inbv-streaming/api-server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=inbv-api

# Environment
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

**Save and exit** (Ctrl+X, then Y, then Enter)

### Step 15: Enable and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service (auto-start on boot)
sudo systemctl enable inbv-api

# Start service
sudo systemctl start inbv-api

# Check status
sudo systemctl status inbv-api

# Should show: "active (running)"
```

### Step 16: View Logs

```bash
# View live logs
sudo journalctl -u inbv-api -f

# View last 100 lines
sudo journalctl -u inbv-api -n 100

# Press Ctrl+C to exit log view
```

---

## Firewall Configuration

### Step 17: Configure UFW Firewall

```bash
# Install UFW if not installed
sudo apt install -y ufw

# Allow SSH (IMPORTANT - don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow HTTP (nginx)
sudo ufw allow 80/tcp

# Allow HTTPS (for future SSL)
sudo ufw allow 443/tcp

# Allow RTMP streaming
sudo ufw allow 1935/tcp

# Allow Node.js API (if accessing directly)
sudo ufw allow 3000/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Testing

### Step 18: Test All Components

#### Test 1: Check Services Running

```bash
# Check nginx
sudo systemctl status nginx

# Check Node.js API
sudo systemctl status inbv-api

# Check if ports are listening
sudo netstat -tulpn | grep LISTEN

# Should show:
# :80 (nginx HTTP)
# :1935 (nginx RTMP)
# :3000 (Node.js API)
```

#### Test 2: Access Admin Panel

**Open in browser:**
```
http://YOUR_SERVER_IP/admin-v2.html
```

Or if you have a domain:
```
http://yourdomain.com/admin-v2.html
```

#### Test 3: Create a Test Channel

1. Click "Create New Channel"
2. Name it "Test Channel"
3. Upload a test video
4. Start the channel
5. Check if it appears in RTMP stats: `http://YOUR_SERVER_IP/stat`

#### Test 4: Test Streaming

**View HLS stream:**
```
http://YOUR_SERVER_IP/hls/live1/stream.m3u8
```

**Or use player:**
```
http://YOUR_SERVER_IP/player.html
```

---

## Production Optimization

### Step 19: Performance Tuning

#### Increase File Limits

```bash
# Edit limits
sudo nano /etc/security/limits.conf
```

**Add these lines:**
```
* soft nofile 65536
* hard nofile 65536
* soft nproc 65536
* hard nproc 65536
```

#### Optimize Nginx

```bash
# Edit nginx config
sudo nano /etc/nginx/nginx.conf
```

**Update worker_processes:**
```nginx
worker_processes auto;  # Use all CPU cores
```

#### Enable Log Rotation

```bash
# Create log rotation config
sudo nano /etc/logrotate.d/inbv-streaming
```

**Paste:**
```
/opt/inbv-streaming/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
}
```

### Step 20: Install PM2 (Alternative Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start with PM2 instead of systemd
cd /opt/inbv-streaming
pm2 start api-server.js --name inbv-api

# Auto-start on boot
pm2 startup systemd
pm2 save

# Monitor
pm2 monit

# Logs
pm2 logs inbv-api
```

### Step 21: Setup SSL (HTTPS) - Optional but Recommended

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

---

## Troubleshooting

### Common Issues

#### Issue 1: "502 Bad Gateway" on Admin Panel

**Cause:** Node.js API not running

**Fix:**
```bash
# Check service status
sudo systemctl status inbv-api

# Restart service
sudo systemctl restart inbv-api

# Check logs
sudo journalctl -u inbv-api -n 50
```

#### Issue 2: Videos Not Uploading

**Cause:** Permission issues

**Fix:**
```bash
# Set correct permissions
cd /opt/inbv-streaming
sudo chown -R www-data:www-data videos/
sudo chmod -R 755 videos/
```

#### Issue 3: Stream Not Starting

**Cause:** FFmpeg not found or RTMP server not running

**Fix:**
```bash
# Check FFmpeg
which ffmpeg

# Check nginx RTMP
sudo netstat -tulpn | grep 1935

# Restart nginx
sudo systemctl restart nginx
```

#### Issue 4: Can't Access from Outside

**Cause:** Firewall blocking

**Fix:**
```bash
# Check firewall
sudo ufw status

# Allow required ports
sudo ufw allow 80/tcp
sudo ufw allow 1935/tcp
sudo ufw allow 3000/tcp
```

### Debug Commands

```bash
# Check all services
sudo systemctl status nginx inbv-api

# Check nginx configuration
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log
sudo journalctl -u inbv-api -f

# Check disk space
df -h

# Check processes
ps aux | grep -E "nginx|node|ffmpeg"

# Check network
sudo netstat -tulpn | grep LISTEN
```

---

## Maintenance

### Regular Tasks

#### Daily:
```bash
# Check service status
sudo systemctl status nginx inbv-api

# Check disk space
df -h
```

#### Weekly:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Clean old logs
sudo journalctl --vacuum-time=7d

# Check for errors
sudo journalctl -u inbv-api --since "1 week ago" | grep -i error
```

#### Monthly:
```bash
# Review and clean old videos
cd /opt/inbv-streaming/videos
ls -lh

# Backup configuration
tar -czf backup-$(date +%Y%m%d).tar.gz /opt/inbv-streaming /etc/nginx/nginx.conf
```

---

## Quick Command Reference

```bash
# Service Management
sudo systemctl start|stop|restart|status nginx
sudo systemctl start|stop|restart|status inbv-api

# View Logs
sudo journalctl -u inbv-api -f           # Follow API logs
sudo tail -f /var/log/nginx/error.log    # Follow nginx logs

# Check Status
sudo systemctl status nginx inbv-api     # Check services
sudo netstat -tulpn | grep LISTEN       # Check listening ports

# File Management
cd /opt/inbv-streaming                  # Project directory
cd /var/www/html                        # Web root (HTML files)
cd /var/www/html/hls                    # HLS streams

# Restart Everything
sudo systemctl restart nginx inbv-api
```

---

## Summary Checklist

After deployment, verify:

- [ ] Nginx running with RTMP module
- [ ] Node.js API service running
- [ ] Firewall configured
- [ ] Admin panel accessible at `http://YOUR_IP/admin-v2.html`
- [ ] Can create channels
- [ ] Can upload videos
- [ ] Can start streams
- [ ] HLS streams accessible
- [ ] Services auto-start on boot
- [ ] Logs rotating properly

---

## Next Steps

1. **Test thoroughly** with a few videos
2. **Monitor performance** for the first few days
3. **Set up SSL** for HTTPS access
4. **Configure domain** if you have one
5. **Set up backups** for videos and config
6. **Scale up** server resources if needed

---

## Support

If you encounter issues:
1. Check logs: `sudo journalctl -u inbv-api -f`
2. Test nginx config: `sudo nginx -t`
3. Verify services: `sudo systemctl status nginx inbv-api`
4. Check firewall: `sudo ufw status`

---

**Your INBV Streaming Server is now ready for 24/7 operation!** 🚀
