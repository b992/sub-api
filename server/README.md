# Substack API Server 🚀

**FastAPI-style HTTP server** wrapping the Substack TypeScript client!

This server exposes REST endpoints that let you interact with Substack from any language or tool (Python, curl, n8n, Postman, etc.)

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Environment Variables

```bash
export SUBSTACK_API_KEY="s%3Ayour-connect-sid-cookie"
export SUBSTACK_HOSTNAME="yourpub.substack.com"
export SUBSTACK_DEFAULT_SECTION_ID="162170"
export PORT=3000  # Optional, defaults to 3000
```

### 3. Start the Server

```bash
npm run server
```

Or with auto-reload during development:

```bash
npm run server:dev
```

The server will start on `http://localhost:3000` 🎉

---

## API Endpoints

### Health Check

```bash
GET /health
```

Check if the server is running and properly configured.

**Response:**
```json
{
  "status": "ok",
  "configured": true,
  "hostname": "yourpub.substack.com",
  "defaultSection": "162170"
}
```

---

### Profile

#### Get Your Profile

```bash
GET /api/profile
```

**Response:**
```json
{
  "success": true,
  "profile": {
    "id": 123,
    "name": "Your Name",
    "handle": "yourhandle",
    "bio": "Your bio",
    "avatarUrl": "https://...",
    "followersCount": 1234
  }
}
```

---

### Posts

#### Publish a Post

```bash
POST /api/posts/publish
Content-Type: application/json

{
  "title": "My Awesome Post",
  "content": "<h2>Hello World</h2><p>This is my post content in HTML</p>",
  "subtitle": "A subtitle for the post",
  "description": "SEO description",
  "socialTitle": "Social media title",
  "section": 162170,  // Optional if default is set
  "sendEmail": false  // Optional, default false
}
```

**Response:**
```json
{
  "success": true,
  "post": {
    "id": 175187713,
    "title": "My Awesome Post",
    "url": "https://yourpub.substack.com/p/my-awesome-post",
    "isPublished": true
  }
}
```

**Example with curl:**
```bash
curl -X POST http://localhost:3000/api/posts/publish \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Post",
    "content": "<p>Hello from curl!</p>"
  }'
```

**Example with Python:**
```python
import requests

response = requests.post('http://localhost:3000/api/posts/publish', json={
    'title': 'Test Post from Python',
    'content': '<p>Hello from Python!</p>',
    'subtitle': 'Posted via API'
})

print(response.json())
```

#### Create a Draft (Not Published)

```bash
POST /api/posts/draft
Content-Type: application/json

{
  "title": "Draft Post",
  "content": "<p>Draft content</p>",
  "subtitle": "Optional subtitle",
  "section": 162170
}
```

#### List Drafts

```bash
GET /api/posts/drafts?limit=10
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "drafts": [
    {
      "id": "123",
      "title": "My Draft",
      "subtitle": "Draft subtitle",
      "publishedAt": null,
      "url": "https://..."
    }
  ]
}
```

#### Delete a Post

```bash
DELETE /api/posts/175187713
```

**Response:**
```json
{
  "success": true,
  "message": "Post 175187713 deleted"
}
```

---

### Notes (Microblog)

#### Publish a Note

```bash
POST /api/notes/publish
Content-Type: application/json

{
  "content": "Just shipped a new feature! 🚀"
}
```

**Response:**
```json
{
  "success": true,
  "note": {
    "id": "note_abc123"
  }
}
```

#### List Your Notes

```bash
GET /api/notes?limit=20
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "notes": [
    {
      "id": "note_123",
      "body": "My note content",
      "likesCount": 5,
      "publishedAt": "2025-10-03T12:00:00Z",
      "author": {
        "id": 123,
        "name": "Your Name",
        "handle": "yourhandle",
        "avatarUrl": "https://..."
      }
    }
  ]
}
```

---

### Multi-Publication Support

#### Publish to Any Publication (Dynamic)

Use this endpoint to publish to different publications without restarting the server!

```bash
POST /api/dynamic/posts/publish
Content-Type: application/json

{
  "hostname": "otherpub.substack.com",
  "apiKey": "s%3A...",
  "defaultSectionId": 123456,
  "title": "Cross-Publication Post",
  "content": "<p>Published to a different pub!</p>",
  "subtitle": "Dynamic routing"
}
```

**Perfect for n8n workflows that manage multiple publications!**

---

## n8n Integration

### HTTP Request Node Setup

1. **Method**: POST
2. **URL**: `http://localhost:3000/api/posts/publish`
3. **Body**: JSON
4. **JSON Parameters**:
   ```json
   {
     "title": "{{ $json.title }}",
     "content": "{{ $json.html_content }}",
     "subtitle": "{{ $json.subtitle }}"
   }
   ```

### Example n8n Workflow

```
[Webhook/Trigger] → [Function Node: Format Content] → [HTTP Request: Publish]
```

**Function Node Code:**
```javascript
return {
  json: {
    title: $json.title,
    content: `<h2>${$json.heading}</h2><p>${$json.body}</p>`,
    subtitle: $json.subtitle || 'Auto-generated'
  }
};
```

---

## Error Responses

All errors return JSON with an `error` field:

```json
{
  "error": "title and content are required"
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad request (missing parameters)
- `404` - Not found
- `500` - Server error (check logs)

---

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SUBSTACK_API_KEY` | ✅ Yes | Your `connect.sid` cookie | `s%3A...` |
| `SUBSTACK_HOSTNAME` | ✅ Yes | Publication hostname | `yourpub.substack.com` |
| `SUBSTACK_DEFAULT_SECTION_ID` | ❌ No | Default section for posts | `162170` |
| `PORT` | ❌ No | Server port | `3000` |

---

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "server"]
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  substack-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - SUBSTACK_API_KEY=${SUBSTACK_API_KEY}
      - SUBSTACK_HOSTNAME=${SUBSTACK_HOSTNAME}
      - SUBSTACK_DEFAULT_SECTION_ID=${SUBSTACK_DEFAULT_SECTION_ID}
    restart: unless-stopped
```

---

## Production Deployment

### With PM2

```bash
npm install -g pm2
pm2 start npm --name "substack-api" -- run server
pm2 save
pm2 startup
```

### With systemd

Create `/etc/systemd/system/substack-api.service`:

```ini
[Unit]
Description=Substack API Server
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/sub-api
Environment=SUBSTACK_API_KEY=s%3A...
Environment=SUBSTACK_HOSTNAME=yourpub.substack.com
Environment=SUBSTACK_DEFAULT_SECTION_ID=162170
ExecStart=/usr/bin/npm run server
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable substack-api
sudo systemctl start substack-api
```

---

## Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Testing

### Curl Examples

```bash
# Health check
curl http://localhost:3000/health

# Get profile
curl http://localhost:3000/api/profile

# Publish post
curl -X POST http://localhost:3000/api/posts/publish \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"<p>Hello</p>"}'

# List drafts
curl http://localhost:3000/api/posts/drafts?limit=5

# Publish note
curl -X POST http://localhost:3000/api/notes/publish \
  -H "Content-Type: application/json" \
  -d '{"content":"Test note"}'
```

### Python Client

```python
import requests

class SubstackAPI:
    def __init__(self, base_url='http://localhost:3000'):
        self.base_url = base_url
    
    def publish_post(self, title, content, **kwargs):
        return requests.post(
            f'{self.base_url}/api/posts/publish',
            json={'title': title, 'content': content, **kwargs}
        ).json()
    
    def get_drafts(self, limit=10):
        return requests.get(
            f'{self.base_url}/api/posts/drafts',
            params={'limit': limit}
        ).json()

# Usage
api = SubstackAPI()
result = api.publish_post(
    title='From Python',
    content='<p>Hello from Python!</p>'
)
print(result)
```

---

## Security Considerations

⚠️ **Important Security Notes:**

1. **Never expose this server publicly without authentication!**
   - The server uses your cookies and can publish to your account
   - Add API key authentication or use a reverse proxy with auth

2. **HTTPS in Production**
   - Always use HTTPS (via nginx or similar)
   - Never send cookies over HTTP

3. **Environment Variables**
   - Use `.env` files (added to `.gitignore`)
   - Or use a secrets manager (AWS Secrets, Vault, etc.)

4. **Rate Limiting**
   - Consider adding rate limiting middleware
   - Substack may throttle excessive API calls

---

## Troubleshooting

### "SUBSTACK_API_KEY and SUBSTACK_HOSTNAME must be set"

Make sure your environment variables are set:
```bash
echo $SUBSTACK_API_KEY
echo $SUBSTACK_HOSTNAME
```

### "Please choose a section" error

Either:
1. Set `SUBSTACK_DEFAULT_SECTION_ID` env var, OR
2. Include `"section": 123456` in your POST request

### Cookie expired

Get a fresh `connect.sid` cookie from your browser and update the env var.

---

## Comparison with Client Library

| Feature | Server (REST API) | Client Library |
|---------|-------------------|----------------|
| **Language Support** | Any (HTTP) | TypeScript/Node.js only |
| **Deployment** | Run as service | Import as library |
| **n8n Integration** | HTTP Request node | Custom JS code |
| **Authentication** | Server-side cookie | Per-client cookie |
| **Use Case** | Webhooks, integrations | Direct TypeScript apps |

---

## What's Next?

### Planned Features

- [ ] API key authentication
- [ ] Rate limiting
- [ ] Webhook support (receive Substack events)
- [ ] Batch operations
- [ ] GraphQL endpoint
- [ ] WebSocket support for real-time updates

---

**Built with ❤️ for Substack automation!**

Perfect for Python developers, n8n users, and anyone who wants HTTP access to Substack! 🎉

