# Quick Reference: Share Center Integration

## 🎯 Quick Start

### Publish Post + Share Note (One Command)

```typescript
import { SubstackClient } from './src'

const client = new SubstackClient({ /* config */ })
const profile = await client.ownProfile()

const { post, note } = await profile.publishWithNote(
  profile.newPost()
    .setTitle('Your Article Title')
    .setSubtitle('Subtitle here')
    .setBodyHtml('<h2>Content</h2><p>Your article...</p>')
    .setCoverImage('https://example.com/image.jpg')
    .setTags(['AI', 'Writing']),
  '🎉 New article! Check it out.'  // Share note text
)

console.log('Published:', post.canonical_url)
```

## 📝 Full Featured Example

```typescript
const { post, note } = await profile.publishWithNote(
  profile.newPost()
    // Content
    .setTitle('Article Title')
    .setSubtitle('Article Subtitle')
    .setBodyHtml('<h2>Heading</h2><p>Content...</p>')
    
    // Images & Media
    .setCoverImage('https://example.com/cover.jpg')
    
    // Metadata
    .setDescription('SEO description')
    .setTags(['tag1', 'tag2', 'tag3'])
    
    // SEO
    .setSearchEngineTitle('SEO Title')
    .setSearchEngineDescription('SEO description')
    .setSocialTitle('Social Media Title')
    
    // Settings
    .setAudience('everyone')  // or 'paid' or 'founding'
    .setType('newsletter')     // or 'podcast' or 'thread'
    .setCommentPermissions('everyone'),
  
  // Optional share note
  'Check out my new article! 🚀'
)
```

## 🛠️ Manual Control

```typescript
// Step 1: Publish
const post = await profile.newPost()
  .setTitle('Title')
  .setBodyHtml('<p>Content</p>')
  .publish()

// Step 2: Share as note
const note = await profile.newNoteWithLink(post.canonical_url)
  .paragraph()
  .text('Custom share message here!')
  .paragraph()
  .text('More details...')
  .publish()
```

## 📊 Available Metadata

### Content
- `setTitle(string)` - Required
- `setSubtitle(string)` - Optional
- `setBodyHtml(string)` - Required (use HTML)
- `setCoverImage(url)` - Optional

### Discovery
- `setTags([...])` - Add multiple tags
- `addTag(tag)` - Add single tag
- `setDescription(string)` - SEO description

### SEO
- `setSearchEngineTitle(string)`
- `setSearchEngineDescription(string)`
- `setSocialTitle(string)`

### Settings
- `setAudience('everyone' | 'paid' | 'founding')`
- `setType('newsletter' | 'podcast' | 'thread')`
- `setCommentPermissions('everyone' | 'paid' | 'founding' | 'no_one')`
- `setCommentSort('best_first' | 'newest_first' | 'oldest_first')`
- `setExplicit(boolean)`
- `setHideFromFeed(boolean)`

## 🎨 HTML Formatting Examples

```typescript
.setBodyHtml(`
  <h2>Heading 2</h2>
  <p>Paragraph text</p>
  
  <h3>Heading 3</h3>
  <p>More <strong>bold</strong> and <em>italic</em> text</p>
  
  <ul>
    <li>Bullet point 1</li>
    <li>Bullet point 2</li>
  </ul>
  
  <ol>
    <li>Numbered item 1</li>
    <li>Numbered item 2</li>
  </ol>
  
  <blockquote>
    <p>Quote text here</p>
  </blockquote>
  
  <p><a href="https://example.com">Link text</a></p>
`)
```

## 🔗 Environment Setup

```bash
# .env file
SUBSTACK_EMAIL=your@email.com
SUBSTACK_PASSWORD=your_password
SUBSTACK_HOSTNAME=yourpub.substack.com
SUBSTACK_SECTION_ID=123456  # Optional default section
```

## 🚀 Run Examples

```bash
# Build the project
npm run build

# Run the comprehensive example
npx tsx PUBLISH_WITH_SHARE_NOTE_EXAMPLE.ts

# Or import in your code
import { publishWithShareNoteExample } from './PUBLISH_WITH_SHARE_NOTE_EXAMPLE'
```

## 📖 Related Files

- `SHARE_CENTER_INTEGRATION.md` - Complete technical documentation
- `SHARE_CENTER_SUMMARY.md` - Full project summary
- `PUBLISH_WITH_SHARE_NOTE_EXAMPLE.ts` - Working code examples
- `src/domain/own-profile.ts` - Implementation source code

## ⚡ Benefits

✅ One command to publish and promote  
✅ Automatic note with post link  
✅ Full metadata support  
✅ Graceful error handling  
✅ Works with existing API  
✅ Perfect for automation  
✅ **Includes Share Center's `showWelcomeOnShare=true` parameter**  

## 💡 Use Cases

- **Content Automation** - Automated publishing pipelines
- **Social Promotion** - Auto-share all published posts
- **n8n Workflows** - Integrate with automation tools
- **Scheduled Publishing** - Combined with scheduling
- **RSS to Substack** - Auto-post from RSS feeds

## 🎯 Next Steps

1. Copy the quick start example
2. Replace with your content
3. Configure environment variables
4. Run and test
5. Integrate into your workflow!

---

**Need help?** Check the detailed docs in SHARE_CENTER_INTEGRATION.md

