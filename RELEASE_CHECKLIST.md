# Release Checklist

> **IMPORTANT:** Always bump version number before packaging!  
> npm caches by name+version, so same version = uses old cached code!

## Pre-Release Checklist

- [ ] All code changes committed
- [ ] Tests passing (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] **BUMP VERSION in `package.json`** ⚠️
  - Patch (bug fixes): 1.5.0 → 1.5.1
  - Minor (new features): 1.5.0 → 1.6.0
  - Major (breaking changes): 1.5.0 → 2.0.0

## Package & Deploy

```bash
# 1. Bump version
vim package.json  # Change "version": "1.X.X"

# 2. Build
npm run build

# 3. Remove old packages
rm -f *.tgz

# 4. Create new package
npm pack

# 5. Deploy to n8n
scp b992-substack-api-1.X.X.tgz server:/tmp/

# On server:
npm uninstall @b992/substack-api
npm cache clean --force  # ← CRITICAL! Clears old cached versions
npm install /tmp/b992-substack-api-1.X.X.tgz
sudo systemctl restart n8n
```

## Verify Deployment

Create n8n code node:

```javascript
const pkg = require('@b992/substack-api/package.json');
console.log('Version:', pkg.version);  // Should match your new version!

if (pkg.version !== '1.X.X') {
  throw new Error('Wrong version! npm cache issue?');
}

return [{ json: { version: pkg.version } }];
```

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.6.0 | 2025-10-04 | Fixed image upload domain, author bylines, HTML parser with inline formatting |
| 1.5.0 | 2025-10-04 | (Never deployed - version not bumped!) |
| 1.4.0 | Earlier | Previous working version |

## Common Mistakes

❌ **Forgetting to bump version**
- Result: npm uses old cached code
- Fix: Always increment version before `npm pack`

❌ **Not clearing npm cache**
- Result: npm might still use old code
- Fix: `npm cache clean --force` before install

❌ **Not restarting n8n**
- Result: Old code still in memory
- Fix: `sudo systemctl restart n8n` or `pm2 restart n8n`

## Quick Version Bump Script

```bash
# Add to package.json scripts:
"version:patch": "npm version patch",
"version:minor": "npm version minor", 
"version:major": "npm version major",
"release": "npm run build && npm pack"
```

Then just run:
```bash
npm run version:minor  # Bumps version automatically
npm run release        # Builds and packages
```
