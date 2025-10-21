#!/usr/bin/env node
/**
 * Quick verification script to see if LightningCSS native binary loads.
 * Usage: node scripts/verify-lightningcss.js
 * Optional env:
 *   REAL_LIGHTNINGCSS=1 (skip patch and test real binary)
 */

function status(msg) { console.log('[lightningcss-verify]', msg); }

try {
  const lc = require('lightningcss');
  status('Module loaded: ' + Object.keys(lc).join(', '));
  const sample = '.x{color:red;:where(.y){display:flex}}';
  if (typeof lc.transform === 'function') {
    const out = lc.transform({ code: Buffer.from(sample), minify: true });
    status('Transform output length: ' + (out.code ? out.code.length : 'unknown'));
    status('Transform output (utf8): ' + out.code.toString('utf8'));
  } else {
    status('No transform function available (likely stub).');
  }
} catch (e) {
  status('Failed to load or transform: ' + e.message);
  process.exitCode = 1;
}
