# 🎛️ Stream Management Console Guide

## 🌐 Access the Admin Panel

**URL:** `http://localhost:8080/admin.html`

Or from other devices on your WiFi:
**URL:** `http://192.168.10.16:8080/admin.html`

---

## ✨ Features

### 🎮 **Master Controls**
- **▶️ Start All Streams** - Launch all 6 channels at once
- **⏹️ Stop All Streams** - Stop all running streams
- **🔄 Refresh Status** - Update stream status manually
- **📊 View Statistics** - Opens Nginx RTMP statistics page

### 📊 **System Statistics**
- Real-time count of running/stopped streams
- Estimated bandwidth usage
- Auto-updates every 5 seconds

### 📺 **Individual Channel Controls**
Each channel has:
- **Live status indicator** (🔴 LIVE or ⏹️ STOPPED)
- **HLS URL** with copy button
- **RTMP URL** with copy button
- **▶️ Start Stream** button
- **⏹️ Stop Stream** button

---

## 🚀 How to Use

### Starting Streams

**Method 1: Use the Admin Panel (Manual)**
1. Open `http://localhost:8080/admin.html`
2. Click "▶️ Start All Streams"
3. Run the command shown in terminal: `./scripts/start_all_streams.sh`

**Method 2: Direct Terminal**
```bash
./scripts/start_all_streams.sh
```

After starting, the admin panel will automatically detect running streams within 5 seconds.

### Stopping Streams

**Method 1: Use Terminal (Current)**
```bash
./scripts/stop_all_streams.sh
```

**Method 2: Admin Panel (Shows command)**
Click "⏹️ Stop All Streams" to see the command to run

### Checking Status

The admin panel automatically checks status every 5 seconds by:
- Checking if HLS playlist files exist
- Updating the status badges
- Calculating bandwidth usage

---

## 📱 Features Overview

### ✅ Currently Working:
- ✅ Real-time status monitoring
- ✅ Auto-refresh every 5 seconds
- ✅ Copy stream URLs
- ✅ Visual status indicators
- ✅ Statistics dashboard
- ✅ Responsive design (works on mobile)

### 🔜 Future Enhancements (Backend API Needed):
- ⏳ One-click start/stop from browser
- ⏳ Live log viewing
- ⏳ Video source management
- ⏳ Bandwidth statistics
- ⏳ Stream health monitoring

---

## 🎨 Status Indicators

| Status | Badge | Meaning |
|--------|-------|---------|
| 🔴 LIVE | Green pulsing | Stream is running |
| ⏹️ STOPPED | Red | Stream not running |
| Unknown | Orange | Checking status... |

---

## 💡 Tips

1. **Bookmark the admin panel** for quick access
2. **Keep it open** while streaming to monitor status
3. **Use copy buttons** to easily share stream URLs
4. **Check statistics** to see bandwidth usage
5. **Access from phone** for mobile monitoring

---

## 🔧 Troubleshooting

### Status shows "Unknown"
- Wait 5 seconds for auto-refresh
- Click "🔄 Refresh Status" button
- Make sure streams are actually running

### Streams not starting from browser
- Currently requires running terminal commands
- Backend API integration needed for browser control
- Use the terminal commands shown in notifications

### Can't access from other devices
- Make sure device is on same WiFi
- Use IP: `http://192.168.10.16:8080/admin.html`
- Check firewall settings

---

## 📚 Related Commands

### View all access URLs
```bash
./scripts/show_urls.sh
```

### Check stream status
```bash
./scripts/status_streams.sh
```

### View logs
```bash
tail -f logs/live1.log
```

---

## 🎯 Quick Start

1. **Open admin panel**: `http://localhost:8080/admin.html`
2. **Start streams**: `./scripts/start_all_streams.sh`
3. **Watch status update** automatically in the panel
4. **Copy URLs** to share with others
5. **Monitor** your 6 channels 24/7!

---

**The admin panel is now your central control hub for all stream management!** 🎉
