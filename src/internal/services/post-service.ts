import type { SubstackPost, SubstackFullPost, CreatePostRequest, CreatePostResponse, UpdatePostRequest, PublishPostRequest, PostDraftInfo, PostManagementResponse } from '../types'
import { SubstackPostCodec, SubstackFullPostCodec } from '../types'
import { decodeOrThrow } from '../validation'
import type { HttpClient } from '../http-client'

/**
 * Service responsible for post-related HTTP operations
 * Returns internal types that can be transformed into domain models
 * 
 * INVESTIGATION RESULTS (Sept 30, 2025):
 * ✅ POST /api/v1/drafts - Creates new draft (WORKS on publication domain)
 * ✅ GET /api/v1/drafts/{id} - Gets draft details (WORKS)
 * ✅ PUT /api/v1/drafts/{id} - Updates draft (WORKS)
 * ✅ GET /api/v1/post_management/drafts - Lists drafts (WORKS)
 * ✅ GET /api/v1/posts/by-id/{id} - Gets full post (WORKS on global domain)
 * 
 * KEY INSIGHT: Draft endpoints work on publication domain, NOT global substack.com!
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
   */
  async getPostById(id: number): Promise<SubstackFullPost> {
    // Post lookup by ID must use the global substack.com endpoint
    const rawResponse = await this.globalHttpClient.get<{ post: unknown }>(
      `/api/v1/posts/by-id/${id}`
    )

    if (!rawResponse.post) {
      throw new Error('Invalid response format: missing post data')
    }

    const postData = this.transformPostData(rawResponse.post as any)
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
   * Convert HTML to Substack's JSON document format
   * Basic implementation - handles common HTML tags
   */
  private htmlToSubstackJson(html: string): any {
    const content: any[] = []
    
    if (!html || html.trim() === '') {
      return { type: 'doc', content: [] }
    }

    // Simple HTML parsing - convert basic tags to Substack format
    const lines = html.split('\n').filter(line => line.trim())
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      // Heading 2
      if (trimmed.match(/^<h2[^>]*>(.*?)<\/h2>/i)) {
        const text = trimmed.replace(/<h2[^>]*>(.*?)<\/h2>/i, '$1').replace(/<[^>]+>/g, '')
        content.push({
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text }]
        })
      }
      // Heading 3
      else if (trimmed.match(/^<h3[^>]*>(.*?)<\/h3>/i)) {
        const text = trimmed.replace(/<h3[^>]*>(.*?)<\/h3>/i, '$1').replace(/<[^>]+>/g, '')
        content.push({
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text }]
        })
      }
      // Paragraph
      else if (trimmed.match(/^<p[^>]*>(.*?)<\/p>/i)) {
        const text = trimmed.replace(/<p[^>]*>(.*?)<\/p>/i, '$1').replace(/<[^>]+>/g, '')
        if (text) {
          content.push({
            type: 'paragraph',
            content: [{ type: 'text', text }]
          })
        }
      }
      // List items (unordered)
      else if (trimmed.match(/^<ul[^>]*>(.*?)<\/ul>/is)) {
        const items = trimmed.match(/<li[^>]*>(.*?)<\/li>/gi) || []
        const listItems = items.map(item => {
          const text = item.replace(/<li[^>]*>(.*?)<\/li>/i, '$1').replace(/<[^>]+>/g, '')
          return {
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text }]
            }]
          }
        })
        if (listItems.length > 0) {
          content.push({
            type: 'bulletList',
            content: listItems
          })
        }
      }
      // Single list item (when not wrapped in ul)
      else if (trimmed.match(/^<li[^>]*>(.*?)<\/li>/i)) {
        const text = trimmed.replace(/<li[^>]*>(.*?)<\/li>/i, '$1').replace(/<[^>]+>/g, '')
        // Skip - should be part of a list
      }
      // Plain text or other HTML
      else if (trimmed && !trimmed.startsWith('<')) {
        content.push({
          type: 'paragraph',
          content: [{ type: 'text', text: trimmed }]
        })
      }
    }

    return {
      type: 'doc',
      content: content.length > 0 ? content : []
    }
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
   * @returns Promise<CreatePostResponse> - The created draft data
   * @throws {Error} When draft creation fails
   * 
   * NOTE: This endpoint works on the PUBLICATION domain, not global substack.com
   * The API requires empty POST first, then PUT to update with content
   */
  async createPost(postData: CreatePostRequest): Promise<CreatePostResponse> {
    // Step 1: Create an empty draft (POST /api/v1/drafts)
    // Note: draft_bylines is required (can be empty array for single author)
    const draftResponse = await this.httpClient.post<{
      id: number
      draft_title?: string
      draft_subtitle?: string
      draft_body?: string
      publication_id: number
      created_at: string
      draft_updated_at: string
      slug?: string
      canonical_url?: string
    }>('/api/v1/drafts', {
      draft_bylines: []
    })

    const draftId = draftResponse.id

    // Step 2: If there's content, update the draft (PUT /api/v1/drafts/{id})
    if (postData.title || postData.body_html) {
      // Convert HTML to Substack's JSON document format
      const bodyJson = this.htmlToSubstackJson(postData.body_html || '')
      
      const updatePayload = {
        // Basic content
        draft_title: postData.title,
        draft_subtitle: postData.subtitle,
        draft_body: JSON.stringify(bodyJson), // Must be stringified JSON!
        type: postData.type || 'newsletter',
        audience: postData.audience || 'everyone',
        
        // Editor and structure
        editor_v2: postData.editor_v2 ?? true, // Use modern editor by default
        subscriber_set_id: 1, // Default subscriber set
        should_send_email: true, // For publishing
        
        // SEO and Social Media
        description: postData.description,
        cover_image: postData.cover_image,
        search_engine_title: postData.search_engine_title,
        search_engine_description: postData.search_engine_description,
        social_title: postData.social_title,
        
        // Section
        draft_section_id: postData.section_id,
        section_chosen: !!postData.section_id,
        
        // Advanced settings
        free_unlock_required: postData.free_unlock_required ?? false,
        exempt_from_archive_paywall: postData.exempt_from_archive_paywall ?? false,
        explicit: postData.explicit ?? false,
        meter_type: postData.meter_type || 'none', // Must be string, not null!
        hide_from_feed: postData.hide_from_feed ?? false,
        should_send_free_preview: postData.should_send_free_preview ?? false,
        show_guest_bios: postData.show_guest_bios ?? false,
        write_comment_permissions: postData.write_comment_permissions || 'everyone',
        default_comment_sort: postData.default_comment_sort || 'best_first'
      }

      // Use a proper PUT request
      const updatedDraft = await this.httpClient.request<any>(
        `/api/v1/drafts/${draftId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updatePayload)
        }
      )

      // Return the updated draft response
      return {
        id: updatedDraft.id || draftId,
        title: updatedDraft.draft_title || postData.title,
        subtitle: updatedDraft.draft_subtitle || postData.subtitle,
        slug: updatedDraft.slug || '',
        body_html: updatedDraft.body_html || postData.body_html,
        type: updatedDraft.type || postData.type || 'newsletter',
        is_published: false,
        post_date: updatedDraft.draft_updated_at || draftResponse.draft_updated_at,
        canonical_url: updatedDraft.canonical_url || '',
        audience: updatedDraft.audience || postData.audience || 'everyone',
        publication_id: updatedDraft.publication_id || draftResponse.publication_id,
        cover_image: postData.cover_image,
        description: postData.description,
        postTags: postData.postTags,
        reactions: {},
        restacks: 0
      }
    }

    // Return just the empty draft if no content provided
    return {
      id: draftId,
      title: '',
      subtitle: postData.subtitle,
      slug: draftResponse.slug || '',
      body_html: '',
      type: postData.type || 'newsletter',
      is_published: false,
      post_date: draftResponse.draft_updated_at,
      canonical_url: draftResponse.canonical_url || '',
      audience: postData.audience || 'everyone',
      publication_id: draftResponse.publication_id,
      cover_image: postData.cover_image,
      description: postData.description,
      postTags: postData.postTags,
      reactions: {},
      restacks: 0
    }
  }

  /**
   * Update an existing draft
   * @param postData - The post data to update (must include id)
   * @returns Promise<CreatePostResponse> - The updated draft data
   * @throws {Error} When draft update fails
   */
  async updatePost(postData: UpdatePostRequest): Promise<CreatePostResponse> {
    const { id, ...updateData } = postData
    
    // Convert HTML to Substack's JSON format
    const bodyJson = updateData.body_html ? this.htmlToSubstackJson(updateData.body_html) : undefined
    
    // Use PUT to update the draft - include all metadata
    const updatePayload = {
      // Basic content
      draft_title: updateData.title,
      draft_subtitle: updateData.subtitle,
      draft_body: bodyJson ? JSON.stringify(bodyJson) : undefined, // Must be stringified JSON!
      type: updateData.type,
      audience: updateData.audience,
      
      // SEO and Social Media
      description: updateData.description,
      cover_image: updateData.cover_image,
      search_engine_title: updateData.search_engine_title,
      search_engine_description: updateData.search_engine_description,
      social_title: updateData.social_title,
      
      // Section
      draft_section_id: updateData.section_id,
      section_chosen: !!updateData.section_id,
      
      // Advanced settings (only if provided)
      ...(updateData.editor_v2 !== undefined && { editor_v2: updateData.editor_v2 }),
      ...(updateData.free_unlock_required !== undefined && { free_unlock_required: updateData.free_unlock_required }),
      ...(updateData.exempt_from_archive_paywall !== undefined && { exempt_from_archive_paywall: updateData.exempt_from_archive_paywall }),
      ...(updateData.explicit !== undefined && { explicit: updateData.explicit }),
      ...(updateData.meter_type && { meter_type: updateData.meter_type }),
      ...(updateData.hide_from_feed !== undefined && { hide_from_feed: updateData.hide_from_feed }),
      ...(updateData.should_send_free_preview !== undefined && { should_send_free_preview: updateData.should_send_free_preview }),
      ...(updateData.show_guest_bios !== undefined && { show_guest_bios: updateData.show_guest_bios }),
      ...(updateData.write_comment_permissions && { write_comment_permissions: updateData.write_comment_permissions }),
      ...(updateData.default_comment_sort && { default_comment_sort: updateData.default_comment_sort })
    }

    const response = await this.httpClient.request<any>(
      `/api/v1/drafts/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(updatePayload)
      }
    )

    return {
      id: response.id || id,
      title: updateData.title || response.draft_title,
      subtitle: updateData.subtitle,
      slug: response.slug || '',
      body_html: updateData.body_html || '', // We sent HTML, return what we sent
      type: response.type || 'newsletter',
      is_published: response.is_published || false,
      post_date: response.draft_updated_at || new Date().toISOString(),
      canonical_url: response.canonical_url || '',
      audience: response.audience || 'everyone',
      publication_id: response.publication_id,
      cover_image: updateData.cover_image,
      description: updateData.description,
      postTags: updateData.postTags,
      reactions: response.reactions || {},
      restacks: response.restacks || 0
    }
  }

  /**
   * Publish a draft
   * @param postId - The draft ID to publish
   * @param options - Publishing options
   * @returns Promise<CreatePostResponse> - The published post data
   * @throws {Error} When publishing fails
   * 
   * ✅ STATUS: WORKING! (Discovered Oct 3, 2025)
   * The publish endpoint is incredibly simple - just one parameter: `send` (boolean)
   * All content, metadata, section, etc. must be set in the draft BEFORE publishing.
   * Publishing is just a state flip: draft → published
   * 
   * Key insight: All draft data is already saved via PUT /api/v1/drafts/{id}
   * The publish call only needs to know whether to send email or not.
   */
  async publishPost(postId: number, options: PublishPostRequest = {}): Promise<CreatePostResponse> {
    // The payload is minimal - just whether to send email
    // All other data (section_id, audience, metadata, etc.) must be set in the draft first!
    // ⚠️ IMPORTANT: section_id MUST be set in draft or publish will fail with 400!
    const publishPayload = {
      send: options.send_email ?? false  // true = send email, false = just publish
    }

    const response = await this.httpClient.post<any>(
      `/api/v1/drafts/${postId}/publish`,
      publishPayload
    )
    
    return this.transformToPostResponse(response)
  }

  /**
   * Transform API response to CreatePostResponse format
   */
  private transformToPostResponse(response: any): CreatePostResponse {
    return {
      id: response.id,
      title: response.title || response.draft_title,
      subtitle: response.subtitle || response.draft_subtitle,
      slug: response.slug || '',
      body_html: response.body_html || response.draft_body,
      type: response.type || 'newsletter',
      is_published: response.is_published || false,
      post_date: response.post_date || response.draft_updated_at || new Date().toISOString(),
      canonical_url: response.canonical_url || '',
      audience: response.audience || 'everyone',
      publication_id: response.publication_id,
      cover_image: response.cover_image,
      description: response.description,
      postTags: response.postTags,
      reactions: response.reactions || {},
      restacks: response.restacks || 0
    }
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
   * Delete a draft
   * @param postId - The draft ID to delete
   * @throws {Error} When deletion fails
   * 
   * TODO: Find the actual delete endpoint - might be DELETE /api/v1/drafts/{id}
   */
  async deletePost(postId: number): Promise<void> {
    try {
      await this.httpClient.request(`/api/v1/drafts/${postId}`, {
        method: 'DELETE'
      })
    } catch (error) {
      throw new Error(
        `Failed to delete draft ${postId}. ` +
        `The delete endpoint may require investigation. ` +
        `Error: ${(error as Error).message}`
      )
    }
  }
}
