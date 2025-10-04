import type { HttpClient } from '../http-client'

/**
 * Service responsible for reaction-related HTTP operations (likes, hearts, etc.)
 */
export class ReactionService {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Add a reaction (like) to a comment/note
   * @param commentId - The comment/note ID to react to
   * @param reactionType - The type of reaction (default: '❤')
   * @throws {Error} When reaction fails
   */
  async addReaction(commentId: number, reactionType: string = '❤'): Promise<void> {
    await this.httpClient.post<void>(
      `/api/v1/comment/${commentId}/reaction`,
      { emoji: reactionType }
    )
  }

  /**
   * Remove a reaction (unlike) from a comment/note
   * @param commentId - The comment/note ID to remove reaction from
   * @param reactionType - The type of reaction to remove (default: '❤')
   * @throws {Error} When removing reaction fails
   */
  async removeReaction(commentId: number, reactionType: string = '❤'): Promise<void> {
    await this.httpClient.request<void>(
      `/api/v1/comment/${commentId}/reaction`,
      {
        method: 'DELETE',
        body: JSON.stringify({ emoji: reactionType })
      }
    )
  }

  /**
   * Like a post by ID
   * @param postId - The post ID to like
   * @throws {Error} When like fails
   */
  async likePost(postId: number): Promise<void> {
    await this.httpClient.post<void>(
      `/api/v1/post/${postId}/reaction`,
      { emoji: '❤' }
    )
  }

  /**
   * Unlike a post by ID
   * @param postId - The post ID to unlike
   * @throws {Error} When unlike fails
   */
  async unlikePost(postId: number): Promise<void> {
    await this.httpClient.request<void>(
      `/api/v1/post/${postId}/reaction`,
      {
        method: 'DELETE',
        body: JSON.stringify({ emoji: '❤' })
      }
    )
  }
}

