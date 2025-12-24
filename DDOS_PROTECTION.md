# 🛡️ DDoS Protection Configuration

## ✅ What's Implemented (100% FREE, No External Services)

### 1. **Nginx Rate Limiting**
- **General requests**: 10 req/sec per IP (burst: 20)
- **API requests**: 5 req/sec per IP (burst: 10)  
- **HLS streams**: 20 req/sec per IP (burst: 40)
- **Connection limit**: Max 10 concurrent connections per IP

### 2. **Bot Blocking**
- Blocks common scrapers, bots, crawlers
- Stops automated attacks

### 3. **Protection Benefits**
✅ **Prevents**: Request flooding, connection exhaustion
✅ **Limits**: Bandwidth abuse per IP
✅ **Blocks**: Automated scraping tools
✅ **No cost**: Built into Nginx (no external services)

---

## 🚀 How to Apply

### Step 1: Test Nginx Configuration
```bash
sudo nginx -t
```

### Step 2: Reload Nginx
```bash
sudo nginx -s reload
```

### Step 3: Verify Protection
Test rate limiting:
```bash
# This should get blocked after 10 requests
for i in {1..15}; do curl http://localhost:8080/; done
```

---

## 📊 What Happens When Attack Occurs

**Normal User** (5 req/sec): ✅ Works fine
**Attacker** (100 req/sec): ❌ Gets "503 Service Temporarily Unavailable"

The attacker's requests are dropped **before** they reach your application, saving resources.

---

## ⚠️ Important: IP Still Visible

**Rate limiting protects your SERVER, but your IP is still visible.**

To hide your IP, you MUST use:
1. **Domain + Cloudflare** (free, best option)
2. **Reverse proxy** (another server in front)
3. **VPN/Proxy service**

### Why?
- The embed URL `http://72.62.82.179/...` exposes your IP
- Attackers can still target it (but rate limits will protect you)
- With rate limiting: Your server survives small-medium attacks
- Without IP hiding: Determined attackers know the target

---

## 🎯 Recommended Setup

**Best Protection** (still free):
1. ✅ **Current**: Nginx rate limiting (done!)
2. ✅ **Add**: Cloudflare free account + cheap domain ($1-5/year)
3. ✅ **Result**: Hidden IP + DDoS protection + rate limiting

**Cost**: ~$5/year for domain (Cloudflare is 100% free)

---

## 🔧 Adjusting Limits

Edit `/nginx.conf` to change limits:

```nginx
# Make stricter (5 req/sec):
limit_req_zone $binary_remote_addr zone=general:10m rate=5r/s;

# Make looser (20 req/sec):
limit_req_zone $binary_remote_addr zone=general:10m rate=20r/s;
```

Then reload: `sudo nginx -s reload`

---

## 📈 Monitoring

Check nginx logs for blocked requests:
```bash
tail -f /opt/homebrew/var/log/nginx/error.log
```

Look for: "limiting requests, excess: ..."

---

## ✅ Summary

**Your server is now protected from**:
- ✅ Request flooding (rate limits)
- ✅ Connection exhaustion (connection limits)  
- ✅ Bot scraping (user agent blocking)
- ✅ Small to medium attacks

**Still vulnerable to**:
- ⚠️ Large DDoS (thousands of IPs) - need Cloudflare
- ⚠️ Targeted attacks on known IP - need to hide IP

**Cost**: $0 (completely free, no external services)

Your server can now handle abuse much better! 🎉
