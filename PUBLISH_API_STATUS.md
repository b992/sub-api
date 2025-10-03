# Substack Post Publishing API - Status Report

**Last Updated**: October 3, 2025  
**Status**: ✅ **FULLY WORKING!**

---

## 🎉 SOLUTION DISCOVERED! (Oct 3, 2025)

### The Publish API Call

```typescript
POST /api/v1/drafts/{id}/publish

Payload: {
  "send": false  // true = send email, false = just publish
}

Response: 200 OK (full post data with is_published: true)
```

**That's it!** Just ONE parameter: `send` (boolean)

### Key Insights

✅ **Your theory was correct!** "Publishing just flips is_published: true"

✅ **All content must be set in the draft BEFORE publishing:**
- Title, subtitle, body → `PUT /api/v1/drafts/{id}`
- **Section** → `PUT /api/v1/drafts/{id}` with `draft_section_id` ⚠️ **REQUIRED!**
- Metadata, SEO, social → `PUT /api/v1/drafts/{id}`
- Tags → `POST /api/v1/publication/post-tag`

✅ **Publishing is just a state change:**
- No content in the publish payload
- No metadata in the publish payload
- Only decision: send email or not

⚠️ **CRITICAL**: `section_id` MUST be set in draft or publish returns 400: "Please choose a section."

### Usage

```typescript
// TypeScript
await postService.publishPost(draftId, {
  send_email: false  // or true to send email
})

// Python
publish_draft_v1(draft_id, publication_url, user_credentials, send_email=False)
```

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

### Post Publishing ✅
- ✅ **API Publish** (`POST /api/v1/drafts/{id}/publish`) - **WORKING!**
- ✅ **Pre-publish validation** (`GET /api/v1/drafts/{id}/prepublish`) - Works
- ✅ **Publish with email** - Set `"send": true` to send email notification
- ✅ **Publish without email** - Set `"send": false` to silently publish

**No workaround needed anymore!** Full API automation is now possible!

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

#### ✅ SOLVED - Publish Draft
```typescript
// Publish draft - WORKS! ✅
POST /api/v1/drafts/{id}/publish
Body: {
  send: boolean  // true = send email, false = just publish
}

// Response: Full post data with is_published: true
```

**Note**: All other fields (section_id, audience, metadata, etc.) must be set in the draft BEFORE calling publish!

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

// ✅ WORKS! (Discovered Oct 3, 2025)
await postService.publishPost(12345, {
  send_email: false  // or true to send email
})

// Note: section_id, audience, etc. must be set in draft first via updatePost()
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

// ✅ Publish (WORKS!)
const published = await draft.publish({
  send_email: false  // or true to send email
})

console.log(`Published at: ${published.canonicalUrl}`)
```

---

## 🎯 Recommended Workflow

### ✅ Full API Automation (NOW WORKING!)

```typescript
// 1. Create and configure draft
const draft = await profile.newPost()
  .setTitle("My Post")
  .setBodyHtml(htmlContent)
  .setDescription("SEO description")
  .setSearchEngineTitle("Custom SEO Title")
  .setSection(162170)  // ⚠️ REQUIRED! (e.g., Raw Thoughts 🤯)
  .createDraft()

// 2. Publish immediately
const post = await draft.publish({
  send_email: false  // or true to notify subscribers
})

console.log(`Published!`)
```

### ✅ Or One-Step Creation and Publishing
```typescript
const post = await profile.newPost()
  .setTitle("My Post")
  .setBodyHtml(content)
  .setSection(162170)  // ⚠️ REQUIRED! Must set section before publish
  .publish()  // send_email defaults to false
```

**⚠️ CRITICAL**: `.setSection(id)` is REQUIRED before `.publish()`! Without it, you'll get: "Please choose a section."

Available sections:
- **Raw Thoughts 🤯** (ID: 162170)
- **Whiskey & Flowers 🌸** (ID: 194500)
- **The Broken Winds 🌌** (ID: 158717)

---

## 📝 Summary

**✅ FULLY WORKING - COMPLETE API AUTOMATION!**

**What You Can Do:**
- ✅ Fully automated draft creation with perfect formatting
- ✅ Metadata: cover images, descriptions, sections, SEO, social
- ✅ HTML → Substack JSON conversion
- ✅ Draft management (create, update, delete, list)
- ✅ **Direct API publishing** - SOLVED! (Oct 3, 2025)
- ✅ Email control (send or don't send on publish)
- ✅ Complete automation: create → configure → publish in one flow

**Key Discovery:**
The publish endpoint is incredibly simple: `POST /api/v1/drafts/{id}/publish` with payload `{"send": false}`.  
**Your theory was correct!** Publishing is just a state flip. All content must be set in the draft first.

**Impact**: **ZERO manual work needed!** Full end-to-end automation from draft creation to publication.


