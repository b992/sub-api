import type { SubstackPost, SubstackFullPost, PublishPostRequest } from '../internal'
import type { HttpClient } from '../internal/http-client'
import type { CommentService, PostService, ReactionService } from '../internal/services'
import { Comment } from './comment'

/**
 * PreviewPost entity representing a Substack post with truncated content
 */
export class PreviewPost {
  public readonly id: number
  public readonly title: string
  public readonly subtitle: string
  public readonly body: string
  public readonly truncatedBody: string
  public readonly likesCount: number
  public readonly author: {
    id: number
    name: string
    handle: string
    avatarUrl: string
  }
  public readonly publishedAt: Date

  constructor(
    rawData: SubstackPost,
    private readonly client: HttpClient,
    private readonly commentService: CommentService,
    private readonly postService: PostService,
    private readonly reactionService?: ReactionService
  ) {
    this.id = rawData.id
    this.title = rawData.title
    this.subtitle = rawData.subtitle || ''
    this.truncatedBody = rawData.truncated_body_text || ''
    this.body = rawData.truncated_body_text || ''
    this.likesCount = 0 // TODO: Extract from rawData when available
    this.publishedAt = new Date(rawData.post_date)

    // TODO: Extract author information from rawData
    // For now, use placeholder values
    this.author = {
      id: 0,
      name: 'Unknown Author',
      handle: 'unknown',
      avatarUrl: ''
    }
  }

  /**
   * Fetch the full post data with HTML body content
   * @returns Promise<FullPost> - A FullPost instance with complete content
   * @throws {Error} When full post retrieval fails
   */
  async fullPost(): Promise<FullPost> {
    try {
      const fullPostData = await this.postService.getPostById(this.id)
      return new FullPost(fullPostData, this.client, this.commentService, this.postService, this.reactionService)
    } catch (error) {
      throw new Error(`Failed to fetch full post ${this.id}: ${(error as Error).message}`)
    }
  }

  /**
   * Get comments for this post
   * @throws {Error} When comment retrieval fails or API is unavailable
   */
  async *comments(options: { limit?: number } = {}): AsyncIterable<Comment> {
    try {
      const commentsData = await this.commentService.getCommentsForPost(this.id)

      let count = 0
      for (const commentData of commentsData) {
        if (options.limit && count >= options.limit) break
        yield new Comment(commentData, this.client)
        count++
      }
    } catch (error) {
      throw new Error(`Failed to get comments for post ${this.id}: ${(error as Error).message}`)
    }
  }

  /**
   * Like this post
   */
  async like(): Promise<void> {
    if (!this.reactionService) {
      throw new Error('ReactionService not available. Post must be created through Profile or OwnProfile.')
    }
    
    await this.reactionService.likePost(this.id)
  }

  /**
   * Add a comment to this post
   */
  async addComment(_data: { body: string }): Promise<Comment> {
    // Implementation will add comment via the client
    throw new Error('Comment creation not implemented yet - requires comment creation API')
  }

  /**
   * Update this post (only works for posts you own)
   * @param data - The data to update
   * @returns Promise<FullPost> - The updated post
   * @throws {Error} When post update fails or user lacks permission
   */
  async update(data: {
    title?: string
    subtitle?: string
    body_html?: string
    audience?: 'everyone' | 'paid' | 'founding'
    description?: string
    cover_image?: string
    postTags?: string[]
  }): Promise<FullPost> {
    const updateRequest = {
      id: this.id,
      ...data
    }

    const updatedPost = await this.postService.updatePost(updateRequest)
    
    // Transform the response to match SubstackFullPost format
    const fullPostData = {
      ...updatedPost,
      body_html: updatedPost.body_html,
      post_date: updatedPost.post_date,
      canonical_url: updatedPost.canonical_url
    }

    return new FullPost(fullPostData, this.client, this.commentService, this.postService, this.reactionService)
  }

  /**
   * Publish this post (only works for draft posts you own)
   * @param options - Publishing options
   * @returns Promise<FullPost> - The published post
   * @throws {Error} When post publishing fails or user lacks permission
   */
  async publish(options: PublishPostRequest = {}): Promise<FullPost> {
    const publishedPost = await this.postService.publishPost(this.id, options)
    
    // Transform the response to match SubstackFullPost format
    const fullPostData = {
      ...publishedPost,
      body_html: publishedPost.body_html,
      post_date: publishedPost.post_date,
      canonical_url: publishedPost.canonical_url
    }

    return new FullPost(fullPostData, this.client, this.commentService, this.postService, this.reactionService)
  }

  /**
   * Delete this post (only works for posts you own)
   * @throws {Error} When post deletion fails or user lacks permission
   */
  async delete(): Promise<void> {
    await this.postService.deletePost(this.id)
  }
}

/**
 * FullPost entity representing a Substack post with complete HTML content
 */
export class FullPost extends PreviewPost {
  public readonly htmlBody: string
  public readonly slug: string
  public readonly createdAt: Date
  public readonly reactions?: Record<string, number>
  public readonly restacks?: number
  public readonly postTags?: string[]
  public readonly coverImage?: string

  constructor(
    rawData: SubstackFullPost,
    client: HttpClient,
    commentService: CommentService,
    postService: PostService,
    reactionService?: ReactionService
  ) {
    super(rawData, client, commentService, postService, reactionService)
    // Prefer body_html from the full post response, fall back to htmlBody for backward compatibility
    this.htmlBody = rawData.body_html || rawData.htmlBody || ''
    this.slug = rawData.slug
    this.createdAt = new Date(rawData.post_date)
    this.reactions = rawData.reactions
    this.restacks = rawData.restacks
    this.postTags = rawData.postTags
    this.coverImage = rawData.cover_image
  }
}
