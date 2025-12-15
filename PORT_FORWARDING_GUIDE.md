# Using Your Own Public IP (Port Forwarding) - FREE!

## ✅ Yes! You Can Use Your Public IP Address

This method is **completely FREE** - your Mac becomes the server directly accessible from the internet.

---

## 🎯 Requirements

You need:
1. ✅ Access to your router/modem settings
2. ✅ A public IP address (not behind carrier-grade NAT)
3. ✅ Your Mac running 24/7 (or when you want access)
4. ✅ Docker already running (which you have!)

---

## 📋 Step-by-Step Setup

### **Step 1: Find Your Mac's Local IP** (1 minute)

```bash
# On your Mac
ifconfig | grep "inet " | grep -v 127.0.0.1

# You'll see something like:
# inet 192.168.1.100 netmask 0xffffff00 broadcast 192.168.1.255
```

**Your Mac's local IP**: `192.168.1.100` (example)

**Write this down!** ✍️

---

### **Step 2: Find Your Public IP** (30 seconds)

```bash
# On your Mac
curl ifconfig.me

# You'll see something like:
# 203.45.67.89
```

**Your public IP**: `203.45.67.89` (example)

**Write this down!** ✍️

---

### **Step 3: Access Your Router** (2 minutes)

Your router is usually at one of these addresses:
- `http://192.168.1.1`
- `http://192.168.0.1`
- `http://10.0.0.1`

**Open in browser**: `http://192.168.1.1`

**Login credentials** are usually:
- Username: `admin`
- Password: `admin` or `password` or on router sticker

---

### **Step 4: Set Up Port Forwarding** (5 minutes)

Look for one of these menu options in your router:
- "Port Forwarding"
- "Virtual Server"
- "NAT"
- "Firewall" → "Port Forwarding"

**Add these port forwarding rules**:

#### Rule 1: HTTP (Admin Panel, HLS Streams)
```
Service Name: HTTP-Streaming
External Port: 80
Internal IP: 192.168.1.100  (your Mac's IP)
Internal Port: 80
Protocol: TCP
```

#### Rule 2: RTMP (Streaming Input)
```
Service Name: RTMP-Streaming
External Port: 1935
Internal IP: 192.168.1.100
Internal Port: 1935
Protocol: TCP
```

#### Rule 3: API (Node.js)
```
Service Name: API-Server
External Port: 3000
Internal IP: 192.168.1.100
Internal Port: 3000
Protocol: TCP
```

**Click Save/Apply**

---

### **Step 5: Test Your Public Access** (1 minute)

**From any device NOT on your WiFi** (use phone with cellular data):

```
http://YOUR_PUBLIC_IP/admin-v2.html

# Example:
http://203.45.67.89/admin-v2.html
```

**It should work!** 🎉

---

## 🔒 Important Security Steps

### **1. Change Docker to Run with Authentication** (Optional but recommended)

For security, you might want to add basic authentication. But first, let's test it works!

### **2. Update Mac Firewall**

```bash
# Allow incoming connections
# System Preferences → Security & Privacy → Firewall → Firewall Options
# Allow incoming connections for Docker
```

### **3. Keep Your Mac Updated**

```bash
# Check for macOS updates regularly
```

---

## 🌐 Problem: Your IP Might Change

Most home internet connections have **dynamic IPs** - they change occasionally.

### **Solution: Free Dynamic DNS (DDNS)**

Use a free DDNS service to get a domain that always points to your IP:

#### **Option 1: DuckDNS** (Easiest, FREE)

1. **Go to**: https://www.duckdns.org
2. **Sign in** with Google/GitHub
3. **Create a subdomain**: `yourname.duckdns.org`
4. **Install updater** on your Mac:

```bash
# Create update script
mkdir -p ~/duckdns
cd ~/duckdns

# Create update script
cat > duck.sh << 'EOF'
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=yourname&token=YOUR_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
EOF

# Replace 'yourname' and 'YOUR_TOKEN' with your values from DuckDNS.org

# Make executable
chmod +x duck.sh

# Test it
./duck.sh

# Should show: OK
```

5. **Auto-update every 5 minutes**:

```bash
# Add to crontab
crontab -e

# Add this line (press 'i' to insert, then paste):
*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1

# Press ESC, type :wq, press ENTER
```

6. **Access your server**:
```
http://yourname.duckdns.org/admin-v2.html
```

**Now your domain always works, even if IP changes!** 🎉

---

#### **Option 2: No-IP** (More Features, FREE)

1. Go to: https://www.noip.com
2. Sign up (free account)
3. Create hostname: `yourname.ddns.net`
4. Download their Dynamic Update Client for Mac
5. Run it to keep IP updated

---

## 📊 Port Forwarding vs Cloud Server

| Aspect | Port Forwarding (Your IP) | Cloud Server |
|--------|---------------------------|--------------|
| **Cost** | **FREE** ✅ | $9-12/month |
| **Setup** | 10 minutes | 20 minutes |
| **Performance** | Depends on your internet | Excellent |
| **Reliability** | Depends on your internet | Very high |
| **Mac Must Stay On** | YES ⚠️ | No |
| **Security** | You must manage | Managed |
| **Scalability** | Limited to your internet | Easy to upgrade |
| **Best For** | Testing, small personal use | Production, businesses |

---

## ⚠️ Limitations of Using Your Public IP

### **Things to Consider**:

1. **Mac Must Stay On 24/7**
   - Running all the time
   - Can't sleep
   - Uses electricity

2. **Your Internet Speed**
   - Upload speed is critical
   - 10 channels @ 1080p = ~52 Mbps upload needed
   - Check your speed: https://speedtest.net

3. **Dynamic IP Changes**
   - Need DDNS (free, easy to setup)

4. **Security Management**
   - You're responsible for security
   - Keep Mac updated
   - Consider firewall rules

5. **ISP Restrictions**
   - Some ISPs block port 80
   - May violate ToS (check your plan)
   - Carrier-grade NAT issues (some networks)

---

## ✅ When Port Forwarding is PERFECT

Use your own public IP if:
- ✅ You have good upload speed (60+ Mbps)
- ✅ Mac can run 24/7
- ✅ Your internet is stable
- ✅ You can access router settings
- ✅ Want FREE solution
- ✅ Testing before production deployment

---

## ❌ When You Should Use Cloud Server Instead

Use cloud server if:
- ❌ Limited upload speed (<50 Mbps)
- ❌ Mac can't run 24/7
- ❌ Unstable internet
- ❌ Can't access router
- ❌ Want professional setup
- ❌ Want guaranteed uptime

---

## 🚀 Quick Setup Summary

### **For FREE Using Your IP**:

```bash
# 1. Find Mac's local IP
ifconfig | grep "inet " | grep -v 127.0.0.1
# Example: 192.168.1.100

# 2. Find public IP
curl ifconfig.me
# Example: 203.45.67.89

# 3. Setup port forwarding in router:
# - Port 80 → 192.168.1.100:80
# - Port 1935 → 192.168.1.100:1935
# - Port 3000 → 192.168.1.100:3000

# 4. Setup DuckDNS (optional):
# - Get yourname.duckdns.org
# - Install updater script

# 5. Docker is already running
# No changes needed!

# 6. Access from anywhere:
http://YOUR_PUBLIC_IP/admin-v2.html
# OR with DDNS:
http://yourname.duckdns.org/admin-v2.html
```

**Total Cost: $0** ✨

---

## 🎯 My Recommendation

### **For Testing (Next 1-2 weeks)**:
👉 **Use Your Public IP** (FREE)
- Setup port forwarding (10 minutes)
- Get DuckDNS domain (5 minutes)
- Test everything
- See how it performs

### **For Production (After testing)**:
👉 **Move to Cloud Server** ($9/month)
- Better reliability
- Better performance  
- Professional setup
- Your Mac can rest!

---

## 🔧 Troubleshooting

### **Can't Access from Public IP**:

```bash
# 1. Check if ports are forwarded correctly
# Try accessing from phone (cellular data, not WiFi)

# 2. Check if ISP blocks port 80
# Try using port 8080 instead

# 3. Verify Docker is running
docker ps

# 4. Check Mac firewall
# System Preferences → Security → Firewall
```

### **IP Keeps Changing**:

```bash
# Setup DuckDNS (see above)
# It's free and takes 5 minutes!
```

---

## 📝 Complete Setup Checklist

- [ ] Find Mac's local IP
- [ ] Find public IP
- [ ] Access router settings
- [ ] Add port forwarding rules (80, 1935, 3000)
- [ ] Test from external device
- [ ] (Optional) Setup DuckDNS
- [ ] (Optional) Install DuckDNS updater
- [ ] Share your URL!

---

## 🎉 Final Result

**Your streaming server accessible at**:

```
http://YOUR_PUBLIC_IP/admin-v2.html

OR with DDNS:

http://yourname.duckdns.org/admin-v2.html
```

**Total Cost**: **$0** ✅  
**Setup Time**: **15 minutes**

---

**Want me to guide you through the port forwarding setup?** Just let me know what router you have!
