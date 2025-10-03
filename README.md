# Substack API Client (Enhanced Fork)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![GitHub](https://img.shields.io/badge/GitHub-b992%2Fsub--api-blue)](https://github.com/b992/sub-api)

A modern, type-safe TypeScript client for the Substack API. Enhanced fork with multi-publication support, complete metadata handling, and n8n integration. Build newsletter automation, content management tools, and subscriber analytics with ease.

> **Note**: This is an enhanced fork of [jakub-k-slys/substack-api](https://github.com/jakub-k-slys/substack-api) with additional features for multi-publication management and workflow automation.

## ✨ Features

- **📝 Complete Post Management** - Create drafts, publish posts with full metadata and formatting
- **🎨 Rich Content Support** - HTML content, cover images, SEO optimization, social media previews
- **🔍 Content Discovery** - Fetch posts, notes, comments with full metadata
- **👤 Profile Management** - Access profiles, followers, and followees
- **💬 Notes & Comments** - Create formatted notes with links, manage comments
- **🔧 Multi-Publication Support** - Manage multiple Substack publications with separate configs
- **⚡ Fully Type-Safe** - Complete TypeScript support with IntelliSense
- **🚀 n8n Ready** - Direct integration with n8n workflows (no HTTP server needed!)

## Quick Start

### Installation

**Option 1: From GitHub (Recommended)**
```bash
npm install git+https://github.com/b992/sub-api.git
```

**Option 2: From Local Clone**
```bash
# Clone the repository
git clone https://github.com/b992/sub-api.git
cd sub-api
npm install
npm run build

# Link it globally
npm link

# In your project
npm link @b992/substack-api
```

**Option 3: From npm (if published)**
```bash
npm install @b992/substack-api
```

### Basic Usage

```typescript
import { SubstackClient } from '@b992/substack-api';

// Initialize client
const client = new SubstackClient({
  apiKey: 'your-connect-sid-cookie-value',
  hostname: 'example.substack.com',
  defaultSectionId: 123456  // Optional but recommended for publishing
});

// Get your profile
const profile = await client.ownProfile();

// Fetch recent posts
for await (const post of profile.posts({ limit: 5 })) {
  console.log(`📄 "${post.title}" - ${post.publishedAt?.toLocaleDateString()}`);
}

// Create and publish a post
const published = await profile.newPost()
  .setTitle('My First API Post')
  .setBodyHtml('<h2>Introduction</h2><p>Hello from the API!</p>')
  .setDescription('SEO-friendly description')
  .setSocialTitle('📝 My First API Post')
  .setSection(123456)  // Required for publishing
  .publish();

console.log(`✅ Published at: ${published.canonical_url}`);

// Create a quick note
const note = await profile.newNote()
  .paragraph()
  .text('Just published a new post! ')
  .link(published.canonical_url, 'Check it out →')
  .publish();

// Test connectivity
const isConnected = await client.testConnectivity();
console.log(`Connected: ${isConnected}`);
```

## Recent Updates 🆕

### October 2025

- ✅ **Default Section ID Configuration** - Set once in config, no need to specify every time
- ✅ **Complete Metadata Support** - SEO optimization, social media previews, comment settings
- ✅ **Enhanced Post Builder** - Fluent API for creating posts with rich metadata
- ✅ **Multi-Publication Support** - Manage multiple Substack publications easily
- ✅ **Full Publishing API** - Create drafts and publish posts programmatically
- ✅ **Improved Type Safety** - Complete TypeScript types for all metadata fields

### Key Features

**Post Creation with Full Metadata:**
```typescript
const post = await profile.newPost()
  // Basic content
  .setTitle('Complete Guide')
  .setSubtitle('Everything you need to know')
  .setBodyHtml('<h2>Introduction</h2><p>Content here</p>')
  
  // SEO optimization
  .setSearchEngineTitle('SEO-optimized title for Google')
  .setSearchEngineDescription('Custom description for search results')
  
  // Social media
  .setSocialTitle('📱 Share-friendly title')
  .setCoverImage('https://example.com/cover.jpg')
  
  // Organization
  .setSection(194500)  // Required for publishing!
  .addTag('tutorial')
  .addTag('api')
  
  // Comments & settings
  .setCommentPermissions('everyone')
  .setCommentSort('best_first')
  .setExplicit(false)
  
  .publish();  // or .createDraft() to save as draft
```

**Multi-Publication Setup:**
```typescript
// Manage multiple publications
const poetryClient = new SubstackClient({
  apiKey: process.env.POETRY_API_KEY!,
  hostname: 'mypoetry.substack.com',
  defaultSectionId: 162170
});

const techClient = new SubstackClient({
  apiKey: process.env.TECH_API_KEY!,
  hostname: 'techblog.substack.com',
  defaultSectionId: 789012
});

// Use them independently - each has its own default section!
await poetryClient.ownProfile()
  .then(p => p.newPost().setTitle("Poem").setBodyHtml("<p>...</p>").publish());

await techClient.ownProfile()
  .then(p => p.newPost().setTitle("Article").setBodyHtml("<p>...</p>").publish());
```

## Documentation

📚 **[Complete Documentation →](https://substack-api.readthedocs.io/)**

### Essential Guides

- **[Installation Guide](docs/installation.md)** - Setup and requirements
- **[QuickStart Tutorial](docs/quickstart.md)** - Get started in 5 minutes
- **[Configuration Guide](docs/configuration.md)** - Single and multi-publication setup
- **[n8n Integration](docs/n8n-integration.md)** - Workflow automation with n8n
- **[API Reference](docs/api-reference.md)** - Complete method documentation
- **[Entity Model](docs/entity-model.md)** - Modern object-oriented API
- **[Examples](docs/examples.md)** - Real-world usage patterns

### Code Examples

Check out the `examples/` directory for working examples:
- Post creation with metadata
- Multi-publication management
- Note publishing with links
- Draft workflow management

## Getting Credentials

You need two things to use this library:

### 1. Hostname
Your Substack publication URL without `https://`:
- Example: `myawesome.substack.com`

### 2. API Key (connect.sid cookie)

1. Open your Substack publication in a browser
2. Login to your account
3. Open Developer Tools (F12)
4. Go to **Application** → **Cookies**
5. Find the `connect.sid` cookie
6. Copy the **entire value** (starts with `s%3A...`)

### 3. Section ID (Optional but Recommended)

For publishing posts, you need a section ID:

1. Go to your publication settings → Sections
2. Click on a section
3. The URL shows: `/publish/settings/sections/{id}`
4. Use that ID in your config

## Configuration

### Environment Variables (Recommended)

Create a `.env` file:

```bash
# Single publication
SUBSTACK_API_KEY=s%3Ayour-cookie-value
SUBSTACK_HOSTNAME=yourpub.substack.com
SUBSTACK_DEFAULT_SECTION_ID=123456

# Multiple publications (use prefixes)
POETRY_API_KEY=s%3A...
POETRY_HOSTNAME=poetry.substack.com
POETRY_DEFAULT_SECTION_ID=162170

TECH_API_KEY=s%3A...
TECH_HOSTNAME=tech.substack.com
TECH_DEFAULT_SECTION_ID=789012
```

### In Code

```typescript
import { SubstackClient } from '@b992/substack-api';

const client = new SubstackClient({
  apiKey: process.env.SUBSTACK_API_KEY!,
  hostname: process.env.SUBSTACK_HOSTNAME!,
  defaultSectionId: parseInt(process.env.SUBSTACK_DEFAULT_SECTION_ID!)
});
```

See the [Configuration Guide](docs/configuration.md) for complete details.

## Use Cases

### Content Automation
- Schedule and publish posts automatically
- Cross-post to multiple publications
- Generate content with AI and publish to Substack

### Analytics & Monitoring
- Track subscriber growth
- Monitor post performance
- Analyze engagement metrics

### Workflow Integration
- Integrate with n8n for visual automation
- Build custom publishing workflows
- Automate content distribution

### Multi-Publication Management
- Manage multiple Substack publications from one codebase
- Different configs for different publications
- Centralized content management

## n8n Integration

This library works directly in n8n workflows without needing an HTTP server!

```javascript
// In n8n Code node
const { SubstackClient } = require('substack-api');

const client = new SubstackClient({
  apiKey: process.env.SUBSTACK_API_KEY,
  hostname: process.env.SUBSTACK_HOSTNAME,
  defaultSectionId: 162170
});

const profile = await client.ownProfile();
const post = await profile.newPost()
  .setTitle($json.title)
  .setBodyHtml($json.content)
  .publish();

return [{ json: { postId: post.id, url: post.canonical_url } }];
```

See the [n8n Integration Guide](docs/n8n-integration.md) for complete workflows and examples.

## Development

### Setup

```bash
git clone https://github.com/b992/sub-api.git
cd sub-api
npm install
```

### Commands

```bash
npm run build          # Build TypeScript
npm test               # Run all tests
npm run test:unit      # Unit tests only
npm run test:integration  # Integration tests
npm run test:e2e       # End-to-end tests
npm run lint           # Check code style
npm run format         # Format code
```

### Testing Strategy

- **Unit Tests** - Fast, isolated component tests
- **Integration Tests** - Test against sample API responses
- **E2E Tests** - Live testing with real API (read-only)

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

## Architecture

- **Service-Oriented** - Clean separation of concerns
- **Entity-Based API** - Domain objects with methods
- **Functional Programming** - Uses fp-ts and io-ts for validation
- **Iterator Pattern** - Async iterators for pagination
- **Builder Pattern** - Fluent API for constructing posts and notes
- **Type-Safe** - Full TypeScript support throughout

## Security

- ⚠️ Never commit your API credentials to version control
- ✅ Use environment variables for credentials
- ✅ Add `.env` to `.gitignore`
- ✅ Rotate API cookies periodically
- ✅ Use read-only operations when possible

See [SECURITY.md](SECURITY.md) for reporting security vulnerabilities.

## API Coverage

### Implemented ✅
- ✅ Profile management (own profile, public profiles)
- ✅ Post management (create, update, publish, list, fetch)
- ✅ Draft workflow (create, update, list, delete)
- ✅ Note publishing (formatted notes with links)
- ✅ Comment management (list, fetch)
- ✅ Complete metadata support (SEO, social, settings)
- ✅ Multi-publication support
- ✅ Connectivity testing
- ✅ Pagination via async iterators

### Planned 🚧
- 🚧 Scheduled publishing
- 🚧 Subscriber management
- 🚧 Analytics data
- 🚧 Section listing API

## Requirements

- Node.js 14+
- TypeScript 5+ (for development)
- Valid Substack account with publication

## Troubleshooting

### Common Issues

**"Please choose a section" error:**
- Solution: Set `defaultSectionId` in config or call `.setSection(id)` before publishing

**401 Unauthorized:**
- Solution: Get a fresh `connect.sid` cookie from your browser

**Type errors:**
- Solution: Ensure you're using TypeScript 5+ and have proper type definitions

See the [Configuration Guide](docs/configuration.md) for more troubleshooting tips.

## Contributing

We welcome contributions! Please see:
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) - Community standards
- [CLAUDE.md](CLAUDE.md) - AI assistant guidance

## License

MIT License - see [LICENSE](LICENSE) for details

## Acknowledgments

- Built with [fp-ts](https://gcanti.github.io/fp-ts/) and [io-ts](https://gcanti.github.io/io-ts/)
- Inspired by the need for better Substack automation
- Community contributions and feedback

## Links

- **GitHub**: https://github.com/b992/sub-api
- **Original Project**: https://github.com/jakub-k-slys/substack-api (by Jakub Slys)
- **Issues**: https://github.com/b992/sub-api/issues

## Changelog

### v1.5.0 (Fork)
- ✨ Added default section ID configuration
- ✨ Enhanced multi-publication support
- ✨ Complete metadata support (SEO, social, comments)
- ✨ Improved n8n integration documentation
- 📚 Comprehensive Ubuntu installation guide
- 📚 Consolidated documentation structure

### v1.4.0 (Upstream)
- Original features from upstream repository

---

**Made with ❤️ for the Substack community**

*Enhanced fork by [b992](https://github.com/b992) • Original work by Jakub Slys*

*Want to automate your newsletter? This is the tool for you!* 🚀
