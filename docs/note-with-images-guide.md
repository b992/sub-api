# Publishing Notes with Image Attachments

Complete guide for publishing Substack Notes with image attachments, including payload structures for n8n integration.

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Using the SDK](#using-the-sdk)
- [Server API Endpoint](#server-api-endpoint)
- [n8n Integration](#n8n-integration)
- [Payload Structure](#payload-structure)
- [Examples](#examples)

## Overview

Substack Notes support image attachments (not inline images). This guide shows how to:
1. Upload images to Substack's S3 storage
2. Create image attachments
3. Publish notes with those attachments

## How It Works

The complete flow involves 3 steps:

```
1. Upload Image → POST /api/v1/image
   Input: Base64 encoded image
   Output: S3 URL

2. Create Attachment → POST /api/v1/comment/attachment  
   Input: S3 URL + type: "image"
   Output: Attachment ID

3. Publish Note → POST /api/v1/comment/feed
   Input: Note content + Attachment IDs
   Output: Published note
```

**Good news:** Our SDK and server handle all 3 steps automatically! 🎉

## Using the SDK

### Basic Example

```typescript
import { SubstackClient } from '@substackapi/client'
import fs from 'fs'

const client = new SubstackClient({
  apiKey: 'your-api-key',
  hostname: 'yourpub.substack.com'
})

// Read image file and convert to base64 data URI
const imageBuffer = fs.readFileSync('./image.png')
const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`

// Publish note with image
const profile = await client.ownProfile()
await profile.newNoteWithImages([base64Image])
  .paragraph()
    .text("Check out this image!")
  .publish()
```

### Multiple Images

```typescript
const image1 = `data:image/png;base64,${buffer1.toString('base64')}`
const image2 = `data:image/jpeg;base64,${buffer2.toString('base64')}`

await profile.newNoteWithImages([image1, image2])
  .paragraph()
    .bold("Gallery post with multiple images!")
  .publish()
```

### Rich Text with Images

```typescript
await profile.newNoteWithImages([base64Image])
  .paragraph()
    .bold("Important Update! 📸")
    .paragraph()
    .text("Here are the key points:")
    .paragraph()
    .bulletList()
      .item().text("Images are uploaded automatically")
      .item().text("Supports multiple images")
      .item().link("Learn more", "https://example.com")
      .finish()
  .publish()
```

## Server API Endpoint

### Endpoint

```
POST http://localhost:3000/api/notes/publish
```

### Payload Structure

```json
{
  "content": "Text content of the note\n\nSupports multiple paragraphs",
  "images": [
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
  ]
}
```

### Payload Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | ✅ Yes | The text content of the note. Use `\n\n` for paragraph breaks |
| `images` | string[] | ❌ No | Array of base64-encoded image data URIs |
| `linkUrl` | string | ❌ No | Optional link attachment (mutually exclusive with images) |

### Response Structure

```json
{
  "success": true,
  "note": {
    "id": 123456789,
    "hasLink": false,
    "hasImages": true,
    "imageCount": 2
  }
}
```

### Example cURL Request

```bash
curl -X POST http://localhost:3000/api/notes/publish \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Check out these images!",
    "images": ["data:image/png;base64,iVBORw0KGgo..."]
  }'
```

## n8n Integration

### Scenario: Image from HTTP Request + Text from OpenAI

This is a common n8n workflow where:
- Images come from an HTTP Request node
- Text comes from an AI/OpenAI node

#### Workflow Structure

```
[HTTP Request: Get Image]
    ↓
[Convert to Base64]
    ↓
[OpenAI: Generate Caption] ← [Set: Prepare Data]
    ↓                              ↓
[HTTP Request: Post to Substack] ←┘
```

#### Node 1: HTTP Request (Get Image)

```javascript
// Settings
Method: GET
URL: https://example.com/image.jpg
Response Format: File

// This downloads the image as binary data
```

#### Node 2: Function (Convert to Base64)

```javascript
// Get the binary data from previous node
const binaryData = $input.first().binary.data

// Convert to base64 data URI
const mimeType = binaryData.mimeType || 'image/jpeg'
const base64 = binaryData.data // Already base64 from n8n
const dataUri = `data:${mimeType};base64,${base64}`

return {
  json: {
    image: dataUri
  }
}
```

#### Node 3: OpenAI (Generate Caption)

```javascript
// Settings
Model: gpt-4
Prompt: "Generate a creative caption for this image"

// Output: { "text": "A beautiful sunset over mountains" }
```

#### Node 4: Set (Prepare Payload)

```javascript
// Combine data from both branches
return {
  json: {
    content: $('OpenAI').first().json.text,
    images: [$('Convert to Base64').first().json.image]
  }
}
```

#### Node 5: HTTP Request (Post to Substack)

```javascript
// Settings
Method: POST
URL: http://localhost:3000/api/notes/publish
Body Content Type: JSON

// Body
{
  "content": "={{ $json.content }}",
  "images": "={{ $json.images }}"
}
```

### Scenario: Multiple Images from Different Sources

```javascript
// In a Set node, combine images from multiple previous nodes

return {
  json: {
    content: "Gallery post with images from different sources",
    images: [
      $('HTTP Request 1').first().json.image,
      $('HTTP Request 2').first().json.image,
      $('Downloaded Image').first().json.image
    ]
  }
}
```

## Payload Structure

### Complete Payload Schema

```typescript
interface NotePublishPayload {
  // Required: The text content
  content: string
  
  // Optional: Image attachments (base64 data URIs)
  images?: string[]
  
  // Optional: Link attachment (cannot be used with images)
  linkUrl?: string
}
```

### Image Format Requirements

Images must be provided as **base64 data URIs**:

```
data:<mime-type>;base64,<base64-encoded-data>
```

**Examples:**
- PNG: `data:image/png;base64,iVBORw0KGgo...`
- JPEG: `data:image/jpeg;base64,/9j/4AAQSkZJ...`
- WebP: `data:image/webp;base64,UklGRiQAAABX...`

### Converting Files to Base64 Data URI

#### JavaScript/Node.js

```javascript
const fs = require('fs')

// From file
const buffer = fs.readFileSync('./image.png')
const dataUri = `data:image/png;base64,${buffer.toString('base64')}`

// From Buffer
const dataUri = `data:image/jpeg;base64,${buffer.toString('base64')}`

// From URL
const response = await fetch('https://example.com/image.jpg')
const arrayBuffer = await response.arrayBuffer()
const buffer = Buffer.from(arrayBuffer)
const dataUri = `data:image/jpeg;base64,${buffer.toString('base64')}`
```

#### Python

```python
import base64

# From file
with open('image.png', 'rb') as f:
    data = base64.b64encode(f.read()).decode()
    data_uri = f'data:image/png;base64,{data}'

# From bytes
data_uri = f'data:image/jpeg;base64,{base64.b64encode(image_bytes).decode()}'
```

#### n8n

```javascript
// If you have binary data in n8n
const binaryData = $input.first().binary.data
const mimeType = binaryData.mimeType
const base64 = binaryData.data
const dataUri = `data:${mimeType};base64,${base64}`
```

## Examples

### Example 1: Simple Note with One Image

**Request:**
```bash
POST /api/notes/publish
Content-Type: application/json

{
  "content": "Beautiful sunset! 🌅",
  "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRgAB..."]
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
    "imageCount": 1
  }
}
```

### Example 2: Multiple Images with Rich Text

**Request:**
```json
{
  "content": "Weekend photo dump! 📸\n\nThese are from my trip to the mountains",
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgAB...",
    "data:image/jpeg;base64,/9j/4AAQSkZJRgAB...",
    "data:image/png;base64,iVBORw0KGgoAAAAN..."
  ]
}
```

### Example 3: AI-Generated Content + Image (n8n)

This is a complete n8n workflow example:

**Step 1: Download Image**
```javascript
// HTTP Request Node
GET https://picsum.photos/800/600
Response Format: File
```

**Step 2: Convert to Base64**
```javascript
// Code Node
const binary = $input.first().binary.data
const dataUri = `data:${binary.mimeType};base64,${binary.data}`

return { json: { imageData: dataUri } }
```

**Step 3: Generate Caption with AI**
```javascript
// OpenAI Node
Prompt: "Write a creative caption for a random image"
Output: { text: "Life is full of beautiful surprises!" }
```

**Step 4: Merge Data**
```javascript
// Set Node
{
  "content": "={{ $('OpenAI').first().json.text }}",
  "images": ["={{ $('Convert to Base64').first().json.imageData }}"]
}
```

**Step 5: Publish to Substack**
```javascript
// HTTP Request Node
POST http://localhost:3000/api/notes/publish
Body: {{ $json }}
```

### Example 4: Error Handling in n8n

```javascript
// In an IF node, check if image conversion succeeded
{{ $('Convert to Base64').first().json.imageData }}

// If true, proceed to publish
// If false, send error notification or skip

// In HTTP Request node, add error handling:
{
  "onError": "continueErrorOutput",
  "options": {
    "timeout": 30000
  }
}
```

## Important Notes

### Image Size Limits

- Substack accepts images up to **10MB** per image
- Recommended: Compress images before uploading
- For n8n: Consider adding an image compression step

### Performance Tips

1. **Compress images** before converting to base64
2. **Use JPEG** for photos (smaller file size)
3. **Use PNG** for graphics with transparency
4. **Multiple images**: Process uploads in parallel where possible

### Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| "content is required" | Missing content field | Ensure `content` is provided |
| "Failed to upload image" | Invalid base64 data | Check data URI format |
| "Request too large" | Image too big | Compress image or reduce quality |
| "Timeout" | Slow upload | Reduce image size or increase timeout |

## Related Documentation

- [Basic Note Publishing](./note-publishing.md)
- [Rich Text Formatting](./note-formatting.md)
- [n8n Integration Guide](./n8n-integration.md)
- [Server API Reference](./api-reference.md)

---

**Need Help?**
- Check the [examples folder](../samples/) for complete working examples
- See [n8n integration guide](./n8n-integration.md) for workflow templates
- Review [API reference](./api-reference.md) for all available endpoints

