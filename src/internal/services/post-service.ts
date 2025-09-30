import type { SubstackPost, SubstackFullPost, CreatePostRequest, CreatePostResponse, UpdatePostRequest, PublishPostRequest, PostDraftInfo, PostManagementResponse } from '../types'
import { SubstackPostCodec, SubstackFullPostCodec } from '../types'
import { decodeOrThrow } from '../validation'
import type { HttpClient } from '../http-client'

/**
 * Service responsible for post-related HTTP operations
 * Returns internal types that can be transformed into domain models
 */
export class PostService {
  constructor(
    private readonly globalHttpClient: HttpClient,
    private readonly httpClient: HttpClient
  ) {}

  /**
   * Get a post by ID from the API
   * @param id - The post ID
   * @returns Promise<SubstackFullPost> - Raw full post data from API (validated)
   * @throws {Error} When post is not found, API request fails, or validation fails
   *
   * Note: Uses SubstackFullPostCodec to validate the full post response from /posts/by-id/:id
   * which includes body_html, postTags, reactions, and other fields not present in preview responses.
   * This codec is specifically designed for FullPost construction.
   */
  async getPostById(id: number): Promise<SubstackFullPost> {
    // Post lookup by ID must use the global substack.com endpoint, not publication-specific hostnames
    const rawResponse = await this.globalHttpClient.get<{ post: unknown }>(
      `/api/v1/posts/by-id/${id}`
    )

    // Extract the post data from the wrapper object
    if (!rawResponse.post) {
      throw new Error('Invalid response format: missing post data')
    }

    // Transform the raw post data to match our codec expectations
    const postData = this.transformPostData(rawResponse.post as any)

    // Validate the response with SubstackFullPostCodec for full post data including body_html
    return decodeOrThrow(SubstackFullPostCodec, postData, 'Full post response')
  }

  /**
   * Transform raw API post data to match our codec structure
   */
  private transformPostData(rawPost: any): any {
    const transformedPost = { ...rawPost }

    // Transform postTags from objects to string array
    if (rawPost.postTags && Array.isArray(rawPost.postTags)) {
      transformedPost.postTags = rawPost.postTags.map((tag: any) => tag.name || tag)
    }

    return transformedPost
  }

  /**
   * Get posts for a profile
   * @param profileId - The profile user ID
   * @param options - Pagination options
   * @returns Promise<SubstackPost[]> - Raw post data from API (validated)
   * @throws {Error} When posts cannot be retrieved or validation fails
   */
  async getPostsForProfile(
    profileId: number,
    options: { limit: number; offset: number }
  ): Promise<SubstackPost[]> {
    const response = await this.httpClient.get<{ posts?: unknown[] }>(
      `/api/v1/profile/posts?profile_user_id=${profileId}&limit=${options.limit}&offset=${options.offset}`
    )

    const posts = response.posts || []

    // Validate each post with io-ts
    return posts.map((post, index) =>
      decodeOrThrow(SubstackPostCodec, post, `Post ${index} in profile response`)
    )
  }

  /**
   * Create a new post draft
   * @param postData - The post data to create
   * @returns Promise<CreatePostResponse> - The created post data
   * @throws {Error} When post creation fails
   * 
   * INVESTIGATION RESULTS:
   * - /api/v1/posts does NOT exist on Substack (404)
   * - /api/v1/post_management/* endpoints are READ-ONLY (tested: 404 on POST)
   * - Post creation likely uses a non-REST mechanism (form submission, WebSocket, etc.)
   * - Browser creates posts automatically when opening editor UI
   * 
   * WORKING ENDPOINTS:
   * - GET /api/v1/posts/by-id/{id} (global domain)
   * - GET /api/v1/post_management/drafts (publication domain) 
   * - GET /api/v1/post_management/published (publication domain)
   */
  async createPost(postData: CreatePostRequest): Promise<CreatePostResponse> {
    throw new Error(
      'Post creation through API is not yet implemented. ' +
      '\n\nINVESTIGATION FINDINGS:' +
      '\n• /api/v1/posts - does NOT exist (404)' +
      '\n• /api/v1/post_management/* - READ-ONLY endpoints' +
      '\n• Browser creates posts via non-REST mechanism' +
      '\n\nNEXT STEPS:' +
      '\n• Reverse engineer browser post creation flow' +
      '\n• Investigate form-based or WebSocket mechanisms' +
      '\n• Consider using existing post update endpoints with pre-created drafts' +
      '\n\nWORKAROUND: Create posts manually in Substack dashboard, then use update/publish APIs'
    )
  }

  /**
   * Update an existing post
   * @param postData - The post data to update (must include id)
   * @returns Promise<CreatePostResponse> - The updated post data
   * @throws {Error} When post update fails
   */
  async updatePost(postData: UpdatePostRequest): Promise<CreatePostResponse> {
    const { id, ...updateData } = postData
    const response = await this.httpClient.post<CreatePostResponse>(
      `/api/v1/posts/${id}`,
      updateData
    )

    return response
  }

  /**
   * Publish a post
   * @param postId - The post ID to publish
   * @param options - Publishing options
   * @returns Promise<CreatePostResponse> - The published post data
   * @throws {Error} When post publishing fails
   */
  async publishPost(postId: number, options: PublishPostRequest = {}): Promise<CreatePostResponse> {
    const response = await this.httpClient.post<CreatePostResponse>(
      `/api/v1/posts/${postId}/publish`,
      options
    )

    return response
  }

  /**
   * Get draft posts for the publication
   * @param options - Pagination and ordering options
   * @returns Promise<PostManagementResponse<PostDraftInfo>> - Draft posts data
   * @throws {Error} When drafts cannot be retrieved
   */
  async getDrafts(options: {
    offset?: number
    limit?: number
    order_by?: 'draft_updated_at' | 'created_at'
    order_direction?: 'desc' | 'asc'
  } = {}): Promise<PostManagementResponse<PostDraftInfo>> {
    const {
      offset = 0,
      limit = 25,
      order_by = 'draft_updated_at',
      order_direction = 'desc'
    } = options

    const response = await this.httpClient.get<PostManagementResponse<PostDraftInfo>>(
      `/api/v1/post_management/drafts?offset=${offset}&limit=${limit}&order_by=${order_by}&order_direction=${order_direction}`
    )

    return response
  }

  /**
   * Get published posts for the publication
   * @param options - Pagination and ordering options
   * @returns Promise<PostManagementResponse<SubstackPost>> - Published posts data
   * @throws {Error} When published posts cannot be retrieved
   */
  async getPublishedPosts(options: {
    offset?: number
    limit?: number
    order_by?: 'post_date' | 'created_at'
    order_direction?: 'desc' | 'asc'
  } = {}): Promise<PostManagementResponse<SubstackPost>> {
    const {
      offset = 0,
      limit = 25,
      order_by = 'post_date',
      order_direction = 'desc'
    } = options

    const response = await this.httpClient.get<PostManagementResponse<SubstackPost>>(
      `/api/v1/post_management/published?offset=${offset}&limit=${limit}&order_by=${order_by}&order_direction=${order_direction}`
    )

    return response
  }

  /**
   * Get scheduled posts for the publication
   * @param options - Pagination and ordering options
   * @returns Promise<PostManagementResponse<SubstackPost>> - Scheduled posts data
   * @throws {Error} When scheduled posts cannot be retrieved
   */
  async getScheduledPosts(options: {
    offset?: number
    limit?: number
    order_by?: 'trigger_at' | 'created_at'
    order_direction?: 'desc' | 'asc'
  } = {}): Promise<PostManagementResponse<SubstackPost>> {
    const {
      offset = 0,
      limit = 25,
      order_by = 'trigger_at',
      order_direction = 'asc'
    } = options

    const response = await this.httpClient.get<PostManagementResponse<SubstackPost>>(
      `/api/v1/post_management/scheduled?offset=${offset}&limit=${limit}&order_by=${order_by}&order_direction=${order_direction}`
    )

    return response
  }

  /**
   * Delete a post
   * @param postId - The post ID to delete
   * @throws {Error} When post deletion fails
   */
  async deletePost(postId: number): Promise<void> {
    await this.httpClient.post(`/api/v1/posts/${postId}/delete`, {})
  }
}
