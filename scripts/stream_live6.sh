#!/bin/bash

# Stream Live Channel 6
# This script streams a video file (or playlist) to RTMP application live6

RTMP_URL="rtmp://localhost/live6/stream"
VIDEO_FILE="/Users/talalrafiq/Desktop/company/inbv VOD live server/videos/video6.mp4"
PLAYLIST_FILE="/Users/talalrafiq/Desktop/company/inbv VOD live server/playlists/playlist6.txt"
LOG_FILE="/Users/talalrafiq/Desktop/company/inbv VOD live server/logs/live6.log"

# Check if playlist file exists, otherwise use single video
if [ -f "$PLAYLIST_FILE" ]; then
    echo "Starting stream for live6 with playlist..."
    ffmpeg -re -stream_loop -1 -f concat -safe 0 -i "$PLAYLIST_FILE" \
        -c:v libx264 -preset veryfast -maxrate 3000k -bufsize 6000k \
        -pix_fmt yuv420p -g 50 -c:a aac -b:a 128k -ac 2 -ar 44100 \
        -f flv "$RTMP_URL" 2>&1 | tee -a "$LOG_FILE"
elif [ -f "$VIDEO_FILE" ]; then
    echo "Starting stream for live6 with single video..."
    ffmpeg -re -stream_loop -1 -i "$VIDEO_FILE" \
        -c:v libx264 -preset veryfast -maxrate 3000k -bufsize 6000k \
        -pix_fmt yuv420p -g 50 -c:a aac -b:a 128k -ac 2 -ar 44100 \
        -f flv "$RTMP_URL" 2>&1 | tee -a "$LOG_FILE"
else
    echo "Error: Neither playlist nor video file found for live6"
    exit 1
fi
