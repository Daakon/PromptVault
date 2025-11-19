import path from 'node:path';
import { existsSync, rmSync, cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopDir = path.resolve(__dirname, '..');
const webDistDir = path.resolve(desktopDir, '../web/dist');
const staticDir = path.resolve(desktopDir, 'static');

if (!existsSync(webDistDir)) {
  throw new Error('apps/web/dist not found. Run `npm run build:web` first.');
}

if (existsSync(staticDir)) {
  rmSync(staticDir, { recursive: true, force: true });
}

cpSync(webDistDir, staticDir, { recursive: true });
console.log(`Copied web build from ${webDistDir} -> ${staticDir}`);
