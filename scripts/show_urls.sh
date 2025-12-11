#!/bin/bash

# Display all stream access URLs

LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║            🎬 INBV VOD-to-Live Stream Access URLs 🎬             ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 SERVER IP ADDRESSES:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Local Network (WiFi): $LOCAL_IP"
echo "  Localhost: 127.0.0.1 or localhost"
echo ""
echo "🌐 WEB PLAYER (Open in Browser):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📱 From Same WiFi:  http://$LOCAL_IP:8080/player.html"
echo "  💻 From This Mac:   http://localhost:8080/player.html"
echo ""
echo "📺 HLS STREAMS (For Web/Mobile Players):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for i in {1..6}; do
    echo "  Channel $i: http://$LOCAL_IP:8080/hls/live${i}/stream.m3u8"
done
echo ""
echo "📡 RTMP STREAMS (For VLC/OBS/Media Players):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for i in {1..6}; do
    echo "  Channel $i: rtmp://$LOCAL_IP/live${i}/stream"
done
echo ""
echo "📊 STATISTICS DASHBOARD:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  http://$LOCAL_IP:8080/stat"
echo ""
echo "💡 QUICK TESTS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1. Test on Phone (Same WiFi):"
echo "     → http://$LOCAL_IP:8080/player.html"
echo ""
echo "  2. Test in VLC:"
echo "     → Media → Open Network Stream"
echo "     → Enter: rtmp://$LOCAL_IP/live1/stream"
echo ""
echo "  3. For Internet Access:"
echo "     → See: INTERNET_ACCESS_GUIDE.md"
echo ""
echo "╚══════════════════════════════════════════════════════════════════╝"
