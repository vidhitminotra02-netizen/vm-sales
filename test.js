const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

async function run() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: [{ role: 'user', parts: [{ text: 'hello' }] }]
    });
    console.log(response.text);
  } catch (e) {
    console.error(e);
  }
}
run();
