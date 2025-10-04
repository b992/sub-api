// n8n Code Node - Verify SDK Version
// Run this FIRST to confirm you have the latest package

const pkg = require('@b992/substack-api/package.json');
const packagePath = require.resolve('@b992/substack-api');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📦 SDK Package Info');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Version:', pkg.version);
console.log('Expected:', '1.6.0 (with all fixes)');
console.log('Location:', packagePath);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (pkg.version === '1.6.0') {
  console.log('✅ CORRECT VERSION - All fixes applied!');
  console.log('   • Image upload → global domain');
  console.log('   • Author bylines → auto userId');
  console.log('   • HTML parser → inline formatting');
} else {
  console.log('❌ OLD VERSION - Need to update!');
  console.log('');
  console.log('Deploy steps:');
  console.log('1. npm uninstall @b992/substack-api');
  console.log('2. npm cache clean --force');
  console.log('3. npm install /tmp/b992-substack-api-1.6.0.tgz');
  console.log('4. Restart n8n');
}

return [{ json: { version: pkg.version, location: packagePath, isCorrect: pkg.version === '1.6.0' } }];
