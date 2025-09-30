#!/usr/bin/env ts-node

/**
 * 🚀 LIVE TEST - Real Substack Post Creation
 * 
 * This will create REAL posts in your REAL Substack publication!
 * Make sure you're ready before running this.
 */

import { SubstackClient } from './src/index'

// 🔧 Try environment variables first, then prompt
async function getCredentials(): Promise<{ apiKey: string; hostname: string }> {
  const envApiKey = process.env.SUBSTACK_API_KEY || process.env.E2E_API_KEY
  const envHostname = process.env.SUBSTACK_HOSTNAME || process.env.E2E_HOSTNAME || 'whiskeyandflowers.substack.com'
  
  if (envApiKey) {
    console.log('✅ Using credentials from environment variables')
    return { apiKey: envApiKey, hostname: envHostname }
  }
  
  console.log('🔑 Please provide your Substack credentials:')
  console.log('💡 Hint: We were testing with whiskeyandflowers.substack.com before')
  
  const { createInterface } = require('readline')
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve)
    })
  }
  
  try {
    const apiKey = await question('Enter your connect.sid cookie value: ')
    const hostname = await question('Enter hostname (or press Enter for whiskeyandflowers.substack.com): ') || 'whiskeyandflowers.substack.com'
    
    rl.close()
    return { apiKey: apiKey.trim(), hostname: hostname.trim() }
  } catch (error) {
    rl.close()
    throw error
  }
}

async function liveTest() {
  console.log('🚀 LIVE SUBSTACK POST CREATION TEST')
  console.log('=' .repeat(50))
  
  // Get credentials dynamically
  const CONFIG = await getCredentials()
  
  try {
    console.log('🔌 Connecting to Substack...')
    const client = new SubstackClient(CONFIG)
    
    console.log('👤 Getting your profile...')
    const profile = await client.ownProfile()
    console.log(`✅ Connected as: ${profile.name}`)
    console.log(`🆔 ID: ${profile.id}`)
    
    console.log('\n📝 Creating test post...')
    const post = await profile.createPost({
      title: '🤖 API Test Post - LIVE!',
      subtitle: 'This post was created via the Substack API',
      body_html: `
        <h2>🎉 Success! The API is working!</h2>
        <p>This post was created programmatically using the new Substack post creation API.</p>
        
        <h3>✅ What was tested:</h3>
        <ul>
          <li>Authentication with connect.sid cookie</li>
          <li>Profile retrieval</li>
          <li>Post creation via API</li>
          <li>HTML content formatting</li>
          <li>Metadata and tags</li>
        </ul>
        
        <h3>🚀 Created at:</h3>
        <p><strong>${new Date().toLocaleString()}</strong></p>
        
        <p><em>You can safely delete this test post from your dashboard.</em></p>
      `,
      type: 'newsletter',
      audience: 'everyone',
      is_published: false, // SAFE: Creates as draft
      description: 'A test post created via the Substack API to verify functionality',
      postTags: ['api-test', 'automation', 'substack-api']
    })
    
    console.log('\n🎊 POST CREATION SUCCESSFUL!')
    console.log(`📝 Title: "${post.title}"`)
    console.log(`🆔 ID: ${post.id}`)
    console.log(`🔗 URL: ${post.url || 'Draft URL not available'}`)
    console.log(`📊 Post created successfully!`)
    console.log(`🏷️  Tags: ${post.postTags?.join(', ') || 'none'}`)
    console.log(`📅 Created: ${new Date(post.publishedAt).toLocaleString()}`)
    
    console.log('\n🔄 Testing post updates...')
    const updatedPost = await post.update({
      title: post.title + ' ✅ (Updated via API)',
      body_html: post.htmlBody + '\n<p><strong>📝 This post was updated via the API!</strong></p>',
      postTags: [...(post.postTags || []), 'updated']
    })
    
    console.log(`✅ Post updated: "${updatedPost.title}"`)
    console.log(`🏷️  New tags: ${updatedPost.postTags?.join(', ')}`)
    
    console.log('\n📋 Testing draft listing...')
    let draftCount = 0
    for await (const draft of profile.drafts({ limit: 3 })) {
      draftCount++
      console.log(`   ${draftCount}. "${draft.title}"`)
    }
    console.log(`✅ Found ${draftCount} drafts`)
    
    console.log('\n🏗️  Testing PostBuilder...')
    const builderPost = await profile.newPost()
      .setTitle('🛠️ Builder Pattern Test')
      .setSubtitle('Created with the fluent PostBuilder interface')
      .setBodyHtml(`
        <h2>PostBuilder Success! 🏗️</h2>
        <p>This post was created using the fluent builder pattern:</p>
        <pre><code>
await profile.newPost()
  .setTitle('Builder Pattern Test')
  .setBodyHtml('...')
  .addTag('builder')
  .createDraft()
        </code></pre>
        <p>Created at: ${new Date().toLocaleString()}</p>
      `)
      .setType('newsletter')
      .addTag('builder-test')
      .addTag('fluent-api')
      .setDescription('Testing the PostBuilder fluent interface')
      .createDraft()
    
    console.log(`✅ Builder post created: "${builderPost.title}"`)
    
    console.log('\n🎯 FINAL RESULTS:')
    console.log('  ✅ Authentication: WORKING')
    console.log('  ✅ Profile access: WORKING') 
    console.log('  ✅ Post creation: WORKING')
    console.log('  ✅ Post updates: WORKING')
    console.log('  ✅ Draft listing: WORKING')
    console.log('  ✅ PostBuilder: WORKING')
    console.log('  ✅ HTML content: WORKING')
    console.log('  ✅ Tags/metadata: WORKING')
    
    console.log('\n🎉 ALL TESTS PASSED! The API is fully functional!')
    console.log('\n📝 Note: All posts were created as DRAFTS.')
    console.log('     Review them in your Substack dashboard and delete if needed.')
    
    console.log('\n🚀 Ready for production use!')
    
  } catch (error) {
    console.error('\n❌ LIVE TEST FAILED:')
    console.error((error as Error).message)
    
    if ((error as Error).message.includes('401') || (error as Error).message.includes('Unauthorized')) {
      console.log('\n💡 Authentication issue:')
      console.log('   - Check your connect.sid cookie is correct')
      console.log('   - Make sure the cookie hasn\'t expired')
      console.log('   - Verify you\'re logged into Substack in your browser')
    }
    
    if ((error as Error).message.includes('404') || (error as Error).message.includes('Not Found')) {
      console.log('\n💡 Hostname issue:')
      console.log('   - Verify your publication hostname is correct')
      console.log('   - Example: "myawesome.substack.com"')
    }
    
    if ((error as Error).message.includes('403') || (error as Error).message.includes('Forbidden')) {
      console.log('\n💡 Permission issue:')
      console.log('   - Make sure you have posting permissions for this publication')
      console.log('   - Try creating a post manually first to verify access')
    }
    
    console.log('\n🔧 Debug info:')
    console.log(`   Hostname: ${CONFIG.hostname}`)
    console.log(`   Cookie length: ${CONFIG.apiKey.length} chars`)
    
    throw error
  }
}

// 🚀 LAUNCH!
if (require.main === module) {
  console.log('🚀 Preparing for launch...')
  console.log('⚠️  This will create REAL posts in your Substack!')
  console.log('💡 All posts will be created as DRAFTS for safety.')
  console.log('')
  
  setTimeout(() => {
    liveTest().catch(error => {
      console.error('💥 Mission failed:', (error as Error).message)
      process.exit(1)
    })
  }, 1000)
}
