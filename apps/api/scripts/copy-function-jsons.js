import { cpSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const functions = ['search', 'suggest', 'book'];

functions.forEach((fn) => {
  const src = join('src', 'functions', fn, 'function.json');
  const dest = join('dist', 'src', 'functions', fn, 'function.json');
  try {
    // Ensure destination directory exists
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest);
    console.log(`Copied ${src} -> ${dest}`);
  } catch (err) {
    console.error(`Failed to copy ${src}:`, err.message);
    process.exit(1);
  }
});

// Copy host.json to dist root
try {
  cpSync('host.json', 'dist/host.json');
  console.log('Copied host.json -> dist/host.json');
} catch (err) {
  console.error('Failed to copy host.json:', err.message);
  process.exit(1);
}
