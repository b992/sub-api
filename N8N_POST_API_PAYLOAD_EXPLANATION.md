# n8n Post Publishing - API Payload Explanation

## Quick Overview

✅ **Posts accept image URLs directly** - No upload needed!  
❌ **Notes require image upload** - Must upload base64 → S3 → get URL → attach

## Input Fields Explained

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Post title (required) |
| `content` | string | HTML content of the post (required) |

### Content & Display

| Field | Type | Description |
|-------|------|-------------|
| `subtitle` | string | Subtitle shown below title |
| `coverImage` | string | **URL to image** (not base64!) |
| `description` | string | Short description for previews |

### SEO Optimization

| Field | Type | Description |
|-------|------|-------------|
| `seoTitle` | string | Title for search engines (falls back to `title`) |
| `seoDescription` | string | Meta description for Google (150-160 chars) |

### Social Media

| Field | Type | Description |
|-------|------|-------------|
| `socialTitle` | string | Title for Twitter/Facebook shares |
| `coverImage` | string | Used as Open Graph image for social shares |

### Organization

| Field | Type | Description |
|-------|------|-------------|
| `tags` | array | Array of tag strings: `["AI", "Tech"]` |
| `sectionId` | number | Section ID (overrides default if provided) |

### Comment Settings

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `commentPermissions` | string | `everyone`, `paid`, `founding`, `no_one` | Who can comment |
| `commentSort` | string | `best_first`, `newest_first`, `oldest_first` | Default sort order |

### Advanced Settings

| Field | Type | Description |
|-------|------|-------------|
| `explicit` | boolean | Mark as explicit content |
| `hideFromFeed` | boolean | Hide from main feed |

## Image Handling: Posts vs Notes

### For Posts (Cover Image)
```javascript
// ✅ Simple - just provide URL
.setCoverImage('https://example.com/image.jpg')
```

**How to get image URL:**
1. Upload to your CDN/S3/Cloudinary
2. Use a public URL
3. Or use Substack's image hosting (upload via UI first)

### For Notes (Inline Images)
```javascript
// ❌ More complex - must upload first
const note = await profile.newNoteWithImages([
  'data:image/png;base64,iVBORw0KG...',  // base64 encoded
])
  .paragraph()
  .text('Image note')
  .publish();
```

**Steps for notes:**
1. Convert image to base64
2. Use `newNoteWithImages()` builder
3. It uploads to S3 automatically
4. Creates attachment
5. Publishes note with image

## Complete API Call Sequence

When you call `.publish()` on a post, these API calls happen:

### 1. Create Draft
```http
POST /api/v1/drafts
Content-Type: application/json

{}  // Empty body creates draft
```

Response:
```json
{
  "id": 123456,
  "publication_id": 789
}
```

### 2. Update Draft with Content
```http
PUT /api/v1/drafts/123456
Content-Type: application/json

{
  "draft_title": "Your Title",
  "draft_subtitle": "Subtitle",
  "draft_body": "{\"type\":\"doc\",\"content\":[...]}",
  "cover_image": "https://example.com/image.jpg",
  "description": "SEO description",
  "search_engine_title": "SEO Title",
  "search_engine_description": "SEO meta description",
  "social_title": "Social Title",
  "section_id": 194500,
  "audience": "everyone",
  "postTags": ["AI", "Tech"],
  "write_comment_permissions": "everyone",
  "default_comment_sort": "best_first",
  "explicit": false,
  "hide_from_feed": false,
  "editor_v2": true
}
```

### 3. Publish the Draft
```http
PUT /api/v1/drafts/123456
Content-Type: application/json

{
  "is_published": true,
  "should_send_email": true
}
```

Response:
```json
{
  "id": 123456,
  "title": "Your Title",
  "subtitle": "Subtitle",
  "slug": "your-title",
  "canonical_url": "https://yourpub.substack.com/p/your-title",
  "is_published": true,
  "post_date": "2025-10-04T10:30:00.000Z",
  "cover_image": "https://example.com/image.jpg",
  "description": "SEO description",
  "postTags": ["AI", "Tech"],
  "publication_id": 789
}
```

## n8n Workflow Example

```
[Trigger: Webhook/Schedule]
    ↓
    Receives JSON payload
    ↓
[HTTP Request: Get Image]  ← Optional: Download image from URL
    ↓
[Code Node: Upload to CDN]  ← Optional: Upload to your hosting
    ↓
[Code Node: Publish Post]  ← Use our code with image URL
    ↓
    {
      title: "...",
      content: "<html>...",
      coverImage: "https://cdn.example.com/image.jpg",
      seoTitle: "...",
      tags: [...]
    }
    ↓
[Success: Send Notification]
```

## Tips & Best Practices

### Images
- ✅ Use HTTPS URLs only
- ✅ Recommended: 1200x630px for cover images (optimal for social shares)
- ✅ Supported formats: JPG, PNG, GIF, WebP
- ❌ Don't use base64 for post cover images (use URL instead)

### SEO
- Set `seoTitle` to 60 chars max
- Set `seoDescription` to 150-160 chars max
- Include keywords naturally
- Make `socialTitle` catchy and engaging

### Tags
- Use 3-5 tags per post
- Keep tags consistent across posts
- Use title case: `["AI", "Technology"]` not `["ai", "tech"]`

### Performance
- Upload images to a fast CDN
- Optimize images before uploading (compress, resize)
- Use WebP format for better compression

## Troubleshooting

### "Please choose a section"
**Error**: Post publishing fails with section error

**Solution**:
```javascript
// Option 1: Set default in config
const client = new SubstackClient({
  defaultSectionId: 194500  // Add this!
});

// Option 2: Set per post
.setSection(194500)
```

### Image not showing
**Issue**: Cover image not appearing

**Check**:
- Is the URL publicly accessible?
- Is it HTTPS (not HTTP)?
- Is the image format supported?
- Is the URL correct (no typos)?

### "Invalid HTML content"
**Issue**: Post content rejected

**Solution**:
- Ensure HTML is well-formed
- Close all tags properly
- Use supported HTML tags only
- Escape special characters

## Environment Variables

Required in n8n:
```bash
SUBSTACK_API_KEY=s%3Ayour-connect-sid-cookie
SUBSTACK_HOSTNAME=yourpub.substack.com
SUBSTACK_DEFAULT_SECTION_ID=194500
```

## See Also

- `N8N_PUBLISH_POST_FULL_METADATA.js` - Complete working code
- `N8N_POST_INPUT_PAYLOAD.json` - Example input structure
- `N8N_POST_OUTPUT_PAYLOAD.json` - Example output structure
- `docs/n8n-integration.md` - Full integration guide

