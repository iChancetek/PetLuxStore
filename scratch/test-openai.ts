import OpenAI from "openai";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env.local") });

async function testOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log("🔑 API Key present:", apiKey ? "Yes (starts with " + apiKey.substring(0, 7) + "...)" : "No");

  if (!apiKey) {
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey });

  try {
    console.log("🚀 Sending test request to OpenAI (gpt-4o-mini)...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello! Say 'OpenAI is working!'" }
      ],
      max_tokens: 20,
    });

    console.log("✅ Response from OpenAI:", response.choices[0].message.content);
  } catch (error: any) {
    console.error("❌ OpenAI Test Failed:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

testOpenAI();
