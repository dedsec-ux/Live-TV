# INBV VOD Live Streaming Server
## 10-Channel 1080p Streaming Platform

A complete video-on-demand (VOD) to live streaming solution with channel management, video upload, and HLS streaming capabilities.

---

## 🌟 Features

✅ **10 Independent Channels** - Run up to 10 simultaneous streams  
✅ **1080p Streaming** @ 5.2 Mbps - High-quality video output  
✅ **Channel-Specific Videos** - Each channel has its own video library  
✅ **HLS Streaming** - Compatible with all modern browsers and devices  
✅ **RTMP Input** - Stream to nginx-rtmp server  
✅ **Modern Admin Panel** - Two UI versions (V1 & V2)  
✅ **Large File Support** - Upload videos up to 10GB  
✅ **Auto-Loop** - Videos loop continuously in each channel  
✅ **Zero-Downtime Updates** - Add/remove videos without stopping stream  
✅ **Docker Support** - Deploy anywhere in minutes  

---

## 📋 System Requirements

### Minimum (1-3 channels):
- **CPU**: 2 cores
- **RAM**: 2GB
- **Storage**: 50GB
- **Upload**: 20 Mbps

### Recommended (10 channels):
- **CPU**: 4-8 cores
- **RAM**: 8GB
- **Storage**: 250GB SSD
- **Upload**: 60+ Mbps

---

## 🚀 Deployment Options

### Option 1: Docker (Recommended - Easiest!)

**Perfect for:** Quick deployment, any Linux server, zero manual configuration

```bash
# Install Docker
curl -fsSL https://get.docker.com | sudo sh

# Upload project and run
cd inbv-streaming
./deploy.sh
```

**Time:** 15 minutes | **Difficulty:** ⭐  
**Guide:** [DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md)

---

### Option 2: Manual Linux Installation

**Perfect for:** Full control, custom configurations, learning

```bash
# Install dependencies
sudo apt update && sudo apt install -y nodejs ffmpeg nginx libnginx-mod-rtmp

# Configure and run
cd inbv-streaming
npm install
node api-server.js
```

**Time:** 90 minutes | **Difficulty:** ⭐⭐⭐⭐  
**Guide:** [LINUX_DEPLOYMENT_GUIDE.md](LINUX_DEPLOYMENT_GUIDE.md)

---

## 📊 Quick Start (Docker)

1. **Upload project to Linux server** (via SCP/Git/SFTP)
2. **Run deployment script**:
   ```bash
   cd inbv-streaming
   ./deploy.sh
   ```
3. **Access admin panel**:
   ```
   http://YOUR_SERVER_IP/admin-v2.html
   ```

That's it! ✨

---

## 🎛️ Admin Panels

### Admin Panel V2 (Recommended)
- **URL**: `/admin-v2.html`
- **Workflow**: Channel-first
- **Features**: Upload directly to channels, permanent deletion
- **Best For**: Dedicated channel content

### Admin Panel V1
- **URL**: `/admin.html`
- **Workflow**: Global video library
- **Features**: Share videos across channels, drag-and-drop reordering
- **Best For**: Shared content across channels

**Both panels work simultaneously!** Choose based on your workflow.

---

## 📁 Project Structure

```
inbv-streaming/
├── api-server.js           # Node.js API server
├── admin.html              # Admin Panel V1
├── admin-v2.html           # Admin Panel V2 (channel-first)
├── player.html             # HLS video player
├── embed.html              # Embeddable player
├── lib/
│   ├── video-streamer.js   # FFmpeg video processing
│   └── pipe-manager.js     # Named pipe management
├── docker/
│   ├── nginx.conf          # Nginx configuration
│   └── start.sh            # Container startup script
├── Dockerfile              # Docker image definition
├── docker-compose.yml      # Docker Compose config
├── deploy.sh               # Interactive deployment script
├── videos/                 # Uploaded videos (channel-specific)
├── playlists/              # Auto-generated playlists
├── logs/                   # Server logs
└── pids/                   # Process IDs
```

---

## 🔌 Ports

| Port | Service | Access |
|------|---------|--------|
| **80** | HTTP | Admin panels, player, HLS streams |
| **8080** | HTTP Alt | Alternative HTTP port |
| **1935** | RTMP | RTMP streaming input |
| **3000** | API | Node.js REST API |

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md) | Complete Docker deployment guide (EASIEST) |
| [DOCKER_QUICK_START.txt](DOCKER_QUICK_START.txt) | Docker quick reference card |
| [LINUX_DEPLOYMENT_GUIDE.md](LINUX_DEPLOYMENT_GUIDE.md) | Manual Linux installation guide |
| [DEPLOYMENT_QUICK_REFERENCE.txt](DEPLOYMENT_QUICK_REFERENCE.txt) | Manual deployment cheat sheet |
| [ADMIN_V2_GUIDE.md](ADMIN_V2_GUIDE.md) | Admin Panel V2 features and usage |
| [ADMIN_COMPARISON.txt](ADMIN_COMPARISON.txt) | V1 vs V2 comparison |
| [1080P_CONFIGURATION.md](1080P_CONFIGURATION.md) | 1080p streaming technical details |
| [EPIPE_FIX_DOCUMENTATION.md](EPIPE_FIX_DOCUMENTATION.md) | Error handling and debugging |
| [FILE_UPLOAD_LIMIT_CHANGES.md](FILE_UPLOAD_LIMIT_CHANGES.md) | Large file upload configuration |

---

## 🎬 Usage

### 1. Create a Channel
```
Admin Panel → Create New Channel → Enter name
```

### 2. Upload Videos
```
Select channel → Upload Videos → Choose files (up to 10GB)
```

### 3. Start Streaming
```
Click "Start Stream" → Videos loop automatically
```

### 4. View Stream
```
HLS: http://YOUR_IP/hls/live1/stream.m3u8
Player: http://YOUR_IP/player.html
```

---

## 🔧 Management

### Docker Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# Logs
docker-compose logs -f

# Rebuild
docker-compose build
```

### Manual Commands

```bash
# Start API server
node api-server.js

# Restart nginx
sudo systemctl restart nginx

# View logs
tail -f logs/*.log
```

---

## 🎨 Technical Stack

- **Backend**: Node.js + Express
- **Streaming**: FFmpeg + nginx-rtmp
- **Storage**: File system (channel-specific)
- **Protocol**: HLS (HTTP Live Streaming)
- **Video Processing**: FFmpeg normalizes all content to 1080p @ 5.2 Mbps
- **Admin UI**: Vanilla JavaScript, responsive design
- **Deployment**: Docker / Manual installation

---

## 🔍 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/channels` | GET | List all channels |
| `/api/channels` | POST | Create channel |
| `/api/channels/:id` | PUT | Update channel |
| `/api/channels/:id` | DELETE | Delete channel |
| `/api/channels/:id/start` | POST | Start streaming |
| `/api/channels/:id/stop` | POST | Stop streaming |
| `/api/channels/:id/status` | GET | Channel status |
| `/api/upload` | POST | Upload video |
| `/api/videos` | GET | List all videos |

---

## 🌐 Access Points

After deployment:

- **Admin V2**: `http://YOUR_IP/admin-v2.html`
- **Admin V1**: `http://YOUR_IP/admin.html`
- **Player**: `http://YOUR_IP/player.html`
- **RTMP Stats**: `http://YOUR_IP/stat`
- **HLS Stream**: `http://YOUR_IP/hls/live1/stream.m3u8`

---

## 🐛 Troubleshooting

### Docker Issues
```bash
# Check logs
docker logs inbv-streaming

# Restart container
docker restart inbv-streaming

# Rebuild completely
./deploy.sh → Option 6
```

### Stream Issues
```bash
# Check FFmpeg processes
ps aux | grep ffmpeg

# Check nginx
curl http://localhost/stat

# View channel logs
tail -f logs/live1.log
```

### Upload Issues
```bash
# Check file size limit (now 10GB)
grep fileSize api-server.js

# Check disk space
df -h

# Check permissions
ls -la videos/
```

---

## 📦 Backup

### Docker Deployment
```bash
# Backup videos and config
tar -czf backup-$(date +%Y%m%d).tar.gz videos/ playlists/ logs/ channels-config.json

# Restore
tar -xzf backup-YYYYMMDD.tar.gz
docker-compose restart
```

---

## 🔒 Security

Recommended security measures:

1. **Firewall**: Only open necessary ports (80, 1935, 3000)
2. **SSH**: Use key-based authentication, disable password login
3. **Updates**: Keep system and Docker images updated
4. **Monitoring**: Set up log monitoring and alerts
5. **SSL**: Add HTTPS with certbot/Let's Encrypt

---

## 📊 Performance

### Per Channel (1080p):
- **Video Bitrate**: 5000 kbps
- **Audio Bitrate**: 192 kbps
- **Total**: ~5.2 Mbps per stream
- **CPU**: ~1-2% per channel (encoding)
- **RAM**: ~200-300MB per channel

### 10 Channels Running:
- **Total Bandwidth**: ~52 Mbps upload
- **Total CPU**: 10-20% (8-core system)
- **Total RAM**: 2-3GB + OS overhead

---

## 🚨 Known Issues & Fixes

All documented in:
- `EPIPE_FIX_DOCUMENTATION.md` - Pipe errors
- `FILE_UPLOAD_LIMIT_CHANGES.md` - Upload limits

---

## 🆕 Updates & Changelog

### v2.0 (Latest)
- ✅ Docker deployment support
- ✅ Admin Panel V2 (channel-first workflow)
- ✅ 10GB file upload limit
- ✅ Channel-specific video storage
- ✅ 1080p streaming @ 5.2 Mbps
- ✅ Improved error handling (EPIPE fix)
- ✅ Interactive deployment script

### v1.0
- Initial release
- 720p streaming
- Global video library
- Admin Panel V1

---

## 📞 Support

- **Documentation**: See guides in `/docs` (all .md and .txt files)
- **Logs**: Check `logs/` directory
- **GitHub Issues**: (if applicable)

---

## 📝 License

[Your License Here]

---

## 🙏 Credits

- **nginx-rtmp-module**: [https://github.com/arut/nginx-rtmp-module](https://github.com/arut/nginx-rtmp-module)
- **FFmpeg**: [https://ffmpeg.org/](https://ffmpeg.org/)
- **Node.js**: [https://nodejs.org/](https://nodejs.org/)

---

## 🎯 Quick Decision Guide

**I want the EASIEST deployment** → Use Docker ([DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md))

**I want full control** → Manual installation ([LINUX_DEPLOYMENT_GUIDE.md](LINUX_DEPLOYMENT_GUIDE.md))

**I want to share videos across channels** → Use Admin Panel V1 (`/admin.html`)

**I want channel-specific videos** → Use Admin Panel V2 (`/admin-v2.html`)

**I have questions** → Check the relevant `.md` documentation file

---

**Built with ❤️ for high-quality VOD live streaming**

🚀 **Get started in 15 minutes with Docker!**
