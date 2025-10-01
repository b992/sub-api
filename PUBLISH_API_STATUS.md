# Substack Post Publishing API - Status Report

**Last Updated**: September 30, 2025  
**Status**: ⚠️ Partially Working

---

## ✅ What Works

### Draft Creation & Management
- ✅ **Create drafts** with full content (`POST /api/v1/drafts` + `PUT /api/v1/drafts/{id}`)
- ✅ **Update drafts** with content changes (`PUT /api/v1/drafts/{id}`)
- ✅ **Delete drafts** (`DELETE /api/v1/drafts/{id}`)
- ✅ **List drafts** (`GET /api/v1/post_management/drafts`)
- ✅ **HTML to Substack JSON conversion** (internal format for `draft_body`)
- ✅ **Complete Metadata Support** (verified against Python implementation + sample posts):
  - SEO: `search_engine_title`, `search_engine_description`
  - Social Media: `social_title`, `cover_image`, `description`
  - Comments: `write_comment_permissions`, `default_comment_sort`
  - Organization: `section_id`, `postTags`
  - Advanced: `explicit`, `hide_from_feed`, `meter_type`, `editor_v2`, `show_guest_bios`, and more
  - See [METADATA_EXAMPLE.ts](./METADATA_EXAMPLE.ts) for complete list

### Content Format
The API requires `draft_body` to be a **stringified JSON** in Substack's internal document format:
```json
{
  "type": "doc",
  "content": [
    { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Title" }] },
    { "type": "paragraph", "content": [{ "type": "text", "text": "Content here" }] }
  ]
}
```

We have a custom `htmlToSubstackJson()` converter that handles:
- Headings (h2, h3)
- Paragraphs
- Bullet lists
- Plain text

---

## ⚠️ Partially Working

### Post Publishing
- ❌ **API Publish** (`POST /api/v1/drafts/{id}/publish`) - Returns `400 Bad Request`
- ✅ **Manual UI Publish** - Works perfectly through Substack's web interface
- ✅ **Pre-publish validation** (`GET /api/v1/drafts/{id}/prepublish`) - Works

**Issue**: The publish endpoint requires specific fields that aren't fully documented. A confirmation dialog appears in the UI ("Do you want to send via email?"), which might be handling additional logic not exposed in the simple API call.

**Current Workaround**: 
1. Create drafts via API ✅
2. Publish manually through Substack UI ✅
3. Content renders perfectly with proper formatting ✅

---

## 📋 Implementation Details

### Default Section
**Hardcoded Default**: `section_id: 194500` (Whiskey & Flowers 🌸)

Available sections:
- **Whiskey & Flowers 🌸** (ID: 194500) ⭐ Default
- **Raw Thoughts 🤯** (ID: 162170)
- **The Broken Winds 🌌** (ID: 158717)

Note: The UI shows additional sections (e.g., "Whiskey & Flowers Poetry") that don't appear in the API response. These may be aliases, podcast sections, or sub-sections.

### API Endpoints

#### Working Endpoints
```typescript
// Create empty draft
POST /api/v1/drafts
Body: { "draft_bylines": [] }

// Update draft with content
PUT /api/v1/drafts/{id}
Body: {
  draft_title: string,
  draft_subtitle?: string,
  draft_body: string,  // Stringified JSON!
  type: "newsletter" | "podcast" | "thread",
  audience: "everyone" | "paid" | "founding",
  description?: string,
  cover_image?: string,
  draft_section_id?: number,
  section_chosen: boolean
}

// List drafts
GET /api/v1/post_management/drafts?offset=0&limit=25&order_by=draft_updated_at

// Delete draft
DELETE /api/v1/drafts/{id}

// Pre-publish validation
GET /api/v1/drafts/{id}/prepublish
```

#### Needs Investigation
```typescript
// Publish draft - returns 400
POST /api/v1/drafts/{id}/publish
Body: {
  section_id?: number,
  send_email?: boolean,
  audience?: "everyone" | "paid" | "founding",
  comments_enabled?: boolean,
  // Missing required fields?
}
```

---

## 🔧 Current Implementation

### PostService Methods
```typescript
// ✅ Works
await postService.createPost({
  title: "My Post",
  body_html: "<h2>Title</h2><p>Content</p>",
  type: "newsletter",
  audience: "everyone",
  description: "SEO description",
  cover_image: "https://...",
  section_id: 194500  // Whiskey & Flowers 🌸
})

// ✅ Works
await postService.updatePost({
  id: 12345,
  title: "Updated Title",
  body_html: "<p>New content</p>",
  section_id: 194500
})

// ⚠️ Returns 400
await postService.publishPost(12345, {
  section_id: 194500,
  send_email: false,
  audience: "everyone",
  comments_enabled: true
})
```

### Domain Layer (Fluent API)
```typescript
// ✅ Create draft
const draft = await profile.newPost()
  .setTitle("My Post")
  .setSubtitle("Subtitle")
  .setBodyHtml("<h2>Content</h2><p>Text here</p>")
  .setType("newsletter")
  .setAudience("everyone")
  .setDescription("SEO description")
  .createDraft()

console.log(`Draft created: ${draft.id}`)

// ⚠️ Publish (returns 400, use UI instead)
try {
  const published = await draft.publish({
    section_id: 194500,
    send_email: false
  })
} catch (error) {
  console.log("Publish via API failed, use Substack UI")
  console.log(`Edit at: https://yoursite.substack.com/publish/post/${draft.id}`)
}
```

---

## 🎯 Recommended Workflow

### For Now (Until Publish API is Fixed)
1. **Create drafts via API** ✅
   ```typescript
   const draft = await profile.createPost({
     title: "My Post",
     body_html: htmlContent,
     description: "SEO description",
     section_id: 194500  // Default: Whiskey & Flowers 🌸
   })
   ```

2. **Review in Substack UI** ✅
   - Content renders perfectly
   - All formatting preserved
   - Metadata is set correctly

3. **Publish manually** ✅
   - Click "Continue" → Select section → Publish
   - Or use: `https://yoursite.substack.com/publish/post/${draft.id}`

### Future (When Publish API Works)
```typescript
// One-step creation and publishing
const post = await profile.newPost()
  .setTitle("My Post")
  .setBodyHtml(content)
  .publish({
    section_id: 194500,
    send_email: true
  })
```

---

## 🔍 Next Steps for Full API Publishing

To make `POST /api/v1/drafts/{id}/publish` work, we need to:

1. **Capture actual publish payload** from browser DevTools during manual publish
   - The confirmation dialog ("Send via email?") might be adding hidden fields
   - May need to handle scheduling/email logic separately

2. **Investigate missing required fields**
   - `subscriber_set_id`?
   - `should_send_email`?
   - `email_id`?
   - Other internal flags?

3. **Test different scenarios**
   - Publish without email
   - Scheduled publishing
   - Different section IDs
   - Paid vs free audience

---

## 📝 Summary

**What You Can Do Today:**
- ✅ Fully automated draft creation with perfect formatting
- ✅ Metadata: cover images, descriptions, sections
- ✅ HTML → Substack JSON conversion
- ✅ Draft management (update, delete, list)
- ⚠️ Manual publishing via UI (one extra click)

**What Needs Work:**
- ❌ Direct API publishing (blocked by missing fields/dialog logic)

**Impact**: Minimal - drafts are created perfectly, just need one manual click to publish. The API successfully creates production-ready drafts that render identically to manually created posts.


