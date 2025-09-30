import type { HttpClient } from '../internal/http-client'
import type { CreatePostRequest, CreatePostResponse } from '../internal'

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

  constructor(private readonly client: HttpClient) {}

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
      is_published: this.is_published
    }
  }

  /**
   * Create the post as a draft
   * 
   * INVESTIGATION RESULTS:
   * Post creation APIs are not yet discovered. See PostService.createPost() for details.
   */
  async createDraft(): Promise<CreatePostResponse> {
    const postData = this.build()
    postData.is_published = false

    throw new Error(
      'PostBuilder: Post creation not yet implemented. ' +
      '\nSee PostService.createPost() for detailed investigation findings. ' +
      '\nWORKAROUND: Create posts manually in Substack, then use update APIs.'
    )
  }

  /**
   * Create and publish the post immediately
   * 
   * INVESTIGATION RESULTS:
   * Post creation APIs are not yet discovered. See PostService.createPost() for details.
   */
  async publish(): Promise<CreatePostResponse> {
    const postData = this.build()
    postData.is_published = true

    throw new Error(
      'PostBuilder: Post creation not yet implemented. ' +
      '\nSee PostService.createPost() for detailed investigation findings. ' +
      '\nWORKAROUND: Create posts manually in Substack, then use publish APIs.'
    )
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
   */
  static simplePost(title: string, content: string, subtitle?: string): PostBuilder {
    const builder = new PostBuilder({} as HttpClient) // Will be set by the profile
    return builder
      .setTitle(title)
      .setBodyHtml(PostBuilder.formatAsHtml(content))
      .setSubtitle(subtitle || '')
  }
}
