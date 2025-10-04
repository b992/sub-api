# Post Payload Reference Guide

Complete reference for post payloads with full metadata and images.

## Field Reference

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `title` | string | Post title | `"My Amazing Article"` |
| `content` | string | HTML content | `"<h2>Hello</h2><p>World</p>"` |

### Content Fields

| Field | Type | Required | Description | Notes |
|-------|------|----------|-------------|-------|
| `title` | string | ✅ Yes | Post title | Max 255 chars recommended |
| `subtitle` | string | ❌ No | Subtitle below title | Appears in preview |
| `content` | string | ✅ Yes | HTML body content | Must be valid HTML |
| `coverImage` | string | ❌ No | Cover image | Base64 OR URL |

### SEO Fields

| Field | Type | Required | Description | Best Practice |
|-------|------|----------|-------------|---------------|
| `seoTitle` | string | ❌ No | Search engine title | 60 chars max |
| `seoDescription` | string | ❌ No | Meta description | 150-160 chars |
| `description` | string | ❌ No | Short description | Fallback for SEO |

### Social Media Fields

| Field | Type | Required | Description | Best Practice |
|-------|------|----------|-------------|---------------|
| `socialTitle` | string | ❌ No | Title for social shares | Make it catchy! |
| `coverImage` | string | ❌ No | Also used as OG image | 1200x630px optimal |

### Organization Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `tags` | array | ❌ No | Array of tag strings | `["AI", "Tech"]` |
| `sectionId` | number | ⚠️ Required for publish | Section ID | `194500` |

### Comment Settings

| Field | Type | Default | Options |
|-------|------|---------|---------|
| `commentPermissions` | string | `"everyone"` | `everyone`, `paid`, `founding`, `no_one` |
| `commentSort` | string | `"best_first"` | `best_first`, `newest_first`, `oldest_first` |

### Advanced Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `explicit` | boolean | `false` | Mark as explicit content |
| `hideFromFeed` | boolean | `false` | Hide from main feed |

## Cover Image Options

### Option 1: Base64 (Uploaded Automatically)
```json
{
  "coverImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA4AAAA..."
}
```
- ✅ Automatically uploaded to S3
- ✅ Returns S3 URL
- ⚠️ Adds 3-5 seconds to publish time
- ⚠️ Large files may timeout

### Option 2: Direct URL
```json
{
  "coverImage": "https://example.com/image.jpg"
}
```
- ✅ Used directly, no upload
- ✅ Instant
- ⚠️ Must be publicly accessible
- ⚠️ Must be HTTPS

## Complete Payload Examples

### Example 1: Full Metadata with Base64 Image

```json
{
  "title": "The Future of AI Development",
  "subtitle": "Trends and predictions for 2025",
  "content": "<h2>Introduction</h2><p>Artificial Intelligence is evolving rapidly...</p><h3>Key Trends</h3><ul><li>Large Language Models</li><li>Edge AI</li><li>Ethical AI</li></ul><p>Let's explore each trend in detail.</p>",
  
  "coverImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA4AAAA...",
  
  "seoTitle": "The Future of AI Development - 2025 Trends | Tech Insights",
  "seoDescription": "Explore the latest trends in AI development for 2025. Expert analysis on LLMs, Edge AI, and ethical considerations.",
  "description": "Comprehensive analysis of AI development trends for 2025",
  
  "socialTitle": "🤖 The Future of AI is Here - 2025 Predictions",
  
  "tags": ["AI", "Machine Learning", "Technology", "Future"],
  
  "sectionId": 194500,
  
  "commentPermissions": "everyone",
  "commentSort": "best_first",
  
  "explicit": false,
  "hideFromFeed": false
}
```

### Example 2: Minimal (Just Required Fields)

```json
{
  "title": "Quick Update",
  "content": "<p>Just a quick note to let you know...</p>"
}
```

### Example 3: Recommended Balance

```json
{
  "title": "Building Scalable APIs",
  "subtitle": "Best practices and patterns",
  "content": "<h2>Introduction</h2><p>Scalability is crucial...</p>",
  
  "coverImage": "https://images.unsplash.com/photo-api-architecture.jpg",
  
  "seoTitle": "Building Scalable APIs - Best Practices Guide",
  "seoDescription": "Learn how to build scalable APIs with proven patterns and best practices. Includes real-world examples.",
  
  "socialTitle": "⚡ Build Scalable APIs - Complete Guide",
  
  "tags": ["API", "Backend", "Architecture"],
  
  "sectionId": 194500
}
```

## Field Size Limits

| Field | Max Length | Recommended |
|-------|-----------|-------------|
| `title` | 255 | 60-70 chars |
| `subtitle` | 255 | 80-100 chars |
| `content` | ~100KB | As needed |
| `seoTitle` | 255 | 60 chars |
| `seoDescription` | 500 | 150-160 chars |
| `description` | 500 | 120-150 chars |
| `socialTitle` | 255 | 60-70 chars |
| `tags` (each) | 50 | 3-5 tags total |

## Image Specifications

### Cover Image
- **Recommended Size**: 1200 x 630 pixels
- **Aspect Ratio**: 1.91:1 (optimal for social sharing)
- **Max File Size**: 5MB (base64)
- **Formats**: JPG, PNG, GIF, WebP
- **Quality**: 80-90% for JPG

### Social Media Optimization
- Twitter/X: 1200 x 675 (16:9) or 1200 x 600 (2:1)
- Facebook: 1200 x 630 (1.91:1)
- LinkedIn: 1200 x 627 (1.91:1)

**Best: Use 1200 x 630 for all platforms!**

## SEO Best Practices

### Title
- Keep under 60 characters
- Include main keyword
- Front-load important words
- Make it compelling

### Description
- 150-160 characters optimal
- Include call-to-action
- Feature main keyword
- Summarize value

### Social Title
- Can be more casual/catchy
- Use emojis if appropriate
- Make it shareable
- Can differ from SEO title

## Tags Best Practices

### Do ✅
- Use 3-5 tags per post
- Use consistent capitalization
- Choose specific over general
- Use existing tags when possible

### Don't ❌
- Don't use more than 7 tags
- Don't use single-letter tags
- Don't use special characters
- Don't create too many unique tags

### Examples
Good: `["AI", "Machine Learning", "Tutorial"]`  
Bad: `["ai", "ML", "tutorial", "tech", "coding", "dev", "programming", "help"]`

## Content HTML Guidelines

### Supported Tags
```html
<!-- Headings -->
<h2>Heading 2</h2>
<h3>Heading 3</h3>

<!-- Paragraphs -->
<p>Regular text</p>

<!-- Formatting -->
<strong>Bold text</strong>
<em>Italic text</em>
<code>Inline code</code>

<!-- Lists -->
<ul>
  <li>Bullet item</li>
</ul>
<ol>
  <li>Numbered item</li>
</ol>

<!-- Links -->
<a href="https://example.com">Link text</a>

<!-- Images -->
<img src="https://example.com/image.jpg" alt="Description">

<!-- Blockquotes -->
<blockquote>Quote text</blockquote>

<!-- Code blocks -->
<pre><code>Code block</code></pre>
```

### Avoid
- JavaScript (stripped)
- Inline styles (may be stripped)
- Custom data attributes
- Embedded videos (use Substack's embed feature)

## Comment Permissions Explained

| Value | Who Can Comment |
|-------|-----------------|
| `everyone` | All readers (default) |
| `paid` | Paid subscribers only |
| `founding` | Founding members only |
| `no_one` | Comments disabled |

## Comment Sort Options

| Value | Description |
|-------|-------------|
| `best_first` | Algorithmic "best" (default) |
| `newest_first` | Most recent first |
| `oldest_first` | Oldest first |

## Example Workflow: AI-Generated Content

```json
{
  "title": "{{ai.title}}",
  "subtitle": "{{ai.subtitle}}",
  "content": "{{ai.contentHtml}}",
  
  "coverImage": "{{ai.coverImageUrl}}",
  
  "seoTitle": "{{ai.title}} | {{siteName}}",
  "seoDescription": "{{ai.summary}}",
  
  "socialTitle": "{{ai.socialTitle}}",
  
  "tags": ["{{ai.category}}", "AI", "Generated"],
  
  "sectionId": 194500,
  
  "commentPermissions": "everyone",
  "commentSort": "best_first"
}
```

## Validation Rules

### Title
- ✅ Required
- ✅ Non-empty
- ⚠️ Max 255 chars (recommended: 60-70)

### Content
- ✅ Required
- ✅ Valid HTML
- ⚠️ Large content may slow down

### Cover Image
- ❌ Optional
- ✅ Must be valid URL or base64
- ⚠️ Base64 must start with `data:image/`

### Section ID
- ⚠️ Required for publishing
- ✅ Must be valid number
- ⚠️ Must exist in your publication

### Tags
- ❌ Optional
- ✅ Must be array of strings
- ⚠️ Each tag max 50 chars

## Error Handling

### Common Errors

**"Please choose a section"**
- Missing or invalid `sectionId`
- Solution: Set valid section ID

**"Invalid HTML content"**
- Malformed HTML in `content`
- Solution: Validate HTML syntax

**"Image upload failed"**
- Base64 image too large or invalid
- Solution: Compress image or use URL

**"Title required"**
- Missing `title` field
- Solution: Add title field

## See Also

- `COMPLETE_POST_PAYLOAD.json` - Full example
- `MINIMAL_POST_PAYLOAD.json` - Minimal example
- `RECOMMENDED_POST_PAYLOAD.json` - Balanced example
- `N8N_PUBLISH_POST_WITH_IMAGE_UPLOAD.js` - n8n code
- `IMAGE_UPLOAD_API_UPDATE.md` - Image upload details

