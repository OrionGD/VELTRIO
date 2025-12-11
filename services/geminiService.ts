
import { GoogleGenAI, Type } from "@google/genai";
import { SentimentResult } from '../types';

// Use a singleton pattern to initialize the AI client only when needed.
// This avoids a top-level crash if the API key isn't available on load.
let ai: GoogleGenAI | null = null;

const getAiClient = () => {
  if (ai) {
    return ai;
  }

  // Safely access the API key to avoid "process is not defined" errors in the browser.
  const API_KEY = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;

  if (!API_KEY) {
    // This error will be caught by the calling function's try-catch block,
    // allowing the UI to display a helpful message instead of crashing.
    throw new Error("API_KEY environment variable not set");
  }
  ai = new GoogleGenAI({ apiKey: API_KEY });
  return ai;
};


export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  if (!text.trim()) {
    return "";
  }
  try {
    const aiClient = getAiClient();
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Translate the following text to ${targetLanguage}. Provide only the translated text, without any additional commentary or explanation. Text to translate: "${text}"`,
    });
    return response.text;
  } catch (error) {
    console.error("Error translating text:", error);
    throw error;
  }
};

export const analyzeSentiment = async (text: string): Promise<SentimentResult> => {
  if (!text.trim()) {
    return { sentiment: "Neutral" as any, explanation: "No text provided." };
  }
  try {
     const aiClient = getAiClient();
     const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the sentiment of the following text. Text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: {
              type: Type.STRING,
              description: 'The sentiment of the text. Must be one of "Positive", "Negative", or "Neutral".',
            },
            explanation: {
              type: Type.STRING,
              description: 'A brief explanation for the sentiment classification.',
            },
          },
          required: ["sentiment", "explanation"],
        },
      },
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);

    // Basic validation to ensure the response shape is correct.
    if (result && result.sentiment && result.explanation) {
      return result as SentimentResult;
    } else {
      throw new Error("Invalid response format from sentiment analysis API.");
    }
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    throw error;
  }
};
