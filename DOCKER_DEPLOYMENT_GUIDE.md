# Docker Deployment Guide - Copy & Run!
## The Easiest Way to Deploy INBV Streaming Server

This method packages **everything** (Nginx, FFmpeg, Node.js, dependencies) into a Docker container.
**Just copy the project folder to your Linux server and run 2 commands!**

---

## Why Docker?

✅ **No manual installation** - Everything is bundled  
✅ **Works anywhere** - Any Linux server with Docker  
✅ **Consistent** - Same environment every time  
✅ **Easy updates** - Just rebuild the container  
✅ **Portable** - Move between servers easily  
✅ **Isolated** - Won't conflict with other software  

---

## Prerequisites

### On Your Linux Server:
- **Docker** installed
- **Docker Compose** installed (optional but recommended)
- At least **4GB RAM**
- At least **100GB disk space**

---

## Installation Steps

### Step 1: Install Docker on Linux Server

```bash
# Connect to your server
ssh root@YOUR_SERVER_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify installation
docker --version
# Should show: Docker version 24.x.x or higher

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker-compose --version
# Should show: docker-compose version 2.x.x or higher
```

### Step 2: Transfer Your Project to Server

**Option A: Using SCP (from your Mac)**

```bash
# On your Mac, navigate to project parent directory
cd ~/Desktop/company

# Compress the project
tar -czf inbv-streaming.tar.gz "inbv VOD live server"

# Upload to server
scp inbv-streaming.tar.gz root@YOUR_SERVER_IP:/root/

# On the server, extract
ssh root@YOUR_SERVER_IP
cd /root
tar -xzf inbv-streaming.tar.gz
mv "inbv VOD live server" inbv-streaming
cd inbv-streaming
```

**Option B: Using SFTP/FileZilla (GUI)**

1. Connect to your server with FileZilla/Cyberduck
2. Upload the entire project folder
3. Rename folder to `inbv-streaming` (no spaces)

**Option C: Using Git (if you have a repository)**

```bash
# On the server
cd /root
git clone YOUR_REPO_URL inbv-streaming
cd inbv-streaming
```

### Step 3: Build Docker Image

```bash
# On the server, in project directory
cd /root/inbv-streaming

# Build the Docker image (takes 5-10 minutes first time)
docker build -t inbv-streaming:latest .

# You'll see output like:
# Step 1/XX: FROM ubuntu:22.04
# Step 2/XX: RUN apt-get update...
# ...
# Successfully built abc123def456
# Successfully tagged inbv-streaming:latest
```

### Step 4: Run the Container

**Option A: Using Docker Compose (Recommended)**

```bash
# Start the container
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**Option B: Using Docker Run**

```bash
# Run the container
docker run -d \
  --name inbv-streaming \
  -p 80:80 \
  -p 8080:8080 \
  -p 1935:1935 \
  -p 3000:3000 \
  -v $(pwd)/videos:/opt/inbv-streaming/videos \
  -v $(pwd)/playlists:/opt/inbv-streaming/playlists \
  -v $(pwd)/logs:/opt/inbv-streaming/logs \
  --restart unless-stopped \
  inbv-streaming:latest

# Check if running
docker ps

# View logs
docker logs -f inbv-streaming
```

### Step 5: Verify Everything is Working

```bash
# Check container status
docker ps

# Should show:
# CONTAINER ID   IMAGE                    STATUS         PORTS
# abc123def456  inbv-streaming:latest    Up 2 minutes   0.0.0.0:80->80/tcp, ...

# Check logs
docker logs inbv-streaming

# Should show:
# ✅ Nginx started successfully
# ✅ Node.js API Server started
# 📺 Access Points:
#    Admin Panel: http://localhost/admin-v2.html
```

### Step 6: Access Admin Panel

Open your browser and go to:
```
http://YOUR_SERVER_IP/admin-v2.html
```

**That's it! Your streaming server is running!** 🎉

---

## Docker Management Commands

### Starting/Stopping

```bash
# Using Docker Compose:
docker-compose start          # Start container
docker-compose stop           # Stop container
docker-compose restart        # Restart container
docker-compose down           # Stop and remove container

# Using Docker:
docker start inbv-streaming   # Start
docker stop inbv-streaming    # Stop
docker restart inbv-streaming # Restart
```

### Viewing Logs

```bash
# Using Docker Compose:
docker-compose logs -f        # Follow all logs
docker-compose logs --tail=100  # Last 100 lines

# Using Docker:
docker logs -f inbv-streaming  # Follow logs
docker logs --tail=100 inbv-streaming  # Last 100 lines
```

### Accessing Container Shell

```bash
# Using Docker Compose:
docker-compose exec inbv-streaming bash

# Using Docker:
docker exec -it inbv-streaming bash

# Inside container:
ps aux                        # See running processes
ls /var/www/html             # Check HTML files
ls /opt/inbv-streaming/videos  # Check videos
exit                          # Exit container
```

### Updating Your Code

```bash
# Method 1: Rebuild completely
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Method 2: Update only code files
docker cp admin-v2.html inbv-streaming:/var/www/html/
docker restart inbv-streaming
```

---

## File Persistence

These folders are **persisted** on your server (even if container is deleted):

```
/root/inbv-streaming/
├── videos/       → Uploaded videos
├── playlists/    → Channel playlists
├── logs/         → Application logs
└── hls/          → HLS stream files
```

To backup, just zip these folders!

---

## Port Mappings

| Port | Service | Access |
|------|---------|--------|
| **80** | HTTP | Admin Panel, Player, HLS |
| **8080** | HTTP Alt | Alternative HTTP access |
| **1935** | RTMP | Streaming input |
| **3000** | API | Node.js API server |

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs for errors
docker logs inbv-streaming

# Common issues:
# 1. Port already in use
sudo netstat -tulpn | grep -E '80|1935|3000|8080'
# Kill conflicting services or change ports

# 2. Permission issues
sudo chown -R $USER:$USER videos/ playlists/ logs/
```

### Can't Access Admin Panel

```bash
# Check if nginx is running in container
docker exec inbv-streaming nginx -t

# Check if ports are open
docker port inbv-streaming

# Check firewall (if enabled)
sudo ufw allow 80/tcp
sudo ufw allow 1935/tcp
```

### Videos Not Uploading

```bash
# Check permissions
docker exec inbv-streaming ls -la /opt/inbv-streaming/videos/

# Check disk space
df -h
```

### High Memory Usage

```bash
# Check container stats
docker stats inbv-streaming

# Limit memory (if needed)
docker update --memory="4g" --memory-swap="4g" inbv-streaming
```

---

## Performance Optimization

### For Production

**1. Limit container resources:**

Edit `docker-compose.yml`:
```yaml
services:
  inbv-streaming:
    # ... existing config ...
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          memory: 4G
```

**2. Use Docker volumes for better I/O:**

```bash
# Create named volumes
docker volume create inbv-videos
docker volume create inbv-logs

# Update docker-compose.yml
volumes:
  - inbv-videos:/opt/inbv-streaming/videos
  - inbv-logs:/opt/inbv-streaming/logs
```

**3. Enable log rotation:**

Edit `docker-compose.yml`:
```yaml
services:
  inbv-streaming:
    # ... existing config ...
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## Backup & Restore

### Backup

```bash
# Stop container
docker-compose down

# Backup everything
tar -czf inbv-backup-$(date +%Y%m%d).tar.gz videos/ playlists/ logs/ channels-config.json

# Restart
docker-compose up -d
```

### Restore

```bash
# Stop container
docker-compose down

# Extract backup
tar -xzf inbv-backup-YYYYMMDD.tar.gz

# Restart
docker-compose up -d
```

---

## Updating to New Version

```bash
# On your Mac: Make changes, test locally
# Then on server:

# Pull new code (if using git)
cd /root/inbv-streaming
git pull

# Rebuild image
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# OR just rebuild without git:
# Upload new files via SCP/SFTP
# Then rebuild as above
```

---

## Auto-Start on Server Boot

```bash
# Docker is already set to auto-start
# Container restarts automatically (restart: unless-stopped)

# Verify:
sudo systemctl status docker
# Should show: enabled

# Check container restart policy:
docker inspect inbv-streaming | grep -i restart
# Should show: "UnlessStopped"
```

---

## Monitoring

### Check Service Health

```bash
# Container status
docker ps

# Resource usage
docker stats inbv-streaming

# Health check
docker inspect --format='{{.State.Health.Status}}' inbv-streaming
```

### View Active Streams

```bash
# Access RTMP stats
curl http://localhost/stat

# Or in browser:
http://YOUR_SERVER_IP/stat
```

---

## Security

### Basic Security Measures

```bash
# 1. Use firewall
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 1935/tcp  # RTMP

# 2. Change default SSH port
sudo nano /etc/ssh/sshd_config
# Change: Port 22 to Port 2222
sudo systemctl restart ssh

# 3. Disable root SSH login (after creating sudo user)
sudo nano /etc/ssh/sshd_config
# Change: PermitRootLogin yes to PermitRootLogin no

# 4. Use strong passwords or SSH keys
```

---

## Complete Deployment Summary

### Total Time: ~15 minutes

1. **Install Docker** (5 min)
2. **Upload project** (2 min)
3. **Build image** (6 min first time, ~ 1 min after)
4. **Run container** (1 min)
5. **Test** (1 min)

### Single Command Deploy (After Docker is installed)

```bash
# Upload, build, and run in one go:
cd /root/inbv-streaming && \
docker-compose build && \
docker-compose up -d && \
docker-compose logs -f
```

---

## Comparison: Docker vs Manual

| Aspect | Docker | Manual Installation |
|--------|--------|---------------------|
| **Setup Time** | 15 min | 90 min |
| **Commands** | 3 commands | 25+ commands |
| **Skills Required** | Basic | Advanced Linux knowledge |
| **Portability** | Move anywhere | Server-specific setup |
| **Updates** | Rebuild container | Manual updates |
| **Isolation** | Fully isolated | System-wide installation |
| **Rollback** | Easy (old image) | Difficult |

---

## FAQ

### Q: Can I run multiple instances?

**A:** Yes! Change the container name and ports:

```bash
# First instance (default)
docker-compose up -d

# Second instance
docker run -d \
  --name inbv-streaming-2 \
  -p 8081:80 \
  -p 1936:1935 \
  -p 3001:3000 \
  inbv-streaming:latest
```

### Q: How do I change the number of channels?

**A:** Edit `docker/nginx.conf` and rebuild:

```bash
# Add more application blocks for live11, live12, etc.
docker-compose build
docker-compose up -d
```

### Q: Can I use SSL/HTTPS?

**A:** Yes! Use nginx reverse proxy or add certbot to Dockerfile.

### Q: What if I don't have Docker experience?

**A:** No problem! Docker is easier than manual Linux server configuration. Just follow this guide step-by-step.

---

## Next Steps

1. ✅ Deploy using Docker
2. ✅ Test with a few videos
3. ✅ Point domain to server (optional)
4. ✅ Set up SSL (optional)
5. ✅ Configure monitoring
6. ✅ Set up automated backups

---

## Support

### Docker Logs
```bash
docker logs -f inbv-streaming
```

### Container Shell
```bash
docker exec -it inbv-streaming bash
```

### Check All Services
```bash
docker exec inbv-streaming ps aux
```

---

**Your complete streaming server in a box! Just copy, build, run!** 🚀📦
