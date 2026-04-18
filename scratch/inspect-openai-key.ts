import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const key = process.env.OPENAI_API_KEY || '';
console.log("Key length:", key.length);
console.log("Key starts with:", key.substring(0, 10));
console.log("Key ends with:", key.substring(key.length - 10));

// Check for hidden characters
for (let i = 0; i < key.length; i++) {
  const code = key.charCodeAt(i);
  if (code < 33 || code > 126) {
    console.log(`Hidden character at index ${i}: code ${code}`);
  }
}
