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
        if (!this.writeStream) {
            this.writeStream = fs.createWriteStream(this.pipePath);
        }
        return this.writeStream;
    }
}

module.exports = PipeManager;
