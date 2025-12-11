#!/bin/bash

# System Verification Script
# This script checks if all components are properly installed and configured

echo "=========================================="
echo "VOD-to-Live Streaming System Verification"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Check Homebrew
echo "1. Checking Homebrew..."
if command -v brew &> /dev/null; then
    check_pass "Homebrew is installed"
else
    check_fail "Homebrew is NOT installed"
fi
echo ""

# 2. Check Nginx
echo "2. Checking Nginx..."
if command -v /opt/homebrew/opt/nginx-full/bin/nginx &> /dev/null; then
    check_pass "Nginx-full is installed"
    NGINX_VERSION=$(/opt/homebrew/opt/nginx-full/bin/nginx -v 2>&1)
    echo "   Version: $NGINX_VERSION"
else
    check_fail "Nginx-full is NOT installed"
fi
echo ""

# 3. Check FFmpeg
echo "3. Checking FFmpeg..."
if command -v ffmpeg &> /dev/null; then
    check_pass "FFmpeg is installed"
    FFMPEG_VERSION=$(ffmpeg -version | head -n1)
    echo "   Version: $FFMPEG_VERSION"
else
    check_fail "FFmpeg is NOT installed"
fi
echo ""

# 4. Check Nginx Configuration
echo "4. Checking Nginx Configuration..."
if /opt/homebrew/opt/nginx-full/bin/nginx -t &> /dev/null; then
    check_pass "Nginx configuration is valid"
else
    check_fail "Nginx configuration has errors"
fi
echo ""

# 5. Check Nginx Service
echo "5. Checking Nginx Service..."
if pgrep -x nginx > /dev/null; then
    check_pass "Nginx is running"
    PID=$(pgrep -x nginx | head -n1)
    echo "   Master PID: $PID"
else
    check_warn "Nginx is NOT running"
    echo "   Run: brew services start denji/nginx/nginx-full"
fi
echo ""

# 6. Check RTMP Port
echo "6. Checking RTMP Port (1935)..."
if lsof -i :1935 &> /dev/null; then
    check_pass "Port 1935 is open and listening"
else
    check_warn "Port 1935 is not listening"
fi
echo ""

# 7. Check HTTP Port
echo "7. Checking HTTP Port (8080)..."
if lsof -i :8080 &> /dev/null; then
    check_pass "Port 8080 is open and listening"
else
    check_warn "Port 8080 is not listening"
fi
echo ""

# 8. Check Directory Structure
echo "8. Checking Directory Structure..."
DIRS=("videos" "playlists" "scripts" "logs")
for dir in "${DIRS[@]}"; do
    if [ -d "/Users/talalrafiq/Desktop/company/inbv VOD live server/$dir" ]; then
        check_pass "Directory '$dir' exists"
    else
        check_fail "Directory '$dir' missing"
    fi
done
echo ""

# 9. Check HLS Directories
echo "9. Checking HLS Directories..."
for i in {1..6}; do
    if [ -d "/opt/homebrew/var/www/hls/live$i" ]; then
        check_pass "HLS directory 'live$i' exists"
    else
        check_fail "HLS directory 'live$i' missing"
    fi
done
echo ""

# 10. Check Scripts
echo "10. Checking Streaming Scripts..."
SCRIPTS=("stream_live1.sh" "stream_live2.sh" "stream_live3.sh" "stream_live4.sh" "stream_live5.sh" "stream_live6.sh" "start_all_streams.sh" "stop_all_streams.sh" "status_streams.sh")
for script in "${SCRIPTS[@]}"; do
    if [ -x "/Users/talalrafiq/Desktop/company/inbv VOD live server/scripts/$script" ]; then
        check_pass "Script '$script' is executable"
    else
        check_fail "Script '$script' is missing or not executable"
    fi
done
echo ""

# 11. Check for Video Files
echo "11. Checking for Video Files..."
VIDEO_COUNT=$(ls -1 /Users/talalrafiq/Desktop/company/inbv\ VOD\ live\ server/videos/*.mp4 2>/dev/null | wc -l)
if [ "$VIDEO_COUNT" -gt 0 ]; then
    check_pass "Found $VIDEO_COUNT video file(s)"
    ls -lh /Users/talalrafiq/Desktop/company/inbv\ VOD\ live\ server/videos/*.mp4 2>/dev/null | awk '{print "   - " $9 " (" $5 ")"}'
else
    check_warn "No video files found"
    echo "   To create test videos, run: ./scripts/create_test_videos.sh"
fi
echo ""

# 12. Check Running Streams
echo "12. Checking Running Streams..."
PID_DIR="/Users/talalrafiq/Desktop/company/inbv VOD live server/pids"
RUNNING_COUNT=0
for i in {1..6}; do
    if [ -f "$PID_DIR/live${i}.pid" ]; then
        PID=$(cat "$PID_DIR/live${i}.pid")
        if ps -p $PID > /dev/null 2>&1; then
            check_pass "Stream live$i is running (PID: $PID)"
            RUNNING_COUNT=$((RUNNING_COUNT + 1))
        else
            check_warn "Stream live$i has stale PID"
        fi
    fi
done

if [ "$RUNNING_COUNT" -eq 0 ]; then
    check_warn "No streams are currently running"
    echo "   To start all streams, run: ./scripts/start_all_streams.sh"
fi
echo ""

# Summary
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo ""

if pgrep -x nginx > /dev/null && [ "$VIDEO_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ System is ready to stream!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start streams: ./scripts/start_all_streams.sh"
    echo "2. Check status: ./scripts/status_streams.sh"
    echo "3. Test with VLC: rtmp://localhost/live1/stream"
elif ! pgrep -x nginx > /dev/null; then
    echo -e "${YELLOW}⚠ System needs Nginx to be started${NC}"
    echo ""
    echo "Start Nginx with:"
    echo "  brew services start denji/nginx/nginx-full"
elif [ "$VIDEO_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠ System needs video files${NC}"
    echo ""
    echo "Create test videos with:"
    echo "  ./scripts/create_test_videos.sh"
else
    echo -e "${RED}✗ System has issues that need to be resolved${NC}"
fi

echo ""
echo "=========================================="
