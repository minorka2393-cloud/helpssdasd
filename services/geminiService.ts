import { GoogleGenAI } from "@google/genai";
import { AssistanceMode, Language } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getSystemInstruction = (mode: AssistanceMode, language: Language): string => {
  const langPrompt = language === 'ru' 
    ? "Отвечай на русском языке." 
    : language === 'es' 
      ? "Responde en español." 
      : "Respond in English.";

  if (mode === AssistanceMode.HELP) {
    return `You are a helpful tutor. ${langPrompt} 
    Your goal is to help the user LEARN. 
    Never give the direct answer immediately. 
    Use the Socratic method: ask guiding questions, explain concepts, and lead the user to the solution.
    If the user sends an image, analyze it and explain what is shown, then guide them.
    Format math using LaTeX.`;
  } else {
    return `You are a homework solver. ${langPrompt}
    Your goal is to SOLVE the task efficiently.
    Provide the correct answer and a clear, step-by-step derivation.
    Do not ask questions unless the input is ambiguous.
    If the user sends an image, solve the problem shown in the image.
    Format math using LaTeX.`;
  }
};

export const generateResponse = async (
  prompt: string, 
  imageBase64: string | undefined,
  mode: AssistanceMode,
  history: any[],
  language: Language
): Promise<string> => {
  
  try {
    // We use gemini-3-flash-preview for all assistance tasks as it provides
    // solid reasoning and multimodal capabilities for this use case.
    const modelId = 'gemini-3-flash-preview';
    const systemInstruction = getSystemInstruction(mode, language);

    const contents = history; 

    const response = await ai.models.generateContent({
      model: modelId,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: mode === AssistanceMode.HELP ? 0.7 : 0.3, // Creative for teaching, precise for solving
      }
    });

    return response.text || (language === 'ru' ? "Не удалось получить ответ." : "No response generated.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Handle region restriction error
    if (error.message?.includes("User location") || error.toString().includes("User location")) {
      return language === 'ru' 
        ? "🚫 Ошибка доступа: Ваш регион не поддерживается. Google Gemini API заблокирован в некоторых странах. Пожалуйста, включите VPN (США, Европа) и попробуйте снова." 
        : "🚫 Access Error: Your location is not supported. Please enable a VPN (US/Europe) and try again.";
    }

    return language === 'ru' 
      ? "Произошла ошибка при обращении к ИИ. Проверьте соединение или VPN." 
      : "Sorry, I encountered an error connecting to the AI. Check your connection or VPN.";
  }
};