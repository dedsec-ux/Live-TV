# AWS EC2 Configuration for 300-500GB Storage

## 💰 Updated Cost Estimate for Your Setup

### **Recommended: t3.medium + 500GB Storage**

**Monthly Cost Breakdown:**
```
Instance (t3.medium):  $30.40/month
Storage (500GB gp3):   $40.00/month
Data Transfer:         $10-20/month (estimated)
────────────────────────────────────
TOTAL:                 ~$80-90/month
```

### **Budget Option: t3.small + 300GB Storage**

**Monthly Cost Breakdown:**
```
Instance (t3.small):   $15.20/month  
Storage (300GB gp3):   $24.00/month
Data Transfer:         $5-10/month (estimated)
────────────────────────────────────
TOTAL:                 ~$45-50/month
```

---

## 📊 Storage Configuration When Launching EC2

### **In the "Configure Storage" Section:**

**For 500GB (Recommended):**
```
Volume Type: gp3
Size (GiB): 500
IOPS: 3000 (default)
Throughput (MB/s): 125 (default)
Delete on Termination: ✓ (checked)
Encrypted: ○ (optional - for extra security)
```

**For 300GB (Budget):**
```
Volume Type: gp3
Size (GiB): 300
IOPS: 3000 (default)
Throughput (MB/s): 125 (default)
```

---

## 💾 Storage Type Comparison

| Type | Cost/GB | Performance | Best For |
|------|---------|-------------|----------|
| **gp3** | **$0.08/month** | 3000 IOPS | ✅ **Recommended** |
| gp2 | $0.10/month | 3000 IOPS | Older, more expensive |
| io2 | $0.125/month | 64000 IOPS | High-performance apps |

**Always choose gp3** - it's the best value!

---

## 🎯 Why 500GB?

**For your use case (10 channels, 24/7 streaming):**

### **Storage Usage Estimate:**

| Content | Size | Quantity | Total |
|---------|------|----------|-------|
| 1080p Video (1 hour) | ~3-5 GB | - | - |
| System + Docker | ~10 GB | 1 | 10 GB |
| Nginx + Logs | ~2 GB | 1 | 2 GB |
| **Videos for 10 channels** | 4 GB avg | 100 videos | **400 GB** |
| Buffer/Working Space | - | - | **88 GB** |
| **TOTAL** | - | - | **500 GB** ✅ |

**With 500GB you get:**
- ✅ ~100 hours of 1080p video content
- ✅ Room for growth
- ✅ Logs and temporary files
- ✅ Buffer space

---

## 📈 Expanding Storage Later (If Needed)

If you run out of space, you can expand your storage WITHOUT downtime:

### **Steps to Expand:**

1. **Go to EC2 Dashboard** → Volumes
2. **Select your volume** → Actions → Modify Volume
3. **Enter new size** (e.g., 500 → 750)
4. **Click Modify**
5. **Wait for modification to complete** (5-10 min)
6. **SSH into instance** and extend the filesystem:

```bash
# Check current size
df -h

# Extend partition (for Ubuntu)
sudo growpart /dev/xvda 1

# Resize filesystem
sudo resize2fs /dev/xvda1

# Verify new size
df -h
```

---

## 💡 Storage Cost Optimization Tips

### **1. Monitor Usage**
```bash
# Check storage usage
df -h

# Check video folder size
du -sh /home/ubuntu/inbv-streaming/videos/*

# Find large files
find /home/ubuntu -type f -size +1G
```

### **2. Implement Retention Policy**

Archive old videos to S3 (cheaper):
```bash
# S3 storage costs only $0.023/GB (vs $0.08/GB for EBS)

# Move old videos to S3
aws s3 sync /home/ubuntu/inbv-streaming/videos/old/ s3://your-bucket/archive/

# Delete local copies
rm -rf /home/ubuntu/inbv-streaming/videos/old/*
```

### **3. Enable S3 Lifecycle Policies**

Move rarely-accessed videos to Glacier:
- S3 Standard: $0.023/GB-month
- S3 Glacier: $0.004/GB-month (83% cheaper!)

---

## 🔄 Migration Path

### **Start Small, Scale Up**

**Month 1-3: Testing**
```
Instance: t2.micro (FREE tier)
Storage: 30GB (FREE tier)
Cost: $0 ✅
```

**Month 4-6: Light Production**
```
Instance: t3.small
Storage: 300GB
Cost: ~$40/month
```

**Month 7+: Full Production**
```
Instance: t3.medium
Storage: 500GB
Cost: ~$80/month
```

---

## 📝 Complete Setup for 500GB

### **When Launching EC2 Instance:**

1. **Instance Type**: t3.medium
2. **Storage Configuration**:
   ```
   Volume Type: gp3
   Size: 500
   IOPS: 3000
   Throughput: 125
   ```
3. **Security Groups**: Ports 22, 80, 1935, 3000, 8080
4. **Launch**!

### **After Instance is Running:**

```bash
# SSH into instance
ssh -i ~/.ssh/inbv-streaming-key.pem ubuntu@YOUR_IP

# Check storage
df -h
# Should show ~500GB available

# Verify storage type
lsblk
# Should show your 500GB volume

# Check mount point
mount | grep xvda
```

---

## ⚠️ Important Notes

### **Storage is NOT Included in Free Tier**

Even with free tier t2.micro:
- First **30GB is FREE**
- 300GB costs: **$24/month**
- 500GB costs: **$40/month**

### **Snapshots Cost Extra**

If you create EBS snapshots for backup:
- First snapshot: Full size (e.g., $40 for 500GB)
- Subsequent: Incremental (only changes)
- Consider using S3 backups instead (cheaper)

---

## 🎯 Final Recommendation

### **For Your Needs (300-500GB video storage):**

**Best Setup:**
```
Instance: t3.medium
Storage: 500GB gp3
Monthly Cost: ~$70-80
```

**Why:**
- ✅ Enough space for ~100 hours of 1080p video
- ✅ Room to grow
- ✅ Best performance with gp3
- ✅ Can expand later if needed
- ✅ Professional, reliable setup

---

## 📚 Updated Guides

All guides have been updated with 500GB storage configuration:
- ✅ `AWS_EC2_DEPLOYMENT.md` - Complete setup guide
- ✅ `AWS_EC2_QUICK_START.txt` - Quick reference

---

**Ready to deploy with 500GB storage!** 🚀

Just follow the updated `AWS_EC2_DEPLOYMENT.md` guide and select 500GB when configuring storage.
