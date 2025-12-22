# 🌐 VPS Deployment Guide: Docker Streaming Server

This guide will help you deploy your **INBV Streaming Server** to a VPS (like AWS, DigitalOcean, Linode) and access it from anywhere using your VPS IP address.

---

## 🛠 Prerequisites

1.  **A Linux VPS** (Ubuntu 22.04 recommended)
2.  **Minimum Specs**: 2 vCPUs, 4GB RAM, 50GB+ Disk
3.  **Docker & Docker Compose** installed on the VPS

---

## 🚀 Step 1: Install Docker on your VPS

Connect to your VPS via SSH:
```bash
ssh root@YOUR_VPS_IP
```

Run these commands to install Docker:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

---

## 📂 Step 2: Upload Project to VPS

Since you have pushed the project to GitHub, it is easiest to clone it directly on the VPS:

```bash
cd /root
git clone https://github.com/dedsec-ux/Live-TV.git inbv-server
cd inbv-server
```

---

## 🏗 Step 3: Build and Start the Server

Run the following command to build the image and start the container in the background:

```bash
docker-compose up -d --build
```

**What this does:**
- Bundles Nginx, FFmpeg, and Node.js into one container.
- Sets up RTMP (1935) for streaming.
- Sets up HTTP (80/8080) for the Admin Panel and Player.
- Sets up the API (3000).

---

## 🔓 Step 4: Open Firewall Ports (CRITICAL)

To access your server from anywhere, you **must** open these ports in your VPS firewall (and in your VPS provider's dashboard like AWS Security Groups):

| Port | Protocol | Purpose |
|------|----------|---------|
| **80** | TCP | Web Interface (Admin/Player) |
| **8080** | TCP | Alternative Web Access |
| **1935** | TCP | RTMP Streaming Traffic |
| **3000** | TCP | API Server |

**Commands for Ubuntu (UFW):**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 8080/tcp
sudo ufw allow 1935/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 22/tcp  # Don't lock yourself out of SSH!
sudo ufw enable
```

---

## 📺 Step 5: Accessing Your Server

Once started, you can access your server using your VPS IP:

### 🎮 Admin Management
Go to: `http://YOUR_VPS_IP/admin-v2.html`
- Use this to create channels and upload videos.
- You can drag and drop videos directly from your local computer.

### 🎬 Public Video Player
Go to: `http://YOUR_VPS_IP/player.html`
- This is where you (or anyone) can watch the live streams.
- It will automatically show all active channels.

---

## ⚙️ Management Commands

| Action | Command |
|--------|---------|
| **View Logs** | `docker-compose logs -f` |
| **Restart Server** | `docker-compose restart` |
| **Stop Server** | `docker-compose down` |
| **Update Code** | `git pull` followed by `docker-compose up -d --build` |
| **Check Health** | `docker ps` |

---

## 💡 Pro Tips for VPS

1.  **Persistent Storage**: All your videos and configurations are stored in the `./videos` and `./playlists` folders on your VPS. They will survive even if you restart the Docker container.
2.  **IP vs Domain**: If you have a domain, point an `A Record` to your VPS IP. You can then access it via `http://yourdomain.com/admin-v2.html`.
3.  **Upload Limits**: The server is configured to handle uploads up to **10GB**. Ensure your VPS has enough disk space!

🎉 **Your 24/7 Streaming Server is now live on your VPS!**
