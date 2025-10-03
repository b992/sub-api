# Gemini AI + n8n + Substack Server Guide

Quick guide for posting Gemini AI content to Substack via the Express server.

## Setup

### 1. Start the Server

```bash
# Set environment variables
export SUBSTACK_API_KEY="s%3Ayour-cookie"
export SUBSTACK_HOSTNAME="yourpub.substack.com"
export PORT=3000

# Start server
npm run server
```

Server will be available at `http://localhost:3000`

## n8n Workflows

### Option 1: Simple Gemini → Substack

**Workflow:** `[Gemini AI] → [HTTP Request: Post Note]`

#### Gemini AI Node Output:
```json
{
  "text": "Just discovered something amazing! 🌟",
  "imageUrl": "https://storage.googleapis.com/gemini/image.jpg"
}
```

#### HTTP Request Node:
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/notes/gemini`
- **Body**: JSON
- **JSON**: `{{ $json }}`

That's it! The `/api/notes/gemini` endpoint automatically detects the format.

### Option 2: Advanced Workflow with Formatting

**Workflow:** `[Trigger] → [Gemini AI] → [Format] → [HTTP Request]`

#### Function Node (Format):
```javascript
// Extract Gemini output
const geminiOutput = $input.first().json;

// Format for server
return [{
  json: {
    content: geminiOutput.text || geminiOutput.content,
    imageUrl: geminiOutput.imageUrl || geminiOutput.image?.url,
    linkUrl: geminiOutput.sourceUrl,  // If Gemini provides sources
    linkText: "Source"
  }
}];
```

#### HTTP Request Node:
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/notes/publish`
- **Body**: `{{ $json }}`

## API Endpoints

### POST /api/notes/gemini

**Smart endpoint that auto-detects Gemini format**

Accepts any of these formats:
```json
// Format 1
{
  "text": "Content",
  "imageUrl": "https://..."
}

// Format 2
{
  "content": "Content",
  "image": { "url": "https://..." }
}

// Format 3
{
  "generated_text": "Content",
  "generated_image": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "note": {
    "id": "note_123"
  },
  "processed": {
    "contentLength": 150,
    "hadImage": true,
    "paragraphs": 2
  }
}
```

### POST /api/notes/publish

**Full control over note formatting**

```json
{
  "content": "Main text content\n\nSecond paragraph",
  "imageUrl": "https://example.com/image.jpg",
  "images": ["url1", "url2"],  // Multiple images
  "linkUrl": "https://example.com",
  "linkText": "Read more →"
}
```

## Testing

### Test with curl:

```bash
# Simple note
curl -X POST http://localhost:3000/api/notes/gemini \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Testing from curl!",
    "imageUrl": "https://picsum.photos/800/600"
  }'

# Note with link
curl -X POST http://localhost:3000/api/notes/publish \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Check out this amazing article!",
    "linkUrl": "https://example.com",
    "linkText": "Read full article"
  }'

# Multiple images
curl -X POST http://localhost:3000/api/notes/publish \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Image gallery post",
    "images": [
      "https://picsum.photos/800/600?random=1",
      "https://picsum.photos/800/600?random=2"
    ]
  }'
```

### Test with Python:

```python
import requests

# Post from Gemini-style output
gemini_response = {
    "text": "AI generated insight about productivity",
    "imageUrl": "https://example.com/diagram.png"
}

response = requests.post(
    'http://localhost:3000/api/notes/gemini',
    json=gemini_response
)

print(response.json())
```

## Complete n8n Example Workflows

### 1. Daily AI Insight

**Trigger** → **Gemini AI** → **HTTP Request**

```javascript
// Gemini AI Node prompt:
"Generate a short, insightful thought about {topic} in 2-3 sentences. Make it inspiring."

// HTTP Request automatically posts to Substack
```

### 2. Image Commentary

**Trigger** → **Gemini Vision** → **HTTP Request**

```javascript
// Gemini Vision analyzes an image
// Output: { "text": "This image shows...", "imageUrl": "..." }

// HTTP Request posts analysis with the image
```

### 3. Multi-Source Aggregator

**RSS** → **Gemini AI** → **Format** → **HTTP Request**

```javascript
// RSS feeds into Gemini
// Gemini summarizes multiple articles
// Posts summary as Substack note
```

## Error Handling

### In n8n Function Node:

```javascript
try {
  const response = $input.first().json;
  
  if (!response.text && !response.content) {
    throw new Error('No text content in Gemini response');
  }
  
  return [{
    json: {
      text: response.text || response.content,
      imageUrl: response.imageUrl || null
    }
  }];
} catch (error) {
  // Send to error handling node
  return [{
    json: {
      error: error.message,
      originalData: $input.first().json
    }
  }];
}
```

### Server Responses:

**Success:**
```json
{
  "success": true,
  "note": { "id": "note_123" }
}
```

**Error:**
```json
{
  "error": "content is required"
}
```

## Advanced: Scheduled AI Content

### n8n Workflow:

1. **Schedule Trigger** (daily at 9am)
2. **Gemini AI** (generate daily tip)
3. **HTTP Request** (post to Substack)
4. **Slack Notification** (confirm posted)

### Gemini Prompt:
```
Generate a short productivity tip for {day_of_week}. 
Keep it under 100 words and make it actionable.
Include relevant emoji.
```

## Production Deployment

### Run server as systemd service:

```bash
# /etc/systemd/system/substack-server.service
[Unit]
Description=Substack API Server
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/home/youruser/sub-api
Environment=SUBSTACK_API_KEY=s%3A...
Environment=SUBSTACK_HOSTNAME=yourpub.substack.com
Environment=PORT=3000
ExecStart=/usr/bin/npm run server
Restart=always

[Install]
WantedBy=multi-user.target
```

### Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable substack-server
sudo systemctl start substack-server
```

### Check logs:
```bash
sudo journalctl -u substack-server -f
```

## Security

⚠️ **Important:**
- Never expose the server publicly without authentication
- Use HTTPS in production (via nginx reverse proxy)
- Keep your API keys secure
- Consider adding rate limiting

## Troubleshooting

### "No text content found" Error

Check your Gemini output format:
```javascript
console.log(JSON.stringify($input.first().json, null, 2));
```

The endpoint looks for: `text`, `content`, `generated_text`, or `message`

### Images Not Showing

- Verify image URL is publicly accessible
- Check image URL format in Gemini response
- Try the `/api/notes/publish` endpoint with explicit `imageUrl` field

### Server Not Responding

```bash
# Check if server is running
curl http://localhost:3000/health

# Check logs
npm run server

# Verify environment variables
echo $SUBSTACK_API_KEY
echo $SUBSTACK_HOSTNAME
```

## More Examples

See the main [server README](./README.md) for:
- Full API documentation
- More endpoints (posts, drafts, profile)
- Multi-publication support
- Docker deployment
- Python client examples

---

**🎉 You're ready to automate Substack with Gemini AI!**

Questions? Check the main docs or open an issue on GitHub.

