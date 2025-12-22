# Docker-based Deployment
# Build and run entire streaming server in one container

FROM ubuntu:22.04

# Prevent interactive prompts during build
ENV DEBIAN_FRONTEND=noninteractive

# Install all dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    libpcre3 \
    libpcre3-dev \
    libssl-dev \
    zlib1g-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Build nginx with RTMP module
WORKDIR /tmp
RUN wget http://nginx.org/download/nginx-1.24.0.tar.gz \
    && wget https://github.com/arut/nginx-rtmp-module/archive/master.zip -O rtmp-module.zip \
    && tar -zxvf nginx-1.24.0.tar.gz \
    && apt-get update && apt-get install -y unzip \
    && unzip rtmp-module.zip

WORKDIR /tmp/nginx-1.24.0
RUN ./configure \
    --prefix=/etc/nginx \
    --sbin-path=/usr/sbin/nginx \
    --conf-path=/etc/nginx/nginx.conf \
    --error-log-path=/var/log/nginx/error.log \
    --http-log-path=/var/log/nginx/access.log \
    --pid-path=/var/run/nginx.pid \
    --lock-path=/var/run/nginx.lock \
    --with-http_ssl_module \
    --with-http_v2_module \
    --add-module=../nginx-rtmp-module-master \
    && make -j$(nproc) \
    && make install

# Create necessary directories
RUN mkdir -p /var/www/html/hls/{live1,live2,live3,live4,live5,live6,live7,live8,live9,live10} \
    && mkdir -p /opt/inbv-streaming \
    && mkdir -p /var/log/nginx

# Set working directory
WORKDIR /opt/inbv-streaming

# Copy project files
COPY package*.json ./
RUN npm install

COPY . .

# Create required directories
RUN mkdir -p videos/{channel1,channel2,channel3,channel4,channel5,channel6,channel7,channel8,channel9,channel10} \
    && mkdir -p playlists pids logs lib \
    && chmod -R 755 videos playlists pids logs lib

# Copy HTML and Logo files to nginx directory
RUN cp *.html /var/www/html/ 2>/dev/null || true && \
    cp *.png /var/www/html/ 2>/dev/null || true

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Expose ports
EXPOSE 80 1935 3000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

# Start script
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
