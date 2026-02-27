import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Helper to call Gemini with exponential backoff for 429 errors
 */
async function callGemini(fn: () => Promise<any>, retries = 3, delay = 2000): Promise<any> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error?.message?.includes("429") || error?.status === 429 || error?.code === 429;
    if (isRateLimit && retries > 0) {
      console.log(`Rate limit hit, retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callGemini(fn, retries - 1, delay * 2);
    }
    
    if (isRateLimit) {
      throw new Error("The AI service is currently very busy. Please wait a minute and try again.");
    }
    throw error;
  }
}

export async function generateStudyPlan(subject: string, difficulty: string, stream: string, language: string = "English") {
  const response = await callGemini(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a weekly study plan for a first-generation student studying ${subject} at a ${difficulty} difficulty level in the ${stream} stream. 
    The plan should be encouraging and use simple language.
    Language: ${language}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          monday: { type: Type.STRING },
          tuesday: { type: Type.STRING },
          wednesday: { type: Type.STRING },
          thursday: { type: Type.STRING },
          friday: { type: Type.STRING },
          saturday: { type: Type.STRING },
          sunday: { type: Type.STRING },
          notes: { type: Type.ARRAY, items: { type: Type.STRING } },
          questions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "notes", "questions"]
      },
    },
  }));

  return JSON.parse(response.text || "{}");
}

export async function solveDoubt(question: string, context: string = "", language: string = "English") {
  const response = await callGemini(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a friendly mentor for first-generation students. 
    Explain the following concept or answer the question in very simple, relatable language with real-life examples.
    Language: ${language}
    
    Context: ${context}
    Question: ${question}`,
  }));

  return response.text;
}

export async function generateCareerRoadmap(stream: string, goal: string, language: string = "English") {
  const response = await callGemini(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a detailed career roadmap for a first-generation student in the ${stream} stream who wants to become a ${goal}. 
    The roadmap should be broken down into clear, actionable steps. Use simple language.
    Language: ${language}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                duration: { type: Type.STRING },
                skills: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["title", "description", "duration", "skills"]
            }
          },
          resources: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["steps", "resources"]
      },
    },
  }));

  return JSON.parse(response.text || "{}");
}

export async function getMotivationalQuote() {
  const response = await callGemini(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Give a short, powerful motivational quote specifically for a first-generation student who might be feeling overwhelmed but is working hard for their dreams.",
  }));
  return response.text;
}
