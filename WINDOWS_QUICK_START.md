# 🚀 **QUICK START: Windows RDP**

## **60-Second Setup**

### **1. Install Software:**
```cmd
# Download & Install:
- Node.js: https://nodejs.org
- FFmpeg: https://ffmpeg.org
- nginx-rtmp: https://github.com/illuspas/nginx-rtmp-win32/releases
- ngrok: https://ngrok.com/download
```

### **2. Setup Project:**
```cmd
cd C:\
mkdir inbv-streaming
# Copy your project files here
cd C:\inbv-streaming
npm install
```

### **3. Configure nginx:**
```cmd
# Copy nginx.conf to C:\nginx\conf\
# Update paths from Mac to Windows:
# /opt/homebrew/var/www/hls → C:/nginx/html/hls

# Create directories:
mkdir C:\nginx\html\hls\live1
mkdir C:\nginx\html\hls\live2
# ... etc

# Copy web files:
copy *.html C:\nginx\html\
```

### **4. Start Services:**

**Terminal 1:**
```cmd
cd C:\nginx
nginx.exe
```

**Terminal 2:**
```cmd
cd C:\inbv-streaming
npm start
```

**Terminal 3:**
```cmd
cd C:\ngrok
ngrok http 8080
```

### **5. Access:**
```
Admin: https://YOUR-NGROK-URL/admin.html
Player: https://YOUR-NGROK-URL/player.html
Embed: https://YOUR-NGROK-URL/embed.html?channel=1
```

---

## ✅ **Done!**

Your 24/7 streaming system is running on Windows RDP!

**See WINDOWS_RDP_DEPLOYMENT.md for full details.**
