// n8n Code (JavaScript) — Production Ready with SDK v1.6.0 + DEBUG
// ✅ Replaces your bypass code with full SDK support
// 🔍 Enhanced with comprehensive debug logging

const { SubstackClient } = require('@b992/substack-api');

const logs = [];
const log = (msg, extra = {}) => {
  const entry = { t: new Date().toISOString(), msg, ...extra };
  logs.push(entry);
  console.log(`[${entry.t}] 🔍 ${msg}`, extra ? JSON.stringify(extra).substring(0, 100) : '');
};

try {
  // ═══════════════════════════════════════════════════════════
  // STEP 0: Version Check
  // ═══════════════════════════════════════════════════════════
  const pkg = require('@b992/substack-api/package.json');
  const pkgPath = require.resolve('@b992/substack-api');
  
  console.log('╔════════════════════════════════════════╗');
  console.log('║   SDK VERSION & PATH CHECK             ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('Version:', pkg.version);
  console.log('Path:', pkgPath);
  console.log('Expected: 1.6.0');
  console.log('');
  
  log('SDK Version Check', { version: pkg.version, path: pkgPath });
  
  if (pkg.version !== '1.6.0') {
    throw new Error(`Wrong SDK version! Expected 1.6.0, got ${pkg.version}`);
  }
  
  if (pkgPath.includes('/tmp/sub-api/')) {
    throw new Error('Using old /tmp/sub-api/ path! Need to clean and restart.');
  }
  
  console.log('✅ Version check passed!');
  console.log('');
  
  // ---- Merge inputs (same as your bypass) ----
  log('Parsing inputs');
  const all = $input.all().map(i => i.json);
  log('Input count', { count: all.length });
  
  const base = all[0] || {};
  const output = (all[1] && all[1].output) ? all[1].output : (all[1] || {});
  const refB64 = (all[2] && all[2].referenceImageBase64) ? all[2].referenceImageBase64 : '';
  
  log('Inputs parsed', { 
    hasBase: !!base, 
    hasOutput: !!output, 
    hasImage: !!refB64 
  });

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

  // Handle cover image
  let coverInput = '';
  if (refB64) coverInput = `data:image/png;base64,${refB64}`;
  else if (typeof output.coverImage === 'string' && output.coverImage) coverInput = output.coverImage;

  // Validation
  log('Validating inputs', { 
    hasApiKey: !!API_KEY, 
    hasHost: !!host, 
    hasTitle: !!title,
    hasContent: !!contentHtml,
    contentLength: contentHtml?.length || 0
  });
  
  if (!API_KEY) throw new Error('Missing API_KEY / connect.sid');
  if (!host) throw new Error('Missing publication hostname');
  if (!title || !contentHtml) throw new Error('Missing title or content');

  log('Validation passed');
  log('Start publishing', { 
    host, 
    hasCover: !!coverInput, 
    coverIsDataUrl: coverInput.startsWith('data:'),
    titleLength: title.length,
    contentLength: contentHtml.length,
    sectionId: sectionId || 'default'
  });
  
  console.log('');
  console.log('📋 Configuration:');
  console.log('  Host:', host);
  console.log('  Title:', title.substring(0, 60) + '...');
  console.log('  Content length:', contentHtml.length);
  console.log('  Section:', sectionId || 'default');
  console.log('  Cover image:', coverInput ? (coverInput.startsWith('data:') ? 'Base64 (' + Math.round(coverInput.length/1024) + 'KB)' : 'URL') : 'None');
  console.log('  Tags:', tags.join(', '));
  console.log('');

  // ---- Initialize SDK ----
  console.log('🔧 Initializing SDK...');
  log('Creating SubstackClient', { hostname: host, hasSectionId: !!sectionId });
  
  const client = new SubstackClient({
    apiKey: API_KEY,
    hostname: host,
    defaultSectionId: sectionId
  });

  log('Client initialized');
  console.log('✅ Client created');
  console.log('');

  // Get authenticated profile
  console.log('👤 Loading profile...');
  log('Calling ownProfile()');
  
  const profile = await client.ownProfile();
  
  log('Profile loaded', { 
    name: profile.name, 
    id: profile.id,
    slug: profile.slug 
  });
  console.log('✅ Profile loaded:', profile.name, `(@${profile.slug})`);
  console.log('');

  // ---- Build post ----
  console.log('📝 Building post...');
  log('Creating PostBuilder');
  
  const builder = profile.newPost()
    .setTitle(title)
    .setBodyHtml(contentHtml)  // ✅ SDK now preserves inline formatting!
    .setCommentPermissions(commentPermissions);

  log('Basic fields set', { hasTitle: true, hasContent: true });

  if (subtitle) {
    builder.setSubtitle(subtitle);
    log('Subtitle set');
  }
  if (seoTitle) {
    builder.setSearchEngineTitle(seoTitle);
    log('SEO title set');
  }
  if (seoDescription) {
    builder.setSearchEngineDescription(seoDescription);
    log('SEO description set');
  }
  if (socialTitle) {
    builder.setSocialTitle(socialTitle);
    log('Social title set');
  }
  if (tags.length > 0) {
    builder.setTags(tags);
    log('Tags set', { count: tags.length });
  }
  if (sectionId) {
    builder.setSection(sectionId);
    log('Section set', { sectionId });
  }
  
  // ✅ SDK handles both base64 and URL automatically!
  // - Base64: Creates temp draft → uploads to S3 → uses S3 URL
  // - URL: Uses directly
  if (coverInput) {
    const isBase64 = coverInput.startsWith('data:');
    log('Setting cover image', { 
      isBase64, 
      size: isBase64 ? Math.round(coverInput.length/1024) + 'KB' : 'URL' 
    });
    console.log('🖼️  Setting cover image:', isBase64 ? 'Base64 upload' : 'Direct URL');
    builder.setCoverImage(coverInput);
  }
  
  log('Post builder configured');
  console.log('✅ Post configured with all metadata');
  console.log('');

  // ---- Publish with share note ----
  console.log('🚀 Publishing...');
  console.log('   This will:');
  console.log('   1. Create temp draft (if base64 image)');
  console.log('   2. Upload image to S3 (if base64)');
  console.log('   3. Create final draft with content');
  console.log('   4. Publish post');
  console.log('   5. Create share note');
  console.log('');
  
  log('Calling publishWithNote', { noteText: shareNoteText.substring(0, 50) + '...' });
  
  // ✅ SDK has built-in publishWithNote() on profile that:
  // 1. Publishes the post
  // 2. Creates attachment with showWelcomeOnShare=true
  // 3. Posts note with attachment
  const { post, note } = await profile.publishWithNote(builder, shareNoteText);
  
  log('Post published', { 
    postId: post.id, 
    slug: post.slug,
    url: post.url,
    hasCover: !!post.coverImage 
  });
  log('Note created', { noteId: note.id });
  
  console.log('');
  console.log('✅ Published successfully!');
  console.log('');

  // ---- Return success ----
  console.log('╔════════════════════════════════════════╗');
  console.log('║          ✅ SUCCESS!                    ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  console.log('📄 Post:');
  console.log('  ID:', post.id);
  console.log('  Title:', post.title);
  console.log('  Slug:', post.slug);
  console.log('  URL:', post.url);
  if (post.coverImage) {
    console.log('  Cover:', post.coverImage.substring(0, 80) + '...');
    if (post.coverImage.includes('s3.amazonaws.com')) {
      console.log('  ✅ Image on S3');
    }
  }
  console.log('');
  console.log('📝 Note:');
  console.log('  ID:', note.id);
  console.log('  URL:', `https://${host}/notes/note/${note.id}`);
  console.log('');
  
  log('Workflow completed successfully');
  
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
  log('ERROR', { err: e.message });
  
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║          ❌ ERROR                       ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  console.log('Error:', e.message);
  console.log('');
  
  if (e.stack) {
    console.log('Stack trace:');
    console.log(e.stack);
    console.log('');
    
    if (e.stack.includes('/tmp/sub-api/')) {
      console.log('⚠️  DETECTED: Old /tmp/sub-api/ in stack!');
      console.log('   n8n needs restart to clear memory cache');
    }
  }
  
  if (e.message === 'fetch failed') {
    console.log('💡 "fetch failed" can mean:');
    console.log('   1. Network/connectivity issue');
    console.log('   2. Cookie expired/invalid');
    console.log('   3. API endpoint changed');
    console.log('   4. Using old SDK code (check path above)');
  }
  
  console.log('');
  console.log('Debug info in logs array above');
  
  return [{
    json: {
      success: false,
      error: e.message,
      stack: e.stack,
      logs
    }
  }];
}
