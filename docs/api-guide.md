# Substack API Complete Guide

> Consolidated API documentation for posts, notes, images, and n8n integration

## Table of Contents
- [Post Publishing](#post-publishing)
- [Image Upload](#image-upload)
- [Section Management](#section-management)
- [n8n Integration](#n8n-integration)
- [Direct API Calls](#direct-api-calls)

---

## Post Publishing

### Full API Flow (5 Steps)

```
1. GET /api/v1/subscription → user_id
2. POST /api/v1/image → S3 URL (if base64 image)
3. POST /api/v1/drafts → draft_id (with draft_bylines)
4. PUT /api/v1/drafts/{id} → update content/metadata
5. POST /api/v1/posts/{id}/publish → publish
```

### Minimal Post Payload
```json
{
  "title": "My Post Title",
  "subtitle": "Optional subtitle",
  "content": "<p>HTML content here</p>"
}
```

### Complete Post Payload
```json
{
  "title": "Full Example",
  "subtitle": "With all metadata",
  "content": "<h2>Heading</h2><p>Paragraph with <strong>bold</strong> and <em>italic</em>.</p>",
  "coverImage": "data:image/png;base64,iVBORw0KGg...",
  "seoTitle": "SEO optimized title",
  "seoDescription": "Meta description for search engines",
  "socialTitle": "Social media title",
  "tags": ["tech", "ai"],
  "sectionId": 176365,
  "commentPermissions": "everyone"
}
```

---

## Image Upload

### API Endpoint
```
POST https://substack.com/api/v1/image
```

**Important:** Image uploads MUST go to `substack.com` (global domain), NOT your publication subdomain!

### Payload
```json
{
  "image": "data:image/png;base64,iVBORw0KGg...",
  "postId": 123456
}
```

### Response
```json
{
  "url": "https://substack-post-media.s3.amazonaws.com/public/images/abc123.png"
}
```

### SDK Usage
```typescript
// Automatically handled - just pass base64 to setCoverImage()
await profile.newPost()
  .setTitle('My Post')
  .setCoverImage('data:image/png;base64,iVBORw...')
  .publish()
```

---

## Section Management

### Finding Section IDs

**Browser Method:**
1. Go to publication settings → Sections
2. Open DevTools → Network tab
3. Create/edit a section
4. Look for API calls to `/api/v1/sections`
5. Inspect response for `id` field

**SDK Method:**
```typescript
// Currently requires manual discovery
// Section IDs are publication-specific integers
```

### Example: The Gods & Monsters Sections
```json
{
  "Journey to the East": 176210,
  "Myths of the Ancients": 176211,
  "Curious Histories": 176365,
  "Medieval Tales": 176624,
  "The Monster Manual": 176629,
  "Viking Myths and Legends": 179896,
  "Beyond the Grave": 179897,
  "Weird Jobs of History": 191903
}
```

---

## n8n Integration

### Environment Variables
```bash
SUBSTACK_API_KEY=your_connect_sid_cookie
SUBSTACK_HOSTNAME=yourpub.substack.com
SUBSTACK_DEFAULT_SECTION_ID=123456  # Optional
```

### Basic Code Node
```javascript
const { SubstackClient } = require('@b992/substack-api');

const client = new SubstackClient({
  apiKey: $env.SUBSTACK_API_KEY,
  hostname: $env.SUBSTACK_HOSTNAME,
  defaultSectionId: parseInt($env.SUBSTACK_DEFAULT_SECTION_ID || '0')
});

const profile = await client.ownProfile();
const input = $input.first().json;

const post = await profile.newPost()
  .setTitle(input.title)
  .setBodyHtml(input.content)
  .setCoverImage(input.coverImage) // Base64 or URL
  .setSection(input.sectionId)
  .publish();

return [{ json: { success: true, post } }];
```

### With Image Upload
```javascript
// SDK handles base64 → S3 automatically
const post = await profile.newPost()
  .setTitle('Post with Image')
  .setCoverImage('data:image/png;base64,iVBORw0KGg...')  // ✅ Auto-uploads
  .publish();
```

---

## Direct API Calls

### Why Use Direct API?
- No SDK dependency
- Full control over each step
- Easier debugging
- Can inspect intermediate responses

### Complete Direct API Example

```javascript
// Helper: Clean cookie
function normalizeCookie(raw) {
  const match = raw.match(/s%3A([^.]+\.[^;]+)/);
  return match ? `s%3A${match[1]}` : raw.replace(/^connect\.sid=/, '');
}

// Helper: HTTP wrapper
async function http({ method, url, headers = {}, body }) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(`${method} ${url} failed: ${res.status}`);
  return await res.json();
}

// Get input
const input = $input.first().json;
const host = $env.SUBSTACK_HOSTNAME;
const cookie = normalizeCookie($env.SUBSTACK_API_KEY);
const Cookie = `connect.sid=${cookie}`;

// 1. Get author ID
const subscription = await http({
  method: 'GET',
  url: `https://${host}/api/v1/subscription`,
  headers: { Cookie }
});
const authorId = subscription.user_id;

// 2. Upload image (if provided)
let coverUrl = input.coverImage;
if (coverUrl && coverUrl.startsWith('data:image/')) {
  // Create temp draft for postId
  const tempDraft = await http({
    method: 'POST',
    url: `https://${host}/api/v1/drafts`,
    headers: { Cookie },
    body: { draft_bylines: [{ id: authorId, is_guest: false }] }
  });
  
  // Upload to global domain
  const imageResp = await http({
    method: 'POST',
    url: `https://substack.com/api/v1/image`,  // ← Global domain!
    headers: { Cookie },
    body: { image: coverUrl, postId: tempDraft.id }
  });
  coverUrl = imageResp.url;
}

// 3. Create final draft
const draft = await http({
  method: 'POST',
  url: `https://${host}/api/v1/drafts`,
  headers: { Cookie },
  body: { draft_bylines: [{ id: authorId, is_guest: false }] }
});

// 4. Update with content (ProseMirror JSON)
const bodyJson = htmlToSubstackJson(input.content);
await http({
  method: 'PUT',
  url: `https://${host}/api/v1/drafts/${draft.id}`,
  headers: { Cookie },
  body: {
    draft_title: input.title,
    draft_subtitle: input.subtitle || '',
    draft_body: JSON.stringify(bodyJson),
    draft_bylines: [{ id: authorId, is_guest: false }],
    cover_image: coverUrl,
    draft_section_id: input.sectionId,
    section_chosen: !!input.sectionId,
    // ... other metadata
  }
});

// 5. Publish
const published = await http({
  method: 'POST',
  url: `https://${host}/api/v1/posts/${draft.id}/publish`,
  headers: { Cookie },
  body: {}
});

return [{ json: { success: true, post: published } }];
```

---

## HTML to ProseMirror Conversion

### Supported HTML Tags

**Block-level:**
- `<h2>`, `<h3>`, `<h4>` → headings
- `<p>` → paragraphs
- `<ul>` + `<li>` → bullet lists
- `<ol>` + `<li>` → numbered lists

**Inline formatting:**
- `<strong>`, `<b>` → bold
- `<em>`, `<i>` → italic
- `<del>`, `<s>` → strikethrough
- `<code>` → inline code
- `<a href="">` → links

### Example Conversion

**HTML Input:**
```html
<h2>Main Heading</h2>
<p>This is <strong>bold</strong> and <em>italic</em> text with a <a href="https://example.com">link</a>.</p>
<ul>
  <li>First item</li>
  <li>Second item</li>
</ul>
```

**ProseMirror JSON Output:**
```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "Main Heading" }]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "This is " },
        { "type": "text", "text": "bold", "marks": [{ "type": "strong" }] },
        { "type": "text", "text": " and " },
        { "type": "text", "text": "italic", "marks": [{ "type": "em" }] },
        { "type": "text", "text": " text with a " },
        {
          "type": "text",
          "text": "link",
          "marks": [{
            "type": "link",
            "attrs": {
              "href": "https://example.com",
              "target": "_blank",
              "rel": "noopener noreferrer nofollow"
            }
          }]
        },
        { "type": "text", "text": "." }
      ]
    },
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [{
            "type": "paragraph",
            "content": [{ "type": "text", "text": "First item" }]
          }]
        },
        {
          "type": "listItem",
          "content": [{
            "type": "paragraph",
            "content": [{ "type": "text", "text": "Second item" }]
          }]
        }
      ]
    }
  ]
}
```

---

## Domain Routing Reference

| Operation | Domain | Why |
|-----------|--------|-----|
| Draft creation | `publication.substack.com` | Publication-specific |
| Draft update | `publication.substack.com` | Publication-specific |
| Publish | `publication.substack.com` | Publication-specific |
| **Image upload** | **`substack.com`** | **Shared S3 storage** |
| Get subscription | `publication.substack.com` | Get user_id |
| Note feed | `publication.substack.com` | Publication-specific |

**Critical:** Image uploads fail if sent to publication subdomain!

---

## Troubleshooting

### Image Upload Fails
```
Error: fetch failed
```
**Fix:** Ensure image upload goes to `https://substack.com`, not `https://yourpub.substack.com`

### Missing Author
```
Post published but no author shown
```
**Fix:** Include `draft_bylines: [{ id: userId, is_guest: false }]` in both POST and PUT requests

### Everything is H2
```
All paragraphs render as headings
```
**Fix:** Use proper HTML tags (`<p>` for paragraphs, `<h2>` for headings) and ensure HTML parser extracts complete tags

### 400 Error on Publish
```
Request failed with status code 400
```
**Fix:** Ensure `draft_body` is stringified ProseMirror JSON, not HTML

---

## SDK Changelog

### v1.5.0 (Latest)
- ✅ Fixed image upload domain routing (now uses global domain)
- ✅ Added inline formatting support (bold, italic, links, code)
- ✅ Fixed author bylines (now passes userId through chain)
- ✅ Improved HTML parser (correctly identifies paragraphs vs headings)

### Breaking Changes
None! All changes are backward compatible.

---

## Additional Resources

- [n8n Integration Guide](./n8n-integration.md) - Full workflow examples
- [API Reference](./api-reference.md) - Complete API documentation
- [Entity Model](./entity-model.md) - Domain models and relationships
- [Examples](./examples.md) - Code samples and recipes

---

**Last Updated:** October 4, 2025  
**SDK Version:** 1.5.0
