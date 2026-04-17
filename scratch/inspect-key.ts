import fs from 'fs';

const filePath = './server/config/firebase-admin-sdk.json';
const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const key = json.private_key;

console.log('KEY LENGTH:', key.length);
console.log('--- FIRST 100 CHARS (HEX) ---');
let hex = '';
let charStr = '';
for (let i = 0; i < 100 && i < key.length; i++) {
  const code = key.charCodeAt(i);
  hex += code.toString(16).padStart(2, '0') + ' ';
  charStr += (code >= 32 && code <= 126) ? key[i] : '.';
}
console.log(hex);
console.log(charStr);

console.log('--- SEARCHING FOR WIERD CHARS ---');
for (let i = 0; i < key.length; i++) {
  const code = key.charCodeAt(i);
  if (code > 126 && code !== 10 && code !== 13) {
    console.log(`Found weird char at index ${i}: code ${code} (${key[i]})`);
  }
}
