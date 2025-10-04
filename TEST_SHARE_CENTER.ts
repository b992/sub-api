/**
 * 🍮 PUDDING TEST - Share Center Integration
 * 
 * Let's create a post, publish it, and share it as a note!
 */

import { SubstackClient } from './src'

async function testShareCenter() {
  console.log('🍮 PUDDING TEST - Share Center Integration')
  console.log('═'.repeat(60))
  console.log()

  // Initialize client
  const client = new SubstackClient({
    apiKey: process.env.SUBSTACK_API_KEY!,
    hostname: process.env.SUBSTACK_HOSTNAME || 'whiskeyandflowers.substack.com',
    defaultSectionId: parseInt(process.env.SUBSTACK_DEFAULT_SECTION_ID || '0')
  })

  try {
    // Authenticate
    const profile = await client.ownProfile()
    console.log(`✅ Authenticated as: ${profile.name} (@${profile.slug})`)
    console.log()

    // Create and publish post with share note
    console.log('📝 Creating post with full metadata...')
    
    const { post, note } = await profile.publishWithNote(
      profile.newPost()
        .setTitle('🧪 Test: Share Center Integration')
        .setSubtitle('Testing automated post publishing with share notes')
        .setBodyHtml(`
          <h2>🎯 Testing Share Center Integration</h2>
          <p>This post was created via the API to test the new <code>publishWithNote()</code> method.</p>
          
          <h3>What We're Testing:</h3>
          <ul>
            <li><strong>Post Publishing:</strong> Full metadata support</li>
            <li><strong>Share Note:</strong> Automatic note with post link</li>
            <li><strong>Special Parameter:</strong> showWelcomeOnShare=true</li>
            <li><strong>Automation:</strong> One command, complete workflow</li>
          </ul>
          
          <h3>🚀 Features Tested:</h3>
          <ol>
            <li>Rich HTML content with formatting</li>
            <li>Cover images and metadata</li>
            <li>Tags for discoverability</li>
            <li>SEO optimization</li>
            <li>Automatic promotional note</li>
          </ol>
          
          <blockquote>
            <p>"Testing is the breakfast of champions!" - Anonymous Developer</p>
          </blockquote>
          
          <p><em>If you can read this, the API is working perfectly! 🎉</em></p>
        `)
        .setCoverImage('https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=1200')
        .setDescription('Testing automated post publishing with share notes via the Substack API')
        .setTags(['Test', 'API', 'Automation', 'Share Center'])
        .setSearchEngineTitle('Test: Share Center Integration | API Test')
        .setSearchEngineDescription('Testing the complete Share Center workflow including post publishing and automatic note sharing')
        .setSocialTitle('🧪 Testing Share Center Integration')
        .setAudience('everyone')
        .setCommentPermissions('everyone'),
      
      // Share note text
      '🎉 Just published a new test article! Check out the Share Center integration in action. Let me know if you can see this! 👇'
    )

    console.log()
    console.log('✅ POST PUBLISHED!')
    console.log('─'.repeat(60))
    console.log(`📄 Post ID: ${post.id}`)
    console.log(`📝 Title: ${post.title}`)
    console.log(`🔗 URL: ${post.canonical_url}`)
    console.log(`✔️  Published: ${post.is_published}`)
    console.log(`📅 Date: ${post.post_date}`)
    
    if (post.slug) {
      console.log(`🔖 Slug: ${post.slug}`)
    }
    
    console.log()
    
    if (note) {
      console.log('✅ SHARE NOTE PUBLISHED!')
      console.log('─'.repeat(60))
      console.log(`📝 Note ID: ${note.id}`)
      console.log(`🔗 Note URL: https://${process.env.SUBSTACK_HOSTNAME}/notes/note/${note.id}`)
      console.log(`✨ The note includes the special showWelcomeOnShare=true parameter!`)
      console.log(`🎯 Your followers will see this in their feed`)
    } else {
      console.log('⚠️  No share note created (optional feature)')
    }

    console.log()
    console.log('═'.repeat(60))
    console.log('🎉 PUDDING TEST COMPLETE!')
    console.log('═'.repeat(60))
    console.log()
    console.log('🔍 What to verify:')
    console.log('   1. Visit the post URL above')
    console.log('   2. Check your publication feed for the note')
    console.log('   3. Click the note link to verify the welcome parameter')
    console.log('   4. Confirm all metadata appears correctly')
    console.log()

    return { post, note }

  } catch (error) {
    console.error()
    console.error('❌ TEST FAILED!')
    console.error('─'.repeat(60))
    console.error('Error:', (error as Error).message)
    if ((error as any).response) {
      console.error('Response:', (error as any).response)
    }
    console.error()
    throw error
  }
}

// Run the test
if (require.main === module) {
  console.log()
  testShareCenter()
    .then(() => {
      console.log('✨ Success! Check your Substack publication.')
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 Fatal error during test')
      process.exit(1)
    })
}

export { testShareCenter }

