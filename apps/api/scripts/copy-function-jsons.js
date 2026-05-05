import { cpSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🔧 Starting Azure Functions deployment setup...\n');

const functions = ['search', 'suggest', 'book'];
let copiedCount = 0;

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

// Copy staticwebapp.config.json to dist root for Azure Static Web Apps to find runtime config
console.log('📋 Copying staticwebapp.config.json');
try {
  const configPath = join(__dirname, '..', '..', '..', 'staticwebapp.config.json');
  const distDestPath = join(__dirname, '..', 'dist', 'staticwebapp.config.json');
  if (!existsSync(configPath)) {
    throw new Error(`staticwebapp.config.json not found at ${configPath}`);
  }
  cpSync(configPath, distDestPath);
  console.log('  ✓ Copied staticwebapp.config.json to dist/\n');
  copiedCount++;
} catch (err) {
  console.warn(`  ⚠ Failed to copy staticwebapp.config.json: ${err.message}`);
  // Don't exit - this is a warning, not a critical failure
}

console.log(`✅ Function deployment setup complete! Processed ${functions.length} functions, copied ${copiedCount} files.`);
