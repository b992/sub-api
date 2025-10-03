# Configuration Guide: Multi-Publication Support

**Updated**: October 3, 2025

## Overview

The Substack API client now supports **configurable default sections** per publication, making it perfect for managing multiple Substack publications and n8n automations!

## Key Features ✨

- ✅ **Default Section ID** in config - no need to specify every time
- ✅ **Multi-publication support** - one client per publication
- ✅ **Flexible** - can override section per-post when needed
- ✅ **n8n friendly** - easy to parameterize in workflows
- ✅ **Environment variables** - secure credential management

---

## Quick Start

### 1. Set Environment Variables

```bash
export SUBSTACK_API_KEY="s%3Ayour-connect-sid-cookie"
export SUBSTACK_HOSTNAME="yourpub.substack.com"
export SUBSTACK_DEFAULT_SECTION_ID="123456"
```

### 2. Initialize Client

```typescript
import { SubstackClient } from '@yourusername/substack-api'

const client = new SubstackClient({
  apiKey: process.env.SUBSTACK_API_KEY!,
  hostname: process.env.SUBSTACK_HOSTNAME!,
  defaultSectionId: parseInt(process.env.SUBSTACK_DEFAULT_SECTION_ID!)
})
```

### 3. Publish Without Specifying Section!

```typescript
const profile = await client.ownProfile()
const post = await profile.newPost()
  .setTitle("My Post")
  .setBodyHtml("<p>Content here</p>")
  // .setSection() is optional now!
  .publish()  // Uses defaultSectionId automatically ✨
```

---

## Configuration Options

### SubstackConfig Interface

```typescript
interface SubstackConfig {
  hostname: string                // Required: Your publication URL
  apiKey: string                  // Required: connect.sid cookie
  defaultSectionId?: number       // Optional: Auto-apply to all posts
  perPage?: number                // Optional: Pagination size (default: 25)
  cacheTTL?: number               // Optional: Cache TTL in seconds (default: 300)
  protocol?: 'http' | 'https'     // Optional: Protocol (default: 'https')
  substackBaseUrl?: string        // Optional: Global endpoint (default: 'https://substack.com')
}
```

### Required Fields

| Field | Description | How to Get |
|-------|-------------|------------|
| `hostname` | Publication URL without `https://` | Example: `yourpub.substack.com` |
| `apiKey` | Your `connect.sid` cookie | DevTools → Application → Cookies → copy entire value |

### Optional but Recommended

| Field | Description | Why Use It |
|-------|-------------|------------|
| `defaultSectionId` | Default section for posts | Avoids specifying section every time; REQUIRED for publishing |

---

## Multi-Publication Setup

Perfect for managing multiple Substack publications!

### Environment Variables

```bash
# Publication 1: Poetry
WHISKEY_API_KEY=s%3A...
WHISKEY_HOSTNAME=whiskeyandflowers.substack.com
WHISKEY_DEFAULT_SECTION_ID=162170

# Publication 2: Tech
TECH_API_KEY=s%3A...
TECH_HOSTNAME=techblog.substack.com
TECH_DEFAULT_SECTION_ID=789012

# Publication 3: Stories
CREATIVE_API_KEY=s%3A...
CREATIVE_HOSTNAME=mystories.substack.com
CREATIVE_DEFAULT_SECTION_ID=345678
```

### Code

```typescript
// Create separate clients for each publication
const whiskeyClient = new SubstackClient({
  apiKey: process.env.WHISKEY_API_KEY!,
  hostname: process.env.WHISKEY_HOSTNAME!,
  defaultSectionId: parseInt(process.env.WHISKEY_DEFAULT_SECTION_ID!)
})

const techClient = new SubstackClient({
  apiKey: process.env.TECH_API_KEY!,
  hostname: process.env.TECH_HOSTNAME!,
  defaultSectionId: parseInt(process.env.TECH_DEFAULT_SECTION_ID!)
})

// Use independently
await whiskeyClient.ownProfile()
  .then(p => p.newPost()
    .setTitle("New Poem")
    .setBodyHtml("<p>Poetry...</p>")
    .publish()  // Auto-uses Whiskey section
  )

await techClient.ownProfile()
  .then(p => p.newPost()
    .setTitle("Tech Article")
    .setBodyHtml("<p>Tech content...</p>")
    .publish()  // Auto-uses Tech section
  )
```

See [MULTI_PUBLICATION_EXAMPLE.ts](./MULTI_PUBLICATION_EXAMPLE.ts) for complete example.

---

## n8n Integration

### Option 1: Environment Variables

Set in your n8n instance and restart:

```bash
SUBSTACK_API_KEY=...
SUBSTACK_HOSTNAME=...
SUBSTACK_DEFAULT_SECTION_ID=...
```

### Option 2: n8n Credentials (Recommended)

Create custom credentials:

```json
{
  "name": "Substack Publication",
  "properties": [
    {
      "displayName": "Hostname",
      "name": "hostname",
      "type": "string"
    },
    {
      "displayName": "Cookie (connect.sid)",
      "name": "apiKey",
      "type": "string",
      "typeOptions": { "password": true }
    },
    {
      "displayName": "Default Section ID",
      "name": "defaultSectionId",
      "type": "number"
    }
  ]
}
```

### Option 3: Workflow Parameters

Pass dynamically in your n8n Function node:

```javascript
const { SubstackClient } = require('@yourusername/substack-api');

const client = new SubstackClient({
  hostname: $credentials.substackHostname,
  apiKey: $credentials.substackCookie,
  defaultSectionId: $credentials.sectionId
});

const profile = await client.ownProfile();
const post = await profile.newPost()
  .setTitle($json.title)
  .setBodyHtml($json.content)
  .publish();

return { 
  postId: post.id, 
  success: true 
};
```

---

## Override Default Section

You can always override the default section per-post:

```typescript
const post = await profile.newPost()
  .setTitle("Special Post")
  .setBodyHtml("<p>Content</p>")
  .setSection(999999)  // Override default
  .publish()
```

---

## Finding Your Section IDs

### Method 1: Browser DevTools

1. Go to your publication settings → Sections
2. Click on a section
3. Look at the URL: `/publish/settings/sections/{id}`
4. The number is your section ID

### Method 2: API (Coming Soon)

```typescript
const sections = await client.listSections()
sections.forEach(s => console.log(`${s.name}: ${s.id}`))
```

### Example Section IDs (Whiskey & Flowers)

- **Raw Thoughts 🤯**: 162170
- **Whiskey & Flowers 🌸**: 194500
- **The Broken Winds 🌌**: 158717

---

## Benefits

✅ **Cleaner Code** - No need to specify section every time

✅ **Multi-Publication** - Manage many publications with one codebase

✅ **Flexible** - Override section when needed

✅ **Secure** - Use environment variables or n8n credentials

✅ **n8n Ready** - Easy to parameterize in workflows

✅ **Type-Safe** - Full TypeScript support

---

## Migration Guide

### Before (Had to specify section every time)

```typescript
const post = await profile.newPost()
  .setTitle("My Post")
  .setBodyHtml("<p>Content</p>")
  .setSection(162170)  // Always required
  .publish()
```

### After (Section is optional)

```typescript
// Set once in config
const client = new SubstackClient({
  apiKey: process.env.SUBSTACK_API_KEY!,
  hostname: process.env.SUBSTACK_HOSTNAME!,
  defaultSectionId: 162170  // Set default
})

// Use everywhere without specifying
const post = await profile.newPost()
  .setTitle("My Post")
  .setBodyHtml("<p>Content</p>")
  // .setSection() is optional!
  .publish()  // Uses default section
```

---

## Security Best Practices

### ✅ DO:
- Store credentials in environment variables
- Use `.env` file (add to `.gitignore`)
- Use n8n's credential management
- Rotate cookies periodically

### ❌ DON'T:
- Hardcode cookies in source code
- Commit `.env` to git
- Share cookies publicly
- Use cookies from untrusted sources

---

## Troubleshooting

### "Please choose a section" Error

**Problem**: Trying to publish without a section

**Solution**: Either:
1. Set `defaultSectionId` in config, OR
2. Call `.setSection(id)` before `.publish()`

### Multiple Publications Not Working

**Problem**: Env vars conflicting

**Solution**: Use prefixes like `WHISKEY_`, `TECH_`, etc.

### Cookie Expired

**Problem**: 401 Unauthorized errors

**Solution**: Get a fresh `connect.sid` cookie from browser

---

## See Also

- [ENV_EXAMPLE.md](./ENV_EXAMPLE.md) - Detailed environment setup
- [MULTI_PUBLICATION_EXAMPLE.ts](./MULTI_PUBLICATION_EXAMPLE.ts) - Complete multi-pub example
- [TEST_PUBLISH.ts](./TEST_PUBLISH.ts) - Working test script
- [PUBLISH_API_STATUS.md](./PUBLISH_API_STATUS.md) - API documentation

---

**Ready to automate your Substack publications!** 🚀

