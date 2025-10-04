/**
 * 🚀 Quick Test - Just pass your credentials and GO!
 */

import { SubstackClient } from './src'

async function quickTest() {
  console.log('🚀 Quick Share Center Test')
  console.log('═'.repeat(60))
  
  // 📝 Edit these values with your credentials:
  const API_KEY = process.env.SUBSTACK_API_KEY || 'PASTE_YOUR_CONNECT_SID_COOKIE_HERE'
  const HOSTNAME = process.env.SUBSTACK_HOSTNAME || 'whiskeyandflowers.substack.com'
  const SECTION_ID = parseInt(process.env.SUBSTACK_DEFAULT_SECTION_ID || '0')
  
  if (API_KEY === 'PASTE_YOUR_CONNECT_SID_COOKIE_HERE') {
    console.log('❌ Please edit QUICK_TEST.ts and add your connect.sid cookie!')
    console.log()
    console.log('How to get it:')
    console.log('1. Open', HOSTNAME, 'in your browser')
    console.log('2. Press F12 → Application → Cookies')
    console.log('3. Copy the value of "connect.sid"')
    console.log('4. Paste it in QUICK_TEST.ts (line 11)')
    console.log()
    process.exit(1)
  }

  try {
    const client = new SubstackClient({
      apiKey: API_KEY,
      hostname: HOSTNAME,
      defaultSectionId: SECTION_ID
    })
    
    const profile = await client.ownProfile()
    console.log(`✅ Authenticated as: ${profile.name}`)
    console.log()
    
    console.log('📝 Publishing test post with share note...')
    const { post, note } = await profile.publishWithNote(
      profile.newPost()
        .setTitle('🧪 Quick Test: Share Center')
        .setSubtitle('Testing the publishWithNote() method')
        .setBodyHtml(`
          <h2>✨ It Works!</h2>
          <p>This post was created via the API using the new <code>publishWithNote()</code> method.</p>
          <p>The share note includes the special <code>showWelcomeOnShare=true</code> parameter!</p>
        `)
        .setTags(['Test']),
      '🎉 Testing Share Center integration! Check it out!'
    )
    
    console.log('✅ SUCCESS!')
    console.log('─'.repeat(60))
    console.log(`Post ID: ${post.id}`)
    console.log(`Post Title: ${post.title}`)
    
    // Construct URL if not in response
    const postUrl = post.canonical_url || `https://${HOSTNAME}/p/${post.slug}`
    console.log(`Post URL: ${postUrl}`)
    console.log(`Post Slug: ${post.slug || 'N/A'}`)
    console.log(`Published: ${post.is_published}`)
    
    if (note) {
      console.log()
      console.log(`✅ NOTE PUBLISHED!`)
      console.log(`Note ID: ${note.id}`)
      console.log(`✨ Note includes showWelcomeOnShare=true parameter!`)
      console.log(`🔗 https://${HOSTNAME}/notes/note/${note.id}`)
    } else {
      console.log()
      console.log(`⚠️  No note created (canonical_url was: ${post.canonical_url})`)
    }
    console.log()
    
  } catch (error) {
    console.error('❌ Error:', (error as Error).message)
    console.error()
    console.error('Troubleshooting:')
    console.error('- Check that your connect.sid cookie is valid')
    console.error('- Make sure you\'re logged in to Substack')
    console.error('- Try getting a fresh cookie from your browser')
    throw error
  }
}

quickTest().catch(() => process.exit(1))

