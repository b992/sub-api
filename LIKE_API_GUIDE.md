# Like/Heart API Guide

This guide covers the new like/heart functionality added to the Substack API client, allowing you to interact with reactions on posts and notes.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [Liking Notes](#liking-notes)
  - [Liking Posts](#liking-posts)
  - [Feed Access](#feed-access)
- [Examples](#examples)
- [Auto-Liker](#auto-liker)
- [Rate Limiting](#rate-limiting)

## Overview

The like/reaction API allows you to:

- ❤️ Like/heart notes and posts
- 📰 Fetch notes from your "For You" feed
- 👥 Fetch notes from your Following feed
- 🤖 Build automation tools (like auto-likers)

## Quick Start

```typescript
import { SubstackClient } from './src'

// Initialize client
const client = new SubstackClient({
  email: process.env.SUBSTACK_EMAIL!,
  password: process.env.SUBSTACK_PASSWORD!
})

// Get your profile
const profile = await client.ownProfile()

// Like a note from your feed
for await (const note of profile.feedNotes({ limit: 1 })) {
  await note.like()
  console.log(`Liked note by ${note.author.name}`)
  break
}
```

## API Reference

### Liking Notes

Notes can be liked using the `like()` method on `Note` instances:

```typescript
// Get a note by ID
const note = await client.noteForId(12345)

// Like it
await note.like()
```

**Note Properties:**
- `id`: String - The note's unique identifier
- `body`: String - The note's text content
- `likesCount`: Number - Current number of likes
- `author`: Object - Author information (id, name, handle, avatarUrl)
- `publishedAt`: Date - When the note was published

### Liking Posts

Posts can be liked using the `like()` method on `PreviewPost` or `FullPost` instances:

```typescript
// Get a post by ID
const post = await client.postForId(67890)

// Like it
await post.like()
```

**Post Properties:**
- `id`: Number - The post's unique identifier
- `title`: String - Post title
- `subtitle`: String - Post subtitle
- `likesCount`: Number - Current number of likes
- `author`: Object - Author information
- `publishedAt`: Date - Publication date

### Feed Access

Access your personalized feeds through your `OwnProfile`:

#### For You Feed

```typescript
const profile = await client.ownProfile()

// Get notes from "For You" feed
for await (const note of profile.feedNotes({ limit: 10 })) {
  console.log(`${note.author.name}: ${note.body.substring(0, 60)}...`)
}
```

#### Following Feed

```typescript
// Get notes from people you follow
for await (const note of profile.followingFeedNotes({ limit: 10 })) {
  console.log(`${note.author.name}: ${note.body.substring(0, 60)}...`)
}
```

## Examples

### Example 1: Like Recent Notes from Feed

```typescript
async function likeRecentNotes(client: SubstackClient, count: number = 5) {
  const profile = await client.ownProfile()
  
  let liked = 0
  for await (const note of profile.feedNotes({ limit: count * 2 })) {
    // Skip already-liked notes
    if (note.likesCount > 0) continue
    
    await note.like()
    console.log(`❤️  Liked: ${note.body.substring(0, 50)}...`)
    
    liked++
    if (liked >= count) break
    
    // Rate limit: wait 1 second between likes
    await new Promise(r => setTimeout(r, 1000))
  }
}
```

### Example 2: Like All Notes from a Specific User

```typescript
async function likeUserNotes(client: SubstackClient, userSlug: string) {
  const userProfile = await client.profileForSlug(userSlug)
  
  for await (const note of userProfile.notes({ limit: 10 })) {
    try {
      await note.like()
      console.log(`Liked: ${note.body.substring(0, 50)}...`)
      await new Promise(r => setTimeout(r, 1000))
    } catch (error) {
      console.error(`Failed to like:`, error)
    }
  }
}
```

### Example 3: Smart Auto-Liker with Filtering

```typescript
async function smartAutoLiker(client: SubstackClient) {
  const profile = await client.ownProfile()
  
  // Keywords to look for
  const keywords = ['typescript', 'javascript', 'coding']
  
  let liked = 0
  for await (const note of profile.feedNotes({ limit: 50 })) {
    // Check if note contains any keywords
    const hasKeyword = keywords.some(kw => 
      note.body.toLowerCase().includes(kw.toLowerCase())
    )
    
    if (hasKeyword && note.likesCount === 0) {
      await note.like()
      console.log(`❤️  Liked note about ${keywords.find(k => note.body.includes(k))}`)
      liked++
      
      if (liked >= 10) break
      await new Promise(r => setTimeout(r, 1500))
    }
  }
  
  console.log(`Liked ${liked} relevant notes`)
}
```

## Auto-Liker

A complete auto-liker example is available in `AUTO_LIKER_EXAMPLE.ts`. It demonstrates:

- ✅ Fetching from multiple feed types
- ✅ Configurable like limits
- ✅ Rate limiting to avoid API throttling
- ✅ Error handling
- ✅ Skipping already-liked content

**Usage:**

```bash
# Set environment variables
export SUBSTACK_EMAIL="your@email.com"
export SUBSTACK_PASSWORD="your-password"

# Run the example
npx ts-node AUTO_LIKER_EXAMPLE.ts
```

**Configuration Options:**

```typescript
await autoLikeNotes(client, {
  maxLikes: 10,              // Maximum number of notes to like
  useForYouFeed: true,       // Use "For You" (true) or Following (false)
  delayMs: 1500,             // Delay between likes in milliseconds
  skipAlreadyLiked: true     // Skip notes you've already liked
})
```

## Rate Limiting

**Important:** To avoid rate limiting or account restrictions:

1. **Add delays between actions**: Wait at least 1-2 seconds between likes
2. **Limit batch sizes**: Don't like too many items at once (recommended: 10-20 per session)
3. **Respect the platform**: Only automate reasonable, human-like behavior
4. **Handle errors gracefully**: If you get rate-limited, back off and try again later

**Example with rate limiting:**

```typescript
for await (const note of profile.feedNotes({ limit: 10 })) {
  await note.like()
  
  // Wait 1.5 seconds before next like
  await new Promise(resolve => setTimeout(resolve, 1500))
}
```

## API Endpoints Used

The like functionality uses the following Substack API endpoints:

- `POST /api/v1/comment/{comment_id}/reaction` - Like a note (notes are comments internally)
- `POST /api/v1/post/{post_id}/reaction` - Like a post
- `GET /api/v1/reader/feed?tab=for-you&type=base` - Get "For You" feed
- `GET /api/v1/feed/following` - Get Following feed

All endpoints require authentication via session cookies.

## Error Handling

Always wrap your like operations in try-catch blocks:

```typescript
try {
  await note.like()
} catch (error) {
  if (error.message.includes('already liked')) {
    console.log('Already liked this note')
  } else if (error.message.includes('rate limit')) {
    console.log('Rate limited, backing off...')
    await new Promise(r => setTimeout(r, 5000))
  } else {
    console.error('Unexpected error:', error)
  }
}
```

## Best Practices

1. **Test with small limits first** - Start with `maxLikes: 1` or `2` to test
2. **Use delays** - Always add delays between API calls
3. **Check already-liked status** - Skip notes you've already liked
4. **Log your actions** - Keep track of what your automation is doing
5. **Be a good citizen** - Don't spam or abuse the platform

## TypeScript Types

```typescript
interface Note {
  id: string
  body: string
  likesCount: number
  author: {
    id: number
    name: string
    handle: string
    avatarUrl: string
  }
  publishedAt: Date
  like(): Promise<void>
}

interface OwnProfile {
  feedNotes(options?: { limit?: number }): AsyncIterable<Note>
  followingFeedNotes(options?: { limit?: number }): AsyncIterable<Note>
}
```

## Troubleshooting

**"ReactionService not available" error:**
- Make sure you're getting the note/post through `Profile`, `OwnProfile`, or the `SubstackClient` methods
- Notes/posts created manually without the client won't have reaction capabilities

**"Rate limited" errors:**
- Increase delays between actions
- Reduce batch sizes
- Wait before retrying

**"Already liked" errors:**
- Check `note.likesCount` before liking
- Use `skipAlreadyLiked: true` in auto-liker options

## Contributing

Found a bug or want to add features? Please open an issue or pull request!

---

Happy liking! ❤️

