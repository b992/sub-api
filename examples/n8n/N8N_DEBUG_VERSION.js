// Add this AT THE TOP of your n8n code node to verify which version is loaded

const { SubstackClient } = require('@b992/substack-api');

// Check package version
try {
  const packageJson = require('@b992/substack-api/package.json');
  console.log('📦 Package version:', packageJson.version);
} catch (e) {
  console.log('⚠️ Could not read package.json');
}

// Check where the module is loaded from
try {
  const modulePath = require.resolve('@b992/substack-api');
  console.log('📂 Module loaded from:', modulePath);
} catch (e) {
  console.log('⚠️ Could not resolve module path');
}

// Check if ImageService has the fix
try {
  const ImageService = require('@b992/substack-api/dist/internal/services/image-service').ImageService;
  const imageServiceCode = ImageService.toString();
  
  if (imageServiceCode.includes('globalPost')) {
    console.log('✅ ImageService HAS the fix (uses globalPost)');
  } else if (imageServiceCode.includes('this.client.post')) {
    console.log('❌ ImageService DOES NOT have the fix (still uses this.client.post)');
    console.log('⚠️ n8n is using OLD VERSION - package not updated properly!');
  }
} catch (e) {
  console.log('⚠️ Could not check ImageService:', e.message);
}

console.log('---');

// Now continue with your normal code...

