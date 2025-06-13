const fs = require('fs');
const https = require('https');
const path = require('path');

const SCREENSHOTS_DIR = path.join(process.cwd(), 'public', 'screenshots');

// Make sure directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  console.log(`Created directory: ${SCREENSHOTS_DIR}`);
}

// Create sample screenshots
const screenshots = [
  {
    filename: 'desktop.png',
    url: 'https://placehold.co/1280x800/4f46e5/ffffff.png?text=Mythayun+Desktop'
  },
  {
    filename: 'mobile.png',
    url: 'https://placehold.co/750x1334/4f46e5/ffffff.png?text=Mythayun+Mobile'
  }
];

// Download each screenshot
screenshots.forEach(screenshot => {
  const filePath = path.join(SCREENSHOTS_DIR, screenshot.filename);
  const file = fs.createWriteStream(filePath);
  
  https.get(screenshot.url, response => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${screenshot.filename}`);
    });
  }).on('error', err => {
    fs.unlink(filePath);
    console.error(`Error downloading ${screenshot.filename}: ${err.message}`);
  });
});