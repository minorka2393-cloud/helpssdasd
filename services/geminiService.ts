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

    // Filter out the last message from history as we will add it to the current call contents
    // or just use history for context if chat object is preferred.
    // However, specifically for the SDK rules, let's use generateContent with the full context + instruction
    
    // Construct the contents array based on history + current new prompt
    // Note: The history passed from component already includes the latest user message
    // We just need to ensure the system instruction is passed in config.
    
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
  } catch (error) {
    console.error("Gemini API Error:", error);
    return language === 'ru' 
      ? "Произошла ошибка при обращении к ИИ." 
      : "Sorry, I encountered an error connecting to the AI.";
  }
};