/**
 * Comprehensive Post Publishing Test
 * 
 * Tests all article posting capabilities including:
 * - Title, subtitle, body HTML
 * - Cover image
 * - SEO metadata
 * - Social media metadata
 * - Tags
 * - Section assignment
 * - Comment permissions
 * - Publishing workflow
 */

import { SubstackClient } from './src'

async function testFullPostPublishing() {
  console.log('🚀 Starting Comprehensive Post Publishing Test\n')

  // Initialize client
  const client = new SubstackClient({
    email: process.env.SUBSTACK_EMAIL!,
    password: process.env.SUBSTACK_PASSWORD!,
    hostname: process.env.SUBSTACK_HOSTNAME || 'substack.com',
    defaultSectionId: parseInt(process.env.SUBSTACK_SECTION_ID || '0')
  })

  try {
    // Get authenticated profile
    const profile = await client.ownProfile()
    console.log(`✅ Authenticated as: ${profile.name} (@${profile.slug})\n`)

    // Example 1: Create a rich article with all metadata
    console.log('📝 Example 1: Creating article with full metadata...')
    
    const richArticle = await profile.newPost()
      // Basic content
      .setTitle('The Complete Guide to AI-Powered Writing')
      .setSubtitle('How artificial intelligence is revolutionizing content creation')
      
      // Body content with formatting
      .setBodyHtml(`
        <h2>Introduction</h2>
        <p>Artificial intelligence has transformed the way we approach writing and content creation. In this comprehensive guide, we'll explore the tools, techniques, and best practices for leveraging AI in your writing workflow.</p>
        
        <h2>Key Benefits</h2>
        <ul>
          <li><strong>Speed:</strong> Draft content 10x faster</li>
          <li><strong>Quality:</strong> Improve grammar and clarity</li>
          <li><strong>Creativity:</strong> Overcome writer's block</li>
          <li><strong>Research:</strong> Quickly gather and synthesize information</li>
        </ul>
        
        <h2>Getting Started</h2>
        <p>The first step in AI-powered writing is choosing the right tools for your needs. Whether you're writing blog posts, newsletters, or technical documentation, there's an AI assistant designed to help.</p>
        
        <blockquote>
          <p>"AI doesn't replace human creativity—it amplifies it."</p>
        </blockquote>
        
        <h2>Best Practices</h2>
        <p>Here are the essential guidelines for effective AI-assisted writing:</p>
        <ol>
          <li>Always review and edit AI-generated content</li>
          <li>Use AI for brainstorming and outlining</li>
          <li>Maintain your unique voice and perspective</li>
          <li>Fact-check all claims and citations</li>
          <li>Combine AI efficiency with human judgment</li>
        </ol>
        
        <h2>Conclusion</h2>
        <p>AI-powered writing tools are not about replacing human writers—they're about empowering us to do our best work more efficiently. By understanding how to leverage these tools effectively, you can dramatically improve both the quality and quantity of your content.</p>
      `)
      
      // Metadata
      .setDescription('Learn how to leverage AI tools for better, faster content creation. A complete guide with practical tips and best practices.')
      
      // Cover image (you can use an actual URL here)
      .setCoverImage('https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200')
      
      // Tags
      .setTags(['AI', 'Writing', 'Content Creation', 'Productivity', 'Technology'])
      
      // SEO optimization
      .setSearchEngineTitle('Complete Guide to AI Writing Tools | Best Practices 2025')
      .setSearchEngineDescription('Master AI-powered writing with this comprehensive guide. Learn techniques, tools, and best practices for creating better content faster.')
      
      // Social media
      .setSocialTitle('🤖 The Complete Guide to AI-Powered Writing')
      
      // Settings
      .setAudience('everyone')
      .setType('newsletter')
      .setCommentPermissions('everyone')
      .setCommentSort('best_first')
      
      // Create as draft first (not published)
      .createDraft()

    console.log(`✅ Draft created successfully!`)
    console.log(`   Post ID: ${richArticle.id}`)
    console.log(`   Title: ${richArticle.title}`)
    console.log(`   Slug: ${richArticle.slug}\n`)

    // Example 2: Create and publish immediately
    console.log('📰 Example 2: Creating and publishing in one step...')
    
    const publishedArticle = await profile.newPost()
      .setTitle('Quick Tip: 5 Minute Productivity Hack')
      .setSubtitle('A simple technique that actually works')
      .setBodyHtml(`
        <p>Here's a productivity technique I've been using for the past month that has genuinely made a difference:</p>
        
        <h3>The 5-Minute Rule</h3>
        <p>If a task takes less than 5 minutes, do it <em>immediately</em>. Don't add it to your to-do list, don't schedule it for later—just do it now.</p>
        
        <p><strong>Why it works:</strong></p>
        <ul>
          <li>Reduces mental clutter</li>
          <li>Prevents small tasks from piling up</li>
          <li>Creates momentum</li>
          <li>Gives quick wins throughout the day</li>
        </ul>
        
        <p>Try it for a week and see the difference!</p>
      `)
      .setDescription('A simple 5-minute rule that can transform your productivity')
      .addTag('Productivity')
      .addTag('Life Hacks')
      .setAudience('everyone')
      .publish() // Publish immediately!

    console.log(`✅ Article published successfully!`)
    console.log(`   Post ID: ${publishedArticle.id}`)
    console.log(`   Title: ${publishedArticle.title}`)
    console.log(`   Published: ${publishedArticle.is_published}`)
    console.log(`   URL: ${publishedArticle.canonical_url}\n`)

    // Return the published article for further testing
    return publishedArticle

  } catch (error) {
    console.error('❌ Test failed:', error)
    throw error
  }
}

/**
 * Test updating an existing draft
 */
async function testUpdateDraft(client: SubstackClient, draftId: number) {
  console.log(`\n📝 Testing draft update for ID: ${draftId}`)
  
  const post = await client.postForId(draftId)
  
  const updated = await post.update({
    title: 'Updated: ' + post.title,
    subtitle: 'This has been updated!',
    cover_image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=1200'
  })
  
  console.log(`✅ Draft updated:`, updated.title)
  return updated
}

/**
 * Test image upload for cover images
 */
async function testCoverImageUpload() {
  console.log('\n🖼️ Testing cover image integration...')
  
  // You can use any image URL from:
  // - Unsplash (https://unsplash.com)
  // - Your own hosted images
  // - Previously uploaded Substack images
  
  const imageUrls = [
    'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200', // Writing
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1200', // Technology
    'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=1200', // Productivity
  ]
  
  console.log('📸 Available image URLs:', imageUrls.length)
  console.log('✅ Use .setCoverImage(url) in PostBuilder')
}

// Main execution
async function main() {
  console.log('═'.repeat(60))
  console.log('  COMPREHENSIVE POST PUBLISHING TEST')
  console.log('═'.repeat(60) + '\n')

  // Run the test
  const publishedArticle = await testFullPostPublishing()
  
  // Show the published article details
  console.log('\n' + '═'.repeat(60))
  console.log('  PUBLISHED ARTICLE DETAILS')
  console.log('═'.repeat(60))
  console.log(`Title: ${publishedArticle.title}`)
  console.log(`Subtitle: ${publishedArticle.subtitle}`)
  console.log(`URL: ${publishedArticle.canonical_url}`)
  console.log(`Post ID: ${publishedArticle.id}`)
  console.log(`Slug: ${publishedArticle.slug}`)
  console.log(`Published: ${publishedArticle.is_published}`)
  console.log(`Created: ${publishedArticle.createdAt}`)
  console.log(`Tags: ${publishedArticle.postTags?.join(', ') || 'None'}`)
  console.log(`Cover Image: ${publishedArticle.coverImage || 'None'}`)
  console.log('\n✨ Test completed successfully!')
  
  return publishedArticle
}

// Export for use in other scripts
export { testFullPostPublishing, testUpdateDraft, testCoverImageUpload }

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
}

