const express = require('express');
const multer = require('multer');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');

// Named Pipes modules
const PipeManager = require('./lib/pipe-manager');
const VideoStreamer = require('./lib/video-streamer');

const app = express();
const PORT = 3000;
const STREAM_MODE = process.env.STREAM_MODE === 'rtmp' ? 'rtmp' : (process.env.STREAM_MODE === 'pipe' ? 'pipe' : 'rtmp');

// Paths
const BASE_DIR = __dirname;
const VIDEOS_DIR = path.join(BASE_DIR, 'videos');
const PLAYLISTS_DIR = path.join(BASE_DIR, 'playlists');
const LOGS_DIR = path.join(BASE_DIR, 'logs');
const PIDS_DIR = path.join(BASE_DIR, 'pids');
const HLS_DIR = path.join(BASE_DIR, 'hls');
const CONFIG_FILE = path.join(BASE_DIR, 'channels-config.json');

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increased for large video metadata
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files (HTML, CSS, JS) from root directory
app.use(express.static(BASE_DIR));

// State management for Named Pipes
const activeStreamers = new Map(); // channelId -> VideoStreamer
const activePipes = new Map();     // channelId -> PipeManager
const activeFfmpeg = new Map();    // channelId -> FFmpeg process

// Ensure directories exist
[VIDEOS_DIR, PLAYLISTS_DIR, PIDS_DIR, LOGS_DIR, path.join(BASE_DIR, 'lib')].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// ===== ACCURATE AUTO-START SCHEDULER =====
// Check every 1 second for precise timing
console.log('[SCHEDULER] Auto-start scheduler initialized - checking every 1 second');

setInterval(async () => {
    try {
        const config = loadConfig();
        const now = new Date();
        
        for (const channel of config.channels) {
            if (channel.scheduledStartTime && channel.videos && channel.videos.length > 0) {
                const scheduledTime = new Date(channel.scheduledStartTime);
                const secondsUntil = Math.floor((scheduledTime - now) / 1000);
                
                // Start when time is reached (within 2 second window)
                if (secondsUntil <= 0 && secondsUntil >= -2) {
                    const status = getChannelStatus(channel.id);
                    if (!status.running) {
                        console.log(`[AUTO-START] ⏰ Triggering channel ${channel.id} (${channel.name})`);
                        
                        try {
                            await startChannel(channel.id);
                            console.log(`[AUTO-START] ✅ Channel ${channel.id} is now LIVE!`);
                            
                            // Clear schedule
                            const updatedConfig = loadConfig();
                            const ch = updatedConfig.channels.find(c => c.id === channel.id);
                            if (ch) {
                                ch.scheduledStartTime = null;
                                saveConfig(updatedConfig);
                            }
                        } catch (error) {
                            console.error(`[AUTO-START] ❌ Failed: ${error.message}`);
                        }
                    } else {
                        // Already running, clear schedule
                        channel.scheduledStartTime = null;
                        saveConfig(config);
                    }
                } else if (secondsUntil > 0 && secondsUntil <= 10) {
                    // Log countdown for last 10 seconds
                    console.log(`[AUTO-START] Channel ${channel.id} starting in ${secondsUntil}s`);
                }
            }
        }
    } catch (error) {
        console.error('[SCHEDULER] Error:', error.message);
    }
}, 1000); // Check every 1 second for accuracy

// Configure multer for video uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // If channelId is provided, store in channel-specific directory
        const channelId = req.body.channelId;
        let destDir = VIDEOS_DIR;

        if (channelId) {
            destDir = path.join(VIDEOS_DIR, `channel${channelId}`);
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }
        }

        cb(null, destDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Support ALL video formats - comprehensive list
        const allowedTypes = /\.(mp4|avi|mov|mkv|flv|webm|wmv|m4v|3gp|3gpp|mpeg|mpg|mpe|m2v|m4p|ogv|ogg|vob|ts|mts|m2ts|qt|yuv|rm|rmvb|asf|amv|mp2|mpe|mpv|m2v|svi|3g2|mxf|roq|nsv|f4v|f4p|f4a|f4b|divx)$/i;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = file.mimetype.startsWith('video/') || file.mimetype === 'application/octet-stream';

        if (extname || mimetype) {
            console.log(`[UPLOAD] Accepting file: ${file.originalname} (${file.mimetype})`);
            return cb(null, true);
        } else {
            console.log(`[UPLOAD-ERROR] Rejecting file: ${file.originalname} (${file.mimetype})`);
            cb(new Error('Only video files are allowed!'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 * 1024 } // 10GB limit - supports large videos
});

// Load or create config
function loadConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
    // Default config starts with empty channels - user creates their own
    const defaultConfig = {
        channels: []
    };
    saveConfig(defaultConfig);
    return defaultConfig;
}

function saveConfig(config) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// ===== API ENDPOINTS =====

// Get all channels
app.get('/api/channels', (req, res) => {
    try {
        const config = loadConfig();
        res.json({ success: true, channels: config.channels });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single channel
app.get('/api/channels/:id', (req, res) => {
    try {
        const config = loadConfig();
        const channel = config.channels.find(c => c.id === parseInt(req.params.id));
        if (channel) {
            res.json({ success: true, channel });
        } else {
            res.status(404).json({ success: false, error: 'Channel not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Schedule endpoints removed - using manual start timestamp

// Get single channel with video durations
app.get('/api/channels/:id/details', async (req, res) => {
    try {
        const config = loadConfig();
        const channel = config.channels.find(c => c.id === parseInt(req.params.id));
        if (!channel) {
            return res.status(404).json({ success: false, error: 'Channel not found' });
        }

        // Get video durations for each video
        const videosWithDurations = await Promise.all(channel.videos.map(async (video) => {
            const channelVideoPath = path.join(VIDEOS_DIR, `channel${channel.id}`, video.filename);
            const globalVideoPath = path.join(VIDEOS_DIR, video.filename);

            let videoPath = null;
            if (fs.existsSync(channelVideoPath)) {
                videoPath = channelVideoPath;
            } else if (fs.existsSync(globalVideoPath)) {
                videoPath = globalVideoPath;
            }

            let duration = 0;
            if (videoPath) {
                try {
                    duration = await getVideoDuration(videoPath);
                } catch (error) {
                    console.error(`Error getting duration for ${video.filename}:`, error);
                }
            }

            return {
                ...video,
                duration: duration,
                durationFormatted: formatDuration(duration)
            };
        }));

        const channelWithDetails = {
            ...channel,
            videos: videosWithDurations
        };

        res.json({ success: true, channel: channelWithDetails });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new channel
app.post('/api/channels', (req, res) => {
    try {
        const config = loadConfig();
        const newId = Math.max(...config.channels.map(c => c.id), 0) + 1;
        const newChannel = {
            id: newId,
            name: req.body.name || `Channel ${newId}`,
            videos: [],
            enabled: true,
            scheduledStartTime: null
        };

        // Create HLS directory for this channel
        const hlsChannelDir = path.join(HLS_DIR, `live${newId}`);
        if (!fs.existsSync(hlsChannelDir)) {
            fs.mkdirSync(hlsChannelDir, { recursive: true });
            console.log(`[CREATE] Created HLS directory: ${hlsChannelDir}`);
        }

        // Create channel-specific videos directory
        const channelVideosDir = path.join(VIDEOS_DIR, `channel${newId}`);
        if (!fs.existsSync(channelVideosDir)) {
            fs.mkdirSync(channelVideosDir, { recursive: true });
            console.log(`[CREATE] Created videos directory: ${channelVideosDir}`);
        }

        config.channels.push(newChannel);
        saveConfig(config);
        res.json({ success: true, channel: newChannel });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update channel
app.put('/api/channels/:id', (req, res) => {
    try {
        const config = loadConfig();
        const channelIndex = config.channels.findIndex(c => c.id === parseInt(req.params.id));
        if (channelIndex !== -1) {
            const channelId = parseInt(req.params.id);
            const wasRunning = getChannelStatus(channelId).running;

            // Update channel
            config.channels[channelIndex] = {
                ...config.channels[channelIndex],
                ...req.body
            };
            saveConfig(config);

            // If channel has videos, regenerate playlist
            if (config.channels[channelIndex].videos && config.channels[channelIndex].videos.length > 0) {
                generatePlaylist(channelId);
                console.log(`[UPDATE] Playlist regenerated for channel ${channelId}`);

                // With Named Pipes: NO RESTART NEEDED! 🎉
                // VideoStreamer automatically detects playlist changes between videos
                if (wasRunning) {
                    console.log(`[UPDATE-PIPE] Channel ${channelId} is LIVE - playlist updated!`);
                    console.log(`[UPDATE-PIPE] ✅ VideoStreamer will detect changes on next video - ZERO DOWNTIME!`);
                }
            }

            res.json({
                success: true,
                channel: config.channels[channelIndex],
                wasRunning: wasRunning,
                message: wasRunning ? '✅ Playlist updated! Changes will apply on next video (zero downtime)' : 'Channel updated successfully'
            });
        } else {
            res.status(404).json({ success: false, error: 'Channel not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete channel
app.delete('/api/channels/:id', (req, res) => {
    try {
        const config = loadConfig();
        const channelIndex = config.channels.findIndex(c => c.id === parseInt(req.params.id));
        if (channelIndex !== -1) {
            const channelId = parseInt(req.params.id);

            // Stop the channel first
            stopChannel(channelId);

            // Delete all videos in channel-specific directory
            const channelVideosDir = path.join(VIDEOS_DIR, `channel${channelId}`);
            if (fs.existsSync(channelVideosDir)) {
                const files = fs.readdirSync(channelVideosDir);
                files.forEach(file => {
                    fs.unlinkSync(path.join(channelVideosDir, file));
                });
                fs.rmdirSync(channelVideosDir);
                console.log(`[DELETE] Removed channel directory: ${channelVideosDir}`);
            }

            // Delete playlist file
            const playlistPath = path.join(PLAYLISTS_DIR, `playlist${channelId}.txt`);
            if (fs.existsSync(playlistPath)) {
                fs.unlinkSync(playlistPath);
            }

            // Delete log file
            const logPath = path.join(LOGS_DIR, `live${channelId}.log`);
            if (fs.existsSync(logPath)) {
                fs.unlinkSync(logPath);
            }

            // Delete HLS directory and all its files
            const hlsChannelDir = path.join(HLS_DIR, `live${channelId}`);
            if (fs.existsSync(hlsChannelDir)) {
                const hlsFiles = fs.readdirSync(hlsChannelDir);
                hlsFiles.forEach(file => {
                    fs.unlinkSync(path.join(hlsChannelDir, file));
                });
                fs.rmdirSync(hlsChannelDir);
                console.log(`[DELETE] Removed HLS directory: ${hlsChannelDir}`);
            }

            config.channels.splice(channelIndex, 1);
            saveConfig(config);
            res.json({ success: true, message: 'Channel and all its videos deleted successfully' });
        } else {
            res.status(404).json({ success: false, error: 'Channel not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add video to channel
app.post('/api/channels/:id/videos', (req, res) => {
    try {
        const config = loadConfig();
        const channel = config.channels.find(c => c.id === parseInt(req.params.id));
        if (channel) {
            const videoInfo = {
                filename: req.body.filename,
                originalName: req.body.originalName,
                size: req.body.size,
                addedAt: new Date().toISOString()
            };
            channel.videos.push(videoInfo);
            saveConfig(config);
            generatePlaylist(channel.id);
            res.json({ success: true, channel });
        } else {
            res.status(404).json({ success: false, error: 'Channel not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Remove video from channel and DELETE permanently
app.delete('/api/channels/:channelId/videos/:videoFilename', (req, res) => {
    try {
        const config = loadConfig();
        const channelId = parseInt(req.params.channelId);
        const channel = config.channels.find(c => c.id === channelId);

        if (channel) {
            const wasRunning = getChannelStatus(channelId).running;
            const videoFilename = req.params.videoFilename;

            // PERMANENTLY DELETE the video file
            const channelVideoPath = path.join(VIDEOS_DIR, `channel${channelId}`, videoFilename);
            const globalVideoPath = path.join(VIDEOS_DIR, videoFilename);

            let deleted = false;
            if (fs.existsSync(channelVideoPath)) {
                fs.unlinkSync(channelVideoPath);
                deleted = true;
                console.log(`[DELETE] Permanently deleted: ${channelVideoPath}`);
            } else if (fs.existsSync(globalVideoPath)) {
                fs.unlinkSync(globalVideoPath);
                deleted = true;
                console.log(`[DELETE] Permanently deleted: ${globalVideoPath}`);
            }

            // Remove video from channel config
            channel.videos = channel.videos.filter(v => v.filename !== videoFilename);
            saveConfig(config);

            // Regenerate playlist
            if (channel.videos.length > 0) {
                generatePlaylist(channel.id);

                // If stream was running, restart to apply changes immediately
                if (wasRunning) {
                    console.log(`[REMOVE] Channel ${channelId} is LIVE - restarting to remove video...`);
                    stopChannel(channelId);
                    setTimeout(() => {
                        try {
                            startChannel(channelId);
                            console.log(`[REMOVE] Channel ${channelId} restarted without removed video`);
                        } catch (error) {
                            console.error(`[REMOVE] Error restarting channel ${channelId}:`, error);
                        }
                    }, 500);
                }
            } else {
                // No videos left, stop the channel
                if (wasRunning) {
                    console.log(`[REMOVE] No videos left in channel ${channelId}, stopping stream`);
                    stopChannel(channelId);
                }
            }

            res.json({
                success: true,
                channel,
                deleted: deleted,
                wasRestarted: wasRunning && channel.videos.length > 0,
                wasStopped: wasRunning && channel.videos.length === 0
            });
        } else {
            res.status(404).json({ success: false, error: 'Channel not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Upload video
app.post('/api/upload', upload.single('video'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        res.json({
            success: true,
            file: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                path: req.file.path
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all uploaded videos
app.get('/api/videos', (req, res) => {
    try {
        const files = fs.readdirSync(VIDEOS_DIR)
            .filter(file => /\.(mp4|avi|mov|mkv|flv|webm|wmv|m4v|3gp|3gpp|mpeg|mpg|mpe|m2v|m4p|ogv|ogg|vob|ts|mts|m2ts|qt|yuv|rm|rmvb|asf|amv|mp2|mpe|mpv|m2v|svi|3g2|mxf|roq|nsv|f4v|f4p|f4a|f4b|divx)$/i.test(file))
            .map(file => {
                const stats = fs.statSync(path.join(VIDEOS_DIR, file));
                return {
                    filename: file,
                    size: stats.size,
                    modified: stats.mtime
                };
            });
        res.json({ success: true, videos: files });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete video file
app.delete('/api/videos/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const videoPath = path.join(VIDEOS_DIR, filename);

        // Check if file exists
        if (!fs.existsSync(videoPath)) {
            return res.status(404).json({ success: false, error: 'Video file not found' });
        }

        // Remove video from all channels
        const config = loadConfig();
        let channelsUpdated = 0;

        config.channels.forEach(channel => {
            const initialLength = channel.videos.length;
            channel.videos = channel.videos.filter(v => v.filename !== filename);
            if (channel.videos.length < initialLength) {
                channelsUpdated++;
                // Regenerate playlist for this channel
                if (channel.videos.length > 0) {
                    generatePlaylist(channel.id);
                } else {
                    // Stop channel if it has no videos left
                    stopChannel(channel.id);
                    // Delete empty playlist
                    const playlistPath = path.join(PLAYLISTS_DIR, `playlist${channel.id}.txt`);
                    if (fs.existsSync(playlistPath)) {
                        fs.unlinkSync(playlistPath);
                    }
                }
            }
        });

        saveConfig(config);

        // Delete the actual video file
        fs.unlinkSync(videoPath);

        res.json({
            success: true,
            message: 'Video deleted successfully',
            channelsUpdated: channelsUpdated
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start channel stream
app.post('/api/channels/:id/start', async (req, res) => {
    try {
        const channelId = parseInt(req.params.id);
        await startChannel(channelId);
        res.json({ success: true, message: `Channel ${channelId} started` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Stop channel stream
app.post('/api/channels/:id/stop', async (req, res) => {
    try {
        const channelId = parseInt(req.params.id);
        await stopChannel(channelId);
        res.json({ success: true, message: `Channel ${channelId} stopped` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get channel status
app.get('/api/channels/:id/status', (req, res) => {
    try {
        const channelId = parseInt(req.params.id);
        const status = getChannelStatus(channelId);
        res.json({ success: true, status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get channel playback status (current video, progress, etc.)
app.get('/api/channels/:id/playback', (req, res) => {
    try {
        const channelId = parseInt(req.params.id);
        const streamer = activeStreamers.get(channelId);

        if (!streamer) {
            return res.json({
                success: true,
                playback: {
                    isPlaying: false,
                    currentIndex: null,
                    currentVideo: null,
                    elapsedTime: 0,
                    totalDuration: 0,
                    remainingTime: 0
                }
            });
        }

        const playbackStatus = streamer.getPlaybackStatus();
        res.json({ success: true, playback: playbackStatus });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== HELPER FUNCTIONS FOR WEBHOOKS =====

// Get video duration using ffprobe
function getVideoDuration(videoPath) {
    return new Promise((resolve) => {
        const ffprobe = spawn('ffprobe', [
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            videoPath
        ]);

        let output = '';
        ffprobe.stdout.on('data', (data) => {
            output += data.toString();
        });

        ffprobe.on('close', () => {
            const duration = parseFloat(output.trim());
            resolve(isNaN(duration) ? 0 : Math.ceil(duration));
        });

        ffprobe.on('error', () => {
            resolve(0);
        });
    });
}

// Format duration in HH:MM:SS
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Format bytes to human readable
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ===== WEBHOOK API =====

// Webhook: Get channel playlist information (works with channel ID or stream URL)
app.get('/api/webhook/channel-playlist', async (req, res) => {
    try {
        const { channel, channelId, url, link } = req.query;

        // Extract channel ID from various input formats
        let resolvedChannelId = null;

        if (channelId) {
            resolvedChannelId = parseInt(channelId);
        } else if (channel) {
            resolvedChannelId = parseInt(channel);
        } else if (url || link) {
            const inputUrl = url || link;
            // Extract from HLS URL: /hls/live1/stream.m3u8 -> 1
            const hlsMatch = inputUrl.match(/\/hls\/live(\d+)/);
            if (hlsMatch) {
                resolvedChannelId = parseInt(hlsMatch[1]);
            }
            // Extract from embed URL: embed.html?channel=1
            const embedMatch = inputUrl.match(/[?&]channel=(\d+)/);
            if (embedMatch) {
                resolvedChannelId = parseInt(embedMatch[1]);
            }
            // Extract from direct channel reference: live1, live2, etc.
            const directMatch = inputUrl.match(/live(\d+)/);
            if (directMatch && !resolvedChannelId) {
                resolvedChannelId = parseInt(directMatch[1]);
            }
        }

        if (!resolvedChannelId) {
            return res.status(400).json({
                success: false,
                error: 'Missing channel identifier',
                message: 'Provide one of: channelId, channel, url, or link parameter',
                examples: [
                    '/api/webhook/channel-playlist?channelId=1',
                    '/api/webhook/channel-playlist?url=http://localhost/hls/live1/stream.m3u8',
                    '/api/webhook/channel-playlist?link=/embed.html?channel=1'
                ]
            });
        }

        // Load channel configuration
        const config = loadConfig();
        const channelData = config.channels.find(c => c.id === resolvedChannelId);

        if (!channelData) {
            return res.status(404).json({
                success: false,
                error: 'Channel not found',
                channelId: resolvedChannelId
            });
        }

        // Get channel status
        const status = getChannelStatus(resolvedChannelId);

        // Get playback status if channel is running
        let playbackInfo = null;
        if (status.running) {
            const streamer = activeStreamers.get(resolvedChannelId);
            if (streamer) {
                playbackInfo = streamer.getPlaybackStatus();
            }
        }
        
        // Get actual start time if channel was started
        const actualStartTime = channelData.actualStartTime || null;
        const actualStartFormatted = actualStartTime ? 
            new Date(actualStartTime).toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'long' }) + ' UTC' : null;

        // Get video details with durations
        const videosWithDetails = await Promise.all(channelData.videos.map(async (video, index) => {
            const channelVideoPath = path.join(VIDEOS_DIR, `channel${resolvedChannelId}`, video.filename);
            const globalVideoPath = path.join(VIDEOS_DIR, video.filename);

            let videoPath = null;
            if (fs.existsSync(channelVideoPath)) {
                videoPath = channelVideoPath;
            } else if (fs.existsSync(globalVideoPath)) {
                videoPath = globalVideoPath;
            }

            let duration = 0;
            if (videoPath) {
                try {
                    duration = await getVideoDuration(videoPath);
                } catch (error) {
                    console.error(`Error getting duration for ${video.filename}:`, error);
                }
            }

            return {
                index: index,
                filename: video.filename,
                originalName: video.originalName || video.filename,
                size: video.size,
                sizeFormatted: formatBytes(video.size),
                duration: duration,
                durationFormatted: formatDuration(duration),
                addedAt: video.addedAt,
                isCurrentlyPlaying: playbackInfo && playbackInfo.isPlaying && playbackInfo.currentIndex === index
            };
        }));

        // Calculate total duration
        const totalDuration = videosWithDetails.reduce((sum, v) => sum + v.duration, 0);

        // Build response
        const host = req.get('host');
        const protocol = req.protocol;

        const response = {
            success: true,
            timestamp: new Date().toISOString(),
            channel: {
                id: channelData.id,
                name: channelData.name,
                enabled: channelData.enabled,
                isLive: status.running,
                videoCount: channelData.videos.length,
                totalDuration: totalDuration,
                totalDurationFormatted: formatDuration(totalDuration),
                actualStartTime: actualStartTime,
                actualStartFormatted: actualStartFormatted
            },
            playback: status.running ? {
                isPlaying: playbackInfo?.isPlaying || false,
                currentVideoIndex: playbackInfo?.currentIndex ?? null,
                currentVideoName: playbackInfo?.currentVideo ?? null,
                elapsedTime: playbackInfo?.elapsedTime || 0,
                elapsedTimeFormatted: formatDuration(playbackInfo?.elapsedTime || 0),
                totalVideoDuration: playbackInfo?.totalDuration || 0,
                totalVideoDurationFormatted: formatDuration(playbackInfo?.totalDuration || 0),
                remainingTime: playbackInfo?.remainingTime || 0,
                remainingTimeFormatted: formatDuration(playbackInfo?.remainingTime || 0),
                playlistLength: playbackInfo?.playlistLength || 0
            } : {
                isPlaying: false,
                message: 'Channel is offline'
            },
            playlist: videosWithDetails,
            streamUrls: {
                hls: `${protocol}://${host}/hls/live${resolvedChannelId}/stream.m3u8`,
                rtmp: `rtmp://${host.split(':')[0]}/live${resolvedChannelId}/stream`,
                embed: `${protocol}://${host}/embed.html?channel=${resolvedChannelId}`,
                player: `${protocol}://${host}/player.html`
            },
            apiEndpoints: {
                status: `${protocol}://${host}/api/channels/${resolvedChannelId}/status`,
                playback: `${protocol}://${host}/api/channels/${resolvedChannelId}/playback`,
                details: `${protocol}://${host}/api/channels/${resolvedChannelId}/details`,
                start: `${protocol}://${host}/api/channels/${resolvedChannelId}/start`,
                stop: `${protocol}://${host}/api/channels/${resolvedChannelId}/stop`
            }
        };

        res.json(response);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Webhook: Get playlist for all live channels
app.get('/api/webhook/live-channels', async (req, res) => {
    try {
        const config = loadConfig();
        const liveChannels = [];

        for (const channel of config.channels) {
            const status = getChannelStatus(channel.id);
            if (status.running) {
                // Get playback info
                const streamer = activeStreamers.get(channel.id);
                const playbackInfo = streamer ? streamer.getPlaybackStatus() : null;

                // Get video details
                const videosWithDetails = await Promise.all(channel.videos.map(async (video, index) => {
                    const channelVideoPath = path.join(VIDEOS_DIR, `channel${channel.id}`, video.filename);
                    const globalVideoPath = path.join(VIDEOS_DIR, video.filename);

                    let videoPath = null;
                    if (fs.existsSync(channelVideoPath)) {
                        videoPath = channelVideoPath;
                    } else if (fs.existsSync(globalVideoPath)) {
                        videoPath = globalVideoPath;
                    }

                    let duration = 0;
                    if (videoPath) {
                        try {
                            duration = await getVideoDuration(videoPath);
                        } catch (error) {
                            console.error(`Error getting duration:`, error);
                        }
                    }

                    return {
                        index: index,
                        filename: video.filename,
                        originalName: video.originalName || video.filename,
                        duration: duration,
                        durationFormatted: formatDuration(duration),
                        isCurrentlyPlaying: playbackInfo && playbackInfo.isPlaying && playbackInfo.currentIndex === index
                    };
                }));

                const host = req.get('host');
                const protocol = req.protocol;

                liveChannels.push({
                    id: channel.id,
                    name: channel.name,
                    currentVideo: playbackInfo?.currentVideo ?? null,
                    currentVideoIndex: playbackInfo?.currentIndex ?? null,
                    elapsedTime: playbackInfo?.elapsedTime || 0,
                    elapsedTimeFormatted: formatDuration(playbackInfo?.elapsedTime || 0),
                    videoCount: channel.videos.length,
                    playlist: videosWithDetails,
                    streamUrl: `${protocol}://${host}/hls/live${channel.id}/stream.m3u8`,
                    embedUrl: `${protocol}://${host}/embed.html?channel=${channel.id}`
                });
            }
        }

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            liveChannelCount: liveChannels.length,
            totalChannels: config.channels.length,
            channels: liveChannels
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start all channels
app.post('/api/start-all', (req, res) => {
    try {
        const config = loadConfig();
        config.channels.forEach(channel => {
            if (channel.enabled && channel.videos.length > 0) {
                startChannel(channel.id);
            }
        });
        res.json({ success: true, message: 'All channels started' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Stop all channels
app.post('/api/stop-all', (req, res) => {
    try {
        exec('pkill -f "ffmpeg.*rtmp://localhost/live"', (error) => {
            // Clean up PID files
            if (fs.existsSync(PIDS_DIR)) {
                fs.readdirSync(PIDS_DIR).forEach(file => {
                    fs.unlinkSync(path.join(PIDS_DIR, file));
                });
            }
            res.json({ success: true, message: 'All channels stopped' });
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== HELPER FUNCTIONS =====

// Get video duration using ffprobe
function generatePlaylist(channelId) {
    const config = loadConfig();
    const channel = config.channels.find(c => c.id === channelId);
    if (!channel || channel.videos.length === 0) return;

    const playlistPath = path.join(PLAYLISTS_DIR, `playlist${channelId}.txt`);
    const playlistContent = channel.videos
        .map(video => {
            // Check channel-specific directory first, then fall back to global
            const channelVideoPath = path.join(VIDEOS_DIR, `channel${channelId}`, video.filename);
            const globalVideoPath = path.join(VIDEOS_DIR, video.filename);

            if (fs.existsSync(channelVideoPath)) {
                return `file '${channelVideoPath}'`;
            } else if (fs.existsSync(globalVideoPath)) {
                return `file '${globalVideoPath}'`;
            } else {
                console.warn(`[PLAYLIST] Video not found: ${video.filename}`);
                return null;
            }
        })
        .filter(Boolean)
        .join('\n');

    fs.writeFileSync(playlistPath, playlistContent);
}

async function startChannel(channelId) {
    const config = loadConfig();
    const channel = config.channels.find(c => c.id === channelId);
    if (!channel || channel.videos.length === 0) {
        throw new Error('Channel has no videos');
    }

    // Check if already running
    const status = getChannelStatus(channelId);
    if (status.running) {
        console.log(`[START] Channel ${channelId} already running, skipping...`);
        return;
    }

    // Record actual start time
    channel.actualStartTime = new Date().toISOString();
    saveConfig(config);

    // Generate playlist
    generatePlaylist(channelId);

    const playlistPath = path.join(PLAYLISTS_DIR, `playlist${channelId}.txt`);
    const logPath = path.join(LOGS_DIR, `live${channelId}.log`);
    const pidPath = path.join(PIDS_DIR, `live${channelId}.pid`);

    console.log(`[START] Starting channel ${channelId} (mode: ${STREAM_MODE})`);
    console.log(`[START] Playlist: ${playlistPath}`);

    try {
        // Ensure HLS directory exists for Nginx
        const hlsDir = `/var/www/html/hls/live${channelId}`;
        if (!fs.existsSync(hlsDir)) {
            fs.mkdirSync(hlsDir, { recursive: true });
        }

        let pipeManager = null;
        if (STREAM_MODE === 'pipe') {
            // Create Named Pipe
            pipeManager = new PipeManager(channelId);
            await pipeManager.create();
            activePipes.set(channelId, pipeManager);
            console.log(`[START-PIPE] Pipe created: ${pipeManager.getPath()}`);
            // Start pusher that reads from pipe
            startPusher(channelId);
        }

        // Start VideoStreamer
        const options = STREAM_MODE === 'pipe'
            ? { outputMode: 'pipe' }
            : { outputMode: 'rtmp', outputTarget: `rtmp://localhost/live${channelId}/stream` };

        const videoStreamer = new VideoStreamer(channelId, pipeManager, playlistPath, VIDEOS_DIR, options);
        activeStreamers.set(channelId, videoStreamer);

        // Start streaming in background (non-blocking)
        videoStreamer.start();

        console.log(`[START] VideoStreamer started for channel ${channelId} (mode: ${STREAM_MODE})`);
        console.log(`[START] ✅ Channel ${channelId} is now LIVE`);

    } catch (error) {
        console.error(`[START-PIPE] Error starting channel ${channelId}:`, error);
        throw error;
    }
}

/**
 * Separated Pusher logic for persistence
 */
async function startPusher(channelId) {
    const pipeManager = activePipes.get(channelId);
    if (!pipeManager) return;

    const pidPath = path.join(PIDS_DIR, `live${channelId}.pid`);
    const logPath = path.join(LOGS_DIR, `live${channelId}.log`);

    const ffmpegArgs = [
        '-thread_queue_size', '1024',        // Further reduced queue size
        '-re',
        '-use_wallclock_as_timestamps', '1',
        '-fflags', '+genpts+igndts',
        '-avoid_negative_ts', 'make_zero',
        '-f', 'mpegts',
        '-i', pipeManager.getPath(),
        '-threads', '1',                      // Only 1 core for copy operation
        '-c', 'copy',
        '-f', 'flv',
        '-flvflags', 'no_duration_filesize',
        '-max_muxing_queue_size', '512',     // Further reduced muxing queue
        '-rtmp_buffer', '1000',              // Limit RTMP buffer
        `rtmp://localhost/live${channelId}/stream`
    ];

    const logStream = fs.createWriteStream(logPath, { flags: 'a' });

    // Spawn with resource limits
    const ffmpeg = spawn('ffmpeg', ffmpegArgs, {
        stdio: ['ignore', 'pipe', 'pipe']
    });

    console.log(`[PUSHER] Channel ${channelId} spawned with PID: ${ffmpeg.pid}`);

    // Limit log stream writes to prevent memory issues
    let logBuffer = [];
    let lastLogFlush = Date.now();

    const flushLogs = () => {
        if (logBuffer.length > 0) {
            logStream.write(logBuffer.join(''));
            logBuffer = [];
            lastLogFlush = Date.now();
        }
    };

    ffmpeg.stdout.on('data', (data) => {
        logBuffer.push(data.toString());
        if (logBuffer.length > 100 || (Date.now() - lastLogFlush > 5000)) {
            flushLogs();
        }
    });

    ffmpeg.stderr.on('data', (data) => {
        logBuffer.push(data.toString());
        if (logBuffer.length > 100 || (Date.now() - lastLogFlush > 5000)) {
            flushLogs();
        }
    });

    fs.writeFileSync(pidPath, ffmpeg.pid.toString());
    activeFfmpeg.set(channelId, ffmpeg);

    ffmpeg.on('error', (error) => {
        console.error(`[PUSHER] FFmpeg ERROR:`, error);
        flushLogs();
    });

    ffmpeg.on('exit', async (code) => {
        console.log(`[PUSHER] FFmpeg exited with code: ${code}`);
        flushLogs();

        // Clean up event listeners
        ffmpeg.stdout.removeAllListeners();
        ffmpeg.stderr.removeAllListeners();
        ffmpeg.removeAllListeners();

        // Close log stream
        logStream.end();

        if (fs.existsSync(pidPath)) fs.unlinkSync(pidPath);
        activeFfmpeg.delete(channelId);

        const streamer = activeStreamers.get(channelId);
        if (streamer && streamer.isStreaming) {
            console.log(`[PUSHER] Streamer active, auto-restarting in 2s...`);
            setTimeout(() => {
                if (activeStreamers.has(channelId)) startPusher(channelId);
            }, 2000);
        } else {
            const pipe = activePipes.get(channelId);
            if (pipe) {
                await pipe.destroy();
                activePipes.delete(channelId);
            }
        }
    });
}


async function stopChannel(channelId) {
    console.log(`[STOP-PIPE] Stopping channel ${channelId}...`);

    // Clear actual start time
    const config = loadConfig();
    const channel = config.channels.find(c => c.id === channelId);
    if (channel) {
        channel.actualStartTime = null;
        saveConfig(config);
    }

    // 1. Stop VideoStreamer
    const streamer = activeStreamers.get(channelId);
    if (streamer) {
        streamer.stop();
        activeStreamers.delete(channelId);
        console.log(`[STOP-PIPE] VideoStreamer stopped`);
    }

    // 2. Stop FFmpeg pusher (pipe mode only)
    if (STREAM_MODE === 'pipe') {
        const ffmpeg = activeFfmpeg.get(channelId);
        if (ffmpeg) {
            try {
                ffmpeg.kill('SIGTERM');
                activeFfmpeg.delete(channelId);
                console.log(`[STOP-PIPE] FFmpeg pusher terminated`);
            } catch (error) {
                console.error(`[STOP-PIPE] Error killing FFmpeg pusher:`, error);
            }
        }

        // Also try killing via PID file (backward compatibility)
        const pidPath = path.join(PIDS_DIR, `live${channelId}.pid`);
        if (fs.existsSync(pidPath)) {
            const pid = fs.readFileSync(pidPath, 'utf8').trim();
            try {
                process.kill(parseInt(pid));
                fs.unlinkSync(pidPath);
            } catch (error) {
                if (fs.existsSync(pidPath)) {
                    fs.unlinkSync(pidPath);
                }
            }
        }
    }

    // 3. Destroy Named Pipe
    if (STREAM_MODE === 'pipe') {
        const pipe = activePipes.get(channelId);
        if (pipe) {
            await pipe.destroy();
            activePipes.delete(channelId);
            console.log(`[STOP-PIPE] Pipe destroyed`);
        }
    }

    // 4. Clean up HLS files to prevent playback of old content
    // 4. Clean up HLS files for Docker environment
    const hlsDir = `/var/www/html/hls/live${channelId}`;
    if (fs.existsSync(hlsDir)) {
        try {
            const files = fs.readdirSync(hlsDir);
            files.forEach(file => {
                if (file.endsWith('.ts') || file.endsWith('.m3u8')) {
                    fs.unlinkSync(path.join(hlsDir, file));
                }
            });
            console.log(`[STOP-PIPE] Cleaned HLS files for channel ${channelId}`);
        } catch (error) {
            console.error(`[STOP-PIPE] Error cleaning HLS files:`, error);
        }
    }

    console.log(`[STOP-PIPE] ✅ Channel ${channelId} stopped completely`);
}

function getChannelStatus(channelId) {
    // Check if VideoStreamer is active (for both pipe and rtmp modes)
    const streamer = activeStreamers.get(channelId);
    if (streamer && streamer.isStreaming) {
        return { running: true, mode: STREAM_MODE };
    }

    // Fallback: Check PID file (for pipe mode or backward compatibility)
    const pidPath = path.join(PIDS_DIR, `live${channelId}.pid`);
    if (fs.existsSync(pidPath)) {
        const pid = fs.readFileSync(pidPath, 'utf8').trim();
        try {
            process.kill(parseInt(pid), 0); // Check if process exists
            return { running: true, pid: parseInt(pid), mode: 'pipe' };
        } catch {
            fs.unlinkSync(pidPath);
            return { running: false };
        }
    }

    return { running: false };
}

// ===== PERIODIC CLEANUP & MONITORING =====

/**
 * Cleanup old HLS segments to prevent disk accumulation
 * Runs every 5 minutes
 */
function cleanupOldHLSSegments() {
    console.log('[CLEANUP] Running HLS segment cleanup...');

    const hlsBaseDir = '/var/www/html/hls';

    // Fallback for macOS development
    if (!fs.existsSync(hlsBaseDir)) {
        console.log('[CLEANUP] Docker HLS path not found, skipping...');
        return;
    }

    try {
        // Get all live channel directories
        const channelDirs = fs.readdirSync(hlsBaseDir)
            .filter(dir => dir.startsWith('live'))
            .map(dir => path.join(hlsBaseDir, dir));

        let totalCleaned = 0;

        channelDirs.forEach(channelDir => {
            if (!fs.existsSync(channelDir)) return;

            const files = fs.readdirSync(channelDir);
            const now = Date.now();
            const maxAge = 5 * 60 * 1000; // 5 minutes

            files.forEach(file => {
                if (!file.endsWith('.ts')) return; // Only cleanup .ts segments

                const filePath = path.join(channelDir, file);
                try {
                    const stats = fs.statSync(filePath);
                    const age = now - stats.mtimeMs;

                    // Delete segments older than 5 minutes
                    if (age > maxAge) {
                        fs.unlinkSync(filePath);
                        totalCleaned++;
                    }
                } catch (err) {
                    // File might have been deleted already
                }
            });
        });

        if (totalCleaned > 0) {
            console.log(`[CLEANUP] Removed ${totalCleaned} old HLS segments`);
        }
    } catch (error) {
        console.error('[CLEANUP] Error during HLS cleanup:', error.message);
    }
}

/**
 * Monitor and cleanup zombie FFmpeg processes
 */
function cleanupZombieProcesses() {
    try {
        exec('ps aux | grep ffmpeg | grep -v grep', (error, stdout) => {
            if (error) return; // No processes found

            const lines = stdout.trim().split('\n');
            const runningPids = new Set();
            const orphanedPids = [];

            lines.forEach(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length > 1) {
                    const pid = parseInt(parts[1]);
                    runningPids.add(pid);
                }
            });

            // Count FFmpeg processes per channel
            const processCountPerChannel = new Map();

            // Check our tracked FFmpeg processes
            activeFfmpeg.forEach((ffmpegProcess, channelId) => {
                if (ffmpegProcess && ffmpegProcess.pid) {
                    if (!runningPids.has(ffmpegProcess.pid)) {
                        console.log(`[CLEANUP] Zombie process detected for channel ${channelId}, cleaning up...`);
                        activeFfmpeg.delete(channelId);
                    } else {
                        processCountPerChannel.set(channelId, (processCountPerChannel.get(channelId) || 0) + 1);
                    }
                }
            });

            // If total FFmpeg processes exceed expected count significantly, kill orphans
            const expectedPerChannel = STREAM_MODE === 'rtmp' ? 1 : 2;
            const expectedCount = activeStreamers.size * expectedPerChannel;

            // Only clean up if we have 5x more than expected (very lenient)
            if (runningPids.size > expectedCount * 5 && activeStreamers.size > 0) {
                console.warn(`[CLEANUP] Excessive FFmpeg processes detected (${runningPids.size}), expected ~${expectedCount}`);

                // Kill FFmpeg processes that aren't in our tracking
                let killedCount = 0;
                runningPids.forEach(pid => {
                    let isTracked = false;

                    // Check if tracked in activeFfmpeg (pipe mode)
                    activeFfmpeg.forEach(proc => {
                        if (proc && proc.pid === pid) isTracked = true;
                    });

                    // Check if tracked in activeStreamers (rtmp mode)
                    activeStreamers.forEach(streamer => {
                        if (streamer.currentProcess && streamer.currentProcess.pid === pid) {
                            isTracked = true;
                        }
                    });

                    if (!isTracked) {
                        console.warn(`[CLEANUP] Killing orphaned FFmpeg process PID: ${pid}`);
                        try {
                            process.kill(pid, 'SIGKILL');
                            killedCount++;
                        } catch (err) {
                            // Process might have already exited
                        }
                    }
                });

                if (killedCount > 0) {
                    console.log(`[CLEANUP] Killed ${killedCount} orphaned processes`);
                }
            }
        });
    } catch (error) {
        console.error('[CLEANUP] Error checking zombie processes:', error.message);
    }
}

/**
 * Process limiter - monitors FFmpeg process count (less aggressive)
 */
function enforceProcessLimits() {
    try {
        exec('ps aux | grep "ffmpeg.*live" | grep -v grep | wc -l', (error, stdout) => {
            if (error) return;

            const processCount = parseInt(stdout.trim());
            const activeChannels = activeStreamers.size;
            // In RTMP mode: 1 process per channel; In PIPE mode: 2 per channel
            const expectedPerChannel = STREAM_MODE === 'rtmp' ? 1 : 2;
            const expectedProcesses = activeChannels * expectedPerChannel;

            // Only trigger if we have 3x more processes than expected (very lenient)
            if (processCount > expectedProcesses * 3 && activeChannels > 0) {
                console.warn(`[CLEANUP] ⚠️ High process count: ${processCount} FFmpeg processes, expected ~${expectedProcesses}`);
                console.warn(`[CLEANUP] Active channels: ${activeChannels} (${STREAM_MODE} mode)`);
                console.warn(`[CLEANUP] This may indicate channel restarts or errors. Check logs.`);
                // Don't automatically restart - just log warning
            } else if (activeChannels > 0) {
                console.log(`[CLEANUP] ✅ Process count normal: ${processCount} FFmpeg processes for ${activeChannels} channels`);
            }
        });
    } catch (error) {
        console.error('[CLEANUP] Error checking process limits:', error.message);
    }
}

// Run cleanup at reasonable intervals
setInterval(cleanupOldHLSSegments, 5 * 60 * 1000);    // Every 5 minutes
setInterval(cleanupZombieProcesses, 5 * 60 * 1000);   // Every 5 minutes (reduced from 2)
setInterval(enforceProcessLimits, 10 * 60 * 1000);    // Every 10 minutes (reduced frequency)

// Run initial cleanup after startup
setTimeout(cleanupOldHLSSegments, 30000);
setTimeout(enforceProcessLimits, 120000); // Check after 2 minutes (increased from 1)

console.log('[CLEANUP] Periodic cleanup tasks scheduled');
console.log('[CLEANUP] HLS cleanup: Every 5 minutes');
console.log('[CLEANUP] Zombie process check: Every 5 minutes');
console.log('[CLEANUP] Process count monitor: Every 10 minutes');
console.log('[CLEANUP] Aggressive limiter: Every 5 minutes');

// Graceful shutdown handler
process.on('SIGTERM', async () => {
    console.log('\n[SHUTDOWN] Received SIGTERM, shutting down gracefully...');

    // Stop all streamers
    for (const [channelId, streamer] of activeStreamers) {
        console.log(`[SHUTDOWN] Stopping streamer ${channelId}...`);
        streamer.stop();
    }

    // Stop all FFmpeg processes
    for (const [channelId, ffmpeg] of activeFfmpeg) {
        console.log(`[SHUTDOWN] Stopping FFmpeg ${channelId}...`);
        try {
            ffmpeg.kill('SIGTERM');
        } catch (err) {
            // Already stopped
        }
    }

    // Destroy all pipes
    for (const [channelId, pipe] of activePipes) {
        console.log(`[SHUTDOWN] Destroying pipe ${channelId}...`);
        await pipe.destroy();
    }

    console.log('[SHUTDOWN] Cleanup complete, exiting...');
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\n[SHUTDOWN] Received SIGINT, shutting down gracefully...');
    process.emit('SIGTERM');
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 INBV API Server running on http://localhost:${PORT}`);
    console.log(`📁 Videos directory: ${VIDEOS_DIR}`);
    console.log(`📝 Config file: ${CONFIG_FILE}`);
    console.log('\n✅ Ready to manage streams!');
});
