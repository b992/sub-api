# How to Test SDK v1.6.0 in n8n

## Test Data Available

File: `test-data.json`

Contains:
- ✅ Your Gods & Monsters credentials
- ✅ Sample post content with HTML formatting
- ✅ Blue rectangle base64 image (tiny, for testing)
- ✅ Section ID 176629 (The Monster Manual)

---

## Step-by-Step Test in n8n

### 1. Create Workflow with 3 Input Nodes

**Node 1 - Config (Manual Trigger or Set node):**
```json
{
  "API_KEY": "s%3Aw_JqH1OwRTbSYFZpSVRsoiunqORPrmvT.cbXS44BJpaS1bPuu%2F0FTLYho8%2BEONR6G8aw2vH5Q48w\n",
  "publication": "https://thegodsandmonsters.substack.com/",
  "section_ID": null
}
```

**Node 2 - Content (Set node):**
```json
{
  "output": {
    "title": "SDK Test Post v1.6.0",
    "subtitle": "Testing image upload and inline formatting",
    "content": "<h2>Main Heading</h2><p>This is a test with <strong>bold text</strong> and <em>italic text</em>.</p><p>Here's a <a href=\"https://example.com\">link</a> and some <code>inline code</code>.</p><ul><li>Bullet point 1</li><li>Bullet point 2</li></ul>",
    "seoTitle": "SDK Test Post - Version 1.6.0",
    "seoDescription": "Testing all SDK v1.6.0 fixes: image upload, author bylines, HTML formatting",
    "socialTitle": "Testing SDK v1.6.0 fixes! 🚀",
    "shareNoteText": "🧪 Testing SDK v1.6.0 - all fixes applied!",
    "tags": ["test", "sdk", "v1.6.0"],
    "sectionId": 176629,
    "commentPermissions": "everyone"
  }
}
```

**Node 3 - Image (Set node):**
```json
{
  "referenceImageBase64": "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAXklEQVR4nO3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBjAB2gAAE2OFgRAAAAAElFTkSuQmCC"
}
```

### 2. Add Code Node with test-complete.js

Copy the content from `test-complete.js` into a Code node.

Connect the 3 input nodes to it.

### 3. Run & Watch Output

**If v1.6.0 is working:**
```
📦 SDK Version: 1.6.0
✅ Version check passed!
✅ Input validation passed
👤 Loading profile...
✅ Profile loaded: Gabriel B.
📝 Building post...
🖼️  Setting cover image...
✅ Post configured
🚀 Publishing post with share note...

╔════════════════════════════════════════╗
║        ✅ SUCCESS!                      ║
╚════════════════════════════════════════╝

📄 Post:
  ID: 123456
  Title: SDK Test Post v1.6.0
  Slug: sdk-test-post-v160
  URL: https://thegodsandmonsters.substack.com/p/sdk-test-post-v160
  Cover: https://substack-post-media.s3.amazonaws.com/...

📝 Note:
  ID: 654321
  URL: https://thegodsandmonsters.substack.com/notes/note/654321
```

**If still old version:**
```
❌ Wrong version! Expected 1.6.0, got 1.5.0
OR
❌ Still using old /tmp/sub-api/ path!

FIX:
1. rm -rf /tmp/sub-api
2. npm cache clean --force
3. Restart n8n
```

---

## What to Check in Published Post

1. **Cover Image**
   - Should be blue rectangle
   - Should be hosted on S3 (not base64)
   - URL should start with `https://substack-post-media.s3.amazonaws.com/`

2. **Author**
   - Should show "Gabriel B." or your author name
   - NOT blank/missing

3. **Formatting**
   - "Main Heading" should be H2 (large)
   - "bold text" should be **bold**
   - "italic text" should be *italic*
   - Link should be clickable
   - `inline code` should have monospace font
   - Bullet points should be formatted list
   - NOT everything as H2!

4. **Note**
   - Should exist with link to post
   - Should have "showWelcomeOnShare=true" in URL

---

## If It Works

🎉 **All 3 bugs are fixed!**

1. ✅ Image upload (global domain)
2. ✅ Author bylines (userId included)
3. ✅ HTML formatting (inline marks preserved)

Now you can use `production-ready.js` for real posts!

---

## If It Fails

Check the error message in n8n output.

**Common issues:**
- Wrong version → Update package
- Old path `/tmp/sub-api/` → Clean and reinstall
- "fetch failed" → Old cached code, restart n8n
