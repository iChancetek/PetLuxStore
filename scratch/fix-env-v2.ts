import fs from 'fs';

const envPath = '.env.local';
let content = fs.readFileSync(envPath, 'utf8');

const lines = content.split(/\r?\n/);
const newLines = [];
let fixed = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('OPENAI_API_KEY=') && !lines[i].includes('h9qm')) {
    if (i + 1 < lines.length && lines[i+1].includes('h9qm')) {
      // Merge exactly, no spaces
      newLines.push(lines[i].trim() + lines[i+1].trim());
      i++; 
      fixed = true;
    } else {
      newLines.push(lines[i]);
    }
  } else {
    newLines.push(lines[i]);
  }
}

if (fixed) {
  fs.writeFileSync(envPath, newLines.join('\n'));
  console.log("✅ Fixed broken OpenAI API key (v2)");
} else {
  console.log("ℹ️ Nothing to fix or already fixed?");
}
