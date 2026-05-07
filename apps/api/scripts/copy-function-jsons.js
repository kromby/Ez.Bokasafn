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

// npm will install dependencies from package.json and package-lock.json at runtime

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

// Write a clean package.json for deployment — Oryx needs engines.node to detect the runtime,
// and workspace:* dependencies must be stripped (pnpm syntax not understood by npm/Oryx).
const srcPkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
const deployPkg = {
  name: srcPkg.name,
  version: srcPkg.version,
  private: true,
  type: srcPkg.type,
  engines: { node: '22' },
  dependencies: Object.fromEntries(
    Object.entries(srcPkg.dependencies ?? {}).filter(([, v]) => !String(v).startsWith('workspace:'))
  ),
};
writeFileSync(join(__dirname, '..', 'dist', 'package.json'), JSON.stringify(deployPkg, null, 2));
console.log('📦 Wrote clean deployment package.json');

console.log(`✅ Function deployment setup complete! Processed ${functions.length} functions, copied ${copiedCount} files.`);
