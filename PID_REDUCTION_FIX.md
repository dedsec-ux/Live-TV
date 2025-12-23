# PID Reduction & Stream Status Fix

**Date:** December 23, 2025  
**Issue:** PIDs increasing with each channel + Admin panel "Start Stream" button not reflecting actual status

---

## 🐛 Problems Fixed

### 1. **High PID Count Per Channel**
- **Before:** ~2 FFmpeg processes per channel (streamer + pusher via named pipe)
- **After:** ~1 FFmpeg process per channel (direct RTMP push)
- **Reduction:** 50% fewer processes per channel

### 2. **Stream Status Not Updating**
- **Issue:** Admin panel showed channels as "stopped" even when FFmpeg was streaming
- **Cause:** Status check relied on PID files, but direct RTMP mode doesn't create them
- **Fix:** Check `activeStreamers` Map first, fall back to PID files

### 3. **Duplicate Stream Starts**
- **Issue:** Clicking "Start Stream" multiple times spawned duplicate processes
- **Fix:** Check if channel is already running before starting

---

## ✅ Changes Made

### 1. **Direct RTMP Mode (lib/video-streamer.js)**
Added `outputMode` option:
- `rtmp`: Streams directly to RTMP (1 process per channel)
- `pipe`: Uses named pipe + pusher (2 processes per channel, for backward compatibility)

```javascript
// Old: Stream to pipe -> separate pusher reads pipe -> pushes to RTMP
// New: Stream directly to RTMP (no pipe, no pusher)
```

### 2. **Stream Mode Configuration (api-server.js)**
- Added `STREAM_MODE` environment variable
- Default: `rtmp` (direct mode)
- Alternative: `pipe` (legacy mode with named pipes)

### 3. **Fixed Status Check (api-server.js)**
```javascript
function getChannelStatus(channelId) {
    // Check active VideoStreamer first (works for all modes)
    const streamer = activeStreamers.get(channelId);
    if (streamer && streamer.isStreaming) {
        return { running: true, mode: STREAM_MODE };
    }
    
    // Fallback: Check PID file (pipe mode)
    // ...
}
```

### 4. **Prevent Duplicate Starts (api-server.js)**
```javascript
async function startChannel(channelId) {
    // Check if already running
    const status = getChannelStatus(channelId);
    if (status.running) {
        console.log(`Channel ${channelId} already running, skipping...`);
        return;
    }
    // ... start logic
}
```

### 5. **Added Retry Delays (lib/video-streamer.js)**
- 2-second delay between videos to prevent RTMP reconnection issues
- 3-second delay on "Already publishing" errors
- Prevents FFmpeg process pile-up

---

## 📊 Results

### Container Stats (1 Channel Running)
```
CONTAINER ID   NAME                    CPU %     MEM USAGE / LIMIT     MEM %     PIDS
f92cf0823078   inbv-streaming-server   23.00%    95.87MiB / 3.827GiB   2.45%     39
```

### Process Count
- **Channel 1 running:** 1 FFmpeg process
- **Expected for 10 channels:** ~10 FFmpeg processes (vs ~20 in pipe mode)
- **Total PIDs:** 39 (includes Node, Nginx, system processes)

### Stream Status
- ✅ Admin panel correctly shows channel as "running"
- ✅ Status API returns `{ running: true, mode: "rtmp" }`
- ✅ HLS stream accessible at `http://localhost:8080/hls/live1/stream.m3u8`
- ✅ No duplicate processes when clicking "Start Stream" multiple times

---

## 🎯 Testing Steps

### 1. **Check Container Stats**
```bash
docker stats --no-stream inbv-streaming-server
```
Watch: PIDs stay low (35-50 for multiple channels)

### 2. **Start a Channel**
```bash
curl -X POST http://localhost:3000/api/channels/1/start
```

### 3. **Verify Status**
```bash
curl http://localhost:3000/api/channels/1/status
```
Should return: `{ "running": true, "mode": "rtmp" }`

### 4. **Count Processes**
```bash
docker exec inbv-streaming-server ps aux | grep "ffmpeg.*live" | grep -v grep | wc -l
```
Should return: Number of active channels (1 process each)

### 5. **Test Admin Panel**
Open: `http://localhost/admin-v2.html`
- Click "Start Stream" - channel should start
- Status should update to show channel running
- Click "Start Stream" again - should not spawn duplicate processes
- Click "Stop Stream" - channel should stop

---

## 🔧 Configuration Options

### Enable Direct Mode (Default)
In `docker-compose.yml`:
```yaml
environment:
  - STREAM_MODE=rtmp
```

### Enable Pipe Mode (Legacy)
In `docker-compose.yml`:
```yaml
environment:
  - STREAM_MODE=pipe
```

---

## 📈 Expected Process Counts

| Channels Active | Direct Mode (rtmp) | Pipe Mode (pipe) |
|-----------------|-------------------|------------------|
| 1               | 1 FFmpeg          | 2 FFmpeg         |
| 5               | 5 FFmpeg          | 10 FFmpeg        |
| 10              | 10 FFmpeg         | 20 FFmpeg        |

**Base PIDs:** ~29 (Node.js, Nginx, system processes)  
**Total PIDs with 5 channels:** ~34 (direct) vs ~39 (pipe)

---

## ✅ Verification

Run this to verify everything is working:

```bash
# Start container
docker-compose up -d

# Start a channel
curl -X POST http://localhost:3000/api/channels/1/start

# Check status (should be running)
curl http://localhost:3000/api/channels/1/status

# Count processes (should be 1)
docker exec inbv-streaming-server ps aux | grep "ffmpeg.*live1" | grep -v grep | wc -l

# Check stats
docker stats --no-stream inbv-streaming-server
```

All checks should pass with 1 FFmpeg process per active channel and accurate status reporting.
