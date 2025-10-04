/**
 * n8n Code Node: Publish Post with Image Upload Support
 * 
 * This handles the FULL workflow including image uploads:
 * 1. Upload base64 image to Substack (if provided)
 * 2. Get back S3 URL
 * 3. Publish post with that URL as cover image
 * 
 * INPUT: Base64 image OR URL for cover image
 * OUTPUT: Published post with all metadata
 */

const { SubstackClient } = require('@b992/substack-api');

// Get input data from previous node
const inputData = $input.first().json;

// Initialize Substack client
const client = new SubstackClient({
  apiKey: process.env.SUBSTACK_API_KEY,
  hostname: process.env.SUBSTACK_HOSTNAME,
  defaultSectionId: parseInt(process.env.SUBSTACK_DEFAULT_SECTION_ID || '0')
});

try {
  // Get authenticated profile
  const profile = await client.ownProfile();
  
  // === STEP 1: Handle Cover Image Upload (if base64 provided) ===
  let coverImageUrl = inputData.coverImage || '';
  
  // Check if coverImage is base64 (needs upload) or already a URL
  if (coverImageUrl && coverImageUrl.startsWith('data:image/')) {
    console.log('📤 Uploading base64 image to Substack...');
    
    // First, create a draft to get a post ID
    const tempDraft = await profile.newPost()
      .setTitle(inputData.title)
      .setBodyHtml('<p>temp</p>')
      .createDraft();
    
    // Upload the image with the post ID
    const imageUploadResponse = await fetch(`https://${process.env.SUBSTACK_HOSTNAME}/api/v1/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `connect.sid=${process.env.SUBSTACK_API_KEY}`
      },
      body: JSON.stringify({
        image: coverImageUrl,  // base64 string
        postId: tempDraft.id
      })
    });
    
    const imageData = await imageUploadResponse.json();
    
    // Extract the S3 URL from response
    if (imageData.url) {
      coverImageUrl = imageData.url;
      console.log('✅ Image uploaded:', coverImageUrl);
    } else {
      console.warn('⚠️  Image upload failed, proceeding without cover image');
      coverImageUrl = '';
    }
  }
  
  // === STEP 2: Build and Publish Post with All Metadata ===
  console.log('📝 Publishing post with metadata...');
  
  const postBuilder = profile.newPost()
    // === Basic Content ===
    .setTitle(inputData.title)
    .setSubtitle(inputData.subtitle || '')
    .setBodyHtml(inputData.content)
    
    // === Cover Image (now we have the S3 URL!) ===
    .setCoverImage(coverImageUrl)
    
    // === SEO Optimization ===
    .setDescription(inputData.seoDescription || inputData.description || '')
    .setSearchEngineTitle(inputData.seoTitle || inputData.title)
    .setSearchEngineDescription(inputData.seoDescription || inputData.description || '')
    
    // === Social Media ===
    .setSocialTitle(inputData.socialTitle || inputData.title)
    
    // === Organization ===
    .setTags(inputData.tags || [])
    
    // === Comment Settings ===
    .setCommentPermissions(inputData.commentPermissions || 'everyone')
    .setCommentSort(inputData.commentSort || 'best_first')
    
    // === Advanced Settings ===
    .setExplicit(inputData.explicit || false)
    .setHideFromFeed(inputData.hideFromFeed || false);
  
  // Override section if provided
  if (inputData.sectionId) {
    postBuilder.setSection(parseInt(inputData.sectionId));
  }
  
  // Publish the post
  const published = await postBuilder.publish();
  
  console.log('✅ Post published successfully!');
  
  // === STEP 3: Return Complete Response ===
  return [{
    json: {
      success: true,
      post: {
        id: published.id,
        title: published.title,
        subtitle: published.subtitle,
        slug: published.slug,
        url: published.canonical_url || `https://${process.env.SUBSTACK_HOSTNAME}/p/${published.slug}`,
        coverImage: published.cover_image,
        coverImageUploaded: inputData.coverImage && inputData.coverImage.startsWith('data:image/'),
        isPublished: published.is_published,
        postDate: published.post_date,
        description: published.description,
        tags: published.postTags || [],
        publicationId: published.publication_id
      },
      metadata: {
        publishedAt: new Date().toISOString(),
        hostname: process.env.SUBSTACK_HOSTNAME,
        imageWasUploaded: inputData.coverImage && inputData.coverImage.startsWith('data:image/')
      }
    }
  }];
  
} catch (error) {
  console.error('❌ Error:', error.message);
  
  // Return error details
  return [{
    json: {
      success: false,
      error: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      },
      input: {
        title: inputData.title,
        hadCoverImage: !!inputData.coverImage,
        coverImageType: inputData.coverImage ? 
          (inputData.coverImage.startsWith('data:image/') ? 'base64' : 'url') : 
          'none'
      }
    }
  }];
}

