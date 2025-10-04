/**
 * Section Discovery Script for The Gods & Monsters
 * 
 * This script discovers all sections and their IDs from your Substack publication
 * so your AI can automatically assign posts to the correct section.
 */

import { SubstackClient } from './src'

// Configuration for The Gods & Monsters publication
const API_KEY = process.env.GODS_API_KEY || 's%3Aw_JqH1OwRTbSYFZpSVRsoiunqORPrmvT.cbXS44BJpaS1bPuu%2F0FTLYho8%2BEONR6G8aw2vH5Q48w' // Replace with your actual cookie
const HOSTNAME = 'thegodsandmonsters.substack.com'

interface Section {
  id: number
  name: string
  slug: string
  created_at: string
  publication_id: number
}

async function discoverSections() {
  console.log('🔍 Discovering sections for The Gods & Monsters...')
  console.log('═'.repeat(60))
  console.log()

  try {
    // Initialize client
    const client = new SubstackClient({
      apiKey: API_KEY,
      hostname: HOSTNAME
    })

    // Test connectivity
    const isConnected = await client.testConnectivity()
    if (!isConnected) {
      throw new Error('Failed to connect to Substack API')
    }

    console.log('✅ Connected to Substack API')
    console.log()

    // Get own profile to access the HTTP client
    const profile = await client.ownProfile()
    console.log(`✅ Authenticated as: ${profile.name}`)
    console.log()

    // Access the HTTP client directly to make API calls
    const httpClient = (client as any).publicationClient

    // Try to fetch sections from the API
    console.log('📋 Fetching sections...')
    
    try {
      // Method 1: Try the sections API endpoint
      const sectionsResponse = await httpClient.get<{ sections: Section[] }>('/api/v1/publication/sections')
      
      if (sectionsResponse.sections && sectionsResponse.sections.length > 0) {
        console.log(`✅ Found ${sectionsResponse.sections.length} sections:`)
        console.log('─'.repeat(60))
        console.log()

        const sectionData: Record<string, { id: number; slug: string }> = {}

        for (const section of sectionsResponse.sections) {
          console.log(`📁 ${section.name}`)
          console.log(`   ID: ${section.id}`)
          console.log(`   Slug: ${section.slug}`)
          console.log(`   Created: ${new Date(section.created_at).toLocaleDateString()}`)
          console.log()

          // Store for JSON output
          sectionData[section.name] = {
            id: section.id,
            slug: section.slug
          }
        }

        console.log('═'.repeat(60))
        console.log()
        console.log('📄 JSON Format for your AI:')
        console.log(JSON.stringify(sectionData, null, 2))
        console.log()

        // Generate code snippet
        console.log('💻 Code Snippet for n8n:')
        console.log('─'.repeat(60))
        console.log('```javascript')
        console.log('// Section mapping for The Gods & Monsters')
        console.log('const sections = {')
        for (const [name, data] of Object.entries(sectionData)) {
          console.log(`  "${name}": ${data.id},`)
        }
        console.log('};')
        console.log()
        console.log('// Usage in your AI workflow:')
        console.log('const sectionId = sections[aiGeneratedSectionName];')
        console.log('```')
        console.log()

        return sectionData
      }
    } catch (error) {
      console.log(`⚠️  Sections API not available: ${(error as Error).message}`)
      console.log('Trying alternative methods...')
      console.log()
    }

    // Method 2: Try to get sections from publication settings
    try {
      const settingsResponse = await httpClient.get<any>('/api/v1/publication/settings')
      
      if (settingsResponse.sections) {
        console.log(`✅ Found sections in settings:`)
        console.log(JSON.stringify(settingsResponse.sections, null, 2))
        return settingsResponse.sections
      }
    } catch (error) {
      console.log(`⚠️  Settings API method failed`)
    }

    // Method 3: Check if we can get sections from posts
    console.log('📝 Checking existing posts for section information...')
    try {
      const draftsResponse = await httpClient.get<any>('/api/v1/post_management/drafts', {
        limit: 100
      })
      
      if (draftsResponse.posts && draftsResponse.posts.length > 0) {
        const sectionsFound = new Set()
        
        for (const post of draftsResponse.posts) {
          if (post.section_id) {
            sectionsFound.add(post.section_id)
          }
        }
        
        if (sectionsFound.size > 0) {
          console.log(`✅ Found ${sectionsFound.size} section IDs from posts:`)
          console.log(Array.from(sectionsFound))
        }
      }
    } catch (error) {
      console.log(`⚠️  Could not fetch posts`)
    }

    console.log()
    console.log('ℹ️  Manual Method:')
    console.log('─'.repeat(60))
    console.log('1. Go to https://thegodsandmonsters.substack.com/publish/settings')
    console.log('2. Click on each section in the sidebar')
    console.log('3. The URL will show: /settings/sections/{id}')
    console.log('4. Note down each ID')

  } catch (error) {
    console.error('❌ Error:', (error as Error).message)
    console.error()
    console.error('Troubleshooting:')
    console.error('- Check that your connect.sid cookie is valid')
    console.error('- Make sure you\'re logged in to Substack')
    console.error('- Try getting a fresh cookie from your browser')
    process.exit(1)
  }
}

// Run the discovery
discoverSections()

