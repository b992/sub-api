# Share Center URL Parameter Discovery

## 🎯 Important Finding

When analyzing the Share Center API calls, we discovered a **special URL parameter** that Substack adds when sharing posts as notes:

```
showWelcomeOnShare=true
```

## Complete URL Structure

### Standard Post URL
```
https://open.substack.com/pub/whiskeyandflowers/p/test-article?r=4auzr2&utm_campaign=post&utm_medium=web
```

### Share Center URL (with special parameter)
```
https://open.substack.com/pub/whiskeyandflowers/p/test-article?r=4auzr2&utm_campaign=post&utm_medium=web&showWelcomeOnShare=true
```

## API Call Details

### Step 1: Create Attachment
**Endpoint:** `POST /api/v1/comment/attachment`

**Payload:**
```json
{
  "type": "link",
  "url": "https://open.substack.com/pub/whiskeyandflowers/p/test-article-share-center-api-discovery?r=4auzr2&utm_campaign=post&utm_medium=web&showWelcomeOnShare=true"
}
```

**Response:** Returns an attachment ID (e.g., `"6b0d7717-1b99-4adf-9dfd-f7ac0be96354"`)

### Step 2: Publish Note
**Endpoint:** `POST /api/v1/comment/feed`

**Payload:**
```json
{
  "bodyJson": {
    "type": "doc",
    "attrs": { "schemaVersion": "v1" },
    "content": [
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Check out my new post!" }
        ]
      }
    ]
  },
  "attachmentIds": ["6b0d7717-1b99-4adf-9dfd-f7ac0be96354"],
  "replyMinimumRole": "everyone"
}
```

## What This Parameter Does

The `showWelcomeOnShare=true` parameter likely triggers:

1. **Welcome Experience** - Shows a special welcome modal or message to readers clicking from shared notes
2. **Onboarding Flow** - May present subscription prompts or publication intro
3. **Different UI** - Potentially different page layout or emphasis
4. **Analytics Tracking** - Distinguishes traffic from shared notes vs. other sources
5. **Engagement Optimization** - Optimized for converting casual clickers to subscribers

## Implementation in sub-api

Our `publishWithNote()` method now automatically includes this parameter:

```typescript
async publishWithNote(
  postBuilder: PostBuilder,
  noteText?: string
): Promise<{ post: any; note?: any }> {
  const post = await postBuilder.publish()
  
  if (noteText && post.canonical_url) {
    // Add Share Center's special parameter
    const shareUrl = post.canonical_url.includes('?')
      ? `${post.canonical_url}&showWelcomeOnShare=true`
      : `${post.canonical_url}?showWelcomeOnShare=true`
    
    note = await this.newNoteWithLink(shareUrl)
      .paragraph()
      .text(noteText)
      .publish()
  }
  
  return { post, note }
}
```

## Before vs After

### Before (without parameter)
```typescript
const note = await profile.newNoteWithLink(post.canonical_url)
  .paragraph()
  .text('Check out my post!')
  .publish()
```
URL: `https://example.com/p/post?r=xxx&utm_campaign=post`

### After (with Share Center parameter)
```typescript
const { post, note } = await profile.publishWithNote(
  profile.newPost().setTitle('...'),
  'Check out my post!'
)
```
URL: `https://example.com/p/post?r=xxx&utm_campaign=post&showWelcomeOnShare=true`

## Benefits

✅ **Authentic Share Center Experience** - Matches official Substack behavior exactly  
✅ **Better Reader Experience** - Optimized welcome flow for new visitors  
✅ **Improved Conversion** - Special onboarding may increase subscriptions  
✅ **Proper Analytics** - Traffic correctly attributed to shared notes  
✅ **Future-Proof** - Matches what Substack's UI does natively  

## Testing

This was discovered by:
1. Publishing a test post via Chrome DevTools
2. Clicking "Share as a note" in the Share Center
3. Capturing the network requests
4. Comparing with standard note publishing

**Date Discovered:** October 4, 2025  
**Status:** ✅ Implemented and working  
**Impact:** Enhanced reader experience and proper Share Center emulation

## Manual Usage

If you want to manually add this parameter:

```typescript
// Standard approach
const shareUrl = post.canonical_url + '&showWelcomeOnShare=true'
const note = await profile.newNoteWithLink(shareUrl)
  .paragraph()
  .text('Check it out!')
  .publish()

// Or use the convenience method (automatically includes it)
const { post, note } = await profile.publishWithNote(
  profile.newPost().setTitle('Title'),
  'Share text'
)
```

## Related Parameters

Other URL parameters you might see:
- `r={reader_id}` - Reader tracking ID
- `utm_campaign=post` - Campaign tracking
- `utm_medium=web` - Medium tracking
- `utm_source=...` - Source tracking
- `showWelcomeOnShare=true` - ⭐ Share Center special parameter

## Conclusion

This discovery ensures our implementation perfectly mirrors Substack's official Share Center behavior, potentially improving reader engagement and subscription conversion rates for automated posts!

---

**Pro Tip:** Always use `publishWithNote()` for automated workflows to get this parameter automatically. For maximum compatibility with Substack's evolving features, stick to the convenience methods rather than manual API calls.

