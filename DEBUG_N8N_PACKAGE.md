# 🔧 n8n Package Update Troubleshooting

## Problem

Post creation fails with "fetch failed" at the very first draft creation step, even though:
- ✅ Profile loads successfully (GET request works)
- ❌ Draft creation fails (POST request fails)

This suggests n8n is using a cached/old version of the package.

## Solution: Force Package Update

### Method 1: Complete Reinstall

```bash
# 1. Build fresh package
cd /Users/gaborbitter/Documents/sub-api
npm run build
npm pack

# This creates: b992-substack-api-1.5.0.tgz

# 2. In n8n, completely remove old package
cd /path/to/n8n
npm uninstall @b992/substack-api

# 3. Clear npm cache
npm cache clean --force

# 4. Install fresh
npm install /Users/gaborbitter/Documents/sub-api/b992-substack-api-1.5.0.tgz

# 5. Restart n8n
# (Important! n8n caches modules in memory)
```

### Method 2: Use Local Path During Development

Instead of packing, use direct link:

```bash
cd /path/to/n8n
npm uninstall @b992/substack-api
npm install /Users/gaborbitter/Documents/sub-api

# Or create symlink
npm link /Users/gaborbitter/Documents/sub-api
```

### Method 3: Verify What n8n Is Using

Check which version n8n actually loaded:

```javascript
// Add this at the top of your n8n code node
const packageJson = require('@b992/substack-api/package.json');
console.log('Package version:', packageJson.version);
console.log('Package path:', require.resolve('@b992/substack-api'));

// Also log the ImageService to check if it has globalPost
const { SubstackClient } = require('@b992/substack-api');
console.log('SubstackClient methods:', Object.getOwnPropertyNames(SubstackClient.prototype));
```

## Alternative: Test Without Image First

To isolate the problem, try publishing **without** a cover image:

```javascript
// In your n8n code
const input = {
  title: "Test Post Without Image",
  content: "<p>Testing without cover image</p>",
  // coverImage: undefined,  // <-- Remove this
  sectionId: 176365
};

const post = await profile.newPost()
  .setTitle(input.title)
  .setBodyHtml(input.content)
  .setSection(parseInt(input.sectionId))
  .publish();
```

If this works, the issue is definitely the image upload routing.  
If this fails, there's a more fundamental issue with draft creation.

## Deep Debug: Add Logging to SDK

Temporarily add debug logging to see exactly what's failing:

### Edit `src/internal/http-client.ts`:

```typescript
private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  // ADD THIS
  console.log('🔍 HTTP Request:', {
    url,
    method: options.method || 'GET',
    hasBody: !!options.body,
    headers: Object.keys(options.headers || {})
  });

  try {
    const response = await fetch(url, {
      headers: {
        Cookie: this.cookie,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })

    // ADD THIS
    console.log('✅ HTTP Response:', {
      url,
      status: response.status,
      ok: response.ok
    });

    if (!response.ok) {
      // ... existing error handling
    }

    return response.json()
  } catch (error) {
    // ADD THIS
    console.error('❌ HTTP Error:', {
      url,
      error: error.message,
      cause: error.cause
    });
    throw error;
  }
}
```

Then rebuild and reinstall.

## Common Issues

### Issue 1: n8n Module Cache

**Symptom**: Changes don't take effect even after reinstall  
**Solution**: Restart n8n completely

```bash
# If using systemd
sudo systemctl restart n8n

# If running manually
pkill -f n8n
n8n start
```

### Issue 2: Wrong Package Path

**Symptom**: n8n loads from global node_modules instead of local  
**Solution**: Check n8n's package.json

```bash
cd /path/to/n8n
cat package.json | grep substack
# Should show: "@b992/substack-api": "file:/Users/gaborbitter/Documents/sub-api/b992-substack-api-1.5.0.tgz"
```

### Issue 3: Permission Issues

**Symptom**: npm install fails with EACCES  
**Solution**: Check ownership

```bash
ls -la /path/to/n8n/node_modules/@b992
# Should be owned by your user, not root
```

### Issue 4: Network/DNS Issues

**Symptom**: "fetch failed" with no status code  
**Solution**: Test DNS resolution

```bash
# From the machine running n8n
nslookup thegodsandmonsters.substack.com
curl -v https://thegodsandmonsters.substack.com/api/v1/subscription \
  -H "Cookie: connect.sid=YOUR_COOKIE"
```

## Quick Test Script

Create `test-gods-post.ts` to test outside n8n:

```typescript
import { SubstackClient } from './src'

const API_KEY = 's%3Aw_JqH1OwRTbSYFZpSVRsoiunqORPrmvT.cbXS44BJpaS1bPuu%2F0FTLYho8%2BEONR6G8aw2vH5Q48w'

async function test() {
  console.log('Testing Gods & Monsters post creation...')
  
  const client = new SubstackClient({
    apiKey: API_KEY,
    hostname: 'thegodsandmonsters.substack.com',
  })

  console.log('1. Loading profile...')
  const profile = await client.ownProfile()
  console.log('✅ Profile:', profile.name)

  console.log('\n2. Creating post WITHOUT image...')
  try {
    const post = await profile.newPost()
      .setTitle('Test Post - No Image')
      .setBodyHtml('<p>Testing without image</p>')
      .setSection(176365)
      .publish()
    
    console.log('✅ Post created:', post.id, post.canonical_url)
  } catch (err) {
    console.error('❌ Post creation failed:', err.message)
    throw err
  }

  console.log('\n3. Creating post WITH base64 image...')
  const smallImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  
  try {
    const postWithImage = await profile.newPost()
      .setTitle('Test Post - With Image')
      .setBodyHtml('<p>Testing with tiny image</p>')
      .setCoverImage(smallImage)
      .setSection(176365)
      .publish()
    
    console.log('✅ Post with image created:', postWithImage.id, postWithImage.canonical_url)
  } catch (err) {
    console.error('❌ Post with image failed:', err.message)
    console.error('Stack:', err.stack)
    throw err
  }

  console.log('\n✅ All tests passed!')
}

test().catch(console.error)
```

Run it:
```bash
npx tsx test-gods-post.ts
```

## Expected Behavior After Fix

You should see:
```
🔍 HTTP Request: { url: 'https://thegodsandmonsters.substack.com/api/v1/subscription', method: 'GET' }
✅ HTTP Response: { url: '...', status: 200 }

🔍 HTTP Request: { url: 'https://thegodsandmonsters.substack.com/api/v1/drafts', method: 'POST' }
✅ HTTP Response: { url: '...', status: 200 }

🔍 HTTP Request: { url: 'https://substack.com/api/v1/image', method: 'POST' }
✅ HTTP Response: { url: '...', status: 200 }
```

## Next Steps

1. ✅ SDK is fixed and built
2. ⏳ **YOU ARE HERE** → Update package in n8n
3. ⏳ Test without image first
4. ⏳ Test with image
5. 🎉 Success!

---

Let me know what you find! The logs will tell us exactly where it's failing.

