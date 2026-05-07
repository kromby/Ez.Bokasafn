import { cpSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🔧 Starting Azure Functions deployment setup...\n');

const functions = ['search', 'suggest', 'book'];
let copiedCount = 0;

// Copy shared lib directory so imports resolve correctly
const srcLib = join(__dirname, '..', 'dist', 'src', 'lib');
const destLib = join(__dirname, '..', 'dist', 'lib');

if (existsSync(srcLib)) {
  cpSync(srcLib, destLib, { recursive: true, force: true });
  console.log('📦 Copied shared lib directory');
  copiedCount++;
}

// Copy node_modules for runtime dependencies
// Include workspace packages and all production dependencies needed by Azure Functions
const distNodeModules = join(__dirname, '..', 'dist', 'node_modules');
const rootNodeModules = join(__dirname, '..', '..', '..', 'node_modules');

if (existsSync(rootNodeModules)) {
  console.log('📦 Copying production dependencies to dist...');
  try {
    mkdirSync(distNodeModules, { recursive: true });
    // Copy node_modules structure, excluding dev-only packages
    const packages = ['@azure', '@ez-bokasafn', 'applicationinsights'];
    packages.forEach(pkg => {
      const src = join(rootNodeModules, pkg);
      const dest = join(distNodeModules, pkg);
      if (existsSync(src)) {
        cpSync(src, dest, { recursive: true, force: true });
      }
    });
    // Also copy .pnpm directory for pnpm compatibility
    const pnpmSrc = join(rootNodeModules, '.pnpm');
    const pnpmDest = join(distNodeModules, '.pnpm');
    if (existsSync(pnpmSrc)) {
      cpSync(pnpmSrc, pnpmDest, { recursive: true, force: true });
    }
    console.log('  ✓ Copied dependencies');
    copiedCount++;
  } catch (err) {
    console.error(`  ✗ Failed to copy dependencies: ${err.message}`);
  }
}

// Copy function.json files and flatten structure for Azure Static Web Apps
functions.forEach((fn) => {
  console.log(`📦 Processing function: ${fn}`);

  const srcJson = join(__dirname, '..', 'src', 'functions', fn, 'function.json');
  const srcJs = join(__dirname, '..', 'dist', 'src', 'functions', `${fn}.js`);
  const destDir = join(__dirname, '..', 'dist', fn);
  const destJson = join(destDir, 'function.json');
  const destJs = join(destDir, 'index.js');

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

console.log(`✅ Function deployment setup complete! Processed ${functions.length} functions, copied ${copiedCount} files.`);
