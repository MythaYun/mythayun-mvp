const fs = require('fs');
const path = require('path');

// Ensure the icons directory exists
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log('Created icons directory');
}

// Create empty PNG files with the correct headers for PNG format
const createEmptyPng = (filePath, width, height) => {
  // PNG file header and IHDR chunk for an empty PNG
  const header = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // "IHDR"
    
    // Width (4 bytes)
    (width >> 24) & 0xff,
    (width >> 16) & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
    
    // Height (4 bytes)
    (height >> 24) & 0xff,
    (height >> 16) & 0xff,
    (height >> 8) & 0xff,
    height & 0xff,
    
    0x08, // Bit depth
    0x06, // Color type (RGBA)
    0x00, // Compression method
    0x00, // Filter method
    0x00, // Interlace method
    
    // CRC for IHDR chunk
    0x60, 0x86, 0x8B, 0x19,
    
    // Empty IDAT chunk with minimal data
    0x00, 0x00, 0x00, 0x01, // 1 byte of data
    0x49, 0x44, 0x41, 0x54, // "IDAT"
    0x08, // Data (a single zero byte compressed)
    0x1D, 0x01, 0x02, 0x00, // CRC for IDAT
    
    // IEND chunk
    0x00, 0x00, 0x00, 0x00, // Length (always 0)
    0x49, 0x45, 0x4E, 0x44, // "IEND"
    0xAE, 0x42, 0x60, 0x82  // CRC for IEND
  ]);
  
  fs.writeFileSync(filePath, header);
  console.log(`Created ${filePath}`);
};

// Create the required icons
createEmptyPng(path.join(iconsDir, 'icon-192x192.png'), 192, 192);
createEmptyPng(path.join(iconsDir, 'icon-512x512.png'), 512, 512);
createEmptyPng(path.join(iconsDir, 'apple-touch-icon.png'), 180, 180);

console.log('All icon files created successfully');