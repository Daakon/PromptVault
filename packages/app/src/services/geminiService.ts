import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Uses Gemini to rewrite a rough idea into a structured, high-quality prompt.
 */
export const enhancePromptLogic = async (roughPrompt: string): Promise<string> => {
  if (!apiKey) {
    console.warn("API Key is missing");
    return roughPrompt; // Fallback if no key
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert Prompt Engineer. 
      
      Your task is to take the following rough user idea and rewrite it into a highly effective, structured AI prompt.
      Use techniques like persona adoption, clear constraints, step-by-step instructions, and output formatting.
      
      Rough Idea: "${roughPrompt}"
      
      Return ONLY the optimized prompt text. Do not add explanations or markdown headers like "Here is your prompt:".`,
      config: {
        temperature: 0.7,
      }
    });

    return response.text?.trim() || roughPrompt;
  } catch (error) {
    console.error("Failed to enhance prompt with Gemini:", error);
    throw error;
  }
};

/**
 * Suggests tags based on prompt content.
 */
export const suggestTagsLogic = async (content: string): Promise<string[]> => {
    if (!apiKey) return [];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the following text and suggest 3-5 short, relevant tags (keywords) for organization. 
            Return them as a comma-separated list only.
            
            Text: "${content}"`,
        });
        
        const text = response.text?.trim() || "";
        return text.split(',').map(s => s.trim()).filter(s => s.length > 0);
    } catch (error) {
        console.error("Failed to suggest tags:", error);
        return [];
    }
}
