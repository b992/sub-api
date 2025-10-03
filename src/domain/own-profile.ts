import { Profile } from './profile'
import { Note } from './note'
import { NoteBuilder, NoteWithLinkBuilder } from './note-builder'
import { FullPost } from './post'
import { PostBuilder } from './post-builder'
import type { SubstackFullProfile } from '../internal'
import type { HttpClient } from '../internal/http-client'
import type {
  ProfileService,
  PostService,
  NoteService,
  FolloweeService,
  CommentService
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
    private readonly defaultSectionId?: number,
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

    return new FullPost(fullPostData, this.client, this.commentService, this.postService)
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
            yield new FullPost(fullPost, this.client, this.commentService, this.postService)
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
          yield new Note(noteData, this.client)
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
}
