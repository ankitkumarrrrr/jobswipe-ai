import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

let _genAI: GoogleGenerativeAI | null = null;
let _model: GenerativeModel | null = null;

export function getGeminiModel(): GenerativeModel {
  if (!_model) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Please add it to .env.local");
    }
    _genAI = new GoogleGenerativeAI(apiKey);
    _model = _genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }
  return _model;
}

export async function generateJSON(
  systemPrompt: string,
  userPrompt: string
): Promise<any> {
  const model = getGeminiModel();
  const result = await model.generateContent({
    systemInstruction: systemPrompt,
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  });
  const text = result.response.text();
  return JSON.parse(text);
}

export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7
): Promise<string> {
  const model = getGeminiModel();
  const result = await model.generateContent({
    systemInstruction: systemPrompt,
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: { temperature },
  });
  return result.response.text();
}
