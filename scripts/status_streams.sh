#!/bin/bash

# Script to check status of all streaming channels

PID_DIR="/Users/talalrafiq/Desktop/company/inbv VOD live server/pids"

echo "==================================="
echo "Live Streaming Channel Status"
echo "==================================="
echo ""

for i in {1..6}; do
    if [ -f "$PID_DIR/live${i}.pid" ]; then
        PID=$(cat "$PID_DIR/live${i}.pid")
        if ps -p $PID > /dev/null 2>&1; then
            echo "✓ Live Channel $i: RUNNING (PID: $PID)"
        else
            echo "✗ Live Channel $i: NOT RUNNING (stale PID)"
        fi
    else
        echo "✗ Live Channel $i: NOT RUNNING"
    fi
done

echo ""
echo "==================================="
echo "Access Information:"
echo "==================================="
echo "RTMP URLs:"
for i in {1..6}; do
    echo "  Channel $i: rtmp://localhost/live${i}/stream"
done
echo ""
echo "HLS URLs:"
for i in {1..6}; do
    echo "  Channel $i: http://localhost:8080/hls/live${i}/stream.m3u8"
done
echo ""
echo "Statistics: http://localhost:8080/stat"
echo "==================================="
