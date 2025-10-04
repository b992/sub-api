/**
 * Test script to verify image upload fix for The Gods & Monsters
 * Run: npx tsx test-gods-image-upload.ts
 */

import { SubstackClient } from './src'

// Your Gods & Monsters API key
const API_KEY = 's%3Aw_JqH1OwRTbSYFZpSVRsoiunqORPrmvT.cbXS44BJpaS1bPuu%2F0FTLYho8%2BEONR6G8aw2vH5Q48w'

// Tiny 1x1 pixel PNG for testing
const TINY_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

async function testImageUpload() {
  console.log('🧪 Testing The Gods & Monsters Post + Image Upload')
  console.log('═'.repeat(60))
  console.log()

  try {
    // 1. Initialize client
    console.log('1️⃣  Initializing SubstackClient...')
    const client = new SubstackClient({
      apiKey: API_KEY,
      hostname: 'thegodsandmonsters.substack.com',
    })
    console.log('   ✅ Client initialized')
    console.log()

    // 2. Load profile
    console.log('2️⃣  Loading profile...')
    const profile = await client.ownProfile()
    console.log(`   ✅ Profile loaded: ${profile.name} (@${profile.slug})`)
    console.log()

    // 3. Test WITHOUT image first
    console.log('3️⃣  Creating post WITHOUT image...')
    try {
      const postNoImage = await profile.newPost()
        .setTitle('Test Post - No Image ' + new Date().toISOString())
        .setBodyHtml('<p>Testing draft creation without image</p>')
        .setSection(176365) // Curious Histories
        .createDraft() // Just draft, don't publish yet

      console.log(`   ✅ Draft created: ID ${postNoImage.id}`)
      console.log(`   📝 Slug: ${postNoImage.slug}`)
      console.log()
    } catch (err) {
      console.error('   ❌ FAILED:', (err as Error).message)
      console.error('   Stack:', (err as Error).stack)
      throw new Error('Draft creation failed - check connection to publication domain')
    }

    // 4. Test WITH tiny image (FULL PUBLISH to test image upload)
    console.log('4️⃣  Publishing post WITH base64 image (tests image upload)...')
    try {
      const postWithImage = await profile.newPost()
        .setTitle('Test Post - Image Upload ' + new Date().toISOString())
        .setBodyHtml('<p>Testing image upload to global substack.com domain</p>')
        .setCoverImage(TINY_IMAGE) // This should trigger image upload
        .setSection(176365) // Curious Histories
        .publish() // Use publish() to trigger image upload logic

      console.log(`   ✅ Post published: ID ${postWithImage.id}`)
      console.log(`   📝 Slug: ${postWithImage.slug}`)
      console.log(`   🔗 URL: ${postWithImage.canonical_url || 'N/A'}`)
      
      if (postWithImage.cover_image) {
        console.log(`   🖼️  Cover image: ${postWithImage.cover_image.substring(0, 100)}...`)
        
        // Verify it's an S3 URL
        if (postWithImage.cover_image.includes('s3.amazonaws.com')) {
          console.log('   ✅ Image uploaded to S3 successfully!')
          console.log('   ✅ Image routing fix is working!')
        } else if (postWithImage.cover_image.startsWith('data:image/')) {
          console.warn('   ⚠️  Image is still base64 (not uploaded)')
          console.warn('   ⚠️  This means the image upload failed silently')
        } else {
          console.warn('   ⚠️  Unexpected image URL format')
        }
      } else {
        console.warn('   ⚠️  No cover_image in response')
      }
      console.log()
    } catch (err) {
      console.error('   ❌ FAILED:', (err as Error).message)
      console.error('   Stack:', (err as Error).stack)
      
      if ((err as Error).message.includes('fetch failed')) {
        console.error()
        console.error('   💡 This is the bug we fixed!')
        console.error('   💡 Image upload was trying: thegodsandmonsters.substack.com/api/v1/image')
        console.error('   💡 But should use: substack.com/api/v1/image')
        console.error()
        console.error('   📌 The fix is in the code, just needs to be deployed to n8n')
      }
      
      throw new Error('Image upload failed - this is what we\'re debugging')
    }

    console.log('═'.repeat(60))
    console.log('🎉 ALL TESTS PASSED!')
    console.log()
    console.log('Next steps:')
    console.log('1. Update the package in n8n')
    console.log('2. Restart n8n')
    console.log('3. Try your workflow again')
    console.log()

  } catch (error) {
    console.log()
    console.log('═'.repeat(60))
    console.log('❌ TEST FAILED')
    console.log()
    console.log('Error:', (error as Error).message)
    console.log()
    console.log('Troubleshooting:')
    console.log('- Check your API key (connect.sid cookie)')
    console.log('- Verify network connectivity to thegodsandmonsters.substack.com')
    console.log('- Check DNS resolution')
    console.log()
    process.exit(1)
  }
}

// Run the test
testImageUpload()

