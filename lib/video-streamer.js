const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * VideoStreamer - Continuously streams videos through a named pipe
 * Monitors playlist changes and updates seamlessly
 */
class VideoStreamer {
    constructor(channelId, pipeManager, playlistPath, videosDir) {
        this.channelId = channelId;
        this.pipe = pipeManager;
        this.playlistPath = playlistPath;
        this.videosDir = videosDir;
        this.currentIndex = 0;
        this.isStreaming = false;
        this.currentProcess = null;
        this.playlist = [];
        this.lastPlaylistHash = '';
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
                continue;
            }

            console.log(`[STREAMER ${this.channelId}] Playing (${this.currentIndex + 1}/${this.playlist.length}): ${path.basename(videoPath)}`);

            // Stream this video
            await this.streamVideo(videoPath);

            // Move to next video
            this.currentIndex = (this.currentIndex + 1) % this.playlist.length;

            if (this.currentIndex === 0) {
                console.log(`[STREAMER ${this.channelId}] ♻️  Looping back to start`);
            }
        }

        console.log(`[STREAMER ${this.channelId}] Stopped`);
    }

    /**
     * Stream a single video through FFmpeg to normalize format
     */
    streamVideo(videoPath) {
        return new Promise((resolve, reject) => {
            // Use FFmpeg to normalize the video and stream to pipe
            const ffmpeg = spawn('ffmpeg', [
                '-re',
                '-i', videoPath,
                '-threads', '2',                 // Limit CPU cores to prevent overload
                '-c:v', 'libx264',
                '-preset', 'veryfast',           // Changed from ultrafast for better quality
                '-tune', 'zerolatency',
                '-r', '30',
                '-b:v', '5000k',                 // Reduced bitrate to lower CPU usage
                '-maxrate', '6000k',             // Reduced maxrate
                '-bufsize', '10000k',            // Reduced buffer size
                '-pix_fmt', 'yuv420p',
                '-g', '60',
                '-c:a', 'aac',
                '-ar', '44100',
                '-b:a', '128k',                  // Limit audio bitrate
                '-af', 'aresample=async=1',
                '-f', 'mpegts',
                '-streamid', '0:256',            // FIXED PID - Prevents "Corruption" error
                '-streamid', '1:257',            // FIXED PID - Prevents "Corruption" error
                '-pcr_period', '20',             // Steady stream heartbeat
                '-muxdelay', '0.1',              // Reduce mux delay for stability
                '-muxpreload', '0.1',            // Reduce preload for stability
                '-'
            ]);

            this.currentProcess = ffmpeg;

            // Pipe FFmpeg output to named pipe
            const pipeStream = this.pipe.getWriteStream();

            // Check if pipe stream is writable
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
            const pipeErrorHandler = (error) => {
                if (error.code === 'EPIPE') {
                    console.log(`[STREAMER ${this.channelId}] Pipe closed by reader, stopping stream`);
                    this.isStreaming = false;
                } else {
                    console.error(`[STREAMER ${this.channelId}] Pipe error:`, error.message);
                }
            };

            pipeStream.once('error', pipeErrorHandler);

            // Pipe with proper error handling
            const stdoutPipe = ffmpeg.stdout.pipe(pipeStream, { end: false }); // Don't close pipe

            // Handle stdout pipe errors
            ffmpeg.stdout.on('error', (error) => {
                console.error(`[STREAMER ${this.channelId}] FFmpeg stdout error:`, error.message);
            });

            let errorOutput = '';
            let errorBuffer = [];

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
                // Remove all event listeners
                pipeStream.removeListener('error', pipeErrorHandler);
                
                // Unpipe to prevent memory leaks
                if (ffmpeg.stdout) {
                    ffmpeg.stdout.unpipe(pipeStream);
                    ffmpeg.stdout.removeAllListeners();
                }
                
                if (ffmpeg.stderr) {
                    ffmpeg.stderr.removeAllListeners();
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
                    resolve(); // Continue to next video
                } else {
                    console.error(`[STREAMER ${this.channelId}] FFmpeg error for ${path.basename(videoPath)}:`, code);
                    console.error(errorOutput.slice(-500)); // Last 500 chars
                    cleanup();
                    resolve(); // Continue to next video
                }
            });

            ffmpeg.on('error', (error) => {
                console.error(`[STREAMER ${this.channelId}] FFmpeg spawn error:`, error);
                cleanup();
                resolve(); // Continue to next video
            });

            // Kill timeout - if FFmpeg hangs for more than video duration + 60s, kill it
            const killTimeout = setTimeout(() => {
                if (this.currentProcess) {
                    console.warn(`[STREAMER ${this.channelId}] FFmpeg timeout, forcing kill...`);
                    this.currentProcess.kill('SIGKILL');
                }
            }, 10 * 60 * 1000); // 10 minutes max per video

            // Clear timeout when process exits
            ffmpeg.on('exit', () => {
                clearTimeout(killTimeout);
            });
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
}

module.exports = VideoStreamer;
