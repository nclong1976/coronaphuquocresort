import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'scripts', 'prisma-shim');

const targets = [
  path.join(rootDir, 'node_modules', '@prisma', 'client'),
  path.join(rootDir, 'backend', 'node_modules', '@prisma', 'client')
];

const filesToCopy = ['index.js', 'index.d.ts', 'package.json'];

console.log('[PrismaShimInstaller] Starting installation of Prisma client shim...');

for (const target of targets) {
  const parentDir = path.dirname(target);
  
  if (!fs.existsSync(parentDir)) {
    console.log(`[PrismaShimInstaller] Parent directory ${parentDir} does not exist. Skipping target.`);
    continue;
  }
  
  try {
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }
    
    for (const file of filesToCopy) {
      const srcPath = path.join(srcDir, file);
      const destPath = path.join(target, file);
      
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`[PrismaShimInstaller] Copied ${file} to ${target}`);
      } else {
        console.warn(`[PrismaShimInstaller] Source file not found: ${srcPath}`);
      }
    }
    console.log(`[PrismaShimInstaller] Successfully installed shim at ${target}`);
  } catch (error) {
    console.error(`[PrismaShimInstaller] Failed to install shim at ${target}:`, error);
  }
}
