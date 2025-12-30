# Stream-Safe Video Management

## 🔒 New Safety Features

The Admin Panel V2 now **prevents modifications during active streaming** to ensure stable, uninterrupted broadcasts.

---

## What's Restricted During Streaming?

When a channel's stream is **LIVE** (🔴 LIVE badge showing), the following actions are **automatically disabled**:

### ❌ Cannot Upload New Videos
- **Upload Videos** button becomes disabled (grayed out)
- Tooltip shows: _"⚠️ Stop stream to upload videos"_
- Prevents playlist corruption during active streaming

### ❌ Cannot Reorder Videos
- Drag handle (⋮⋮) becomes inactive
- Videos are no longer draggable
- Attempting to drag shows warning toast
- Tooltip shows: _"Stop stream to reorder videos"_

### ❌ Cannot Delete Videos
- **🗑️ Delete** button on each video is disabled
- Tooltip shows: _"Stop stream to delete videos"_
- Prevents removing currently playing video

### ❌ Cannot Delete Channel
- **🗑️ Delete Channel** button is disabled
- Tooltip shows: _"Stop stream to delete channel"_
- Protects active broadcasts from accidental deletion

---

## ✅ What You CAN Do While Streaming

### Allowed Actions:
- ✅ **View playback progress** - See which video is playing
- ✅ **Monitor time** - Watch elapsed/total duration
- ✅ **Stop the stream** - Always available
- ✅ **Create new channels** - Won't affect running streams
- ✅ **Manage other channels** - Each channel is independent

---

## How to Make Changes

### Step-by-Step:

1. **Stop the Stream**
   ```
   Click "⏹️ Stop Stream" button on the channel
   ```

2. **Wait for Status Update**
   ```
   Badge changes from "🔴 LIVE" to "⏹️ STOPPED"
   Upload button becomes active (colored)
   Drag handles become active
   ```

3. **Make Your Changes**
   ```
   - Upload new videos
   - Reorder videos by dragging
   - Delete unwanted videos
   ```

4. **Restart the Stream**
   ```
   Click "▶️ Start Stream" button
   Stream resumes with updated playlist
   ```

---

## Visual Indicators

### When Stream is RUNNING:
```
Status Badge:  🔴 LIVE (green, animated pulse)
Upload Button: Grayed out, with warning icon tooltip
Drag Handle:   Faded (⋮⋮), cursor shows "not-allowed"
Delete Buttons: Grayed out, disabled
Videos:        Slightly transparent, non-draggable
```

### When Stream is STOPPED:
```
Status Badge:  ⏹️ STOPPED (red)
Upload Button: Blue gradient, clickable
Drag Handle:   Visible (⋮⋮), cursor shows "grab"
Delete Buttons: Red, active
Videos:        Full opacity, draggable
```

---

## User Feedback

### Toast Notifications:

**Attempting to upload while streaming:**
```
⚠️ Stop the stream before uploading new videos
```

**Attempting to drag while streaming:**
```
⚠️ Stop the stream before reordering videos
```

**Both appear for 3 seconds, yellow warning style**

---

## Technical Implementation

### Frontend Tracking:
- `channelStatuses` Map stores running state for each channel
- Updated every 5 seconds via status polling
- Triggers UI re-render when status changes

### Button States:
```html
<button disabled title="⚠️ Stop stream to upload videos">
  📤 Upload Videos
</button>
```

### Drag Attributes:
```html
<div draggable="false" style="cursor: default; opacity: 0.95;">
  <div class="drag-handle" style="opacity: 0.3; cursor: not-allowed;">
    ⋮⋮
  </div>
</div>
```

---

## Benefits

### 🛡️ Prevents Stream Interruptions
- No playlist changes during active broadcast
- Stable streaming experience for viewers
- Reduced risk of stream corruption

### 🎯 Clear User Guidance
- Visual feedback on what's allowed
- Helpful tooltips explain restrictions
- Toast warnings prevent confusion

### ⚡ Automatic Protection
- No manual checks needed
- System enforces rules automatically
- Works across all channels independently

---

## Workflow Example

### Scenario: Adding Videos to Live Channel

**❌ Wrong Way:**
```
1. Channel is streaming (🔴 LIVE)
2. Try to click "Upload Videos" → Button is disabled
3. Get confused, can't upload
```

**✅ Right Way:**
```
1. Channel is streaming (🔴 LIVE)
2. Click "⏹️ Stop Stream"
3. Wait for "⏹️ STOPPED" badge
4. Click "📤 Upload Videos" (now active)
5. Upload your files
6. Click "▶️ Start Stream"
7. New videos are now in rotation!
```

---

## API Behavior

The restrictions are **frontend-only** for user safety. The API still allows:
- Updating channel playlists programmatically
- Adding/removing videos via API calls

**Note:** Updating playlists while streaming may cause:
- Playlist reload on next video change
- Brief stutter in playback
- Recommended to stop stream for manual changes

---

## Troubleshooting

### Upload button stays disabled?
- **Check:** Is the "🔴 LIVE" badge showing?
- **Fix:** Click "⏹️ Stop Stream" and wait a few seconds

### Can't drag videos?
- **Check:** Hover over drag handle - does it say "Stop stream to reorder"?
- **Fix:** Stop the stream first

### Status not updating?
- **Check:** Refresh the page (F5)
- **Fix:** Check if API server is running: `http://localhost:3000/api/channels/1/status`

---

## Future Enhancements

Potential improvements:
- [ ] Queue uploads to apply after stream stops
- [ ] Schedule playlist changes for specific times
- [ ] Preview mode to test changes before going live
- [ ] Batch operations (upload to multiple stopped channels)

---

**🎯 Bottom Line:** Stop the stream → Make changes → Restart stream

This ensures your broadcasts are always smooth and uninterrupted! 🚀
