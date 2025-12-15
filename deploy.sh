#!/bin/bash
# Quick deployment script for INBV Streaming Server via Docker

echo "════════════════════════════════════════════════════════════════"
echo "    INBV Streaming Server - Docker Quick Deploy"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo ""
    echo "Please install Docker first:"
    echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "  sudo sh get-docker.sh"
    echo ""
    exit 1
fi

echo "✅ Docker is installed ($(docker --version))"

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "⚠️  Docker Compose is not installed (optional)"
    USE_COMPOSE=false
else
    echo "✅ Docker Compose is installed ($(docker-compose --version))"
    USE_COMPOSE=true
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  Deployment Options"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "1. Build and Run (First time or after code changes)"
echo "2. Start Existing Container"
echo "3. Stop Container"
echo "4. Restart Container"
echo "5. View Logs"
echo "6. Rebuild from Scratch"
echo "7. Remove Everything and Start Fresh"
echo "8. Exit"
echo ""
read -p "Select option [1-8]: " option

case $option in
    1)
        echo ""
        echo "🔨 Building Docker image..."
        if [ "$USE_COMPOSE" = true ]; then
            docker-compose build
            echo ""
            echo "🚀 Starting container..."
            docker-compose up -d
        else
            docker build -t inbv-streaming:latest .
            echo ""
            echo "🚀 Starting container..."
            docker run -d \
              --name inbv-streaming \
              -p 80:80 \
              -p 8080:8080 \
              -p 1935:1935 \
              -p 3000:3000 \
              -v $(pwd)/videos:/opt/inbv-streaming/videos \
              -v $(pwd)/playlists:/opt/inbv-streaming/playlists \
              -v $(pwd)/logs:/opt/inbv-streaming/logs \
              --restart unless-stopped \
              inbv-streaming:latest
        fi
        echo ""
        echo "✅ Container is running!"
        ;;
    
    2)
        echo ""
        echo "▶️  Starting container..."
        if [ "$USE_COMPOSE" = true ]; then
            docker-compose start
        else
            docker start inbv-streaming
        fi
        echo "✅ Container started!"
        ;;
    
    3)
        echo ""
        echo "⏹️  Stopping container..."
        if [ "$USE_COMPOSE" = true ]; then
            docker-compose stop
        else
            docker stop inbv-streaming
        fi
        echo "✅ Container stopped!"
        ;;
    
    4)
        echo ""
        echo "🔄 Restarting container..."
        if [ "$USE_COMPOSE" = true ]; then
            docker-compose restart
        else
            docker restart inbv-streaming
        fi
        echo "✅ Container restarted!"
        ;;
    
    5)
        echo ""
        echo "📝 Showing logs (Ctrl+C to exit):"
        echo "════════════════════════════════════════════════════════════════"
        if [ "$USE_COMPOSE" = true ]; then
            docker-compose logs -f
        else
            docker logs -f inbv-streaming
        fi
        ;;
    
    6)
        echo ""
        echo "🔨 Rebuilding from scratch (no cache)..."
        if [ "$USE_COMPOSE" = true ]; then
            docker-compose down
            docker-compose build --no-cache
            docker-compose up -d
        else
            docker stop inbv-streaming 2>/dev/null
            docker rm inbv-streaming 2>/dev/null
            docker rmi inbv-streaming:latest 2>/dev/null
            docker build --no-cache -t inbv-streaming:latest .
            docker run -d \
              --name inbv-streaming \
              -p 80:80 \
              -p 8080:8080 \
              -p 1935:1935 \
              -p 3000:3000 \
              -v $(pwd)/videos:/opt/inbv-streaming/videos \
              -v $(pwd)/playlists:/opt/inbv-streaming/playlists \
              -v $(pwd)/logs:/opt/inbv-streaming/logs \
              --restart unless-stopped \
              inbv-streaming:latest
        fi
        echo "✅ Complete rebuild finished!"
        ;;
    
    7)
        echo ""
        read -p "⚠️  Remove EVERYTHING (container, image, volumes)? [y/N]: " confirm
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            echo "🗑️  Removing everything..."
            if [ "$USE_COMPOSE" = true ]; then
                docker-compose down -v
            else
                docker stop inbv-streaming 2>/dev/null
                docker rm inbv-streaming 2>/dev/null
            fi
            docker rmi inbv-streaming:latest 2>/dev/null
            echo "✅ Everything removed!"
            echo ""
            echo "Note: Your videos/, playlists/, and logs/ folders are preserved."
        else
            echo "Cancelled."
        fi
        ;;
    
    8)
        echo "Goodbye!"
        exit 0
        ;;
    
    *)
        echo "Invalid option!"
        exit 1
        ;;
esac

# Show status
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  Current Status"
echo "════════════════════════════════════════════════════════════════"
docker ps --filter "name=inbv-streaming" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  Access Points"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "  📺 Admin Panel V2:  http://localhost/admin-v2.html"
echo "  📺 Admin Panel V1:  http://localhost/admin.html"
echo "  🎬 Player:          http://localhost/player.html"
echo "  📊 RTMP Stats:      http://localhost/stat"
echo "  🔧 API:             http://localhost:3000/api/channels"
echo ""
echo "  Replace 'localhost' with your server IP for remote access"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "💡 Tip: Run './deploy.sh' anytime to manage your container"
echo ""
