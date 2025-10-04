// EMERGENCY VERSION CHECK
// Run this RIGHT NOW to see what version n8n is actually using!

try {
  const pkg = require('@b992/substack-api/package.json');
  const pkgPath = require.resolve('@b992/substack-api');
  
  console.log('╔════════════════════════════════════════╗');
  console.log('║   CURRENT SDK VERSION IN N8N           ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  console.log('Version:', pkg.version);
  console.log('Path:', pkgPath);
  console.log('');
  
  if (pkgPath.includes('/tmp/sub-api/')) {
    console.log('❌ PROBLEM: Using old /tmp/ version!');
    console.log('');
    console.log('FIX:');
    console.log('1. cd to n8n install directory');
    console.log('2. npm uninstall @b992/substack-api');
    console.log('3. rm -rf /tmp/sub-api');
    console.log('4. npm cache clean --force');
    console.log('5. npm install /tmp/b992-substack-api-1.6.0.tgz');
    console.log('6. sudo systemctl restart n8n');
  } else if (pkg.version === '1.6.0') {
    console.log('✅ CORRECT: v1.6.0 with all fixes!');
  } else {
    console.log('⚠️  WARNING: Version is', pkg.version, 'but should be 1.6.0');
    console.log('');
    console.log('Deploy v1.6.0:');
    console.log('1. npm uninstall @b992/substack-api');
    console.log('2. npm cache clean --force');
    console.log('3. npm install /tmp/b992-substack-api-1.6.0.tgz');
    console.log('4. sudo systemctl restart n8n');
  }
  
  return [{ json: { 
    version: pkg.version, 
    path: pkgPath,
    isCorrectVersion: pkg.version === '1.6.0',
    isOldPath: pkgPath.includes('/tmp/sub-api/')
  }}];
  
} catch (error) {
  console.log('❌ ERROR:', error.message);
  console.log('Package might not be installed!');
  return [{ json: { error: error.message }}];
}
