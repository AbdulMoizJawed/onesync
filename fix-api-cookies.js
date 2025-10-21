const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing cookie handling in all API routes...\n');

// API routes that need fixing (excluding support/route.ts which is already fixed)
const routesToFix = [
  'app/api/publishing/route.ts',
  'app/api/artists/profile/route.ts',
  'app/api/artists/collaborations/[id]/route.ts',
  'app/api/artists/collaborations/route.ts',
  'app/api/profile/update-request/route.ts',
  'app/api/beats/route.ts',
  'app/api/mastering/check-status/route.ts',
  'app/api/admin/debug/route.ts',
  'app/api/admin/edits/route.ts',
  'app/api/admin/notifications/route.ts',
  'app/api/admin/users/route.ts',
  'app/api/mastering/analyze/route.ts',
  'app/api/admin/export/releases/route.ts'
];

let fixedCount = 0;

routesToFix.forEach(routePath => {
  const fullPath = path.join(__dirname, routePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let hasChanges = false;
    
    // Fix pattern 1: createRouteHandlerClient({ cookies })
    if (content.includes('createRouteHandlerClient({ cookies })')) {
      content = content.replace(
        /createRouteHandlerClient\(\{ cookies \}\)/g,
        'createRouteHandlerClient({ cookies: async () => await cookies() })'
      );
      hasChanges = true;
    }
    
    // Fix pattern 2: createRouteHandlerClient({ cookies: () => cookies() })
    if (content.includes('createRouteHandlerClient({ cookies: () => cookies() })')) {
      content = content.replace(
        /createRouteHandlerClient\(\{ cookies: \(\) => cookies\(\) \}\)/g,
        'createRouteHandlerClient({ cookies: async () => await cookies() })'
      );
      hasChanges = true;
    }
    
    if (hasChanges) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed: ${routePath}`);
      fixedCount++;
    } else {
      console.log(`⚪ Skipped: ${routePath} (no changes needed)`);
    }
  } else {
    console.log(`❌ Not found: ${routePath}`);
  }
});

console.log(`\n🎉 Fixed ${fixedCount} API routes!`);
console.log('\n📋 Summary:');
console.log('- All cookie handling issues should now be resolved');
console.log('- Next.js 15 async cookie requirements are now met');
console.log('- API routes should stop throwing cookie sync errors');
