# 🍎 **macOS Service Management Guide**

## **Complete Guide to Start/Stop All Services**

---

## 📋 **PART 1: Quick Commands Reference**

### **🚀 START ALL SERVICES:**

```bash
# 1. Start nginx
brew services start denji/nginx/nginx-full

# 2. Start API Server (in project directory)
cd "/Users/talalrafiq/Desktop/company/inbv VOD live server"
npm start

# 3. Start ngrok (in new terminal)
ngrok http 8080
```

### **⏹️ STOP ALL SERVICES:**

```bash
# 1. Stop API Server
# Press Ctrl+C in the terminal running npm start

# 2. Stop ngrok
# Press Ctrl+C in the terminal running ngrok

# 3. Stop nginx
brew services stop denji/nginx/nginx-full
```

---

## 🔧 **PART 2: Detailed Service Management**

### **SERVICE 1: nginx (RTMP→HLS Converter)**

#### **Start nginx:**
```bash
brew services start denji/nginx/nginx-full
```

#### **Check if nginx is running:**
```bash
brew services list | grep nginx
```

**Expected output:**
```
nginx-full started talalrafiq ~/Library/LaunchAgents/homebrew.mxcl.nginx-full.plist
```

#### **Stop nginx:**
```bash
brew services stop denji/nginx/nginx-full
```

#### **Restart nginx:**
```bash
brew services restart denji/nginx/nginx-full
```

#### **Test nginx configuration:**
```bash
nginx -t
```

#### **Manual start (without brew services):**
```bash
nginx
```

#### **Manual stop:**
```bash
nginx -s stop
```

---

### **SERVICE 2: API Server (Node.js Backend)**

#### **Start API Server:**
```bash
cd "/Users/talalrafiq/Desktop/company/inbv VOD live server"
npm start
```

**Expected output:**
```
🚀 INBV API Server running on http://localhost:3000
✅ Ready to manage streams!
[START-PIPE] ✅ Channel 1 is now LIVE with zero-downtime capability!
```

#### **Stop API Server:**
```
Press: Ctrl+C
```

#### **Run in background (with pm2):**

**Install pm2:**
```bash
npm install -g pm2
```

**Start with pm2:**
```bash
cd "/Users/talalrafiq/Desktop/company/inbv VOD live server"
pm2 start api-server.js --name "inbv-stream"
```

**Stop pm2:**
```bash
pm2 stop inbv-stream
```

**View logs:**
```bash
pm2 logs inbv-stream
```

**Restart:**
```bash
pm2 restart inbv-stream
```

**Auto-start on Mac boot:**
```bash
pm2 startup
pm2 save
```

---

### **SERVICE 3: ngrok (Public Access Tunnel)**

#### **Start ngrok:**
```bash
ngrok http 8080
```

**Expected output:**
```
Session Status    online
Forwarding        https://abc123.ngrok-free.app -> http://localhost:8080
```

**Save this URL!** You'll need it to access your streams.

#### **Stop ngrok:**
```
Press: Ctrl+C
```

#### **Run ngrok in background:**
```bash
ngrok http 8080 > /dev/null &
```

#### **Check ngrok status:**
```bash
curl http://localhost:4040/api/tunnels
```

---

## ⚡ **PART 3: Complete Startup Procedure**

### **Method 1: Manual (Step-by-Step)**

**Terminal 1 - nginx:**
```bash
brew services start denji/nginx/nginx-full
```

**Terminal 2 - API Server:**
```bash
cd "/Users/talalrafiq/Desktop/company/inbv VOD live server"
npm start
```

**Terminal 3 - ngrok:**
```bash
ngrok http 8080
```

---

### **Method 2: Automated Startup Script**

Create a file: `start-all.sh`

```bash
#!/bin/bash

echo "🚀 Starting INBV Streaming Services..."

# Start nginx
echo "1️⃣ Starting nginx..."
brew services start denji/nginx/nginx-full
sleep 2

# Start API Server in background
echo "2️⃣ Starting API Server..."
cd "/Users/talalrafiq/Desktop/company/inbv VOD live server"
npm start &
API_PID=$!
echo "API Server PID: $API_PID"
sleep 5

# Start ngrok
echo "3️⃣ Starting ngrok..."
ngrok http 8080

echo "✅ All services started!"
```

**Make it executable:**
```bash
chmod +x start-all.sh
```

**Run it:**
```bash
./start-all.sh
```

---

### **Method 3: Using pm2 (Production Setup)**

```bash
#!/bin/bash

# Start nginx
brew services start denji/nginx/nginx-full

# Start API server with pm2
cd "/Users/talalrafiq/Desktop/company/inbv VOD live server"
pm2 start api-server.js --name "inbv-stream"

# Start ngrok
ngrok http 8080
```

---

## 🛑 **PART 4: Complete Shutdown Procedure**

### **Method 1: Manual**

1. **Stop ngrok:**
   - Press `Ctrl+C` in ngrok terminal

2. **Stop API Server:**
   - Press `Ctrl+C` in npm start terminal

3. **Stop nginx:**
   ```bash
   brew services stop denji/nginx/nginx-full
   ```

---

### **Method 2: Automated Shutdown Script**

Create a file: `stop-all.sh`

```bash
#!/bin/bash

echo "🛑 Stopping INBV Streaming Services..."

# Stop API Server (if running via npm)
echo "1️⃣ Stopping API Server..."
pkill -f "node api-server.js"

# Stop ngrok
echo "2️⃣ Stopping ngrok..."
pkill -f "ngrok"

# Stop nginx
echo "3️⃣ Stopping nginx..."
brew services stop denji/nginx/nginx-full

# Clean up any stale FFmpeg processes
echo "4️⃣ Cleaning up FFmpeg..."
pkill -f "ffmpeg.*rtmp://localhost"

echo "✅ All services stopped!"
```

**Make it executable:**
```bash
chmod +x stop-all.sh
```

**Run it:**
```bash
./stop-all.sh
```

---

### **Method 3: With pm2**

```bash
#!/bin/bash

# Stop pm2 process
pm2 stop inbv-stream

# Stop ngrok
pkill -f "ngrok"

# Stop nginx
brew services stop denji/nginx/nginx-full
```

---

## 🔄 **PART 5: Restart All Services**

### **Quick Restart:**

```bash
#!/bin/bash

echo "🔄 Restarting all services..."

# Restart nginx
brew services restart denji/nginx/nginx-full

# Restart API Server (Ctrl+C in terminal, then npm start again)
# OR with pm2:
pm2 restart inbv-stream

echo "✅ Services restarted!"
```

---

## 📊 **PART 6: Service Status Check**

### **Check All Services:**

Create a file: `status.sh`

```bash
#!/bin/bash

echo "📊 INBV Service Status Check"
echo "=============================="

# Check nginx
echo -n "nginx: "
if brew services list | grep -q "nginx-full.*started"; then
    echo "✅ RUNNING"
else
    echo "❌ STOPPED"
fi

# Check API Server
echo -n "API Server: "
if pgrep -f "node api-server.js" > /dev/null; then
    echo "✅ RUNNING"
else
    echo "❌ STOPPED"
fi

# Check ngrok
echo -n "ngrok: "
if pgrep -f "ngrok" > /dev/null; then
    echo "✅ RUNNING"
    # Get ngrok URL
    URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*ngrok[^"]*' | head -1)
    echo "   URL: $URL"
else
    echo "❌ STOPPED"
fi

# Check FFmpeg processes
echo -n "Active Streams: "
STREAM_COUNT=$(pgrep -f "ffmpeg" | wc -l)
echo "$STREAM_COUNT"

echo "=============================="
```

**Make it executable:**
```bash
chmod +x status.sh
```

**Run it:**
```bash
./status.sh
```

---

## 🆘 **PART 7: Troubleshooting**

### **Issue: nginx won't start**

**Check for errors:**
```bash
nginx -t
```

**Check if port 8080 is in use:**
```bash
lsof -i :8080
```

**Kill process on port 8080:**
```bash
kill -9 $(lsof -t -i:8080)
```

**Restart nginx:**
```bash
brew services restart denji/nginx/nginx-full
```

---

### **Issue: API Server crashes**

**Check logs:**
```bash
cd "/Users/talalrafiq/Desktop/company/inbv VOD live server"
cat logs/live1.log
```

**Check for port 3000 conflict:**
```bash
lsof -i :3000
```

---

### **Issue: ngrok tunnel fails**

**Check if ngrok is authenticated:**
```bash
ngrok config check
```

**Re-authenticate:**
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

---

### **Issue: Streams won't stop**

**Kill all FFmpeg processes:**
```bash
pkill -9 -f "ffmpeg"
```

**Clean up HLS files:**
```bash
rm -rf /opt/homebrew/var/www/hls/live*/*.ts
rm -rf /opt/homebrew/var/www/hls/live*/*.m3u8
```

---

## 📝 **PART 8: Daily Operations**

### **Start of Day:**
```bash
# 1. Start all services
./start-all.sh

# 2. Check status
./status.sh

# 3. Open admin panel
open "http://localhost:8080/admin.html"
```

### **End of Day:**
```bash
# 1. Stop all channels via admin panel
# 2. Stop all services
./stop-all.sh
```

---

## 🎯 **PART 9: Production Setup (Auto-Start)**

### **Using pm2 for API Server:**

```bash
# Install pm2
npm install -g pm2

# Start API server
cd "/Users/talalrafiq/Desktop/company/inbv VOD live server"
pm2 start api-server.js --name "inbv-stream"

# Save configuration
pm2 save

# Setup auto-start on Mac boot
pm2 startup
# Follow the command it shows

# nginx already auto-starts with brew services
```

### **View all services on boot:**
```bash
pm2 list
brew services list
```

---

## ✅ **Quick Reference Card**

```bash
# START
brew services start denji/nginx/nginx-full
npm start                 # (in project directory)
ngrok http 8080          # (in new terminal)

# STOP
Ctrl+C                   # (in npm terminal)
Ctrl+C                   # (in ngrok terminal)
brew services stop denji/nginx/nginx-full

# CHECK STATUS
brew services list
ps aux | grep node
ps aux | grep ngrok

# RESTART
brew services restart denji/nginx/nginx-full
# Ctrl+C then npm start again

# CLEAN UP
pkill -f ffmpeg
rm -rf /opt/homebrew/var/www/hls/live*/*.ts
```

---

## 🚀 **You're All Set!**

Use these scripts and commands to easily manage your 24/7 streaming system on macOS!

**Save the scripts:**
- `start-all.sh` - Start everything
- `stop-all.sh` - Stop everything
- `status.sh` - Check status

**Make them executable:**
```bash
chmod +x *.sh
```

**Run them:**
```bash
./start-all.sh
./status.sh
./stop-all.sh
```
