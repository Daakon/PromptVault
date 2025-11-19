import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zip } from 'zip-a-folder';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.resolve(projectRoot, 'dist');
const zipPath = path.resolve(projectRoot, 'PromptVault-extension.zip');

if (!existsSync(distDir)) {
  throw new Error('dist folder not found. Run `npm run build` first.');
}

if (existsSync(zipPath)) {
  rmSync(zipPath);
}

await zip(distDir, zipPath);
console.log(`Packaged Chrome extension -> ${zipPath}`);
