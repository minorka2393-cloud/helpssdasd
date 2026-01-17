import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AssistanceMode, Language } from '../types';

const getSystemInstruction = (mode: AssistanceMode, language: Language): string => {
  const langInstruction = language === 'ru' 
    ? 'ALWAYS respond in Russian.' 
    : language === 'es' 
    ? 'ALWAYS respond in Spanish.' 
    : 'ALWAYS respond in English.';

  if (mode === AssistanceMode.SOLVE) {
    return `You are "Helper-Kust", an efficient task solver. 
    Your goal is to provide the correct answer and solution to the user's problem immediately.
    ${langInstruction}
    1. Provide the final answer clearly at the start if possible.
    2. Show a step-by-step derivation or reasoning for the solution.
    3. Be concise and precise. Format output with clear Markdown.
    `;
  } else {
    return `You are "Helper-Kust", a patient and helpful tutor.
    Your goal is to help the user LEARN how to solve the problem, NOT to give the answer immediately.
    ${langInstruction}
    1. Ask guiding questions to gauge understanding.
    2. Break the problem down into smaller, manageable steps.
    3. Encourage the user to think.
    4. Only reveal the final answer if the user has successfully worked through the logic or explicitly gives up.
    5. Be encouraging and supportive. Format output with clear Markdown.`;
  }
};

interface HistoryItem {
  role: 'user' | 'model';
  parts: (
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }
  )[];
}

export const generateResponse = async (
  currentPrompt: string,
  currentImageBase64: string | undefined,
  mode: AssistanceMode,
  history: HistoryItem[],
  language: Language
): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key is missing");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Using gemini-3-flash-preview for fast, reasoning-capable responses
    const modelId = 'gemini-3-flash-preview'; 

    const contents: any[] = [...history];

    const currentParts: any[] = [];
    
    if (currentImageBase64) {
      currentParts.push({
        inlineData: {
          mimeType: 'image/jpeg', 
          data: currentImageBase64
        }
      });
    }
    
    if (currentPrompt) {
      currentParts.push({ text: currentPrompt });
    }

    // If there's only an image and no text, we still need a part. 
    // Usually logic in UI prevents empty prompt+empty image, but good to be safe.
    if (currentParts.length > 0) {
        contents.push({
            role: 'user',
            parts: currentParts
        });
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: contents,
      config: {
        systemInstruction: getSystemInstruction(mode, language),
        temperature: mode === AssistanceMode.SOLVE ? 0.2 : 0.7,
      }
    });

    return response.text || (language === 'ru' ? "Не удалось сгенерировать ответ." : "I couldn't generate a response.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return `Error: ${error.message || "Something went wrong."}`;
  }
};
