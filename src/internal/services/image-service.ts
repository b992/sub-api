import type { HttpClient } from '../http-client'

/**
 * Service for handling image uploads to Substack
 */
export class ImageService {
  constructor(private readonly client: HttpClient) {}

  /**
   * Upload a base64 image to Substack's S3 storage
   * 
   * @param base64Image - Base64 encoded image string (with data URI prefix)
   * @param postId - The post ID to associate the image with
   * @returns The S3 URL of the uploaded image
   * 
   * @example
   * ```typescript
   * const url = await imageService.uploadImage(
   *   'data:image/png;base64,iVBORw0KGg...',
   *   123456
   * );
   * // Returns: 'https://substack-post-media.s3.amazonaws.com/public/images/abc123.png'
   * ```
   */
  async uploadImage(base64Image: string, postId: number): Promise<string> {
    if (!base64Image.startsWith('data:image/')) {
      throw new Error('Image must be a base64 data URI (e.g., data:image/png;base64,...)')
    }

    const response = await this.client.post<{ url: string }>('/api/v1/image', {
      image: base64Image,
      postId
    })

    if (!response.url) {
      throw new Error('Image upload failed: No URL returned')
    }

    return response.url
  }

  /**
   * Check if a string is a base64 image data URI
   */
  static isBase64Image(str: string): boolean {
    return str.startsWith('data:image/')
  }

  /**
   * Check if a string is a valid image URL
   */
  static isImageUrl(str: string): boolean {
    return str.startsWith('http://') || str.startsWith('https://')
  }
}

