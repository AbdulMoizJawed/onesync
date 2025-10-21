const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Next.js 15 cookie handling in all API routes...\n');

function fixFileContent(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;

  // Fix the problematic async pattern: cookies: async () => await cookies()
  if (content.includes('cookies: async () => await cookies()')) {
    content = content.replace(
      /cookies:\s*async\s*\(\)\s*=>\s*await\s*cookies\(\)/g,
      'cookies'
    );
    hasChanges = true;
  }

  // Also fix alternative patterns
  if (content.includes('{ cookies: async () => await cookies() }')) {
    content = content.replace(
      /\{\s*cookies:\s*async\s*\(\)\s*=>\s*await\s*cookies\(\)\s*\}/g,
      '{ cookies }'
    );
    hasChanges = true;
  }

  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
    return true;
  }

  return false;
}

// Find all API route files
function findApiRoutes(dir) {
  const files = [];
  
  function scanDirectory(directory) {
    const items = fs.readdirSync(directory);
    
    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item === 'route.ts' && fullPath.includes('/api/')) {
        files.push(fullPath);
      }
    }
  }
  
  scanDirectory(dir);
  return files;
}

const apiDir = path.join(__dirname, 'app', 'api');
const apiRoutes = findApiRoutes(apiDir);

console.log(`Found ${apiRoutes.length} API route files...\n`);

let fixedCount = 0;

apiRoutes.forEach(routePath => {
  if (fixFileContent(routePath)) {
    fixedCount++;
  }
});

console.log(`\n🎉 Fixed ${fixedCount} API routes!`);
console.log('\n📋 Summary:');
console.log('- Removed async/await pattern from cookie handlers');
console.log('- Updated to use direct cookies import for Next.js 15');
console.log('- All "nextCookies.get is not a function" errors should be resolved');
