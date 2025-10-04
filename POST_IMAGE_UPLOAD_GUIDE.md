# Post Cover Image Upload - Complete Guide

## 🎯 The Real Image Upload Process

You discovered the actual workflow! When you upload a cover image in Substack's UI:

### Step 1: Upload Image
```http
POST /api/v1/image
Content-Type: application/json

{
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA4A...",
  "postId": 175261831
}
```

**Response:**
```json
{
  "url": "https://substack-post-media.s3.amazonaws.com/public/images/2ac55ce7-b7a1-4788-be97-b67ebe9a6546_896x1152.png"
}
```

### Step 2: Save Draft with URL
```http
PUT /api/v1/drafts/175261831
Content-Type: application/json

{
  "draft_title": "test",
  "draft_subtitle": "note for pics",
  "cover_image": "https://substack-post-media.s3.amazonaws.com/public/images/2ac55ce7-b7a1-4788-be97-b67ebe9a6546_896x1152.png",
  "draft_body": "{...}",
  ...
}
```

### Step 3: Publish
```http
PUT /api/v1/drafts/175261831
Content-Type: application/json

{
  "is_published": true,
  "should_send_email": true
}
```

## 📊 Two Ways to Handle Images

### Option 1: You Already Have a URL
```json
{
  "title": "My Post",
  "content": "<p>Content</p>",
  "coverImage": "https://example.com/image.jpg"
}
```

Just use the URL directly - no upload needed!

### Option 2: You Have a Base64 Image
```json
{
  "title": "My Post", 
  "content": "<p>Content</p>",
  "coverImage": "data:image/png;base64,iVBORw0KGg..."
}
```

Need to upload first to get the S3 URL!

## 🔄 Complete Workflow in n8n

```javascript
const { SubstackClient } = require('@b992/substack-api');

const inputData = $input.first().json;

const client = new SubstackClient({
  apiKey: process.env.SUBSTACK_API_KEY,
  hostname: process.env.SUBSTACK_HOSTNAME,
  defaultSectionId: parseInt(process.env.SUBSTACK_DEFAULT_SECTION_ID)
});

const profile = await client.ownProfile();

// === Handle Image Upload ===
let coverImageUrl = inputData.coverImage || '';

if (coverImageUrl && coverImageUrl.startsWith('data:image/')) {
  // Step 1: Create temp draft to get post ID
  const tempDraft = await profile.newPost()
    .setTitle(inputData.title)
    .setBodyHtml('<p>temp</p>')
    .createDraft();
  
  // Step 2: Upload image with post ID
  const imageResponse = await fetch(
    `https://${process.env.SUBSTACK_HOSTNAME}/api/v1/image`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `connect.sid=${process.env.SUBSTACK_API_KEY}`
      },
      body: JSON.stringify({
        image: coverImageUrl,
        postId: tempDraft.id
      })
    }
  );
  
  const imageData = await imageResponse.json();
  coverImageUrl = imageData.url; // Now we have the S3 URL!
}

// === Publish with Image URL ===
const published = await profile.newPost()
  .setTitle(inputData.title)
  .setBodyHtml(inputData.content)
  .setCoverImage(coverImageUrl)  // S3 URL here
  .publish();

return [{ json: { success: true, post: published } }];
```

## 🆚 Image Upload: Posts vs Notes

| Feature | Posts | Notes |
|---------|-------|-------|
| **Upload Endpoint** | `POST /api/v1/image` | `POST /api/v1/comment/attachment` |
| **Needs Post ID?** | ✅ Yes | ❌ No |
| **Payload** | `{image: "base64", postId: 123}` | `{type: "image", url: "s3url"}` |
| **Response** | `{url: "s3url"}` | `{id: "uuid"}` |
| **When to Upload** | Before saving draft | Before publishing note |

## 📝 Input Payload Format

```json
{
  "title": "Article with Image",
  "content": "<h2>Hello</h2><p>Content here</p>",
  "subtitle": "Optional subtitle",
  
  "coverImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEU...",
  
  "seoTitle": "SEO Title",
  "seoDescription": "SEO description",
  "socialTitle": "Social title",
  "tags": ["AI", "Tech"],
  "sectionId": 194500
}
```

### Cover Image Options

**Base64 String** (will be uploaded):
```json
"coverImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEU..."
```

**Already Uploaded URL** (used directly):
```json
"coverImage": "https://substack-post-media.s3.amazonaws.com/public/images/abc123.png"
```

**External URL** (used directly):
```json
"coverImage": "https://example.com/my-image.jpg"
```

## 💡 Smart Image Handling

The code automatically detects the image type:

```javascript
if (coverImageUrl.startsWith('data:image/')) {
  // It's base64 - upload it first
  // ... upload logic ...
} else if (coverImageUrl.startsWith('http')) {
  // It's already a URL - use directly
  postBuilder.setCoverImage(coverImageUrl);
} else {
  // No image or invalid format
  // Skip cover image
}
```

## 🔧 Implementation Notes

### Why Create Temp Draft First?

The image upload endpoint requires a `postId`. So we:
1. Create a minimal draft first
2. Get the draft ID
3. Upload image with that ID
4. Update draft with real content + image URL
5. Publish

### Alternative: Implement Image Upload in Client

We could add this to the client library:

```typescript
// In post-service.ts
async uploadImage(base64Image: string, postId: number): Promise<string> {
  const response = await this.client.post<{ url: string }>(
    '/api/v1/image',
    { image: base64Image, postId }
  );
  return response.url;
}

// In post-builder.ts
async setCoverImageFromBase64(base64: string): Promise<PostBuilder> {
  // Create temp draft if needed
  // Upload image
  // Set the returned URL
}
```

## 📤 Output Structure

```json
{
  "success": true,
  "post": {
    "id": 175261831,
    "title": "test",
    "slug": "test-abc",
    "url": "https://yourpub.substack.com/p/test-abc",
    "coverImage": "https://substack-post-media.s3.amazonaws.com/public/images/2ac55ce7-b7a1-4788-be97-b67ebe9a6546_896x1152.png",
    "coverImageUploaded": true,
    "isPublished": true
  },
  "metadata": {
    "imageWasUploaded": true,
    "publishedAt": "2025-10-04T10:05:00.000Z"
  }
}
```

## 🎯 Quick Reference

### Base64 Image Flow
```
Base64 Image
    ↓
Create Temp Draft → Get Post ID
    ↓
POST /api/v1/image {image, postId}
    ↓
Get S3 URL
    ↓
Use URL in .setCoverImage()
    ↓
Publish Post
```

### Direct URL Flow
```
Image URL
    ↓
Use in .setCoverImage()
    ↓
Publish Post
```

## ⚠️ Gotchas

1. **Must have a post ID to upload** - Create draft first if needed
2. **Large images** - Base64 can be huge (2MB+), consider compression
3. **Timeout** - Image upload can take 5-10 seconds for large files
4. **Cookie auth** - Must pass connect.sid in headers for upload endpoint
5. **Temp drafts** - They accumulate; might want to clean up old ones

## 🚀 Complete Working Example

See `N8N_PUBLISH_POST_WITH_IMAGE_UPLOAD.js` for full implementation!

