import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Create directory if it doesn't exist
const dirPath = join(process.cwd(), '.next');
if (!existsSync(dirPath)) {
  mkdirSync(dirPath, { recursive: true });
}

// Create empty routes-manifest.json if it doesn't exist
const manifestPath = join(dirPath, 'routes-manifest.json');
if (!existsSync(manifestPath)) {
  writeFileSync(manifestPath, JSON.stringify({
    version: 3,
    basePath: "",
    redirects: [],
    rewrites: [],
    headers: [],
    dynamicRoutes: []
  }));
  console.log('Created empty routes-manifest.json');
}