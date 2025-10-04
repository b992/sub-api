# Fork Information

This is an enhanced fork of the original Substack API client.

## Original Project

- **Repository**: https://github.com/jakub-k-slys/substack-api
- **Author**: Jakub Slys
- **License**: MIT

## This Fork

- **Repository**: https://github.com/b992/sub-api
- **Maintainer**: [b992](https://github.com/b992)
- **Version**: 1.5.0+
- **Package Name**: `@b992/substack-api`

## Key Enhancements in This Fork

### v1.5.0 (October 2025)

1. **Default Section ID Configuration**
   - Set default section once in config
   - No need to specify section for every post
   - Perfect for multi-publication workflows

2. **Complete Metadata Support**
   - SEO optimization fields (search engine title/description)
   - Social media customization (social title, cover images)
   - Comment settings (permissions, sorting)
   - Advanced settings (explicit, hide from feed, etc.)

3. **Multi-Publication Support**
   - Manage multiple Substack publications
   - Separate configs per publication
   - Environment variable patterns for easy setup

4. **Enhanced Documentation**
   - Comprehensive Ubuntu installation guide
   - n8n integration documentation
   - Configuration guide with real-world examples
   - Consolidated docs structure

5. **Developer Experience**
   - Better TypeScript types
   - More examples
   - Clearer error messages
   - Improved testing

## Installation

### From GitHub (Recommended)
```bash
npm install git+https://github.com/b992/sub-api.git
```

### From Local Clone
```bash
git clone https://github.com/b992/sub-api.git
cd sub-api
npm install
npm run build
npm link

# In your project
npm link @b992/substack-api
```

## Usage

```typescript
import { SubstackClient } from '@b992/substack-api';

const client = new SubstackClient({
  apiKey: process.env.SUBSTACK_API_KEY!,
  hostname: process.env.SUBSTACK_HOSTNAME!,
  defaultSectionId: 123456  // New: default section support!
});

// Now you can publish without specifying section every time
const post = await client.ownProfile()
  .then(p => p.newPost()
    .setTitle("My Post")
    .setBodyHtml("<p>Content</p>")
    .publish()  // Uses default section automatically!
  );
```

## Staying in Sync with Upstream

To pull updates from the original repository:

```bash
# Add upstream remote (one time)
git remote add upstream https://github.com/jakub-k-slys/substack-api.git

# Fetch and merge upstream changes
git fetch upstream
git merge upstream/main

# Resolve any conflicts and commit
```

## Contributing

Contributions are welcome! Please:
1. Fork this repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - same as the original project

## Acknowledgments

- **Original Author**: Jakub Slys - for creating the excellent base library
- **Contributors**: Everyone who contributed to the original project
- **Community**: Substack automation enthusiasts

## Support

- **Issues**: https://github.com/b992/sub-api/issues
- **Original Project Issues**: https://github.com/jakub-k-slys/substack-api/issues

---

**Thank you to Jakub Slys for the original work!** This fork builds upon that solid foundation.

