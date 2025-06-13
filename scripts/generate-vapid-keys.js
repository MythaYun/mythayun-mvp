// Run this script with Node.js to generate VAPID keys
// node scripts/generate-vapid-keys.js

const webpush = require('web-push');

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('VAPID Keys generated on', new Date().toISOString());
console.log('\nPublic Key:');
console.log(vapidKeys.publicKey);
console.log('\nPrivate Key:');
console.log(vapidKeys.privateKey);
console.log('\nStore these securely and use them for push notifications.');