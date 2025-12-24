# Enhanced Embed Code Feature - Testing Guide

## ✅ What's New

Your embed code now includes:
1. **All movie names** in the channel playlist
2. **Duration of each movie** in HH:MM:SS format
3. **Channel metadata** embedded in comments
4. **Test page** to preview embed codes with full details

---

## 🚀 How to Test

### Step 1: Restart Your API Server

```bash
# Stop the current server (Ctrl+C if running)
# Then restart it:
node api-server.js
```

The server needs to restart to load the new API endpoints.

---

### Step 2: Get an Embed Code

1. Open: `http://localhost:3000/player.html`
2. Find a channel that has videos
3. Click **"Copy Embed Code"** button
4. The embed code is now copied to your clipboard!

---

### Step 3: Test the Embed Code

1. Open: `http://localhost:3000/embed-test.html`
2. Paste the embed code you copied into the textarea
3. Click **"🔍 Parse & Preview"**
4. You'll see:
   - **Channel Information** (name, ID, video count)
   - **Complete Video List** with each movie's duration
   - **Total Playlist Duration** (sum of all videos)
   - **Live Preview** of the embedded player

---

## 📋 Example Embed Code Format

The new embed code looks like this:

```html
<!-- INBV Stream Embed - Channel: Channel 1 -->
<!-- Videos in this channel: 2 -->
<!-- Playlist:
1. videoplayback.mp4 (01:30:45)
2. Flipperachi.mp4 (00:03:12)
-->
<iframe 
    src="http://localhost:3000/embed.html?channel=1&autoplay=1&muted=1" 
    width="100%" 
    height="600" 
    frameborder="0" 
    allow="autoplay; fullscreen; picture-in-picture" 
    allowfullscreen
    data-channel-id="1"
    data-channel-name="Channel 1"
    data-video-count="2">
</iframe>

<!-- Channel Details:
     Name: Channel 1
     Total Videos: 2
     Video List:
1. videoplayback.mp4 (01:30:45)
2. Flipperachi.mp4 (00:03:12)
-->
```

---

## 🎯 Features

### For the Player Page (`player.html`)
- ✅ "Copy Embed Code" now fetches video durations
- ✅ Embed code includes HTML comments with all movie details
- ✅ Each video shows: name and duration in HH:MM:SS format
- ✅ Data attributes added to iframe for easy parsing

### For the Test Page (`embed-test.html`)
- ✅ Paste any embed code to preview it
- ✅ Automatically extracts channel information
- ✅ Displays all videos with their durations
- ✅ Shows total playlist duration
- ✅ Live embed preview
- ✅ Beautiful, responsive UI

### New API Endpoint
- `GET /api/channels/:id/details` - Returns channel with video durations
- Automatically calculates duration for each video using ffprobe
- Formats duration as HH:MM:SS

---

## 🔧 Technical Details

### Video Duration Detection
- Uses `ffprobe` (part of FFmpeg) to read video metadata
- Accurate to the second
- Fallback to 0 if video file not found

### Duration Format
- **Format**: `HH:MM:SS`
- **Examples**:
  - `01:30:45` = 1 hour, 30 minutes, 45 seconds
  - `00:05:23` = 5 minutes, 23 seconds
  - `02:15:00` = 2 hours, 15 minutes, 0 seconds

### Browser Compatibility
- Works on all modern browsers
- HTML comments preserve metadata even when viewing source
- Data attributes provide machine-readable metadata

---

## 📱 Use Cases

1. **Website Integration**: Copy embed code and paste into your website
2. **Documentation**: All video details are visible in the HTML source
3. **Analytics**: Parse data attributes to track what's being embedded
4. **Testing**: Use embed-test.html to verify codes before deployment

---

## 🐛 Troubleshooting

**Issue**: Durations show as "00:00:00"
- **Solution**: Make sure FFmpeg is installed (`ffmpeg -version`)
- Check that video files exist in the correct directory

**Issue**: "Copy Embed Code" doesn't include video details
- **Solution**: Restart the API server to load new endpoints
- Clear browser cache and reload player.html

**Issue**: Embed test page doesn't parse the code
- **Solution**: Make sure you copied the complete embed code including comments
- Check that the iframe tags are complete

---

## 🎉 Success!

You now have a complete embed system with:
- ✅ Movie names displayed
- ✅ Duration in HH:MM:SS format
- ✅ Test page for previewing
- ✅ Professional embed codes with metadata

Enjoy your enhanced streaming platform! 🚀
