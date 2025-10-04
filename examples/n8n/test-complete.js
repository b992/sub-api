// n8n Code Node - Complete Test & Publish
// 1. Verifies version
// 2. Tests basic functionality
// 3. Publishes with image + note

const { SubstackClient } = require('@b992/substack-api');

const logs = [];
const log = (msg, extra = {}) => logs.push({ t: new Date().toISOString(), msg, ...extra });

try {
  // ═══════════════════════════════════════
  // STEP 1: Verify Package Version
  // ═══════════════════════════════════════
  const pkg = require('@b992/substack-api/package.json');
  const pkgPath = require.resolve('@b992/substack-api');
  
  log('Package Check', { version: pkg.version, path: pkgPath });
  console.log('📦 SDK Version:', pkg.version);
  console.log('📁 Path:', pkgPath);
  
  if (pkg.version !== '1.6.0') {
    throw new Error(`Wrong version! Expected 1.6.0, got ${pkg.version}. Update the package!`);
  }
  
  if (pkgPath.includes('/tmp/sub-api/')) {
    throw new Error('Still using old /tmp/sub-api/ path! Run: rm -rf /tmp/sub-api && restart n8n');
  }
  
  console.log('✅ Version check passed!');
  console.log('');
  
  // ═══════════════════════════════════════
  // STEP 2: Get Input & Validate
  // ═══════════════════════════════════════
  const all = $input.all().map(i => i.json);
  const base = all[0] || {};
  const output = (all[1] && all[1].output) ? all[1].output : (all[1] || {});
  const refB64 = (all[2] && all[2].referenceImageBase64) ? all[2].referenceImageBase64 : '';

  const API_KEY = base.API_KEY || output.API_KEY;
  const publicationUrl = base.publication || output.publication || '';
  const host = publicationUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

  const title = output.title || base.title || '';
  const subtitle = output.subtitle || '';
  const contentHtml = output.content || '';
  const seoTitle = output.seoTitle || title;
  const seoDescription = output.seoDescription || '';
  const socialTitle = output.socialTitle || title;
  const tags = Array.isArray(output.tags) ? output.tags : [];
  const sectionId = Number.isFinite(output.sectionId) ? output.sectionId : undefined;
  const shareNoteText = output.shareNoteText || `🎉 New article: ${title}`;
  const commentPermissions = output.commentPermissions || 'everyone';

  let coverInput = '';
  if (refB64) coverInput = `data:image/png;base64,${refB64}`;
  else if (typeof output.coverImage === 'string' && output.coverImage) coverInput = output.coverImage;

  if (!API_KEY) throw new Error('Missing API_KEY');
  if (!host) throw new Error('Missing publication hostname');
  if (!title || !contentHtml) throw new Error('Missing title or content');

  log('Input validated', { 
    host, 
    hasCover: !!coverInput, 
    isBase64: coverInput.startsWith('data:'),
    contentLength: contentHtml.length,
    sectionId 
  });
  
  console.log('✅ Input validation passed');
  console.log('  Title:', title.substring(0, 50) + '...');
  console.log('  Host:', host);
  console.log('  Cover:', coverInput ? (coverInput.startsWith('data:') ? 'Base64 image' : 'URL') : 'None');
  console.log('  Section:', sectionId || 'Default');
  console.log('');

  // ═══════════════════════════════════════
  // STEP 3: Initialize & Test SDK
  // ═══════════════════════════════════════
  console.log('🔧 Initializing SDK...');
  const client = new SubstackClient({
    apiKey: API_KEY,
    hostname: host,
    defaultSectionId: sectionId
  });
  log('SDK initialized');

  console.log('👤 Loading profile...');
  const profile = await client.ownProfile();
  log('Profile loaded', { name: profile.name, id: profile.id });
  console.log('✅ Profile loaded:', profile.name);
  console.log('');

  // ═══════════════════════════════════════
  // STEP 4: Build Post
  // ═══════════════════════════════════════
  console.log('📝 Building post...');
  const builder = profile.newPost()
    .setTitle(title)
    .setBodyHtml(contentHtml)
    .setCommentPermissions(commentPermissions);

  if (subtitle) builder.setSubtitle(subtitle);
  if (seoTitle) builder.setSearchEngineTitle(seoTitle);
  if (seoDescription) builder.setSearchEngineDescription(seoDescription);
  if (socialTitle) builder.setSocialTitle(socialTitle);
  if (tags.length > 0) builder.setTags(tags);
  if (sectionId) builder.setSection(sectionId);
  
  if (coverInput) {
    console.log('🖼️  Setting cover image...');
    log('Cover image set', { type: coverInput.startsWith('data:') ? 'base64' : 'url' });
    builder.setCoverImage(coverInput);
  }

  log('Post built');
  console.log('✅ Post configured');
  console.log('');

  // ═══════════════════════════════════════
  // STEP 5: Publish with Note
  // ═══════════════════════════════════════
  console.log('🚀 Publishing post with share note...');
  log('Publishing');
  
  const { post, note } = await profile.publishWithNote(builder, shareNoteText);
  
  log('Published successfully', { 
    postId: post.id, 
    slug: post.slug,
    noteId: note.id 
  });

  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║        ✅ SUCCESS!                      ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  console.log('📄 Post:');
  console.log('  ID:', post.id);
  console.log('  Title:', post.title);
  console.log('  Slug:', post.slug);
  console.log('  URL:', post.url);
  if (post.coverImage) {
    console.log('  Cover:', post.coverImage.substring(0, 60) + '...');
  }
  console.log('');
  console.log('📝 Note:');
  console.log('  ID:', note.id);
  console.log('  URL:', `https://${host}/notes/note/${note.id}`);
  console.log('');

  return [{
    json: {
      success: true,
      version: pkg.version,
      post: {
        id: post.id,
        title: post.title,
        url: post.url,
        slug: post.slug,
        coverImage: post.coverImage || null
      },
      note: {
        id: note.id,
        url: `https://${host}/notes/note/${note.id}`
      },
      logs
    }
  }];

} catch (e) {
  log('ERROR', { err: e.message, stack: e.stack });
  
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║        ❌ ERROR                         ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  console.log('Error:', e.message);
  console.log('');
  
  if (e.stack && e.stack.includes('/tmp/sub-api/')) {
    console.log('⚠️  DETECTED: Still using old code from /tmp/sub-api/');
    console.log('');
    console.log('FIX:');
    console.log('1. On server: rm -rf /tmp/sub-api');
    console.log('2. npm cache clean --force');
    console.log('3. Restart n8n');
    console.log('4. Try again');
  } else if (e.message === 'fetch failed') {
    console.log('⚠️  FETCH FAILED - Likely image upload issue');
    console.log('');
    console.log('This means image upload is trying wrong domain.');
    console.log('Verify you have v1.6.0 installed (not cached old version)');
  }
  
  return [{
    json: {
      success: false,
      error: e.message,
      stack: e.stack,
      logs
    }
  }];
}
