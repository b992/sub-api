is // n8n Code (JavaScript) — COMPLETE FIX: Author + Better HTML parsing

function normalizeCookie(apiKeyRaw) {
  let s = (apiKeyRaw ?? '').toString().trim();
  s = s.split('\n')[0].trim();
  try { s = decodeURIComponent(s); } catch {}
  const m = s.match(/connect\.sid=([^;]+)/);
  return m ? m[1] : s.replace(/^connect\.sid=/, '');
}

// ✅ IMPROVED: Better HTML to ProseMirror conversion
function htmlToSubstackJson(html) {
  const content = [];
  
  if (!html || html.trim() === '') {
    return { type: 'doc', content: [] };
  }

  // Split by actual HTML tags, not just lines
  const tagRegex = /<(h2|h3|h4|p|ul|ol|li)[^>]*>.*?<\/\1>/gi;
  const matches = html.match(tagRegex) || [];
  
  for (const match of matches) {
    const trimmed = match.trim();
    
    // Heading 2
    if (trimmed.match(/^<h2[^>]*>/i)) {
      const text = trimmed.replace(/<h2[^>]*>(.*?)<\/h2>/i, '$1').replace(/<[^>]+>/g, '').trim();
      if (text) {
        content.push({
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text }]
        });
      }
    }
    // Heading 3
    else if (trimmed.match(/^<h3[^>]*>/i)) {
      const text = trimmed.replace(/<h3[^>]*>(.*?)<\/h3>/i, '$1').replace(/<[^>]+>/g, '').trim();
      if (text) {
        content.push({
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text }]
        });
      }
    }
    // Heading 4
    else if (trimmed.match(/^<h4[^>]*>/i)) {
      const text = trimmed.replace(/<h4[^>]*>(.*?)<\/h4>/i, '$1').replace(/<[^>]+>/g, '').trim();
      if (text) {
        content.push({
          type: 'heading',
          attrs: { level: 3 },  // Substack uses level 3 for h4
          content: [{ type: 'text', text }]
        });
      }
    }
    // Paragraph (most common)
    else if (trimmed.match(/^<p[^>]*>/i)) {
      const text = trimmed.replace(/<p[^>]*>(.*?)<\/p>/i, '$1').replace(/<[^>]+>/g, '').trim();
      if (text) {
        content.push({
          type: 'paragraph',
          content: [{ type: 'text', text }]
        });
      }
    }
  }

  // If no matches found, treat entire HTML as one paragraph
  if (content.length === 0 && html.trim()) {
    const text = html.replace(/<[^>]+>/g, '').trim();
    if (text) {
      content.push({
        type: 'paragraph',
        content: [{ type: 'text', text }]
      });
    }
  }

  return {
    type: 'doc',
    content: content.length > 0 ? content : []
  };
}

const http = async (o) => this.helpers.httpRequest({ json: true, ...o });

const logs = [];
const log = (msg, extra = {}) => logs.push({ t: new Date().toISOString(), msg, ...extra });

try {
  // ---- Merge inputs ----
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

  const cookie = normalizeCookie(API_KEY);
  if (!cookie) throw new Error('Missing API_KEY / connect.sid');
  if (!host) throw new Error('Missing publication hostname');
  if (!title || !contentHtml) throw new Error('Missing title or content');

  log('Start', { host, hasCover: !!coverInput });

  const Cookie = `connect.sid=${cookie}`;

  // ✅ ADDED: Get author ID from subscription
  log('Getting author ID');
  const subscription = await http({
    method: 'GET',
    url: `https://${host}/api/v1/subscription`,
    headers: { Cookie },
  });
  const authorId = subscription?.user_id;
  if (!authorId) {
    log('Warning: Could not get author ID, proceeding without bylines');
  } else {
    log('Author ID found', { authorId });
  }

  // 1) Create temp draft
  log('Create temp draft');
  const tempDraft = await http({
    method: 'POST',
    url: `https://${host}/api/v1/drafts`,
    headers: { Cookie, 'Content-Type': 'application/json' },
    body: { 
      draft_bylines: authorId ? [{ id: authorId, is_guest: false }] : []  // ✅ FIXED
    },
  });
  const tempId = tempDraft?.id;
  if (!tempId) throw new Error('Temp draft create failed');
  log('Temp draft created', { tempId });

  // 2) Upload image to GLOBAL
  let coverUrl = '';
  if (coverInput && coverInput.startsWith('data:')) {
    log('Uploading image to global domain', { postId: tempId });
    const up = await http({
      method: 'POST',
      url: 'https://substack.com/api/v1/image',
      headers: { Cookie, 'Content-Type': 'application/json' },
      body: { image: coverInput, postId: tempId },
    });
    coverUrl = up?.url || '';
    log('Image uploaded', { s3Url: coverUrl });
  } else if (coverInput && /^https?:\/\//i.test(coverInput)) {
    coverUrl = coverInput;
  }

  // 3) Create final draft
  log('Create final draft');
  const finalDraft = await http({
    method: 'POST',
    url: `https://${host}/api/v1/drafts`,
    headers: { Cookie, 'Content-Type': 'application/json' },
    body: { 
      draft_bylines: authorId ? [{ id: authorId, is_guest: false }] : []  // ✅ FIXED
    },
  });
  const draftId = finalDraft?.id;
  if (!draftId) throw new Error('Final draft create failed');
  log('Final draft created', { draftId });

  // 4) Update draft with content
  const bodyJson = htmlToSubstackJson(contentHtml);
  log('Content converted', { 
    paragraphs: bodyJson.content.filter(c => c.type === 'paragraph').length,
    headings: bodyJson.content.filter(c => c.type === 'heading').length
  });
  
  log('Updating draft', { draftId, withCover: !!coverUrl, sectionId: sectionId ?? null });
  await http({
    method: 'PUT',
    url: `https://${host}/api/v1/drafts/${draftId}`,
    headers: { Cookie, 'Content-Type': 'application/json' },
    body: {
      draft_title: title,
      draft_subtitle: subtitle,
      draft_body: JSON.stringify(bodyJson),
      draft_bylines: authorId ? [{ id: authorId, is_guest: false }] : [],  // ✅ FIXED
      type: 'newsletter',
      audience: 'everyone',
      editor_v2: true,
      subscriber_set_id: 1,
      should_send_email: true,
      description: seoDescription,
      search_engine_title: seoTitle,
      search_engine_description: seoDescription,
      social_title: socialTitle,
      cover_image: coverUrl || undefined,
      draft_section_id: sectionId,
      section_chosen: !!sectionId,
      write_comment_permissions: commentPermissions,
      default_comment_sort: 'best_first',
      free_unlock_required: false,
      exempt_from_archive_paywall: false,
      explicit: false,
      meter_type: 'none',
      hide_from_feed: false,
      should_send_free_preview: false,
      show_guest_bios: false,
    },
  });
  log('Draft updated successfully');

  // 5) Publish
  log('Publishing draft');
  const publishResp = await http({
    method: 'POST',
    url: `https://${host}/api/v1/drafts/${draftId}/publish`,
    headers: { Cookie, 'Content-Type': 'application/json' },
    body: { send: false },
  });
  log('Draft published', { postId: publishResp?.id });

  const slug = publishResp?.slug || '';
  const postUrl = publishResp?.canonical_url || (slug ? `https://${host}/p/${slug}` : `https://${host}`);

  // 6) Share note
  const sharedUrl = `${postUrl}${postUrl.includes('?') ? '&' : '?'}showWelcomeOnShare=true`;

  log('Creating attachment');
  const attach = await http({
    method: 'POST',
    url: 'https://substack.com/api/v1/comment/attachment',
    headers: { Cookie, 'Content-Type': 'application/json' },
    body: { type: 'link', url: sharedUrl },
  });
  const attachmentId = attach?.id;
  if (!attachmentId) throw new Error('Attachment create failed');

  log('Publishing note');
  const noteDoc = {
    type: 'doc',
    attrs: { schemaVersion: 'v1' },
    content: [{ type: 'paragraph', content: [{ type: 'text', text: shareNoteText }] }],
  };
  const note = await http({
    method: 'POST',
    url: `https://${host}/api/v1/comment/feed`,
    headers: { Cookie, 'Content-Type': 'application/json' },
    body: {
      bodyJson: noteDoc,
      attachmentIds: [attachmentId],
      replyMinimumRole: 'everyone',
    },
  });

  return [{
    json: {
      success: true,
      post: {
        id: publishResp?.id || draftId,
        title,
        url: postUrl,
        slug: slug || null,
        coverImage: coverUrl || null,
        authorId: authorId || null,
      },
      note: note?.id ? { id: note.id, url: `https://${host}/notes/note/${note.id}` } : null,
      logs,
    },
  }];
} catch (e) {
  log('Error', { err: e.message, stack: e.stack });
  return [{ json: { success: false, error: e.message, logs } }];
}
