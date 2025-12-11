# 🚀 **DEPLOYMENT GUIDE: Windows RDP Server**

## **Complete Guide to Run Your 24/7 Streaming System on Windows Server**

---

## 📋 **PART 1: System Requirements**

### **Minimum Specifications:**
- **OS:** Windows Server 2019/2022 or Windows 10/11 Pro
- **RAM:** 4GB minimum, 8GB recommended
- **CPU:** 4 cores minimum, 8 cores recommended
- **Storage:** 50GB+ (depends on video library)
- **Network:** Stable internet connection with public IP or port forwarding

### **Software Requirements:**
1. Node.js (v18+)
2. FFmpeg
3. nginx with RTMP module
4. ngrok (for public access) OR public IP

---

## 🔧 **PART 2: Installing Dependencies**

### **Step 1: Install Node.js**

1. **Download Node.js:**
   - Go to: https://nodejs.org/
   - Download: **LTS version** (v20+)
   - Run installer: `node-v20.x.x-x64.msi`

2. **Verify Installation:**
   ```cmd
   node --version
   npm --version
   ```

---

### **Step 2: Install FFmpeg**

#### **Option A: Using Chocolatey (Recommended)**

1. **Install Chocolatey (if not installed):**
   - Open PowerShell as Administrator
   - Run:
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force
   [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
   iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```

2. **Install FFmpeg:**
   ```cmd
   choco install ffmpeg -y
   ```

3. **Verify:**
   ```cmd
   ffmpeg -version
   ```

#### **Option B: Manual Installation**

1. **Download FFmpeg:**
   - Go to: https://www.gyan.dev/ffmpeg/builds/
   - Download: **ffmpeg-release-full.7z**

2. **Extract:**
   - Extract to: `C:\ffmpeg`

3. **Add to PATH:**
   - Right-click "This PC" → Properties → Advanced system settings
   - Environment Variables → System variables → Path
   - Click "New" → Add: `C:\ffmpeg\bin`
   - Click OK

4. **Verify:**
   ```cmd
   ffmpeg -version
   ```

---

### **Step 3: Install nginx with RTMP**

1. **Download nginx-rtmp:**
   - Go to: https://github.com/illuspas/nginx-rtmp-win32/releases
   - Download: **nginx-rtmp-win32-master.zip**

2. **Extract:**
   - Extract to: `C:\nginx`

3. **Your nginx folder should contain:**
   ```
   C:\nginx\
   ├── nginx.exe
   ├── conf\
   │   └── nginx.conf
   └── html\
   ```

---

## 📦 **PART 3: Project Setup**

### **Step 1: Transfer Your Project**

#### **Option A: Direct Copy**
1. Copy your project folder to RDP:
   ```
   C:\inbv-streaming\
   ```

#### **Option B: Download from GitHub/Cloud**
1. If hosted on GitHub:
   ```cmd
   cd C:\
   git clone YOUR-REPO-URL inbv-streaming
   cd inbv-streaming
   ```

---

### **Step 2: Install Project Dependencies**

```cmd
cd C:\inbv-streaming
npm install
```

---

### **Step 3: Configure nginx**

1. **Copy your nginx.conf to nginx folder:**
   ```cmd
   copy nginx.conf C:\nginx\conf\nginx.conf
   ```

2. **Update nginx.conf paths for Windows:**

   Open `C:\nginx\conf\nginx.conf` and change:

   **Find:**
   ```nginx
   hls_path /opt/homebrew/var/www/hls/live1;
   ```

   **Replace with:**
   ```nginx
   hls_path C:/nginx/html/hls/live1;
   ```

   **Do this for all channels (live1 through live6)**

3. **Create HLS directories:**
   ```cmd
   mkdir C:\nginx\html\hls\live1
   mkdir C:\nginx\html\hls\live2
   mkdir C:\nginx\html\hls\live3
   mkdir C:\nginx\html\hls\live4
   mkdir C:\nginx\html\hls\live5
   mkdir C:\nginx\html\hls\live6
   ```

4. **Copy web files:**
   ```cmd
   copy admin.html C:\nginx\html\
   copy player.html C:\nginx\html\
   copy embed.html C:\nginx\html\
   copy test-stream.html C:\nginx\html\
   copy index.html C:\nginx\html\
   ```

---

### **Step 4: Update Project Paths**

#### **Update api-server.js:**

Find stopChannel function and update HLS directory path:

**Find:**
```javascript
const hlsDir = `/opt/homebrew/var/www/hls/live${channelId}`;
```

**Replace with:**
```javascript
const hlsDir = `C:/nginx/html/hls/live${channelId}`;
```

---

## ▶️ **PART 4: Running the System**

### **Step 1: Start nginx**

```cmd
cd C:\nginx
start nginx.exe
```

**Verify nginx is running:**
```cmd
tasklist | findstr nginx
```

**You should see:**
```
nginx.exe    1234 Console    1    12,345 K
nginx.exe    5678 Console    1    12,345 K
```

---

### **Step 2: Start API Server**

```cmd
cd C:\inbv-streaming
npm start
```

**You should see:**
```
🚀 INBV API Server running on http://localhost:3000
[START-PIPE] ✅ Channel 1 is now LIVE with zero-downtime capability!
```

---

### **Step 3: Start ngrok (for public access)**

#### **Option A: Download ngrok**

1. **Download:**
   - Go to: https://ngrok.com/download
   - Download Windows version
   - Extract to: `C:\ngrok\`

2. **Sign up for ngrok account:**
   - Go to: https://dashboard.ngrok.com/signup
   - Get your authtoken

3. **Configure ngrok:**
   ```cmd
   cd C:\ngrok
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

4. **Start ngrok:**
   ```cmd
   ngrok http 8080
   ```

**You'll see:**
```
Forwarding    https://abc123.ngrok-free.app -> http://localhost:8080
```

**Save this URL!** This is your public stream URL.

---

## 🌐 **PART 5: Accessing Your System**

### **URLs:**

**Admin Panel:**
```
https://YOUR-NGROK-URL/admin.html
```

**Player Page:**
```
https://YOUR-NGROK-URL/player.html
```

**Embed Player:**
```
https://YOUR-NGROK-URL/embed.html?channel=1
```

**Test Stream:**
```
https://YOUR-NGROK-URL/test-stream.html
```

---

## 🔄 **PART 6: Auto-Start on Boot (Production Setup)**

### **Create Batch Scripts:**

#### **1. start-nginx.bat:**
```batch
@echo off
cd C:\nginx
start nginx.exe
echo nginx started
```

#### **2. start-api.bat:**
```batch
@echo off
cd C:\inbv-streaming
npm start
pause
```

#### **3. start-ngrok.bat:**
```batch
@echo off
cd C:\ngrok
ngrok http 8080
```

### **Run on Startup:**

1. **Press:** `Win + R`
2. **Type:** `shell:startup`
3. **Create shortcuts** to your .bat files in this folder

---

## 📊 **PART 7: Production Deployment**

### **Option 1: Keep RDP Session Active**

**Install "Remote Desktop Session Host":**
1. Server Manager → Add Roles
2. Select "Remote Desktop Services"
3. Configure to allow background sessions

### **Option 2: Use Windows Service**

**Install pm2-windows:**
```cmd
npm install -g pm2-windows-service
pm2-service-install
```

**Start API as service:**
```cmd
cd C:\inbv-streaming
pm2 start api-server.js --name "inbv-stream"
pm2 save
```

---

## 🛠️ **PART 8: Troubleshooting**

### **Issue: nginx won't start**

**Solution:**
```cmd
cd C:\nginx
nginx.exe -t
```

Check for port conflicts:
```cmd
netstat -ano | findstr :8080
```

---

### **Issue: FFmpeg not found**

**Solution:**
```cmd
where ffmpeg
```

If not found, reinstall or check PATH.

---

### **Issue: Named pipes don't work on Windows**

**Windows doesn't support named pipes the same way.**

**Solution:** Use a different approach or stick with the quick restart method on Windows.

---

## 📝 **PART 9: Regular Maintenance**

### **Daily:**
- Check stream status via admin panel
- Monitor CPU/RAM usage

### **Weekly:**
- Clear old HLS segments:
  ```cmd
  del /Q C:\nginx\html\hls\live1\*.ts
  ```

### **Monthly:**
- Update Node.js, FFmpeg, nginx
- Backup configuration files

---

## ✅ **PART 10: Quick Start Checklist**

```
☐ Install Node.js
☐ Install FFmpeg
☐ Install nginx-rtmp
☐ Copy project to C:\inbv-streaming
☐ Run npm install
☐ Update nginx.conf paths
☐ Create HLS directories
☐ Copy web files to C:\nginx\html
☐ Update api-server.js paths
☐ Start nginx
☐ Start npm start
☐ Start ngrok
☐ Test admin panel
☐ Create embed code
☐ Setup auto-start scripts
```

---

## 🎯 **PART 11: Sample nginx.conf for Windows**

```nginx
worker_processes  1;

events {
    worker_connections  1024;
}

rtmp {
    server {
        listen 1935;
        chunk_size 4096;

        application live1 {
            live on;
            record off;
            hls on;
            hls_path C:/nginx/html/hls/live1;
            hls_fragment 3;
            hls_playlist_length 60;
        }
    }
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;

    server {
        listen       8080;
        server_name  localhost;

        location / {
            root   html;
            index  index.html index.htm;
        }

        location /hls {
            types {
                application/vnd.apple.mpegurl m3u8;
                video/mp2t ts;
            }
            root C:/nginx/html;
            add_header Cache-Control no-cache;
            add_header Access-Control-Allow-Origin *;
        }
    }
}
```

---

## 🚀 **You're Ready!**

Your 24/7 streaming system is now running on Windows RDP with:
- ✅ Named Pipes (zero-downtime updates)
- ✅ 24/7 continuous streaming
- ✅ Public access via ngrok
- ✅ Professional embed player
- ✅ Admin panel for management

**Access your streams from anywhere in the world!** 🌍🎬✨
