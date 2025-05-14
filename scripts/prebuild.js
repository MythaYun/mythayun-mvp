const fs = require('fs');
const path = require('path');

// Create directory if it doesn't exist
const dirPath = path.join(process.cwd(), '.next');
if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}

// Create empty routes-manifest.json if it doesn't exist
const manifestPath = path.join(dirPath, 'routes-manifest.json');
if (!fs.existsSync(manifestPath)) {
  fs.writeFileSync(manifestPath, JSON.stringify({
    version: 3,
    basePath: "",
    redirects: [],
    rewrites: [],
    headers: [],
    dynamicRoutes: []
  }));
  console.log('Created empty routes-manifest.json');
}