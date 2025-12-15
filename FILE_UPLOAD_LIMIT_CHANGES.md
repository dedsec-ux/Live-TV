# File Upload Limit Changes

## Problem
- **Error**: `MulterError: File too large`
- **Old Limit**: 500 MB per file
- **Issue**: Cannot upload large video files

## Solution Applied ✅

### Changes Made:

#### 1. **Increased Multer File Size Limit** (`api-server.js`)

**Before:**
```javascript
limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
```

**After:**
```javascript
limits: { fileSize: 10 * 1024 * 1024 * 1024 } // 10GB limit - supports large videos
```

#### 2. **Increased Body Parser Limits** (`api-server.js`)

**Before:**
```javascript
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
```

**After:**
```javascript
app.use(bodyParser.json({ limit: '50mb' })); // Increased for large video metadata
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
```

#### 3. **Updated Admin Panel Text** (`admin-v2.html`)

**Before:**
```html
Supported: MP4, AVI, MOV, MKV, FLV (Max 500MB each)
```

**After:**
```html
Supported: MP4, AVI, MOV, MKV, FLV (Up to 10GB per file)
```

## New Upload Limits

| Type | Old Limit | New Limit |
|------|-----------|-----------|
| **Video Files** | 500 MB | **10 GB** |
| **JSON Data** | ~1 MB | **50 MB** |
| **Form Data** | ~1 MB | **50 MB** |

## What This Means

✅ **Can now upload:**
- Full-length movies
- High-bitrate 1080p content
- 4K videos (smaller ones)
- Long-form content
- Multi-hour streams

✅ **No more errors** for large files

## How to Use

### For Current Session (Mac):
1. **Restart the server** to apply changes:
   - Stop current server (Ctrl+C in terminal)
   - Start again: `node api-server.js`

2. **Upload large videos**:
   - Go to Admin Panel V2
   - Create/select a channel
   - Click "Upload Videos"
   - Select files up to 10GB

### For Linux Server:

Add these changes to your deployment:

1. **Update `api-server.js`** with the new limits (already done in your local files)

2. **Add to nginx.conf** (for web uploads through nginx):

```nginx
http {
    # Add this line in the http block
    client_max_body_size 10G;
    
    # ... rest of config
}
```

3. **Restart services**:
```bash
sudo systemctl restart nginx
sudo systemctl restart inbv-api
```

## Important Notes

### ⚠️ Considerations:

1. **Disk Space**: Ensure sufficient disk space for large files
   ```bash
   df -h  # Check available space
   ```

2. **Upload Time**: Large files take longer to upload
   - 1GB @ 10 Mbps upload = ~13 minutes
   - 5GB @ 10 Mbps upload = ~67 minutes
   - 10GB @ 10 Mbps upload = ~134 minutes

3. **Memory Usage**: Server RAM usage may increase during large uploads

4. **Network**: Ensure stable internet connection for large uploads

### 💡 Best Practices:

1. **Test with smaller files first** to ensure system is working
2. **Monitor disk space** regularly: `df -h`
3. **Upload during off-peak hours** for faster speeds
4. **Keep backups** of important videos

## Troubleshooting

### Upload Still Fails?

#### Check 1: Server Memory
```bash
# Check available memory
free -h

# If low, add swap space (Linux)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### Check 2: Nginx Upload Limit (Linux)
```bash
# Edit nginx.conf
sudo nano /etc/nginx/nginx.conf

# Add in http block:
client_max_body_size 10G;

# Restart nginx
sudo systemctl restart nginx
```

#### Check 3: Timeout Settings
```bash
# If upload times out, increase nginx timeouts
# In nginx.conf, add to http block:
client_body_timeout 600s;
send_timeout 600s;
proxy_read_timeout 600s;
proxy_connect_timeout 600s;
```

#### Check 4: Disk Space
```bash
# Check space
df -h

# Clean up unnecessary files
sudo apt autoremove
sudo apt autoclean

# Or delete old videos/logs
```

## For Linux Deployment

Add this to your `LINUX_DEPLOYMENT_GUIDE.md` in the nginx configuration section:

```nginx
http {
    # ... existing config ...
    
    # Allow large file uploads (10GB)
    client_max_body_size 10G;
    client_body_timeout 600s;
    send_timeout 600s;
    
    # ... rest of config ...
}
```

## Testing

### Test Upload Limits:

1. **Small file (< 100MB)**: Should upload quickly
2. **Medium file (500MB - 1GB)**: Should work without errors
3. **Large file (5GB+)**: Be patient, monitor progress

### Monitor Upload:

**Watch server logs:**
```bash
# On Mac
tail -f logs/live1.log

# On Linux
sudo journalctl -u inbv-api -f
```

**Check disk usage:**
```bash
# While uploading
du -sh videos/channel*
```

## Summary

✅ **File size limit increased**: 500MB → 10GB
✅ **Admin panel updated**: Shows new 10GB limit
✅ **Body parser updated**: Supports large metadata
✅ **Ready for production**: Can handle any video size up to 10GB

**No more "File too large" errors!** 🎉

---

## Files Modified

1. ✅ `api-server.js` - Multer and body-parser limits
2. ✅ `admin-v2.html` - Upload UI text
3. ✅ `/opt/homebrew/var/www/admin-v2.html` - Updated copy

## Next Step

**Restart your server** to apply these changes:

```bash
# Stop current server (Ctrl+C)
# Then restart:
node api-server.js
```

Now try uploading your large video! 🚀
