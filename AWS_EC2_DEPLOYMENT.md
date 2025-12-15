# AWS EC2 Deployment Guide - Complete Setup

## Deploy Your Streaming Server to AWS EC2 in 30 Minutes

Your Docker setup will work **exactly as-is** on AWS EC2. Just upload and run!

---

## 📋 What You'll Get

- ✅ Public IP address accessible worldwide
- ✅ Your Docker container running 24/7
- ✅ Professional cloud infrastructure
- ✅ Scalable and reliable
- ✅ Same commands: `./deploy.sh` works!

---

## 💰 Cost Estimate

### **Recommended Instance: t3.medium** (For 10 Channels + 500GB Storage)
- **CPU**: 2 vCPUs
- **RAM**: 4GB
- **Storage**: **500GB SSD (gp3)**
- **Instance Cost**: ~$30/month ($0.042/hour)
- **Storage Cost**: ~$40/month ($0.08/GB)
- **Total**: **~$70/month**

### **Budget Option: t3.small** (For 5 Channels + 300GB Storage)
- **CPU**: 2 vCPUs
- **RAM**: 2GB  
- **Storage**: **300GB SSD (gp3)**
- **Instance Cost**: ~$15/month ($0.021/hour)
- **Storage Cost**: ~$24/month ($0.08/GB)
- **Total**: **~$40/month**

### **Storage Cost Breakdown:**
- **gp3 (Recommended)**: $0.08/GB-month
  - 300GB = **$24/month**
  - 500GB = **$40/month**
- **gp2 (Standard)**: $0.10/GB-month (slightly more expensive)

### **AWS Free Tier** (First 12 Months)
- **t2.micro**: FREE for 750 hours/month
- **30GB Storage**: FREE (gp2/gp3)
- **1GB RAM** - Good for testing (1-2 channels)

---

## 🚀 Step-by-Step Deployment

### **Step 1: Create AWS Account** (5 minutes)

1. Go to: https://aws.amazon.com
2. Click **"Create an AWS Account"**
3. Enter email, password
4. Enter payment details (required, but free tier available)
5. Verify identity (phone verification)
6. **Done!** You get **12 months free tier**

---

### **Step 2: Launch EC2 Instance** (10 minutes)

#### 2.1 Go to EC2 Dashboard

1. Login to AWS Console: https://console.aws.amazon.com
2. Search for "EC2" in top search bar
3. Click **"EC2"**
4. Click **"Launch Instance"** button

#### 2.2 Configure Instance

**Name and Tags:**
```
Name: INBV-Streaming-Server
```

**Application and OS Images (AMI):**
- Click **"Ubuntu"**
- Select: **Ubuntu Server 22.04 LTS**
- Architecture: **64-bit (x86)**

**Instance Type:**
- For production (10 channels): **t3.medium** ($30/month)
- For testing: **t2.micro** (FREE tier)
- For budget: **t3.small** ($15/month)

**Key Pair (Important!):**
- Click **"Create new key pair"**
- Name: `inbv-streaming-key`
- Type: **RSA**
- Format: **.pem** (for Mac/Linux)
- Click **"Create key pair"**
- **File downloads automatically - SAVE IT!**

**Network Settings:**
- Click **"Edit"**
- **Firewall (Security Groups):**
  - Click **"Create security group"**
  - Name: `inbv-streaming-sg`
  - Description: `Security group for streaming server`

**Add Rules:**

| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| SSH | TCP | 22 | My IP | SSH access |
| HTTP | TCP | 80 | Anywhere (0.0.0.0/0) | Admin Panel, HLS |
| Custom TCP | TCP | 1935 | Anywhere (0.0.0.0/0) | RTMP Streaming |
| Custom TCP | TCP | 3000 | Anywhere (0.0.0.0/0) | API Server |
| Custom TCP | TCP | 8080 | Anywhere (0.0.0.0/0) | HTTP Alternative |

**Configure Storage:**
- **Volume Type**: gp3 (Recommended - Best price/performance)
- **Size**: 
  - For 300GB: Enter **300**
  - For 500GB: Enter **500** ✅ **Recommended for your needs**
- **IOPS**: 3000 (default)
- **Throughput**: 125 MB/s (default)

**Storage Cost**:
- 300GB gp3 = **$24/month**
- 500GB gp3 = **$40/month**

**Advanced Details:**
- Leave default

**Click "Launch Instance"**

#### 2.3 Wait for Instance to Start (2-3 minutes)

- Click **"View Instances"**
- Wait until **Status** shows: ✅ **Running**
- Note the **Public IPv4 Address** (e.g., `3.145.67.89`)

---

### **Step 3: Connect to Your EC2 Instance** (5 minutes)

#### 3.1 Prepare Your Key File

```bash
# Move the downloaded key to a safe place
mv ~/Downloads/inbv-streaming-key.pem ~/.ssh/

# Set correct permissions (IMPORTANT!)
chmod 400 ~/.ssh/inbv-streaming-key.pem
```

#### 3.2 Connect via SSH

```bash
# Connect to your EC2 instance
# Replace YOUR_PUBLIC_IP with your instance's IP
ssh -i ~/.ssh/inbv-streaming-key.pem ubuntu@YOUR_PUBLIC_IP

# Example:
ssh -i ~/.ssh/inbv-streaming-key.pem ubuntu@3.145.67.89

# Type "yes" when asked to continue connecting
```

**You're now connected to your EC2 server!** ✅

---

### **Step 4: Upload Your Project** (5 minutes)

#### 4.1 From Your Mac Terminal (NEW terminal, not SSH one)

```bash
# Navigate to project parent folder
cd ~/Desktop/company

# Compress your project
tar -czf inbv-streaming.tar.gz "inbv VOD live server"

# Upload to EC2
# Replace YOUR_PUBLIC_IP with your instance IP
scp -i ~/.ssh/inbv-streaming-key.pem inbv-streaming.tar.gz ubuntu@YOUR_PUBLIC_IP:/home/ubuntu/

# This takes 2-5 minutes depending on your internet speed
```

---

### **Step 5: Install Docker on EC2** (3 minutes)

#### Back in your SSH session (EC2 terminal):

```bash
# Update system
sudo apt update

# Install Docker (one command!)
curl -fsSL https://get.docker.com | sudo sh

# Add ubuntu user to docker group (so you don't need sudo)
sudo usermod -aG docker ubuntu

# Apply group changes
newgrp docker

# Verify Docker is installed
docker --version

# Should show: Docker version 24.x.x or higher
```

**Optional: Install Docker Compose**

```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose

docker-compose --version
```

---

### **Step 6: Deploy Your Application** (7 minutes)

```bash
# Extract your project
cd /home/ubuntu
tar -xzf inbv-streaming.tar.gz

# Rename folder (remove spaces)
mv "inbv VOD live server" inbv-streaming

# Navigate into project
cd inbv-streaming

# Make deploy script executable
chmod +x deploy.sh

# Run deployment!
./deploy.sh

# Select option: 1 (Build and Run)
```

**The build takes 5-10 minutes** - Docker is downloading and building everything!

You'll see:
```
🔨 Building Docker image...
Step 1/17: FROM ubuntu:22.04
...
Successfully built abc123def
Successfully tagged inbv-streaming:latest

🚀 Starting container...
✅ Container is running!
```

---

### **Step 7: Access Your Server!** (Done!)

#### From anywhere in the world:

```
http://YOUR_EC2_PUBLIC_IP/admin-v2.html
```

**Example:**
```
http://3.145.67.89/admin-v2.html
```

**Share this URL with anyone!** They can access from anywhere! 🎉

---

## 🎮 Managing Your Server

### **SSH into Server:**

```bash
ssh -i ~/.ssh/inbv-streaming-key.pem ubuntu@YOUR_EC2_IP
```

### **View Logs:**

```bash
docker logs -f inbv-streaming-server
```

### **Restart Container:**

```bash
docker restart inbv-streaming-server
```

### **Stop Container:**

```bash
docker-compose down
```

### **Start Container:**

```bash
docker-compose up -d
```

### **Rebuild After Code Changes:**

```bash
# Upload new files via SCP
# Then on server:
cd /home/ubuntu/inbv-streaming
docker-compose down
docker-compose build
docker-compose up -d
```

---

## 🌐 Optional: Add Custom Domain

### **Step 1: Point Domain to EC2 IP**

In your domain registrar (GoDaddy, Namecheap, etc.):

**Add A Record:**
```
Type: A
Name: streaming (or @)
Value: YOUR_EC2_PUBLIC_IP
TTL: 300
```

### **Step 2: Access via Domain**

```
http://streaming.yourdomain.com/admin-v2.html
```

### **Step 3: Add SSL (HTTPS) - Optional**

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo docker exec -it inbv-streaming-server bash
apt update && apt install -y certbot
certbot --nginx -d streaming.yourdomain.com

# Follow prompts
```

Then access via:
```
https://streaming.yourdomain.com/admin-v2.html
```

---

## 💾 Backup Your Data

### **Backup to S3:**

```bash
# Install AWS CLI
sudo apt install -y awscli

# Configure AWS credentials
aws configure

# Backup videos to S3
aws s3 sync /home/ubuntu/inbv-streaming/videos s3://your-bucket-name/backups/videos/

# Schedule daily backups
crontab -e

# Add this line:
0 2 * * * aws s3 sync /home/ubuntu/inbv-streaming/videos s3://your-bucket-name/backups/videos/
```

---

## 🔒 Security Best Practices

### **1. Update SSH Port (Optional)**

```bash
sudo nano /etc/ssh/sshd_config

# Change line:
Port 2222  # Instead of 22

# Save and restart SSH
sudo systemctl restart ssh
```

Then update Security Group to allow port 2222 instead of 22.

### **2. Enable UFW Firewall**

```bash
# Allow SSH first!
sudo ufw allow 22/tcp

# Allow other ports
sudo ufw allow 80/tcp
sudo ufw allow 1935/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 8080/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### **3. Install Fail2Ban**

```bash
# Protects against brute force attacks
sudo apt install -y fail2ban

# Start service
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### **4. Keep System Updated**

```bash
# Update regularly
sudo apt update && sudo apt upgrade -y

# Auto-updates (optional)
sudo apt install -y unattended-upgrades
```

---

## 📊 Monitoring

### **Check CPU/RAM Usage:**

```bash
# Install htop
sudo apt install -y htop

# Run
htop
```

### **Check Docker Stats:**

```bash
docker stats inbv-streaming-server
```

### **Check Disk Space:**

```bash
df -h
```

### **View Nginx Logs:**

```bash
docker exec inbv-streaming-server tail -f /var/log/nginx/error.log
```

---

## 🆙 Scaling Up

### **If You Need More Resources:**

1. **Stop your instance** (AWS Console)
2. **Change Instance Type**:
   - Instance → Actions → Instance Settings → Change Instance Type
   - Select larger instance (e.g., t3.large, t3.xlarge)
3. **Start instance again**

Your data and setup remain intact!

---

## 💰 Cost Optimization

### **1. Use Reserved Instances (Save 30-70%)**

For 1-year commitment:
- t3.medium: ~$20/month (instead of $30)

### **2. Use Spot Instances (Save 70-90%)**

For non-critical workloads:
- t3.medium spot: ~$5-10/month
- May be interrupted

### **3. Stop Instance When Not Needed**

```bash
# From AWS Console or CLI
aws ec2 stop-instances --instance-ids i-1234567890abcdef0
```

You only pay for storage when stopped (~$2/month for 30GB).

---

## 🔧 Troubleshooting

### **Can't SSH into Instance:**

```bash
# Check security group allows your IP on port 22
# Verify key file permissions:
chmod 400 ~/.ssh/inbv-streaming-key.pem
```

### **Can't Access Admin Panel:**

```bash
# 1. Check security group allows ports 80, 1935, 3000
# 2. Verify container is running:
docker ps

# 3. Check logs:
docker logs inbv-streaming-server

# 4. Restart container:
docker restart inbv-streaming-server
```

### **Out of Disk Space:**

```bash
# Check space
df -h

# Clean Docker
docker system prune -a

# Or expand EBS volume in AWS Console
```

---

## 📝 Quick Command Reference

```bash
# Connect to EC2
ssh -i ~/.ssh/inbv-streaming-key.pem ubuntu@YOUR_IP

# Upload files
scp -i ~/.ssh/inbv-streaming-key.pem file.txt ubuntu@YOUR_IP:/home/ubuntu/

# View logs
docker logs -f inbv-streaming-server

# Restart
docker restart inbv-streaming-server

# Rebuild
cd /home/ubuntu/inbv-streaming
docker-compose down && docker-compose build && docker-compose up -d

# Check status
docker ps
docker stats

# System info
htop
df -h
```

---

## ✅ Deployment Checklist

After deployment, verify:

- [ ] EC2 instance running
- [ ] Can SSH into instance
- [ ] Docker installed and running
- [ ] Container built successfully
- [ ] Container is running (docker ps)
- [ ] Can access: `http://YOUR_IP/admin-v2.html`
- [ ] Can create a channel
- [ ] Can upload a video
- [ ] Can start a stream
- [ ] Security group configured correctly
- [ ] (Optional) Domain pointed to IP
- [ ] (Optional) SSL certificate installed

---

## 🎯 Summary

### **What You Did:**

1. ✅ Created AWS EC2 instance
2. ✅ Configured security groups
3. ✅ Uploaded your project
4. ✅ Installed Docker
5. ✅ Ran `./deploy.sh`
6. ✅ **Your streaming server is LIVE!**

### **Access Your Server:**

```
http://YOUR_EC2_PUBLIC_IP/admin-v2.html
```

### **Monthly Cost:**

- t3.medium (10 channels): **~$30/month**
- t3.small (5 channels): **~$15/month**
- t2.micro (testing): **FREE** (first 12 months)

---

## 🚀 You're Live on AWS EC2!

Your streaming server is now:
- ✅ Accessible from anywhere
- ✅ Running 24/7
- ✅ Professional cloud infrastructure
- ✅ Scalable
- ✅ Reliable

**Next steps:**
1. Create channels
2. Upload videos
3. Start streaming
4. Share your URL!

---

**Need help? Check logs**: `docker logs -f inbv-streaming-server`

**Your server URL**: `http://YOUR_EC2_IP/admin-v2.html` 🎉
