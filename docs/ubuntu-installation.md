# Ubuntu Server Installation Guide

Complete guide for installing and setting up the Substack API client (Enhanced Fork) on Ubuntu Server.

> **Note**: This guide is for the enhanced fork at https://github.com/b992/sub-api

## Prerequisites

- Ubuntu 20.04 LTS or newer
- sudo access
- Internet connection

## Step 1: Install Node.js

The Substack API client requires Node.js 16 or higher.

### Method 1: Using NodeSource Repository (Recommended)

Install Node.js 20.x (LTS):

```bash
# Update package index
sudo apt update

# Install curl if not already installed
sudo apt install -y curl

# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js and npm
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Method 2: Using nvm (Node Version Manager)

This is great if you need multiple Node.js versions:

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload your shell configuration
source ~/.bashrc

# Install Node.js 20
nvm install 20

# Use Node.js 20
nvm use 20

# Set as default
nvm alias default 20

# Verify installation
node --version
npm --version
```

## Step 2: Create Your Project Directory

```bash
# Create a directory for your project
mkdir -p ~/substack-automation
cd ~/substack-automation

# Initialize npm project
npm init -y
```

## Step 3: Install the Substack API Client

**Option 1: Install from GitHub (Recommended)**
```bash
# Install directly from GitHub
npm install git+https://github.com/b992/sub-api.git

# Install TypeScript and helpers
npm install dotenv
npm install --save-dev typescript ts-node @types/node

# Verify installation
npm list @b992/substack-api
```

**Option 2: Install from Local Clone**
```bash
# Clone the repository
cd ~
git clone https://github.com/b992/sub-api.git
cd sub-api
npm install
npm run build
npm link

# Go back to your project and link it
cd ~/substack-automation
npm link @b992/substack-api
npm install dotenv
npm install --save-dev typescript ts-node @types/node
```

## Step 4: Set Up Environment Variables

### Option 1: Using .env File (Recommended for Development)

```bash
# Install dotenv package
npm install dotenv

# Create .env file
nano .env
```

Add your credentials:

```bash
# Single publication
SUBSTACK_API_KEY=s%3Ayour-connect-sid-cookie-value-here
SUBSTACK_HOSTNAME=yourpub.substack.com
SUBSTACK_DEFAULT_SECTION_ID=123456

# Multiple publications (if needed)
POETRY_API_KEY=s%3A...
POETRY_HOSTNAME=poetry.substack.com
POETRY_DEFAULT_SECTION_ID=162170

TECH_API_KEY=s%3A...
TECH_HOSTNAME=tech.substack.com
TECH_DEFAULT_SECTION_ID=789012
```

Save and exit (Ctrl+X, then Y, then Enter).

```bash
# Secure your .env file
chmod 600 .env

# Make sure it's in .gitignore
echo ".env" >> .gitignore
```

### Option 2: System Environment Variables

For production or system-wide access:

```bash
# Edit your profile
nano ~/.bashrc

# Add at the end:
export SUBSTACK_API_KEY="s%3Ayour-cookie-value"
export SUBSTACK_HOSTNAME="yourpub.substack.com"
export SUBSTACK_DEFAULT_SECTION_ID="123456"

# Reload
source ~/.bashrc
```

## Step 5: Create a Test Script

Create `test.js`:

```bash
nano test.js
```

Add this code:

```javascript
require('dotenv').config();
const { SubstackClient } = require('@b992/substack-api');

async function test() {
  const client = new SubstackClient({
    apiKey: process.env.SUBSTACK_API_KEY,
    hostname: process.env.SUBSTACK_HOSTNAME,
    defaultSectionId: parseInt(process.env.SUBSTACK_DEFAULT_SECTION_ID || '0')
  });

  try {
    console.log('🔌 Testing connection...');
    const isConnected = await client.testConnectivity();
    console.log('✅ Connection status:', isConnected ? 'Connected!' : 'Failed');

    console.log('\n📊 Fetching profile...');
    const profile = await client.ownProfile();
    console.log('✅ Profile:', profile.name);

    console.log('\n📝 Fetching recent posts...');
    let count = 0;
    for await (const post of profile.posts({ limit: 3 })) {
      count++;
      console.log(`  ${count}. "${post.title}"`);
    }

    console.log('\n✨ Everything works!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

test();
```

Save and run:

```bash
node test.js
```

## Step 6: TypeScript Setup (Optional but Recommended)

If you prefer TypeScript:

```bash
# Initialize TypeScript
npx tsc --init

# Create test.ts
nano test.ts
```

Add TypeScript code:

```typescript
import { SubstackClient } from '@b992/substack-api';
import * as dotenv from 'dotenv';

dotenv.config();

async function test() {
  const client = new SubstackClient({
    apiKey: process.env.SUBSTACK_API_KEY!,
    hostname: process.env.SUBSTACK_HOSTNAME!,
    defaultSectionId: parseInt(process.env.SUBSTACK_DEFAULT_SECTION_ID || '0')
  });

  try {
    console.log('🔌 Testing connection...');
    const isConnected = await client.testConnectivity();
    console.log('✅ Connected!');

    const profile = await client.ownProfile();
    console.log('✅ Profile:', profile.name);

    console.log('\n📝 Recent posts:');
    for await (const post of profile.posts({ limit: 3 })) {
      console.log(`  - "${post.title}"`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

test();
```

Run with:

```bash
npx ts-node test.ts
```

## Step 7: Create a Publishing Script

Create `publish.js`:

```bash
nano publish.js
```

```javascript
require('dotenv').config();
const { SubstackClient } = require('@b992/substack-api');

async function publishPost(title, content) {
  const client = new SubstackClient({
    apiKey: process.env.SUBSTACK_API_KEY,
    hostname: process.env.SUBSTACK_HOSTNAME,
    defaultSectionId: parseInt(process.env.SUBSTACK_DEFAULT_SECTION_ID)
  });

  try {
    const profile = await client.ownProfile();
    
    const post = await profile.newPost()
      .setTitle(title)
      .setBodyHtml(content)
      .setDescription(`Published from Ubuntu server: ${title}`)
      .publish();

    console.log('✅ Published!');
    console.log('   Post ID:', post.id);
    console.log('   URL:', post.canonical_url);
    return post;
  } catch (error) {
    console.error('❌ Publishing failed:', error.message);
    throw error;
  }
}

// Example usage
const title = process.argv[2] || 'Test Post from Ubuntu';
const content = process.argv[3] || '<h2>Hello!</h2><p>This was published from my Ubuntu server using the Substack API!</p>';

publishPost(title, content)
  .then(() => console.log('✅ Done!'))
  .catch(err => process.exit(1));
```

Run it:

```bash
node publish.js "My First Post" "<h2>Hello World</h2><p>Content here</p>"
```

## Integration with n8n

If you're using n8n on your Ubuntu server:

### Install in n8n's Context

```bash
# Find your n8n installation directory
cd ~/.n8n

# Install from GitHub
npm install git+https://github.com/b992/sub-api.git

# Or if you cloned it locally
npm install ~/sub-api

# Restart n8n
sudo systemctl restart n8n
```

### Use in n8n Code Nodes

```javascript
const { SubstackClient } = require('@b992/substack-api');

const client = new SubstackClient({
  apiKey: process.env.SUBSTACK_API_KEY,
  hostname: process.env.SUBSTACK_HOSTNAME,
  defaultSectionId: 162170
});

const profile = await client.ownProfile();
const post = await profile.newPost()
  .setTitle($json.title)
  .setBodyHtml($json.content)
  .publish();

return [{ json: { postId: post.id, url: post.canonical_url } }];
```

See the [n8n Integration Guide](./n8n-integration.md) for complete details.

## Running as a Systemd Service (Optional)

If you want to run a continuous automation:

### Create Service File

```bash
sudo nano /etc/systemd/system/substack-automation.service
```

Add:

```ini
[Unit]
Description=Substack Automation Service
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/home/youruser/substack-automation
Environment="NODE_ENV=production"
EnvironmentFile=/home/youruser/substack-automation/.env
ExecStart=/usr/bin/node /home/youruser/substack-automation/server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Enable and Start

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable substack-automation

# Start service
sudo systemctl start substack-automation

# Check status
sudo systemctl status substack-automation

# View logs
sudo journalctl -u substack-automation -f
```

## Scheduled Tasks with Cron

To run scripts on a schedule:

```bash
# Edit crontab
crontab -e

# Add scheduled jobs:

# Publish daily at 8 AM
0 8 * * * cd /home/youruser/substack-automation && node publish.js >> /var/log/substack-automation.log 2>&1

# Run every hour
0 * * * * cd /home/youruser/substack-automation && node your-script.js

# Weekly on Monday at 9 AM
0 9 * * 1 cd /home/youruser/substack-automation && node weekly-post.js
```

## Troubleshooting

### Permission Errors

```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Port Already in Use

```bash
# Find what's using a port
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>
```

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Connection Issues

```bash
# Test your credentials
node -e "
const { SubstackClient } = require('substack-api');
const client = new SubstackClient({
  apiKey: process.env.SUBSTACK_API_KEY,
  hostname: process.env.SUBSTACK_HOSTNAME
});
client.testConnectivity().then(r => console.log('Connected:', r));
"
```

## Security Best Practices

### Firewall Setup

```bash
# Enable UFW (if not already enabled)
sudo ufw enable

# Allow SSH (important!)
sudo ufw allow ssh

# Allow HTTP/HTTPS if needed
sudo ufw allow http
sudo ufw allow https

# Check status
sudo ufw status
```

### File Permissions

```bash
# Secure your credentials
chmod 600 .env
chmod 700 ~/substack-automation

# If using system environment variables
sudo chmod 644 /etc/environment
```

### Keep System Updated

```bash
# Update system regularly
sudo apt update
sudo apt upgrade -y

# Update npm packages
npm update
npm outdated  # Check for outdated packages
```

## Next Steps

Now that you're installed, check out:

- [Configuration Guide](./configuration.md) - Complete configuration options
- [n8n Integration](./n8n-integration.md) - Workflow automation
- [Examples](./examples.md) - Real-world usage patterns
- [QuickStart](./quickstart.md) - Get started quickly

## Common Use Cases

### 1. Automated Daily Posts

```javascript
// daily-post.js
require('dotenv').config();
const { SubstackClient } = require('substack-api');

async function publishDaily() {
  const client = new SubstackClient({
    apiKey: process.env.SUBSTACK_API_KEY,
    hostname: process.env.SUBSTACK_HOSTNAME,
    defaultSectionId: parseInt(process.env.SUBSTACK_DEFAULT_SECTION_ID)
  });

  const date = new Date().toLocaleDateString();
  const profile = await client.ownProfile();
  
  await profile.newPost()
    .setTitle(`Daily Update - ${date}`)
    .setBodyHtml(`<h2>Today's Highlights</h2><p>Your automated content here...</p>`)
    .publish();
  
  console.log('✅ Daily post published!');
}

publishDaily().catch(console.error);
```

Then schedule with cron:
```bash
crontab -e
# Add: 0 8 * * * cd ~/substack-automation && node daily-post.js
```

### 2. RSS to Substack

```bash
# Install rss-parser
npm install rss-parser

# Create rss-to-substack.js (check examples/ for full code)
```

### 3. GitHub to Substack

Auto-post when you push to GitHub (webhook handler).

## Keeping It Updated

To update to the latest version:

```bash
# If installed from GitHub
cd ~/substack-automation
npm update @b992/substack-api

# Or pull latest changes if using local clone
cd ~/sub-api
git pull origin main
npm install
npm run build
```

## Getting Help

- **GitHub**: https://github.com/b992/sub-api
- **Issues**: https://github.com/b992/sub-api/issues
- **Documentation**: Check the [docs](../docs/) directory
- **Original Project**: https://github.com/jakub-k-slys/substack-api

---

**You're all set!** 🚀 Your Ubuntu server is now ready to automate Substack publishing!

