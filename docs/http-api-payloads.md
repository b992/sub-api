# HTTP API Payload Reference

Complete payload structures for all Substack API server endpoints. Perfect for n8n HTTP Request nodes and other HTTP clients.

## Table of Contents

- [Notes API](#notes-api)
  - [Basic Note](#basic-note)
  - [Rich Text Note](#rich-text-note)
  - [Note with Link](#note-with-link)
  - [Note with Images](#note-with-images)
- [Posts/Articles API](#postsarticles-api)
  - [Create Draft](#create-draft)
  - [Publish Post](#publish-post)
- [Profile API](#profile-api)
- [Quick Reference](#quick-reference)

---

## Notes API

Base URL: `http://localhost:3000/api/notes`

### Basic Note

Publish a simple text note.

**Endpoint:** `POST /api/notes/publish`

**Payload:**
```json
{
  "content": "This is a basic note"
}
```

**Multi-paragraph:**
```json
{
  "content": "First paragraph\n\nSecond paragraph\n\nThird paragraph"
}
```

**Response:**
```json
{
  "success": true,
  "note": {
    "id": 123456789,
    "hasLink": false,
    "hasImages": false,
    "imageCount": 0
  }
}
```

---

### Rich Text Note

The server currently uses simple paragraph splitting (`\n\n`). For rich text formatting, use the SDK's builder pattern.

**For n8n:** Use the SDK in a Code node for rich text. Here's how:

```javascript
// In n8n Code node
const { SubstackClient } = require('@b992/substack-api');

const client = new SubstackClient({
  apiKey: $env('SUBSTACK_API_KEY'),
  hostname: $env('SUBSTACK_HOSTNAME')
});

const profile = await client.ownProfile();

// Rich text note
const note = await profile.newNote()
  .paragraph()
    .bold("Important announcement!")
    .paragraph()
    .text("Here are the details:")
    .paragraph()
    .bulletList()
      .item().text("Feature 1")
      .item().text("Feature 2")
      .item().text("Feature 3")
      .finish()
  .publish();

return [{ json: { noteId: note.id } }];
```

**Alternative for HTTP:** Create your own bodyJson structure:

```json
{
  "bodyJson": {
    "type": "doc",
    "attrs": { "schemaVersion": "v1" },
    "content": [
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "This is " },
          { "type": "text", "text": "bold", "marks": [{ "type": "bold" }] },
          { "type": "text", "text": " and " },
          { "type": "text", "text": "italic", "marks": [{ "type": "italic" }] }
        ]
      }
    ]
  },
  "tabId": "for-you",
  "surface": "feed",
  "replyMinimumRole": "everyone"
}
```

**Text Formatting Marks:**

| Format | Mark Structure |
|--------|----------------|
| **Bold** | `{ "type": "bold" }` |
| *Italic* | `{ "type": "italic" }` |
| `Code` | `{ "type": "code" }` |
| <u>Underline</u> | `{ "type": "underline" }` |
| [Link](url) | `{ "type": "link", "attrs": { "href": "https://example.com" } }` |

**Example with Multiple Formats:**
```json
{
  "type": "paragraph",
  "content": [
    { 
      "type": "text", 
      "text": "bold and italic", 
      "marks": [
        { "type": "bold" },
        { "type": "italic" }
      ]
    }
  ]
}
```

**Lists:**

Bullet list:
```json
{
  "type": "bulletList",
  "content": [
    {
      "type": "listItem",
      "content": [
        {
          "type": "paragraph",
          "content": [
            { "type": "text", "text": "First item" }
          ]
        }
      ]
    },
    {
      "type": "listItem",
      "content": [
        {
          "type": "paragraph",
          "content": [
            { "type": "text", "text": "Second item" }
          ]
        }
      ]
    }
  ]
}
```

Numbered list:
```json
{
  "type": "orderedList",
  "content": [
    /* same as bulletList */
  ]
}
```

---

### Note with Link

Publish a note with a link attachment (displays as a card preview).

**Endpoint:** `POST /api/notes/publish`

**Payload:**
```json
{
  "content": "Check out this article!",
  "linkUrl": "https://example.com/article"
}
```

**Response:**
```json
{
  "success": true,
  "note": {
    "id": 123456789,
    "hasLink": true,
    "hasImages": false,
    "imageCount": 0
  }
}
```

---

### Note with Images

Publish a note with image attachments. Images must be base64 data URIs.

**Endpoint:** `POST /api/notes/publish`

**Single Image:**
```json
{
  "content": "Beautiful sunset! 🌅",
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
  ]
}
```

**Multiple Images:**
```json
{
  "content": "Photo gallery from my trip\n\nAmazing views!",
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgAB...",
    "data:image/png;base64,iVBORw0KGgoAAAAN...",
    "data:image/webp;base64,UklGRiQAAABX..."
  ]
}
```

**Response:**
```json
{
  "success": true,
  "note": {
    "id": 123456789,
    "hasLink": false,
    "hasImages": true,
    "imageCount": 3
  }
}
```

**n8n Workflow Example:**

```
[HTTP Request: Get Image]
    ↓
[Code: Convert to Base64]
    ↓
[HTTP Request: Post Note]
```

**Code Node:**
```javascript
// Convert binary image to base64 data URI
const binary = $input.first().binary.data;
const mimeType = binary.mimeType || 'image/jpeg';
const base64 = binary.data;
const dataUri = `data:${mimeType};base64,${base64}`;

return [{
  json: {
    content: "Image from workflow",
    images: [dataUri]
  }
}];
```

---

## Posts/Articles API

Base URL: `http://localhost:3000/api/posts`

### Create Draft

Create a post as a draft (not published).

**Endpoint:** `POST /api/posts/draft`

**Minimal Payload:**
```json
{
  "title": "My Post Title",
  "content": "<p>HTML content goes here</p>"
}
```

**Complete Payload:**
```json
{
  "title": "Complete Guide to Substack API",
  "subtitle": "Everything you need to know",
  "content": "<h2>Introduction</h2><p>This is HTML content...</p><h2>Section 2</h2><p>More content...</p>",
  "description": "SEO-friendly description of the post",
  "socialTitle": "Social media title",
  "section": 123456
}
```

**Response:**
```json
{
  "success": true,
  "draft": {
    "id": 98765,
    "title": "Complete Guide to Substack API",
    "isPublished": false
  }
}
```

---

### Publish Post

Create and immediately publish a post.

**Endpoint:** `POST /api/posts/publish`

**Payload:**
```json
{
  "title": "Breaking News!",
  "subtitle": "Important announcement",
  "content": "<p>This post will be published immediately</p>",
  "section": 123456,
  "sendEmail": false
}
```

**With Email:**
```json
{
  "title": "Newsletter Issue #5",
  "subtitle": "Weekly insights",
  "content": "<h2>This Week</h2><p>Summary...</p>",
  "description": "SEO description",
  "section": 123456,
  "sendEmail": true
}
```

**Response:**
```json
{
  "success": true,
  "post": {
    "id": 98766,
    "title": "Breaking News!",
    "url": "https://yourpub.substack.com/p/breaking-news",
    "isPublished": true
  }
}
```

---

### Update Post

Update an existing post or draft.

**Endpoint:** `PUT /api/posts/:id`

**Payload:**
```json
{
  "title": "Updated Title",
  "subtitle": "Updated subtitle",
  "body_html": "<p>Updated content</p>",
  "audience": "everyone",
  "description": "Updated description",
  "postTags": ["updated", "api"]
}
```

**Note:** All fields are optional. Only include fields you want to update.

---

### Publish Draft

Publish an existing draft post.

**Endpoint:** `POST /api/posts/:id/publish`

**Payload:**
```json
{
  "sendEmail": true
}
```

---

### Delete Post

Delete a post or draft.

**Endpoint:** `DELETE /api/posts/:id`

**No payload required.**

**Response:**
```json
{
  "success": true,
  "message": "Post 98765 deleted"
}
```

---

## Profile API

Base URL: `http://localhost:3000/api/profile`

### Get Own Profile

**Endpoint:** `GET /api/profile`

**Response:**
```json
{
  "success": true,
  "profile": {
    "id": 12345,
    "name": "John Doe",
    "slug": "johndoe",
    "url": "https://substack.com/@johndoe",
    "bio": "Writer and creator",
    "avatarUrl": "https://..."
  }
}
```

### Get Profile by ID

**Endpoint:** `GET /api/profile/id/:id`

### Get Profile by Slug

**Endpoint:** `GET /api/profile/slug/:slug`

---

## Quick Reference

### n8n HTTP Request Node Setup

**For Notes:**
```
Method: POST
URL: http://localhost:3000/api/notes/publish
Body Content Type: JSON
Body:
{
  "content": "={{ $json.text }}",
  "images": "={{ $json.images }}"
}
```

**For Posts:**
```
Method: POST
URL: http://localhost:3000/api/posts/publish
Body Content Type: JSON
Body:
{
  "title": "={{ $json.title }}",
  "content": "={{ $json.htmlContent }}",
  "sendEmail": false
}
```

---

### Complete n8n Example: AI Content → Substack

**Workflow:**
```
[Schedule Trigger]
    ↓
[OpenAI: Generate Content]
    ↓
[Set: Format Payload]
    ↓
[HTTP Request: Post to Substack]
```

**OpenAI Node Output:**
```json
{
  "title": "AI-Generated Post Title",
  "content": "The AI-generated content...",
  "image_prompt": "A beautiful landscape"
}
```

**Set Node:**
```javascript
{
  "title": "={{ $json.title }}",
  "content": "<p>={{ $json.content }}</p>",
  "subtitle": "Generated by AI",
  "section": 123456,
  "sendEmail": false
}
```

**HTTP Request Node:**
```
Method: POST
URL: http://localhost:3000/api/posts/publish
Body: {{ $json }}
```

---

## Field Validation

### Notes

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `content` | string | ✅ Yes | Min 1 character |
| `linkUrl` | string | ❌ No | Valid URL |
| `images` | string[] | ❌ No | Valid base64 data URIs |

**Rules:**
- Cannot use both `linkUrl` and `images` together
- `images` array can contain multiple images
- Each image must be a valid data URI: `data:image/{type};base64,{data}`

### Posts

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `title` | string | ✅ Yes | Min 1 character |
| `content` | string | ✅ Yes | HTML string |
| `subtitle` | string | ❌ No | - |
| `description` | string | ❌ No | SEO description |
| `socialTitle` | string | ❌ No | Social media title |
| `section` | number | ❌ No | Valid section ID |
| `sendEmail` | boolean | ❌ No | Default: false |

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message here"
}
```

**Common Errors:**

| Status | Error | Meaning |
|--------|-------|---------|
| 400 | "content is required" | Missing required field |
| 400 | "title and content are required" | Missing required fields |
| 404 | "Post not found" | Invalid post ID |
| 500 | API error message | Server or API error |

---

## Testing with cURL

### Basic Note
```bash
curl -X POST http://localhost:3000/api/notes/publish \
  -H "Content-Type: application/json" \
  -d '{"content": "Test note from cURL"}'
```

### Note with Image
```bash
curl -X POST http://localhost:3000/api/notes/publish \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test image note",
    "images": ["data:image/png;base64,iVBORw0KGgo..."]
  }'
```

### Draft Post
```bash
curl -X POST http://localhost:3000/api/posts/draft \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Post",
    "content": "<p>Test content</p>"
  }'
```

### Publish Post
```bash
curl -X POST http://localhost:3000/api/posts/publish \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Live Post",
    "content": "<p>This will publish</p>",
    "sendEmail": false
  }'
```

---

## Related Documentation

- [Note with Images Guide](./note-with-images-guide.md) - Detailed image upload guide
- [Note with Link Example](./note-with-link-example.md) - SDK examples for link attachments
- [Create Posts Example](./create-posts-example.md) - SDK examples for post creation
- [n8n Integration Guide](./n8n-integration.md) - SDK-based n8n workflows
- [API Reference](./api-reference.md) - Full SDK API reference

---

**💡 Pro Tips:**

1. **Use the SDK** when possible (Code nodes in n8n) - it's easier and handles complexity
2. **Use HTTP API** when you need simple integration or non-Node.js environments  
3. **Test locally first** with cURL or Postman before building n8n workflows
4. **Save successful payloads** as n8n templates for reuse
5. **Add error handling** in n8n with IF nodes checking for `success: true`

