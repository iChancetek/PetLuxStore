import fs from 'fs';

const filePath = './privatekey.json';
const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const key = json.private_key;

const header = '-----BEGIN PRIVATE KEY-----';
const footer = '-----END PRIVATE KEY-----';

// Remove the headers/footers and any escaped newlines/real newlines/spaces
const body = key.replace(header, '').replace(footer, '').replace(/[\r\n\s]+/g, '');

console.log('BODY LENGTH:', body.length);

try {
  const buf = Buffer.from(body, 'base64');
  console.log('BUFFER SIZE:', buf.length);
  // ASN.1 check: first byte should be 0x30
  if (buf.length > 0) {
    console.log('FIRST BYTE (HEX):', buf[0].toString(16));
    if (buf[0] === 0x30) {
      console.log('✅ Found valid ASN.1 sequence start (0x30).');
    } else {
      console.log('❌ Invalid ASN.1 start. Expected 0x30, found 0x' + buf[0].toString(16));
    }
  } else {
    console.log('❌ Buffer is empty!');
  }
} catch (e: any) {
  console.log('❌ Base64 decode failed:', e.message);
}
