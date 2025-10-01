# 📋 Substack Post API - Quick Reference

## ✅ What Works

```typescript
// Create a draft with perfect formatting
const draft = await profile.newPost()
  .setTitle('My Post')
  .setBodyHtml('<h2>Title</h2><p>Content</p>')
  .setDescription('SEO description')
  .createDraft();
// → Draft ID: draft.id
// → Edit URL: https://yoursite.substack.com/publish/post/${draft.id}
```

## ⚠️ What's Partially Working

```typescript
// Publishing returns 400, use UI instead
await draft.publish({ section_id: 194500 });
// → Throws error, use manual publish for now
```

## 🎯 Default Section

**Hardcoded**: Whiskey & Flowers 🌸 (ID: `194500`)

## 📁 Key Files

- `SUMMARY.md` - Complete overview
- `PUBLISH_API_STATUS.md` - Technical details
- `EXAMPLE_POST_CREATION.ts` - Working code
- `src/internal/services/post-service.ts` - Implementation

## 🚀 Current Workflow

1. Create draft via API ✅
2. Publish manually in UI ⚠️

That's it! 🎉
