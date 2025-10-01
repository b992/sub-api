# Substack API

[![npm version](https://badge.fury.io/js/substack-api.svg)](https://badge.fury.io/js/substack-api)
[![Documentation Status](https://readthedocs.org/projects/substack-api/badge/?version=latest)](https://substack-api.readthedocs.io/en/latest/?badge=latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A modern, type-safe TypeScript client for the Substack API. Build newsletter automation, content management tools, and subscriber analytics with ease.

## QuickStart

```bash
npm install substack-api
```

```typescript
import { SubstackClient } from 'substack-api';

// Initialize client with your API key
const client = new SubstackClient({
  apiKey: 'your-connect-sid-cookie-value',
  hostname: 'example.substack.com'
});

// Get your profile and iterate through posts
const profile = await client.ownProfile();
for await (const post of profile.posts({ limit: 5 })) {
  console.log(`📄 "${post.title}" - ${post.publishedAt?.toLocaleDateString()}`);
}

// Create a draft post with perfect formatting ✅
const draft = await profile.newPost()
  .setTitle('My Post')
  .setBodyHtml('<h2>Title</h2><p>Content here</p>')
  .setDescription('SEO description')
  .createDraft();
console.log(`Draft created! Edit at: yoursite.substack.com/publish/post/${draft.id}`);

// Test connectivity
const isConnected = await client.testConnectivity();
```

## ✨ Features

- 📝 **Draft Creation** - Create posts with HTML content, metadata, and perfect formatting ✅
- 🔍 **Content Discovery** - Fetch posts, notes, comments with full metadata ✅
- 👤 **Profile Management** - Get profile info, followers, following ✅
- 💬 **Notes & Comments** - Create notes with links, manage comments ✅
- ⚠️ **Publishing** - API publishing partially working, use UI for now ([details](PUBLISH_API_STATUS.md))

> 📌 **Default Section**: Posts default to "Whiskey & Flowers 🌸" (ID: 194500)

## Documentation

📚 **[Complete Documentation →](https://substack-api.readthedocs.io/)**

- [Installation Guide](docs/installation.md) - Setup and requirements
- [QuickStart Tutorial](docs/quickstart.md) - Get started in minutes  
- [API Reference](docs/api-reference.md) - Complete method documentation
- [Entity Model](docs/entity-model.md) - Modern object-oriented API
- [Examples](docs/examples.md) - Real-world usage patterns
- [Post Creation Example](EXAMPLE_POST_CREATION.ts) - Full workflow demo
- [Publish API Status](PUBLISH_API_STATUS.md) - Current implementation status

## License

MIT
