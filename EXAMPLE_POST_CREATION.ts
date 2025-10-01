/**
 * Example: Creating and Publishing Substack Posts
 * 
 * Current Status: Draft creation works perfectly ✅
 *                 API publishing partially working ⚠️ (use UI for now)
 * 
 * See PUBLISH_API_STATUS.md for full details
 */

import { SubstackClient } from './src/index'

async function createAndPublishPost() {
  // Initialize client
  const client = new SubstackClient({
    apiKey: process.env.SUBSTACK_API_KEY!,
    hostname: 'whiskeyandflowers.substack.com'
  })
  
  const profile = await client.ownProfile()
  console.log(`✅ Connected as: ${profile.name}\n`)

  // ✅ METHOD 1: Using the fluent PostBuilder API
  console.log('📝 Creating post with builder...')
  const draft = await profile.newPost()
    .setTitle('My Amazing Post')
    .setSubtitle('A journey into the API')
    .setBodyHtml(`
      <h2>Introduction</h2>
      <p>This post was created entirely through the Substack API!</p>
      
      <h2>What Works</h2>
      <ul>
        <li>Full HTML formatting support</li>
        <li>Headings, paragraphs, lists</li>
        <li>Cover images and metadata</li>
        <li>Section assignment</li>
      </ul>
      
      <h3>Perfect Rendering</h3>
      <p>The content renders identically to manually created posts.</p>
    `)
    .setType('newsletter')
    .setAudience('everyone')
    .setDescription('A comprehensive guide to using the Substack API')
    .addTag('api')
    .addTag('tutorial')
    .createDraft()

  console.log(`✅ Draft created!`)
  console.log(`   ID: ${draft.id}`)
  console.log(`   Title: ${draft.title}`)
  console.log(`   Slug: ${draft.slug}`)
  console.log(`   Edit URL: https://whiskeyandflowers.substack.com/publish/post/${draft.id}\n`)

  // ✅ METHOD 2: Using createPost directly
  console.log('📝 Creating another post directly...')
  const anotherDraft = await profile.createPost({
    title: 'Direct Creation Example',
    subtitle: 'No builder, direct call',
    body_html: '<h2>Simple and Direct</h2><p>Sometimes you just want to create a post directly.</p>',
    type: 'newsletter',
    audience: 'everyone',
    description: 'Example of direct post creation',
    section_id: 194500  // Whiskey & Flowers 🌸 (default)
  })

  console.log(`✅ Another draft created!`)
  console.log(`   ID: ${anotherDraft.id}`)
  console.log(`   Edit URL: https://whiskeyandflowers.substack.com/publish/post/${anotherDraft.id}\n`)

  // ⚠️ PUBLISHING: Currently needs manual step
  console.log('📋 To publish these drafts:')
  console.log('   1. Click the edit URLs above')
  console.log('   2. Review content (renders perfectly!)')
  console.log('   3. Click "Continue" → Select section → "Publish"')
  console.log('')
  console.log('   Or try API publish (may return 400):')
  
  try {
    const published = await draft.publish({
      section_id: 194500,  // Whiskey & Flowers 🌸
      send_email: false,   // Don\'t send email
      audience: 'everyone',
      comments_enabled: true
    })
    console.log(`   ✅ API publish worked! Post: ${published.slug}`)
  } catch (error) {
    console.log(`   ⚠️  API publish returned error (expected):`)
    console.log(`   ${(error as Error).message}`)
    console.log('')
    console.log(`   💡 Use the manual publish method above for now.`)
  }

  console.log('')
  console.log('✅ Done! Drafts created with perfect formatting.')
  console.log('   Default section: Whiskey & Flowers 🌸 (194500)')
}

// Run the example
createAndPublishPost().catch(console.error)

/**
 * OUTPUT EXAMPLE:
 * 
 * ✅ Connected as: Gabriel B.
 * 
 * 📝 Creating post with builder...
 * ✅ Draft created!
 *    ID: 174970123
 *    Title: My Amazing Post
 *    Slug: my-amazing-post
 *    Edit URL: https://whiskeyandflowers.substack.com/publish/post/174970123
 * 
 * 📝 Creating another post directly...
 * ✅ Another draft created!
 *    ID: 174970124
 *    Edit URL: https://whiskeyandflowers.substack.com/publish/post/174970124
 * 
 * 📋 To publish these drafts:
 *    1. Click the edit URLs above
 *    2. Review content (renders perfectly!)
 *    3. Click "Continue" → Select section → "Publish"
 * 
 *    Or try API publish (may return 400):
 *    ⚠️  API publish returned error (expected):
 *    Failed to publish post 174970123. The API publish endpoint needs investigation...
 * 
 *    💡 Use the manual publish method above for now.
 * 
 * ✅ Done! Drafts created with perfect formatting.
 *    Default section: Whiskey & Flowers 🌸 (194500)
 */


