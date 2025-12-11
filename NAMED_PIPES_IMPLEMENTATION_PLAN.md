# 🚀 Named Pipes Implementation Plan

## 📋 **Project Overview**

**Goal:** Implement zero-downtime video streaming with dynamic playlist management using Named Pipes (FIFO)

**Timeline:** 3-5 days  
**Complexity:** HIGH  
**Benefit:** TRUE real-time playlist updates with zero interruption

---

## 🎯 **What This Achieves**

### **Current System (Quick Restart):**
```
Add video → Restart stream (1 sec) → New video plays
```

### **Named Pipes System (Zero Downtime):**
```
Add video → Video added to queue → Plays on next loop
NO RESTART! ✅
```

---

## 🏗️ **Architecture**

### **High-Level Design:**

```
┌─────────────────────────────────────────────────┐
│                  Node.js Controller              │
│  - Monitors playlist changes                     │
│  - Feeds videos to pipe                          │
│  - Manages playback loop                         │
└──────────────┬──────────────────────────────────┘
               │
               ↓ (writes video data)
         ┌─────────────┐
         │ Named Pipe  │  (FIFO buffer)
         │ /tmp/live1  │
         └──────┬──────┘
                │
                ↓ (reads video data)
    ┌───────────────────────────┐
    │      FFmpeg Process        │
    │  Continuous encoding       │
    │  → RTMP → nginx → HLS     │
    └───────────────────────────┘
```

---

## 📅 **Implementation Timeline**

### **Day 1: Foundation (8 hours)**

#### **Morning (4h): Core Infrastructure**
- [ ] Create named pipe utilities module
- [ ] Implement pipe creation/management
- [ ] Build video streaming controller
- [ ] Test basic pipe read/write

#### **Afternoon (4h): FFmpeg Integration**
- [ ] Update FFmpeg args to read from pipe
- [ ] Implement continuous encoding
- [ ] Test single video through pipe
- [ ] Handle pipe errors

**Deliverable:** FFmpeg can read from pipe ✅

---

### **Day 2: Playlist Management (8 hours)**

#### **Morning (4h): Controller Logic**
- [ ] Build playlist monitor
- [ ] Implement video queueing system
- [ ] Create loop detection logic
- [ ] Test playlist changes

#### **Afternoon (4h): Video Streaming**
- [ ] Stream multiple videos sequentially
- [ ] Implement seamless transitions
- [ ] Handle video format normalization
- [ ] Test video switching

**Deliverable:** Can play multiple videos seamlessly ✅

---

### **Day 3: Dynamic Updates (8 hours)**

#### **Morning (4h): Real-time Detection**
- [ ] Implement file watcher for playlist changes
- [ ] Build video addition logic
- [ ] Create video removal handling
- [ ] Test dynamic updates

#### **Afternoon (4h): Integration**
- [ ] Connect to existing API endpoints
- [ ] Update admin panel triggers
- [ ] Implement state management
- [ ] Test full workflow

**Deliverable:** Add/remove videos without restart ✅

---

### **Day 4: Error Handling & Edge Cases (8 hours)**

#### **Morning (4h): Error Recovery**
- [ ] Pipe buffer management
- [ ] Handle video read errors
- [ ] Recover from FFmpeg crashes
- [ ] Implement failsafe restart

#### **Afternoon (4h): Edge Cases**
- [ ] Handle empty playlist
- [ ] Deal with corrupted videos
- [ ] Manage concurrent edits
- [ ] Test extreme scenarios

**Deliverable:** Robust error handling ✅

---

### **Day 5: Testing & Polish (8 hours)**

#### **Morning (4h): Comprehensive Testing**
- [ ] Stress test with many videos
- [ ] Test rapid playlist changes
- [ ] Verify memory management
- [ ] Performance optimization

#### **Afternoon (4h): Documentation & Cleanup**
- [ ] Write user guide
- [ ] Document API changes
- [ ] Create troubleshooting guide
- [ ] Final testing

**Deliverable:** Production-ready system ✅

---

## 🔧 **Technical Implementation**

### **1. Named Pipe Module** (`lib/pipe-manager.js`)

```javascript
class PipeManager {
    constructor(channelId) {
        this.pipePath = `/tmp/stream_${channelId}.pipe`;
        this.isActive = false;
    }

    async create() {
        // Create FIFO pipe
        await exec(`mkfifo ${this.pipePath}`);
    }

    async destroy() {
        // Remove pipe
        await exec(`rm -f ${this.pipePath}`);
    }

    getPath() {
        return this.pipePath;
    }
}
```

---

### **2. Video Streamer** (`lib/video-streamer.js`)

```javascript
class VideoStreamer {
    constructor(pipeManager, playlistPath) {
        this.pipe = pipeManager;
        this.playlist = playlistPath;
        this.currentIndex = 0;
        this.isStreaming = false;
    }

    async start() {
        this.isStreaming = true;
        while (this.isStreaming) {
            const videos = this.readPlaylist();
            const video = videos[this.currentIndex];
            
            await this.streamVideo(video);
            
            // Check for playlist changes before looping
            this.currentIndex = (this.currentIndex + 1) % videos.length;
        }
    }

    async streamVideo(videoPath) {
        return new Promise((resolve, reject) => {
            const stream = fs.createReadStream(videoPath);
            const pipe = fs.createWriteStream(this.pipe.getPath());
            
            stream.pipe(pipe);
            stream.on('end', resolve);
            stream.on('error', reject);
        });
    }

    readPlaylist() {
        // Re-read playlist to get latest videos
        const content = fs.readFileSync(this.playlist);
        return parsePlaylist(content);
    }

    stop() {
        this.isStreaming = false;
    }
}
```

---

### **3. FFmpeg Configuration**

```javascript
function startChannelWithPipe(channelId) {
    const pipeManager = new PipeManager(channelId);
    const videoStreamer = new VideoStreamer(pipeManager, playlistPath);
    
    // Create pipe
    await pipeManager.create();
    
    // Start FFmpeg reading from pipe
    const ffmpeg = spawn('ffmpeg', [
        '-re',
        '-i', pipeManager.getPath(),  // Read from pipe!
        '-vf', 'fps=30,scale=1280:720:...',
        '-af', 'aresample=44100',
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-f', 'flv',
        `rtmp://localhost/live${channelId}/stream`
    ]);
    
    // Start streaming videos to pipe
    videoStreamer.start();
}
```

---

### **4. Playlist Monitor** (`lib/playlist-monitor.js`)

```javascript
class PlaylistMonitor {
    constructor(playlistPath) {
        this.path = playlistPath;
        this.lastContent = this.read();
        this.watcher = null;
    }

    start(onChange) {
        this.watcher = fs.watch(this.path, (event) => {
            const newContent = this.read();
            if (newContent !== this.lastContent) {
                onChange(newContent);
                this.lastContent = newContent;
            }
        });
    }

    stop() {
        if (this.watcher) {
            this.watcher.close();
        }
    }

    read() {
        return fs.readFileSync(this.path, 'utf8');
    }
}
```

---

## ⚠️ **Challenges & Solutions**

### **Challenge 1: Pipe Buffer Size**
**Problem:** Named pipes have limited buffer (64KB)  
**Solution:** Chunk videos, implement backpressure handling

### **Challenge 2: Video Format Differences**
**Problem:** Different formats need normalization  
**Solution:** Pre-process videos or use filters (already implemented)

### **Challenge 3: Timing Synchronization**
**Problem:** Controller and FFmpeg must stay in sync  
**Solution:** Use events and heartbeats

### **Challenge 4: Error Recovery**
**Problem:** Pipe breaks if reader/writer disconnects  
**Solution:** Implement reconnection logic, fallback to restart

### **Challenge 5: Concurrent Edits**
**Problem:** Multiple playlist changes while streaming  
**Solution:** Queue changes, apply between videos

---

## 📊 **Comparison**

| Feature | Current System | Named Pipes |
|---------|----------------|-------------|
| Add Video Downtime | ~1 sec | 0 sec ✅ |
| Complexity | Low | High |
| Reliability | Very High | Medium-High |
| Maintenance | Easy | Complex |
| Playlist Check | Manual save | Automatic ✅ |
| Implementation Time | Done | 3-5 days |

---

## 🎯 **Success Criteria**

### **Must Have:**
- [ ] Zero downtime when adding videos
- [ ] Automatic playlist change detection
- [ ] Seamless video transitions
- [ ] Error recovery mechanisms
- [ ] Memory efficient

### **Nice to Have:**
- [ ] Real-time playlist editing
- [ ] Video reordering without restart
- [ ] Analytics on playback
- [ ] Multiple quality levels

---

## 🚀 **Next Steps**

### **To Start Implementation:**

1. **Confirm commitment** (3-5 full days)
2. **Backup current working system**
3. **Create feature branch** for Named Pipes
4. **Begin Day 1 tasks**

### **Resources Needed:**
- Development time: 3-5 days
- Testing environment
- Sample videos of various formats
- Monitoring tools

---

## 💰 **Cost/Benefit Analysis**

### **Benefits:**
- ✅ True zero-downtime updates
- ✅ Automatic playlist management
- ✅ Professional-grade streaming
- ✅ Competitive advantage

### **Costs:**
- ⚠️ 3-5 days development time
- ⚠️ Increased complexity
- ⚠️ More testing required
- ⚠️ Harder to debug

### **Recommendation:**
**Implement if:**
- You're adding/removing videos frequently (multiple times per hour)
- Zero downtime is critical for your use case
- You have time for thorough testing

**Skip if:**
- Current 1-second restart is acceptable
- Updates are infrequent
- Simplicity is priority

---

## ✅ **Decision Point**

**Are you ready to proceed with Named Pipes implementation?**

**YES →** We start Day 1 tomorrow  
**NO →** We optimize current system further  
**MAYBE →** Let's do a proof-of-concept first (1 day)

**What's your decision?** 🤔
