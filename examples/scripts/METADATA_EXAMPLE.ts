/**
 * Example: Creating Posts with Full Metadata Support
 * 
 * Based on Python implementation in drafts.py + sample post data
 * Now includes: SEO, social media, comments, sections, and advanced settings
 */

import { SubstackClient } from './src/index'

async function createPostWithFullMetadata() {
  const client = new SubstackClient({
    apiKey: process.env.SUBSTACK_API_KEY!,
    hostname: 'whiskeyandflowers.substack.com'
  })
  
  const profile = await client.ownProfile()
  console.log(`✅ Connected as: ${profile.name}\n`)

  // 🎨 Create a post with ALL metadata options
  console.log('📝 Creating post with full metadata...')
  const post = await profile.newPost()
    // Basic content
    .setTitle('Complete Metadata Example')
    .setSubtitle('Showing all available metadata fields')
    .setBodyHtml(`
      <h2>Introduction</h2>
      <p>This post demonstrates every metadata field available in the API.</p>
      
      <h3>What's Included</h3>
      <ul>
        <li>SEO optimization (title, description)</li>
        <li>Social media preview customization</li>
        <li>Comment permissions and sorting</li>
        <li>Section assignment</li>
        <li>Advanced settings</li>
      </ul>
    `)
    .setType('newsletter')
    .setAudience('everyone')
    
    // SEO - appears in search engines
    .setDescription('Standard description for the post')
    .setSearchEngineTitle('SEO-Optimized Title for Google')
    .setSearchEngineDescription('This appears in search results instead of the standard description')
    
    // Social Media - appears when shared on Twitter/Facebook
    .setSocialTitle('Custom Social Media Title 🚀')
    .setCoverImage('https://example.com/cover-image.jpg')
    
    // Section - categorize your posts
    .setSection(194500)  // Whiskey & Flowers 🌸
    
    // Comments
    .setCommentPermissions('everyone')  // 'everyone' | 'paid' | 'founding' | 'no_one'
    .setCommentSort('best_first')       // 'best_first' | 'newest_first' | 'oldest_first'
    
    // Advanced Settings
    .setExplicit(false)        // Mark content as explicit
    .setHideFromFeed(false)    // Hide from public feed
    
    // Tags
    .addTag('metadata')
    .addTag('example')
    .addTag('api')
    
    .createDraft()

  console.log(`\n✅ Draft created with full metadata!`)
  console.log(`   ID: ${post.id}`)
  console.log(`   Title: ${post.title}`)
  console.log(`   Edit URL: https://whiskeyandflowers.substack.com/publish/post/${post.id}`)
  
  console.log(`\n📋 Metadata Applied:`)
  console.log(`   ✅ SEO Title: Custom for search engines`)
  console.log(`   ✅ SEO Description: Custom for search results`)
  console.log(`   ✅ Social Title: Custom for social media`)
  console.log(`   ✅ Cover Image: Set`)
  console.log(`   ✅ Section: Whiskey & Flowers 🌸 (194500)`)
  console.log(`   ✅ Comments: Everyone can comment, best first`)
  console.log(`   ✅ Tags: metadata, example, api`)
  console.log(`   ✅ Content Rating: Not explicit`)
  console.log(`   ✅ Feed Visibility: Visible`)

  console.log(`\n💡 All metadata from Python implementation is now supported!`)
}

// Example 2: Minimal metadata (defaults)
async function createMinimalPost() {
  const client = new SubstackClient({
    apiKey: process.env.SUBSTACK_API_KEY!,
    hostname: 'whiskeyandflowers.substack.com'
  })
  
  const profile = await client.ownProfile()

  // Just title and content - everything else uses defaults
  const post = await profile.newPost()
    .setTitle('Minimal Post')
    .setBodyHtml('<p>Just the basics!</p>')
    .createDraft()

  console.log(`\n✅ Minimal post created: ${post.id}`)
  console.log(`   Defaults applied:`)
  console.log(`   - Type: newsletter`)
  console.log(`   - Audience: everyone`)
  console.log(`   - Section: Whiskey & Flowers 🌸 (194500)`)
  console.log(`   - Comments: everyone, best_first`)
  console.log(`   - Editor: v2 (modern)`)
}

// Run the examples
console.log('🚀 Example 1: Full Metadata\n')
createPostWithFullMetadata()
  .then(() => {
    console.log('\n\n🚀 Example 2: Minimal Metadata\n')
    return createMinimalPost()
  })
  .catch(console.error)

/**
 * Available Metadata Fields:
 * 
 * BASIC:
 * - title, subtitle, body_html, type, audience
 * 
 * SEO & SOCIAL:
 * - description                    // Standard description
 * - search_engine_title            // Custom title for Google
 * - search_engine_description      // Custom description for search results
 * - social_title                   // Custom title for Twitter/Facebook
 * - cover_image                    // Post cover image URL
 * 
 * ORGANIZATION:
 * - section_id                     // Post section (default: 194500)
 * - postTags                       // Array of tags
 * 
 * COMMENTS:
 * - write_comment_permissions      // 'everyone' | 'paid' | 'founding' | 'no_one'
 * - default_comment_sort           // 'best_first' | 'newest_first' | 'oldest_first'
 * 
 * ADVANCED:
 * - explicit                       // Mark as explicit content (default: false)
 * - hide_from_feed                 // Hide from public feed (default: false)
 * - editor_v2                      // Use modern editor (default: true)
 * - meter_type                     // Paywall type (default: null)
 * - should_send_free_preview       // Send preview to free subscribers
 * - free_unlock_required           // Require unlock for free content
 * - exempt_from_archive_paywall    // Exempt from archive paywall
 * - show_guest_bios                // Show guest author bios
 * 
 * All fields verified against:
 * - drafts.py (Python implementation)
 * - samples/api/v1/posts/by-id/167180194 (real post data)
 */

