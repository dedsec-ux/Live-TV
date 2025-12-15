#!/bin/bash
# Startup script for INBV Streaming Server Docker container

echo "🚀 Starting INBV Streaming Server..."

# Start nginx
echo "📡 Starting Nginx with RTMP..."
nginx

# Check if nginx started
if [ $? -eq 0 ]; then
    echo "✅ Nginx started successfully"
else
    echo "❌ Nginx failed to start"
    exit 1
fi

# Start Node.js API server
echo "🔧 Starting Node.js API Server..."
cd /opt/inbv-streaming

# Run in background and capture PID
node api-server.js &
NODE_PID=$!

echo "✅ Node.js API Server started (PID: $NODE_PID)"

# Wait a moment to check if it's still running
sleep 2

if kill -0 $NODE_PID 2>/dev/null; then
    echo "✅ All services running successfully!"
    echo ""
    echo "📺 Access Points:"
    echo "   Admin Panel: http://localhost/admin-v2.html"
    echo "   RTMP Stats:  http://localhost/stat"
    echo "   API Server:  http://localhost:3000"
    echo ""
else
    echo "❌ Node.js API Server failed to start"
    exit 1
fi

# Keep container running and show logs
echo "📝 Showing combined logs (Ctrl+C to stop):"
echo "----------------------------------------"

# Tail both nginx and node logs
tail -f /var/log/nginx/error.log /opt/inbv-streaming/logs/*.log 2>/dev/null &

# Wait for Node.js process
wait $NODE_PID
