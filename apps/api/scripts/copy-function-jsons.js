import { cpSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🔧 Starting Azure Functions deployment setup...\n');

const functions = ['search', 'suggest', 'book'];
let copiedCount = 0;

// Copy function.json files and flatten structure for Azure Static Web Apps
functions.forEach((fn) => {
  console.log(`📦 Processing function: ${fn}`);

  const srcJson = join('src', 'functions', fn, 'function.json');
  const srcJs = join('dist', 'src', 'functions', `${fn}.js`);
  const destDir = join('dist', fn);
  const destJson = join(destDir, 'function.json');
  const destJs = join(destDir, `${fn}.js`);

  try {
    // Create function directory
    mkdirSync(destDir, { recursive: true });

    // Copy function.json
    if (!existsSync(srcJson)) {
      throw new Error(`function.json not found at ${srcJson}`);
    }
    cpSync(srcJson, destJson);
    console.log(`  ✓ Copied function.json`);
    copiedCount++;

    // Copy compiled .js file if it exists
    if (existsSync(srcJs)) {
      cpSync(srcJs, destJs);
      console.log(`  ✓ Copied ${fn}.js`);
      copiedCount++;
    } else {
      console.warn(`  ⚠ ${fn}.js not found (may not be compiled yet)`);
    }
  } catch (err) {
    console.error(`  ✗ Failed to process ${fn}:`, err.message);
    process.exit(1);
  }
  console.log('');
});

// Copy host.json to dist root
console.log('📋 Copying host.json');
try {
  if (!existsSync('host.json')) {
    throw new Error('host.json not found');
  }
  cpSync('host.json', 'dist/host.json');
  console.log('  ✓ Copied host.json to dist/\n');
  copiedCount++;
} catch (err) {
  console.error('  ✗ Failed to copy host.json:', err.message);
  process.exit(1);
}

console.log(`✅ Function deployment setup complete! Processed ${functions.length} functions, copied ${copiedCount} files.`);
