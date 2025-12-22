const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const execAsync = promisify(exec);

/**
 * PipeManager - Manages named pipes (FIFO) for video streaming
 */
class PipeManager {
    constructor(channelId) {
        this.channelId = channelId;
        this.pipePath = `/tmp/stream_live${channelId}.pipe`;
        this.isActive = false;
        this.writeStream = null;
    }

    /**
     * Create the named pipe
     */
    async create() {
        try {
            // Remove existing pipe if any
            await this.destroy();

            // Create new FIFO pipe
            await execAsync(`mkfifo ${this.pipePath}`);
            console.log(`[PIPE ${this.channelId}] Created: ${this.pipePath}`);
            this.isActive = true;
            return true;
        } catch (error) {
            console.error(`[PIPE ${this.channelId}] Error creating pipe:`, error);
            throw error;
        }
    }

    /**
     * Destroy the named pipe
     */
    async destroy() {
        try {
            if (fs.existsSync(this.pipePath)) {
                await execAsync(`rm -f ${this.pipePath}`);
                console.log(`[PIPE ${this.channelId}] Destroyed: ${this.pipePath}`);
            }
            this.isActive = false;
            if (this.writeStream) {
                this.writeStream.end();
                this.writeStream = null;
            }
        } catch (error) {
            console.error(`[PIPE ${this.channelId}] Error destroying pipe:`, error);
        }
    }

    /**
     * Get the pipe path
     */
    getPath() {
        return this.pipePath;
    }

    /**
     * Check if pipe exists and is active
     */
    exists() {
        return fs.existsSync(this.pipePath);
    }

    /**
     * Get write stream to the pipe
     */
    getWriteStream() {
        if (!this.writeStream || !this.writeStream.writable) {
            // Clean up old stream if it exists
            if (this.writeStream) {
                try {
                    this.writeStream.removeAllListeners();
                    this.writeStream.end();
                } catch (err) {
                    // Ignore errors on cleanup
                }
                this.writeStream = null;
            }
            
            // Create new write stream
            this.writeStream = fs.createWriteStream(this.pipePath, { flags: 'w' });

            // Error handler with proper cleanup
            this.writeStream.on('error', (error) => {
                if (error.code === 'EPIPE') {
                    console.log(`[PIPE ${this.channelId}] Reader disconnected, will retry...`);
                } else {
                    console.error(`[PIPE ${this.channelId}] Write stream error:`, error.message);
                }
                
                // Clean up on error
                if (this.writeStream) {
                    this.writeStream.removeAllListeners();
                    this.writeStream = null;
                }
            });

            this.writeStream.on('close', () => {
                console.log(`[PIPE ${this.channelId}] Write stream closed`);
                if (this.writeStream) {
                    this.writeStream.removeAllListeners();
                    this.writeStream = null;
                }
            });

            // Add drain event to prevent memory buildup
            this.writeStream.on('drain', () => {
                // Buffer has been flushed
            });
        }
        return this.writeStream;
    }

    async destroy() {
        try {
            this.isActive = false;
            
            // Clean up write stream with all listeners
            if (this.writeStream) {
                try {
                    this.writeStream.removeAllListeners();
                    this.writeStream.end();
                    this.writeStream.destroy();
                } catch (err) {
                    // Ignore errors during cleanup
                }
                this.writeStream = null;
            }
            
            // Remove the pipe file
            if (fs.existsSync(this.pipePath)) {
                await execAsync(`rm -f ${this.pipePath}`);
                console.log(`[PIPE ${this.channelId}] Destroyed: ${this.pipePath}`);
            }
        } catch (error) {
            console.error(`[PIPE ${this.channelId}] Error destroying pipe:`, error);
        }
    }
}

module.exports = PipeManager;
