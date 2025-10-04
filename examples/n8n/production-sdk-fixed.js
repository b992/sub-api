// ═══════════════════════════════════════════════════════════════════
// PRODUCTION n8n CODE NODE - SDK VERSION WITH FIXED HTML PARSER
// ═══════════════════════════════════════════════════════════════════
//
// Based on working direct API code + Python parser logic
// 
// Features:
//   ✅ Uses @b992/substack-api SDK (no version caching issues)
//   ✅ HTML to ProseMirror with inline formatting (bold, italic, links, etc.)
//   ✅ Automatic author bylines
//   ✅ Image upload (base64 or URL)
//   ✅ Share note with post
//   ✅ Full metadata (SEO, section, comments, etc.)
//   ✅ Comprehensive logging
//
// ═══════════════════════════════════════════════════════════════════

const { SubstackClient } = require('@b992/substack-api');

const logs = [];
const log = (msg, extra = {}) => logs.push({ t: new Date().toISOString(), msg, ...extra });

try {
  // ═══════════════════════════════════════════════════════════════
  // STEP 1: Parse Input
  // ═══════════════════════════════════════════════════════════════
  
  const all = $input.all().map(i => i.json);
  
  const base = all[0] || {};
  const output = (all[1] && all[1].output) ? all[1].output : (all[1] || {});
  const refB64 = (all[2] && all[2].referenceImageBase64) ? all[2].referenceImageBase64 : '';
  
  // Extract config
  const API_KEY = base.API_KEY || output.API_KEY;
  const publicationUrl = base.publication || output.publication || '';
  const host = publicationUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  // Extract content
  const title = output.title || base.title || '';
  const subtitle = output.subtitle || '';
  const contentHtml = output.content || '';
  const seoTitle = output.seoTitle || title;
  const seoDescription = output.seoDescription || '';
  const socialTitle = output.socialTitle || title;
  const sectionId = Number.isFinite(output.sectionId) ? output.sectionId : undefined;
  const shareNoteText = output.shareNoteText || `🎉 New article: ${title}`;
  const commentPermissions = output.commentPermissions || 'everyone';
  
  // Handle cover image
  let coverInput = '';
  if (refB64) {
    coverInput = `data:image/png;base64,${refB64}`;
  } else if (typeof output.coverImage === 'string' && output.coverImage) {
    coverInput = output.coverImage;
  }
  
  // Validate
  if (!API_KEY) throw new Error('Missing API_KEY');
  if (!host) throw new Error('Missing publication hostname');
  if (!title || !contentHtml) throw new Error('Missing title or content');
  
  log('Input parsed', { 
    host, 
    title, 
    hasSubtitle: !!subtitle,
    hasCover: !!coverInput, 
    coverIsBase64: coverInput.startsWith('data:'),
    sectionId: sectionId ?? null,
    contentLength: contentHtml.length
  });
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 2: Initialize SDK
  // ═══════════════════════════════════════════════════════════════
  
  const cookieValue = API_KEY.toString().trim().split('\n')[0].trim()
    .replace(/^connect\.sid=/, '');
  
  const client = new SubstackClient({
    hostname: host,
    cookie: `connect.sid=${cookieValue}`,
    defaultSectionId: sectionId
  });
  
  log('SDK initialized');
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 3: Get Profile
  // ═══════════════════════════════════════════════════════════════
  
  const profile = await client.ownProfile();
  log('Profile loaded', { 
    name: profile.name,
    handle: profile.handle
  });
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 4: Build Post
  // ═══════════════════════════════════════════════════════════════
  
  const builder = profile.newPost()
    .setTitle(title)
    .setBodyHtml(contentHtml)
    .setAudience('everyone')
    .setCommentPermissions(commentPermissions);
  
  if (subtitle) builder.setSubtitle(subtitle);
  if (seoTitle) builder.setSeoTitle(seoTitle);
  if (seoDescription) builder.setSeoDescription(seoDescription);
  if (socialTitle) builder.setSocialTitle(socialTitle);
  if (coverInput) builder.setCoverImage(coverInput);
  if (sectionId) builder.setSection(sectionId);
  
  log('Post builder configured', {
    hasSubtitle: !!subtitle,
    hasSeo: !!(seoTitle || seoDescription),
    hasCover: !!coverInput,
    sectionId: sectionId ?? null
  });
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 5: Publish with Share Note
  // ═══════════════════════════════════════════════════════════════
  
  log('Publishing post with share note...');
  
  const result = await profile.publishWithNote(builder, shareNoteText);
  
  log('Published successfully', {
    postId: result.post.id,
    postUrl: result.post.canonical_url,
    noteId: result.note?.id
  });
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 6: Return Results
  // ═══════════════════════════════════════════════════════════════
  
  return [{
    json: {
      success: true,
      post: {
        id: result.post.id,
        title: result.post.title,
        subtitle: result.post.subtitle || null,
        url: result.post.canonical_url,
        slug: result.post.slug,
        coverImage: coverInput || null,
        sectionId: sectionId ?? null
      },
      note: result.note ? {
        id: result.note.id,
        text: shareNoteText,
        url: `https://${host}/notes/note/${result.note.id}`
      } : null,
      logs
    }
  }];
  
} catch (e) {
  log('ERROR', { 
    error: e.message, 
    stack: e.stack 
  });
  
  console.error('╔════════════════════════════════════════╗');
  console.error('║          ❌ ERROR                       ║');
  console.error('╚════════════════════════════════════════╝');
  console.error('');
  console.error('Error:', e.message);
  console.error('');
  
  if (e.stack) {
    console.error('Stack trace:');
    console.error(e.stack);
    console.error('');
    
    // Check for old cached SDK
    if (e.stack.includes('/tmp/sub-api/')) {
      console.error('⚠️  DETECTED: Old /tmp/sub-api/ in stack!');
      console.error('   Solution: Restart n8n to clear memory cache');
      console.error('   Command: sudo systemctl restart n8n');
    }
  }
  
  // Provide helpful error messages
  if (e.message === 'fetch failed') {
    console.error('💡 "fetch failed" usually means:');
    console.error('   1. Cookie expired (get new connect.sid)');
    console.error('   2. Network/connectivity issue');
    console.error('   3. Using old SDK version (check stack above)');
  }
  
  if (e.message.includes('is not a function')) {
    console.error('💡 Function error usually means:');
    console.error('   1. Old SDK version cached in n8n');
    console.error('   2. Need to restart n8n');
    console.error('   3. SDK not installed correctly');
  }
  
  console.error('');
  console.error('Full logs available in output JSON');
  
  return [{
    json: {
      success: false,
      error: e.message,
      stack: e.stack,
      logs,
      troubleshooting: {
        checkSdkVersion: 'Ensure @b992/substack-api v1.6.0+ is installed',
        checkCookie: 'Verify connect.sid is valid and not expired',
        checkN8nCache: 'Restart n8n if using old SDK code: sudo systemctl restart n8n'
      }
    }
  }];
}

/*
 * ═══════════════════════════════════════════════════════════════════
 * SETUP INSTRUCTIONS
 * ═══════════════════════════════════════════════════════════════════
 * 
 * 1. Install SDK on your n8n server:
 *    npm install @b992/substack-api@latest
 * 
 * 2. Required input structure (3 nodes merged):
 *    
 *    Node 1 (credentials):
 *    {
 *      "API_KEY": "your_connect.sid_value",
 *      "publication": "https://yourpub.substack.com"
 *    }
 *    
 *    Node 2 (content):
 *    {
 *      "output": {
 *        "title": "Your Post Title",
 *        "subtitle": "Optional subtitle",
 *        "content": "<h2>Heading</h2><p>Paragraph with <strong>bold</strong> text.</p>",
 *        "seoTitle": "SEO Title",
 *        "seoDescription": "SEO description",
 *        "socialTitle": "Social media title",
 *        "sectionId": 123456,
 *        "shareNoteText": "🎉 Check out my new post!",
 *        "commentPermissions": "everyone",
 *        "coverImage": "https://example.com/image.jpg" // or leave empty for Node 3
 *      }
 *    }
 *    
 *    Node 3 (optional base64 image):
 *    {
 *      "referenceImageBase64": "iVBORw0KGgoAAAANSUhEUg..."
 *    }
 * 
 * 3. HTML Content Format:
 *    - <h2>, <h3>, <h4> for headings
 *    - <p> for paragraphs
 *    - <strong> or <b> for bold
 *    - <em> or <i> for italic
 *    - <a href="url">link text</a> for links
 *    - <code> for inline code
 *    - <del> or <s> for strikethrough
 *    - <ul><li>...</li></ul> for bullet lists
 *    - <ol><li>...</li></ol> for numbered lists
 * 
 * 4. Finding Section IDs:
 *    - Go to your publication's dashboard
 *    - Navigate to Settings → Sections
 *    - Inspect the page source for section IDs
 *    - Or use the section discovery script
 * 
 * 5. Troubleshooting:
 *    - Check logs array in output
 *    - Verify SDK version (should be 1.6.0+)
 *    - Restart n8n if seeing old paths in stack traces
 *    - Ensure connect.sid cookie is fresh (< 90 days old)
 * 
 * ═══════════════════════════════════════════════════════════════════
 */
