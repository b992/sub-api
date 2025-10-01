/**
 * Internal post creation API types based on Substack's actual endpoints
 */

export interface CreatePostRequest {
  title: string
  subtitle?: string
  body_html: string
  type: 'newsletter' | 'podcast' | 'thread'
  audience?: 'everyone' | 'paid' | 'founding'
  is_published?: boolean
  post_date?: string
  slug?: string
  description?: string
  cover_image?: string
  should_send_free_preview?: boolean
  write_comment_permissions?: 'everyone' | 'paid' | 'founding'
  section_id?: number
  postTags?: string[]
}

export interface CreatePostResponse {
  id: number
  title: string
  subtitle?: string
  slug: string
  body_html: string
  type: 'newsletter' | 'podcast' | 'thread'
  is_published: boolean
  post_date: string
  canonical_url: string
  audience: string
  publication_id: number
  cover_image?: string
  description?: string
  postTags?: string[]
  reactions?: Record<string, number>
  restacks?: number
}

export interface UpdatePostRequest extends Partial<CreatePostRequest> {
  id: number
}

export interface PublishPostRequest {
  section_id?: number // Section to publish to (required for some publications)
  send_email?: boolean
  email_subject?: string
  trigger_at?: string // For scheduling
  audience?: 'everyone' | 'paid' | 'founding'
  comments_enabled?: boolean
  social_preview_image?: string
  tags?: string[]
}

export interface PostDraftInfo {
  id: number
  title: string
  subtitle?: string
  draft_updated_at: string
  word_count?: number
  publication_id: number
}

export interface PostManagementResponse<T> {
  posts: T[]
  total_count: number
  has_more: boolean
  next_cursor?: string
}
