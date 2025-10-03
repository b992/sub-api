/**
 * HTTP Server wrapping the Substack Client API
 * 
 * FastAPI-style REST server that exposes the Substack client methods
 * via HTTP endpoints. Perfect for n8n integrations and remote access!
 */

import express, { Request, Response } from 'express'
import { SubstackClient } from '../src/index'

const app = express()
app.use(express.json())

// =============================================================================
// Configuration from Environment
// =============================================================================
const PORT = process.env.PORT || 3000
const API_KEY = process.env.SUBSTACK_API_KEY || ''
const HOSTNAME = process.env.SUBSTACK_HOSTNAME || ''
const DEFAULT_SECTION_ID = process.env.SUBSTACK_DEFAULT_SECTION_ID 
  ? parseInt(process.env.SUBSTACK_DEFAULT_SECTION_ID) 
  : undefined

// =============================================================================
// Client Initialization
// =============================================================================
let client: SubstackClient | null = null

function getClient(): SubstackClient {
  if (!client) {
    if (!API_KEY || !HOSTNAME) {
      throw new Error('SUBSTACK_API_KEY and SUBSTACK_HOSTNAME must be set')
    }
    client = new SubstackClient({
      apiKey: API_KEY,
      hostname: HOSTNAME,
      defaultSectionId: DEFAULT_SECTION_ID
    })
  }
  return client
}

// =============================================================================
// Health Check & Connectivity
// =============================================================================
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    configured: !!(API_KEY && HOSTNAME),
    hostname: HOSTNAME || 'not set',
    defaultSection: DEFAULT_SECTION_ID || 'not set'
  })
})

/**
 * GET /api/connectivity
 * 
 * Test API connectivity to Substack
 */
app.get('/api/connectivity', async (req: Request, res: Response) => {
  try {
    const isConnected = await getClient().testConnectivity()
    res.json({
      success: true,
      connected: isConnected
    })
  } catch (error) {
    res.status(500).json({ 
      error: (error as Error).message,
      connected: false
    })
  }
})

// =============================================================================
// POST ENDPOINTS
// =============================================================================

/**
 * POST /api/posts/publish
 * 
 * Publish a post (creates draft then publishes)
 * 
 * Body:
 * {
 *   "title": "Post Title",
 *   "content": "<p>HTML content</p>",
 *   "subtitle": "Optional subtitle",
 *   "description": "SEO description",
 *   "socialTitle": "Social media title",
 *   "section": 123456,  // Optional if default is set
 *   "sendEmail": false  // Optional, default false
 * }
 */
app.post('/api/posts/publish', async (req: Request, res: Response) => {
  try {
    const { title, content, subtitle, description, socialTitle, section, sendEmail } = req.body

    if (!title || !content) {
      return res.status(400).json({ 
        error: 'title and content are required' 
      })
    }

    const profile = await getClient().ownProfile()
    const builder = profile.newPost()
      .setTitle(title)
      .setBodyHtml(content)

    if (subtitle) builder.setSubtitle(subtitle)
    if (description) builder.setDescription(description)
    if (socialTitle) builder.setSocialTitle(socialTitle)
    if (section) builder.setSection(section)

    const published = await builder.publish()

    res.json({
      success: true,
      post: {
        id: published.id,
        title: published.title,
        url: published.canonical_url,
        isPublished: published.is_published
      }
    })
  } catch (error) {
    res.status(500).json({ 
      error: (error as Error).message 
    })
  }
})

/**
 * POST /api/posts/draft
 * 
 * Create a draft (not published)
 */
app.post('/api/posts/draft', async (req: Request, res: Response) => {
  try {
    const { title, content, subtitle, description, socialTitle, section } = req.body

    if (!title || !content) {
      return res.status(400).json({ 
        error: 'title and content are required' 
      })
    }

    const profile = await getClient().ownProfile()
    const builder = profile.newPost()
      .setTitle(title)
      .setBodyHtml(content)

    if (subtitle) builder.setSubtitle(subtitle)
    if (description) builder.setDescription(description)
    if (socialTitle) builder.setSocialTitle(socialTitle)
    if (section) builder.setSection(section)

    const draft = await builder.createDraft()

    res.json({
      success: true,
      draft: {
        id: draft.id,
        title: draft.title,
        isPublished: draft.is_published
      }
    })
  } catch (error) {
    res.status(500).json({ 
      error: (error as Error).message 
    })
  }
})

/**
 * GET /api/posts
 * 
 * List posts from authenticated user
 */
app.get('/api/posts', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10
    const profile = await getClient().ownProfile()
    
    const posts: any[] = []
    for await (const post of profile.posts({ limit })) {
      posts.push({
        id: post.id,
        title: post.title,
        subtitle: post.subtitle,
        body: post.truncatedBody,
        publishedAt: post.publishedAt
      })
    }

    res.json({
      success: true,
      count: posts.length,
      posts
    })
  } catch (error) {
    res.status(500).json({ 
      error: (error as Error).message 
    })
  }
})

/**
 * GET /api/posts/drafts
 * 
 * List all drafts
 */
app.get('/api/posts/drafts', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined
    const profile = await getClient().ownProfile()
    
    const drafts: any[] = []
    for await (const draft of profile.drafts({ limit })) {
      drafts.push({
        id: draft.id,
        title: draft.title,
        subtitle: draft.subtitle,
        publishedAt: draft.publishedAt
      })
    }

    res.json({
      success: true,
      count: drafts.length,
      drafts
    })
  } catch (error) {
    res.status(500).json({ 
      error: (error as Error).message 
    })
  }
})

/**
 * GET /api/posts/:id
 * 
 * Get a specific post by ID
 */
app.get('/api/posts/:id', async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id)
    if (!postId) {
      return res.status(400).json({ error: 'Invalid post ID' })
    }

    const post = await getClient().postForId(postId)
    
    res.json({
      success: true,
      post: {
        id: post.id,
        title: post.title,
        subtitle: post.subtitle,
        htmlBody: post.htmlBody,
        slug: post.slug,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        reactions: post.reactions,
        restacks: post.restacks,
        coverImage: post.coverImage,
        postTags: post.postTags
      }
    })
  } catch (error) {
    res.status(500).json({ 
      error: (error as Error).message 
    })
  }
})

/**
 * PUT /api/posts/:id
 * 
 * Update a post
 */
app.put('/api/posts/:id', async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id)
    if (!postId) {
      return res.status(400).json({ error: 'Invalid post ID' })
    }

    const { title, subtitle, body_html, audience, description, cover_image, postTags } = req.body

    // Get the post first to call update on it
    const post = await getClient().postForId(postId)
    const updatedPost = await post.update({
      title,
      subtitle,
      body_html,
      audience,
      description,
      cover_image,
      postTags
    })

    res.json({
      success: true,
      post: {
        id: updatedPost.id,
        title: updatedPost.title,
        subtitle: updatedPost.subtitle,
        htmlBody: updatedPost.htmlBody
      }
    })
  } catch (error) {
    res.status(500).json({ 
      error: (error as Error).message 
    })
  }
})

/**
 * POST /api/posts/:id/publish
 * 
 * Publish a draft post
 */
app.post('/api/posts/:id/publish', async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id)
    if (!postId) {
      return res.status(400).json({ error: 'Invalid post ID' })
    }

    const { sendEmail } = req.body

    // Get the post first to call publish on it
    const post = await getClient().postForId(postId)
    const publishedPost = await post.publish({ send_email: sendEmail })

    res.json({
      success: true,
      post: {
        id: publishedPost.id,
        title: publishedPost.title,
        slug: publishedPost.slug,
        publishedAt: publishedPost.publishedAt
      }
    })
  } catch (error) {
    res.status(500).json({ 
      error: (error as Error).message 
    })
  }
})

/**
 * GET /api/posts/:id/comments
 * 
 * Get comments for a post
 */
app.get('/api/posts/:id/comments', async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id)
    if (!postId) {
      return res.status(400).json({ error: 'Invalid post ID' })
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined
    const post = await getClient().postForId(postId)
    
    const comments: any[] = []
    for await (const comment of post.comments({ limit })) {
      comments.push({
        id: comment.id,
        body: comment.body,
        author: comment.author,
        createdAt: comment.createdAt,
        likesCount: comment.likesCount
      })
    }

    res.json({
      success: true,
      count: comments.length,
      comments
    })
  } catch (error) {
    res.status(500).json({ 
      error: (error as Error).message 
    })
  }
})

/**
 * DELETE /api/posts/:id
 * 
 * Delete a post or draft
 */
app.delete('/api/posts/:id', async (req: Request, res: Response) => {
  try {
    const postId = req.params.id
    if (!postId) {
      return res.status(400).json({ error: 'Invalid post ID' })
    }

    const profile = await getClient().ownProfile()
    const drafts = profile.drafts({ limit: 1000 })
    
    for await (const draft of drafts) {
      if (draft.id.toString() === postId) {
        await draft.delete()
        return res.json({ 
          success: true, 
          message: `Post ${postId} deleted` 
        })
      }
    }

    res.status(404).json({ error: 'Post not found' })
  } catch (error) {
    res.status(500).json({ 
      error: (error as Error).message 
    })
  }
})

// =============================================================================
// NOTE ENDPOINTS
// =============================================================================

/**
 * POST /api/notes/publish
 * 
 * Publish a note (microblog post) with optional link attachment
 * 
 * Body:
 * {
 *   "content": "Text content of the note",
 *   "linkUrl": "https://example.com"  // Optional link attachment
 * }
 * 
 * Note: Substack Notes API doesn't support inline images.
 * Images can only be shared as link attachments.
 */
app.post('/api/notes/publish', async (req: Request, res: Response) => {
  try {
    const { content, linkUrl } = req.body

    if (!content) {
      return res.status(400).json({ 
        error: 'content is required' 
      })
    }

    const profile = await getClient().ownProfile()
    
    // Use NoteWithLinkBuilder if link is provided, otherwise regular NoteBuilder
    const builder = linkUrl ? profile.newNoteWithLink(linkUrl) : profile.newNote()

    // Split content into paragraphs (if it has line breaks)
    const paragraphs = content.split('\n\n').filter((p: string) => p.trim())
    
    // Build the note by chaining paragraph builders
    let currentBuilder = builder.paragraph()
    
    paragraphs.forEach((para: string, index: number) => {
      currentBuilder = currentBuilder.text(para.trim())
      
      // If not the last paragraph, add spacing
      if (index < paragraphs.length - 1) {
        currentBuilder = currentBuilder.paragraph()
      }
    })

    const note = await currentBuilder.publish()

    res.json({
      success: true,
      note: {
        id: note.id,
        hasLink: !!linkUrl
      }
    })
  } catch (error) {
    res.status(500).json({ 
      error: (error as Error).message 
    })
  }
})

/**
 * GET /api/notes
 * 
 * List notes from authenticated user
 */
app.get('/api/notes', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10
    const profile = await getClient().ownProfile()
    
    const notes: any[] = []
    for await (const note of profile.notes({ limit })) {
      notes.push({
        id: note.id,
        body: note.body,
        publishedAt: note.publishedAt
      })
    }

    res.json({
      success: true,
      count: notes.length,
      notes
    })
  } catch (error) {
    res.status(500).json({ 
      error: (error as Error).message 
    })
  }
})

/**
 * GET /api/notes/:id
 * 
 * Get a specific note by ID
 */
app.get('/api/notes/:id', async (req: Request, res: Response) => {
  try {
    const noteId = parseInt(req.params.id)
    if (!noteId) {
      return res.status(400).json({ error: 'Invalid note ID' })
    }

    const note = await getClient().noteForId(noteId)
    
    res.json({
      success: true,
      note: {
        id: note.id,
        body: note.body,
        publishedAt: note.publishedAt
      }
    })
  } catch (error) {
    res.status(500).json({ 
      error: (error as Error).message 
    })
  }
})

// =============================================================================
// COMMENT ENDPOINTS
// =============================================================================

/**
 * GET /api/comments/:id
 * 
 * Get a specific comment by ID
 */
app.get('/api/comments/:id', async (req: Request, res: Response) => {
  try {
    const commentId = parseInt(req.params.id)
    if (!commentId) {
      return res.status(400).json({ error: 'Invalid comment ID' })
    }

    const comment = await getClient().commentForId(commentId)
    
    res.json({
      success: true,
      comment: {
        id: comment.id,
        body: comment.body,
        author: comment.author,
        createdAt: comment.createdAt,
        likesCount: comment.likesCount
      }
    })
  } catch (error) {
    res.status(500).json({ 
      error: (error as Error).message 
    })
  }
})

// =============================================================================
// PROFILE ENDPOINTS
// =============================================================================

/**
 * GET /api/profile
 * 
 * Get authenticated user's profile
 */
app.get('/api/profile', async (req: Request, res: Response) => {
  try {
    const profile = await getClient().ownProfile()

    res.json({
      success: true,
      profile: {
        id: profile.id,
        name: profile.name,
        slug: profile.slug,
        url: profile.url,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl
      }
    })
  } catch (error) {
    res.status(500).json({ 
      error: (error as Error).message 
    })
  }
})

/**
 * GET /api/profile/id/:id
 * 
 * Get profile by user ID
 */
app.get('/api/profile/id/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id)
    if (!userId) {
      return res.status(400).json({ error: 'Invalid user ID' })
    }

    const profile = await getClient().profileForId(userId)

    res.json({
      success: true,
      profile: {
        id: profile.id,
        name: profile.name,
        slug: profile.slug,
        url: profile.url,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl
      }
    })
  } catch (error) {
    res.status(500).json({ 
      error: (error as Error).message 
    })
  }
})

/**
 * GET /api/profile/slug/:slug
 * 
 * Get profile by slug/handle
 */
app.get('/api/profile/slug/:slug', async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug
    if (!slug) {
      return res.status(400).json({ error: 'Invalid slug' })
    }

    const profile = await getClient().profileForSlug(slug)

    res.json({
      success: true,
      profile: {
        id: profile.id,
        name: profile.name,
        slug: profile.slug,
        url: profile.url,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl
      }
    })
  } catch (error) {
    res.status(500).json({ 
      error: (error as Error).message 
    })
  }
})

/**
 * GET /api/profile/id/:id/posts
 * 
 * Get posts for a specific profile
 */
app.get('/api/profile/id/:id/posts', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id)
    if (!userId) {
      return res.status(400).json({ error: 'Invalid user ID' })
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10
    const profile = await getClient().profileForId(userId)
    
    const posts: any[] = []
    for await (const post of profile.posts({ limit })) {
      posts.push({
        id: post.id,
        title: post.title,
        subtitle: post.subtitle,
        body: post.truncatedBody,
        publishedAt: post.publishedAt
      })
    }

    res.json({
      success: true,
      count: posts.length,
      posts
    })
  } catch (error) {
    res.status(500).json({ 
      error: (error as Error).message 
    })
  }
})

/**
 * GET /api/profile/id/:id/notes
 * 
 * Get notes for a specific profile
 */
app.get('/api/profile/id/:id/notes', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id)
    if (!userId) {
      return res.status(400).json({ error: 'Invalid user ID' })
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10
    const profile = await getClient().profileForId(userId)
    
    const notes: any[] = []
    for await (const note of profile.notes({ limit })) {
      notes.push({
        id: note.id,
        body: note.body,
        publishedAt: note.publishedAt
      })
    }

    res.json({
      success: true,
      count: notes.length,
      notes
    })
  } catch (error) {
    res.status(500).json({ 
      error: (error as Error).message 
    })
  }
})

/**
 * GET /api/followees
 * 
 * Get users that the authenticated user follows
 */
app.get('/api/followees', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined
    const profile = await getClient().ownProfile()
    
    const followees: any[] = []
    for await (const followee of profile.followees({ limit })) {
      followees.push({
        id: followee.id,
        name: followee.name,
        slug: followee.slug,
        url: followee.url,
        bio: followee.bio,
        avatarUrl: followee.avatarUrl
      })
    }

    res.json({
      success: true,
      count: followees.length,
      followees
    })
  } catch (error) {
    res.status(500).json({ 
      error: (error as Error).message 
    })
  }
})

// =============================================================================
// Multi-Publication Support
// =============================================================================

/**
 * POST /api/dynamic/posts/publish
 * 
 * Publish to a specific publication (override default config)
 * 
 * Body:
 * {
 *   "hostname": "otherpub.substack.com",
 *   "apiKey": "s%3A...",
 *   "defaultSectionId": 123456,
 *   "title": "Post Title",
 *   "content": "<p>Content</p>"
 * }
 */
app.post('/api/dynamic/posts/publish', async (req: Request, res: Response) => {
  try {
    const { hostname, apiKey, defaultSectionId, title, content, subtitle, description } = req.body

    if (!hostname || !apiKey || !title || !content) {
      return res.status(400).json({ 
        error: 'hostname, apiKey, title, and content are required' 
      })
    }

    // Create a temporary client for this specific publication
    const dynamicClient = new SubstackClient({
      hostname,
      apiKey,
      defaultSectionId: defaultSectionId ? parseInt(defaultSectionId) : undefined
    })

    const profile = await dynamicClient.ownProfile()
    const builder = profile.newPost()
      .setTitle(title)
      .setBodyHtml(content)

    if (subtitle) builder.setSubtitle(subtitle)
    if (description) builder.setDescription(description)

    const published = await builder.publish()

    res.json({
      success: true,
      post: {
        id: published.id,
        title: published.title,
        url: published.canonical_url,
        isPublished: published.is_published
      }
    })
  } catch (error) {
    res.status(500).json({ 
      error: (error as Error).message 
    })
  }
})

// =============================================================================
// Error Handling
// =============================================================================
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// =============================================================================
// Start Server
// =============================================================================
app.listen(PORT, () => {
  console.log(`🚀 Substack API Server running on http://localhost:${PORT}`)
  console.log(`📝 Configuration:`)
  console.log(`   Hostname: ${HOSTNAME || '❌ Not set'}`)
  console.log(`   Default Section: ${DEFAULT_SECTION_ID || '❌ Not set'}`)
  console.log(`\n📚 Available Endpoints:`)
  console.log(`\n   Health & Connectivity:`)
  console.log(`   GET  /health - Health check`)
  console.log(`   GET  /api/connectivity - Test API connectivity`)
  console.log(`\n   Posts:`)
  console.log(`   GET  /api/posts - List posts from authenticated user`)
  console.log(`   GET  /api/posts/drafts - List drafts`)
  console.log(`   GET  /api/posts/:id - Get a specific post by ID`)
  console.log(`   POST /api/posts/publish - Publish a post`)
  console.log(`   POST /api/posts/draft - Create a draft`)
  console.log(`   POST /api/posts/:id/publish - Publish a draft post`)
  console.log(`   PUT  /api/posts/:id - Update a post`)
  console.log(`   DELETE /api/posts/:id - Delete a post`)
  console.log(`   GET  /api/posts/:id/comments - Get comments for a post`)
  console.log(`\n   Notes:`)
  console.log(`   GET  /api/notes - List notes from authenticated user`)
  console.log(`   GET  /api/notes/:id - Get a specific note by ID`)
  console.log(`   POST /api/notes/publish - Publish a note`)
  console.log(`\n   Comments:`)
  console.log(`   GET  /api/comments/:id - Get a specific comment by ID`)
  console.log(`\n   Profiles:`)
  console.log(`   GET  /api/profile - Get authenticated user's profile`)
  console.log(`   GET  /api/profile/id/:id - Get profile by user ID`)
  console.log(`   GET  /api/profile/slug/:slug - Get profile by slug/handle`)
  console.log(`   GET  /api/profile/id/:id/posts - Get posts for a profile`)
  console.log(`   GET  /api/profile/id/:id/notes - Get notes for a profile`)
  console.log(`   GET  /api/followees - Get users you follow`)
  console.log(`\n   Multi-Publication:`)
  console.log(`   POST /api/dynamic/posts/publish - Publish to any publication`)
  console.log(`\n🔑 Set environment variables to configure:`)
  console.log(`   SUBSTACK_API_KEY, SUBSTACK_HOSTNAME, SUBSTACK_DEFAULT_SECTION_ID`)
})

export default app

