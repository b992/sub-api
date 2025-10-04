// TEST_PUBLISH.ts - Test the publish API that we just discovered!
/**
 * SETUP:
 * 1. Get your connect.sid cookie from browser (see SETUP_CREDENTIALS.md)
 * 2. Set environment variable:
 *    export SUBSTACK_API_KEY="your-connect-sid-cookie-value"
 * 3. Run: npx ts-node TEST_PUBLISH.ts
 */
import { SubstackClient } from './src/index'

async function testPublish() {
  console.log('🧪 Testing Publish API Discovery!')
  console.log('='.repeat(60))

  // Check if required env vars are set
  if (!process.env.SUBSTACK_API_KEY || !process.env.SUBSTACK_HOSTNAME) {
    console.error('\n❌ Error: Required environment variables not set!')
    console.error('\nRequired variables:')
    console.error('  SUBSTACK_API_KEY - Your connect.sid cookie')
    console.error('  SUBSTACK_HOSTNAME - Your publication hostname')
    console.error('  SUBSTACK_DEFAULT_SECTION_ID - Default section (optional)')
    console.error('\nSee ENV_EXAMPLE.md for detailed setup instructions\n')
    console.error('Quick setup:')
    console.error('  export SUBSTACK_API_KEY="s%3Ayour-cookie-here"')
    console.error('  export SUBSTACK_HOSTNAME="yourpub.substack.com"')
    console.error('  export SUBSTACK_DEFAULT_SECTION_ID="162170"\n')
    process.exit(1)
  }

  // Initialize client with environment variables
  const client = new SubstackClient({
    apiKey: process.env.SUBSTACK_API_KEY,
    hostname: process.env.SUBSTACK_HOSTNAME,
    defaultSectionId: process.env.SUBSTACK_DEFAULT_SECTION_ID 
      ? parseInt(process.env.SUBSTACK_DEFAULT_SECTION_ID) 
      : undefined
  })

  console.log(`\nℹ️  Configuration:`)
  console.log(`   Hostname: ${process.env.SUBSTACK_HOSTNAME}`)
  console.log(`   Default Section: ${process.env.SUBSTACK_DEFAULT_SECTION_ID || 'Not set (must specify per-post)'}`)

  try {
    console.log('\n1️⃣ Getting own profile...')
    const profile = await client.ownProfile()
    console.log(`✅ Profile: ${profile.name}`)

    console.log('\n2️⃣ Creating AND publishing post (one-shot)...')
    console.log('   This does two API calls internally:')
    console.log('   1. POST /api/v1/drafts + PUT /api/v1/drafts/{id} (create + set content)')
    console.log('   2. POST /api/v1/drafts/{id}/publish with {"send": false}')
    
    const builder = profile.newPost()
      .setTitle('🎉 API Publish Test')
      .setSubtitle('Testing the newly discovered publish endpoint')
      .setBodyHtml(`
        <h2>We Did It!</h2>
        <p>This post was created and published entirely via API using the newly discovered publish endpoint:</p>
        <p><code>POST /api/v1/drafts/{id}/publish</code> with payload <code>{"send": false}</code></p>
        <p>The theory was correct - publishing is just a state flip! 🎯</p>
        <p><em>Default section ID was automatically applied from config!</em></p>
      `)
      .setDescription('Testing the API publish functionality discovered on Oct 3, 2025')
      .setSocialTitle('🚀 API Publishing Works!')
      .setSearchEngineTitle('API Publish Test - Substack API')
      .setAudience('everyone')
    
    // Section is auto-set from defaultSectionId in config!
    // But you can still override it: .setSection(999999)
    if (!process.env.SUBSTACK_DEFAULT_SECTION_ID) {
      // No default set, must specify manually
      builder.setSection(162170)  // Raw Thoughts
      console.log('   ⚠️  No default section configured, using 162170 (Raw Thoughts)')
    } else {
      console.log(`   ✅ Using default section from config: ${process.env.SUBSTACK_DEFAULT_SECTION_ID}`)
    }
    
    const published = await builder.publish()  // One-shot: creates draft then publishes

    console.log('✅ PUBLISHED SUCCESSFULLY!')
    console.log(`   Post ID: ${published.id}`)
    console.log(`   Title: ${published.title}`)
    console.log(`   URL: ${published.canonical_url}`)
    console.log(`   Is Published: ${published.is_published}`)

    console.log('\n🎉 SUCCESS! The publish API works!')
    console.log('=' .repeat(60))
    console.log('\nKey Discovery:')
    console.log('  • Payload is minimal: just {"send": boolean}')
    console.log('  • All metadata must be set in draft first')
    console.log('  • Publishing is just a state flip (draft → published)')
    console.log('\n✅ Full automation is now possible!')

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Stack:', error.stack)
    }
    process.exit(1)
  }
}

// Run the test
testPublish()
  .then(() => {
    console.log('\n✅ Test completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })

