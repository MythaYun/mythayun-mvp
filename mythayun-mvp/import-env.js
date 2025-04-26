const fs = require('fs');
const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Load .env file
const envFile = process.argv[2] || '.env.development';
const environment = process.argv[3] || 'development';
console.log(`Importing from ${envFile} to ${environment} environment...`);

const envConfig = dotenv.parse(fs.readFileSync(envFile));

// Add each variable to Vercel
for (const key in envConfig) {
  const value = envConfig[key];
  console.log(`Adding ${key}...`);
  
  // Create a temporary file for the value to avoid command line escaping issues
  fs.writeFileSync('.env-value-temp', value);
  
  // Execute the Vercel env add command
  try {
    execSync(`vercel env add ${key} ${environment} < .env-value-temp`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error adding ${key}: ${error.message}`);
  }
}

// Clean up
fs.unlinkSync('.env-value-temp');
console.log('Import complete!');
