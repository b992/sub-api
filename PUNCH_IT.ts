#!/usr/bin/env ts-node

/**
 * 🚀 PUNCH IT! - Real Substack Post Creation Test
 * Using the working credential system from samples
 */

import { createInterface } from 'readline'
import { SubstackClient } from './src/index'

async function getCredentials(): Promise<{ apiKey: string; hostname: string }> {
  const envApiKey = process.env.SUBSTACK_API_KEY || process.env.E2E_API_KEY
  const envHostname = process.env.SUBSTACK_HOSTNAME || process.env.E2E_HOSTNAME || 'whiskeyandflowers.substack.com'

  if (envApiKey) {
    console.log('✅ Using credentials from environment variables')
    return { apiKey: envApiKey, hostname: envHostname }
  }

  console.log('🔑 Please provide your Substack credentials:')
  console.log('💡 Hint: We were testing with whiskeyandflowers.substack.com before')
  
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

async function punchIt() {
  console.log('🚀 PUNCH IT! - Live Substack Post Creation Test')
  console.log('=' .repeat(50))

  try {
    const config = await getCredentials()
    console.log(`🔌 Connecting to ${config.hostname}...`)
    
    const client = new SubstackClient(config)
    const profile = await client.ownProfile()
    
    console.log(`✅ Connected as: ${profile.name}`)
    
    // Test 1: Create a post using createPost()
    console.log('\n📝 Creating test post with createPost()...')
    const post1 = await profile.createPost({
      title: '🚀 PUNCHED IT! API Test Post',
      subtitle: 'Successfully created via the Substack API',
      body_html: `
        <h2>🎉 SUCCESS! The API is working!</h2>
        <p>This post was created using the new Substack post creation API.</p>
        
        <h3>✅ What was tested:</h3>
        <ul>
          <li>Authentication with connect.sid cookie</li>
          <li>Profile retrieval</li>
          <li>Post creation via createPost()</li>
          <li>HTML content formatting</li>
          <li>Tags and metadata</li>
        </ul>
        
        <p><strong>Created at: ${new Date().toLocaleString()}</strong></p>
        <p><em>This is a draft - you can safely delete it from your dashboard.</em></p>
      `,
      type: 'newsletter',
      audience: 'everyone',
      is_published: false, // SAFE: Create as draft
      description: 'A test post created via the Substack API',
      postTags: ['api-test', 'punched-it', 'success']
    })

    console.log(`✅ Post created successfully!`)
    console.log(`   Title: "${post1.title}"`)
    console.log(`   ID: ${post1.id}`)
    console.log(`   Tags: ${post1.postTags?.join(', ') || 'none'}`)

    // Test 2: Create a post using PostBuilder
    console.log('\n🏗️ Creating test post with PostBuilder...')
    const post2 = await profile.newPost()
      .setTitle('🛠️ PostBuilder Success!')
      .setSubtitle('Created with the fluent builder interface')
      .setBodyHtml(`
        <h2>PostBuilder Works! 🏗️</h2>
        <p>This post was created using the fluent PostBuilder pattern:</p>
        
        <pre><code>await profile.newPost()
  .setTitle('PostBuilder Success!')
  .setBodyHtml('...')
  .addTag('builder')
  .createDraft()</code></pre>
  
        <p>Created at: ${new Date().toLocaleString()}</p>
      `)
      .setType('newsletter')
      .addTag('builder-test')
      .addTag('fluent-api')
      .addTag('success')
      .setDescription('Testing the PostBuilder fluent interface')
      .createDraft()

    console.log(`✅ Builder post created!`)
    console.log(`   Title: "${post2.title}"`)
    console.log(`   ID: ${post2.id}`)

    // Test 3: Update a post
    console.log('\n✏️ Testing post updates...')
    const updatedPost = await post1.update({
      title: post1.title + ' ✅ (Updated)',
      postTags: [...(post1.postTags || []), 'updated']
    })

    console.log(`✅ Post updated: "${updatedPost.title}"`)

    // Test 4: List drafts
    console.log('\n📋 Listing drafts...')
    let draftCount = 0
    for await (const draft of profile.drafts({ limit: 3 })) {
      draftCount++
      console.log(`   ${draftCount}. "${draft.title}" (ID: ${draft.id})`)
    }

    console.log(`\n🎊 MISSION ACCOMPLISHED!`)
    console.log(`✅ createPost(): WORKING`)
    console.log(`✅ PostBuilder: WORKING`)
    console.log(`✅ Post updates: WORKING`)
    console.log(`✅ Draft listing: WORKING`)
    console.log(`✅ Authentication: WORKING`)
    
    console.log(`\n📝 Created ${draftCount >= 2 ? 2 : draftCount} test posts as drafts`)
    console.log(`   Review them in your Substack dashboard`)
    console.log(`   Delete them when you're done testing`)
    
    console.log(`\n🚀 The Substack Post Creation API is LIVE and FUNCTIONAL!`)

  } catch (error) {
    console.error(`\n💥 MISSION FAILED:`)
    console.error((error as Error).message)
    
    if ((error as Error).message.includes('401')) {
      console.log(`\n💡 Authentication issue - check your connect.sid cookie`)
    }
    if ((error as Error).message.includes('404')) {
      console.log(`\n💡 Hostname issue - verify your publication URL`)
    }
    
    throw error
  }
}

// 🚀 LAUNCH SEQUENCE
if (require.main === module) {
  console.log('🚀 Initiating launch sequence...')
  console.log('⚠️  This will create REAL posts in your Substack!')
  console.log('💡 Posts will be created as DRAFTS for safety')
  console.log('')
  
  punchIt().catch(error => {
    console.error('💥 Launch failed:', (error as Error).message)
    process.exit(1)
  })
}
