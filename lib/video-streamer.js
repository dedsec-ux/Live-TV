const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * VideoStreamer - Continuously streams videos through a named pipe
 * Monitors playlist changes and updates seamlessly
 */
class VideoStreamer {
    constructor(channelId, pipeManager, playlistPath, videosDir, options = {}) {
        this.channelId = channelId;
        this.pipe = pipeManager || null;
        this.playlistPath = playlistPath;
        this.videosDir = videosDir;
        this.currentIndex = 0;
        this.isStreaming = false;
        this.currentProcess = null;
        this.playlist = [];
        this.lastPlaylistHash = '';
        // outputMode: 'pipe' | 'rtmp'
        this.outputMode = options.outputMode || 'pipe';
        // For 'rtmp' mode, provide the target URL (e.g., rtmp://localhost/liveX/stream)
        this.outputTarget = options.outputTarget || null;
        // Playback tracking
        this.currentVideoStartTime = null;
        this.currentVideoDuration = 0;
        this.currentVideoPath = null;
    }

    /**
     * Read and parse playlist file
     */
    readPlaylist() {
        try {
            if (!fs.existsSync(this.playlistPath)) {
                console.log(`[STREAMER ${this.channelId}] Playlist not found: ${this.playlistPath}`);
                return [];
            }

            const content = fs.readFileSync(this.playlistPath, 'utf8');
            const lines = content.trim().split('\n');
            const videos = lines
                .filter(line => line.startsWith('file '))
                .map(line => {
                    // Extract file path from: file '/path/to/video.mp4'
                    const match = line.match(/file '(.+)'/);
                    return match ? match[1] : null;
                })
                .filter(Boolean);

            // Create hash to detect changes
            this.lastPlaylistHash = content;

            return videos;
        } catch (error) {
            console.error(`[STREAMER ${this.channelId}] Error reading playlist:`, error);
            return [];
        }
    }

    /**
     * Check if playlist has changed
     */
    hasPlaylistChanged() {
        if (!fs.existsSync(this.playlistPath)) return false;
        const content = fs.readFileSync(this.playlistPath, 'utf8');
        return content !== this.lastPlaylistHash;
    }

    /**
     * Start streaming videos
     */
    async start() {
        console.log(`[STREAMER ${this.channelId}] Starting...`);
        this.isStreaming = true;
        this.playlist = this.readPlaylist();

        if (this.playlist.length === 0) {
            console.error(`[STREAMER ${this.channelId}] No videos in playlist!`);
            this.isStreaming = false;
            return;
        }

        console.log(`[STREAMER ${this.channelId}] Found ${this.playlist.length} videos`);

        // Start the streaming loop
        this.streamLoop();
    }

    /**
     * Main streaming loop
     */
    async streamLoop() {
        while (this.isStreaming) {
            // Check for playlist changes before each video
            if (this.hasPlaylistChanged()) {
                console.log(`[STREAMER ${this.channelId}] Playlist changed! Reloading...`);
                const oldPlaylist = [...this.playlist];
                const currentVideo = oldPlaylist[this.currentIndex];

                this.playlist = this.readPlaylist();

                // INTELLIGENT INDEXING: Find where the currently playing video moved to
                // and set the index so the 'next' video is correct according to the new order
                const newIndex = this.playlist.indexOf(currentVideo);
                if (newIndex !== -1) {
                    this.currentIndex = newIndex;
                } else {
                    this.currentIndex = 0;
                }

                console.log(`[STREAMER ${this.channelId}] Playlist synced. Next video will follow new order.`);
            }

            if (this.playlist.length === 0) {
                console.log(`[STREAMER ${this.channelId}] Empty playlist, waiting...`);
                await this.sleep(5000);
                this.playlist = this.readPlaylist();
                continue;
            }

            // Get current video
            const videoPath = this.playlist[this.currentIndex];

            if (!fs.existsSync(videoPath)) {
                console.error(`[STREAMER ${this.channelId}] Video not found: ${videoPath}`);
                this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
                await this.sleep(2000); // Wait before trying next video
                continue;
            }

            console.log(`[STREAMER ${this.channelId}] Playing (${this.currentIndex + 1}/${this.playlist.length}): ${path.basename(videoPath)}`);

            // Ensure previous process is killed before starting new one
            if (this.currentProcess) {
                console.warn(`[STREAMER ${this.channelId}] Previous FFmpeg still running, force killing...`);
                try {
                    this.currentProcess.kill('SIGKILL');
                    this.currentProcess = null;
                } catch (err) {
                    // Already dead
                }
                // Wait a moment for cleanup
                await this.sleep(500);
            }

            // Stream this video
            await this.streamVideo(videoPath);

            // Verify process was cleaned up
            if (this.currentProcess) {
                console.warn(`[STREAMER ${this.channelId}] FFmpeg not cleaned up, forcing kill...`);
                try {
                    this.currentProcess.kill('SIGKILL');
                    this.currentProcess = null;
                } catch (err) {
                    // Ignore
                }
            }

            // Move to next video
            this.currentIndex = (this.currentIndex + 1) % this.playlist.length;

            if (this.currentIndex === 0) {
                console.log(`[STREAMER ${this.channelId}] ♻️  Looping back to start - Playlist will repeat`);
            }

            // Small delay between videos to prevent RTMP reconnection issues
            await this.sleep(2000);
        }

        console.log(`[STREAMER ${this.channelId}] Stopped`);
    }

    /**
     * Get video duration in seconds using ffprobe
     */
    async getVideoDuration(videoPath) {
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
                // If duration detection fails, default to 2 hours
                resolve(isNaN(duration) ? 7200 : Math.ceil(duration));
            });

            ffprobe.on('error', () => {
                // If ffprobe fails, default to 2 hours
                resolve(7200);
            });
        });
    }

    /**
     * Stream a single video through FFmpeg to normalize format
     */
    async streamVideo(videoPath) {
        // Get video duration first
        const videoDuration = await this.getVideoDuration(videoPath);
        // Add 30% buffer + 60 seconds safety margin
        const timeoutDuration = Math.ceil(videoDuration * 1.3) + 60;

        // Track playback for admin panel
        this.currentVideoPath = videoPath;
        this.currentVideoDuration = videoDuration;
        this.currentVideoStartTime = Date.now();

        console.log(`[STREAMER ${this.channelId}] Video duration: ${Math.floor(videoDuration / 60)}m ${videoDuration % 60}s, timeout: ${Math.floor(timeoutDuration / 60)}m`);

        return new Promise((resolve, reject) => {
            // Build common FFmpeg args
            const commonArgs = [
                '-re',
                '-i', videoPath,
                '-threads', '2',
                '-c:v', 'libx264',
                '-preset', 'ultrafast',
                '-tune', 'zerolatency',
                '-profile:v', 'baseline',
                '-level', '3.1',
                '-r', '25',
                '-b:v', '3000k',
                '-maxrate', '3500k',
                '-bufsize', '4000k',
                '-pix_fmt', 'yuv420p',
                '-g', '100',
                '-keyint_min', '50',
                '-sc_threshold', '0',
                '-bf', '0',
                '-refs', '1',
                '-c:a', 'aac',
                '-ar', '44100',
                '-b:a', '96k',
                '-ac', '2',
                '-af', 'aresample=async=1:first_pts=0'
            ];

            let ffmpeg;

            if (this.outputMode === 'rtmp') {
                // Directly push to RTMP, avoiding the extra pusher process
                const target = this.outputTarget || `rtmp://localhost/live${this.channelId}/stream`;
                ffmpeg = spawn('ffmpeg', [
                    ...commonArgs,
                    '-f', 'flv',
                    '-flvflags', 'no_duration_filesize',
                    '-max_muxing_queue_size', '512',
                    '-rtmp_buffer', '1000',
                    target
                ]);
            } else {
                // Default: stream to named pipe as MPEG-TS
                ffmpeg = spawn('ffmpeg', [
                    ...commonArgs,
                    '-f', 'mpegts',
                    '-streamid', '0:256',
                    '-streamid', '1:257',
                    '-pcr_period', '20',
                    '-muxdelay', '0',
                    '-muxpreload', '0',
                    '-max_interleave_delta', '500000',
                    '-'
                ]);
            }

            this.currentProcess = ffmpeg;

            // If using pipe mode, connect FFmpeg stdout to the pipe
            let pipeStream = null;
            let pipeErrorHandler = null;
            if (this.outputMode !== 'rtmp') {
                pipeStream = this.pipe ? this.pipe.getWriteStream() : null;

                if (!pipeStream || !pipeStream.writable) {
                    console.error(`[STREAMER ${this.channelId}] Pipe is not writable, stopping stream`);
                    this.isStreaming = false;
                    if (this.currentProcess) {
                        this.currentProcess.kill('SIGKILL');
                        this.currentProcess = null;
                    }
                    resolve();
                    return;
                }

                // Listen for pipe errors
                pipeErrorHandler = (error) => {
                    if (error.code === 'EPIPE') {
                        console.log(`[STREAMER ${this.channelId}] Pipe closed by reader, stopping stream`);
                        this.isStreaming = false;
                    } else {
                        console.error(`[STREAMER ${this.channelId}] Pipe error:`, error.message);
                    }
                };

                pipeStream.once('error', pipeErrorHandler);

                // Pipe with proper error handling
                try {
                    ffmpeg.stdout.pipe(pipeStream, { end: false });
                } catch (err) {
                    console.error(`[STREAMER ${this.channelId}] Pipe connection error:`, err.message);
                }

                // Handle stdout pipe errors
                ffmpeg.stdout.on('error', (error) => {
                    console.error(`[STREAMER ${this.channelId}] FFmpeg stdout error:`, error.message);
                });
            }

            let errorOutput = '';
            let errorBuffer = [];
            let killTimeout = null;

            ffmpeg.stderr.on('data', (data) => {
                const chunk = data.toString();
                errorBuffer.push(chunk);

                // Keep only last 50 lines to prevent memory bloat
                if (errorBuffer.length > 50) {
                    errorBuffer.shift();
                }

                errorOutput = errorBuffer.join('');
            });

            // Cleanup function to prevent memory leaks
            const cleanup = () => {
                // Clear kill timeout
                if (killTimeout) {
                    clearTimeout(killTimeout);
                }

                // Remove all event listeners
                if (pipeStream && pipeErrorHandler) {
                    try {
                        pipeStream.removeListener('error', pipeErrorHandler);
                    } catch (err) {
                        // ignore
                    }
                }

                // Unpipe to prevent memory leaks
                if (ffmpeg.stdout && this.outputMode !== 'rtmp') {
                    try {
                        if (pipeStream) ffmpeg.stdout.unpipe(pipeStream);
                        ffmpeg.stdout.removeAllListeners();
                        ffmpeg.stdout.destroy();
                    } catch (err) {
                        // Ignore errors
                    }
                }

                if (ffmpeg.stderr) {
                    try {
                        ffmpeg.stderr.removeAllListeners();
                        ffmpeg.stderr.destroy();
                    } catch (err) {
                        // Ignore errors
                    }
                }

                // Remove all FFmpeg event listeners
                if (ffmpeg) {
                    try {
                        ffmpeg.removeAllListeners();
                    } catch (err) {
                        // Ignore errors
                    }
                }

                // Clear error buffer
                errorBuffer = [];
                errorOutput = '';

                this.currentProcess = null;
            };

            ffmpeg.on('exit', (code) => {
                if (code === 0) {
                    // Success
                    cleanup();
                    resolve();
                } else if (code === 255) {
                    // FFmpeg error - log it but continue
                    console.error(`[STREAMER ${this.channelId}] FFmpeg exited with error 255 for ${path.basename(videoPath)}`);
                    if (errorOutput) {
                        // Show last 1000 chars of error output
                        const errorLines = errorOutput.split('\n').slice(-30).join('\n');
                        console.error(`[STREAMER ${this.channelId}] FFmpeg stderr:\n${errorLines}`);
                    }
                    cleanup();
                    // Wait before retrying to avoid rapid reconnection
                    setTimeout(() => resolve(), 2000);
                } else if (code === 1 && errorOutput.includes('Already publishing')) {
                    // RTMP already publishing - wait longer before retry
                    console.warn(`[STREAMER ${this.channelId}] RTMP slot busy, waiting 3s before retry...`);
                    cleanup();
                    setTimeout(() => resolve(), 3000);
                } else {
                    console.error(`[STREAMER ${this.channelId}] FFmpeg error for ${path.basename(videoPath)}:`, code);
                    console.error(errorOutput.slice(-500)); // Last 500 chars
                    cleanup();
                    // Wait before retrying
                    setTimeout(() => resolve(), 2000);
                }
            });

            ffmpeg.on('error', (error) => {
                console.error(`[STREAMER ${this.channelId}] FFmpeg spawn error:`, error);
                cleanup();
                resolve(); // Continue to next video
            });

            // Kill timeout - safety timeout based on actual video duration
            killTimeout = setTimeout(() => {
                if (this.currentProcess) {
                    console.warn(`[STREAMER ${this.channelId}] FFmpeg timeout (${Math.floor(timeoutDuration / 60)}m), forcing kill...`);
                    try {
                        this.currentProcess.kill('SIGKILL');
                        this.currentProcess = null;
                    } catch (err) {
                        // Already dead
                    }
                    cleanup();
                }
            }, timeoutDuration * 1000); // Dynamic timeout: video duration + 30% buffer + 60s
        });
    }

    /**
     * Stop streaming
     */
    stop() {
        console.log(`[STREAMER ${this.channelId}] Stopping...`);
        this.isStreaming = false;

        if (this.currentProcess) {
            try {
                // Try graceful shutdown first
                this.currentProcess.kill('SIGTERM');

                // Force kill after 3 seconds if still alive
                setTimeout(() => {
                    if (this.currentProcess) {
                        console.log(`[STREAMER ${this.channelId}] Force killing FFmpeg...`);
                        this.currentProcess.kill('SIGKILL');
                    }
                }, 3000);
            } catch (error) {
                console.error(`[STREAMER ${this.channelId}] Error stopping FFmpeg:`, error.message);
            }

            // Clean up event listeners
            if (this.currentProcess.stdout) {
                this.currentProcess.stdout.removeAllListeners();
            }
            if (this.currentProcess.stderr) {
                this.currentProcess.stderr.removeAllListeners();
            }
            this.currentProcess.removeAllListeners();

            this.currentProcess = null;
        }
    }

    /**
     * Helper: Sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get current playback status for admin panel
     */
    getPlaybackStatus() {
        if (!this.isStreaming || !this.currentVideoPath) {
            return {
                isPlaying: false,
                currentIndex: null,
                currentVideo: null,
                elapsedTime: 0,
                totalDuration: 0,
                remainingTime: 0
            };
        }

        const now = Date.now();
        const elapsedMs = now - (this.currentVideoStartTime || now);
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        const remainingSeconds = Math.max(0, this.currentVideoDuration - elapsedSeconds);

        return {
            isPlaying: true,
            currentIndex: this.currentIndex,
            currentVideo: this.currentVideoPath ? path.basename(this.currentVideoPath) : null,
            elapsedTime: elapsedSeconds,
            totalDuration: this.currentVideoDuration,
            remainingTime: remainingSeconds,
            playlistLength: this.playlist.length
        };
    }
}

module.exports = VideoStreamer;
