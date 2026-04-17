import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const key = process.env.FIREBASE_PRIVATE_KEY;
console.log('KEY TYPE:', typeof key);
console.log('KEY LENGTH:', key?.length);
console.log('KEY START:', key?.substring(0, 50));
console.log('KEY END:', key?.substring(key.length - 30));
console.log('CONTAINS ESCAPED NEWLINE?', key?.includes('\\n'));
console.log('CONTAINS ACTUAL NEWLINE?', key?.includes('\n'));
