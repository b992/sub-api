# Environment Variables Configuration

Copy this to `.env` and fill in your values, or use these as n8n credentials.

## Single Publication (Simplest)

```bash
# Your publication's hostname (without https://)
SUBSTACK_HOSTNAME=yourpub.substack.com

# Your connect.sid cookie (get from browser DevTools → Application → Cookies)
SUBSTACK_API_KEY=s%3Ayour-very-long-cookie-value-here

# Default section ID for publishing posts
SUBSTACK_DEFAULT_SECTION_ID=123456
```

## Multiple Publications (For n8n automations)

```bash
# Publication 1: Whiskey & Flowers (Poetry)
WHISKEY_HOSTNAME=whiskeyandflowers.substack.com
WHISKEY_API_KEY=s%3Ayour-cookie-here
WHISKEY_DEFAULT_SECTION_ID=162170

# Publication 2: Tech Blog
TECH_HOSTNAME=techblog.substack.com
TECH_API_KEY=s%3Ayour-cookie-here
TECH_DEFAULT_SECTION_ID=789012

# Publication 3: Creative Writing
CREATIVE_HOSTNAME=mystories.substack.com
CREATIVE_API_KEY=s%3Ayour-cookie-here
CREATIVE_DEFAULT_SECTION_ID=345678

# Publication 4: Newsletter
NEWSLETTER_HOSTNAME=mynewsletter.substack.com
NEWSLETTER_API_KEY=s%3Ayour-cookie-here
NEWSLETTER_DEFAULT_SECTION_ID=901234
```

## How to Get These Values

### 1. HOSTNAME
Just your publication URL without `https://`

Example: `whiskeyandflowers.substack.com`

### 2. API_KEY (connect.sid cookie)
1. Go to your publication in the browser
2. Open DevTools (F12)
3. Go to: **Application → Cookies → [your domain]**
4. Find `connect.sid` and copy the **ENTIRE value**
5. It looks like: `s%3Avery-long-encrypted-string...`

### 3. DEFAULT_SECTION_ID
1. Go to your publication settings → Sections
2. Or use the API to list sections
3. Find your main section ID

**Example section IDs for Whiskey & Flowers:**
- Raw Thoughts 🤯: `162170`
- Whiskey & Flowers 🌸: `194500`
- The Broken Winds 🌌: `158717`

---

## Usage in Code

### Single Publication

```typescript
import { SubstackClient } from './src/index'

const client = new SubstackClient({
  apiKey: process.env.SUBSTACK_API_KEY!,
  hostname: process.env.SUBSTACK_HOSTNAME!,
  defaultSectionId: parseInt(process.env.SUBSTACK_DEFAULT_SECTION_ID!)
})

// Now all posts will auto-use this section!
const post = await client.ownProfile()
  .then(profile => profile.newPost()
    .setTitle("My Post")
    .setBodyHtml("<p>Content</p>")
    // .setSection() is optional now - uses default!
    .publish()
  )
```

### Multiple Publications

```typescript
// Whiskey & Flowers client (Poetry)
const whiskeyClient = new SubstackClient({
  apiKey: process.env.WHISKEY_API_KEY!,
  hostname: process.env.WHISKEY_HOSTNAME!,
  defaultSectionId: parseInt(process.env.WHISKEY_DEFAULT_SECTION_ID!)
})

// Tech blog client
const techClient = new SubstackClient({
  apiKey: process.env.TECH_API_KEY!,
  hostname: process.env.TECH_HOSTNAME!,
  defaultSectionId: parseInt(process.env.TECH_DEFAULT_SECTION_ID!)
})

// Use them independently
await whiskeyClient.ownProfile()
  .then(profile => profile.newPost()
    .setTitle("New Poem")
    .setBodyHtml("<p>Poetry here</p>")
    .publish()  // Auto-uses Whiskey section
  )

await techClient.ownProfile()
  .then(profile => profile.newPost()
    .setTitle("Tech Article")
    .setBodyHtml("<p>Tech content</p>")
    .publish()  // Auto-uses Tech section
  )
```

---

## n8n Integration

### Option 1: Environment Variables

In your n8n instance, set these environment variables and restart n8n.

### Option 2: n8n Credentials (Recommended)

Create custom credentials in n8n:

```json
{
  "name": "Substack Publication",
  "properties": [
    {
      "displayName": "Hostname",
      "name": "hostname",
      "type": "string",
      "default": "",
      "placeholder": "yourpub.substack.com"
    },
    {
      "displayName": "Cookie (connect.sid)",
      "name": "apiKey",
      "type": "string",
      "typeOptions": {
        "password": true
      }
    },
    {
      "displayName": "Default Section ID",
      "name": "defaultSectionId",
      "type": "number",
      "default": 0
    }
  ]
}
```

### Option 3: Workflow Parameters

Pass them dynamically in your n8n workflow:

```javascript
// In n8n Function node
const SubstackClient = require('@yourusername/substack-api').SubstackClient;

const client = new SubstackClient({
  hostname: $node["Get Config"].json.hostname,
  apiKey: $node["Get Config"].json.apiKey,
  defaultSectionId: parseInt($node["Get Config"].json.sectionId)
});

const profile = await client.ownProfile();
const post = await profile.newPost()
  .setTitle($json.title)
  .setBodyHtml($json.content)
  .publish();

return { postId: post.id, url: post.canonical_url };
```

---

## Override Default Section

You can always override the default section per-post:

```typescript
const post = await profile.newPost()
  .setTitle("Special Post")
  .setBodyHtml("<p>Content</p>")
  .setSection(999999)  // Override default section
  .publish()
```

---

## Benefits for Multi-Publication Workflows

✅ **One library, many publications** - Create multiple clients, one per publication

✅ **Default sections** - No need to specify section every time

✅ **Flexible** - Can still override section when needed

✅ **n8n friendly** - Easy to parameterize in workflows

✅ **Type-safe** - Full TypeScript support

