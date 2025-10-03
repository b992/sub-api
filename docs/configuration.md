# Configuration Guide

Complete guide for configuring the Substack API client (Enhanced Fork) for single and multi-publication setups.

> **Note**: This guide is for the enhanced fork at https://github.com/b992/sub-api

## Quick Start

```typescript
import { SubstackClient } from '@b992/substack-api';

const client = new SubstackClient({
  apiKey: process.env.SUBSTACK_API_KEY!,
  hostname: process.env.SUBSTACK_HOSTNAME!,
  defaultSectionId: parseInt(process.env.SUBSTACK_DEFAULT_SECTION_ID!)
});
```

## Configuration Options

### SubstackConfig Interface

```typescript
interface SubstackConfig {
  hostname: string                // Required: Your publication URL
  apiKey: string                  // Required: connect.sid cookie
  defaultSectionId?: number       // Optional: Default section for posts
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
| `defaultSectionId` | Default section for posts | Required for publishing; avoids specifying every time |

## Getting Your Credentials

### 1. API Key (connect.sid cookie)

1. Open your Substack publication in a browser
2. Login if not already logged in
3. Open Developer Tools (F12 or right-click → Inspect)
4. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
5. Click on **Cookies** in the left sidebar
6. Find your Substack domain (e.g., `yourpub.substack.com`)
7. Look for the `connect.sid` cookie
8. **Copy the entire value** (it's very long, starts with `s%3A`)

### 2. Hostname

Your hostname is your publication URL without `https://`:
- Full URL: `https://myawesome.substack.com`
- Hostname: `myawesome.substack.com`

### 3. Finding Section IDs

**Method 1: Browser DevTools**
1. Go to your publication settings → Sections
2. Click on a section
3. Look at the URL: `/publish/settings/sections/{id}`
4. The number is your section ID

**Method 2: API (Coming Soon)**
```typescript
const sections = await client.listSections()
sections.forEach(s => console.log(`${s.name}: ${s.id}`))
```

## Environment Variables

### Single Publication

Create a `.env` file:

```bash
# Your publication's hostname (without https://)
SUBSTACK_HOSTNAME=yourpub.substack.com

# Your connect.sid cookie (get from browser DevTools)
SUBSTACK_API_KEY=s%3Ayour-very-long-cookie-value-here

# Default section ID for publishing posts
SUBSTACK_DEFAULT_SECTION_ID=123456
```

Then use in code:

```typescript
import { SubstackClient } from '@b992/substack-api';

const client = new SubstackClient({
  apiKey: process.env.SUBSTACK_API_KEY!,
  hostname: process.env.SUBSTACK_HOSTNAME!,
  defaultSectionId: parseInt(process.env.SUBSTACK_DEFAULT_SECTION_ID!)
});

// All posts will auto-use the default section
const post = await client.ownProfile()
  .then(profile => profile.newPost()
    .setTitle("My Post")
    .setBodyHtml("<p>Content</p>")
    .publish()  // Uses default section automatically!
  );
```

### Multiple Publications

For managing multiple Substack publications (perfect for n8n automations!):

```bash
# Publication 1: Poetry
POETRY_API_KEY=s%3A...
POETRY_HOSTNAME=mypoetry.substack.com
POETRY_DEFAULT_SECTION_ID=162170

# Publication 2: Tech Blog
TECH_API_KEY=s%3A...
TECH_HOSTNAME=techblog.substack.com
TECH_DEFAULT_SECTION_ID=789012

# Publication 3: Newsletter
NEWS_API_KEY=s%3A...
NEWS_HOSTNAME=mynewsletter.substack.com
NEWS_DEFAULT_SECTION_ID=345678
```

Use in code:

```typescript
// Create separate clients for each publication
const poetryClient = new SubstackClient({
  apiKey: process.env.POETRY_API_KEY!,
  hostname: process.env.POETRY_HOSTNAME!,
  defaultSectionId: parseInt(process.env.POETRY_DEFAULT_SECTION_ID!)
});

const techClient = new SubstackClient({
  apiKey: process.env.TECH_API_KEY!,
  hostname: process.env.TECH_HOSTNAME!,
  defaultSectionId: parseInt(process.env.TECH_DEFAULT_SECTION_ID!)
});

// Use them independently
await poetryClient.ownProfile()
  .then(p => p.newPost()
    .setTitle("New Poem")
    .setBodyHtml("<p>Poetry here</p>")
    .publish()  // Auto-uses Poetry section
  );

await techClient.ownProfile()
  .then(p => p.newPost()
    .setTitle("Tech Article")
    .setBodyHtml("<p>Tech content</p>")
    .publish()  // Auto-uses Tech section
  );
```

## Override Default Section

You can always override the default section per-post:

```typescript
const post = await profile.newPost()
  .setTitle("Special Post")
  .setBodyHtml("<p>Content</p>")
  .setSection(999999)  // Override default section
  .publish();
```

## Benefits

✅ **Cleaner Code** - No need to specify section every time

✅ **Multi-Publication** - Manage many publications with one codebase

✅ **Flexible** - Override section when needed

✅ **Secure** - Use environment variables for credentials

✅ **n8n Ready** - Easy to parameterize in workflows

✅ **Type-Safe** - Full TypeScript support

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

## Troubleshooting

### "Please choose a section" Error

**Problem**: Trying to publish without a section

**Solution**: Either:
1. Set `defaultSectionId` in config, OR
2. Call `.setSection(id)` before `.publish()`

### Multiple Publications Not Working

**Problem**: Environment variables conflicting

**Solution**: Use prefixes like `POETRY_`, `TECH_`, etc.

### Cookie Expired

**Problem**: 401 Unauthorized errors

**Solution**: Get a fresh `connect.sid` cookie from browser

## See Also

- [n8n Integration Guide](./n8n-integration.md) - Integrate with n8n workflows
- [QuickStart](./quickstart.md) - Get started quickly
- [Examples](./examples.md) - Real-world usage patterns

