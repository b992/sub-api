import type { HttpClient } from '../internal/http-client'
import type { CreatePostRequest, CreatePostResponse } from '../internal'
import type { PostService } from '../internal/services'

/**
 * Builder for creating Substack posts with a fluent interface
 * Similar to NoteBuilder but for full post creation
 */
export class PostBuilder {
  private title?: string
  private subtitle?: string
  private body_html: string = ''
  private type: 'newsletter' | 'podcast' | 'thread' = 'newsletter'
  private audience: 'everyone' | 'paid' | 'founding' = 'everyone'
  private description?: string
  private cover_image?: string
  private postTags?: string[]
  private is_published: boolean = false
  
  // SEO and Social Media
  private search_engine_title?: string
  private search_engine_description?: string
  private social_title?: string
  
  // Section
  private section_id?: number
  
  // Advanced Settings
  private write_comment_permissions?: 'everyone' | 'paid' | 'founding' | 'no_one'
  private default_comment_sort?: 'best_first' | 'newest_first' | 'oldest_first'
  private explicit?: boolean
  private hide_from_feed?: boolean

  constructor(
    private readonly client: HttpClient,
    private readonly postService: PostService
  ) {}

  /**
   * Set the post title
   */
  setTitle(title: string): PostBuilder {
    this.title = title
    return this
  }

  /**
   * Set the post subtitle
   */
  setSubtitle(subtitle: string): PostBuilder {
    this.subtitle = subtitle
    return this
  }

  /**
   * Set the post body HTML content
   */
  setBodyHtml(body_html: string): PostBuilder {
    this.body_html = body_html
    return this
  }

  /**
   * Set the post type
   */
  setType(type: 'newsletter' | 'podcast' | 'thread'): PostBuilder {
    this.type = type
    return this
  }

  /**
   * Set the post audience
   */
  setAudience(audience: 'everyone' | 'paid' | 'founding'): PostBuilder {
    this.audience = audience
    return this
  }

  /**
   * Set the post description
   */
  setDescription(description: string): PostBuilder {
    this.description = description
    return this
  }

  /**
   * Set the cover image URL
   */
  setCoverImage(cover_image: string): PostBuilder {
    this.cover_image = cover_image
    return this
  }

  /**
   * Set post tags
   */
  setTags(tags: string[]): PostBuilder {
    this.postTags = tags
    return this
  }

  /**
   * Add a single tag
   */
  addTag(tag: string): PostBuilder {
    if (!this.postTags) {
      this.postTags = []
    }
    this.postTags.push(tag)
    return this
  }

  /**
   * Set whether to publish immediately (default: false for draft)
   */
  setPublished(is_published: boolean): PostBuilder {
    this.is_published = is_published
    return this
  }

  /**
   * Set the section ID (default: 194500 - Whiskey & Flowers 🌸)
   */
  setSection(section_id: number): PostBuilder {
    this.section_id = section_id
    return this
  }

  /**
   * Set SEO title for search engines
   */
  setSearchEngineTitle(title: string): PostBuilder {
    this.search_engine_title = title
    return this
  }

  /**
   * Set SEO description for search engines
   */
  setSearchEngineDescription(description: string): PostBuilder {
    this.search_engine_description = description
    return this
  }

  /**
   * Set social media title (for Twitter, Facebook, etc.)
   */
  setSocialTitle(title: string): PostBuilder {
    this.social_title = title
    return this
  }

  /**
   * Set comment permissions
   */
  setCommentPermissions(permissions: 'everyone' | 'paid' | 'founding' | 'no_one'): PostBuilder {
    this.write_comment_permissions = permissions
    return this
  }

  /**
   * Set default comment sorting
   */
  setCommentSort(sort: 'best_first' | 'newest_first' | 'oldest_first'): PostBuilder {
    this.default_comment_sort = sort
    return this
  }

  /**
   * Mark content as explicit
   */
  setExplicit(explicit: boolean): PostBuilder {
    this.explicit = explicit
    return this
  }

  /**
   * Hide post from feed
   */
  setHideFromFeed(hide: boolean): PostBuilder {
    this.hide_from_feed = hide
    return this
  }

  /**
   * Create the post request object
   */
  build(): CreatePostRequest {
    if (!this.title) {
      throw new Error('Post title is required')
    }

    if (!this.body_html) {
      throw new Error('Post body HTML is required')
    }

    return {
      title: this.title,
      subtitle: this.subtitle,
      body_html: this.body_html,
      type: this.type,
      audience: this.audience,
      description: this.description,
      cover_image: this.cover_image,
      postTags: this.postTags,
      is_published: this.is_published,
      
      // SEO and Social Media
      search_engine_title: this.search_engine_title,
      search_engine_description: this.search_engine_description,
      social_title: this.social_title,
      
      // Section
      section_id: this.section_id,
      
      // Advanced Settings
      write_comment_permissions: this.write_comment_permissions,
      default_comment_sort: this.default_comment_sort,
      explicit: this.explicit,
      hide_from_feed: this.hide_from_feed
    }
  }

  /**
   * Create the post as a draft
   */
  async createDraft(): Promise<CreatePostResponse> {
    const postData = this.build()
    postData.is_published = false

    return await this.postService.createPost(postData)
  }

  /**
   * Create and publish the post immediately (convenience method)
   * 
   * This does two API calls internally:
   * 1. Creates draft with all content/metadata
   * 2. Publishes the draft (flips to published state)
   * 
   * ✅ WORKING! (Oct 3, 2025)
   */
  async publish(): Promise<CreatePostResponse> {
    const postData = this.build()
    // First create as draft with all content/metadata
    const draft = await this.postService.createPost(postData)
    
    // Then publish it (just flips the state)
    return await this.postService.publishPost(draft.id)
  }

  /**
   * Helper method to add basic HTML formatting to text
   */
  static formatAsHtml(text: string): string {
    return text
      .split('\n\n')
      .map(paragraph => `<p>${paragraph.trim()}</p>`)
      .join('\n')
  }

  /**
   * Convenience method to create a simple text post
   * Note: Requires a valid client and postService to be set later
   */
  static simplePost(title: string, content: string, subtitle?: string): Omit<PostBuilder, 'createDraft' | 'publish'> {
    const builder = new PostBuilder({} as HttpClient, {} as PostService)
    return builder
      .setTitle(title)
      .setBodyHtml(PostBuilder.formatAsHtml(content))
      .setSubtitle(subtitle || '')
  }
}
