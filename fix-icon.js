const fs = require('fs');
const https = require('https');
const path = require('path');

const ICONS_DIR = path.join(process.cwd(), 'public', 'icons');

// Only regenerate the problematic icons
const ICONS = [
  {
    filename: 'icon-512x512.png',
    url: 'https://via.placeholder.com/512x512/4f46e5/ffffff.png?text=M'
  },
  {
    filename: 'apple-touch-icon.png',
    url: 'https://via.placeholder.com/180x180/4f46e5/ffffff.png?text=M'
  }
];

console.log(`Starting icon regeneration at ${new Date().toISOString()}`);
console.log(`Icon directory: ${ICONS_DIR}`);

// Download each icon
ICONS.forEach(icon => {
  const filePath = path.join(ICONS_DIR, icon.filename);
  console.log(`Processing: ${icon.filename}`);
  
  // Remove existing file if it exists
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Removed existing file: ${icon.filename}`);
  }
  
  const file = fs.createWriteStream(filePath);
  
  https.get(icon.url, response => {
    console.log(`Download started for ${icon.filename}: Status ${response.statusCode}`);
    
    response.pipe(file);
    
    file.on('finish', () => {
      file.close();
      console.log(`Successfully downloaded ${icon.filename}`);
      
      // Verify file was created
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`File size: ${stats.size} bytes`);
      } else {
        console.log(`Warning: File not found after download: ${filePath}`);
      }
    });
  }).on('error', err => {
    fs.unlink(filePath, () => {});
    console.error(`Error downloading ${icon.filename}: ${err.message}`);
  });
});