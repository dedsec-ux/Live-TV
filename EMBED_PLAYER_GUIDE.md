# 🎬 **EMBED PLAYER - Ready to Use!**

## ✅ **Your Live Stream is Ready for Embedding!**

---

## 🔗 **IFRAME EMBED CODE**

### **Copy and paste this into ANY website:**

```html
<iframe 
    src="https://YOUR-NGROK-URL/embed.html?channel=1&autoplay=1&muted=1"
    width="100%" 
    height="600" 
    frameborder="0" 
    allow="autoplay; fullscreen; picture-in-picture" 
    allowfullscreen>
</iframe>
```

**Replace `YOUR-NGROK-URL` with your actual ngrok URL!**

---

## 📺 **Direct Player URLs**

### **Channel 1:**
```
https://YOUR-NGROK-URL/embed.html?channel=1
```

### **Channel 2:**
```
https://YOUR-NGROK-URL/embed.html?channel=2
```

### **With Custom Settings:**
```
https://YOUR-NGROK-URL/embed.html?channel=1&autoplay=1&muted=1
```

---

## ⚙️ **URL Parameters**

| Parameter | Options | Default | Description |
|-----------|---------|---------|-------------|
| `channel` | 1-6 | 1 | Which channel to play |
| `autoplay` | 0 or 1 | 1 | Auto-start playback |
| `muted` | 0 or 1 | 1 | Start muted (needed for autoplay) |

---

## 🎯 **Usage Examples**

### **Example 1: WordPress/Blog**
```html
<iframe 
    src="https://YOUR-NGROK-URL/embed.html?channel=1"
    width="800" 
    height="450" 
    frameborder="0" 
    allow="autoplay; fullscreen" 
    allowfullscreen>
</iframe>
```

### **Example 2: Responsive (Full Width)**
```html
<div style="position: relative; padding-bottom: 56.25%; height: 0;">
    <iframe 
        src="https://YOUR-NGROK-URL/embed.html?channel=1&autoplay=1"
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
        frameborder="0" 
        allow="autoplay; fullscreen" 
        allowfullscreen>
    </iframe>
</div>
```

### **Example 3: Fullscreen Modal**
```html
<iframe 
    src="https://YOUR-NGROK-URL/embed.html?channel=1"
    width="100%" 
    height="100%" 
    frameborder="0" 
    allow="autoplay; fullscreen; picture-in-picture" 
    allowfullscreen 
    style="position: fixed; top: 0; left: 0; z-index: 9999;">
</iframe>
```

---

## ✨ **Features**

### **Optimized for Embedding:**
- ✅ **Auto-play** (with mute for browser compatibility)
- ✅ **Auto-retry** on connection errors (5 attempts)
- ✅ **Responsive** - works on mobile/desktop
- ✅ **Fullscreen** support
- ✅ **Picture-in-Picture** support
- ✅ **Live edge tracking** (always shows latest content)
- ✅ **Clean UI** - no branding, just video

### **Performance:**
- ✅ **Fast loading** - optimized HLS delivery
- ✅ **Low latency** - 6-10 second delay
- ✅ **Adaptive bitrate** - adjusts to connection speed
- ✅ **Error recovery** - auto-reconnects on issues

---

## 🌐 **Shareable Links**

### **For Social Media / Direct Sharing:**

**Channel 1:**
```
https://YOUR-NGROK-URL/embed.html?channel=1
```

**Channel 1 (Auto-play):**
```
https://YOUR-NGROK-URL/embed.html?channel=1&autoplay=1&muted=1
```

---

## 📱 **Mobile Compatibility**

The embed player works perfectly on:
- ✅ iOS (iPhone/iPad) - Safari
- ✅ Android - Chrome/Firefox
- ✅ Desktop - All modern browsers
- ✅ Smart TVs with browser support

---

## 🎬 **Testing Your Embed**

### **Method 1: Direct Browser Test**
1. Open: `https://YOUR-NGROK-URL/embed.html?channel=1`
2. Should auto-play (muted)
3. Click unmute to hear audio
4. ✅ Video should be playing!

### **Method 2: Test in HTML File**
Create `test.html`:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Stream Test</title>
</head>
<body style="margin: 0; padding: 20px; background: #000;">
    <h1 style="color: white;">My Live Stream</h1>
    <iframe 
        src="https://YOUR-NGROK-URL/embed.html?channel=1"
        width="100%" 
        height="600" 
        frameborder="0" 
        allow="autoplay; fullscreen" 
        allowfullscreen>
    </iframe>
</body>
</html>
```

Open in browser - should work immediately!

---

## 🔧 **Advanced Customization**

### **Hide Controls:**
Add to iframe `src`:
```
&controls=0
```

### **Different Channels:**
```html
<!-- Channel 1 -->
<iframe src="https://YOUR-NGROK-URL/embed.html?channel=1"></iframe>

<!-- Channel 2 -->
<iframe src="https://YOUR-NGROK-URL/embed.html?channel=2"></iframe>

<!-- Channel 3 -->
<iframe src="https://YOUR-NGROK-URL/embed.html?channel=3"></iframe>
```

---

## 📊 **All Available URLs**

### **Main Pages:**
```
Admin Panel:    https://YOUR-NGROK-URL/admin.html
Player Page:    https://YOUR-NGROK-URL/player.html
Embed Player:   https://YOUR-NGROK-URL/embed.html
Test Stream:    https://YOUR-NGROK-URL/test-stream.html
Landing Page:   https://YOUR-NGROK-URL/
```

### **Direct Stream URLs:**
```
HLS Stream:     https://YOUR-NGROK-URL/hls/live1/stream.m3u8
RTMP Publish:   rtmp://YOUR-DOMAIN/live1/stream
```

---

## ✅ **Quick Start Guide**

### **1. Get Your Embed Code:**
```html
<iframe 
    src="https://YOUR-NGROK-URL/embed.html?channel=1&autoplay=1&muted=1"
    width="100%" 
    height="600" 
    frameborder="0" 
    allow="autoplay; fullscreen" 
    allowfullscreen>
</iframe>
```

### **2. Replace YOUR-NGROK-URL:**
- Find your ngrok URL (e.g., `abc123.ngrok-free.app`)
- Replace in the code above

### **3. Paste Anywhere:**
- WordPress post/page
- HTML website
- Blog article
- Social media bio (as link)

### **4. Done!** ✅
Your 24/7 live stream is now embedded!

---

## 🎯 **Example: YouTube-Style Embed**

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        .video-container {
            max-width: 900px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
            border-radius: 10px;
        }
        .video-title {
            font-family: Arial, sans-serif;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
        }
        .live-badge {
            background: #ff0000;
            color: white;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 14px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="video-container">
        <div class="video-title">
            <span class="live-badge">🔴 LIVE</span>
            My 24/7 Stream
        </div>
        <iframe 
            src="https://YOUR-NGROK-URL/embed.html?channel=1&autoplay=1"
            width="100%" 
            height="500" 
            frameborder="0" 
            allow="autoplay; fullscreen" 
            allowfullscreen>
        </iframe>
    </div>
</body>
</html>
```

---

## 🚀 **You're All Set!**

**Your embedded player:**
- ✅ Loads instantly
- ✅ Auto-plays (muted by default)
- ✅ Works on all devices
- ✅ Professional quality
- ✅ 24/7 reliable streaming

**Just copy the iframe code and embed it anywhere!** 🎬✨

---

## 📞 **Support**

**Stream URLs:**
- Embed: `https://YOUR-NGROK-URL/embed.html?channel=X`
- Admin: `https://YOUR-NGROK-URL/admin.html`

**If video doesn't load:**
1. Check stream is started in admin panel
2. Try refreshing the page
3. Check browser console for errors
4. Ensure ngrok is running

**Everything is working - just embed and enjoy!** 🎉
