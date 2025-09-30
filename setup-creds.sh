#!/bin/bash

# 🔧 Quick Credential Setup Script
# Run this to set up your Substack API credentials

echo "🔧 Setting up Substack API credentials..."
echo ""
echo "📋 Instructions:"
echo "1. Open whiskeyandflowers.substack.com in your browser"
echo "2. Press F12 → Application → Cookies"
echo "3. Find 'connect.sid' cookie and copy its value"
echo "4. Paste it below when prompted"
echo ""

read -p "Enter your connect.sid cookie value: " COOKIE_VALUE
read -p "Enter hostname (or press Enter for whiskeyandflowers.substack.com): " HOSTNAME

# Use default if no hostname provided
if [ -z "$HOSTNAME" ]; then
    HOSTNAME="whiskeyandflowers.substack.com"
fi

echo ""
echo "🔧 Setting environment variables..."

# Export for current session
export SUBSTACK_API_KEY="$COOKIE_VALUE"
export SUBSTACK_HOSTNAME="$HOSTNAME"
export E2E_API_KEY="$COOKIE_VALUE"
export E2E_HOSTNAME="$HOSTNAME"

echo "✅ Credentials set for current session:"
echo "   SUBSTACK_HOSTNAME=$SUBSTACK_HOSTNAME"
echo "   SUBSTACK_API_KEY=[HIDDEN - ${#SUBSTACK_API_KEY} chars]"
echo ""
echo "🚀 Now you can run: npx ts-node PUNCH_IT.ts"
echo ""
echo "💡 To make permanent, add to your shell profile:"
echo "   echo 'export SUBSTACK_API_KEY=\"$COOKIE_VALUE\"' >> ~/.zshrc"
echo "   echo 'export SUBSTACK_HOSTNAME=\"$HOSTNAME\"' >> ~/.zshrc"
