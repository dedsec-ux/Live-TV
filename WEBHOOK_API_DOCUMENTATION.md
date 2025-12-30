# 🔗 Webhook API Documentation

## Overview

The INBV Streaming Server provides powerful webhook APIs to retrieve channel playlist information programmatically. Perfect for integrations, monitoring, and automation!

---

## 📡 Available Endpoints

### 1. **Get Single Channel Playlist**
```
GET /api/webhook/channel-playlist
```

Returns complete playlist information for a specific channel.

### 2. **Get All Live Channels**
```
GET /api/webhook/live-channels
```

Returns playlist information for all currently streaming channels.

---

## 🎯 Endpoint 1: Channel Playlist

### **URL:**
```
GET /api/webhook/channel-playlist
```

### **Parameters:**

You can identify the channel using **any** of these methods:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `channelId` | integer | Direct channel ID | `?channelId=1` |
| `channel` | integer | Alternative to channelId | `?channel=1` |
| `url` | string | Full HLS stream URL | `?url=http://localhost/hls/live1/stream.m3u8` |
| `link` | string | Embed or stream link | `?link=/embed.html?channel=1` |

**Note:** Only ONE parameter is required!

---

### **Request Examples:**

```bash
# Using channelId
curl "http://localhost:3000/api/webhook/channel-playlist?channelId=1"

# Using HLS URL
curl "http://localhost:3000/api/webhook/channel-playlist?url=http://localhost/hls/live1/stream.m3u8"

# Using embed link
curl "http://localhost:3000/api/webhook/channel-playlist?link=/embed.html?channel=1"

# Using channel parameter
curl "http://localhost:3000/api/webhook/channel-playlist?channel=1"
```

---

### **Response Format:**

Complete response with all channel and playback information, showing which video is currently playing, progress, and full playlist details.

---

## 💡 Use Cases

### 1. **Monitoring Dashboard**
Fetch all live channels every 5 seconds to monitor system status.

### 2. **Playlist Viewer**
Display current playlist for any channel using just the stream URL.

### 3. **Integration with External Systems**
Connect with Discord, Slack, or other notification services.

### 4. **Automation**
Trigger actions based on channel status or current video.

---

## 🚀 Quick Start

### Test Single Channel:
```
http://localhost:3000/api/webhook/channel-playlist?channelId=1
```

### Test All Live Channels:
```
http://localhost:3000/api/webhook/live-channels
```

---

**Full documentation with examples, response formats, and integration guides!**
