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
// Health Check
// =============================================================================
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    configured: !!(API_KEY && HOSTNAME),
    hostname: HOSTNAME || 'not set',
    defaultSection: DEFAULT_SECTION_ID || 'not set'
  })
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

    const draft = await builder.saveDraft()

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
 * GET /api/posts/drafts
 * 
 * List all drafts
 */
app.get('/api/posts/drafts', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined
    const profile = await getClient().ownProfile()
    
    const drafts = []
    for await (const draft of profile.drafts({ limit })) {
      drafts.push({
        id: draft.id,
        title: draft.title,
        subtitle: draft.subtitle,
        publishedAt: draft.publishedAt,
        url: draft.url
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
 * DELETE /api/posts/:id
 * 
 * Delete a post or draft
 */
app.delete('/api/posts/:id', async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id)
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' })
    }

    const profile = await getClient().ownProfile()
    const drafts = profile.drafts({ limit: 1000 })
    
    for await (const draft of drafts) {
      if (draft.id === postId.toString()) {
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
 * Publish a note (microblog post)
 * 
 * Body:
 * {
 *   "content": "Text content of the note"
 * }
 */
app.post('/api/notes/publish', async (req: Request, res: Response) => {
  try {
    const { content } = req.body

    if (!content) {
      return res.status(400).json({ 
        error: 'content is required' 
      })
    }

    const profile = await getClient().ownProfile()
    const note = await profile.newNote()
      .paragraph()
      .text(content)
      .publish()

    res.json({
      success: true,
      note: {
        id: note.id
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
    
    const notes = []
    for await (const note of profile.notes({ limit })) {
      notes.push({
        id: note.id,
        body: note.body,
        likesCount: note.likesCount,
        publishedAt: note.publishedAt,
        author: note.author
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
        handle: profile.handle,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        followersCount: profile.followersCount
      }
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
  console.log(`   GET  /health - Health check`)
  console.log(`   GET  /api/profile - Get authenticated profile`)
  console.log(`   POST /api/posts/publish - Publish a post`)
  console.log(`   POST /api/posts/draft - Create a draft`)
  console.log(`   GET  /api/posts/drafts - List drafts`)
  console.log(`   DELETE /api/posts/:id - Delete a post`)
  console.log(`   POST /api/notes/publish - Publish a note`)
  console.log(`   GET  /api/notes - List notes`)
  console.log(`   POST /api/dynamic/posts/publish - Publish to any publication`)
  console.log(`\n🔑 Set environment variables to configure:`)
  console.log(`   SUBSTACK_API_KEY, SUBSTACK_HOSTNAME, SUBSTACK_DEFAULT_SECTION_ID`)
})

export default app

