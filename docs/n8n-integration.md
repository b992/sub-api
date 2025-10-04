# n8n Integration Guide

Direct integration guide for using the Substack API client (Enhanced Fork) in n8n workflows - no HTTP server needed!

> **Note**: This guide uses the enhanced fork from https://github.com/b992/sub-api

## Why No Server Needed?

n8n runs **Node.js natively**, so you can:
- ✅ Import npm packages directly
- ✅ Use the TypeScript/JavaScript client
- ✅ Access all features without HTTP overhead
- ✅ Better performance (no network round-trip)

**The HTTP server is only needed for non-Node.js integrations!**

## Setup

### 1. Install the Package

SSH into your server where n8n is running:

```bash
# Navigate to n8n's node_modules or project directory
cd ~/.n8n

# Install from GitHub
npm install git+https://github.com/b992/sub-api.git

# Or if you have it cloned locally
npm install ~/sub-api

# Restart n8n
sudo systemctl restart n8n
```

### 2. Verify Installation

In n8n, create a test Code node:

```javascript
try {
  const { SubstackClient } = require('@b992/substack-api');
  return [{ json: { success: true, message: 'Package loaded!' } }];
} catch (error) {
  return [{ json: { error: error.message } }];
}
```

## Credential Setup

### Option 1: Environment Variables (Recommended)

Add to your n8n environment (e.g., `~/.n8n/.env` or systemd service):

```bash
SUBSTACK_API_KEY=s%3Ayour-connect-sid-cookie
SUBSTACK_HOSTNAME=yourpub.substack.com
SUBSTACK_DEFAULT_SECTION_ID=162170
```

Then in n8n Code nodes:

```javascript
const { SubstackClient } = require('@b992/substack-api');

const client = new SubstackClient({
  apiKey: process.env.SUBSTACK_API_KEY,
  hostname: process.env.SUBSTACK_HOSTNAME,
  defaultSectionId: parseInt(process.env.SUBSTACK_DEFAULT_SECTION_ID)
});
```

### Option 2: n8n Credentials

Create a custom credential type in n8n:

**Settings → Credentials → Create New → Generic Credential**

Fields:
- `substackCookie`: Your `connect.sid` cookie
- `substackHostname`: Your publication hostname
- `substackSectionId`: Default section ID

Then in Code nodes:

```javascript
const { SubstackClient } = require('@b992/substack-api');

const credentials = $credentials.get('Substack');

const client = new SubstackClient({
  apiKey: credentials.substackCookie,
  hostname: credentials.substackHostname,
  defaultSectionId: parseInt(credentials.substackSectionId)
});
```

## Share Center Integration (Publish + Share)

### Quick Start: Publish Post with Share Note

The `publishWithNote()` method combines post publishing with automatic note sharing, just like Substack's Share Center!

**Features:**
- ✅ Publish post with full metadata
- ✅ Automatically share as a note
- ✅ Includes `showWelcomeOnShare=true` parameter
- ✅ One command, complete workflow

### n8n Code Node Setup

```javascript
const { SubstackClient } = require('@b992/substack-api');

// Initialize client
const client = new SubstackClient({
  apiKey: process.env.SUBSTACK_API_KEY,
  hostname: process.env.SUBSTACK_HOSTNAME,
  defaultSectionId: parseInt(process.env.SUBSTACK_DEFAULT_SECTION_ID)
});

// Get authenticated profile
const profile = await client.ownProfile();

// Publish post with share note (one call!)
const { post, note } = await profile.publishWithNote(
  profile.newPost()
    .setTitle('Your Article Title')
    .setSubtitle('Your subtitle here')
    .setBodyHtml('<h2>Heading</h2><p>Content here...</p>')
    .setCoverImage('https://example.com/image.jpg')
    .setTags(['AI', 'Writing', 'Technology'])
    .setDescription('SEO description')
    .setSearchEngineTitle('SEO Title')
    .setSocialTitle('Social Media Title'),
  
  // Share note text (optional)
  '🎉 Just published a new article! Check it out.'
);

// Return results
return [{
  json: {
    success: true,
    post: {
      id: post.id,
      title: post.title,
      url: `https://${process.env.SUBSTACK_HOSTNAME}/p/${post.slug}`,
      published: post.is_published
    },
    note: note ? {
      id: note.id,
      url: `https://${process.env.SUBSTACK_HOSTNAME}/notes/note/${note.id}`,
      includesWelcomeParam: true
    } : null
  }
}];
```

### Input Data Format

If you're getting data from previous nodes:

```javascript
const { SubstackClient } = require('@b992/substack-api');

// Get data from previous node
const inputData = $input.first().json;

const client = new SubstackClient({
  apiKey: process.env.SUBSTACK_API_KEY,
  hostname: process.env.SUBSTACK_HOSTNAME,
  defaultSectionId: parseInt(process.env.SUBSTACK_DEFAULT_SECTION_ID)
});

const profile = await client.ownProfile();

const { post, note } = await profile.publishWithNote(
  profile.newPost()
    .setTitle(inputData.title)
    .setSubtitle(inputData.subtitle || '')
    .setBodyHtml(inputData.content)
    .setCoverImage(inputData.coverImage || '')
    .setTags(inputData.tags || [])
    .setDescription(inputData.description || ''),
  inputData.shareNoteText || 'Check out my new post!'
);

return [{ json: { post, note } }];
```

### Expected Input JSON Structure

```json
{
  "title": "Your Article Title",
  "subtitle": "Optional subtitle",
  "content": "<h2>Heading</h2><p>Your HTML content here</p>",
  "coverImage": "https://example.com/image.jpg",
  "tags": ["AI", "Writing", "Tech"],
  "description": "SEO description for search engines",
  "shareNoteText": "🎉 New article published! Check it out!"
}
```

### Output JSON Structure

```json
{
  "success": true,
  "post": {
    "id": 175259998,
    "title": "Your Article Title",
    "slug": "your-article-title-abc",
    "url": "https://yourpub.substack.com/p/your-article-title-abc",
    "is_published": true,
    "post_date": "2025-10-04T08:00:00.000Z"
  },
  "note": {
    "id": 162822956,
    "url": "https://yourpub.substack.com/notes/note/162822956",
    "includesWelcomeParam": true
  }
}
```

### Behind the Scenes: API Calls

When you use `publishWithNote()`, these API calls happen automatically:

**1. Create Draft**
```
POST /api/v1/drafts
Content-Type: application/json

{}  // Creates empty draft
```

**2. Update Draft with Content**
```
PUT /api/v1/drafts/{draft_id}
Content-Type: application/json

{
  "draft_title": "Your Title",
  "draft_subtitle": "Your Subtitle",
  "draft_body": "{\"type\":\"doc\",\"content\":[...]}",
  "cover_image": "https://...",
  "description": "SEO description",
  "section_id": 194500,
  "audience": "everyone",
  "editor_v2": true
}
```

**3. Publish the Draft**
```
PUT /api/v1/drafts/{draft_id}
Content-Type: application/json

{
  "is_published": true,
  "should_send_email": true
}
```

**4. Create Note Attachment (with special parameter)**
```
POST /api/v1/comment/attachment
Content-Type: application/json

{
  "type": "link",
  "url": "https://yourpub.substack.com/p/post-slug?showWelcomeOnShare=true"
}

Response:
{
  "id": "attachment-uuid",
  ...
}
```

**5. Publish Note with Attachment**
```
POST /api/v1/comment/feed
Content-Type: application/json

{
  "bodyJson": {
    "type": "doc",
    "attrs": {"schemaVersion": "v1"},
    "content": [{
      "type": "paragraph",
      "content": [{"type": "text", "text": "Check out my new post!"}]
    }]
  },
  "attachmentIds": ["attachment-uuid"],
  "replyMinimumRole": "everyone"
}
```

### The Special Parameter: `showWelcomeOnShare=true`

This parameter is **automatically added** to the post URL when shared as a note. It:
- ✅ Triggers Substack's welcome/onboarding flow for readers
- ✅ May improve subscription conversion rates
- ✅ Matches official Share Center behavior exactly
- ✅ Helps analytics distinguish shared note traffic

### Complete n8n Workflow Example

```
[Schedule Trigger]
    ↓
[Google Sheets: Read Row]  ← Get article data
    ↓
[Code Node: Format Content]  ← Transform to HTML
    ↓
[Code Node: Publish with Share]  ← Use publishWithNote()
    ↓
[Set Node: Store Results]
    ↓
[Slack: Send Notification]  ← Alert on success
```

### Error Handling

```javascript
const { SubstackClient } = require('@b992/substack-api');

try {
  const client = new SubstackClient({
    apiKey: process.env.SUBSTACK_API_KEY,
    hostname: process.env.SUBSTACK_HOSTNAME,
    defaultSectionId: parseInt(process.env.SUBSTACK_DEFAULT_SECTION_ID)
  });

  const profile = await client.ownProfile();
  
  const { post, note } = await profile.publishWithNote(
    profile.newPost()
      .setTitle($json.title)
      .setBodyHtml($json.content),
    $json.shareText
  );

  return [{
    json: {
      success: true,
      postUrl: `https://${process.env.SUBSTACK_HOSTNAME}/p/${post.slug}`,
      noteId: note?.id
    }
  }];
  
} catch (error) {
  return [{
    json: {
      success: false,
      error: error.message,
      details: error.stack
    }
  }];
}
```

## Workflow Examples

### 1. Publish a Post

**Workflow:** `[Schedule] → [Format Content] → [Code: Publish] → [Notify]`

```javascript
const { SubstackClient } = require('@b992/substack-api');

// Get content from previous node
const content = $input.first().json;

// Initialize client
const client = new SubstackClient({
  apiKey: process.env.SUBSTACK_API_KEY,
  hostname: process.env.SUBSTACK_HOSTNAME,
  defaultSectionId: 162170
});

try {
  // Publish the post
  const profile = await client.ownProfile();
  const published = await profile.newPost()
    .setTitle(content.title)
    .setBodyHtml(content.body)
    .setSubtitle(content.subtitle)
    .setDescription(`Article: ${content.title}`)
    .setSocialTitle(`📝 ${content.title}`)
    .publish();

  // Return success with post details
  return [{
    json: {
      success: true,
      postId: published.id,
      title: published.title,
      url: published.canonical_url,
      publishedAt: new Date().toISOString()
    }
  }];
} catch (error) {
  // Return error for handling
  return [{
    json: {
      success: false,
      error: error.message
    }
  }];
}
```

### 2. Publish from AI-Generated Content

**Workflow:** `[Webhook: Topic] → [OpenAI: Generate] → [Code: Publish] → [Response]`

```javascript
const { SubstackClient } = require('@b992/substack-api');

// Get AI-generated content
const aiContent = $('OpenAI').first().json;

const client = new SubstackClient({
  apiKey: process.env.SUBSTACK_API_KEY,
  hostname: process.env.SUBSTACK_HOSTNAME,
  defaultSectionId: 158717
});

// Publish
const profile = await client.ownProfile();
const published = await profile.newPost()
  .setTitle(aiContent.title)
  .setBodyHtml(aiContent.body)
  .setCoverImage(aiContent.imageUrl)
  .setDescription('AI-generated content')
  .publish();

return [{
  json: {
    postId: published.id,
    url: published.canonical_url
  }
}];
```

### 3. Publish a Quick Note

**Workflow:** `[RSS Feed] → [Filter: Interesting] → [Code: Post as Note]`

```javascript
const { SubstackClient } = require('@b992/substack-api');

// Get RSS item
const item = $input.first().json;

const client = new SubstackClient({
  apiKey: process.env.SUBSTACK_API_KEY,
  hostname: process.env.SUBSTACK_HOSTNAME
});

// Publish as a note (no section needed!)
const profile = await client.ownProfile();
const note = await profile.newNote()
  .paragraph()
  .text(`Interesting read: ${item.title}`)
  .paragraph()
  .link(item.url, 'Read more →')
  .publish();

return [{
  json: {
    noteId: note.id,
    success: true
  }
}];
```

### 4. Multi-Publication Workflow

```javascript
const { SubstackClient } = require('@b992/substack-api');

// Define your publications
const publications = [
  {
    name: 'Poetry',
    apiKey: process.env.POETRY_API_KEY,
    hostname: 'mypoetry.substack.com',
    sectionId: 162170
  },
  {
    name: 'Tech Blog',
    apiKey: process.env.TECH_API_KEY,
    hostname: 'techblog.substack.com',
    sectionId: 123456
  }
];

// Content to publish
const content = {
  title: 'Cross-Posted Article',
  body: '<h2>Hello!</h2><p>Published to multiple pubs</p>',
  subtitle: 'A cross-publication post'
};

// Publish to all publications
const results = [];
for (const pub of publications) {
  try {
    const client = new SubstackClient({
      apiKey: pub.apiKey,
      hostname: pub.hostname,
      defaultSectionId: pub.sectionId
    });
    
    const profile = await client.ownProfile();
    const published = await profile.newPost()
      .setTitle(content.title)
      .setBodyHtml(content.body)
      .setSubtitle(content.subtitle)
      .publish();
    
    results.push({
      publication: pub.name,
      success: true,
      postId: published.id,
      url: published.canonical_url
    });
  } catch (error) {
    results.push({
      publication: pub.name,
      success: false,
      error: error.message
    });
  }
}

return [{ json: { results } }];
```

## Advanced Patterns

### Error Handling with Retry

```javascript
async function publishWithRetry(data, maxRetries = 3) {
  const client = new SubstackClient({
    apiKey: process.env.SUBSTACK_API_KEY,
    hostname: process.env.SUBSTACK_HOSTNAME,
    defaultSectionId: 162170
  });
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const profile = await client.ownProfile();
      const published = await profile.newPost()
        .setTitle(data.title)
        .setBodyHtml(data.content)
        .publish();
      
      return { success: true, published };
    } catch (error) {
      if (attempt === maxRetries) {
        return { success: false, error: error.message };
      }
      // Wait before retry (exponential backoff)
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

const input = $input.first().json;
const result = await publishWithRetry(input);

return [{ json: result }];
```

### Conditional Section Selection

```javascript
const post = $input.first().json;

// Determine section based on tags
let sectionId;
if (post.tags.includes('poetry')) {
  sectionId = 162170;
} else if (post.tags.includes('tech')) {
  sectionId = 194500;
} else {
  sectionId = 158717;  // default
}

const client = new SubstackClient({
  apiKey: process.env.SUBSTACK_API_KEY,
  hostname: process.env.SUBSTACK_HOSTNAME,
  defaultSectionId: sectionId
});

const profile = await client.ownProfile();
const published = await profile.newPost()
  .setTitle(post.title)
  .setBodyHtml(post.content)
  .publish();

return [{ json: { postId: published.id, section: sectionId } }];
```

## Accessing Previous Node Data

### Get data from specific node:
```javascript
const webhookData = $('Webhook').first().json;
const aiResponse = $('OpenAI').first().json;
```

### Get data from all items:
```javascript
const allItems = $input.all();
for (const item of allItems) {
  console.log(item.json);
}
```

### Get from previous node:
```javascript
const previousData = $input.first().json;
```

## Environment Setup on Ubuntu Server

### Using systemd service

Edit `/etc/systemd/system/n8n.service`:

```ini
[Service]
Environment="SUBSTACK_API_KEY=s%3A..."
Environment="SUBSTACK_HOSTNAME=yourpub.substack.com"
Environment="SUBSTACK_DEFAULT_SECTION_ID=162170"
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl restart n8n
```

### Using .env file

Create `~/.n8n/.env`:
```bash
SUBSTACK_API_KEY=s%3A...
SUBSTACK_HOSTNAME=yourpub.substack.com
SUBSTACK_DEFAULT_SECTION_ID=162170
```

## Testing

Quick test in n8n Code Node:

```javascript
const { SubstackClient } = require('@b992/substack-api');

const client = new SubstackClient({
  apiKey: process.env.SUBSTACK_API_KEY,
  hostname: process.env.SUBSTACK_HOSTNAME,
  defaultSectionId: 162170
});

const profile = await client.ownProfile();

return [{
  json: {
    connected: true,
    profileName: profile.name,
    profileHandle: profile.handle
  }
}];
```

## Benefits of Direct Integration

| Feature | Direct (Client Library) | HTTP Server |
|---------|------------------------|-------------|
| **Performance** | ⚡ Fast (no HTTP overhead) | 🐌 Slower (network round-trip) |
| **Complexity** | ✅ Simple (one package) | 😓 Complex (server + client) |
| **Reliability** | ✅ No server to crash | ⚠️ Server can go down |
| **Maintenance** | ✅ Just update npm package | 😓 Manage server + package |
| **n8n Native** | ✅ Full TypeScript support | ❌ HTTP-only |

## Summary

✅ **Install** the package on your server  
✅ **Use directly** in n8n Code nodes  
✅ **Access** all features without HTTP overhead  
✅ **Profit!** 🎉

**No HTTP server needed for n8n!** The server is for other languages/tools.

## See Also

- [Configuration Guide](./configuration.md) - Complete configuration options
- [Examples](./examples.md) - More usage examples
- [API Reference](./api-reference.md) - Full API documentation

