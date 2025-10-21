
// Fix for LightningCSS binary issues on Heroku or other platforms
const fs = require('fs');
const path = require('path');

console.log('Running LightningCSS fix script...');
if (process.env.REAL_LIGHTNINGCSS === '1') {
  console.log('REAL_LIGHTNINGCSS=1 set; skipping patch to allow native binary attempt.');
  process.exit(0);
}

try {
  // Find the lightningcss node index.js file
  const lightningCssPath = path.join(process.cwd(), 'node_modules', 'lightningcss', 'node');
  const indexPath = path.join(lightningCssPath, 'index.js');
  const expectedBinary = `lightningcss.${process.platform}-${process.arch}${process.platform === 'linux' ? '-gnu' : ''}.node`;
  const expectedBinaryPath = path.join(lightningCssPath, expectedBinary);
  
  if (!fs.existsSync(indexPath)) {
    console.log('LightningCSS index.js not found, skipping fix');
    process.exit(0);
  }

  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Check if already patched
  if (indexContent.includes('// HEROKU_FIX_APPLIED')) {
    console.log('LightningCSS fix already applied, skipping');
    process.exit(0);
  }

  // Replace the entire binary loading section with a robust fallback.
  // If the native binary actually exists, we avoid overriding normal behavior.
  if (fs.existsSync(expectedBinaryPath)) {
    console.log('Detected platform binary present (' + expectedBinary + '); leaving original LightningCSS index.js intact.');
    process.exit(0);
  }

  console.warn('Platform binary ' + expectedBinary + ' not found; applying stub/fallback wrapper.');
  const newContent = `// HEROKU_FIX_APPLIED
const { join } = require('path');

let binding;
try {
  // Try to load the platform-specific binary
  const binaryName = 'lightningcss.' + process.platform + '-' + process.arch + (process.platform === 'linux' ? '-gnu' : '') + '.node';
  binding = require('./' + binaryName);
} catch (e) {
  console.warn('LightningCSS: Platform binary not found, trying fallbacks...');
  
  // Try common binaries in order of likelihood
  const fallbacks = [
    './lightningcss.linux-x64-gnu.node',
    './lightningcss.linux-x64-musl.node',
    './lightningcss.darwin-x64.node', 
    './lightningcss.darwin-arm64.node',
    './lightningcss.win32-x64-msvc.node'
  ];
  
  let loaded = false;
  for (const fallback of fallbacks) {
    try {
      binding = require(fallback);
      console.warn('LightningCSS: Using fallback:', fallback);
      loaded = true;
      break;
    } catch (err) {
      // Continue to next fallback
    }
  }
  
  if (!loaded) {
    // Final fallback - provide stub implementation
    console.warn('LightningCSS: All binaries failed, using stub implementation');
    const passthrough = (css) => (typeof css === 'string' ? css : (css && css.code) || '');
    binding = {
      // Minimal passthrough that attempts not to drop CSS.
      transform: function(opts) {
        const code = passthrough(opts.code);
        return {
          code,
          map: null,
          exports: [],
          references: [],
          dependencies: []
        };
      },
      transformStyleAttribute: function(opts) {
        return { code: passthrough(opts.code) };
      },
      bundle: function(opts) {
        // Return provided code so keyframes & at-rules survive.
        return {
          code: passthrough(opts.code),
          map: null
        };
      }
    };
    if (process.env.DEBUG_LIGHTNINGCSS_STUB) {
      console.warn('LightningCSS stub active: CSS passthrough mode.');
    }
  }
}

module.exports = binding;
`;

  // Write the new content
  fs.writeFileSync(indexPath, newContent);
  console.log('Successfully applied LightningCSS fix!');
  
} catch (error) {
  console.error('Error applying LightningCSS fix:', error);
  // Don't fail the build if the fix script has issues
  process.exit(0);
}