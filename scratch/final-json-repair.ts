import fs from 'fs';

const filePath = './server/config/firebase-admin-sdk.json';
const json = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/[\r\n]/g, ''));

// Now that we've parsed it (ignoring physical line breaks)
// We write it back as a clean, single-line-per-field JSON
fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
console.log('✅ Final formatting fix applied to firebase-admin-sdk.json (single-line string literals).');
