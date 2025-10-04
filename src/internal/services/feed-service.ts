import type { SubstackNote } from '../types'
import type { HttpClient } from '../http-client'

/**
 * Service responsible for feed-related HTTP operations
 */
export class FeedService {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Get notes from the "For You" feed with cursor-based pagination
   * @param options - Pagination options with optional cursor
   * @returns Promise with notes and next cursor
   * @throws {Error} When feed cannot be retrieved
   */
  async getForYouFeed(options?: { cursor?: string }): Promise<{
    notes: SubstackNote[]
    nextCursor?: string
  }> {
    const url = options?.cursor
      ? `/api/v1/reader/feed?tab=for-you&type=base&cursor=${encodeURIComponent(options.cursor)}`
      : '/api/v1/reader/feed?tab=for-you&type=base'

    const response = await this.httpClient.get<{
      items?: SubstackNote[]
      nextCursor?: string
    }>(url)

    return {
      notes: response.items || [],
      nextCursor: response.nextCursor
    }
  }

  /**
   * Get notes from the following feed with cursor-based pagination
   * @param options - Pagination options with optional cursor
   * @returns Promise with notes and next cursor
   * @throws {Error} When feed cannot be retrieved
   */
  async getFollowingFeed(options?: { cursor?: string }): Promise<{
    notes: SubstackNote[]
    nextCursor?: string
  }> {
    const url = options?.cursor
      ? `/api/v1/feed/following?cursor=${encodeURIComponent(options.cursor)}`
      : '/api/v1/feed/following'

    const response = await this.httpClient.get<{
      items?: SubstackNote[]
      nextCursor?: string
    }>(url)

    return {
      notes: response.items || [],
      nextCursor: response.nextCursor
    }
  }
}

