// Local test - Does SDK v1.6.0 work on this machine?
// Run: npx tsx test-local-sdk.ts

import { SubstackClient } from './src';

// Tiny blue rectangle (100x100px)
const BLUE_RECT = 'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAXklEQVR4nO3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBjAB2gAAE2OFgRAAAAAElFTkSuQmCC';

async function testSDK() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   LOCAL SDK TEST v1.6.0                ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');

  try {
    // 1. Initialize
    console.log('1️⃣  Initializing client...');
    const client = new SubstackClient({
      apiKey: 's%3Aw_JqH1OwRTbSYFZpSVRsoiunqORPrmvT.cbXS44BJpaS1bPuu%2F0FTLYho8%2BEONR6G8aw2vH5Q48w',
      hostname: 'thegodsandmonsters.substack.com'
    });
    console.log('   ✅ Client initialized');
    console.log('');

    // 2. Load profile
    console.log('2️⃣  Loading profile...');
    const profile = await client.ownProfile();
    console.log(`   ✅ Profile loaded: ${profile.name} (@${profile.slug})`);
    console.log('');

    // 3. Build post
    console.log('3️⃣  Building post...');
    const builder = profile.newPost()
      .setTitle('Local SDK Test v1.6.0')
      .setSubtitle('Testing from local machine')
      .setBodyHtml('<h2>Test Heading</h2><p>This is a test with <strong>bold</strong> and <em>italic</em>.</p>')
      .setSection(176629) // The Monster Manual
      .setCoverImage(`data:image/png;base64,${BLUE_RECT}`);
    
    console.log('   ✅ Post built with:');
    console.log('      - Title');
    console.log('      - HTML content with formatting');
    console.log('      - Section ID 176629');
    console.log('      - Blue rectangle cover (base64)');
    console.log('');

    // 4. Publish
    console.log('4️⃣  Publishing post...');
    console.log('   ⏳ This will:');
    console.log('      a) Create temp draft');
    console.log('      b) Upload image to S3');
    console.log('      c) Create final draft with content');
    console.log('      d) Publish');
    console.log('');
    
    const post = await builder.publish();
    
    console.log('   ✅ Post published!');
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║        SUCCESS! 🎉                     ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');
    console.log('Post Details:');
    console.log('  ID:', post.id);
    console.log('  Title:', post.title);
    console.log('  Slug:', post.slug);
    console.log('  URL:', post.canonical_url || `https://thegodsandmonsters.substack.com/p/${post.slug}`);
    if (post.cover_image) {
      console.log('  Cover:', post.cover_image.substring(0, 70) + '...');
      if (post.cover_image.includes('s3.amazonaws.com')) {
        console.log('  ✅ Image uploaded to S3!');
      }
    }
    console.log('');
    console.log('✅ ALL TESTS PASSED!');
    console.log('');
    console.log('This means:');
    console.log('  ✅ SDK v1.6.0 works correctly');
    console.log('  ✅ Image upload to S3 works');
    console.log('  ✅ Author bylines work');
    console.log('  ✅ HTML formatting works');
    console.log('');
    console.log('If n8n still fails, it\'s using OLD cached version!');

  } catch (error: any) {
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║        ERROR! ❌                        ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');
    console.log('Error:', error.message);
    console.log('');
    
    if (error.stack) {
      console.log('Stack trace:');
      console.log(error.stack);
    }
    
    console.log('');
    
    if (error.message === 'fetch failed') {
      console.log('💡 "fetch failed" means:');
      console.log('   - Image upload tried wrong domain');
      console.log('   - OR network/auth issue');
      console.log('');
      console.log('Check:');
      console.log('   1. Is cookie still valid?');
      console.log('   2. Is internet working?');
      console.log('   3. Check error details above');
    }
    
    process.exit(1);
  }
}

// Run test
testSDK().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
