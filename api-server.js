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
        // Support all common video formats
        const allowedTypes = /mp4|avi|mov|mkv|flv|webm|wmv|m4v|3gp|asf|ogv/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = file.mimetype.startsWith('video/');

        if (mimetype || extname) {
            return cb(null, true);
        } else {
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
    // Default config with 6 channels
    const defaultConfig = {
        channels: [
            { id: 1, name: 'Channel 1', videos: [], enabled: true },
            { id: 2, name: 'Channel 2', videos: [], enabled: true },
            { id: 3, name: 'Channel 3', videos: [], enabled: true },
            { id: 4, name: 'Channel 4', videos: [], enabled: true },
            { id: 5, name: 'Channel 5', videos: [], enabled: true },
            { id: 6, name: 'Channel 6', videos: [], enabled: true }
        ]
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

// Create new channel
app.post('/api/channels', (req, res) => {
    try {
        const config = loadConfig();
        const newId = Math.max(...config.channels.map(c => c.id), 0) + 1;
        const newChannel = {
            id: newId,
            name: req.body.name || `Channel ${newId}`,
            videos: [],
            enabled: true
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
            .filter(file => /\.(mp4|avi|mov|mkv|flv)$/i.test(file))
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

    // Generate playlist
    generatePlaylist(channelId);

    const playlistPath = path.join(PLAYLISTS_DIR, `playlist${channelId}.txt`);
    const logPath = path.join(LOGS_DIR, `live${channelId}.log`);
    const pidPath = path.join(PIDS_DIR, `live${channelId}.pid`);

    console.log(`[START-PIPE] Starting channel ${channelId} with Named Pipes`);
    console.log(`[START-PIPE] Playlist: ${playlistPath}`);

    try {
        // 1. Create Named Pipe
        const pipeManager = new PipeManager(channelId);
        await pipeManager.create();
        activePipes.set(channelId, pipeManager);

        console.log(`[START-PIPE] Pipe created: ${pipeManager.getPath()}`);


        // Ensure HLS directory exists for Nginx
        const hlsDir = `/var/www/html/hls/live${channelId}`;
        if (!fs.existsSync(hlsDir)) {
            fs.mkdirSync(hlsDir, { recursive: true });
        }

        // 2 & 3. Modularized restartable pusher
        startPusher(channelId);

        // 3. Start VideoStreamer (streams videos to pipe)
        const videoStreamer = new VideoStreamer(channelId, pipeManager, playlistPath, VIDEOS_DIR);
        activeStreamers.set(channelId, videoStreamer);

        // Start streaming in background (non-blocking)
        videoStreamer.start();

        console.log(`[START-PIPE] VideoStreamer started for channel ${channelId}`);
        console.log(`[START-PIPE] ✅ Channel ${channelId} is now LIVE with zero-downtime capability!`);

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

    // 1. Stop VideoStreamer
    const streamer = activeStreamers.get(channelId);
    if (streamer) {
        streamer.stop();
        activeStreamers.delete(channelId);
        console.log(`[STOP-PIPE] VideoStreamer stopped`);
    }

    // 2. Stop FFmpeg
    const ffmpeg = activeFfmpeg.get(channelId);
    if (ffmpeg) {
        try {
            ffmpeg.kill('SIGTERM');
            activeFfmpeg.delete(channelId);
            console.log(`[STOP-PIPE] FFmpeg terminated`);
        } catch (error) {
            console.error(`[STOP-PIPE] Error killing FFmpeg:`, error);
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
            // Process might already be dead
            if (fs.existsSync(pidPath)) {
                fs.unlinkSync(pidPath);
            }
        }
    }

    // 3. Destroy Named Pipe
    const pipe = activePipes.get(channelId);
    if (pipe) {
        await pipe.destroy();
        activePipes.delete(channelId);
        console.log(`[STOP-PIPE] Pipe destroyed`);
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
    const pidPath = path.join(PIDS_DIR, `live${channelId}.pid`);
    if (fs.existsSync(pidPath)) {
        const pid = fs.readFileSync(pidPath, 'utf8').trim();
        try {
            process.kill(parseInt(pid), 0); // Check if process exists
            return { running: true, pid: parseInt(pid) };
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
            
            // If total FFmpeg processes exceed expected count, kill orphans
            const expectedCount = activeStreamers.size + activeFfmpeg.size;
            if (runningPids.size > expectedCount * 3) {
                console.warn(`[CLEANUP] Too many FFmpeg processes detected (${runningPids.size}), investigating...`);
                
                // Kill FFmpeg processes that aren't in our tracking
                runningPids.forEach(pid => {
                    let isTracked = false;
                    activeFfmpeg.forEach(proc => {
                        if (proc && proc.pid === pid) isTracked = true;
                    });
                    
                    if (!isTracked) {
                        console.warn(`[CLEANUP] Killing orphaned FFmpeg process PID: ${pid}`);
                        try {
                            process.kill(pid, 'SIGKILL');
                        } catch (err) {
                            // Process might have already exited
                        }
                    }
                });
            }
        });
    } catch (error) {
        console.error('[CLEANUP] Error checking zombie processes:', error.message);
    }
}

/**
 * Aggressive process limiter - ensures no channel has more than 2 FFmpeg processes
 */
function enforceProcessLimits() {
    try {
        exec('ps aux | grep "ffmpeg.*live" | grep -v grep | wc -l', (error, stdout) => {
            if (error) return;
            
            const processCount = parseInt(stdout.trim());
            const activeChannels = activeStreamers.size;
            const expectedProcesses = activeChannels * 2; // 2 per channel (streamer + pusher)
            
            if (processCount > expectedProcesses * 2) {
                console.error(`[CLEANUP] ⚠️ Process leak detected! Found ${processCount} FFmpeg processes, expected ~${expectedProcesses}`);
                console.error(`[CLEANUP] Active channels: ${activeChannels}`);
                
                // Force restart all channels to clean up
                console.log('[CLEANUP] Force restarting all channels to clean up processes...');
                
                const channelIds = Array.from(activeStreamers.keys());
                channelIds.forEach(async (channelId) => {
                    console.log(`[CLEANUP] Restarting channel ${channelId}...`);
                    await stopChannel(channelId);
                    setTimeout(() => {
                        startChannel(channelId).catch(err => {
                            console.error(`[CLEANUP] Error restarting channel ${channelId}:`, err);
                        });
                    }, 2000);
                });
            }
        });
    } catch (error) {
        console.error('[CLEANUP] Error enforcing process limits:', error.message);
    }
}

// Run cleanup every 5 minutes
setInterval(cleanupOldHLSSegments, 5 * 60 * 1000);
setInterval(cleanupZombieProcesses, 2 * 60 * 1000); // Every 2 minutes
setInterval(enforceProcessLimits, 5 * 60 * 1000);   // Every 5 minutes - aggressive check

// Run initial cleanup after 30 seconds
setTimeout(cleanupOldHLSSegments, 30000);
setTimeout(enforceProcessLimits, 60000); // Check after 1 minute

console.log('[CLEANUP] Periodic cleanup tasks scheduled');
console.log('[CLEANUP] Process monitoring: Every 2 minutes');
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
