import { HttpClient } from '../../src/internal/http-client'

// Mock fetch globally
global.fetch = jest.fn()

describe('HttpClient', () => {
  let client: HttpClient
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    jest.clearAllMocks()
    client = new HttpClient('https://test.substack.com', {
      apiKey: 'test-api-key',
      hostname: 'test.substack.com'
    })
  })

  describe('constructor', () => {
    it('should throw error when apiKey is missing', () => {
      expect(
        () => new HttpClient('https://test.com', { apiKey: '', hostname: 'test.com' })
      ).toThrow('apiKey is required in SubstackConfig')
    })

    it('should use provided base URL', () => {
      const clientWithCustomBaseUrl = new HttpClient('https://custom.example.com', {
        apiKey: 'test-key',
        hostname: 'default.substack.com'
      })
      expect(clientWithCustomBaseUrl).toBeDefined()
    })

    it('should set up correct base URL and cookie', () => {
      const clientInstance = client as unknown as { baseUrl: string; cookie: string }
      expect(clientInstance.baseUrl).toBe('https://test.substack.com')
      expect(clientInstance.cookie).toBe('connect.sid=test-api-key')
    })
  })

  describe('request', () => {
    it('should make successful request', async () => {
      const mockResponse = { data: 'test' }
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      } as unknown as Response)

      const result = await client.request('/test')

      expect(mockFetch).toHaveBeenCalledWith('https://test.substack.com/test', {
        headers: {
          Cookie: 'connect.sid=test-api-key',
          'Content-Type': 'application/json'
        }
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as unknown as Response)

      await expect(client.request('/test')).rejects.toThrow('HTTP 404: Not Found')
    })

    it('should include custom headers', async () => {
      const mockResponse = { data: 'test' }
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      } as unknown as Response)

      await client.request('/test', {
        headers: {
          'Custom-Header': 'custom-value'
        }
      })

      // Verify that fetch was called with the custom header
      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toBe('https://test.substack.com/test')
      expect(options?.headers).toHaveProperty('Custom-Header', 'custom-value')
    })
  })

  describe('get', () => {
    it('should make GET request', async () => {
      const mockResponse = { data: 'test' }
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      } as unknown as Response)

      const result = await client.get('/test')

      expect(mockFetch).toHaveBeenCalledWith('https://test.substack.com/test', {
        headers: {
          Cookie: 'connect.sid=test-api-key',
          'Content-Type': 'application/json'
        }
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('post', () => {
    it('should make POST request with data', async () => {
      const mockResponse = { success: true }
      const postData = { title: 'Test Post' }

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      } as unknown as Response)

      const result = await client.post('/test', postData)

      expect(mockFetch).toHaveBeenCalledWith('https://test.substack.com/test', {
        method: 'POST',
        body: JSON.stringify(postData),
        headers: {
          Cookie: 'connect.sid=test-api-key',
          'Content-Type': 'application/json'
        }
      })
      expect(result).toEqual(mockResponse)
    })

    it('should make POST request without data', async () => {
      const mockResponse = { success: true }

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      } as unknown as Response)

      const result = await client.post('/test')

      expect(mockFetch).toHaveBeenCalledWith('https://test.substack.com/test', {
        method: 'POST',
        body: undefined,
        headers: {
          Cookie: 'connect.sid=test-api-key',
          'Content-Type': 'application/json'
        }
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('globalPost', () => {
    it('should make POST request to global Substack domain', async () => {
      const mockResponse = { url: 'https://s3.amazonaws.com/image.png' }
      const postData = { image: 'data:image/png;base64,...' }

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      } as unknown as Response)

      const result = await client.globalPost('/api/v1/image', postData)

      // Should use https://substack.com, NOT the publication subdomain
      expect(mockFetch).toHaveBeenCalledWith('https://substack.com/api/v1/image', {
        method: 'POST',
        body: JSON.stringify(postData),
        headers: {
          Cookie: 'connect.sid=test-api-key',
          'Content-Type': 'application/json'
        }
      })
      expect(result).toEqual(mockResponse)
    })

    it('should make POST request to global domain for attachment creation', async () => {
      const mockResponse = { id: 'attachment-123' }
      const postData = { url: 'https://s3.amazonaws.com/image.png', type: 'image' }

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      } as unknown as Response)

      const result = await client.globalPost('/api/v1/comment/attachment', postData)

      expect(mockFetch).toHaveBeenCalledWith('https://substack.com/api/v1/comment/attachment', {
        method: 'POST',
        body: JSON.stringify(postData),
        headers: {
          Cookie: 'connect.sid=test-api-key',
          'Content-Type': 'application/json'
        }
      })
      expect(result).toEqual(mockResponse)
    })
  })
})
