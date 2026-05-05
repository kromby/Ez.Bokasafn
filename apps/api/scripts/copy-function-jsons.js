import { cpSync } from 'fs';
import { join } from 'path';

const functions = ['search', 'suggest', 'book'];

functions.forEach((fn) => {
  const src = join('src', 'functions', fn, 'function.json');
  const dest = join('dist', 'src', 'functions', fn, 'function.json');
  try {
    cpSync(src, dest);
    console.log(`Copied ${src} -> ${dest}`);
  } catch (err) {
    console.error(`Failed to copy ${src}:`, err.message);
    process.exit(1);
  }
});
