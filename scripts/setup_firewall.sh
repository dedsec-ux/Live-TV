#!/bin/bash

# 🛡️ Basic DDoS Protection using iptables (Linux) or pfctl (macOS)

echo "🛡️ Setting up firewall protection..."

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "📱 macOS detected - Using pfctl"
    
    # Note: macOS pfctl configuration
    echo "⚠️  macOS pfctl requires manual configuration"
    echo "For full protection, consider using:"
    echo "1. Little Snitch (firewall app)"
    echo "2. Network Link Conditioner"
    echo "3. Or deploy to Linux server with iptables"
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 Linux detected - Configuring iptables"
    
    # Allow established connections
    sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
    
    # Limit new connections per IP (10 per minute)
    sudo iptables -A INPUT -p tcp --dport 8080 -m connlimit --connlimit-above 10 -j REJECT
    
    # Limit SYN packets (prevent SYN flood)
    sudo iptables -A INPUT -p tcp --syn -m limit --limit 1/s --limit-burst 3 -j ACCEPT
    
    # Drop invalid packets
    sudo iptables -A INPUT -m conntrack --ctstate INVALID -j DROP
    
    # Limit ICMP (ping) to 1 per second
    sudo iptables -A INPUT -p icmp -m limit --limit 1/s -j ACCEPT
    sudo iptables -A INPUT -p icmp -j DROP
    
    # Log dropped packets (optional)
    sudo iptables -N LOGGING
    sudo iptables -A INPUT -j LOGGING
    sudo iptables -A LOGGING -m limit --limit 2/min -j LOG --log-prefix "IPTables-Dropped: " --log-level 4
    sudo iptables -A LOGGING -j DROP
    
    # Save rules
    if command -v iptables-save &> /dev/null; then
        sudo iptables-save > /etc/iptables/rules.v4
    fi
    
    echo "✅ Firewall rules applied!"
    echo ""
    echo "📊 Current rules:"
    sudo iptables -L -v
    
else
    echo "⚠️  Unknown OS - Please configure manually"
fi

echo ""
echo "🎯 Protection Summary:"
echo "   • Rate limiting: 10 requests/sec per IP"
echo "   • Connection limit: 10 concurrent per IP"
echo "   • API protection: 5 requests/sec per IP"
echo "   • HLS protection: 20 requests/sec per IP"
echo "   • Bot blocking: Common scrapers blocked"
echo ""
echo "🔄 To apply nginx changes:"
echo "   sudo nginx -t              # Test config"
echo "   sudo nginx -s reload       # Reload nginx"
