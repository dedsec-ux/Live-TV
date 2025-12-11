#!/bin/bash

# Create test video files for demonstration
# This script generates simple test patterns with timecode

VIDEO_DIR="/Users/talalrafiq/Desktop/company/inbv VOD live server/videos"

echo "Generating test video files..."

for i in {1..6}; do
    echo "Creating test video for channel $i..."
    
    # Generate a 30-second test video with color bars and timecode
    ffmpeg -f lavfi -i testsrc=duration=30:size=1280x720:rate=25 \
        -f lavfi -i sine=frequency=1000:duration=30 \
        -vf "drawtext=fontfile=/System/Library/Fonts/Helvetica.ttc:text='Channel $i - Test Video':x=(w-text_w)/2:y=100:fontsize=48:fontcolor=white:box=1:boxcolor=black@0.5:boxborderw=5,drawtext=fontfile=/System/Library/Fonts/Helvetica.ttc:text='%{pts\:hms}':x=(w-text_w)/2:y=200:fontsize=36:fontcolor=white:box=1:boxcolor=black@0.5:boxborderw=5" \
        -c:v libx264 -preset fast -pix_fmt yuv420p \
        -c:a aac -b:a 128k \
        "$VIDEO_DIR/video$i.mp4" -y
    
    echo "Created video$i.mp4"
done

echo ""
echo "✅ Test videos created successfully!"
echo "Videos are located in: $VIDEO_DIR"
