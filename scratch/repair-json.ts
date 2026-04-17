import fs from 'fs';

const filePath = './server/config/firebase-admin-sdk.json';
const rawContent = fs.readFileSync(filePath, 'utf8');

// Repair strategy:
// 1. Remove any actual hard line breaks (r/n) that are splitting the string literal
// 2. But keep the JSON structure intact.
// Actually, it's easier to just reconstruct the key string.

const json = JSON.parse(rawContent.replace(/\\r?\\n/g, '')); 
// Wait, if I replace all newlines with nothing, the \\n escapes will remain as \n.

// Let's try a safer regex for the private key field specifically
const repairedContent = rawContent.replace(/("private_key":\s*")([^"]+)(")/s, (match, p1, p2, p3) => {
  // p2 is the key content. Remove all real newlines from it.
  const cleanedKey = p2.replace(/[\r\n]+/g, '');
  return `${p1}${cleanedKey}${p3}`;
});

fs.writeFileSync(filePath, repairedContent);
console.log('✅ Repaired firebase-admin-sdk.json by removing internal line breaks from private_key.');
