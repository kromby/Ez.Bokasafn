import { cpSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🔧 Starting Azure Functions deployment setup...\n');

const functions = ['search', 'suggest', 'book'];
let copiedCount = 0;

// Remove node_modules from dist - Azure will install dependencies via package.json
const distNodeModules = join(__dirname, '..', 'dist', 'node_modules');
if (existsSync(distNodeModules)) {
  cpSync(distNodeModules, join(__dirname, '..', 'dist', '.node_modules_backup'), { recursive: true, force: true });
  // Actually, let's just leave it - it won't hurt and might speed up deployment
}

// Copy shared lib directory so imports resolve correctly
const srcLib = join(__dirname, '..', 'dist', 'src', 'lib');
const destLib = join(__dirname, '..', 'dist', 'lib');

if (existsSync(srcLib)) {
  cpSync(srcLib, destLib, { recursive: true, force: true });
  console.log('📦 Copied shared lib directory');
  copiedCount++;
}

// Copy package.json so Azure can install dependencies
const srcPackageJson = join(__dirname, '..', 'package.json');
const destPackageJson = join(__dirname, '..', 'dist', 'package.json');
const srcPnpmLock = join(__dirname, '..', '..', '..', 'pnpm-lock.yaml');
const destPnpmLock = join(__dirname, '..', 'dist', 'pnpm-lock.yaml');

if (existsSync(srcPackageJson)) {
  cpSync(srcPackageJson, destPackageJson);
  console.log('📦 Copied package.json');
  copiedCount++;
}

if (existsSync(srcPnpmLock)) {
  cpSync(srcPnpmLock, destPnpmLock);
  console.log('📦 Copied pnpm-lock.yaml');
  copiedCount++;
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
