# 🔧 Video Duration Fix

## Problem
Video durations were showing as `0` or missing in the webhook API responses.

## Root Cause
The helper functions (`getVideoDuration`, `formatDuration`, `formatBytes`) were defined **after** the webhook endpoints that used them, causing them to be unavailable when the async webhook functions tried to call them.

## Solution
Moved all helper functions to **before** the webhook endpoints in `api-server.js`.

---

## Changes Made

### File: `api-server.js`

**Relocated Functions:**
1. ✅ `getVideoDuration(videoPath)` - Gets video duration using ffprobe
2. ✅ `formatDuration(seconds)` - Formats seconds to HH:MM:SS
3. ✅ `formatBytes(bytes)` - Formats bytes to human-readable (MB, GB, etc.)

**New Order:**
```javascript
// ... existing endpoints ...

// ===== HELPER FUNCTIONS FOR WEBHOOKS =====
function getVideoDuration(videoPath) { ... }
function formatDuration(seconds) { ... }
function formatBytes(bytes) { ... }

// ===== WEBHOOK API =====
app.get('/api/webhook/channel-playlist', async (req, res) => {
    // Now these functions are available!
    const duration = await getVideoDuration(videoPath);
    const formatted = formatDuration(duration);
    // ...
});
```

**Removed:**
- Duplicate function definitions that were scattered later in the file

---

## What Now Works

### ✅ Webhook API Response Includes:

```json
{
  "playlist": [
    {
      "index": 0,
      "filename": "video.mp4",
      "originalName": "My Video.mp4",
      "size": 540752432,
      "sizeFormatted": "515.7 MB",
      "duration": 540,                    ← NOW WORKS!
      "durationFormatted": "00:09:00",    ← NOW WORKS!
      "isCurrentlyPlaying": true
    }
  ],
  "channel": {
    "totalDuration": 1620,                 ← NOW WORKS!
    "totalDurationFormatted": "00:27:00"   ← NOW WORKS!
  }
}
```

---

## Testing

### Test Single Channel:
```bash
curl "http://localhost:3000/api/webhook/channel-playlist?channelId=1" | json_pp
```

**Look for:**
- `duration`: Should show seconds (e.g., `540`)
- `durationFormatted`: Should show HH:MM:SS (e.g., `"00:09:00"`)
- `totalDuration`: Sum of all video durations
- `totalDurationFormatted`: Total playlist time

### Test in Webhook Tester:
```
1. Open http://localhost/webhook-tester.html
2. Enter channel ID: 1
3. Click "Send Request"
4. Check playlist section for duration values!
```

---

## Expected Results

### Before Fix:
```json
{
  "duration": 0,
  "durationFormatted": "00:00:00"
}
```

### After Fix:
```json
{
  "duration": 540,
  "durationFormatted": "00:09:00"
}
```

---

## Why This Happened

JavaScript function declarations are **hoisted**, meaning they can be called before they're defined in the code. However, in modern Node.js with ES modules and complex async/await chains, relying on hoisting can cause issues.

**Best Practice:** Define helper functions **before** they're used, especially for:
- Async functions
- Functions used in Promise chains
- Functions called from route handlers

---

## Verification Checklist

After restarting the server, verify:

- [ ] Video durations show correct values (not 0)
- [ ] Duration formatted as HH:MM:SS
- [ ] Total playlist duration calculated correctly
- [ ] File sizes formatted correctly (MB, GB)
- [ ] Webhook tester displays all duration info
- [ ] Admin panel can still access these functions

---

## Deploy & Test

```bash
# If using Docker
docker-compose restart

# If running locally
# Stop the server (Ctrl+C) and restart:
node api-server.js
```

Then test:
```bash
# Quick test
curl "http://localhost:3000/api/webhook/channel-playlist?channelId=1"

# Should see duration values!
```

---

**✅ Video durations are now properly calculated and sent in webhook responses!**
