// n8n Code (JavaScript) — Production Ready with SDK v1.5.0
// ✅ Replaces your bypass code with full SDK support

const { SubstackClient } = require('@b992/substack-api');

const logs = [];
const log = (msg, extra = {}) => logs.push({ t: new Date().toISOString(), msg, ...extra });

try {
  // ---- Merge inputs (same as your bypass) ----
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

  // Handle cover image
  let coverInput = '';
  if (refB64) coverInput = `data:image/png;base64,${refB64}`;
  else if (typeof output.coverImage === 'string' && output.coverImage) coverInput = output.coverImage;

  // Validation
  if (!API_KEY) throw new Error('Missing API_KEY / connect.sid');
  if (!host) throw new Error('Missing publication hostname');
  if (!title || !contentHtml) throw new Error('Missing title or content');

  log('Start', { host, hasCover: !!coverInput, coverIsDataUrl: coverInput.startsWith('data:') });

  // ---- Initialize SDK ----
  const client = new SubstackClient({
    apiKey: API_KEY,
    hostname: host,
    defaultSectionId: sectionId
  });

  log('Client initialized');

  // Get authenticated profile
  const profile = await client.ownProfile();
  log('Profile loaded', { name: profile.name });

  // ---- Build post ----
  const builder = profile.newPost()
    .setTitle(title)
    .setBodyHtml(contentHtml)  // ✅ SDK now preserves inline formatting!
    .setCommentPermissions(commentPermissions);

  if (subtitle) builder.setSubtitle(subtitle);
  if (seoTitle) builder.setSearchEngineTitle(seoTitle);
  if (seoDescription) builder.setSearchEngineDescription(seoDescription);
  if (socialTitle) builder.setSocialTitle(socialTitle);
  if (tags.length > 0) builder.setTags(tags);
  if (sectionId) builder.setSection(sectionId);
  
  // ✅ SDK handles both base64 and URL automatically!
  // - Base64: Creates temp draft → uploads to S3 → uses S3 URL
  // - URL: Uses directly
  if (coverInput) {
    log('Setting cover image', { isBase64: coverInput.startsWith('data:') });
    builder.setCoverImage(coverInput);
  }

  // ---- Publish with share note ----
  log('Publishing post with share note');
  
  // ✅ SDK has built-in publishWithNote() on profile that:
  // 1. Publishes the post
  // 2. Creates attachment with showWelcomeOnShare=true
  // 3. Posts note with attachment
  const { post, note } = await profile.publishWithNote(builder, shareNoteText);
  
  log('Post published', { postId: post.id, slug: post.slug });
  log('Note created', { noteId: note.id });

  // ---- Return success ----
  return [{
    json: {
      success: true,
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
  log('Error', { err: e.message, stack: e.stack });
  return [{
    json: {
      success: false,
      error: e.message,
      stack: e.stack,
      logs
    }
  }];
}
