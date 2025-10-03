/**
 * Multi-Publication Example
 * 
 * Shows how to manage multiple Substack publications with different
 * default sections. Perfect for n8n automations!
 */

import { SubstackClient } from './src/index'

async function multiPublicationExample() {
  console.log('📚 Multi-Publication Management Example')
  console.log('='.repeat(60))

  // ==========================================================================
  // Setup 1: Whiskey & Flowers (Poetry)
  // ==========================================================================
  const whiskeyClient = new SubstackClient({
    apiKey: process.env.WHISKEY_API_KEY!,
    hostname: process.env.WHISKEY_HOSTNAME!,
    defaultSectionId: process.env.WHISKEY_DEFAULT_SECTION_ID 
      ? parseInt(process.env.WHISKEY_DEFAULT_SECTION_ID)
      : undefined
  })

  // ==========================================================================
  // Setup 2: Tech Blog
  // ==========================================================================
  const techClient = new SubstackClient({
    apiKey: process.env.TECH_API_KEY!,
    hostname: process.env.TECH_HOSTNAME!,
    defaultSectionId: process.env.TECH_DEFAULT_SECTION_ID
      ? parseInt(process.env.TECH_DEFAULT_SECTION_ID)
      : undefined
  })

  // ==========================================================================
  // Setup 3: Creative Writing
  // ==========================================================================
  const creativeClient = new SubstackClient({
    apiKey: process.env.CREATIVE_API_KEY!,
    hostname: process.env.CREATIVE_HOSTNAME!,
    defaultSectionId: process.env.CREATIVE_DEFAULT_SECTION_ID
      ? parseInt(process.env.CREATIVE_DEFAULT_SECTION_ID)
      : undefined
  })

  // ==========================================================================
  // Usage: Publish to different publications
  // ==========================================================================

  try {
    // Publish a poem to Whiskey & Flowers
    console.log('\n📝 Publishing to Whiskey & Flowers (Poetry)...')
    const whiskeyProfile = await whiskeyClient.ownProfile()
    const poem = await whiskeyProfile.newPost()
      .setTitle('Autumn Reflections')
      .setBodyHtml(`
        <h2>A New Season</h2>
        <p><em>Leaves fall like memories,<br>
        Each one a story untold...</em></p>
      `)
      // Section is auto-set from WHISKEY_DEFAULT_SECTION_ID!
      .publish()
    
    console.log(`✅ Poem published: Post ID ${poem.id}`)

    // Publish a tech article
    console.log('\n💻 Publishing to Tech Blog...')
    const techProfile = await techClient.ownProfile()
    const techPost = await techProfile.newPost()
      .setTitle('Introduction to TypeScript')
      .setBodyHtml(`
        <h2>Why TypeScript?</h2>
        <p>TypeScript provides type safety...</p>
      `)
      // Section is auto-set from TECH_DEFAULT_SECTION_ID!
      .publish()
    
    console.log(`✅ Tech article published: Post ID ${techPost.id}`)

    // Publish a story
    console.log('\n📖 Publishing to Creative Writing...')
    const creativeProfile = await creativeClient.ownProfile()
    const story = await creativeProfile.newPost()
      .setTitle('The Lost Key')
      .setBodyHtml(`
        <h2>Chapter 1</h2>
        <p>It was a dark and stormy night...</p>
      `)
      // Section is auto-set from CREATIVE_DEFAULT_SECTION_ID!
      .publish()
    
    console.log(`✅ Story published: Post ID ${story.id}`)

    console.log('\n🎉 All publications successful!')

  } catch (error) {
    console.error('❌ Error:', (error as Error).message)
  }
}

// =============================================================================
// n8n Integration Helper
// =============================================================================

/**
 * Create a client from n8n workflow parameters
 * 
 * In n8n Function node, you can call this like:
 * 
 * const client = createClientFromParams({
 *   hostname: $node["Config"].json.hostname,
 *   apiKey: $node["Config"].json.apiKey,
 *   defaultSectionId: $node["Config"].json.sectionId
 * });
 */
export function createClientFromParams(params: {
  hostname: string
  apiKey: string
  defaultSectionId?: number
}): SubstackClient {
  return new SubstackClient({
    hostname: params.hostname,
    apiKey: params.apiKey,
    defaultSectionId: params.defaultSectionId
  })
}

/**
 * Publish a post from n8n workflow data
 * 
 * Example n8n usage:
 * 
 * const result = await publishFromWorkflow(client, {
 *   title: $json.title,
 *   content: $json.html_content,
 *   description: $json.seo_description,
 *   overrideSection: $json.custom_section_id  // Optional
 * });
 * 
 * return { postId: result.id, url: result.url };
 */
export async function publishFromWorkflow(
  client: SubstackClient,
  data: {
    title: string
    content: string
    subtitle?: string
    description?: string
    socialTitle?: string
    overrideSection?: number
  }
) {
  const profile = await client.ownProfile()
  const builder = profile.newPost()
    .setTitle(data.title)
    .setBodyHtml(data.content)
  
  if (data.subtitle) builder.setSubtitle(data.subtitle)
  if (data.description) builder.setDescription(data.description)
  if (data.socialTitle) builder.setSocialTitle(data.socialTitle)
  if (data.overrideSection) builder.setSection(data.overrideSection)
  
  const published = await builder.publish()
  
  return {
    id: published.id,
    title: published.title,
    url: published.canonical_url,
    isPublished: published.is_published
  }
}

// Run the example if executed directly
if (require.main === module) {
  multiPublicationExample().catch(console.error)
}

/**
 * =============================================================================
 * ENVIRONMENT SETUP
 * =============================================================================
 * 
 * Copy this to your .env file:
 * 
 * # Whiskey & Flowers (Poetry)
 * WHISKEY_API_KEY=s%3Ayour-cookie-here
 * WHISKEY_HOSTNAME=whiskeyandflowers.substack.com
 * WHISKEY_DEFAULT_SECTION_ID=162170
 * 
 * # Tech Blog
 * TECH_API_KEY=s%3Ayour-cookie-here
 * TECH_HOSTNAME=techblog.substack.com
 * TECH_DEFAULT_SECTION_ID=123456
 * 
 * # Creative Writing
 * CREATIVE_API_KEY=s%3Ayour-cookie-here
 * CREATIVE_HOSTNAME=mystories.substack.com
 * CREATIVE_DEFAULT_SECTION_ID=789012
 * 
 * =============================================================================
 */

