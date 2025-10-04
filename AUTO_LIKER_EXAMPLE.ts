/**
 * Auto-Liker Example
 * 
 * This example demonstrates how to use the Substack API to automatically like
 * notes from your feed. This is useful for engaging with content from people
 * you follow or discovering new content in your "For You" feed.
 * 
 * Features:
 * - Fetch notes from "For You" feed or Following feed
 * - Automatically like notes (with configurable limit)
 * - Skip already-liked notes
 * - Graceful error handling
 */

import { SubstackClient } from './src'
import type { Note } from './src'

/**
 * Auto-like notes from your feed
 * @param client - Authenticated SubstackClient instance
 * @param options - Configuration options
 */
async function autoLikeNotes(
  client: SubstackClient,
  options: {
    /** Maximum number of notes to like */
    maxLikes?: number
    /** Whether to use "For You" feed (true) or Following feed (false) */
    useForYouFeed?: boolean
    /** Delay between likes in milliseconds (to avoid rate limiting) */
    delayMs?: number
    /** Whether to skip notes that are already liked */
    skipAlreadyLiked?: boolean
  } = {}
) {
  const {
    maxLikes = 10,
    useForYouFeed = true,
    delayMs = 1000,
    skipAlreadyLiked = true
  } = options

  try {
    // Get your authenticated profile
    const profile = await client.ownProfile()
    console.log(`✅ Authenticated as: ${profile.name} (@${profile.slug})`)

    // Choose which feed to use
    const feedType = useForYouFeed ? 'For You' : 'Following'
    console.log(`\n🔍 Fetching notes from ${feedType} feed...`)

    // Get notes from the selected feed
    const feedIterator = useForYouFeed
      ? profile.feedNotes({ limit: maxLikes * 2 }) // Fetch more than needed in case some are skipped
      : profile.followingFeedNotes({ limit: maxLikes * 2 })

    let likedCount = 0
    let skippedCount = 0

    for await (const note of feedIterator) {
      // Stop if we've reached the maximum number of likes
      if (likedCount >= maxLikes) {
        break
      }

      try {
        // Check if already liked (if configured)
        if (skipAlreadyLiked && note.likesCount > 0) {
          console.log(`⏭️  Skipped: Already liked note by ${note.author.name}`)
          skippedCount++
          continue
        }

        // Like the note
        await note.like()
        likedCount++
        
        console.log(`❤️  Liked note #${likedCount} by ${note.author.name}`)
        console.log(`   Preview: ${note.body.substring(0, 60)}...`)

        // Add delay to avoid rate limiting
        if (delayMs > 0 && likedCount < maxLikes) {
          await new Promise(resolve => setTimeout(resolve, delayMs))
        }
      } catch (error) {
        console.error(`❌ Failed to like note by ${note.author.name}:`, (error as Error).message)
        // Continue with next note instead of stopping
      }
    }

    console.log(`\n✨ Done! Liked ${likedCount} notes (skipped ${skippedCount})`)
  } catch (error) {
    console.error('❌ Error in auto-liker:', (error as Error).message)
    throw error
  }
}

/**
 * Like a specific number of notes from a user's profile
 * @param client - Authenticated SubstackClient instance
 * @param userSlug - The slug of the user whose notes to like
 * @param maxLikes - Maximum number of notes to like
 */
async function likeUserNotes(
  client: SubstackClient,
  userSlug: string,
  maxLikes: number = 5
) {
  try {
    console.log(`\n🔍 Fetching notes from @${userSlug}...`)
    
    // Get the user's profile
    const userProfile = await client.profileForSlug(userSlug)
    console.log(`✅ Found profile: ${userProfile.name}`)

    let likedCount = 0

    for await (const note of userProfile.notes({ limit: maxLikes })) {
      if (likedCount >= maxLikes) {
        break
      }

      try {
        await note.like()
        likedCount++
        console.log(`❤️  Liked note #${likedCount}: ${note.body.substring(0, 60)}...`)
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`❌ Failed to like note:`, (error as Error).message)
      }
    }

    console.log(`\n✨ Done! Liked ${likedCount} notes from @${userSlug}`)
  } catch (error) {
    console.error(`❌ Error liking user notes:`, (error as Error).message)
    throw error
  }
}

/**
 * Main function - demonstrates different auto-liker scenarios
 */
async function main() {
  // Initialize the client with your Substack credentials
  const client = new SubstackClient({
    email: process.env.SUBSTACK_EMAIL!,
    password: process.env.SUBSTACK_PASSWORD!,
    hostname: process.env.SUBSTACK_HOSTNAME || 'substack.com'
  })

  console.log('🚀 Starting Auto-Liker Example\n')

  // Example 1: Auto-like 5 notes from your "For You" feed
  console.log('=== Example 1: Like notes from "For You" feed ===')
  await autoLikeNotes(client, {
    maxLikes: 5,
    useForYouFeed: true,
    delayMs: 1500,
    skipAlreadyLiked: true
  })

  // Wait a bit between examples
  await new Promise(resolve => setTimeout(resolve, 3000))

  // Example 2: Auto-like 3 notes from your Following feed
  console.log('\n=== Example 2: Like notes from Following feed ===')
  await autoLikeNotes(client, {
    maxLikes: 3,
    useForYouFeed: false,
    delayMs: 1500,
    skipAlreadyLiked: true
  })

  // Example 3: Like notes from a specific user
  // Uncomment and replace with an actual user slug
  // console.log('\n=== Example 3: Like notes from specific user ===')
  // await likeUserNotes(client, 'some-user-slug', 3)

  console.log('\n✅ All examples completed!')
}

// Run the examples
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

// Export functions for use in other scripts
export { autoLikeNotes, likeUserNotes }

