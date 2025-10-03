# n8n Integration Guide 🎯

**Direct integration** - No HTTP server needed! Use the Substack client library directly in n8n Code nodes.

---

## Why No Server Needed?

n8n runs **Node.js natively**, so you can:
- ✅ Import npm packages directly
- ✅ Use the TypeScript/JavaScript client
- ✅ Access all features without HTTP overhead
- ✅ Better performance (no network round-trip)

**The HTTP server is only needed for non-Node.js integrations!**

---

## Setup on Your Ubuntu Server

### 1. Install the Package

SSH into your Ubuntu server where n8n is running:

```bash
# Navigate to n8n's node_modules
cd ~/.n8n/nodes
# Or wherever your n8n stores custom packages

# Install the package
npm install /path/to/substack-api

# Or if published to npm:
npm install substack-api
```

### 2. Verify Installation

In n8n, create a test Code node:

```javascript
try {
  const { SubstackClient } = require('substack-api');
  return [{ json: { success: true, message: 'Package loaded!' } }];
} catch (error) {
  return [{ json: { error: error.message } }];
}
```

---

## n8n Credential Setup

### Option 1: Environment Variables (Recommended)

Add to your n8n environment (e.g., `~/.n8n/.env` or systemd service):

```bash
SUBSTACK_API_KEY=s%3Ayour-connect-sid-cookie
SUBSTACK_HOSTNAME=whiskeyandflowers.substack.com
SUBSTACK_DEFAULT_SECTION_ID=162170
```

Then in n8n Code nodes:

```javascript
const { SubstackClient } = require('substack-api');

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
const { SubstackClient } = require('substack-api');

const credentials = $credentials.get('Substack');

const client = new SubstackClient({
  apiKey: credentials.substackCookie,
  hostname: credentials.substackHostname,
  defaultSectionId: parseInt(credentials.substackSectionId)
});
```

---

## Complete Workflow Examples

### 1. Publish a Poem

**Workflow:** `[Schedule] → [Format Poem] → [Code: Publish] → [Notify]`

#### Node 1: Schedule Trigger
- Runs daily at 8am

#### Node 2: Function Node - Format Poem
```javascript
// Get poem from wherever (API, database, etc.)
return [{
  json: {
    title: "Morning Reflections",
    content: `
      <h2>Dawn breaks softly</h2>
      <p><em>Coffee steams, thoughts wander<br>
      Another day begins</em></p>
    `,
    subtitle: "A morning haiku",
    tags: ["poetry", "morning"]
  }
}];
```

#### Node 3: Code Node - Publish to Substack
```javascript
const { SubstackClient } = require('substack-api');

// Get formatted poem from previous node
const poem = $input.first().json;

// Initialize client
const client = new SubstackClient({
  apiKey: process.env.SUBSTACK_API_KEY,
  hostname: process.env.SUBSTACK_HOSTNAME,
  defaultSectionId: 162170  // Raw Thoughts section
});

try {
  // Publish the poem
  const profile = await client.ownProfile();
  const published = await profile.newPost()
    .setTitle(poem.title)
    .setBodyHtml(poem.content)
    .setSubtitle(poem.subtitle)
    .setDescription(`A poem: ${poem.title}`)
    .setSocialTitle(`📝 ${poem.title}`)
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

#### Node 4: Send Notification
Send email/Slack/Discord notification with the published URL.

---

### 2. Publish from Image + AI-Generated Story

**Workflow:** `[Webhook: Image Upload] → [OpenAI: Generate Story] → [Code: Publish] → [Response]`

#### Node 1: Webhook Trigger
Receives image URL from your app/service

#### Node 2: OpenAI Node
Generate a story based on the image

#### Node 3: Code Node - Publish with Image
```javascript
const { SubstackClient } = require('substack-api');

// Get data from previous nodes
const imageUrl = $('Webhook').first().json.imageUrl;
const story = $('OpenAI').first().json.story;
const title = $('OpenAI').first().json.title;

// Initialize client
const client = new SubstackClient({
  apiKey: process.env.SUBSTACK_API_KEY,
  hostname: process.env.SUBSTACK_HOSTNAME,
  defaultSectionId: 158717  // The Broken Winds section
});

// Format content with image
const content = `
  <div class="cover-image">
    <img src="${imageUrl}" alt="${title}" />
  </div>
  <h2>The Story</h2>
  ${story}
`;

// Publish
const profile = await client.ownProfile();
const published = await profile.newPost()
  .setTitle(title)
  .setBodyHtml(content)
  .setCoverImage(imageUrl)
  .setDescription('An AI-generated story based on an image')
  .publish();

return [{
  json: {
    postId: published.id,
    url: published.canonical_url
  }
}];
```

---

### 3. Publish a Quick Note (Microblog)

**Workflow:** `[RSS Feed] → [Filter: Interesting] → [Code: Post as Note]`

```javascript
const { SubstackClient } = require('substack-api');

// Get RSS item from previous node
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

---

### 4. Multi-Publication Workflow

**Workflow:** `[Schedule] → [Code: Publish to Multiple Pubs]`

```javascript
const { SubstackClient } = require('substack-api');

// Define your publications
const publications = [
  {
    name: 'Poetry',
    apiKey: process.env.POETRY_API_KEY,
    hostname: 'whiskeyandflowers.substack.com',
    sectionId: 162170
  },
  {
    name: 'Tech Blog',
    apiKey: process.env.TECH_API_KEY,
    hostname: 'techblog.substack.com',
    sectionId: 123456
  }
];

// Content to publish (same to all pubs)
const content = {
  title: 'Cross-Posted Article',
  body: '<h2>Hello!</h2><p>This is published to multiple pubs</p>',
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

---

## Advanced Patterns

### Error Handling with Retry

```javascript
const { SubstackClient } = require('substack-api');

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
const { SubstackClient } = require('substack-api');

const post = $input.first().json;

// Determine section based on tags
let sectionId;
if (post.tags.includes('poetry')) {
  sectionId = 162170;  // Raw Thoughts
} else if (post.tags.includes('flowers')) {
  sectionId = 194500;  // Whiskey & Flowers
} else {
  sectionId = 158717;  // The Broken Winds
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

### Draft First, Then Publish

```javascript
const { SubstackClient } = require('substack-api');

const content = $input.first().json;

const client = new SubstackClient({
  apiKey: process.env.SUBSTACK_API_KEY,
  hostname: process.env.SUBSTACK_HOSTNAME,
  defaultSectionId: 162170
});

const profile = await client.ownProfile();

// Create as draft first
const draft = await profile.newPost()
  .setTitle(content.title)
  .setBodyHtml(content.body)
  .saveDraft();

// Wait for review (human approval in workflow?)
// ... then publish later ...

// Or publish immediately
const published = await profile.newPost()
  .setTitle(content.title)
  .setBodyHtml(content.body)
  .publish();

return [{ json: { draftId: draft.id, publishedId: published.id } }];
```

---

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

---

## Environment Setup on Ubuntu Server

### 1. Add to n8n systemd service

Edit `/etc/systemd/system/n8n.service`:

```ini
[Service]
Environment="SUBSTACK_API_KEY=s%3A..."
Environment="SUBSTACK_HOSTNAME=whiskeyandflowers.substack.com"
Environment="SUBSTACK_DEFAULT_SECTION_ID=162170"
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl restart n8n
```

### 2. Or use .env file

Create `~/.n8n/.env`:
```bash
SUBSTACK_API_KEY=s%3A...
SUBSTACK_HOSTNAME=whiskeyandflowers.substack.com
SUBSTACK_DEFAULT_SECTION_ID=162170
```

Then in n8n startup script:
```bash
export $(cat ~/.n8n/.env | xargs)
n8n start
```

---

## Testing

### Test in n8n Code Node

```javascript
const { SubstackClient } = require('substack-api');

// Quick test
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

---

## When to Use the HTTP Server Instead?

Use the HTTP server only if:
- ❌ You're calling from Python/Ruby/Go (non-Node.js)
- ❌ You have external webhooks that can't run Node.js
- ❌ You want a REST API for multiple services

For n8n? **Use the client library directly!** ✅

---

## Benefits of Direct Integration

| Feature | Direct (Client Library) | HTTP Server |
|---------|------------------------|-------------|
| **Performance** | ⚡ Fast (no HTTP overhead) | 🐌 Slower (network round-trip) |
| **Complexity** | ✅ Simple (one package) | 😓 Complex (server + client) |
| **Reliability** | ✅ No server to crash | ⚠️ Server can go down |
| **Maintenance** | ✅ Just update npm package | 😓 Manage server + package |
| **n8n Native** | ✅ Full TypeScript support | ❌ HTTP-only |

---

## Summary

✅ **Install** the package on your Ubuntu server  
✅ **Use directly** in n8n Code nodes  
✅ **Access** all features without HTTP overhead  
✅ **Profit!** 🎉

**No HTTP server needed for n8n!** The server is for other languages/tools.

---

Need help? Check the examples above or see the main README! 🚀

