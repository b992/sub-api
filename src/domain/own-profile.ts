import { Profile } from './profile'
import { Note } from './note'
import { NoteBuilder, NoteWithLinkBuilder, NoteWithImagesBuilder } from './note-builder'
import { FullPost } from './post'
import { PostBuilder } from './post-builder'
import type { SubstackFullProfile } from '../internal'
import type { HttpClient } from '../internal/http-client'
import type {
  ProfileService,
  PostService,
  NoteService,
  FolloweeService,
  CommentService,
  FeedService,
  ReactionService
} from '../internal/services'

/**
 * OwnProfile extends Profile with write capabilities for the authenticated user
 */
export class OwnProfile extends Profile {
  constructor(
    rawData: SubstackFullProfile,
    client: HttpClient,
    profileService: ProfileService,
    postService: PostService,
    noteService: NoteService,
    commentService: CommentService,
    private readonly followeeService: FolloweeService,
    reactionService: ReactionService,
    private readonly defaultSectionId: number | undefined,
    private readonly feedService: FeedService,
    resolvedSlug?: string,
    slugResolver?: (userId: number, fallbackHandle?: string) => Promise<string | undefined>
  ) {
    super(
      rawData,
      client,
      profileService,
      postService,
      noteService,
      commentService,
      reactionService,
      resolvedSlug,
      slugResolver
    )
  }

  /**
   * Create a new note using the builder pattern
   */
  newNote(): NoteBuilder {
    return new NoteBuilder(this.client)
  }

  /**
   * Create a new note with a link attachment using the builder pattern
   */
  newNoteWithLink(link: string): NoteWithLinkBuilder {
    return new NoteWithLinkBuilder(this.client, link)
  }

  /**
   * Create a new note with image attachments using the builder pattern
   * @param base64Images - Array of base64 encoded images (data URIs)
   */
  newNoteWithImages(base64Images: string[]): NoteWithImagesBuilder {
    return new NoteWithImagesBuilder(this.client, this.noteService, base64Images)
  }

  /**
   * Create a new post builder that can be used to construct and create a post
   */
  newPost(): PostBuilder {
    const builder = new PostBuilder(this.client, this.postService)
    // Auto-set default section if configured
    if (this.defaultSectionId) {
      builder.setSection(this.defaultSectionId)
    }
    return builder
  }

  /**
   * Create a new post draft
   * @param postData - The post data to create
   * @returns Promise<FullPost> - The created post as a FullPost entity
   * @throws {Error} When post creation fails
   */
  async createPost(postData: {
    title: string
    subtitle?: string
    body_html: string
    type?: 'newsletter' | 'podcast' | 'thread'
    audience?: 'everyone' | 'paid' | 'founding'
    is_published?: boolean
    description?: string
    cover_image?: string
    postTags?: string[]
  }): Promise<FullPost> {
    const createRequest = {
      ...postData,
      type: postData.type || 'newsletter' as const,
      audience: postData.audience || 'everyone' as const,
      is_published: postData.is_published || false
    }

    const createdPost = await this.postService.createPost(createRequest)
    
    // Transform the response to match SubstackFullPost format
    const fullPostData = {
      ...createdPost,
      body_html: createdPost.body_html,
      post_date: createdPost.post_date,
      canonical_url: createdPost.canonical_url
    }

    return new FullPost(fullPostData, this.client, this.commentService, this.postService, this.reactionService)
  }

  /**
   * Get draft posts for this publication
   * @param options - Pagination and ordering options
   * @returns AsyncIterable<FullPost> - Draft posts as FullPost entities
   */
  async *drafts(options: {
    limit?: number
    order_by?: 'draft_updated_at' | 'created_at'
    order_direction?: 'desc' | 'asc'
  } = {}): AsyncIterable<FullPost> {
    try {
      let offset = 0
      const pageSize = 25
      let totalYielded = 0

      while (true) {
        const response = await this.postService.getDrafts({
          offset,
          limit: pageSize,
          order_by: options.order_by || 'draft_updated_at',
          order_direction: options.order_direction || 'desc'
        })

        if (!response.posts || response.posts.length === 0) {
          break
        }

        for (const draftInfo of response.posts) {
          if (options.limit && totalYielded >= options.limit) {
            return
          }

          // Fetch full post data using the existing getPostById method
          try {
            const fullPost = await this.postService.getPostById(draftInfo.id)
            yield new FullPost(fullPost, this.client, this.commentService, this.postService, this.reactionService)
            totalYielded++
          } catch (error) {
            // Skip posts that can't be retrieved
            continue
          }
        }

        if (!response.has_more) {
          break
        }

        offset += pageSize
      }
    } catch {
      // If the endpoint doesn't exist or fails, return empty iterator
      yield* []
    }
  }

  /**
   * Get users that the authenticated user follows
   */
  async *followees(options: { limit?: number } = {}): AsyncIterable<Profile> {
    // Use FolloweeService to get the list of user IDs that the user follows
    const followingUserIds = await this.followeeService.getFollowees()

    // Then, for each user ID, fetch their detailed profile
    let count = 0
    for (const userId of followingUserIds) {
      if (options.limit && count >= options.limit) break

      try {
        const profileResponse = await this.profileService.getProfileById(userId)

        // Use the same slug resolution as the main client if available
        let resolvedSlug = profileResponse.handle
        if (this.slugResolver) {
          resolvedSlug =
            (await this.slugResolver(userId, profileResponse.handle)) || profileResponse.handle
        }

        yield new Profile(
          profileResponse,
          this.client,
          this.profileService,
          this.postService,
          this.noteService,
          this.commentService,
          this.reactionService,
          resolvedSlug,
          this.slugResolver
        )
        count++
      } catch {
        // Skip profiles that can't be fetched (e.g., deleted accounts, private profiles)
        // This ensures the iterator continues working even if some profiles are inaccessible
        continue
      }
    }
  }

  /**
   * Get notes from the authenticated user's profile
   */
  async *notes(options: { limit?: number } = {}): AsyncIterable<Note> {
    try {
      let cursor: string | undefined = undefined
      let totalYielded = 0

      while (true) {
        // Use NoteService to fetch notes for the authenticated user with cursor-based pagination
        const paginatedNotes = await this.noteService.getNotesForLoggedUser({
          cursor
        })

        if (!paginatedNotes.notes) {
          break // No more notes to fetch
        }

        for (const noteData of paginatedNotes.notes) {
          if (options.limit && totalYielded >= options.limit) {
            return // Stop if we've reached the requested limit
          }
          yield new Note(noteData, this.client, this.reactionService)
          totalYielded++
        }

        // If there's no next cursor, we've reached the end
        if (!paginatedNotes.nextCursor) {
          break
        }

        cursor = paginatedNotes.nextCursor
      }
    } catch {
      // If the endpoint doesn't exist or fails, return empty iterator
      yield* []
    }
  }

  /**
   * Get notes from the "For You" feed
   * @param options - Options for limiting results
   * @returns AsyncIterable<Note> - Notes from the feed
   */
  async *feedNotes(options: { limit?: number } = {}): AsyncIterable<Note> {
    try {
      let cursor: string | undefined = undefined
      let totalYielded = 0

      while (true) {
        const paginatedNotes = await this.feedService.getForYouFeed({
          cursor
        })

        if (!paginatedNotes.notes || paginatedNotes.notes.length === 0) {
          break
        }

        for (const noteData of paginatedNotes.notes) {
          if (options.limit && totalYielded >= options.limit) {
            return
          }
          yield new Note(noteData, this.client, this.reactionService)
          totalYielded++
        }

        if (!paginatedNotes.nextCursor) {
          break
        }

        cursor = paginatedNotes.nextCursor
      }
    } catch {
      yield* []
    }
  }

  /**
   * Get notes from the following feed
   * @param options - Options for limiting results
   * @returns AsyncIterable<Note> - Notes from people you follow
   */
  async *followingFeedNotes(options: { limit?: number } = {}): AsyncIterable<Note> {
    try {
      let cursor: string | undefined = undefined
      let totalYielded = 0

      while (true) {
        const paginatedNotes = await this.feedService.getFollowingFeed({
          cursor
        })

        if (!paginatedNotes.notes || paginatedNotes.notes.length === 0) {
          break
        }

        for (const noteData of paginatedNotes.notes) {
          if (options.limit && totalYielded >= options.limit) {
            return
          }
          yield new Note(noteData, this.client, this.reactionService)
          totalYielded++
        }

        if (!paginatedNotes.nextCursor) {
          break
        }

        cursor = paginatedNotes.nextCursor
      }
    } catch {
      yield* []
    }
  }

  /**
   * Publish a post and optionally share it as a note (Share Center workflow)
   * 
   * This method combines post publishing with the "Share as a note" functionality
   * from Substack's Share Center, enabling automated post-and-promote workflows.
   * 
   * When sharing as a note, this adds the special `showWelcomeOnShare=true` parameter
   * to the URL (same as Share Center), which may trigger special reader onboarding.
   * 
   * @param postBuilder - A configured PostBuilder instance
   * @param noteText - Optional text for the note (e.g., "Check out my new article!")
   * @returns Promise with published post and optional note
   * @throws {Error} When post publishing fails
   * 
   * @example
   * ```typescript
   * const { post, note } = await profile.publishWithNote(
   *   profile.newPost()
   *     .setTitle('My Article')
   *     .setBodyHtml('<p>Content</p>'),
   *   '🎉 New article published! Check it out.'
   * )
   * ```
   */
  async publishWithNote(
    postBuilder: PostBuilder,
    noteText?: string
  ): Promise<{ post: any; note?: any }> {
    // 1. Publish the post
    const post = await postBuilder.publish()
    
    // 2. If noteText is provided, share as a note
    let note: any | undefined
    if (noteText) {
      try {
        // Construct the post URL (canonical_url may not be in publish response)
        let postUrl = post.canonical_url
        if (!postUrl && post.slug) {
          // Construct from slug if canonical_url is missing
          // Extract hostname from client's baseUrl
          const baseUrl = (this.client as any).baseUrl as string
          const hostname = baseUrl ? new URL(baseUrl).hostname : 'substack.com'
          postUrl = `https://${hostname}/p/${post.slug}`
        }
        
        if (postUrl) {
          // Add the Share Center's special parameter to the URL
          // This triggers the welcome/onboarding experience for readers
          const shareUrl = postUrl.includes('?')
            ? `${postUrl}&showWelcomeOnShare=true`
            : `${postUrl}?showWelcomeOnShare=true`
          
          note = await this.newNoteWithLink(shareUrl)
            .paragraph()
            .text(noteText)
            .publish()
        }
      } catch (error) {
        // Note publishing failed, but post is already published
        // Log the error but don't fail the whole operation
        console.error('Failed to publish share note:', (error as Error).message)
      }
    }
    
    return { post, note }
  }
}
