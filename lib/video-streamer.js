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
                const oldLength = this.playlist.length;
                this.playlist = this.readPlaylist();
                console.log(`[STREAMER ${this.channelId}] Playlist updated: ${oldLength} → ${this.playlist.length} videos`);

                // Adjust current index if playlist shortened
                if (this.currentIndex >= this.playlist.length) {
                    this.currentIndex = 0;
                }
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
                '-re',  // Read input at native frame rate (important for streaming)
                '-i', videoPath,
                // Normalize video to 1080p
                '-vf', 'fps=30,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
                // Normalize audio
                '-af', 'aresample=48000',
                '-c:v', 'libx264',
                '-preset', 'ultrafast', // Fast encoding for real-time
                '-tune', 'zerolatency',
                '-b:v', '5000k',  // 5 Mbps for 1080p quality
                '-maxrate', '5500k',
                '-bufsize', '11000k',
                '-pix_fmt', 'yuv420p',
                '-g', '60',  // GOP size (keyframe every 2 seconds at 30fps)
                '-c:a', 'aac',
                '-b:a', '192k',  // Higher audio quality for 1080p
                '-ac', '2',
                '-ar', '48000',  // 48kHz audio (broadcast standard)
                '-f', 'mpegts', // MPEG-TS format for streaming
                '-'  // Output to stdout
            ]);

            this.currentProcess = ffmpeg;

            // Pipe FFmpeg output to named pipe
            const pipeStream = this.pipe.getWriteStream();

            // Check if pipe stream is writable
            if (!pipeStream || !pipeStream.writable) {
                console.error(`[STREAMER ${this.channelId}] Pipe is not writable, stopping stream`);
                this.isStreaming = false;
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

            ffmpeg.stdout.pipe(pipeStream, { end: false }); // Don't close pipe

            let errorOutput = '';

            ffmpeg.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            ffmpeg.on('exit', (code) => {
                // Remove pipe error listener
                pipeStream.removeListener('error', pipeErrorHandler);

                if (code === 0) {
                    // Success
                    resolve();
                } else if (code === 255) {
                    // FFmpeg error - log it but continue
                    console.error(`[STREAMER ${this.channelId}] FFmpeg exited with error 255 for ${path.basename(videoPath)}`);
                    if (errorOutput) {
                        // Show last 1000 chars of error output
                        const errorLines = errorOutput.split('\n').slice(-30).join('\n');
                        console.error(`[STREAMER ${this.channelId}] FFmpeg stderr:\n${errorLines}`);
                    }
                    resolve(); // Continue to next video
                } else {
                    console.error(`[STREAMER ${this.channelId}] FFmpeg error for ${path.basename(videoPath)}:`, code);
                    console.error(errorOutput.slice(-500)); // Last 500 chars
                    resolve(); // Continue to next video
                }
                this.currentProcess = null;
            });

            ffmpeg.on('error', (error) => {
                // Remove pipe error listener
                pipeStream.removeListener('error', pipeErrorHandler);

                console.error(`[STREAMER ${this.channelId}] FFmpeg spawn error:`, error);
                resolve(); // Continue to next video
                this.currentProcess = null;
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
            this.currentProcess.kill('SIGTERM');
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
