# Running INBV Streaming Server on Mac with Docker

## Local Development & Testing Guide

This guide shows how to run the streaming server on your Mac using Docker Desktop.

---

## Prerequisites

✅ **Docker Desktop for Mac** installed  
   - Download from: https://www.docker.com/products/docker-desktop
   - Or already installed (check with: `docker --version`)

✅ **At least 8GB RAM** available for Docker  
✅ **20GB free disk space**

---

## Quick Start (3 Commands)

```bash
# 1. Navigate to project
cd ~/Desktop/company/inbv\ VOD\ live\ server

# 2. Build Docker image
docker build -t inbv-streaming:latest .

# 3. Run container
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

# 4. Access admin panel
# Open browser: http://localhost/admin-v2.html
```

---

## Step-by-Step Instructions

### Step 1: Verify Docker is Running

```bash
# Check Docker version
docker --version

# Should show: Docker version 24.x.x or higher

# Check if Docker Desktop is running
docker ps

# Should NOT show "Cannot connect to Docker daemon" error
```

If Docker is not running, open **Docker Desktop** app on your Mac.

---

### Step 2: Navigate to Project Directory

```bash
cd ~/Desktop/company/inbv\ VOD\ live\ server

# Verify you're in the right place
ls -la

# You should see:
# Dockerfile
# docker-compose.yml
# api-server.js
# admin.html
# admin-v2.html
# etc.
```

---

### Step 3: Build the Docker Image

This creates a complete image with nginx, FFmpeg, Node.js, and all dependencies.

**Option A: Using Docker Compose (Recommended)**

```bash
docker-compose build

# This will take 5-10 minutes the first time
# You'll see output like:
# Step 1/25: FROM ubuntu:22.04
# Step 2/25: RUN apt-get update...
# ...
# Successfully built abc123def456
# Successfully tagged inbv-streaming:latest
```

**Option B: Using Docker Build**

```bash
docker build -t inbv-streaming:latest .

# Same output as above
```

---

### Step 4: Run the Container

**Option A: Using Docker Compose (Easiest)**

```bash
docker-compose up -d

# The -d flag runs it in background (detached mode)

# Check if it's running
docker-compose ps
```

**Option B: Using Docker Run**

```bash
docker run -d \
  --name inbv-streaming \
  -p 80:80 \
  -p 8080:8080 \
  -p 1935:1935 \
  -p 3000:3000 \
  -v $(pwd)/videos:/opt/inbv-streaming/videos \
  -v $(pwd)/playlists:/opt/inbv-streaming/playlists \
  -v $(pwd)/logs:/opt/inbv-streaming/logs \
  --platform linux/amd64 \
  --restart unless-stopped \
  inbv-streaming:latest

# Note: --platform linux/amd64 is for M1/M2 Macs (Apple Silicon)
# Remove it if you have an Intel Mac
```

---

### Step 5: Verify Container is Running

```bash
# Check container status
docker ps

# You should see:
# CONTAINER ID   IMAGE                   STATUS         PORTS
# abc123def     inbv-streaming:latest   Up 2 minutes   0.0.0.0:80->80/tcp, ...

# View logs
docker logs inbv-streaming

# Should show:
# ✅ Nginx started successfully
# ✅ Node.js API Server started
```

---

### Step 6: Access the Admin Panel

Open your browser and go to:

```
http://localhost/admin-v2.html
```

Or:
```
http://localhost:80/admin-v2.html
```

**Alternative URLs:**
- Admin V1: `http://localhost/admin.html`
- Player: `http://localhost/player.html`
- RTMP Stats: `http://localhost/stat`
- API: `http://localhost:3000/api/channels`

---

## Managing the Container

### Start Container
```bash
docker-compose start
# OR
docker start inbv-streaming
```

### Stop Container
```bash
docker-compose stop
# OR
docker stop inbv-streaming
```

### Restart Container
```bash
docker-compose restart
# OR
docker restart inbv-streaming
```

### View Logs (Live)
```bash
docker-compose logs -f
# OR
docker logs -f inbv-streaming

# Press Ctrl+C to exit
```

### Access Container Shell
```bash
docker exec -it inbv-streaming bash

# Inside container:
ls -la /var/www/html          # Check HTML files
ls -la /opt/inbv-streaming    # Check project files
ps aux                        # See running processes
exit                          # Exit container
```

### Remove Container
```bash
docker-compose down
# OR
docker stop inbv-streaming && docker rm inbv-streaming
```

### Rebuild After Code Changes
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## Port Conflicts on Mac

If you get "port already in use" errors:

### Check What's Using Port 80
```bash
sudo lsof -i :80

# If nginx or httpd is running:
sudo nginx -s stop
# OR
sudo apachectl stop
```

### Use Alternative Ports
If port 80 is occupied, modify `docker-compose.yml`:

```yaml
ports:
  - "8080:80"      # Changed from "80:80"
  - "1935:1935"
  - "3000:3000"
```

Then access via: `http://localhost:8080/admin-v2.html`

---

## Docker Desktop Settings

For best performance on Mac:

1. Open **Docker Desktop** app
2. Go to **Settings** (gear icon)
3. **Resources** → Adjust:
   - **CPUs**: 4-6 cores
   - **Memory**: 6-8 GB
   - **Swap**: 2 GB
   - **Disk**: 100 GB
4. Click **Apply & Restart**

---

## File Persistence

These folders on your Mac are synced with the container:

```
~/Desktop/company/inbv VOD live server/
├── videos/       → Uploaded videos
├── playlists/    → Channel playlists
├── logs/         → Server logs
```

Any changes in these folders on your Mac will reflect in the container and vice versa.

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs for errors
docker logs inbv-streaming

# Common issue: Port conflicts
sudo lsof -i :80
sudo lsof -i :1935
sudo lsof -i :3000

# Kill conflicting processes or use different ports
```

### Build Fails

```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

### Can't Access Admin Panel

```bash
# Check if container is running
docker ps | grep inbv

# Check if ports are exposed
docker port inbv-streaming

# Try alternative URL
open http://localhost:8080/admin-v2.html
```

### Slow Performance

```bash
# Check Docker resource usage
docker stats inbv-streaming

# Increase Docker Desktop resources (see settings above)
```

### M1/M2 Mac Issues

If on Apple Silicon (M1/M2), add platform flag:

```bash
docker run --platform linux/amd64 ...
```

Or in `docker-compose.yml`:
```yaml
services:
  inbv-streaming:
    platform: linux/amd64
    # ... rest of config
```

---

## Testing Workflow

### 1. Create a Test Channel
```
http://localhost/admin-v2.html
→ Create New Channel
→ Name: "Test Channel"
```

### 2. Upload a Test Video
```
→ Click "Upload Videos" on test channel
→ Select a small video file
→ Wait for upload
```

### 3. Start Stream
```
→ Click "Start Stream"
→ Wait a few seconds
```

### 4. View Stream
```
Player: http://localhost/player.html
HLS URL: http://localhost/hls/live1/stream.m3u8
```

---

## Development Workflow

### Making Code Changes

1. **Stop container:**
   ```bash
   docker-compose down
   ```

2. **Make your changes** to files

3. **Rebuild and restart:**
   ```bash
   docker-compose build
   docker-compose up -d
   ```

4. **Test changes** in browser

### Hot-Reload for HTML Files

For quick HTML changes without rebuild:

```bash
# Copy updated HTML to running container
docker cp admin-v2.html inbv-streaming:/var/www/html/

# No restart needed! Just refresh browser
```

---

## Cleanup

### Remove Everything
```bash
# Stop and remove container
docker-compose down

# Remove image
docker rmi inbv-streaming:latest

# Remove unused Docker data
docker system prune -a

# Note: This keeps your videos/, playlists/, logs/ folders
```

### Free Up Disk Space
```bash
# Check Docker disk usage
docker system df

# Clean up
docker system prune -a --volumes
```

---

## Accessing from Other Devices on Your Network

### Find Your Mac's IP Address
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1

# Look for something like: 192.168.1.100
```

### Access from Phone/Tablet
```
http://192.168.1.100/admin-v2.html
```

**Note:** Make sure your Mac's firewall allows incoming connections.

---

## Production vs Development

### For Local Testing (Current Setup)
- ✅ Use `docker-compose up` with volume mounts
- ✅ Files sync between Mac and container
- ✅ Easy to make changes

### For Production Server
- ✅ Build image and deploy to Linux server
- ✅ No volume mounts (files baked into image)
- ✅ See `DOCKER_DEPLOYMENT_GUIDE.md`

---

## Comparing Docker vs npm start

| Aspect | Docker | npm start |
|--------|--------|-----------|
| **Nginx** | Included | Manual install |
| **FFmpeg** | Included | Manual install |
| **RTMP** | Configured | Manual setup |
| **Isolation** | Complete | Shares system |
| **Portability** | Run anywhere | Mac-specific |
| **Cleanup** | `docker rm` | Manual |

---

## Quick Commands Cheat Sheet

```bash
# Build
docker-compose build

# Run
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f

# Restart
docker-compose restart

# Shell
docker exec -it inbv-streaming bash

# Status
docker-compose ps

# Rebuild
docker-compose build --no-cache

# Complete cleanup
docker-compose down && docker rmi inbv-streaming:latest
```

---

## Next Steps

After testing locally:

1. ✅ **Test all features** (upload, stream, manage channels)
2. ✅ **Fix any bugs** while running locally
3. ✅ **Deploy to production** server (see `DOCKER_DEPLOYMENT_GUIDE.md`)
4. ✅ **Set up domain and SSL** for production

---

## Advantages of Local Docker Testing

✅ **Identical to production** - Same environment everywhere  
✅ **Easy cleanup** - Just delete container  
✅ **No conflicts** - Isolated from your Mac's software  
✅ **Fast iterations** - Quick rebuild and test  
✅ **Safe testing** - Won't mess up your Mac  

---

## Support

- **Container logs**: `docker logs -f inbv-streaming`
- **Shell access**: `docker exec -it inbv-streaming bash`
- **Check processes**: `docker exec inbv-streaming ps aux`
- **Docker Desktop**: Has GUI for managing containers

---

**You're now running a complete streaming server on your Mac!** 🚀

Access: http://localhost/admin-v2.html
