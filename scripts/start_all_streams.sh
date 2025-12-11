#!/bin/bash

# Master script to start all live streaming channels

SCRIPT_DIR="/Users/talalrafiq/Desktop/company/inbv VOD live server/scripts"
LOG_DIR="/Users/talalrafiq/Desktop/company/inbv VOD live server/logs"
PID_DIR="/Users/talalrafiq/Desktop/company/inbv VOD live server/pids"

# Create PID directory if it doesn't exist
mkdir -p "$PID_DIR"

echo "Starting all live streaming channels..."

# Start each channel in the background
for i in {1..6}; do
    if [ -f "$SCRIPT_DIR/stream_live${i}.sh" ]; then
        echo "Starting Live Channel $i..."
        
        # Start the stream and capture the actual PID
        "$SCRIPT_DIR/stream_live${i}.sh" > "$LOG_DIR/live${i}.log" 2>&1 &
        STREAM_PID=$!
        
        echo "$STREAM_PID" > "$PID_DIR/live${i}.pid"
        echo "Live Channel $i started with PID: $STREAM_PID"
    else
        echo "Warning: Script for Live Channel $i not found"
    fi
done

echo ""
echo "All channels started!"
echo "You can view the streams at:"
echo "  - RTMP: rtmp://localhost/live1/stream through rtmp://localhost/live6/stream"
echo "  - HLS:  http://localhost:8080/hls/live1/stream.m3u8 through http://localhost:8080/hls/live6/stream.m3u8"
echo ""
echo "Check stream statistics at: http://localhost:8080/stat"
echo ""
echo "To stop all streams, run: ./scripts/stop_all_streams.sh"
echo "To view logs: tail -f logs/liveX.log"
