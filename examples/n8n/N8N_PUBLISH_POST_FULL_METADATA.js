/**
 * n8n Code Node: Publish Post with Full Metadata
 * 
 * This code publishes a post to Substack with complete metadata:
 * - SEO optimization (title, description)
 * - Social media (title, cover image)
 * - Tags and categories
 * - Comment settings
 * - Section assignment
 * 
 * INPUT: Expects data from previous node with post content and metadata
 * OUTPUT: Returns published post details with URLs
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
  
  // Build and publish post with full metadata
  const postBuilder = profile.newPost()
    // === Basic Content ===
    .setTitle(inputData.title)
    .setSubtitle(inputData.subtitle || '')
    .setBodyHtml(inputData.content)
    
    // === SEO Optimization ===
    .setDescription(inputData.seoDescription || inputData.description || '')
    .setSearchEngineTitle(inputData.seoTitle || inputData.title)
    .setSearchEngineDescription(inputData.seoDescription || inputData.description || '')
    
    // === Social Media ===
    .setSocialTitle(inputData.socialTitle || inputData.title)
    .setCoverImage(inputData.coverImage || '')  // Just a URL - no upload needed!
    
    // === Organization ===
    .setTags(inputData.tags || [])
    
    // === Comment Settings ===
    .setCommentPermissions(inputData.commentPermissions || 'everyone')
    .setCommentSort(inputData.commentSort || 'best_first')
    
    // === Advanced Settings ===
    .setExplicit(inputData.explicit || false)
    .setHideFromFeed(inputData.hideFromFeed || false);
  
  // Override section if provided in input
  if (inputData.sectionId) {
    postBuilder.setSection(parseInt(inputData.sectionId));
  }
  
  // Publish the post
  const published = await postBuilder.publish();
  
  // Return success response
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
        isPublished: published.is_published,
        postDate: published.post_date,
        description: published.description,
        tags: published.postTags || [],
        publicationId: published.publication_id
      },
      metadata: {
        publishedAt: new Date().toISOString(),
        hostname: process.env.SUBSTACK_HOSTNAME
      }
    }
  }];
  
} catch (error) {
  // Return error details
  return [{
    json: {
      success: false,
      error: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      },
      input: inputData  // Include input for debugging
    }
  }];
}

