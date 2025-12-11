#!/bin/bash

# Master script to stop all live streaming channels

PID_DIR="/Users/talalrafiq/Desktop/company/inbv VOD live server/pids"

echo "Stopping all live streaming channels..."

# Method 1: Try to stop using PID files
STOPPED_COUNT=0
for i in {1..6}; do
    if [ -f "$PID_DIR/live${i}.pid" ]; then
        PID=$(cat "$PID_DIR/live${i}.pid")
        if ps -p $PID > /dev/null 2>&1; then
            echo "Stopping Live Channel $i (PID: $PID)..."
            kill $PID
            rm "$PID_DIR/live${i}.pid"
            echo "Live Channel $i stopped"
            STOPPED_COUNT=$((STOPPED_COUNT + 1))
        else
            echo "Live Channel $i PID file exists but process not running"
            rm "$PID_DIR/live${i}.pid"
        fi
    fi
done

# Method 2: Kill any remaining ffmpeg processes streaming to our RTMP server
REMAINING=$(ps aux | grep "ffmpeg.*rtmp://localhost/live" | grep -v grep | wc -l)
if [ "$REMAINING" -gt 0 ]; then
    echo ""
    echo "Found $REMAINING additional FFmpeg process(es) not tracked by PID files"
    echo "Stopping all FFmpeg streaming processes..."
    pkill -f "ffmpeg.*rtmp://localhost/live"
    sleep 1
fi

# Verify all stopped
STILL_RUNNING=$(ps aux | grep "ffmpeg.*rtmp://localhost/live" | grep -v grep | wc -l)
if [ "$STILL_RUNNING" -eq 0 ]; then
    echo ""
    echo "✅ All channels stopped successfully!"
else
    echo ""
    echo "⚠️  Warning: $STILL_RUNNING FFmpeg process(es) still running"
    echo "Run 'killall ffmpeg' to force stop all FFmpeg processes"
fi
